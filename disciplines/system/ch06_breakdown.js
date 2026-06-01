/**
 * disciplines/system/ch06_breakdown.js
 *
 * System Chapter 5 (display) — System Breakdown. Declares system
 * elements (with hierarchy and quantity), interfaces, and mode
 * transitions. Hosts three chapter-specific widgets:
 *
 *   ModeDiagnosticsView       Static analysis of the mode graph.
 *                             Forgotten transitions, timing crosscheck.
 *   ModeSimulatorView         Interactive walk: pick a trigger, press
 *                             Step, watch the system mode change in
 *                             place. Diagnoses why a trigger doesn't
 *                             fire (no matching edge, dead-end mode).
 *   ModeRequirementGenerator  One click → one EARS acceptance
 *                             requirement per fully-specified
 *                             transition, dropped into Chapter 4.
 *
 * Everything mode-related lives in this file. To work on this chapter
 * you need: this file + index.html + the three declarations it uses
 * (element, interface, modeTransition) + chapter_registry / declaration
 * _registry / model_base. Nothing else.
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
        h.style.cssText = 'font-size:11px;text-transform:uppercase;color:var(--text-dim);letter-spacing:0.5px;margin-bottom:0.3rem;';
        h.innerHTML = `${title} <span class="count-badge">${issues.length}</span>`;
        block.appendChild(h);
        if (issues.length === 0) {
            const ok = document.createElement('div');
            ok.style.cssText = 'font-size:12px;color:var(--green);padding:0.25rem 0.5rem;';
            ok.textContent = '✓ ' + emptyText;
            block.appendChild(ok);
            return block;
        }
        const ul = document.createElement('ul');
        ul.className = 'summary-list';
        issues.forEach(it => {
            const li = document.createElement('li');
            li.className = it.kind === 'ttime-over-ftti' ? 'error' : 'warn';
            li.innerHTML = `<span>${ch6Esc(it.text)}</span>`;
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
            <span class="help-icon" title="The blue box is the system. Pick a trigger, press Step, and the box's state updates in place. The message below explains what happened. Guards are shown but not evaluated.">?</span>
        </div>`;

        const triggers = this.availableTriggers();

        // Control row: [system box] — [trigger ▾] [▶ Step] [Reset]
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;background:var(--bg-elevated);padding:0.6rem 0.75rem;border-radius:6px;border:1px solid var(--border);';

        const stateBox = document.createElement('div');
        stateBox.style.cssText = 'padding:8px 14px;background:var(--accent);color:#fff;border-radius:4px;font-size:13px;min-width:160px;text-align:center;line-height:1.3;';
        row.appendChild(stateBox);

        const arrow = document.createElement('span');
        arrow.textContent = '—';
        arrow.style.color = 'var(--text-dim)';
        row.appendChild(arrow);

        const select = document.createElement('select');
        select.className = 'sim-select';
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
        play.className = 'btn-add sim-btn-go';
        play.textContent = '▶ Step';
        play.disabled = triggers.length === 0;
        row.appendChild(play);

        const reset = document.createElement('button');
        reset.className = 'btn-add';
        reset.textContent = 'Reset';
        row.appendChild(reset);

        wrap.appendChild(row);

        // Single message line below the controls
        const msg = document.createElement('div');
        msg.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;border:1px solid transparent;';
        wrap.appendChild(msg);

        // paint() refreshes the blue box and the message in place. The
        // controls and the wrap stay mounted, so dropdown state and
        // scroll position survive a Step click.
        const paint = () => {
            const m = this.doc.modes.find(x => x.id === this.currentModeId);
            const name = m ? (m.name || m.id) : '(no mode)';
            stateBox.innerHTML = `
                <div style="font-size:10px;opacity:0.8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">System state</div>
                <div style="font-weight:600;">${ch6Esc(name)}</div>`;
            const palette = {
                ok:        { bg: 'var(--green-bg)', border: 'var(--green)', color: 'var(--green)' },
                'no-match':{ bg: 'var(--red-bg)', border: 'var(--red)', color: 'var(--red)' },
                broken:    { bg: 'var(--red-bg)', border: 'var(--red)', color: 'var(--red)' },
                idle:      { bg: 'var(--bg-hover)', border: 'var(--border-mid)', color: 'var(--text-mid)' }
            }[this.message.kind] || { bg: 'var(--bg-hover)', border: 'var(--border-mid)', color: 'var(--text-mid)' };
            msg.style.background  = palette.bg;
            msg.style.borderColor = palette.border;
            msg.style.color       = palette.color;
            msg.textContent = this.message.text;
        };

        play.addEventListener('click', () => { this.step(select.value); paint(); });
        reset.addEventListener('click', () => { this.reset(); paint(); });

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

    /** Append one Requirement to Chapter 4 per fully-specified mode
     *  transition not already covered. Returns count added. Idempotent
     *  on re-click (a transition is "covered" when an existing
     *  acceptance req has predicate=transition with the same fromState
     *  / toState / trigger). */
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
                verification: ['inspection']
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

        // Pre-flight summary
        const transitions = this.doc.modeTransitions || [];
        const complete = transitions.filter(t => t.fromMode && t.toMode && t.trigger);
        const eligible = complete.filter(t => {
            const fromName = (this.doc.modes.find(m => m.id === t.fromMode) || {}).name || t.fromMode;
            const toName   = (this.doc.modes.find(m => m.id === t.toMode)   || {}).name || t.toMode;
            return !this.doc.requirements.some(r =>
                r.chapterId === 'ch05_acceptance' &&
                r.predicate === 'transition' &&
                r.fromState === fromName && r.toState === toName && r.trigger === t.trigger);
        });
        const existing = transitions.length - eligible.length - (transitions.length - complete.length);

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:var(--text-mid);margin-bottom:0.5rem;';
        summary.innerHTML = `${transitions.length} transition(s) declared, ${complete.length} fully specified, ${existing} already in Chapter 4, <strong>${eligible.length}</strong> ready to generate.`;
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn-add btn-generate';
        btn.textContent = `Generate ${eligible.length} requirement(s) → Chapter 4`;
        btn.disabled = eligible.length === 0;
        wrap.appendChild(btn);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;display:none;';
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            // Defer onChange so this click finishes before the pane re-renders
            setTimeout(() => this.onChange(), 0);
            status.style.display = 'block';
            if (n === 0) {
                status.style.background = 'var(--bg-hover)';
                status.style.color      = 'var(--text-mid)';
                status.textContent = 'Nothing to do — every fully-specified transition is already in Chapter 4.';
            } else {
                status.style.background = 'var(--green-bg)';
                status.style.color      = 'var(--green)';
                status.textContent = `Added ${n} requirement(s) to Chapter 4 (Acceptance). Click "4. Acceptance Requirements" in the outline to see them.`;
            }
        });

        container.appendChild(wrap);
    }
}


// =============================================================================
// Local helper
// =============================================================================

function ch6Esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


// =============================================================================
// Chapter registration
// =============================================================================

Chapters.register('system', {
    id: 'ch06_breakdown',
    number: '4',
    title: 'System Breakdown',
    order: 70,
    intro: 'Elements declared here. Chapter 6 is auto-generated from this list. The mode simulator below lets you walk the state machine you defined in the Mode Transitions table.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['element', 'interface', 'modeTransition'],
    extraWidgets: (doc, onChange) => [
        new ModeDiagnosticsView(doc),
        new ModeSimulatorView(doc),
        new ModeRequirementGenerator(doc, onChange)
    ],
    checklist: [
        { id: 'c6a', text: 'Element count within expected range (10–30 for ADAS).',
          help: 'Below 10 = under-decomposed (most elements will overflow the 4–13 per-leaf budget); above 30 = consider grouping into subsystems.' },
        { id: 'c6c', text: 'Allocation matrix covers every item function to ≥1 element.',
          help: 'Element.allocatedItemFunctions stores this. Right-pane Item Functions shows E:N counts.' },
        { id: 'c6d', text: 'No orphan elements (every element has ≥1 allocated item function).',
          help: 'Right-pane Elements section flags zero-allocation elements.' },
        { id: 'c6e', text: 'ASIL decomposition decisions listed with independence arguments.',
          help: 'When ASIL D decomposes (ISO 26262-9:5), the independence argument must be documented.' },
        { id: 'c6f', text: 'Mode model covers power-off, startup, nominal, degraded, safe, shutdown.' },
        { id: 'c6g', text: 'Every mode transition has source, target, trigger.',
          help: 'Mode Transitions table. The forgotten-transitions diagnostic above flags incomplete edges.' },
        { id: 'c6h', text: 'Every safe state from Chapter 3 present in mode model.',
          help: 'Each declared SafeState must reference at least one Mode that realises it.' }
    ]
});
