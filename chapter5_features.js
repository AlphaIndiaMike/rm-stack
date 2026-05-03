/**
 * chapter5_features.js
 *
 * Three widgets for the System Breakdown chapter (id ch06_breakdown,
 * displayed as Chapter 5):
 *
 *   ModeDiagnosticsView       — surfaces forgotten transitions and timing
 *                               crosschecks. Pure render, no state.
 *   ModeSimulatorView         — interactive state-machine walker. Pick a
 *                               trigger, press Step, watch the mode shift
 *                               or get told why it didn't. State (current
 *                               mode + log) lives on the instance and
 *                               survives the editor's full pane re-render.
 *   ModeRequirementGenerator  — single button. Click it and one EARS
 *                               requirement per fully-specified mode
 *                               transition is appended to Chapter 4
 *                               (Acceptance). Skips transitions whose
 *                               (from, to, trigger) is already covered
 *                               so re-clicking is idempotent.
 *
 * All three widgets follow the editor's normal render pattern: the host
 * passes a container, the widget creates a section, appends it, and is
 * done. Mutations call onChange() so the host re-renders the whole pane
 * — same flow as "+ Add Item Function" or any other declaration.
 */

// =============================================================================
// Mode diagnostics
// =============================================================================

class ModeDiagnosticsView {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const v = new DocumentValidator(this.doc);
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Mode-Model Diagnostics
            <span class="help-icon" title="Static analysis of the modes / transitions / safe-states declared above. Updates whenever the data changes; nothing here blocks save.">?</span>
        </div>`;
        wrap.appendChild(this._list('Forgotten transitions', v.forgottenTransitions(),
            'Every mode looks reachable and terminating.'));
        wrap.appendChild(this._list('Timing vs FTTI', v.timingCrosscheck(),
            "Every transition into a safe state fits within its Safety Goal's FTTI."));
        container.appendChild(wrap);
    }

    _list(title, issues, emptyText) {
        const block = document.createElement('div');
        block.style.marginBottom = '0.75rem';
        const h = document.createElement('div');
        h.style.cssText = 'font-size:11px;text-transform:uppercase;color:#666;letter-spacing:0.5px;margin-bottom:0.3rem;';
        h.innerHTML = `${title} <span class="count-badge">${issues.length}</span>`;
        block.appendChild(h);
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
            li.innerHTML = `<span>${esc(it.text)}</span>`;
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
        // Last action result: { kind:'ok'|'no-match'|'broken'|'idle', text }
        // Persists across re-renders so editor pane updates don't blank
        // the message; only step() / reset() change it.
        this.message = { kind: 'idle', text: 'Pick a trigger and press Step.' };
    }

    setDocument(doc) {
        this.doc = doc;
        if (!doc.modes.find(m => m.id === this.currentModeId)) this.reset();
    }

    _initialModeId() {
        const ms = this.doc.modes || [];
        if (ms.length === 0) return null;
        const named = ms.find(m => /off|init|startup|nominal/i.test(m.name || ''));
        return (named || ms[0]).id;
    }

    reset() {
        this.currentModeId = this._initialModeId();
        this.message = { kind: 'idle', text: 'Reset to initial state.' };
    }

    /** Apply a trigger. Updates currentModeId and message; nothing else. */
    step(triggerName) {
        const trig = String(triggerName || '').trim();
        if (!trig) {
            this.message = { kind: 'no-match', text: 'No trigger picked.' };
            return;
        }
        if (!this.currentModeId) {
            this.message = { kind: 'no-match', text: 'No modes declared yet.' };
            return;
        }
        const fromMode = this.doc.modes.find(m => m.id === this.currentModeId);
        const fromName = fromMode ? (fromMode.name || fromMode.id) : '?';
        const matching = (this.doc.modeTransitions || []).filter(t =>
            t.fromMode === this.currentModeId &&
            String(t.trigger || '').trim().toLowerCase() === trig.toLowerCase()
        );
        if (matching.length === 0) {
            const others = (this.doc.modeTransitions || [])
                .filter(t => t.fromMode === this.currentModeId)
                .map(t => t.trigger).filter(Boolean);
            this.message = {
                kind: 'no-match',
                text: others.length
                    ? `No transition from "${fromName}" on "${trig}". Available triggers from here: ${others.join(', ')}.`
                    : `Mode "${fromName}" has no outbound transitions — likely a forgotten edge.`
            };
            return;
        }
        const t = matching[0];
        const toMode = this.doc.modes.find(m => m.id === t.toMode);
        if (!toMode) {
            this.message = { kind: 'broken',
                text: `Transition target ${t.toMode} no longer declared.` };
            return;
        }
        const toName = toMode.name || toMode.id;
        let extra = '';
        if (t.guard)          extra += ` Guard "${t.guard}" assumed satisfied.`;
        if (t.transitionTime) extra += ` Transition time: ${t.transitionTime}.`;
        if (matching.length > 1) {
            extra += ` (${matching.length} transitions share this trigger; first one taken.)`;
        }
        this.currentModeId = t.toMode;
        this.message = { kind: 'ok', text: `${fromName} → ${toName}.${extra}` };
    }

    /** Triggers worth offering: distinct triggers on declared transitions
     *  plus the lexicon. */
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
            <span class="help-icon" title="The blue box is the system. Pick a trigger, press Step, and the box's state updates in place. The message below explains what happened — including why a trigger didn't fire (no matching transition, no outbound edges, etc.). Guards are shown but not evaluated.">?</span>
        </div>`;

        const triggers = this.availableTriggers();

        // Control row: [system box] — [trigger ▾] [▶ Step] [Reset]
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;background:#f8f9fa;padding:0.6rem 0.75rem;border-radius:6px;border:1px solid #dee2e6;';

        // The blue box represents the system. We update its textContent
        // and a small "current state" label in place when step() runs —
        // no full re-render of the surrounding pane.
        const stateBox = document.createElement('div');
        stateBox.style.cssText = 'padding:8px 14px;background:#0d6efd;color:#fff;border-radius:4px;font-size:13px;min-width:160px;text-align:center;line-height:1.3;';
        row.appendChild(stateBox);

        const arrow = document.createElement('span');
        arrow.textContent = '—';
        arrow.style.color = '#6c757d';
        row.appendChild(arrow);

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

        const play = document.createElement('button');
        play.className = 'btn btn-sm btn-success';
        play.textContent = '▶ Step';
        play.disabled = triggers.length === 0;
        row.appendChild(play);

        const reset = document.createElement('button');
        reset.className = 'btn btn-sm btn-outline-secondary';
        reset.textContent = 'Reset';
        row.appendChild(reset);

        wrap.appendChild(row);

        // Message line below the control row. Single sentence, colored
        // by kind. Replaces the previous scrolling log entirely.
        const msg = document.createElement('div');
        msg.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;border:1px solid transparent;';
        wrap.appendChild(msg);

        // paint() refreshes only the blue box and the message — the
        // select, buttons, and surrounding wrap stay mounted, so the
        // user's focus, the dropdown's open state, and any scroll
        // position aren't disturbed.
        const paint = () => {
            const m = this.doc.modes.find(x => x.id === this.currentModeId);
            const name = m ? (m.name || m.id) : '(no mode)';
            stateBox.innerHTML = `
                <div style="font-size:10px;opacity:0.8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">System state</div>
                <div style="font-weight:600;">${esc(name)}</div>`;
            const palette = {
                ok:        { bg: '#d1e7dd', border: '#198754', color: '#0f5132' },
                'no-match':{ bg: '#f8d7da', border: '#dc3545', color: '#842029' },
                broken:    { bg: '#f8d7da', border: '#dc3545', color: '#842029' },
                idle:      { bg: '#e9ecef', border: '#ced4da', color: '#495057' }
            }[this.message.kind] || { bg: '#e9ecef', border: '#ced4da', color: '#495057' };
            msg.style.background    = palette.bg;
            msg.style.borderColor   = palette.border;
            msg.style.color         = palette.color;
            msg.textContent = this.message.text;
        };

        play.addEventListener('click', () => {
            this.step(select.value);
            paint();
        });
        reset.addEventListener('click', () => {
            this.reset();
            paint();
        });

        paint();
        container.appendChild(wrap);
    }
}


// =============================================================================
// Mode-driven requirement generator — single button, idempotent
// =============================================================================

class ModeRequirementGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }

    setDocument(doc) { this.doc = doc; }

    /**
     * Append one Requirement to Chapter 4 per fully-specified mode
     * transition that isn't already covered. Returns the count added.
     *
     * Idempotency: a transition is "already covered" when an existing
     * acceptance requirement has predicate=transition with the same
     * fromState / toState / trigger. So clicking the button twice on
     * an unchanged mode model produces zero new requirements the second
     * time. Editing a transition and re-clicking adds the new variant
     * but doesn't remove the old one — that's a manual cleanup.
     */
    generate() {
        let added = 0;
        (this.doc.modeTransitions || []).forEach(t => {
            const fromMode = this.doc.modes.find(m => m.id === t.fromMode);
            const toMode   = this.doc.modes.find(m => m.id === t.toMode);
            if (!fromMode || !toMode || !t.trigger) return;
            const fromName = fromMode.name || fromMode.id;
            const toName   = toMode.name   || toMode.id;
            const exists = this.doc.requirements.some(r =>
                r.chapterId === 'ch05_acceptance' &&
                r.predicate === 'transition' &&
                r.fromState === fromName &&
                r.toState   === toName &&
                r.trigger   === t.trigger
            );
            if (exists) return;
            const r = new Requirement({
                chapterId: 'ch05_acceptance',
                conditional: 'when',
                conditionalText: t.trigger,
                subject: 'the system',
                predicate: 'transition',
                fromState: fromName,
                toState:   toName,
                trigger:   t.trigger,
                transitionTime: t.transitionTime || '',
                rationale: `Generated from mode transition ${t.id} (${fromName} → ${toName}).`,
                verification: 'inspection'
            });
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            this.doc.requirements.push(r);
            added++;
        });
        return added;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Generate Acceptance Requirements
            <span class="help-icon" title="One click: each fully-specified mode transition becomes an EARS requirement (predicate: transition) appended to Chapter 4. Transitions missing from / to / trigger are skipped. Re-clicking is safe — already-generated transitions are detected and not duplicated.">?</span>
        </div>`;

        // Pre-flight summary: tell the user what the button will do
        // *before* they click it. Counts: total transitions, how many
        // are complete (from + to + trigger), how many are already in
        // Chapter 4. Eligible = complete AND not already covered.
        const transitions = this.doc.modeTransitions || [];
        const complete = transitions.filter(t =>
            t.fromMode && t.toMode && t.trigger);
        const eligible = complete.filter(t => {
            const fromName = (this.doc.modes.find(m => m.id === t.fromMode) || {}).name || t.fromMode;
            const toName   = (this.doc.modes.find(m => m.id === t.toMode)   || {}).name || t.toMode;
            return !this.doc.requirements.some(r =>
                r.chapterId === 'ch05_acceptance' &&
                r.predicate === 'transition' &&
                r.fromState === fromName &&
                r.toState   === toName &&
                r.trigger   === t.trigger);
        });
        const existing = transitions.length - eligible.length - (transitions.length - complete.length);

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:#555;margin-bottom:0.5rem;';
        summary.innerHTML = `
            ${transitions.length} transition(s) declared,
            ${complete.length} fully specified,
            ${existing} already in Chapter 4,
            <strong>${eligible.length}</strong> ready to generate.`;
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.textContent = `Generate ${eligible.length} requirement(s) → Chapter 4`;
        btn.disabled = eligible.length === 0;
        wrap.appendChild(btn);

        // Status line, updated in place after the click. No alert.
        const status = document.createElement('div');
        status.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;display:none;';
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            // Fire onChange so right-pane summary updates with the new
            // requirement count. Deferred so this click finishes first
            // (same reason as the text-input change handler).
            setTimeout(() => this.onChange(), 0);
            status.style.display = 'block';
            if (n === 0) {
                status.style.background   = '#e9ecef';
                status.style.color        = '#495057';
                status.textContent = 'Nothing to do — every fully-specified transition is already in Chapter 4.';
            } else {
                status.style.background   = '#d1e7dd';
                status.style.color        = '#0f5132';
                status.textContent = `Added ${n} requirement(s) to Chapter 4 (Acceptance). Click "4. Acceptance Requirements" in the outline to see them.`;
            }
        });

        container.appendChild(wrap);
    }
}


// =============================================================================
// Local helper
// =============================================================================

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
