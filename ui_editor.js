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
        const draft = new Requirement({
            chapterId: this.currentChapter.id,
            elementId: this.currentElement ? this.currentElement.id : null
        });
        if (this.currentChapter.subjectMode === 'system') draft.subject = 'the system';
        else if (this.currentElement) draft.subject = this.currentElement.name;
        return draft;
    }

    render(container, chapterTitleEl, chapterBadgeEl) {
        container.innerHTML = '';

        if (!this.currentChapter) {
            container.innerHTML = '<div class="empty-state">Select a chapter from the outline to begin.</div>';
            chapterTitleEl.textContent = 'Select a chapter';
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
            <input type="text" class="form-control form-control-sm" id="signoffInput"
                   placeholder="Name" value="${current ? current.owner : ''}" style="max-width:240px;display:inline-block;margin-left:0.5rem;">
            <button class="btn btn-sm btn-outline-success" id="signoffBtn" style="margin-left:0.5rem;">Sign</button>
            ${current ? `<span style="margin-left:1rem;font-size:11px;color:#198754;">Signed by ${current.owner} on ${new Date(current.timestamp).toLocaleString()}</span>` : ''}
        `;
        signoff.querySelector('#signoffBtn').addEventListener('click', () => {
            const name = signoff.querySelector('#signoffInput').value.trim();
            if (!name) { alert('Enter signoff name first.'); return; }
            this.doc.signoffs[this.currentChapter.id] = { owner: name, timestamp: new Date().toISOString() };
            this.onChange();
        });
        wrap.appendChild(signoff);
        return wrap;
    }

    // ---- Declarations ----
    _renderDeclarationTable(kind) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        const config = DECLARATION_CONFIG[kind];
        if (!config) return wrap;

        wrap.innerHTML = `<div class="section-title">${config.title}</div>`;

        // Table of existing
        const list = config.getList(this.doc);
        if (list.length > 0) {
            const header = document.createElement('div');
            header.className = 'declaration-header';
            header.style.display = 'grid';
            header.style.gridTemplateColumns = config.gridCols;
            header.style.gap = '0.4rem';
            header.innerHTML = config.headers.map(h => `<div>${h}</div>`).join('');
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
            // Bind input change handlers
            row.querySelectorAll('input, select').forEach(inp => {
                inp.addEventListener('change', () => {
                    config.updateFromRow(this.doc, item.id, row);
                    this.onChange();
                });
            });
            wrap.appendChild(row);
        });

        // Add button
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

            item.innerHTML = `
                <div class="req-item-header">
                    <span class="req-id">${req.id} ${statusDot}</span>
                    <button class="req-delete" title="Delete">✕</button>
                </div>
                <div>${req.statement}</div>
                <div class="req-badges">
                    ${req.asil ? `<span class="req-badge ${asilClass}">ASIL ${req.asil}</span>` : ''}
                    ${req.verification ? `<span class="req-badge">Verif: ${req.verification}</span>` : ''}
                    ${req.parentSG ? `<span class="req-badge">→ ${req.parentSG}</span>` : ''}
                    ${req.ftti ? `<span class="req-badge">FTTI ${req.ftti}</span>` : ''}
                    ${req.source ? `<span class="req-badge">src: ${req.source}</span>` : ''}
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
        headers: ['ID', 'Name', 'Description', '', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.itemFunctions,
        add: doc => doc.itemFunctions.push(new ItemFunction({ name: 'New function' })),
        remove: (doc, id) => { doc.itemFunctions = doc.itemFunctions.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.itemFunctions.find(x => x.id === id);
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.description = inputs[1].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name || '').replace(/"/g,'&quot;')}" placeholder="Function name">
            <input type="text" value="${(item.description || '').replace(/"/g,'&quot;')}" placeholder="Description">
            <div></div>
            <button class="del-btn req-delete">✕</button>
        `
    },
    mode: {
        title: 'Operating Modes',
        singular: 'Mode',
        headers: ['ID', 'Name', 'Description', 'Safe?', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.modes,
        add: doc => doc.modes.push(new Mode({ name: 'New mode' })),
        remove: (doc, id) => { doc.modes = doc.modes.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.modes.find(x => x.id === id);
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.description = inputs[1].value;
            item.isSafeState = inputs[2].checked;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Mode name">
            <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="Description">
            <input type="checkbox" ${item.isSafeState ? 'checked' : ''} style="justify-self:center;">
            <button class="del-btn req-delete">✕</button>
        `
    },
    assumption: {
        title: 'Assumptions of Use',
        singular: 'Assumption',
        headers: ['ID', 'Text', 'Owner', 'Status', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.assumptions,
        add: doc => doc.assumptions.push(new Assumption({ text: 'New assumption' })),
        remove: (doc, id) => { doc.assumptions = doc.assumptions.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.assumptions.find(x => x.id === id);
            const inputs = row.querySelectorAll('input, select');
            item.text = inputs[0].value;
            item.owner = inputs[1].value;
            item.status = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.text||'').replace(/"/g,'&quot;')}" placeholder="Assumption text">
            <input type="text" value="${(item.owner||'').replace(/"/g,'&quot;')}" placeholder="Owner">
            <select><option ${item.status==='open'?'selected':''}>open</option><option ${item.status==='closed'?'selected':''}>closed</option></select>
            <button class="del-btn req-delete">✕</button>
        `
    },
    safetyGoal: {
        title: 'Safety Goals',
        singular: 'Safety Goal',
        headers: ['ID', 'Name', 'ASIL', 'FTTI', ''],
        gridCols: '90px 1fr 80px 100px 40px',
        getList: doc => doc.safetyGoals,
        add: doc => doc.safetyGoals.push(new SafetyGoal({ name: 'New SG' })),
        remove: (doc, id) => { doc.safetyGoals = doc.safetyGoals.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.safetyGoals.find(x => x.id === id);
            const inputs = row.querySelectorAll('input, select');
            item.name = inputs[0].value;
            item.asil = inputs[1].value;
            item.ftti = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="SG name">
            <select>${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
            <input type="text" value="${(item.ftti||'').replace(/"/g,'&quot;')}" placeholder="e.g. 1 s">
            <button class="del-btn req-delete">✕</button>
        `
    },
    element: {
        title: 'System Elements',
        singular: 'Element',
        headers: ['ID', 'Name', 'Purpose', 'ASIL', ''],
        gridCols: '90px 1fr 1fr 80px 40px',
        getList: doc => doc.elements,
        add: doc => doc.elements.push(new Element({ name: 'NewElement', asil: 'QM' })),
        remove: (doc, id) => { doc.elements = doc.elements.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.elements.find(x => x.id === id);
            const inputs = row.querySelectorAll('input, select');
            item.name = inputs[0].value;
            item.purpose = inputs[1].value;
            item.asil = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Element name (no spaces)">
            <input type="text" value="${(item.purpose||'').replace(/"/g,'&quot;')}" placeholder="One-sentence purpose">
            <select>${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
            <button class="del-btn req-delete">✕</button>
        `
    },
    interface: {
        title: 'External Interfaces',
        singular: 'Interface',
        headers: ['ID', 'Name', 'Producer', 'Consumer', ''],
        gridCols: '90px 1fr 1fr 1fr 40px',
        getList: doc => doc.interfaces,
        add: doc => doc.interfaces.push(new InterfaceSpec({ name: 'NewIF' })),
        remove: (doc, id) => { doc.interfaces = doc.interfaces.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.interfaces.find(x => x.id === id);
            const inputs = row.querySelectorAll('input');
            item.name = inputs[0].value;
            item.producer = inputs[1].value;
            item.consumer = inputs[2].value;
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Interface name">
            <input type="text" value="${(item.producer||'').replace(/"/g,'&quot;')}" placeholder="Producer">
            <input type="text" value="${(item.consumer||'').replace(/"/g,'&quot;')}" placeholder="Consumer">
            <button class="del-btn req-delete">✕</button>
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
