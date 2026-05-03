/**
 * chapter5_features.js
 *
 * Three widgets for the System Breakdown chapter (id: ch06_breakdown,
 * displayed as Chapter 5):
 *
 *   ModeDiagnosticsView       — surfaces forgotten transitions and timing
 *                               crosschecks from DocumentValidator.
 *   ModeSimulatorView         — interactive state-machine walker. Pick a
 *                               trigger, press play, watch the mode shift
 *                               or get told why it didn't.
 *   ModeRequirementGenerator  — converts mode transitions into EARS-style
 *                               draft requirements that get appended to
 *                               Chapter 4 (acceptance), with a preview /
 *                               confirm step.
 *
 * Each view is constructed with (doc, onChange) and exposes render(container).
 * Self-contained DOM — no Bootstrap-specific wiring required beyond the
 * existing class names already in styles.css.
 */

// =============================================================================
// Mode diagnostics
// =============================================================================

class ModeDiagnosticsView {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const validator = new DocumentValidator(this.doc);
        const forgotten = validator.forgottenTransitions();
        const timing    = validator.timingCrosscheck();

        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Mode-Model Diagnostics
            <span class="help-icon" title="Static analysis of the modes / transitions / safe-states declared above. Updates whenever the data changes; nothing here blocks save.">?</span>
        </div>`;

        wrap.appendChild(this._renderList(
            'Forgotten transitions',
            forgotten,
            'Every mode looks reachable and terminating.'
        ));
        wrap.appendChild(this._renderList(
            'Timing vs FTTI',
            timing,
            'Every transition into a safe state fits within its Safety Goal\'s FTTI.'
        ));

        container.appendChild(wrap);
    }

    _renderList(title, issues, emptyText) {
        const block = document.createElement('div');
        block.style.marginBottom = '0.75rem';
        const heading = document.createElement('div');
        heading.style.cssText = 'font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.5px;margin-bottom:0.3rem;';
        heading.innerHTML = `${title} <span class="count-badge">${issues.length}</span>`;
        block.appendChild(heading);

        if (issues.length === 0) {
            const ok = document.createElement('div');
            ok.style.cssText = 'font-size:12px;color:#198754;padding:0.25rem 0.5rem;';
            ok.textContent = '✓ ' + emptyText;
            block.appendChild(ok);
            return block;
        }
        const ul = document.createElement('ul');
        ul.className = 'summary-list';
        issues.forEach(it => {
            const li = document.createElement('li');
            li.className = it.kind === 'ttime-over-ftti' ? 'error' : 'warn';
            li.innerHTML = `<span>${escHtml(it.text)}</span>`;
            ul.appendChild(li);
        });
        block.appendChild(ul);
        return block;
    }
}


// =============================================================================
// Mode simulator
// =============================================================================

class ModeSimulatorView {

    constructor(doc) {
        this.doc = doc;
        this.currentModeId = this._initialModeId();
        this.log = [];
        // Container + controls are rebuilt on every render(); the
        // simulator keeps its own state across re-renders so the user
        // doesn't lose progress when an unrelated row changes.
    }

    setDocument(doc) {
        this.doc = doc;
        // If the previously-selected mode was deleted, reset.
        if (!doc.modes.find(m => m.id === this.currentModeId)) {
            this.reset();
        }
    }

    _initialModeId() {
        const ms = this.doc.modes || [];
        if (ms.length === 0) return null;
        const named = ms.find(m => /off|init|startup|nominal/i.test(m.name || ''));
        return (named || ms[0]).id;
    }

    reset() {
        this.currentModeId = this._initialModeId();
        this.log = [];
    }

    /** Apply a trigger; record outcome. */
    step(triggerName) {
        const trig = String(triggerName || '').trim();
        if (!trig) return { ok: false, info: 'No trigger picked.' };
        if (!this.currentModeId) return { ok: false, info: 'No modes declared.' };

        const fromMode = this.doc.modes.find(m => m.id === this.currentModeId);
        const fromName = fromMode ? (fromMode.name || fromMode.id) : '?';

        const candidates = (this.doc.modeTransitions || []).filter(t =>
            t.fromMode === this.currentModeId &&
            String(t.trigger || '').trim().toLowerCase() === trig.toLowerCase()
        );
        if (candidates.length === 0) {
            const others = (this.doc.modeTransitions || [])
                .filter(t => t.fromMode === this.currentModeId)
                .map(t => t.trigger).filter(Boolean);
            const info = others.length
                ? `No transition from "${fromName}" on trigger "${trig}". From here you can fire: ${others.join(', ')}.`
                : `Mode "${fromName}" has no outbound transitions at all — likely a forgotten edge.`;
            this.log.push({ kind: 'no-match', text: `${fromName} ✕ "${trig}" — ${info}` });
            return { ok: false, info };
        }
        const t = candidates[0];
        const toMode = this.doc.modes.find(m => m.id === t.toMode);
        if (!toMode) {
            const info = `Transition target ${t.toMode} no longer declared.`;
            this.log.push({ kind: 'broken-target', text: `${fromName} ✕ ${info}` });
            return { ok: false, info };
        }
        const toName = toMode.name || toMode.id;
        let extra = '';
        if (t.guard) extra += ` [guard: ${t.guard} — assumed satisfied]`;
        if (t.transitionTime) extra += ` (${t.transitionTime})`;
        const info = `${fromName} → ${toName}${extra}`;
        this.log.push({ kind: 'transition', text: info });
        if (candidates.length > 1) {
            this.log.push({ kind: 'ambiguous',
                text: `Note: ${candidates.length} transitions share trigger "${trig}" from "${fromName}"; first one taken.` });
        }
        this.currentModeId = t.toMode;
        return { ok: true, info };
    }

    /** Triggers worth offering: every distinct trigger declared on any
     *  transition, plus anything banked in the lexicon. */
    availableTriggers() {
        const set = new Set();
        (this.doc.modeTransitions || []).forEach(t => {
            const v = String(t.trigger || '').trim();
            if (v) set.add(v);
        });
        ((this.doc.lexicon && this.doc.lexicon.triggers) || []).forEach(v => {
            const s = String(v || '').trim();
            if (s) set.add(s);
        });
        return [...set].sort();
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Mode Simulator
            <span class="help-icon" title="Walk the mode graph trigger by trigger. Helps surface missing edges, mismatched trigger spellings, and unreachable states. Guards are not evaluated — they're shown as informational.">?</span>
        </div>`;

        const fromMode = this.doc.modes.find(m => m.id === this.currentModeId);
        const fromName = fromMode ? (fromMode.name || fromMode.id) : '(no mode)';

        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;background:#f8f9fa;padding:0.6rem 0.75rem;border-radius:6px;border:1px solid #dee2e6;';

        // [system: <mode>]
        const stateBox = document.createElement('div');
        stateBox.style.cssText = 'padding:6px 12px;background:#0d6efd;color:#fff;border-radius:4px;font-weight:600;font-size:13px;min-width:120px;text-align:center;';
        stateBox.textContent = fromName;
        row.appendChild(stateBox);

        // arrow
        const arrow = document.createElement('span');
        arrow.textContent = '—';
        arrow.style.color = '#6c757d';
        row.appendChild(arrow);

        // trigger picker
        const triggers = this.availableTriggers();
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm';
        select.style.maxWidth = '220px';
        const def = document.createElement('option');
        def.value = '';
        def.textContent = triggers.length ? '— pick a trigger —' : '(no triggers declared)';
        select.appendChild(def);
        triggers.forEach(t => {
            const o = document.createElement('option');
            o.value = t; o.textContent = t;
            select.appendChild(o);
        });
        row.appendChild(select);

        // play button
        const play = document.createElement('button');
        play.className = 'btn btn-sm btn-success';
        play.textContent = '▶ Step';
        play.disabled = triggers.length === 0;
        play.addEventListener('click', () => {
            this.step(select.value);
            this.render(container.parentNode ? this._replaceTarget(container) : container);
        });
        row.appendChild(play);

        // reset button
        const reset = document.createElement('button');
        reset.className = 'btn btn-sm btn-outline-secondary';
        reset.textContent = 'Reset';
        reset.addEventListener('click', () => {
            this.reset();
            this.render(this._replaceTarget(container));
        });
        row.appendChild(reset);

        wrap.appendChild(row);

        // log
        if (this.log.length > 0) {
            const log = document.createElement('div');
            log.style.cssText = 'margin-top:0.5rem;font-family:"SF Mono",Consolas,monospace;font-size:12px;background:#fff;border:1px solid #dee2e6;border-radius:4px;padding:0.4rem 0.6rem;max-height:160px;overflow-y:auto;';
            const recent = this.log.slice(-12);
            recent.forEach(entry => {
                const line = document.createElement('div');
                line.style.cssText = 'padding:1px 0;';
                if (entry.kind === 'transition')      line.style.color = '#198754';
                else if (entry.kind === 'no-match')   line.style.color = '#dc3545';
                else if (entry.kind === 'ambiguous')  line.style.color = '#fd7e14';
                else                                  line.style.color = '#6c757d';
                line.textContent = entry.text;
                log.appendChild(line);
            });
            wrap.appendChild(log);
        }

        container.appendChild(wrap);
    }

    /** Helper: rerender into the same parent slot. Used so the play
     *  button can refresh the widget without bouncing the whole pane. */
    _replaceTarget(oldContainer) {
        const parent = oldContainer.parentNode;
        if (!parent) return oldContainer;
        const fresh = document.createElement('div');
        parent.replaceChild(fresh, oldContainer);
        return fresh;
    }
}


// =============================================================================
// Mode-driven requirement generator
// =============================================================================

class ModeRequirementGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
        // staged: array of pending Requirement instances, populated by
        // generate(), reviewed in the preview, committed by accept().
        this.staged = [];
    }

    setDocument(doc) { this.doc = doc; }

    /**
     * Build draft Requirement objects from every mode transition that
     * has at least from/to/trigger filled in. Drafts are NOT pushed onto
     * the document yet — the user previews and confirms first.
     */
    generate() {
        this.staged = [];
        (this.doc.modeTransitions || []).forEach(t => {
            const fromMode = this.doc.modes.find(m => m.id === t.fromMode);
            const toMode   = this.doc.modes.find(m => m.id === t.toMode);
            if (!fromMode || !toMode || !t.trigger) return;
            const r = new Requirement({
                chapterId: 'ch05_acceptance',
                conditional: 'when',
                conditionalText: t.trigger,
                subject: 'the system',
                predicate: 'transition',
                fromState: fromMode.name || fromMode.id,
                toState:   toMode.name   || toMode.id,
                trigger:   t.trigger,
                transitionTime: t.transitionTime || '',
                rationale: `Generated from mode transition ${t.id} (${fromMode.name || fromMode.id} → ${toMode.name || toMode.id}).`,
                verification: 'inspection'
            });
            // Provisional ID; replaced at accept() time via doc.nextId.
            r.id = '(draft)';
            this.staged.push(r);
        });
        return this.staged;
    }

    /** Push every staged requirement onto the document and clear staging. */
    accept() {
        this.staged.forEach(r => {
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            this.doc.requirements.push(r);
        });
        const n = this.staged.length;
        this.staged = [];
        return n;
    }

    discard() { this.staged = []; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Generate Acceptance Requirements
            <span class="help-icon" title="Each mode transition with from / to / trigger filled in becomes a draft EARS requirement (predicate: transition) destined for Chapter 4. Review the preview, then commit. Existing requirements are not touched; duplicates may result if you regenerate without cleaning up.">?</span>
        </div>`;

        const ctrl = document.createElement('div');
        ctrl.style.cssText = 'display:flex;gap:0.5rem;align-items:center;margin-bottom:0.5rem;';
        const gen = document.createElement('button');
        gen.className = 'btn btn-sm btn-outline-primary';
        gen.textContent = 'Preview drafts';
        gen.addEventListener('click', () => {
            this.generate();
            this.render(this._swap(container));
        });
        ctrl.appendChild(gen);

        if (this.staged.length > 0) {
            const accept = document.createElement('button');
            accept.className = 'btn btn-sm btn-success';
            accept.textContent = `Commit ${this.staged.length} to Chapter 4`;
            accept.addEventListener('click', () => {
                const n = this.accept();
                this.onChange();
                alert(`Added ${n} requirement(s) to Chapter 4 (Acceptance).`);
            });
            ctrl.appendChild(accept);

            const cancel = document.createElement('button');
            cancel.className = 'btn btn-sm btn-outline-secondary';
            cancel.textContent = 'Discard preview';
            cancel.addEventListener('click', () => {
                this.discard();
                this.render(this._swap(container));
            });
            ctrl.appendChild(cancel);
        }
        wrap.appendChild(ctrl);

        if (this.staged.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'font-size:12px;color:#666;font-style:italic;';
            empty.textContent = 'No drafts staged. Click "Preview drafts" to generate one requirement per fully-specified mode transition.';
            wrap.appendChild(empty);
        } else {
            this.staged.forEach(r => {
                const item = document.createElement('div');
                item.className = 'req-item';
                item.innerHTML = `
                    <div class="req-item-header">
                        <span class="req-id">(draft)</span>
                        <span class="req-badges"><span class="req-badge">when</span><span class="req-badge">transition</span></span>
                    </div>
                    <div>${escHtml(GrammarValidator.buildStatement(r))}</div>
                    <div style="font-size:11px;color:#666;margin-top:3px;">${escHtml(r.rationale)}</div>
                `;
                wrap.appendChild(item);
            });
        }
        container.appendChild(wrap);
    }

    _swap(oldContainer) {
        const parent = oldContainer.parentNode;
        if (!parent) return oldContainer;
        const fresh = document.createElement('div');
        parent.replaceChild(fresh, oldContainer);
        return fresh;
    }
}


// =============================================================================
// Local helpers
// =============================================================================

function escHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
