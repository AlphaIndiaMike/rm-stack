/**
 * ui_editor.js
 *
 * Center pane. Frame only.
 *
 * The editor doesn't know about chapters, declarations, or chapter-specific
 * widgets. It asks the registries.
 *
 *   - Chapters.get(discipline, chapterId)        → chapter spec
 *   - Declarations.get(kind)                     → declaration config
 *   - DeclarationTable.render(doc, kind, fn)     → one declaration table
 *   - ChecklistView.render(doc, chapter, fn)     → checklist + signoff
 *   - Datalists.render(doc)                      → autocomplete sources
 *   - WelcomePanel.render(container, doc)        → onboarding panel
 *
 * Chapter-specific tooling (mode simulator, allocation matrix, HSI
 * diagnostic, traceability, ...) lives on the chapter spec as
 * `extraWidgets: (doc, onChange) => [widget1, widget2]`. Each widget is
 * a small object with `render(container)` and optional `setDocument(doc)`.
 *
 * The requirement builder + list and their helper methods stay in this
 * file — they share too much state (the in-flight draft, edit-vs-new
 * flag, the same-tick refresh choreography) to be worth extracting in
 * the same round as the rest of the refactor. They can come out later
 * once the click-twice / focus regressions are unlikely to recur.
 */

class EditorView {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange;
        this.currentChapter = null;
        this.currentElement = null;
        this.draftReq = null;
        this.editingExisting = false;

        // Chapter-specific widget instances. Cached so simulator state
        // (current mode, last message) survives unrelated re-renders.
        // Keyed by chapter id; reset on chapter switch in load().
        this._widgets = null;
        this._widgetsForChapter = null;

        // Outside-click commit for in-flight text inputs. The browser
        // fires `change` automatically on blur, our DeclarationTable
        // handler picks that up and runs commitFromRow + onChange. Single
        // listener for the EditorView's lifetime — capture phase so we
        // see the click before any other handler short-circuits it.
        document.addEventListener('mousedown', e => {
            const active = document.activeElement;
            if (!active) return;
            if (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA') return;
            if (active === e.target || active.contains(e.target)) return;
            active.blur();
        }, true);
    }

    setDocument(doc) {
        this.doc = doc;
        // Discipline may have changed too; force widget cache reset.
        this._widgets = null;
        this._widgetsForChapter = null;
    }

    load(chapterId, elementId) {
        this.currentChapter = Chapters.get(this.doc.discipline, chapterId);
        this.currentElement = elementId
            ? this.doc.elements.find(e => e.id === elementId) : null;
        this.editingExisting = false;
        this.draftReq = this._newDraft();

        // Drop cached widgets if we crossed a chapter boundary so a new
        // chapter starts with fresh state. Same-chapter re-renders keep
        // their cached widgets so simulators don't snap back.
        if (this._widgetsForChapter !== chapterId) {
            this._widgets = null;
            this._widgetsForChapter = chapterId;
        }
    }

    _newDraft() {
        if (!this.currentChapter) return null;
        const draft = new Requirement({
            chapterId: this.currentChapter.id,
            elementId: this.currentElement ? this.currentElement.id : null
        });
        draft.id = '(draft)';
        if (this.currentChapter.subjectMode === 'system') draft.subject = 'the system';
        else if (this.currentElement) draft.subject = this.currentElement.name;
        return draft;
    }

    render(container, chapterTitleEl, chapterBadgeEl) {
        container.innerHTML = '';

        if (!this.currentChapter) {
            WelcomePanel.render(container, this.doc);
            chapterTitleEl.textContent = 'Welcome';
            chapterBadgeEl.textContent = '—';
            chapterBadgeEl.className = 'badge bg-secondary';
            return;
        }

        const chapter = this.currentChapter;

        // Title
        const titleText = this.currentElement
            ? `Element — ${this.currentElement.name || '(unnamed)'}`
            : `${chapter.number}. ${chapter.title}`;
        chapterTitleEl.textContent = titleText;

        // Completeness badge
        const validator = new DocumentValidator(this.doc);
        const pct = validator.chapterCompleteness(chapter);
        chapterBadgeEl.textContent = `${pct}% checklist`;
        chapterBadgeEl.className = 'badge ' +
            (pct === 100 ? 'bg-success' : pct >= 50 ? 'bg-warning text-dark' : 'bg-danger');
        chapterBadgeEl.title = `${pct}% of this chapter's completeness checklist is ticked.`;

        // Datalists for autocomplete (owners, producers, consumers, triggers)
        container.appendChild(Datalists.render(this.doc));

        // Intro
        const intro = document.createElement('div');
        intro.className = 'chapter-intro';
        intro.textContent = chapter.intro || '';
        container.appendChild(intro);

        // Element-leaf intro
        if (this.currentElement) {
            const elIntro = document.createElement('div');
            elIntro.className = 'chapter-intro';
            elIntro.style.background = '#f4f0ff';
            elIntro.style.borderLeftColor = '#6f42c1';
            elIntro.innerHTML = `
                <strong>Element:</strong> ${this.currentElement.name} &nbsp;
                <strong>ASIL:</strong> ${this.currentElement.asil} &nbsp;
                <strong>Purpose:</strong> ${this.currentElement.purpose || '—'}<br>
                <small>Subject of all shall-statements below is fixed to <code>${this.currentElement.name}</code>. Requirement budget: 4–13.</small>
            `;
            container.appendChild(elIntro);
        }

        // Declaration tables — generic, driven by chapter.declarations
        if (chapter.declarations) {
            chapter.declarations.forEach(kind => {
                container.appendChild(
                    DeclarationTable.render(this.doc, kind, () => this.onChange()));
            });
        }

        // Chapter-specific widgets (extraWidgets factory). We cache the
        // returned instances per chapter so widgets that hold UI state
        // (mode simulator's current mode, generator's status line) survive
        // an onChange-triggered re-render. setDocument is called on each
        // render to refresh the widget's view of the data.
        if (typeof chapter.extraWidgets === 'function') {
            if (!this._widgets) {
                this._widgets = chapter.extraWidgets(this.doc, this.onChange);
            } else {
                this._widgets.forEach(w => w.setDocument && w.setDocument(this.doc));
            }
            this._widgets.forEach(w => w.render(container));
        }

        // Checklist + signoff
        container.appendChild(ChecklistView.render(this.doc, chapter, () => this.onChange()));

        // Requirement builder + list (only when authoring is allowed here
        // or we're on an element leaf inside an autoExpand chapter)
        if (chapter.allowsRequirements || this.currentElement) {
            container.appendChild(this._renderRequirementBuilder());
            container.appendChild(this._renderRequirementsList());
        }
    }


    // =========================================================================
    // Requirement builder. Stays inline because the draft / edit-mode /
    // refresh choreography is tightly coupled to `this`.
    // =========================================================================

    _renderRequirementBuilder() {
        const wrap = document.createElement('div');
        wrap.className = 'req-builder';
        wrap.innerHTML = `<h6>${this.editingExisting ? `Editing ${this.draftReq.id}` : 'New Requirement'}</h6>`;

        // Row 1 — State guard (optional) + Conditional + Subject + Predicate.
        //
        // EARS' combined pattern is "While [state], when [event], the
        // [subject] shall [response]". The state-guard slot is the
        // optional "While [state]" half; the conditional dropdown +
        // free-text below is the "when [event]" half. Either, both, or
        // neither may be filled — neither = ubiquitous.
        const row1 = document.createElement('div');
        row1.className = 'req-slot-row';

        // State guard — always shown, always optional. Free text so
        // phrases like "any state other than X" work without forcing
        // a structured mode reference.
        const stateGuardSlot = this._makeInputSlot(
            'State guard (optional)',
            this.draftReq.stateGuard,
            v => { this.draftReq.stateGuard = v; this._refreshPreview(wrap); },
            'e.g. "the system is initialized", "any state other than Off"'
        );
        stateGuardSlot.style.flex = '1';
        stateGuardSlot.style.minWidth = '180px';
        row1.appendChild(stateGuardSlot);

        row1.appendChild(this._makeSelectSlot('Conditional',
            GRAMMAR.conditionals.map(c => ({ value: c.id, label: c.label })),
            this.draftReq.conditional,
            v => { this.draftReq.conditional = v; this._refreshBuilder(wrap); }
        ));

        if (this.draftReq.conditional !== 'ubiquitous') {
            // When a state guard is also filled, the EARS combined
            // pattern renders the trigger as "when [...]" regardless
            // of the dropdown choice — re-label the slot so the user
            // sees that.
            const combined = !!(this.draftReq.stateGuard || '').trim();
            const triggerLabel = combined ? 'Trigger / event (rendered as "when")' : 'Condition text';
            const condText = this._makeInputSlot(triggerLabel,
                this.draftReq.conditionalText,
                v => { this.draftReq.conditionalText = v; this._refreshPreview(wrap); }
            );
            condText.style.flex = '1';
            row1.appendChild(condText);
        }

        const subjects = this.doc.declaredSubjectsForChapter(this.currentChapter);
        if (this.currentElement) {
            row1.appendChild(this._makeStaticSlot('Subject', this.currentElement.name));
        } else if (this.currentChapter.subjectMode === 'system') {
            row1.appendChild(this._makeStaticSlot('Subject', 'the system'));
        } else {
            const subjSlot = this._makeSelectSlot('Subject',
                subjects.map(s => ({ value: s, label: s })),
                this.draftReq.subject,
                v => { this.draftReq.subject = v; this._refreshPreview(wrap); }
            );
            if (subjects.length === 0) {
                subjSlot.querySelector('select').disabled = true;
                subjSlot.insertAdjacentHTML('beforeend',
                    '<small class="text-danger">No elements declared yet.</small>');
            }
            row1.appendChild(subjSlot);
        }

        const shallSpan = document.createElement('div');
        shallSpan.style.cssText = 'font-weight:600;padding:0 0.3rem;align-self:flex-end;margin-bottom:6px;';
        shallSpan.textContent = 'SHALL';
        row1.appendChild(shallSpan);

        row1.appendChild(this._makeSelectSlot('Predicate',
            GRAMMAR.predicates.map(p => ({ value: p.id, label: p.label })),
            this.draftReq.predicate,
            v => { this.draftReq.predicate = v; this._refreshBuilder(wrap); }
        ));

        wrap.appendChild(row1);

        // Row 2 — Predicate-specific fields with autocomplete from lexicon
        if (this.draftReq.predicate) {
            const pred = GRAMMAR.predicates.find(p => p.id === this.draftReq.predicate);
            if (pred) {
                const row2 = document.createElement('div');
                row2.className = 'req-slot-row';
                pred.fields.forEach(f => {
                    const lexCat = ({
                        capability:'capabilities', actor:'actors',
                        condition:'conditions',  reaction:'reactions',
                        trigger:'triggers',      input:'inputs',
                        output:'outputs',        property:'properties',
                        unit:'units',            tolerance:'tolerances',
                        standard:'standards',    fromState:'fromStates',
                        toState:'toStates',      prohibitedBehavior:'prohibitedBehaviors',
                        boundingCondition:'boundingConditions',
                        signalName:'signalNames', pin:'pins',
                        signalProperties:'signalProperties'
                    })[f.id];
                    const slot = this._makeInputSlot(
                        f.label + (f.required ? ' *' : ''),
                        this.draftReq[f.id] || '',
                        v => { this.draftReq[f.id] = v; this._refreshPreview(wrap); },
                        f.hint, lexCat
                    );
                    slot.style.flex = '1';
                    slot.style.minWidth = '150px';
                    row2.appendChild(slot);
                });
                wrap.appendChild(row2);
            }
        }

        // Preview + validation messages
        const preview = document.createElement('div');
        preview.className = 'req-preview';
        preview.id = 'reqPreview';
        wrap.appendChild(preview);

        const valMsg = document.createElement('div');
        valMsg.className = 'validation-messages';
        valMsg.id = 'reqValMsg';
        wrap.appendChild(valMsg);

        // Per-chapter attribute panel
        wrap.appendChild(this._renderAttributesPanel(wrap));

        // SMART attestations
        wrap.appendChild(this._renderSmartAttestations(wrap));

        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'margin-top:0.75rem;display:flex;gap:0.5rem;';

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary btn-sm';
        addBtn.id = 'addReqBtn';
        addBtn.textContent = this.editingExisting ? 'Save Changes' : '+ Add Requirement';
        addBtn.addEventListener('click', () => this._commitRequirement());
        actions.appendChild(addBtn);

        if (this.editingExisting) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-outline-secondary btn-sm';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => this._cancelEdit());
            actions.appendChild(cancelBtn);
        }
        wrap.appendChild(actions);

        setTimeout(() => this._refreshPreview(wrap), 0);
        return wrap;
    }

    _refreshBuilder(wrap) {
        const parent = wrap.parentNode;
        const newBuilder = this._renderRequirementBuilder();
        parent.replaceChild(newBuilder, wrap);
    }

    _refreshPreview(wrap) {
        const previewEl = wrap.querySelector('#reqPreview');
        const valMsgEl  = wrap.querySelector('#reqValMsg');
        const addBtnEl  = wrap.querySelector('#addReqBtn');
        if (!previewEl) return;

        const statement = GrammarValidator.buildStatement(this.draftReq);
        previewEl.textContent = statement || '(choose predicate and fill fields)';

        const ctx = { declaredSubjects: this.doc.declaredSubjectsForChapter(this.currentChapter) };
        const { errors, warnings } = GrammarValidator.validate(this.draftReq, ctx);

        let html = '';
        errors.forEach(e => { html += `<div class="validation-error">✗ ${e}</div>`; });
        warnings.forEach(w => { html += `<div class="validation-warn">⚠ ${w}</div>`; });
        if (errors.length === 0 && warnings.length === 0) {
            html = `<div class="validation-ok">✓ Requirement is well-formed.</div>`;
        }
        valMsgEl.innerHTML = html;

        if (errors.length === 0) {
            previewEl.classList.remove('invalid'); previewEl.classList.add('valid');
            if (addBtnEl) addBtnEl.disabled = false;
        } else {
            previewEl.classList.remove('valid'); previewEl.classList.add('invalid');
            if (addBtnEl) addBtnEl.disabled = true;
        }
    }

    /** Per-chapter requirement-attribute panel.
     *  Switches on chapterId so each chapter shows the fields its
     *  reviewers actually need (FSC: parent SG + FTTI + warning;
     *  acceptance: parent FSR multi-select + pass criterion;
     *  element: parent acceptance + mode applicability; HW/SW: minimal
     *  with parent FSR; default: generic with parent FSR/itemFunction). */
    _renderAttributesPanel(wrap) {
        const panel = document.createElement('div');
        panel.className = 'req-attributes';
        const ch = this.currentChapter ? this.currentChapter.id : '';
        const disc = this.doc.discipline;

        panel.appendChild(this._makeInputSlot('Rationale *', this.draftReq.rationale,
            v => { this.draftReq.rationale = v; this._refreshPreview(wrap); }, 'Why this requirement exists'));

        // External RM ID (Polarion / PTC / DOORS). Optional, generic to
        // every chapter and discipline. Carry-and-print only — no sync.
        panel.appendChild(this._makeInputSlot('External ID (optional)', this.draftReq.externalId,
            v => { this.draftReq.externalId = v; this._refreshPreview(wrap); },
            'ID in Polarion / PTC / DOORS — printed in export, not synced'));

        const asilOpts = [{value:'',label:'— select —'},
                          ...GRAMMAR.asilLevels.map(a => ({value: a, label: a}))];
        const verifOpts = [{value:'',label:'— select —'},
                           ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))];

        if (ch === 'ch04_fsc') {
            panel.appendChild(this._makeSelectSlot('Parent Safety Goal *', this._sgOptions(),
                this.draftReq.parentSG,
                v => { this.draftReq.parentSG = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('FTTI contribution', this.draftReq.fttiContribution,
                v => { this.draftReq.fttiContribution = v; this._refreshPreview(wrap); },
                'Time budget consumed by this FSR (e.g. 80 ms of 1 s SG FTTI)'));
            panel.appendChild(this._makeSelectSlot('Safe state ref', this._safeStateOptions(),
                this.draftReq.safeStateRef,
                v => { this.draftReq.safeStateRef = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Warning strategy', this.draftReq.warningStrategy,
                v => { this.draftReq.warningStrategy = v; this._refreshPreview(wrap); },
                'Driver/operator warning before degradation'));
            panel.appendChild(this._makeInputSlot('Degradation strategy', this.draftReq.degradationStrategy,
                v => { this.draftReq.degradationStrategy = v; this._refreshPreview(wrap); },
                'How the system degrades on fault'));
            panel.appendChild(this._makeInputSlot('End-user supervision assumption',
                this.draftReq.supervisionAssumption,
                v => { this.draftReq.supervisionAssumption = v; this._refreshPreview(wrap); },
                'What the end-user is assumed to detect or do'));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
        }
        else if (ch === 'ch05_acceptance') {
            this._mountMultiSelectAttr(panel, 'Parent FSR(s)', 'parentFsrs',
                this.doc.requirementsForChapter('ch04_fsc').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No FSRs declared yet — author them in Chapter 3.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet — author them in Chapter 1.');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion *', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); },
                'Quantitative acceptance threshold'));
            this._mountMultiSelectAttr(panel, 'Mode applicability', 'modeApplicability',
                this.doc.modes.map(m => ({ value: m.id, label: m.name || m.id })),
                'No modes declared yet.');
        }
        else if (ch === 'ch07_elements') {
            this._mountMultiSelectAttr(panel, 'Parent acceptance req(s)', 'parentAcceptanceReqs',
                this.doc.requirementsForChapter('ch05_acceptance').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No acceptance requirements yet.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet.');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
            this._mountMultiSelectAttr(panel, 'Mode applicability', 'modeApplicability',
                this.doc.modes.map(m => ({ value: m.id, label: m.name || m.id })),
                'No modes declared yet.');
            panel.appendChild(this._makeSelectSlot('Safe state ref', this._safeStateOptions(),
                this.draftReq.safeStateRef,
                v => { this.draftReq.safeStateRef = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('HW/SW allocation', [
                    { value: '',     label: '— not set —' },
                    { value: 'hw',   label: 'HW' },
                    { value: 'sw',   label: 'SW' },
                    { value: 'both', label: 'Both HW & SW' }
                ], this.draftReq.hwSwAllocation,
                v => { this.draftReq.hwSwAllocation = v; this._refreshPreview(wrap); }));
        }
        else if (ch === 'ch10_hw' || ch === 'ch11_sw') {
            // HW-SR / SW-SR derive from the System Technical Safety
            // Requirements (ch07), not directly from FSRs — ISO 26262-5:6
            // / -6:6. Safety chapters also collect a DC target + safe
            // state for the diagnostic path.
            this._mountMultiSelectAttr(panel, 'Parent System TSR(s) *', 'parentSystemReqs',
                this.doc.requirementsForChapter('ch07_elements').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No System TSRs yet — author them in the System discipline (Chapter 6).');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Diagnostic Coverage (DC) target', this.draftReq.dcTarget,
                v => { this.draftReq.dcTarget = v; this._refreshPreview(wrap); },
                'e.g. 90%, 99% — per ISO 26262-5:8 / -6:6'));
            panel.appendChild(this._makeSelectSlot('Safe state ref', this._safeStateOptions(),
                this.draftReq.safeStateRef,
                v => { this.draftReq.safeStateRef = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
        }
        else if (ch === 'sw_functional' || ch === 'sw_interface' || ch === 'sw_resource'
              || ch === 'hw_functional' || ch === 'hw_interface' || ch === 'hw_resource'
              || (ch === 'ch13_calibration' && disc === 'software')
              || (ch === 'ch09_hsi' && (disc === 'software' || disc === 'hardware'))) {
            // SW/HW non-safety requirement chapters: the spine is the
            // parent System TSR. Allocation is derived from this
            // reference (A2) — no allocation matrix.
            this._mountMultiSelectAttr(panel, 'Parent System TSR(s) *', 'parentSystemReqs',
                this.doc.requirementsForChapter('ch07_elements').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No System TSRs yet — author them in the System discipline (Chapter 6).');
            panel.appendChild(this._makeSelectSlot('ASIL', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
        }
        else {
            // Default — covers HSI, calibration, env, cyber, HMI, lifecycle, and
            // the four-discipline-specific chapters that haven't grown a custom schema yet.
            this._mountMultiSelectAttr(panel, 'Parent FSR(s)', 'parentFsrs',
                this.doc.requirementsForChapter('ch04_fsc').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No FSRs declared yet — author them in Chapter 3.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet.');
            panel.appendChild(this._makeSelectSlot('Parent Safety Goal', this._sgOptions(),
                this.draftReq.parentSG,
                v => { this.draftReq.parentSG = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *', verifOpts,
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('ASIL', asilOpts, this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
        }
        return panel;
    }

    _sgOptions() {
        return [{value:'',label:'— select —'},
                ...this.doc.safetyGoals.map(g => ({
                    value: g.id, label: `${g.name || g.id} (${g.asil || 'QM'})`
                }))];
    }

    _safeStateOptions() {
        return [{value:'',label:'None'},
                ...(this.doc.safeStates || []).map(s => ({
                    value: s.id, label: s.description || s.id
                }))];
    }

    _mountMultiSelectAttr(panel, label, attrName, options, emptyLabel) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        slot.style.flexBasis = '100%';
        slot.innerHTML = `<label>${label}</label>`;
        const mount = document.createElement('span');
        slot.appendChild(mount);
        panel.appendChild(slot);
        const ms = new MultiSelectDropdown(
            options, this.draftReq[attrName] || [],
            newIds => { this.draftReq[attrName] = newIds; },
            { unitLabel: 'item',
              emptyLabel: emptyLabel || 'No options available.' });
        mount.replaceWith(ms.element);
    }

    _resolveSourceTokens(src) {
        if (!src) return '';
        return String(src).split(/[\s,]+/).filter(Boolean)
            .map(tok => this.doc.nameForId(tok)).join(', ');
    }

    _renderSmartAttestations(wrap) {
        const div = document.createElement('div');
        div.style.cssText = 'margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid #dee2e6;';
        div.innerHTML = `<div style="font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.5px;margin-bottom:0.4rem;">SMART Attestations</div>`;
        GRAMMAR.smartAttestations.forEach(a => {
            const row = document.createElement('div');
            row.className = 'checklist-item';
            const checked = this.draftReq.smart[a.id] ? 'checked' : '';
            row.innerHTML = `<input type="checkbox" id="smart-${a.id}" ${checked}><label for="smart-${a.id}">${a.label}</label>`;
            row.querySelector('input').addEventListener('change', e => {
                this.draftReq.smart[a.id] = e.target.checked;
                this._refreshPreview(wrap);
            });
            div.appendChild(row);
        });
        return div;
    }

    _commitRequirement() {
        const ctx = { declaredSubjects: this.doc.declaredSubjectsForChapter(this.currentChapter) };
        const { errors } = GrammarValidator.validate(this.draftReq, ctx);
        if (errors.length > 0) {
            alert('Cannot commit: validation errors remain.\n\n' + errors.join('\n'));
            return;
        }
        const r = this.draftReq;
        if (!this.editingExisting) {
            r.id = this.doc.nextId('requirement');
            this.doc.requirements.push(r);
        }
        r.modifiedAt = new Date().toISOString();

        const lex = (cat, val) => this.doc.addToLexicon(cat, val);
        lex('capabilities', r.capability);
        lex('actors',       r.actor);
        lex('conditions',   r.condition);
        lex('reactions',    r.reaction);
        lex('triggers',     r.trigger);
        lex('inputs',       r.input);
        lex('outputs',      r.output);
        lex('properties',   r.property);
        lex('units',        r.unit);
        lex('tolerances',   r.tolerance);
        lex('standards',    r.standard);
        lex('fromStates',   r.fromState);
        lex('toStates',     r.toState);
        lex('prohibitedBehaviors', r.prohibitedBehavior);
        lex('boundingConditions',  r.boundingCondition);
        lex('signalNames',         r.signalName);
        lex('pins',                r.pin);
        lex('signalProperties',    r.signalProperties);

        this.editingExisting = false;
        this.draftReq = this._newDraft();
        this.onChange();
    }

    _cancelEdit() {
        this.editingExisting = false;
        this.draftReq = this._newDraft();
        this.onChange();
    }


    // =========================================================================
    // Requirements list. Stays inline because Edit must reach this.draftReq.
    // =========================================================================

    _renderRequirementsList() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Requirements in this chapter</div>`;

        const reqs = this.currentElement
            ? this.doc.requirementsForElement(this.currentElement.id)
            : this.doc.requirementsForChapter(this.currentChapter.id).filter(r => !r.elementId);

        if (reqs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.style.padding = '1rem';
            empty.textContent = 'No requirements yet. Use the builder above.';
            wrap.appendChild(empty);
            return wrap;
        }

        const asilTitles = {
            'QM':     'Quality Management — no safety integrity beyond standard QM.',
            'ASIL-A': 'ASIL A — lowest safety integrity (ISO 26262).',
            'ASIL-B': 'ASIL B — moderate integrity.',
            'ASIL-C': 'ASIL C — high integrity.',
            'ASIL-D': 'ASIL D — highest integrity.',
            'SIL-1':  'SIL 1 — lowest integrity (IEC 61508).',
            'SIL-2':  'SIL 2 — moderate integrity.',
            'SIL-3':  'SIL 3 — high integrity.',
            'SIL-4':  'SIL 4 — highest integrity.'
        };

        reqs.forEach(req => {
            const item = document.createElement('div');
            item.className = 'req-item';

            const ctx = { declaredSubjects: this.doc.declaredSubjectsForChapter(this.currentChapter) };
            const { errors, warnings } = GrammarValidator.validate(req, ctx);
            const statusDot = errors.length > 0
                ? '<span class="completeness-dot red" title="Has errors"></span>'
                : warnings.length > 0
                    ? '<span class="completeness-dot orange" title="Has warnings"></span>'
                    : '<span class="completeness-dot green" title="Valid"></span>';
            const asilClass = GRAMMAR.asilCssClass(req.asil);

            item.innerHTML = `
                <div class="req-item-header">
                    <span class="req-id" title="Internal stable ID.">${req.id} ${statusDot}</span>
                    <span style="display:flex;align-items:center;gap:10px;">
                        <label class="impl-switch" title="Mark this requirement implemented / accepted. Flip during acceptance review.">
                            <input type="checkbox" class="req-impl" ${req.implemented ? 'checked' : ''}>
                            <span class="impl-slider"></span>
                            <span class="impl-label">${req.implemented ? 'Implemented' : 'Open'}</span>
                        </label>
                        <button class="req-edit" title="Edit" style="background:none;border:none;color:#0d6efd;cursor:pointer;font-size:13px;padding:0 6px;">✎ Edit</button>
                        <button class="req-delete" title="Delete">✕</button>
                    </span>
                </div>
                <div>${req.statement}</div>
                <div class="req-badges">
                    ${req.externalId ? `<span class="req-badge" style="background:#e7f1ff;color:#0a58ca;" title="External RM tool ID (Polarion / PTC). Not synced.">ext: ${req.externalId}</span>` : ''}
                    ${req.asil ? `<span class="req-badge ${asilClass}" title="${(asilTitles[req.asil] || 'Safety integrity level').replace(/"/g,'&quot;')}">${req.asil}</span>` : ''}
                    ${req.verification ? `<span class="req-badge" title="Verification method.">Verif: ${req.verification}</span>` : ''}
                    ${req.dcTarget ? `<span class="req-badge" title="Diagnostic Coverage target.">DC ${req.dcTarget}</span>` : ''}
                    ${req.parentSG ? `<span class="req-badge" title="Parent Safety Goal.">→ ${this.doc.nameForId(req.parentSG)}</span>` : ''}
                    ${req.safeStateRef ? `<span class="req-badge" title="Safe state.">SS: ${this.doc.nameForId(req.safeStateRef)}</span>` : ''}
                    ${req.ftti ? `<span class="req-badge" title="FTTI.">FTTI ${req.ftti}</span>` : ''}
                    ${req.fttiContribution ? `<span class="req-badge" title="FTTI contribution.">FTTI+ ${req.fttiContribution}</span>` : ''}
                    ${(req.parentSystemReqs || []).map(id => `<span class="req-badge" title="Parent System TSR.">⟸ TSR ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.parentFsrs || []).map(id => `<span class="req-badge" title="Parent FSR.">⟵ FSR ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.parentAcceptanceReqs || []).map(id => `<span class="req-badge" title="Parent acceptance.">⟵ Acc ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.parentItemFunctions || []).map(id => `<span class="req-badge" title="Item function.">fn ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.modeApplicability || []).map(id => `<span class="req-badge" title="Active in this mode.">mode ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.allocation || []).map(id => `<span class="req-badge" title="Allocated to.">⊳ ${this.doc.nameForId(id)}</span>`).join('')}
                    ${req.source ? `<span class="req-badge" style="background:#f0f0f0;color:#999;" title="Legacy free-text source field.">legacy src: ${this._resolveSourceTokens(req.source)}</span>` : ''}
                </div>
                ${req.rationale ? `<div style="font-size:11px;color:#666;margin-top:0.3rem;"><em>Rationale:</em> ${req.rationale}</div>` : ''}
            `;
            const implEl = item.querySelector('.req-impl');
            implEl.addEventListener('change', e => {
                req.implemented = e.target.checked;
                req.modifiedAt = new Date().toISOString();
                this.onChange();
            });
            item.querySelector('.req-edit').addEventListener('click', () => {
                this.draftReq = req;
                this.editingExisting = true;
                this.onChange();
                setTimeout(() => {
                    const builder = document.querySelector('.req-builder');
                    if (builder) builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
            });
            item.querySelector('.req-delete').addEventListener('click', () => {
                if (confirm('Delete this requirement?')) {
                    this.doc.requirements = this.doc.requirements.filter(r => r.id !== req.id);
                    this.onChange();
                }
            });
            wrap.appendChild(item);
        });
        return wrap;
    }


    // =========================================================================
    // Slot builders — small UI helpers used by the requirement builder.
    // =========================================================================

    /** Build a labelled <select>. Adds an explicit "— select —" placeholder
     *  when the current value is empty AND the caller didn't provide one;
     *  without it the browser shows the first real option as if selected,
     *  the model still reads '', and clicking that option doesn't fire
     *  `change`. Root cause of the historical "first predicate cannot
     *  change" bug. */
    _makeSelectSlot(label, options, value, onChange) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        const hasEmpty = options.some(o => o.value === '');
        const needPlaceholder = !value && !hasEmpty;
        const placeholder = needPlaceholder
            ? `<option value="" selected disabled>— select —</option>` : '';
        const opts = options.map(o =>
            `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        slot.innerHTML = `<label>${label}</label><select>${placeholder}${opts}</select>`;
        slot.querySelector('select').addEventListener('change', e => onChange(e.target.value));
        return slot;
    }

    /** Build a labelled <input>. Optionally wires a per-instance datalist
     *  sourced from doc.lexicon[lexCategory] so previously-typed values
     *  for the same kind of slot reappear as autocomplete suggestions. */
    _makeInputSlot(label, value, onChange, hint, lexCategory) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        let listAttr = '', listEl = '';
        if (lexCategory && this.doc && this.doc.lexicon
                && Array.isArray(this.doc.lexicon[lexCategory])
                && this.doc.lexicon[lexCategory].length > 0) {
            const listId = `lex-${lexCategory}-${Math.random().toString(36).slice(2,8)}`;
            listAttr = ` list="${listId}"`;
            const opts = this.doc.lexicon[lexCategory]
                .map(v => `<option value="${String(v).replace(/"/g,'&quot;')}">`).join('');
            listEl = `<datalist id="${listId}">${opts}</datalist>`;
        }
        slot.innerHTML = `
            <label>${label}</label>
            <input type="text"${listAttr} value="${(value || '').replace(/"/g, '&quot;')}" placeholder="${hint || ''}">
            ${listEl}
        `;
        slot.querySelector('input').addEventListener('input', e => onChange(e.target.value));
        return slot;
    }

    _makeStaticSlot(label, value) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        slot.innerHTML = `<label>${label}</label><input type="text" value="${value}" disabled style="background:#e9ecef;">`;
        return slot;
    }
}
