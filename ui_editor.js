/**
 * ui_editor.js
 *
 * Center pane: renders the active chapter — intro, checklist, declaration
 * tables (elements, item functions, etc.), and the SMART requirement builder.
 */

class EditorView {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange; // notify main to re-render all panes
        this.currentChapter = null;
        this.currentElement = null; // when we're in Chapter 7 sub-leaf
        this.draftReq = null; // requirement being authored
    }

    setDocument(doc) { this.doc = doc; }

    load(chapterId, elementId) {
        this.currentChapter = findChapter(this.doc.discipline, chapterId);
        this.currentElement = elementId ? this.doc.elements.find(e => e.id === elementId) : null;
        this.draftReq = this._newDraft();
    }

    _newDraft() {
        if (!this.currentChapter) return null;
        // The Requirement constructor assigns a fallback random ID;
        // we replace it with a sentinel so it's obvious in the preview
        // that the ID is provisional. The real, sequential ID is
        // allocated at commit time via doc.nextId('requirement') so
        // abandoned drafts don't burn slots in the counter.
        const draft = new Requirement({
            chapterId: this.currentChapter.id,
            elementId: this.currentElement ? this.currentElement.id : null
        });
        draft.id = '(draft)';
        if (this.currentChapter.subjectMode === 'system') draft.subject = 'the system';
        else if (this.currentElement) draft.subject = this.currentElement.name;
        return draft;
    }

    /**
     * Welcome / onboarding panel shown in the center pane whenever no chapter
     * is selected (fresh open, after Reset, after Load). Two action paths:
     * load an existing project, or start a new one by picking a chapter from
     * the outline. The Load button delegates to the top-bar Load button so
     * file-input wiring lives in one place (main.js).
     */
    _renderWelcome(container) {
        const fresh = this._isDocumentEmpty();
        const wrapper = document.createElement('div');
        wrapper.className = 'welcome-panel';
        wrapper.innerHTML = `
            <h4 class="welcome-title">Welcome to the SyRS Authoring Tool</h4>
            <p class="welcome-lead">
                Author safety-aware system requirements with grammar validation,
                completeness tracking, and integrity checks. Everything stays
                local — your project is a single <code>.json</code> file.
            </p>

            <div class="welcome-steps">
                <div class="welcome-step">
                    <div class="welcome-step-num">1</div>
                    <div class="welcome-step-body">
                        <strong>Open an existing project</strong>
                        <p>Load a previously saved project file to pick up where you left off.</p>
                        <button id="welcomeLoadBtn" class="btn btn-sm btn-primary">Load Project…</button>
                    </div>
                </div>

                <div class="welcome-or">— or —</div>

                <div class="welcome-step">
                    <div class="welcome-step-num">2</div>
                    <div class="welcome-step-body">
                        <strong>Start a new project</strong>
                        <p>Confirm <em>Discipline</em> and <em>Class</em> in the top bar, then click any chapter
                        in the <em>Document Outline</em> on the left to begin authoring.</p>
                    </div>
                </div>
            </div>

            <div class="welcome-layout-hint">
                <div><span class="welcome-pane-tag">Left</span> outline &amp; per-chapter completeness</div>
                <div><span class="welcome-pane-tag">Center</span> chapter editor &amp; SMART requirement builder</div>
                <div><span class="welcome-pane-tag">Right</span> live model summary &amp; integrity flags</div>
            </div>

            ${fresh ? '' : `
                <p class="welcome-note">
                    Your current project already has content — pick a chapter on the left
                    to continue editing. Load and Save become available in the top bar
                    once a chapter is open.
                </p>
            `}
        `;
        container.appendChild(wrapper);

        // Delegate to the top-bar button so load wiring stays in main.js.
        const loadBtn = wrapper.querySelector('#welcomeLoadBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                document.getElementById('loadJsonButton').click();
            });
        }
    }

    /** True when the document has no user-authored content yet. */
    _isDocumentEmpty() {
        const d = this.doc;
        return d.requirements.length === 0
            && d.elements.length === 0
            && d.itemFunctions.length === 0
            && d.safetyGoals.length === 0
            && d.modes.length === 0
            && d.interfaces.length === 0
            && d.assumptions.length === 0
            && Object.keys(d.checklistState || {}).length === 0;
    }

    render(container, chapterTitleEl, chapterBadgeEl) {
        container.innerHTML = '';

        if (!this.currentChapter) {
            this._renderWelcome(container);
            chapterTitleEl.textContent = 'Welcome';
            chapterBadgeEl.textContent = '—';
            chapterBadgeEl.className = 'badge bg-secondary';
            return;
        }

        // Title
        const titleText = this.currentElement
            ? `7. Element — ${this.currentElement.name || '(unnamed)'}`
            : `${this.currentChapter.number}. ${this.currentChapter.title}`;
        chapterTitleEl.textContent = titleText;

        const validator = new DocumentValidator(this.doc);
        const pct = validator.chapterCompleteness(this.currentChapter);
        chapterBadgeEl.textContent = `${pct}% checklist`;
        chapterBadgeEl.className = 'badge ' + (pct === 100 ? 'bg-success' : pct >= 50 ? 'bg-warning text-dark' : 'bg-danger');
        chapterBadgeEl.title = `${pct}% of this chapter's completeness checklist is ticked. 100% is required before signoff.`;

        // Intro
        const intro = document.createElement('div');
        intro.className = 'chapter-intro';
        intro.textContent = this.currentChapter.intro || '';
        container.appendChild(intro);

        // Element-specific intro
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

        // Declarations block (if this chapter manages declarations)
        if (this.currentChapter.declarations) {
            // Shared autocomplete datalist used by any row with
            // list="owners-datalist" — rendered before the rows so
            // the input→datalist link resolves on first paint.
            container.appendChild(this._renderOwnerDatalist());
            this.currentChapter.declarations.forEach(d => {
                container.appendChild(this._renderDeclarationTable(d));
            });
        }

        // Special content for Chapter 20 (traceability)
        if (this.currentChapter.autoContent === 'traceability') {
            container.appendChild(this._renderTraceability());
        }

        // Checklist
        container.appendChild(this._renderChecklist());

        // Requirements section (only if chapter allows or we're on element leaf)
        if (this.currentChapter.allowsRequirements || this.currentElement) {
            container.appendChild(this._renderRequirementBuilder());
            container.appendChild(this._renderRequirementsList());
        }
    }

    _renderChecklist() {
        const wrap = document.createElement('div');
        wrap.className = 'checklist-section';
        wrap.innerHTML = `<div class="section-title">Chapter Completeness Checklist</div>`;

        const state = this.doc.checklistState[this.currentChapter.id] || {};

        (this.currentChapter.checklist || []).forEach(item => {
            const row = document.createElement('div');
            row.className = 'checklist-item';
            const checked = state[item.id] ? 'checked' : '';
            row.innerHTML = `
                <input type="checkbox" id="chk-${item.id}" ${checked}>
                <label for="chk-${item.id}">${item.text}</label>
            `;
            row.querySelector('input').addEventListener('change', (e) => {
                if (!this.doc.checklistState[this.currentChapter.id]) {
                    this.doc.checklistState[this.currentChapter.id] = {};
                }
                this.doc.checklistState[this.currentChapter.id][item.id] = e.target.checked;
                this.onChange();
            });
            wrap.appendChild(row);
        });

        // Signoff field
        const signoff = document.createElement('div');
        signoff.style.marginTop = '0.75rem';
        signoff.style.padding = '0.5rem';
        signoff.style.background = '#f8f9fa';
        signoff.style.borderRadius = '4px';
        const current = this.doc.signoffs[this.currentChapter.id];
        signoff.innerHTML = `
            <label style="font-size:12px;font-weight:600;">Signoff (chapter owner):</label>
            <input type="text" list="owners-datalist" class="form-control form-control-sm" id="signoffInput"
                   placeholder="Name" value="${current ? current.owner : ''}" style="max-width:240px;display:inline-block;margin-left:0.5rem;"
                   title="Pick from previously-used names or type a new one. Names are remembered in the project file.">
            <button class="btn btn-sm btn-outline-success" id="signoffBtn" style="margin-left:0.5rem;">Sign</button>
            ${current ? `<span style="margin-left:1rem;font-size:11px;color:#198754;">Signed by ${current.owner} on ${new Date(current.timestamp).toLocaleString()}</span>` : ''}
        `;
        signoff.querySelector('#signoffBtn').addEventListener('click', () => {
            const name = signoff.querySelector('#signoffInput').value.trim();
            if (!name) { alert('Enter signoff name first.'); return; }
            this.doc.signoffs[this.currentChapter.id] = { owner: name, timestamp: new Date().toISOString() };
            // Bank the name so future signoff inputs autocomplete to it.
            this.doc.addToLexicon('signoffNames', name);
            this.onChange();
        });
        wrap.appendChild(signoff);
        return wrap;
    }

    // ---- Declarations ----
    /**
     * Renders one declaration table (item functions, modes, etc.).
     *
     * Click-twice bug fix
     * -------------------
     * The previous version bound a `change` listener to *every* input
     * which called this.onChange() → renderAll() → full pane teardown.
     * The sequence was:
     *   user types in row → mousedown on "+ Add" → input loses focus
     *   → change fires → renderAll() destroys the live "+ Add" button
     *   → click never reaches the (gone) button → user has to click again.
     *
     * The fix splits the event policy by control type:
     *   - text/textarea/list inputs: `input` event → write to model only,
     *     no re-render. Focus is preserved while typing. The summary pane
     *     goes briefly stale on names but catches up on next add/remove
     *     or chapter switch — acceptable since names don't change counts.
     *   - select/checkbox: `change` event → write + full re-render
     *     (these affect summary status badges and never suffer focus loss
     *     because the user clicks them directly).
     */
    _renderDeclarationTable(kind) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        const config = DECLARATION_CONFIG[kind];
        if (!config) return wrap;

        // Section title with optional `?` info icon. The icon is keyed
        // on config.sectionHelp; if absent, no icon is rendered.
        const titleHtml = config.sectionHelp
            ? `${config.title} <span class="help-icon" title="${config.sectionHelp}">?</span>`
            : config.title;
        wrap.innerHTML = `<div class="section-title">${titleHtml}</div>`;

        // Table of existing
        const list = config.getList(this.doc);
        if (list.length > 0) {
            const header = document.createElement('div');
            header.className = 'declaration-header';
            header.style.display = 'grid';
            header.style.gridTemplateColumns = config.gridCols;
            header.style.gap = '0.4rem';
            // Per-column hover help: if config.helpHeaders[label] exists
            // we append a small `?` superscript with the explanation.
            header.innerHTML = config.headers.map(h => {
                const help = config.helpHeaders && config.helpHeaders[h];
                return help
                    ? `<div>${h} <span class="help-icon" title="${help.replace(/"/g,'&quot;')}">?</span></div>`
                    : `<div>${h}</div>`;
            }).join('');
            wrap.appendChild(header);
        }

        list.forEach(item => {
            const row = document.createElement('div');
            row.className = 'declaration-row';
            row.style.gridTemplateColumns = config.gridCols;
            row.innerHTML = config.renderRow(item);

            row.querySelector('.del-btn').addEventListener('click', () => {
                config.remove(this.doc, item.id);
                this.onChange();
            });

            // Text inputs: live write on `input`, no re-render.
            // Avoids the click-twice bug entirely — the user can mouse
            // straight from a half-typed input onto "+ Add" and the
            // first click registers because no DOM teardown happens
            // mid-flight.
            row.querySelectorAll('input[type="text"]').forEach(inp => {
                inp.addEventListener('input', () => {
                    config.updateFromRow(this.doc, item.id, row);
                });
            });

            // Selects + checkboxes: write + full re-render. Safe
            // because clicking these means the user already left any
            // text input, so there's no in-flight focus to clobber.
            row.querySelectorAll('select, input[type="checkbox"]').forEach(inp => {
                inp.addEventListener('change', () => {
                    config.updateFromRow(this.doc, item.id, row);
                    this.onChange();
                });
            });

            wrap.appendChild(row);
        });

        // Add button — works on first click now that text edits no
        // longer trigger renderAll() during their blur.
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary btn-add';
        btn.textContent = `+ Add ${config.singular}`;
        btn.style.marginTop = '0.5rem';
        btn.addEventListener('click', () => {
            config.add(this.doc);
            this.onChange();
        });
        wrap.appendChild(btn);

        return wrap;
    }

    /**
     * Shared <datalist> for owner / signoff name autocomplete.
     * Rendered once per chapter, referenced by `list="owners-datalist"`
     * on any input that accepts a person-name. No JS, no popup library —
     * native browser datalist handles the suggestions.
     */
    _renderOwnerDatalist() {
        const dl = document.createElement('datalist');
        dl.id = 'owners-datalist';
        const names = new Set();
        // From assumption owners
        (this.doc.assumptions || []).forEach(a => { if (a.owner) names.add(a.owner); });
        // From signoffs
        Object.values(this.doc.signoffs || {}).forEach(s => { if (s && s.owner) names.add(s.owner); });
        // From persisted lexicon
        (this.doc.lexicon && this.doc.lexicon.owners || []).forEach(n => { if (n) names.add(n); });
        (this.doc.lexicon && this.doc.lexicon.signoffNames || []).forEach(n => { if (n) names.add(n); });
        names.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            dl.appendChild(opt);
        });
        return dl;
    }

    // ---- Requirement builder (SMART input) ----
    _renderRequirementBuilder() {
        const wrap = document.createElement('div');
        wrap.className = 'req-builder';
        wrap.innerHTML = `<h6>New Requirement</h6>`;

        // Row 1: Conditional + Subject + Predicate
        const row1 = document.createElement('div');
        row1.className = 'req-slot-row';

        // Conditional slot
        const condSlot = this._makeSelectSlot('Conditional',
            GRAMMAR.conditionals.map(c => ({ value: c.id, label: c.label })),
            this.draftReq.conditional,
            v => { this.draftReq.conditional = v; this._refreshBuilder(wrap); }
        );
        row1.appendChild(condSlot);

        // Conditional text (if not ubiquitous)
        if (this.draftReq.conditional !== 'ubiquitous') {
            const condText = this._makeInputSlot('Condition text',
                this.draftReq.conditionalText,
                v => { this.draftReq.conditionalText = v; this._refreshPreview(wrap); }
            );
            condText.style.flex = '1';
            row1.appendChild(condText);
        }

        // Subject slot
        const subjects = this.doc.declaredSubjectsForChapter(this.currentChapter);
        if (this.currentElement) {
            // Locked
            const locked = this._makeStaticSlot('Subject', this.currentElement.name);
            row1.appendChild(locked);
        } else if (this.currentChapter.subjectMode === 'system') {
            const locked = this._makeStaticSlot('Subject', 'the system');
            row1.appendChild(locked);
        } else {
            const subjSlot = this._makeSelectSlot('Subject',
                subjects.map(s => ({ value: s, label: s })),
                this.draftReq.subject,
                v => { this.draftReq.subject = v; this._refreshPreview(wrap); }
            );
            if (subjects.length === 0) {
                subjSlot.querySelector('select').disabled = true;
                subjSlot.insertAdjacentHTML('beforeend', '<small class="text-danger">No elements declared yet.</small>');
            }
            row1.appendChild(subjSlot);
        }

        // "shall"
        const shallSpan = document.createElement('div');
        shallSpan.style.fontWeight = '600';
        shallSpan.style.padding = '0 0.3rem';
        shallSpan.style.alignSelf = 'flex-end';
        shallSpan.style.marginBottom = '6px';
        shallSpan.textContent = 'SHALL';
        row1.appendChild(shallSpan);

        // Predicate slot
        const predSlot = this._makeSelectSlot('Predicate',
            GRAMMAR.predicates.map(p => ({ value: p.id, label: p.label })),
            this.draftReq.predicate,
            v => { this.draftReq.predicate = v; this._refreshBuilder(wrap); }
        );
        row1.appendChild(predSlot);

        wrap.appendChild(row1);

        // Row 2: Predicate-specific fields
        if (this.draftReq.predicate) {
            const pred = GRAMMAR.predicates.find(p => p.id === this.draftReq.predicate);
            if (pred) {
                const row2 = document.createElement('div');
                row2.className = 'req-slot-row';
                pred.fields.forEach(f => {
                    const slot = this._makeInputSlot(
                        f.label + (f.required ? ' *' : ''),
                        this.draftReq[f.id] || '',
                        v => { this.draftReq[f.id] = v; this._refreshPreview(wrap); },
                        f.hint
                    );
                    slot.style.flex = '1';
                    slot.style.minWidth = '150px';
                    row2.appendChild(slot);
                });
                wrap.appendChild(row2);
            }
        }

        // Preview
        const preview = document.createElement('div');
        preview.className = 'req-preview';
        preview.id = 'reqPreview';
        wrap.appendChild(preview);

        // Validation messages
        const valMsg = document.createElement('div');
        valMsg.className = 'validation-messages';
        valMsg.id = 'reqValMsg';
        wrap.appendChild(valMsg);

        // Attributes
        const attrs = this._renderAttributesPanel(wrap);
        wrap.appendChild(attrs);

        // SMART attestations
        wrap.appendChild(this._renderSmartAttestations(wrap));

        // Add button
        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-primary btn-sm';
        addBtn.style.marginTop = '0.75rem';
        addBtn.id = 'addReqBtn';
        addBtn.textContent = '+ Add Requirement';
        addBtn.addEventListener('click', () => this._commitRequirement());
        wrap.appendChild(addBtn);

        // Initial refresh
        setTimeout(() => this._refreshPreview(wrap), 0);

        return wrap;
    }

    _refreshBuilder(wrap) {
        // Re-render the whole builder section when predicate or conditional changes
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

    _renderAttributesPanel(wrap) {
        const panel = document.createElement('div');
        panel.className = 'req-attributes';

        panel.appendChild(this._makeInputSlot('Rationale *', this.draftReq.rationale,
            v => { this.draftReq.rationale = v; this._refreshPreview(wrap); }, 'Why this requirement exists'));
        panel.appendChild(this._makeInputSlot('Source (upstream ID)', this.draftReq.source,
            v => { this.draftReq.source = v; this._refreshPreview(wrap); }, 'e.g. ITEMF-A1B2, SG-C3D4'));
        panel.appendChild(this._makeSelectSlot('Verification method *',
            [{value:'',label:'Choose...'}, ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))],
            this.draftReq.verification,
            v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
        panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
            v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
        panel.appendChild(this._makeSelectSlot('ASIL *',
            [{value:'',label:'Choose...'}, ...GRAMMAR.asilLevels.map(a => ({value: a, label: a}))],
            this.draftReq.asil,
            v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
        panel.appendChild(this._makeSelectSlot('Parent Safety Goal',
            [{value:'',label:'None'}, ...this.doc.safetyGoals.map(g => ({value: g.id, label: `${g.id} (${g.asil})`}))],
            this.draftReq.parentSG,
            v => { this.draftReq.parentSG = v; this._refreshPreview(wrap); }));
        panel.appendChild(this._makeInputSlot('FTTI', this.draftReq.ftti,
            v => { this.draftReq.ftti = v; this._refreshPreview(wrap); }, 'e.g. 1 s, 200 ms'));
        panel.appendChild(this._makeInputSlot('Safe state ref', this.draftReq.safeStateRef,
            v => { this.draftReq.safeStateRef = v; this._refreshPreview(wrap); }));

        return panel;
    }

    _renderSmartAttestations(wrap) {
        const div = document.createElement('div');
        div.style.marginTop = '0.75rem';
        div.style.paddingTop = '0.75rem';
        div.style.borderTop = '1px solid #dee2e6';
        div.innerHTML = `<div style="font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.5px;margin-bottom:0.4rem;">SMART Attestations</div>`;
        GRAMMAR.smartAttestations.forEach(a => {
            const row = document.createElement('div');
            row.className = 'checklist-item';
            const checked = this.draftReq.smart[a.id] ? 'checked' : '';
            row.innerHTML = `<input type="checkbox" id="smart-${a.id}" ${checked}><label for="smart-${a.id}">${a.label}</label>`;
            row.querySelector('input').addEventListener('change', (e) => {
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
        // Allocate the real sequential ID now (not at draft creation),
        // so abandoned drafts don't leak slots in idCounters.
        this.draftReq.id = this.doc.nextId('requirement');

        // Bank free-text predicate-slot values into the lexicon so the
        // next requirement gets autocomplete suggestions for the same
        // kind of slot. Phase 3 will surface these via datalists in
        // the SMART builder.
        const r = this.draftReq;
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

        this.doc.requirements.push(this.draftReq);
        this.draftReq = this._newDraft();
        this.onChange();
    }

    // ---- Requirements list ----
    _renderRequirementsList() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Requirements in this chapter</div>`;

        let reqs;
        if (this.currentElement) {
            reqs = this.doc.requirementsForElement(this.currentElement.id);
        } else {
            reqs = this.doc.requirementsForChapter(this.currentChapter.id)
                .filter(r => !r.elementId);
        }

        if (reqs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.style.padding = '1rem';
            empty.textContent = 'No requirements yet. Use the builder above.';
            wrap.appendChild(empty);
            return wrap;
        }

        reqs.forEach(req => {
            const item = document.createElement('div');
            item.className = 'req-item';

            const ctx = { declaredSubjects: this.doc.declaredSubjectsForChapter(this.currentChapter) };
            const { errors, warnings } = GrammarValidator.validate(req, ctx);
            let statusDot = '';
            if (errors.length > 0) statusDot = '<span class="completeness-dot red" title="Has errors"></span>';
            else if (warnings.length > 0) statusDot = '<span class="completeness-dot orange" title="Has warnings"></span>';
            else statusDot = '<span class="completeness-dot green" title="Valid"></span>';

            const asilClass = req.asil ? `asil-${req.asil.toLowerCase()}` : '';

            const asilTitles = {
                'QM': 'Quality Management — no integrity requirement beyond standard QM.',
                'A':  'ASIL A — lowest safety integrity. Failure could cause light/moderate injury.',
                'B':  'ASIL B — moderate integrity.',
                'C':  'ASIL C — high integrity.',
                'D':  'ASIL D — highest integrity. Failure could be life-threatening.'
            };

            item.innerHTML = `
                <div class="req-item-header">
                    <span class="req-id" title="Internal stable ID. References use this.">${req.id} ${statusDot}</span>
                    <button class="req-delete" title="Delete this requirement">✕</button>
                </div>
                <div>${req.statement}</div>
                <div class="req-badges">
                    ${req.asil ? `<span class="req-badge ${asilClass}" title="${(asilTitles[req.asil] || 'Safety integrity level').replace(/"/g,'&quot;')}">ASIL ${req.asil}</span>` : ''}
                    ${req.verification ? `<span class="req-badge" title="Verification method assigned to this requirement.">Verif: ${req.verification}</span>` : ''}
                    ${req.parentSG ? `<span class="req-badge" title="Parent Safety Goal — this requirement contributes to satisfying it.">→ ${this.doc.nameForId(req.parentSG)}</span>` : ''}
                    ${req.ftti ? `<span class="req-badge" title="Fault Tolerant Time Interval contribution from this requirement.">FTTI ${req.ftti}</span>` : ''}
                    ${req.source ? `<span class="req-badge" title="Upstream source — the ID of the parent that this requirement traces from.">src: ${req.source}</span>` : ''}
                </div>
                ${req.rationale ? `<div style="font-size:11px;color:#666;margin-top:0.3rem;"><em>Rationale:</em> ${req.rationale}</div>` : ''}
            `;
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

    // ---- Traceability view for Chapter 20 ----
    _renderTraceability() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Trace Matrix (auto-generated)</div>`;
        const validator = new DocumentValidator(this.doc);

        const sgCov = validator.safetyGoalCoverage();
        const fnCov = validator.itemFunctionCoverage();
        const orphans = validator.orphanReport();

        let html = '<h6 style="font-size:12px;">Safety Goal Coverage</h6>';
        if (sgCov.length === 0) {
            html += '<p class="text-muted small">No Safety Goals declared.</p>';
        } else {
            html += '<table class="table table-sm table-bordered" style="font-size:12px;">';
            html += '<thead><tr><th>SG</th><th>ASIL</th><th>FTTI</th><th>FSR</th><th>Accept</th><th>Element</th><th>End-to-end</th></tr></thead><tbody>';
            sgCov.forEach(s => {
                html += `<tr>
                    <td>${s.id} ${s.name}</td>
                    <td>${s.asil}</td>
                    <td>${s.ftti || '—'}</td>
                    <td>${s.hasFsr ? '✓' : '✗'}</td>
                    <td>${s.hasAcceptance ? '✓' : '✗'}</td>
                    <td>${s.hasElement ? '✓' : '✗'}</td>
                    <td>${s.complete ? '<span style="color:#198754;">✓ complete</span>' : '<span style="color:#dc3545;">✗ gap</span>'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '<h6 style="font-size:12px;margin-top:1rem;">Item Function Coverage</h6>';
        if (fnCov.length === 0) {
            html += '<p class="text-muted small">No item functions declared.</p>';
        } else {
            html += '<table class="table table-sm table-bordered" style="font-size:12px;">';
            html += '<thead><tr><th>Item Function</th><th>Acceptance count</th><th>Element count</th><th>Covered</th></tr></thead><tbody>';
            fnCov.forEach(f => {
                html += `<tr>
                    <td>${f.id} ${f.name}</td>
                    <td>${f.acceptance}</td>
                    <td>${f.element}</td>
                    <td>${f.covered ? '✓' : '✗'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '<h6 style="font-size:12px;margin-top:1rem;">Orphans</h6>';
        if (orphans.length === 0) {
            html += '<p class="text-success small">No orphans.</p>';
        } else {
            html += '<ul class="small">';
            orphans.forEach(o => { html += `<li>${o.id}: ${o.issue}</li>`; });
            html += '</ul>';
        }
        wrap.innerHTML += html;
        return wrap;
    }

    // ---- Small UI helpers ----
    _makeSelectSlot(label, options, value, onChange) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        const opts = options.map(o => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('');
        slot.innerHTML = `<label>${label}</label><select>${opts}</select>`;
        slot.querySelector('select').addEventListener('change', (e) => onChange(e.target.value));
        return slot;
    }

    _makeInputSlot(label, value, onChange, hint) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        slot.innerHTML = `
            <label>${label}</label>
            <input type="text" value="${(value || '').replace(/"/g, '&quot;')}" placeholder="${hint || ''}">
        `;
        slot.querySelector('input').addEventListener('input', (e) => onChange(e.target.value));
        return slot;
    }

    _makeStaticSlot(label, value) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        slot.innerHTML = `<label>${label}</label><input type="text" value="${value}" disabled style="background:#e9ecef;">`;
        return slot;
    }
}

/**
 * Declaration configs - how to list/add/remove/render each declarable type.
 */
const DECLARATION_CONFIG = {
    itemFunction: {
        title: 'Item Functions',
        singular: 'Item Function',
        // Tooltip text shown on header `?` icons. Helps the user understand
        // what each column wants without bloating the UI.
        helpHeaders: {
            'Name':        'Short, stable label. Stays the same across the project.',
            'Description': 'What this function does for the end-user. One sentence, observable behaviour, no implementation detail.'
        },
        headers: ['ID', 'Name', 'Description', '', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.itemFunctions,
        add: doc => {
            const f = new ItemFunction(); // empty defaults — placeholder only
            f.id = doc.nextId('itemFunction');
            doc.itemFunctions.push(f);
        },
        remove: (doc, id) => { doc.itemFunctions = doc.itemFunctions.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.itemFunctions.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.description = inputs[1].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID. References use this; UI shows the name.">${item.id}</div>
            <input type="text" value="${(item.name || '').replace(/"/g,'&quot;')}" placeholder="e.g. Adaptive Cruise Control">
            <input type="text" value="${(item.description || '').replace(/"/g,'&quot;')}" placeholder="What does this function do for the end-user?">
            <div></div>
            <button class="del-btn req-delete" title="Delete this item function">✕</button>
        `
    },
    mode: {
        title: 'Operating Modes',
        singular: 'Mode',
        helpHeaders: {
            'Name':        'Short ID-style name for the mode (e.g. "Nominal", "Degraded", "Safe").',
            'Description': 'What is true while the system is in this mode? Behaviour, constraints, observable state.',
            'Safe state?': 'Tick if this mode is a designated safe state per the system-level safe-state model. Safety Goals will reference these.'
        },
        // Header was "Safe?" — too cryptic. "Safe state?" matches the
        // ISO 26262 vocabulary the user is actually trying to capture.
        headers: ['ID', 'Name', 'Description', 'Safe state?', ''],
        gridCols: '90px 1fr 1fr 100px 40px',
        getList: doc => doc.modes,
        add: doc => {
            const m = new Mode();
            m.id = doc.nextId('mode');
            doc.modes.push(m);
        },
        remove: (doc, id) => { doc.modes = doc.modes.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.modes.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.description = inputs[1].value;
            item.isSafeState = inputs[2].checked;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. Nominal, Degraded, Safe">
            <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="What is true while in this mode?">
            <input type="checkbox" ${item.isSafeState ? 'checked' : ''} style="justify-self:center;" title="Designated safe state — Safety Goals can reference this mode.">
            <button class="del-btn req-delete" title="Delete this mode">✕</button>
        `
    },
    assumption: {
        title: 'Assumptions of Use',
        singular: 'Assumption',
        helpHeaders: {
            'Owner':  'Person responsible for closing this assumption. Type freely; previously-used names appear as suggestions.',
            'Status': 'Open until verified, evidenced, or designed-out; closed when retired with rationale captured elsewhere.'
        },
        headers: ['ID', 'Text', 'Owner', 'Status', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.assumptions,
        add: doc => {
            const a = new Assumption();
            a.id = doc.nextId('assumption');
            doc.assumptions.push(a);
        },
        remove: (doc, id) => { doc.assumptions = doc.assumptions.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.assumptions.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input, select');
            item.text = inputs[0].value;
            item.owner = inputs[1].value;
            item.status = inputs[2].value;
            // Bank the owner so future rows autocomplete to it.
            doc.addToLexicon('owners', item.owner);
        },
        // The `list="owners-datalist"` attribute hooks the input to the
        // shared datalist rendered once per chapter (see _renderOwnerDatalist).
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.text||'').replace(/"/g,'&quot;')}" placeholder="State the assumption (one sentence)">
            <input type="text" list="owners-datalist" value="${(item.owner||'').replace(/"/g,'&quot;')}" placeholder="Owner">
            <select><option ${item.status==='open'?'selected':''}>open</option><option ${item.status==='closed'?'selected':''}>closed</option></select>
            <button class="del-btn req-delete" title="Delete this assumption">✕</button>
        `
    },
    safetyGoal: {
        title: 'Safety Goals',
        singular: 'Safety Goal',
        helpHeaders: {
            'Name': 'Hazard-derived goal, phrased as the avoidance condition (e.g. "Avoid unintended deceleration").',
            'SIL/ASIL': 'ISO 26262 ASIL or IEC 61508 SIL, or QM if non-safety. Phase 2 will surface the full SIL+ASIL list and a HARA reference field.',
            'FTTI': 'Fault Tolerant Time Interval — quantified time, e.g. "1 s" or "200 ms".'
        },
        headers: ['ID', 'Name', 'SIL/ASIL', 'FTTI', ''],
        gridCols: '90px 1fr 100px 100px 40px',
        getList: doc => doc.safetyGoals,
        add: doc => {
            const g = new SafetyGoal();
            g.id = doc.nextId('safetyGoal');
            doc.safetyGoals.push(g);
        },
        remove: (doc, id) => { doc.safetyGoals = doc.safetyGoals.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.safetyGoals.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input, select');
            item.name = inputs[0].value;
            item.asil = inputs[1].value;
            item.ftti = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Avoidance condition (e.g. 'Avoid unintended deceleration')">
            <select title="ISO 26262 ASIL or IEC 61508 SIL. Phase 2 expands this list.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
            <input type="text" value="${(item.ftti||'').replace(/"/g,'&quot;')}" placeholder="e.g. 1 s">
            <button class="del-btn req-delete" title="Delete this Safety Goal">✕</button>
        `
    },
    element: {
        title: 'System Elements',
        singular: 'Element',
        helpHeaders: {
            'Name':    'Stable element identifier, no spaces (e.g. SteeringECU). The user-facing display name.',
            'Purpose': 'One-sentence statement of why the element exists in the architecture.',
            'ASIL':    'Inherited or decomposed ASIL. Phase 2 widens this to SIL+ASIL.'
        },
        headers: ['ID', 'Name', 'Purpose', 'ASIL', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.elements,
        add: doc => {
            const el = new Element();
            el.id = doc.nextId('element');
            el.asil = 'QM';
            doc.elements.push(el);
        },
        remove: (doc, id) => { doc.elements = doc.elements.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.elements.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input, select');
            item.name = inputs[0].value;
            item.purpose = inputs[1].value;
            item.asil = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Element name (no spaces)">
            <input type="text" value="${(item.purpose||'').replace(/"/g,'&quot;')}" placeholder="One-sentence purpose">
            <select title="Inherited or decomposed ASIL.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
            <button class="del-btn req-delete" title="Delete this element">✕</button>
        `
    },
    interface: {
        title: 'External Interfaces',
        singular: 'Interface',
        helpHeaders: {
            'Name':     'Interface label (e.g. CAN_PT, LIN_BCM, HV_BUS).',
            'Producer': 'Element or external system originating the data/signal.',
            'Consumer': 'Element or external system receiving the data/signal. Phase 2 expands this row with direction, HW/SW, and SMART signal properties.'
        },
        headers: ['ID', 'Name', 'Producer', 'Consumer', ''],
        gridCols: '90px 1fr 1fr 1fr 40px',
        getList: doc => doc.interfaces,
        add: doc => {
            const iface = new InterfaceSpec();
            iface.id = doc.nextId('interfaceSpec');
            doc.interfaces.push(iface);
        },
        remove: (doc, id) => { doc.interfaces = doc.interfaces.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.interfaces.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.producer = inputs[1].value;
            item.consumer = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. CAN_PT">
            <input type="text" value="${(item.producer||'').replace(/"/g,'&quot;')}" placeholder="Producer">
            <input type="text" value="${(item.consumer||'').replace(/"/g,'&quot;')}" placeholder="Consumer">
            <button class="del-btn req-delete" title="Delete this interface">✕</button>
        `
    },
    modeTransition: {
        title: 'Mode Transitions',
        singular: 'Transition',
        headers: ['ID', 'From → To', 'Trigger', '', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => [],
        add: doc => {},
        remove: (doc, id) => {},
        updateFromRow: () => {},
        renderRow: () => `<div></div><div></div><div></div><div></div><button class="del-btn req-delete">✕</button>`
    },
    timingChain: {
        title: 'Timing Chains',
        singular: 'Timing Chain',
        headers: ['ID', 'Name', 'Stages', 'Budget', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => [],
        add: doc => {},
        remove: () => {},
        updateFromRow: () => {},
        renderRow: () => `<div></div><div></div><div></div><div></div><button class="del-btn req-delete">✕</button>`
    }
};
