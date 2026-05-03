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
        this.editingExisting = false;
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

        // Owner / signoff name autocomplete is used by both the
        // declaration tables (Assumptions of Use → Owner) and the
        // signoff input at the bottom of every chapter. Render once
        // per chapter, before anything that references it.
        container.appendChild(this._renderOwnerDatalist());

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

        // Chapter 7 root: when no element is selected, show a diagnostic
        // table — one row per declared element with budget, ASIL, gap
        // flags. Replaces the empty "select an element" state. (F1)
        if (this.currentChapter.autoExpand === 'elements' && !this.currentElement) {
            container.appendChild(this._renderElementDiagnostic());
        }

        // Allocation-matrix-first chapters (HW, SW, Calibration). The
        // matrix is the primary tool; "+ Add Requirement" stays at the
        // bottom for the rare new requirement that doesn't allocate
        // from elsewhere. (I1, J1)
        if (this.currentChapter.id === 'ch10_hw'
                || this.currentChapter.id === 'ch11_sw'
                || this.currentChapter.id === 'ch13_calibration') {
            container.appendChild(this._renderAllocationMatrix());
        }

        // Chapter 9 HSI signal coverage diagnostic (H1). Cross-tabulates
        // interfaces declared in Ch.6 against requirements written here,
        // flagging signals that lack period / failure behaviour / type.
        if (this.currentChapter.id === 'ch09_hsi') {
            container.appendChild(this._renderHsiDiagnostic());
        }

        // Checklist
        container.appendChild(this._renderChecklist());

        // Requirements section (only if chapter allows or we're on element leaf)
        if (this.currentChapter.allowsRequirements || this.currentElement) {
            container.appendChild(this._renderRequirementBuilder());
            container.appendChild(this._renderRequirementsList());
        }
    }

    /**
     * HSI Signal Diagnostic (H1). Per-interface row showing what c9a
     * requires (ID, direction, type, range, resolution, period, jitter,
     * failure behaviour) and which fields are filled in for that
     * interface. Helps the user see which signals are still missing
     * SMART data without leaving Ch.9.
     */
    _renderHsiDiagnostic() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">HSI Signal Coverage <span class="help-icon" title="Each interface declared in Chapter 6 should have direction, type, range, period, jitter, failure behaviour. Missing fields are flagged here. Edit the interface row in Ch.6 to fill them.">?</span></div>`;

        const ifs = this.doc.interfaces || [];
        if (ifs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No interfaces declared yet — add them in Chapter 6 (External Interfaces).';
            wrap.appendChild(empty);
            return wrap;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:auto;';

        const cols = '90px 1fr 70px 90px 70px 70px 70px 70px 70px 90px';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `
            <div>ID</div><div>Name</div><div>Kind</div><div>Direction</div>
            <div>Type</div><div>Range</div><div>Unit</div><div>Period</div><div>Jitter</div><div>Failure</div>
        `;
        table.appendChild(head);

        ifs.forEach(item => {
            const dot = (val) => val ? '<span style="color:#198754;">✓</span>' : '<span style="color:#dc3545;">—</span>';
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:12px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#666;">${item.id}</div>
                <div>${(item.name||'(unnamed)').replace(/[<>]/g,'')}</div>
                <div>${item.kind || '—'}</div>
                <div>${item.direction || '—'}</div>
                <div>${dot(item.dataType)}</div>
                <div>${dot(item.range)}</div>
                <div>${dot(item.unit)}</div>
                <div>${dot(item.period)}</div>
                <div>${dot(item.jitter)}</div>
                <div>${dot(item.failureBehavior)}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        return wrap;
    }

    /**
     * Chapter 7 root diagnostic. One row per declared element:
     * name, ASIL, requirement count vs 4–13 budget, allocated functions,
     * traceability gap flags. Click a row to drill into that element.
     */
    _renderElementDiagnostic() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Element Coverage Diagnostic <span class="help-icon" title="Per-element status: requirement count vs 4–13 budget, ASIL, gap flags. Click an element name on the left or in this table to drill in.">?</span></div>`;

        if (!this.doc.elements || this.doc.elements.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No elements declared yet — add them in Chapter 6.';
            wrap.appendChild(empty);
            return wrap;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';

        const head = document.createElement('div');
        head.style.cssText = 'display:grid;grid-template-columns:1.5fr 80px 100px 1fr 1fr 1fr 1.5fr;gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;';
        head.innerHTML = `
            <div>Element <span class="help-icon" title="Element name. Click to open its requirements page.">?</span></div>
            <div>ASIL</div>
            <div>Reqs / 4–13 <span class="help-icon" title="Per-leaf requirement budget is 4–13. Below 4 = under-specified; above 13 = consider decomposition.">?</span></div>
            <div>Allocated fns <span class="help-icon" title="Item functions allocated to this element (Element.allocatedItemFunctions).">?</span></div>
            <div>Has parent SG <span class="help-icon" title="Whether at least one element req on this element references a parent Safety Goal.">?</span></div>
            <div>Has acceptance <span class="help-icon" title="Whether at least one element req on this element traces to a parent acceptance requirement.">?</span></div>
            <div>Status</div>
        `;
        table.appendChild(head);

        const validator = new DocumentValidator(this.doc);
        const cov = validator.elementCoverage();
        cov.forEach(c => {
            const reqs = this.doc.requirementsForElement(c.id);
            const hasSG = reqs.some(r => r.parentSG);
            const hasAccept = reqs.some(r =>
                Array.isArray(r.parentAcceptanceReqs) && r.parentAcceptanceReqs.length > 0);
            // Status synthesises everything into one badge.
            let status = 'green';
            const issues = [];
            if (c.empty)            { status = 'red';    issues.push('no requirements'); }
            else if (c.overBudget)  { status = 'red';    issues.push(`${c.reqCount} > 13`); }
            else if (c.underBudget) { status = 'orange'; issues.push(`${c.reqCount} < 4`); }
            if (!hasSG)             { if (status === 'green') status = 'orange'; issues.push('no parent SG'); }
            if (!hasAccept)         { if (status === 'green') status = 'orange'; issues.push('no parent acceptance'); }
            const statusLabel = status === 'green' ? '✓ ok' : status === 'orange' ? '⚠ ' + issues.join(', ') : '✗ ' + issues.join(', ');

            const row = document.createElement('div');
            row.style.cssText = 'display:grid;grid-template-columns:1.5fr 80px 100px 1fr 1fr 1fr 1.5fr;gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;cursor:pointer;align-items:center;';
            row.innerHTML = `
                <div style="font-weight:500;color:#0d6efd;">${(c.name || '(unnamed)')}</div>
                <div>${c.asil || 'QM'}</div>
                <div>${c.reqCount} <span class="completeness-dot ${status}" style="margin-left:6px;"></span></div>
                <div>${c.allocatedCount}</div>
                <div>${hasSG ? '✓' : '—'}</div>
                <div>${hasAccept ? '✓' : '—'}</div>
                <div title="${statusLabel.replace(/"/g,'&quot;')}">${statusLabel}</div>
            `;
            row.addEventListener('mouseenter', () => row.style.background = '#f8f9fa');
            row.addEventListener('mouseleave', () => row.style.background = '');
            row.addEventListener('click', () => {
                // Route through main's onChapterSelected so left pane updates too.
                if (typeof onChapterSelected === 'function') {
                    onChapterSelected(this.currentChapter.id, c.id);
                }
            });
            table.appendChild(row);
        });

        wrap.appendChild(table);
        return wrap;
    }

    /**
     * Allocation matrix for HW (Ch.10), SW (Ch.11), and Calibration
     * (Ch.13) chapters. Rows: existing FSRs / acceptance reqs that
     * could be allocated. Columns: declared elements (filtered by
     * obvious HW/SW kind heuristic if available, else all). Click an
     * intersection to toggle whether that requirement is allocated to
     * that element. Stored on the requirement's `allocation` array.
     */
    _renderAllocationMatrix() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        const ch = this.currentChapter.id;
        const titleMap = {
            ch10_hw: 'HW Allocation Matrix',
            ch11_sw: 'SW Allocation Matrix',
            ch13_calibration: 'Calibration Allocation Matrix'
        };
        wrap.innerHTML = `<div class="section-title">${titleMap[ch] || 'Allocation Matrix'} <span class="help-icon" title="Allocate existing FSR / acceptance / element requirements to elements. Tick a cell to mark the requirement as allocated to that element. Storage: Requirement.allocation array of element IDs.">?</span></div>`;

        const elements = this.doc.elements || [];
        if (elements.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No elements declared yet — add them in Chapter 6.';
            wrap.appendChild(empty);
            return wrap;
        }

        // Source rows: prefer requirements that are *not* in this chapter
        // (the matrix is for allocating *upstream* requirements) — FSRs,
        // acceptance, element. We exclude this chapter's own requirements.
        const rows = this.doc.requirements.filter(r => r.chapterId !== ch);
        if (rows.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No upstream requirements yet — author them in Ch. 4, 5 or 7 first.';
            wrap.appendChild(empty);
            return wrap;
        }

        const cols = `260px ${elements.map(()=>'80px').join(' ')}`;
        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:auto;max-height:500px;';

        // Header
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};background:#f8f9fa;border-bottom:1px solid #dee2e6;position:sticky;top:0;`;
        head.innerHTML = `<div style="padding:6px 10px;font-size:11px;text-transform:uppercase;font-weight:600;color:#666;">Requirement</div>` +
            elements.map(e => `<div style="padding:6px 4px;font-size:11px;font-weight:600;color:#666;text-align:center;writing-mode:vertical-rl;transform:rotate(180deg);height:80px;" title="${(e.purpose||'').replace(/"/g,'&quot;')}">${e.name||e.id} <small style="font-weight:400;">(${e.asil||'QM'})</small></div>`).join('');
        table.appendChild(head);

        // Rows
        rows.forEach(req => {
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};border-bottom:1px solid #f0f0f0;`;
            const stmt = (req.statement || '').slice(0, 80) || '(incomplete)';
            row.innerHTML = `<div style="padding:6px 10px;font-size:12px;"><div style="font-family:monospace;font-size:10px;color:#666;">${req.id}</div><div title="${stmt.replace(/"/g,'&quot;')}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${stmt}</div></div>` +
                elements.map(e => {
                    const allocated = (req.allocation || []).includes(e.id);
                    return `<div style="padding:6px 4px;text-align:center;border-left:1px solid #f0f0f0;"><input type="checkbox" data-alloc="${e.id}" ${allocated?'checked':''}></div>`;
                }).join('');
            row.querySelectorAll('input[data-alloc]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const elemId = cb.getAttribute('data-alloc');
                    if (cb.checked) {
                        if (!Array.isArray(req.allocation)) req.allocation = [];
                        if (!req.allocation.includes(elemId)) req.allocation.push(elemId);
                    } else {
                        req.allocation = (req.allocation || []).filter(x => x !== elemId);
                    }
                    this.onChange();
                });
            });
            table.appendChild(row);
        });

        wrap.appendChild(table);
        return wrap;
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
            // Optional `help` text (added in outline.js for items where the
            // user asked for clarification — e.g. HARA, item-def doc ref).
            // Renders as a `?` icon next to the label; the custom tooltip
            // layer reveals the explanation on hover.
            const helpIcon = item.help
                ? ` <span class="help-icon" title="${item.help.replace(/"/g, '&quot;')}">?</span>`
                : '';
            row.innerHTML = `
                <input type="checkbox" id="chk-${item.id}" ${checked}>
                <label for="chk-${item.id}">${item.text}${helpIcon}</label>
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

            // Optional post-render hook — used by configs that need to
            // mount real widgets (multi-select dropdowns, etc.) into
            // placeholder nodes inside renderRow's HTML. The third arg
            // is the document; the fourth is a refresh callback the
            // widget can call to trigger a full re-render once it's
            // safe to do so (typically on popover close, never during
            // an open in-flight selection — same anti-flicker reason
            // text inputs no longer re-render on input).
            if (typeof config.postRender === 'function') {
                config.postRender(row, item, this.doc, () => this.onChange());
            }

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
    /**
     * Per-chapter datalist mount point. Renders one HTML5 datalist for
     * each autocomplete category referenced by the chapter's inputs.
     * Native browser datalists, no library. Categories rendered:
     *   owners-datalist     : owner / signoff names (assumptions, signoffs, lexicon)
     *   lex-producers       : interface producers (declared elements + lexicon)
     *   lex-consumers       : interface consumers (declared elements + lexicon)
     */
    _renderOwnerDatalist() {
        const wrap = document.createElement('div');
        wrap.style.display = 'none';

        const mkList = (id, values) => {
            const dl = document.createElement('datalist');
            dl.id = id;
            const seen = new Set();
            values.forEach(v => {
                if (!v) return;
                const s = String(v).trim();
                if (!s || seen.has(s)) return;
                seen.add(s);
                const opt = document.createElement('option');
                opt.value = s;
                dl.appendChild(opt);
            });
            return dl;
        };

        const owners = [
            ...(this.doc.assumptions || []).map(a => a.owner),
            ...Object.values(this.doc.signoffs || {}).map(s => s && s.owner),
            ...((this.doc.lexicon && this.doc.lexicon.owners) || []),
            ...((this.doc.lexicon && this.doc.lexicon.signoffNames) || [])
        ];
        wrap.appendChild(mkList('owners-datalist', owners));

        const elementNames = (this.doc.elements || []).map(e => e.name);
        const producers = [
            ...elementNames,
            ...((this.doc.lexicon && this.doc.lexicon.producers) || [])
        ];
        const consumers = [
            ...elementNames,
            ...((this.doc.lexicon && this.doc.lexicon.consumers) || [])
        ];
        wrap.appendChild(mkList('lex-producers', producers));
        wrap.appendChild(mkList('lex-consumers', consumers));

        return wrap;
    }

    // ---- Requirement builder (SMART input) ----
    _renderRequirementBuilder() {
        const wrap = document.createElement('div');
        wrap.className = 'req-builder';
        // Title and behaviour vary by whether we're editing an existing
        // saved requirement (loaded into the draft via Edit) or drafting
        // a brand new one. The editingExisting flag is set/cleared by
        // the Edit click and by _commitRequirement / _cancelEdit.
        const titleText = this.editingExisting
            ? `Editing ${this.draftReq.id}`
            : 'New Requirement';
        wrap.innerHTML = `<h6>${titleText}</h6>`;

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
                    // Field-id → lexicon-category map. The lexicon stores
                    // pluralised category names ('capabilities') while the
                    // Requirement's slot is singular ('capability'). Any
                    // field not in this map renders without autocomplete.
                    const lexCat = ({
                        capability:'capabilities', actor:'actors',
                        condition:'conditions',  reaction:'reactions',
                        trigger:'triggers',      input:'inputs',
                        output:'outputs',        property:'properties',
                        unit:'units',            tolerance:'tolerances',
                        standard:'standards',    fromState:'fromStates',
                        toState:'toStates',      prohibitedBehavior:'prohibitedBehaviors',
                        boundingCondition:'boundingConditions'
                    })[f.id];
                    const slot = this._makeInputSlot(
                        f.label + (f.required ? ' *' : ''),
                        this.draftReq[f.id] || '',
                        v => { this.draftReq[f.id] = v; this._refreshPreview(wrap); },
                        f.hint,
                        lexCat
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

        // Action buttons. Drafting → "+ Add Requirement". Editing an
        // existing one → "Save Changes" + "Cancel" so the user can
        // discard a mid-edit and go back to the saved state.
        const actions = document.createElement('div');
        actions.style.marginTop = '0.75rem';
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';

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

    /**
     * Attribute panel — fields shown depend on chapter.
     *
     * Per-chapter requirement-attribute schema (C3 from user feedback).
     * The previous version showed the same generic set everywhere
     * (Source / Verification / Pass / Safe State Ref) which doesn't fit
     * FSRs vs acceptance vs element vs HSI vs calibration.
     *
     *   Ch.4 FSC                — parent SG, ASIL, allocation, safe state
     *                             ref, FTTI contribution, warning &
     *                             degradation strategy, end-user
     *                             supervision assumption
     *   Ch.5 acceptance         — parent FSR(s), parent item function(s),
     *                             pass criterion, verification, ASIL,
     *                             mode applicability
     *   Ch.7 element            — parent acceptance req, ASIL, element
     *                             allocation (read from currentElement),
     *                             mode applicability
     *   Ch.9 HSI                — uses predicate-specific fields for
     *                             signal name / direction / type / range
     *                             via the "process" + "interface"
     *                             predicates, plus rationale & verif
     *   Ch.10/11 HW/SW          — allocation matrix is the primary tool;
     *                             attributes here are minimal (rationale,
     *                             verification, ASIL, parent FSR)
     *   Ch.13 calibration       — parameter name, range, default, units,
     *                             precision, persistence/write-protect
     *                             via predicate-specific slots; minimal
     *                             attributes
     *   Other / default         — original generic set
     */
    _renderAttributesPanel(wrap) {
        const panel = document.createElement('div');
        panel.className = 'req-attributes';
        const ch = this.currentChapter ? this.currentChapter.id : '';

        // Rationale is universal.
        panel.appendChild(this._makeInputSlot('Rationale *', this.draftReq.rationale,
            v => { this.draftReq.rationale = v; this._refreshPreview(wrap); }, 'Why this requirement exists'));

        // ASIL is universal where safety is in scope — that's everywhere
        // except calibration (where it's optional).
        const asilOpts = [{value:'',label:'— select —'},
                          ...GRAMMAR.asilLevels.map(a => ({value: a, label: a}))];

        if (ch === 'ch04_fsc') {
            // FSR fields. Parent SG mandatory, FTTI contribution, safe
            // state ref against the SafeState catalog (SS-IDs), warning
            // and degradation strategies, end-user supervision assumption.
            panel.appendChild(this._makeSelectSlot('Parent Safety Goal *',
                this._sgOptions(),
                this.draftReq.parentSG,
                v => { this.draftReq.parentSG = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts,
                this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('FTTI contribution', this.draftReq.fttiContribution,
                v => { this.draftReq.fttiContribution = v; this._refreshPreview(wrap); },
                'Time budget consumed by this FSR (e.g. 80 ms of 1 s SG FTTI)'));
            panel.appendChild(this._makeSelectSlot('Safe state ref',
                this._safeStateOptions(),
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
            panel.appendChild(this._makeInputSlot('Verification method',
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); },
                'inspection / analysis / test / simulation'));
        }
        else if (ch === 'ch05_acceptance') {
            // Acceptance fields. Trace upward to FSR(s) and item
            // function(s); pass criterion is mandatory; mode applicability.
            this._mountMultiSelectAttr(panel, 'Parent FSR(s)', 'parentFsrs',
                this.doc.requirementsForChapter('ch04_fsc').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No FSRs declared yet — author them in Chapter 4.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet — author them in Chapter 2.');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts,
                this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *',
                [{value:'',label:'— select —'}, ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))],
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion *', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); },
                'Quantitative acceptance threshold'));
            this._mountMultiSelectAttr(panel, 'Mode applicability', 'modeApplicability',
                this.doc.modes.map(m => ({ value: m.id, label: m.name || m.id })),
                'No modes declared yet — author them in Chapter 6.');
        }
        else if (ch === 'ch07_elements') {
            // Element fields. Parent acceptance req, ASIL, mode
            // applicability. Element allocation is implicit (the row's
            // currentElement). Capability/actor live on the predicate
            // slots and don't need attribute-panel duplicates.
            this._mountMultiSelectAttr(panel, 'Parent acceptance req(s)', 'parentAcceptanceReqs',
                this.doc.requirementsForChapter('ch05_acceptance').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No acceptance requirements yet — author them in Chapter 5.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet.');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts,
                this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method',
                [{value:'',label:'— select —'}, ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))],
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            this._mountMultiSelectAttr(panel, 'Mode applicability', 'modeApplicability',
                this.doc.modes.map(m => ({ value: m.id, label: m.name || m.id })),
                'No modes declared yet.');
        }
        else if (ch === 'ch10_hw' || ch === 'ch11_sw') {
            // HW/SW summary chapters: allocation is via the matrix
            // (rendered separately). Attribute panel collects parent
            // FSR(s) — structured array, name-resolved, multi-select.
            // The matrix at the top of the chapter shows allocation
            // to elements; here we capture which FSR(s) demanded the
            // HW or SW safety mechanism.
            this._mountMultiSelectAttr(panel, 'Parent FSR(s)', 'parentFsrs',
                this.doc.requirementsForChapter('ch04_fsc').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No FSRs declared yet — author them in Chapter 4.');
            panel.appendChild(this._makeSelectSlot('ASIL *', asilOpts,
                this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method',
                [{value:'',label:'— select —'}, ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))],
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
        }
        else {
            // Default schema (HSI, calibration, env, cyber, HMI,
            // lifecycle, and anything else not specifically handled).
            // Predicate-specific slots carry the SMART detail; here we
            // capture the universal traceability + verification fields
            // through the same structured multi-selects used elsewhere
            // — no more "Source (upstream ID)" free text. The user
            // searches and picks from a list; storage is by ID, display
            // is by name.
            this._mountMultiSelectAttr(panel, 'Parent FSR(s)', 'parentFsrs',
                this.doc.requirementsForChapter('ch04_fsc').map(r => ({
                    value: r.id, label: `${r.id} — ${(r.statement || '').slice(0, 60) || '(no statement)'}`
                })), 'No FSRs declared yet — author them in Chapter 4.');
            this._mountMultiSelectAttr(panel, 'Parent item function(s)', 'parentItemFunctions',
                this.doc.itemFunctions.map(f => ({ value: f.id, label: f.name || f.id })),
                'No item functions declared yet — author them in Chapter 2.');
            panel.appendChild(this._makeSelectSlot('Parent Safety Goal',
                this._sgOptions(),
                this.draftReq.parentSG,
                v => { this.draftReq.parentSG = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('Verification method *',
                [{value:'',label:'— select —'}, ...GRAMMAR.verificationMethods.map(m => ({value: m.id, label: m.label}))],
                this.draftReq.verification,
                v => { this.draftReq.verification = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeInputSlot('Pass criterion', this.draftReq.passCriterion,
                v => { this.draftReq.passCriterion = v; this._refreshPreview(wrap); }));
            panel.appendChild(this._makeSelectSlot('ASIL', asilOpts,
                this.draftReq.asil,
                v => { this.draftReq.asil = v; this._refreshPreview(wrap); }));
        }

        return panel;
    }

    /** Build {value,label} options for declared SGs with integrity level appended. */
    _sgOptions() {
        return [{value:'',label:'— select —'},
                ...this.doc.safetyGoals.map(g => ({
                    value: g.id,
                    label: `${g.name || g.id} (${g.asil || 'QM'})`
                }))];
    }

    /** Build {value,label} options for declared SafeStates. */
    _safeStateOptions() {
        return [{value:'',label:'None'},
                ...(this.doc.safeStates || []).map(s => ({
                    value: s.id,
                    label: s.description || s.id
                }))];
    }

    /**
     * Mount a multi-select dropdown bound to a Requirement attribute that
     * holds an array of IDs (e.g. parentFsrs, parentItemFunctions,
     * modeApplicability). Re-uses MultiSelectDropdown so the look matches
     * the mode↔function picker. Panel layout: full-width row.
     */
    _mountMultiSelectAttr(panel, label, attrName, options, emptyLabel) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        slot.style.flexBasis = '100%';
        slot.innerHTML = `<label>${label}</label>`;
        const mount = document.createElement('span');
        slot.appendChild(mount);
        panel.appendChild(slot);
        const ms = new MultiSelectDropdown(
            options,
            this.draftReq[attrName] || [],
            (newIds) => { this.draftReq[attrName] = newIds; },
            { unitLabel: 'item',
              emptyLabel: emptyLabel || 'No options available.' });
        mount.replaceWith(ms.element);
    }

    /**
     * Resolve a legacy free-text `source` field (often "ITEMF-0001 SG-0002")
     * to a comma-separated string of human names. IDs that don't resolve
     * to anything declared are passed through unchanged so the user can
     * see what's broken.
     */
    _resolveSourceTokens(src) {
        if (!src) return '';
        return String(src).split(/[\s,]+/)
            .filter(Boolean)
            .map(tok => this.doc.nameForId(tok))
            .join(', ');
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

        // Edit vs new. When editing existing, draftReq is the same
        // object reference already in doc.requirements — edits are
        // already applied in place. We just bank lexicon and refresh.
        // When new, allocate a real sequential ID and append.
        const r = this.draftReq;
        if (!this.editingExisting) {
            r.id = this.doc.nextId('requirement');
            this.doc.requirements.push(r);
        }
        r.modifiedAt = new Date().toISOString();

        // Bank free-text predicate-slot values into the lexicon so the
        // next requirement gets autocomplete suggestions for the same
        // kind of slot. Done on edit too — fresh values typed during
        // an edit are equally useful.
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

        this.editingExisting = false;
        this.draftReq = this._newDraft();
        this.onChange();
    }

    /**
     * Cancel an in-progress edit. The committed copy on disk has
     * not been touched yet (we edit in place on the same object
     * reference), so a cancel after typing means those typed values
     * are already in the saved object — there's no undo. Reload from
     * file is the only way back. We document this by simply throwing
     * away the editing flag and starting a new draft.
     *
     * Phase note: a real undo would require deep-cloning on Edit and
     * only writing back on Save Changes. Not done in this round
     * because it doubles the surface area; revisit if users hit it.
     */
    _cancelEdit() {
        this.editingExisting = false;
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

            const asilClass = GRAMMAR.asilCssClass(req.asil);

            const asilTitles = {
                'QM':     'Quality Management — no safety integrity beyond standard QM.',
                'ASIL-A': 'ASIL A — lowest safety integrity (ISO 26262). Failure could cause light/moderate injury.',
                'ASIL-B': 'ASIL B — moderate integrity (ISO 26262).',
                'ASIL-C': 'ASIL C — high integrity (ISO 26262).',
                'ASIL-D': 'ASIL D — highest integrity (ISO 26262). Failure could be life-threatening.',
                'SIL-1':  'SIL 1 — lowest integrity (IEC 61508).',
                'SIL-2':  'SIL 2 — moderate integrity (IEC 61508).',
                'SIL-3':  'SIL 3 — high integrity (IEC 61508).',
                'SIL-4':  'SIL 4 — highest integrity (IEC 61508).'
            };

            item.innerHTML = `
                <div class="req-item-header">
                    <span class="req-id" title="Internal stable ID. References use this.">${req.id} ${statusDot}</span>
                    <span>
                        <button class="req-edit" title="Edit this requirement" style="background:none;border:none;color:#0d6efd;cursor:pointer;font-size:13px;padding:0 6px;">✎ Edit</button>
                        <button class="req-delete" title="Delete this requirement">✕</button>
                    </span>
                </div>
                <div>${req.statement}</div>
                <div class="req-badges">
                    ${req.asil ? `<span class="req-badge ${asilClass}" title="${(asilTitles[req.asil] || 'Safety integrity level').replace(/"/g,'&quot;')}">${req.asil}</span>` : ''}
                    ${req.verification ? `<span class="req-badge" title="Verification method assigned to this requirement.">Verif: ${req.verification}</span>` : ''}
                    ${req.parentSG ? `<span class="req-badge" title="Parent Safety Goal — this requirement contributes to satisfying it.">→ ${this.doc.nameForId(req.parentSG)}</span>` : ''}
                    ${req.safeStateRef ? `<span class="req-badge" title="Safe state reached as the fault reaction.">SS: ${this.doc.nameForId(req.safeStateRef)}</span>` : ''}
                    ${req.ftti ? `<span class="req-badge" title="Fault Tolerant Time Interval.">FTTI ${req.ftti}</span>` : ''}
                    ${req.fttiContribution ? `<span class="req-badge" title="FTTI time budget consumed by this FSR.">FTTI+ ${req.fttiContribution}</span>` : ''}
                    ${(req.parentFsrs || []).map(id => `<span class="req-badge" title="Parent FSR — this requirement traces from it.">⟵ FSR ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.parentAcceptanceReqs || []).map(id => `<span class="req-badge" title="Parent acceptance requirement.">⟵ Acc ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.parentItemFunctions || []).map(id => `<span class="req-badge" title="Item function this requirement realises.">fn ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.modeApplicability || []).map(id => `<span class="req-badge" title="Active in this mode.">mode ${this.doc.nameForId(id)}</span>`).join('')}
                    ${(req.allocation || []).map(id => `<span class="req-badge" title="Allocated to this element.">⊳ ${this.doc.nameForId(id)}</span>`).join('')}
                    ${req.source ? `<span class="req-badge" style="background:#f0f0f0;color:#999;" title="Legacy free-text source field. The structured Parent FSR / Parent item function / Parent SG fields above replace this — no new requirements use it.">legacy src: ${this._resolveSourceTokens(req.source)}</span>` : ''}
                </div>
                ${req.rationale ? `<div style="font-size:11px;color:#666;margin-top:0.3rem;"><em>Rationale:</em> ${req.rationale}</div>` : ''}
            `;
            item.querySelector('.req-edit').addEventListener('click', () => {
                // Edit: load this req as the working draft, mark its ID
                // so commit replaces in place rather than appending. The
                // draftReq reference holds the *original* object so any
                // edits land directly on it; commit just validates and
                // re-runs lexicon banking.
                this.draftReq = req;
                this.editingExisting = true;
                this.onChange();
                // Scroll to builder once the new render is in DOM.
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

    // ---- Traceability view for Chapter 20 ----
    _renderTraceability() {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Trace Matrix (auto-generated) <span class="help-icon" title="Built from structured parent fields on every requirement: parentSG, parentFsrs, parentAcceptanceReqs, parentItemFunctions, allocation. Edit a requirement to change a trace.">?</span></div>`;
        const validator = new DocumentValidator(this.doc);

        const sgCov = validator.safetyGoalCoverage();
        const fnCov = validator.itemFunctionCoverage();
        const orphans = validator.orphanReport();

        let html = '<h6 style="font-size:12px;">Safety Goal Coverage</h6>';
        if (sgCov.length === 0) {
            html += '<p class="text-muted small">No Safety Goals declared.</p>';
        } else {
            html += '<table class="table table-sm table-bordered" style="font-size:12px;">';
            html += '<thead><tr><th>Safety Goal</th><th>Integrity</th><th>FTTI</th><th>FSR</th><th>Accept</th><th>Element</th><th>End-to-end</th></tr></thead><tbody>';
            sgCov.forEach(s => {
                html += `<tr>
                    <td>${(s.name || '(unnamed)')} <small style="color:#999;font-family:monospace;">${s.id}</small></td>
                    <td>${s.asil || 'QM'}</td>
                    <td>${s.ftti || '—'}</td>
                    <td title="${s.fsrCount} FSR(s) trace to this SG">${s.hasFsr ? `✓ ${s.fsrCount}` : '✗'}</td>
                    <td title="${s.acceptanceCount} acceptance req(s) trace through FSR(s)">${s.hasAcceptance ? `✓ ${s.acceptanceCount}` : '✗'}</td>
                    <td title="${s.elementCount} element req(s) trace through acceptance">${s.hasElement ? `✓ ${s.elementCount}` : '✗'}</td>
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
                    <td>${(f.name || '(unnamed)')} <small style="color:#999;font-family:monospace;">${f.id}</small></td>
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
            orphans.forEach(o => {
                html += `<li><strong>${this.doc.nameForId(o.id)}</strong> <small style="color:#999;font-family:monospace;">${o.id}</small>: ${o.issue}</li>`;
            });
            html += '</ul>';
        }
        wrap.innerHTML += html;
        return wrap;
    }

    // ---- Small UI helpers ----
    /**
     * Build a labelled <select> bound to a setter.
     *
     * Critical detail: when `value` is empty/null, we prepend an explicit
     * "— select —" option with value="". Without it, the browser's <select>
     * displays the first real option as if selected, but the model still
     * holds ''. The user clicks "the first option" thinking they've picked
     * it, no `change` fires (the browser thinks nothing changed), and the
     * model never updates. This was the root cause of "first predicate
     * cannot change" — the select looked picked, but wasn't.
     *
     * If the caller's option list already includes an empty-value entry
     * we don't add a duplicate.
     */
    _makeSelectSlot(label, options, value, onChange) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        const hasEmpty = options.some(o => o.value === '');
        const needPlaceholder = !value && !hasEmpty;
        const placeholder = needPlaceholder
            ? `<option value="" selected disabled>— select —</option>`
            : '';
        const opts = options.map(o =>
            `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`
        ).join('');
        slot.innerHTML = `<label>${label}</label><select>${placeholder}${opts}</select>`;
        slot.querySelector('select').addEventListener('change', (e) => onChange(e.target.value));
        return slot;
    }

    /**
     * Build a labelled <input> bound to a setter. Optionally wires the
     * input to a datalist of previously-typed values for the same kind
     * of slot ("capability", "actor", "condition", ...).
     *
     * The datalist is an HTML5 native <datalist> element rendered as a
     * sibling — no popover library, no jQuery. The browser shows the
     * suggestions as the user types. A new value typed here is banked
     * back into the lexicon at commit time (see _commitRequirement),
     * so vocabulary builds up over the project.
     *
     * @param {string}   label
     * @param {string}   value      current value
     * @param {Function} onChange   (newValue:string) => void
     * @param {string}   hint       placeholder text
     * @param {string}   lexCategory  optional doc.lexicon[<category>] key
     */
    _makeInputSlot(label, value, onChange, hint, lexCategory) {
        const slot = document.createElement('div');
        slot.className = 'req-slot';
        let listAttr = '';
        let listEl = '';
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
            'Name':            'Short, stable label. Stays the same across the project.',
            'Description':     'What this function does for the end-user. One sentence, observable behaviour, no implementation detail.',
            'Active in modes': 'Multi-select. Operating modes in which this function is active. Editing here is the same data as the "Active functions" column on the Operating Modes table — they are two views of the same many-to-many mapping.'
        },
        headers: ['ID', 'Name', 'Description', 'Active in modes', ''],
        gridCols: '90px 1fr 1fr 200px 40px',
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
            const inputs = row.querySelectorAll('input[type="text"]');
            item.name = inputs[0].value;
            item.description = inputs[1].value;
            // activeModes is written by the multi-select widget, not from
            // input scraping. Same pattern as safeState below.
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID. References use this; UI shows the name.">${item.id}</div>
            <input type="text" value="${(item.name || '').replace(/"/g,'&quot;')}" placeholder="e.g. Adaptive Cruise Control">
            <input type="text" value="${(item.description || '').replace(/"/g,'&quot;')}" placeholder="What does this function do for the end-user?">
            <span class="ms-mount" data-ms="active-modes"></span>
            <button class="del-btn req-delete" title="Delete this item function">✕</button>
        `,
        // Mounts the Active-in-modes picker. Storage canonicalises here:
        // ItemFunction.activeModes = [mode IDs]. The picker on the Mode
        // side reads this back via inverse lookup, so any change here is
        // reflected there on next render and vice versa.
        postRender: (row, item, doc, refresh) => {
            const mount = row.querySelector('.ms-mount[data-ms="active-modes"]');
            if (!mount) return;
            const modeOpts = doc.modes.map(m => ({
                value: m.id,
                label: m.name || `(unnamed ${m.id})`
            }));
            const ms = new MultiSelectDropdown(
                modeOpts, item.activeModes || [],
                (newRefs) => { item.activeModes = newRefs; },
                { unitLabel: 'mode',
                  emptyLabel: 'No operating modes declared yet — add them in the Operating Modes table.',
                  onClose: refresh });
            mount.replaceWith(ms.element);
        }
    },
    mode: {
        title: 'Operating Modes',
        singular: 'Mode',
        helpHeaders: {
            'Name':             'Short ID-style name for the mode (e.g. "Nominal", "Degraded", "Safe").',
            'Description':      'What is true while the system is in this mode? Behaviour, constraints, observable state.',
            'Active functions': 'Multi-select. Item functions that are active when the system is in this mode. Click to expand the picker. Editing here is the same data as the "Active in modes" column on the Item Functions table.',
            'Safe state?':      'Tick if this mode is a designated safe state per the system-level safe-state model. Safety Goals will reference these. Independent of the formal Safe States list — the boolean is a quick marker, the SafeState entity is the formal model with triggers and SG links.'
        },
        // Header was "Safe?" — too cryptic. "Safe state?" matches the
        // ISO 26262 vocabulary the user is actually trying to capture.
        // The new "Active functions" column is the primary edit point
        // for the mode↔function many-to-many; the Item Function table
        // mirrors the inverse view.
        headers: ['ID', 'Name', 'Description', 'Active functions', 'Safe state?', ''],
        gridCols: '90px 1fr 1fr 200px 100px 40px',
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
            const textInputs = row.querySelectorAll('input[type="text"]');
            item.name = textInputs[0].value;
            item.description = textInputs[1].value;
            const cb = row.querySelector('input[type="checkbox"]');
            if (cb) item.isSafeState = cb.checked;
            // active-functions is written via the multi-select onChange,
            // which updates each ItemFunction.activeModes (the canonical
            // store). Not scraped from the row here.
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. Nominal, Degraded, Safe">
            <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="What is true while in this mode?">
            <span class="ms-mount" data-ms="active-functions"></span>
            <input type="checkbox" ${item.isSafeState ? 'checked' : ''} style="justify-self:center;" title="Designated safe state — Safety Goals can reference this mode.">
            <button class="del-btn req-delete" title="Delete this mode">✕</button>
        `,
        // Mounts the Active-functions picker. Storage canonicalises on
        // ItemFunction.activeModes (see SyrsDocument helpers). Both this
        // picker and the inverse one on the Item Function row go through
        // the same setter so the data stays consistent.
        postRender: (row, item, doc, refresh) => {
            const mount = row.querySelector('.ms-mount[data-ms="active-functions"]');
            if (!mount) return;
            const fnOpts = doc.itemFunctions.map(f => ({
                value: f.id,
                label: f.name || `(unnamed ${f.id})`
            }));
            const selected = doc.activeFunctionsForMode(item.id);
            const ms = new MultiSelectDropdown(
                fnOpts, selected,
                (newRefs) => doc.setActiveFunctionsForMode(item.id, newRefs),
                { unitLabel: 'function',
                  emptyLabel: 'No item functions declared yet — add them in the Item Functions table above.',
                  onClose: refresh });
            mount.replaceWith(ms.element);
        }
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
    safeState: {
        title: 'Safe States',
        sectionHelp: 'A named safe condition (per ISO 26262 Part 1 / IEC 61508-4). Each safe state binds upward to one or more Safety Goals it satisfies, and downward to one or more Operating Modes that realize it. This list closes the c3d checklist (safe states cross-referenced to mode/state model).',
        singular: 'Safe State',
        helpHeaders: {
            'Description':  'Prose description — what is true while the system is in this safe state.',
            'Triggers':     'Conditions that demand the system enter this safe state (e.g. "Brake actuator failure", "Loss of valid lateral control input").',
            'Modes':        'Multi-select. Pick the declared Operating Mode(s) that realize this safe state. Click the row to expand the picker.',
            'Safety Goals': 'Multi-select. Pick the Safety Goal(s) that reference this safe state as their fault-reaction target.'
        },
        headers: ['ID', 'Description', 'Triggers', 'Modes', 'Safety Goals', ''],
        gridCols: '90px 1fr 1fr 200px 200px 40px',
        getList: doc => doc.safeStates,
        add: doc => {
            const ss = new SafeState();
            ss.id = doc.nextId('safeState');
            doc.safeStates.push(ss);
        },
        remove: (doc, id) => { doc.safeStates = doc.safeStates.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.safeStates.find(x => x.id === id);
            if (!item) return;
            const inputs = row.querySelectorAll('input[type="text"]');
            item.description = inputs[0].value;
            item.triggers    = inputs[1].value;
            // modeRefs / sgRefs are written by the multi-select widgets'
            // onChange callbacks, not from input scraping.
        },
        renderRow: item => `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="Description (what is true here)">
            <input type="text" value="${(item.triggers||'').replace(/"/g,'&quot;')}" placeholder="Trigger conditions">
            <span class="ms-mount" data-ms="modes"></span>
            <span class="ms-mount" data-ms="sgs"></span>
            <button class="del-btn req-delete" title="Delete this safe state">✕</button>
        `,
        // Mount the two MultiSelectDropdowns into the placeholder spans.
        // The widgets write directly to item.modeRefs / item.sgRefs;
        // a full re-render is fired on popover close so the right-pane
        // summary picks up the change. The text inputs above stay live
        // and don't need a re-render (Phase 1 click-twice fix).
        postRender: (row, item, doc, refresh) => {
            const modesMount = row.querySelector('.ms-mount[data-ms="modes"]');
            if (modesMount) {
                const modeOpts = doc.modes.map(m => ({
                    value: m.id,
                    label: m.name || `(unnamed ${m.id})`
                }));
                const ms = new MultiSelectDropdown(
                    modeOpts, item.modeRefs,
                    (newRefs) => { item.modeRefs = newRefs; },
                    { unitLabel: 'mode',
                      emptyLabel: 'No operating modes declared yet — add them in the Operating Modes table above.',
                      onClose: refresh });
                modesMount.replaceWith(ms.element);
            }
            const sgMount = row.querySelector('.ms-mount[data-ms="sgs"]');
            if (sgMount) {
                const sgOpts = doc.safetyGoals.map(g => ({
                    value: g.id,
                    label: `${g.name || g.id} (${g.asil || 'QM'})`
                }));
                const ms = new MultiSelectDropdown(
                    sgOpts, item.sgRefs,
                    (newRefs) => { item.sgRefs = newRefs; },
                    { unitLabel: 'safety goal',
                      emptyLabel: 'No Safety Goals declared yet — add them in the Safety Goals table above.',
                      onClose: refresh });
                sgMount.replaceWith(ms.element);
            }
        }
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
        sectionHelp: 'Boundary I/O. Each row captures the SMART signal definition: direction, kind (data/physical), protocol, data type, range, units, period, jitter, failure behaviour. Click ▸ on a row to expand the detail panel.',
        singular: 'Interface',
        helpHeaders: {
            'Name':      'Interface label (e.g. CAN_PT, LIN_BCM, HV_BUS).',
            'Kind':      'data = software signal/message; physical = HW pin/bus/connector/supply.',
            'Producer':  'Element or external system originating the signal. Autocompletes from declared elements and previously-typed names.',
            'Direction': 'producer→consumer (one-way), consumer→producer (one-way), or bidirectional.',
            'Consumer':  'Element or external system receiving the signal. Same autocomplete as producer.',
            'Protocol':  'Protocol or physical medium (CAN, LIN, FlexRay, Ethernet, 12V supply, K-line, etc.).',
            '▸':         'Expand to edit SMART details: data type, range, units, period, jitter, failure behaviour, notes.'
        },
        headers: ['ID', 'Name', 'Kind', 'Producer', 'Direction', 'Consumer', 'Protocol', '▸', ''],
        gridCols: '90px 1fr 90px 1fr 130px 1fr 110px 30px 40px',
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
            const inputs  = row.querySelectorAll('input[type="text"]');
            const selects = row.querySelectorAll('select');
            item.name      = inputs[0].value;
            item.producer  = inputs[1].value;
            item.consumer  = inputs[2].value;
            item.protocol  = inputs[3].value;
            item.kind      = selects[0].value;
            item.direction = selects[1].value;
            // Bank producer/consumer values into the lexicon so future
            // interface rows autocomplete from them — solves E3.
            doc.addToLexicon('producers', item.producer);
            doc.addToLexicon('consumers', item.consumer);
        },
        renderRow: item => {
            const dirArrow = {
                'producer-to-consumer': '→',
                'consumer-to-producer': '←',
                'bidirectional':        '↔',
                'unidirectional':       '→'  // legacy
            }[item.direction] || '→';
            return `
                <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
                <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. CAN_PT">
                <select data-if="kind">
                    <option value="data" ${item.kind==='data'?'selected':''}>data</option>
                    <option value="physical" ${item.kind==='physical'?'selected':''}>physical</option>
                </select>
                <input type="text" list="lex-producers" value="${(item.producer||'').replace(/"/g,'&quot;')}" placeholder="Producer">
                <select data-if="direction">
                    <option value="producer-to-consumer" ${item.direction==='producer-to-consumer'||item.direction==='unidirectional'?'selected':''}>${dirArrow} producer→consumer</option>
                    <option value="consumer-to-producer" ${item.direction==='consumer-to-producer'?'selected':''}>← consumer→producer</option>
                    <option value="bidirectional"        ${item.direction==='bidirectional'?'selected':''}>↔ bidirectional</option>
                </select>
                <input type="text" list="lex-consumers" value="${(item.consumer||'').replace(/"/g,'&quot;')}" placeholder="Consumer">
                <input type="text" value="${(item.protocol||'').replace(/"/g,'&quot;')}" placeholder="CAN, LIN, ...">
                <button type="button" class="if-expand" data-if-id="${item.id}" title="Edit SMART details (data type, range, period, jitter, failure behaviour)" style="background:none;border:1px solid #ced4da;border-radius:3px;cursor:pointer;font-size:13px;line-height:1;padding:2px 6px;">▸</button>
                <button class="del-btn req-delete" title="Delete this interface">✕</button>
            `;
        },
        postRender: (row, item, doc, refresh) => {
            // Wire the expand button to toggle a SMART-details sub-row
            // immediately under this row. Inserted lazily so rows that
            // are never expanded don't pay any layout cost.
            const btn = row.querySelector('.if-expand');
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                let next = row.nextElementSibling;
                if (next && next.classList && next.classList.contains('if-detail-row')) {
                    next.remove();
                    btn.textContent = '▸';
                    return;
                }
                const detail = document.createElement('div');
                detail.className = 'if-detail-row';
                detail.style.cssText = 'grid-column: 1 / -1; padding: 0.6rem 1rem; background: #f8f9fa; border-left: 3px solid #0d6efd; margin: 0 0 4px 0;';
                detail.innerHTML = `
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                        <label style="font-size:11px;">Data type
                            <input type="text" data-if-detail="dataType" value="${(item.dataType||'').replace(/"/g,'&quot;')}" placeholder="uint16, float32, signed bit, ..." style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;">Range
                            <input type="text" data-if-detail="range" value="${(item.range||'').replace(/"/g,'&quot;')}" placeholder="0..255, -10..+10, ..." style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;">Unit
                            <input type="text" data-if-detail="unit" value="${(item.unit||'').replace(/"/g,'&quot;')}" placeholder="km/h, V, °C, ..." style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;">Period
                            <input type="text" data-if-detail="period" value="${(item.period||'').replace(/"/g,'&quot;')}" placeholder="10 ms" style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;">Jitter
                            <input type="text" data-if-detail="jitter" value="${(item.jitter||'').replace(/"/g,'&quot;')}" placeholder="±1 ms" style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;">Failure behaviour
                            <input type="text" data-if-detail="failureBehavior" value="${(item.failureBehavior||'').replace(/"/g,'&quot;')}" placeholder="hold last / safe value / ..." style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                        <label style="font-size:11px;grid-column:1 / -1;">Notes
                            <input type="text" data-if-detail="notes" value="${(item.notes||'').replace(/"/g,'&quot;')}" placeholder="Anything else worth recording" style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                        </label>
                    </div>
                `;
                detail.querySelectorAll('input[data-if-detail]').forEach(inp => {
                    inp.addEventListener('input', () => {
                        const k = inp.getAttribute('data-if-detail');
                        item[k] = inp.value;
                    });
                });
                row.parentNode.insertBefore(detail, row.nextSibling);
                btn.textContent = '▾';
            });
        }
    },
    modeTransition: {
        title: 'Mode Transitions',
        sectionHelp: 'Directed edges in the mode/state model. Each transition has source mode, target mode, trigger that fires it, optional guard condition, and a time budget. Closes c6g.',
        singular: 'Transition',
        helpHeaders: {
            'From':    'Source mode the transition starts in.',
            'To':      'Target mode the transition ends in.',
            'Trigger': 'Event or condition that causes the transition to fire.',
            'Guard':   'Optional additional precondition that must be true for the trigger to take effect.',
            'Time':    'Time budget for the transition to complete (e.g. "100 ms").'
        },
        headers: ['ID', 'From', 'To', 'Trigger', 'Guard', 'Time', ''],
        gridCols: '90px 130px 130px 1fr 1fr 90px 40px',
        getList: doc => doc.modeTransitions,
        add: doc => {
            const t = new ModeTransition();
            t.id = doc.nextId('modeTransition');
            doc.modeTransitions.push(t);
        },
        remove: (doc, id) => { doc.modeTransitions = doc.modeTransitions.filter(x => x.id !== id); },
        updateFromRow: (doc, id, row) => {
            const item = doc.modeTransitions.find(x => x.id === id);
            if (!item) return;
            const selects = row.querySelectorAll('select');
            const inputs  = row.querySelectorAll('input[type="text"]');
            item.fromMode       = selects[0].value;
            item.toMode         = selects[1].value;
            item.trigger        = inputs[0].value;
            item.guard          = inputs[1].value;
            item.transitionTime = inputs[2].value;
        },
        renderRow: item => {
            // The mode dropdowns are populated at postRender time so we
            // can read the latest doc.modes. Here we render placeholders.
            return `
                <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
                <select data-tr="from"></select>
                <select data-tr="to"></select>
                <input type="text" value="${(item.trigger||'').replace(/"/g,'&quot;')}" placeholder="e.g. ignition off">
                <input type="text" value="${(item.guard||'').replace(/"/g,'&quot;')}" placeholder="optional precondition">
                <input type="text" value="${(item.transitionTime||'').replace(/"/g,'&quot;')}" placeholder="100 ms">
                <button class="del-btn req-delete" title="Delete this transition">✕</button>
            `;
        },
        postRender: (row, item, doc, refresh) => {
            // Populate mode dropdowns. The first option is an empty
            // placeholder so the user knows nothing is picked. Selecting
            // a value triggers the row's update + refresh path through
            // the standard select-change handler installed by
            // _renderDeclarationTable.
            const fillSelect = (select, current) => {
                const empty = '<option value="">— select —</option>';
                const opts = doc.modes.map(m =>
                    `<option value="${m.id}" ${m.id === current ? 'selected' : ''}>${(m.name||m.id).replace(/"/g,'&quot;')}</option>`).join('');
                select.innerHTML = empty + opts;
            };
            const fromSel = row.querySelector('select[data-tr="from"]');
            const toSel   = row.querySelector('select[data-tr="to"]');
            if (fromSel) fillSelect(fromSel, item.fromMode);
            if (toSel)   fillSelect(toSel, item.toMode);
        }
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
