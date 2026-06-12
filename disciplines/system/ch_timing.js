/**
 * disciplines/system/ch_timing.js
 *
 * System Chapter (display 7) — Timing Analysis. Sits between the HSI and
 * the Safety Analyses Summary. Anchored on the mode transitions declared
 * in System Breakdown (the same data the mode simulator and mode-
 * requirement generator use — nothing is re-entered).
 *
 * The timing chain is the single source of truth (ISO 26262-1 FTTI =
 * FDTI + FRTI). A chain decomposes one mode transition into the ordered
 * hops it travels — external interface → element → internal interface →
 * element → ... — budgeting the time each consumes. At system level the
 * per-hop time is FDTI+FRTI inclusive; the split is a software-level
 * refinement, not forced here. The Σ of the hop budgets is checked
 * against the transition's time budget (transitionTime), falling back to
 * the governing safe-state FTTI.
 *
 *   TimingChainBuilder   — author chains (req-slot fields).
 *   TimingDiagnostic     — per-chain Σ vs budget, plus the safe-state
 *                          transition timing check driven by the author's
 *                          "Safe state?" checkbox, and coverage of flagged
 *                          transitions that still lack a chain.
 *   ChainRequirementGenerator — ONE button at the end generates everything
 *                          derivable from the chains:
 *                            · the transition acceptance requirement
 *                              (Chapter 4, reused if System Breakdown
 *                              already made it — matched by from/to/
 *                              trigger, never duplicated);
 *                            · one element TSR per element hop (Chapter 6),
 *                              the propagation budget;
 *                            · for a transition ticked "Safe state?", the
 *                              TERMINAL element hop becomes a detect-and-
 *                              react safety-mechanism TSR (FRTI end of the
 *                              chain), referencing the chain's entry signal
 *                              and the target safe state.
 *                          Idempotent; ASIL inherited from the governing SG.
 *
 * Internal interfaces are declared in the HSI chapter (declaration kind
 * 'internalInterface'); the chain builder references them here.
 *
 * Styling uses the app's own components: .requirements-section /
 * .section-title / .help-icon / .summary-list / .count-badge / .req-slot
 * (labelled fields) / .btn-add / .btn-generate, CSS variables only.
 */


// =============================================================================
// Shared helpers
// =============================================================================

function tmEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tmModeName(doc, id) {
    const m = (doc.modes || []).find(x => x.id === id);
    return m ? (m.name || m.id) : '?';
}

/** "OFF → ON (ignition on)" label for a transition. */
function tmTransitionLabel(doc, tr) {
    if (!tr) return '(transition?)';
    const f = tmModeName(doc, tr.fromMode);
    const t = tmModeName(doc, tr.toMode);
    return `${f} → ${t}${tr.trigger ? ` (${tr.trigger})` : ''}`;
}

/** The SafeState a mode realizes (modeRefs contains it), or null. */
function tmSafeStateForMode(doc, modeId) {
    return (doc.safeStates || []).find(s => (s.modeRefs || []).includes(modeId)) || null;
}

/** ALL safe states a mode realizes (a mode may realize more than one). */
function tmSafeStatesForMode(doc, modeId) {
    return (doc.safeStates || []).filter(s => (s.modeRefs || []).includes(modeId));
}

/** Resolve the safe state a reaction achieves: the explicitly chosen one,
 *  else the sole safe state its target mode realizes, else first match
 *  (back-compat). Returns a SafeState or null. */
function tmResolveReactionSafeState(doc, reaction, tr) {
    if (reaction && reaction.safeStateRef) {
        const picked = (doc.safeStates || []).find(s => s.id === reaction.safeStateRef);
        if (picked) return picked;
    }
    const realizing = tmSafeStatesForMode(doc, tr ? tr.toMode : null);
    if (realizing.length === 1) return realizing[0];
    return tmSafeStateForMode(doc, tr ? tr.toMode : null);
}

/** DERIVED: does this transition reach a safe state? True iff the target
 *  mode is marked a safe state in Item Definition, or a declared SafeState
 *  references it. No manual flag — the information already lives on the mode. */
function tmReachesSafeState(doc, tr) {
    if (!tr || !tr.toMode) return false;
    const toMode = (doc.modes || []).find(m => m.id === tr.toMode);
    if (!toMode) return false;
    return !!(toMode.isSafeState || tmSafeStateForMode(doc, toMode.id));
}

/** Is the given mode a safe state (by flag or by a SafeState that lists it)? */
function tmModeIsSafe(doc, modeId) {
    const m = (doc.modes || []).find(x => x.id === modeId);
    if (!m) return false;
    return !!(m.isSafeState || tmSafeStateForMode(doc, m.id));
}

/** DERIVED: is this transition a SAFE-STATE REACTION — i.e. the fault
 *  reaction that takes the system FROM a non-safe (operational / hazardous)
 *  state INTO a safe state? A transition between two safe states is NOT a
 *  reaction (nothing is being detected and recovered from), so it does not
 *  demand a detecting element or a detect-and-react TSR. This is the set the
 *  Safe-State Reaction Requirements section and the FTTI reaction check work
 *  on. */
function tmIsSafeStateReaction(doc, tr) {
    if (!tr || !tr.fromMode || !tr.toMode) return false;
    return tmReachesSafeState(doc, tr) && !tmModeIsSafe(doc, tr.fromMode);
}

/** All SafeStateReaction rows allocated to a transition. */
function tmReactionsFor(doc, trId) {
    return (doc.safeStateReactions || []).filter(r => r.transitionId === trId);
}

/** First Safety Goal governing a safe state, or null. */
function tmSgForSafeState(doc, ss) {
    if (!ss) return null;
    for (const id of (ss.sgRefs || [])) {
        const sg = (doc.safetyGoals || []).find(g => g.id === id);
        if (sg) return sg;
    }
    return null;
}

/** Human label for a chain segment's referenced object. */
function tmSegLabel(doc, seg) {
    if (!seg || !seg.refId) return '(unset)';
    if (seg.kind === 'element') {
        const e = (doc.elements || []).find(x => x.id === seg.refId);
        return e ? (e.name || e.id) : '(deleted element)';
    }
    if (seg.kind === 'externalIf') {
        const s = (doc.hsiSignals || []).find(x => x.id === seg.refId);
        return s ? (s.name || s.id) : '(deleted signal)';
    }
    if (seg.kind === 'internalIf') {
        const i = (doc.interfaces || []).find(x => x.id === seg.refId);
        return i ? (i.name || i.id) : '(deleted interface)';
    }
    return '(unset)';
}

/** Option list (value/label) for a segment kind. */
function tmRefOptions(doc, kind) {
    if (kind === 'element') {
        return doc.elementsForDiscipline('system').map(e => ({ value: e.id, label: e.name || e.id }));
    }
    if (kind === 'externalIf') {
        return (doc.hsiSignals || []).map(s => ({ value: s.id, label: (s.name || s.id) + (s.pin ? ` (${s.pin})` : '') }));
    }
    if (kind === 'internalIf') {
        return (doc.interfaces || []).filter(i => i.scope === 'internal')
            .map(i => ({ value: i.id, label: i.name || i.id }));
    }
    return [];
}

/** The time budget a chain must fit: the transition's transitionTime, or
 *  the governing FTTI as a fallback (explicit Safety Goal link first, then
 *  the goal guarding the target safe state). Returns {ms, src, text}. */
function tmChainBudget(doc, tr) {
    if (!tr) return { ms: null, src: null, text: '' };
    const tt = Timing.parseMs(tr.transitionTime);
    if (tt != null && !isNaN(tt)) return { ms: tt, src: 'transition time', text: tr.transitionTime };
    const gov = governingFttiForTransition(doc, tr);
    if (gov.ms != null && !isNaN(gov.ms)) return { ms: gov.ms, src: 'FTTI', text: gov.text };
    return { ms: null, src: null, text: '' };
}

/** The Safety Goal governing a transition (explicit link first, else the
 *  goal guarding the target safe state). UI helper for ASIL/FTTI display. */
function tmGoverningSg(doc, tr) {
    return governingFttiForTransition(doc, tr).sg || null;
}


/** A labelled field built from the app's .req-slot component, so inputs
 *  and selects pick up the standard styling (there is no global input
 *  rule — only .req-slot / .declaration-row style controls). */
function tmSlot(labelText, control, extraStyle) {
    const d = document.createElement('div');
    d.className = 'req-slot';
    if (extraStyle) d.style.cssText = extraStyle;
    if (labelText) {
        const l = document.createElement('label');
        l.textContent = labelText;
        d.appendChild(l);
    }
    d.appendChild(control);
    return d;
}


// =============================================================================
// 1a. Timing chain builder
// =============================================================================

class TimingChainBuilder {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Timing Chains
            <span class="help-icon" title="Pick a mode transition, then list the ordered hops it travels through — external interface, element, internal interface — and budget the time each consumes. The Σ is checked against the transition's time budget. Internal interfaces are declared in the HSI chapter.">?</span>
        </div>`;

        const transitions = this.doc.modeTransitions || [];
        if (transitions.length === 0) {
            const e = document.createElement('div');
            e.style.cssText = 'font-size:12px;color:var(--text-dim);padding:0.25rem 0.5rem;';
            e.textContent = 'No mode transitions declared yet. Add them in System Breakdown (Mode Transitions); a timing chain decomposes one of them.';
            wrap.appendChild(e);
            container.appendChild(wrap);
            return;
        }

        (this.doc.timingChains || []).forEach(chain => wrap.appendChild(this._renderChain(chain, transitions)));

        const add = document.createElement('button');
        add.className = 'btn-add';
        add.style.marginTop = '0.5rem';
        add.textContent = '+ Add timing chain';
        add.addEventListener('click', () => {
            const tc = new TimingChain();
            tc.id = this.doc.nextId('timingChain');
            (this.doc.timingChains ||= []).push(tc);
            this.onChange();
        });
        wrap.appendChild(add);
        container.appendChild(wrap);
    }

    _renderChain(chain, transitions) {
        const box = document.createElement('div');
        box.style.cssText = 'background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;padding:0.6rem 0.75rem;margin-bottom:0.6rem;';

        // Control row: id badge · transition select · name · delete
        const ctl = document.createElement('div');
        ctl.style.cssText = 'display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap;margin-bottom:0.6rem;';

        // ID badge — the Timing Diagnostics list refers to a chain by this
        // ID (e.g. "TC-0001") when it has no label, so it must be visible
        // here to be locatable.
        const idBadge = document.createElement('span');
        idBadge.className = 'req-id';
        idBadge.textContent = chain.id;
        idBadge.title = 'Chain ID — this is the "TC-…" the Timing Diagnostics list refers to.';
        idBadge.style.cssText = 'align-self:center;font-family:var(--font-mono);';
        ctl.appendChild(idBadge);

        const trSel = document.createElement('select');
        trSel.classList.add('select-truncate');
        trSel.style.maxWidth = '320px';
        const def = document.createElement('option');
        def.value = ''; def.textContent = '— mode transition —';
        trSel.appendChild(def);
        transitions.forEach(tr => {
            const o = document.createElement('option');
            o.value = tr.id; o.textContent = tmTransitionLabel(this.doc, tr) + (tmReachesSafeState(this.doc, tr) ? '  ⛟ safe state' : '');
            if (chain.modeTransitionId === tr.id) o.selected = true;
            trSel.appendChild(o);
        });
        trSel.addEventListener('change', () => { chain.modeTransitionId = trSel.value; this.onChange(); });
        ctl.appendChild(tmSlot('Mode transition', trSel, 'flex:0 0 320px;'));

        const name = document.createElement('input');
        name.type = 'text'; name.value = chain.name || ''; name.placeholder = 'chain label (optional)';
        name.addEventListener('input', () => { chain.name = name.value; });
        name.addEventListener('change', () => setTimeout(() => this.onChange(), 0));
        ctl.appendChild(tmSlot('Chain label', name, 'flex:1;min-width:160px;'));

        const del = document.createElement('button');
        del.className = 'del-btn req-delete';
        del.title = 'Delete this chain'; del.textContent = '✕';
        del.style.alignSelf = 'end';
        del.addEventListener('click', () => {
            this.doc.timingChains = (this.doc.timingChains || []).filter(c => c.id !== chain.id);
            this.onChange();
        });
        ctl.appendChild(del);
        box.appendChild(ctl);

        chain.segments.forEach((seg, idx) => box.appendChild(this._renderSegment(chain, seg, idx)));

        const addSeg = document.createElement('button');
        addSeg.className = 'btn-add';
        addSeg.style.marginTop = '0.35rem';
        addSeg.textContent = '+ Add hop';
        addSeg.addEventListener('click', () => {
            chain.segments.push({ kind: 'element', refId: '', budget: '', note: '' });
            this.onChange();
        });
        box.appendChild(addSeg);

        // Σ vs budget footer (live on budget input)
        const footer = document.createElement('div');
        footer.style.cssText = 'margin-top:0.5rem;font-size:12px;font-family:var(--font-mono);padding:0.35rem 0.6rem;border-radius:4px;border:1px solid transparent;';
        const tr = transitions.find(t => t.id === chain.modeTransitionId);
        const paint = () => {
            const budget = tmChainBudget(this.doc, tr);
            let sum = 0, missing = 0;
            chain.segments.forEach(s => {
                const b = Timing.parseMs(s.budget);
                if (b == null || isNaN(b)) { if (s.refId) missing++; } else sum += b;
            });
            const sumTxt = Timing.formatMs(sum) || '0 ms';
            if (!tr) {
                footer.style.background = 'var(--bg-hover)'; footer.style.borderColor = 'var(--border-mid)'; footer.style.color = 'var(--text-mid)';
                footer.textContent = 'Pick a mode transition to budget this chain.';
            } else if (budget.ms == null) {
                footer.style.background = 'var(--bg-hover)'; footer.style.borderColor = 'var(--border-mid)'; footer.style.color = 'var(--text-mid)';
                footer.textContent = `Σ ${sumTxt} · the transition has no time budget and no governing FTTI to check against.`;
            } else {
                const over = sum > budget.ms;
                footer.style.background = over ? 'var(--red-bg)' : (missing ? 'var(--bg-hover)' : 'var(--green-bg)');
                footer.style.borderColor = over ? 'var(--red)' : (missing ? 'var(--border-mid)' : 'var(--green)');
                footer.style.color = over ? 'var(--red)' : (missing ? 'var(--text-mid)' : 'var(--green)');
                footer.textContent = `Σ ${sumTxt} / ${budget.text} (${budget.src})`
                    + (over ? ' — OVER BUDGET' : (missing ? ` · ${missing} hop(s) missing a budget` : ' — within budget ✓'));
            }
        };
        this._paint = paint;
        paint();
        box.appendChild(footer);
        return box;
    }

    _renderSegment(chain, seg, idx) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap;padding:0.3rem 0 0.3rem;border-top:1px solid var(--border);';

        const kindSel = document.createElement('select');
        kindSel.classList.add('select-truncate');
        [['externalIf', 'External signal'], ['element', 'Element'], ['internalIf', 'Internal interface']].forEach(([v, l]) => {
            const o = document.createElement('option'); o.value = v; o.textContent = l;
            if (seg.kind === v) o.selected = true; kindSel.appendChild(o);
        });
        kindSel.addEventListener('change', () => { seg.kind = kindSel.value; seg.refId = ''; this.onChange(); });

        const refSel = document.createElement('select');
        refSel.classList.add('select-truncate');
        [{ value: '', label: '— reference —' }].concat(tmRefOptions(this.doc, seg.kind)).forEach(o => {
            const opt = document.createElement('option'); opt.value = o.value; opt.textContent = o.label;
            if (seg.refId === o.value) opt.selected = true; refSel.appendChild(opt);
        });
        refSel.addEventListener('change', () => { seg.refId = refSel.value; this.onChange(); });

        const budget = document.createElement('input');
        budget.type = 'text'; budget.value = seg.budget || ''; budget.placeholder = '20 ms';
        budget.addEventListener('input', () => { seg.budget = budget.value; if (this._paint) this._paint(); });
        budget.addEventListener('change', () => setTimeout(() => this.onChange(), 0));

        const note = document.createElement('input');
        note.type = 'text'; note.value = seg.note || ''; note.placeholder = 'optional';
        note.addEventListener('input', () => { seg.note = note.value; });
        note.addEventListener('change', () => setTimeout(() => this.onChange(), 0));

        const rm = document.createElement('button');
        rm.className = 'del-btn req-delete'; rm.title = 'Remove hop'; rm.textContent = '✕';
        rm.style.alignSelf = 'end';
        rm.addEventListener('click', () => { chain.segments.splice(idx, 1); this.onChange(); });

        row.appendChild(tmSlot('Kind', kindSel, 'flex:0 0 150px;'));
        row.appendChild(tmSlot('Reference', refSel, 'flex:1;min-width:160px;'));
        row.appendChild(tmSlot('Budget', budget, 'flex:0 0 110px;'));
        row.appendChild(tmSlot('Note', note, 'flex:1;min-width:130px;'));
        row.appendChild(rm);
        return row;
    }
}


// =============================================================================
// 1b. Timing diagnostic
// =============================================================================

class TimingDiagnostic {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const v = new DocumentValidator(this.doc);
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Timing Diagnostics
            <span class="help-icon" title="Per-chain Σ of hop budgets vs the transition's time budget, plus the safe-state transition-time crosscheck. Updates whenever the data changes; nothing here blocks save.">?</span>
        </div>`;

        const results = v.timingChainCheck();
        const block = document.createElement('div');
        block.style.marginBottom = '0.75rem';
        const h = document.createElement('div');
        h.style.cssText = 'font-size:11px;text-transform:uppercase;color:var(--text-dim);letter-spacing:0.5px;margin-bottom:0.3rem;';
        h.innerHTML = `Chain budgets <span class="count-badge">${results.length}</span>`;
        block.appendChild(h);

        if (results.length === 0) {
            const ok = document.createElement('div');
            ok.style.cssText = 'font-size:12px;color:var(--text-dim);padding:0.25rem 0.5rem;';
            ok.textContent = 'No timing chains declared yet.';
            block.appendChild(ok);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'summary-list';
            results.forEach(r => {
                let txt, cls;
                // Every line identifies the chain AND its anchored
                // transition (ID + FROM → TO), so the user can find the
                // right row without decoding IDs (v1.6.3).
                const who = r.trLabel ? `${r.name} — transition ${r.trLabel}` : r.name;
                if (r.status === 'no-transition')   { txt = `${r.name}: not anchored to a mode transition — pick one in the chain's "Mode transition" dropdown.`; cls = 'warn'; }
                else if (r.status === 'no-budget')  { txt = `${who}: the transition has no time budget and no governing FTTI.`; cls = 'warn'; }
                else if (r.status === 'incomplete') { txt = `${who}: ${r.missingBudgets} hop(s) still need a budget (Σ ${Timing.formatMs(r.sumMs) || '0 ms'} so far).`; cls = 'warn'; }
                else if (r.status === 'over')       { txt = `${who}: Σ ${Timing.formatMs(r.sumMs)} exceeds ${Timing.formatMs(r.budgetMs)} (${r.budgetSource}).`; cls = 'error'; }
                else                                { txt = `${r.name}: Σ ${Timing.formatMs(r.sumMs)} within ${Timing.formatMs(r.budgetMs)} (${r.budgetSource}). ✓`; cls = 'ok'; }
                if (r.dangling > 0) txt += ` · ${r.dangling} dangling reference(s).`;
                const li = document.createElement('li');
                li.className = cls === 'ok' ? '' : cls;
                li.innerHTML = `<span style="${cls === 'ok' ? 'color:var(--green);' : ''}">${tmEsc(txt)}</span>`;
                ul.appendChild(li);
            });
            block.appendChild(ul);
        }
        wrap.appendChild(block);

        // Safe-state REACTIONS (non-safe → safe transitions). The FTTI
        // timing check and the coverage warning both work on this set, so a
        // transition between two safe states never raises a spurious
        // "no detecting element" warning.
        const issues = v.safeStateTransitionCheck();
        const reactions = (this.doc.modeTransitions || []).filter(t => tmIsSafeStateReaction(this.doc, t));
        const h2 = document.createElement('div');
        h2.style.cssText = 'font-size:11px;text-transform:uppercase;color:var(--text-dim);letter-spacing:0.5px;margin-bottom:0.3rem;';
        h2.innerHTML = `Safe-state reactions <span class="count-badge">${reactions.length}</span>`;
        wrap.appendChild(h2);
        if (reactions.length === 0) {
            const none = document.createElement('div');
            none.style.cssText = 'font-size:12px;color:var(--text-dim);padding:0.25rem 0.5rem;';
            none.textContent = 'No safe-state reactions yet (a reaction is a transition from a non-safe state into a safe state).';
            wrap.appendChild(none);
        } else {
            const ul = document.createElement('ul');
            ul.className = 'summary-list';
            // timing issues (transition time vs FTTI)
            issues.forEach(it => {
                const li = document.createElement('li');
                li.className = it.kind === 'ttime-over-ftti' ? 'error' : 'warn';
                li.innerHTML = `<span>${tmEsc(it.text)}</span>`;
                ul.appendChild(li);
            });
            // coverage: a reaction transition with no reaction row, or a row
            // missing its detecting element
            reactions.forEach(t => {
                const rows = tmReactionsFor(this.doc, t.id);
                if (rows.length === 0) {
                    const li = document.createElement('li'); li.className = 'warn';
                    li.innerHTML = `<span>${tmEsc(`Safe-state reaction ${tmTransitionLabel(this.doc, t)} has no reaction requirement — add one in Safe-State Reaction Requirements to generate its TSR.`)}</span>`;
                    ul.appendChild(li);
                } else if (rows.some(r => !r.detectingElementId)) {
                    const li = document.createElement('li'); li.className = 'warn';
                    li.innerHTML = `<span>${tmEsc(`Safe-state reaction ${tmTransitionLabel(this.doc, t)} has a reaction requirement with no detecting element assigned.`)}</span>`;
                    ul.appendChild(li);
                }
            });
            if (ul.children.length === 0) {
                const ok = document.createElement('li');
                ok.innerHTML = `<span style="color:var(--green);">✓ Every safe-state reaction fits its FTTI and has a detecting element assigned.</span>`;
                ul.appendChild(ok);
            }
            wrap.appendChild(ul);
        }

        // Hazardous states with no safe-state reaction path — the warning
        // about the ACTUAL dangerous states. A non-safe mode from which no
        // transition path reaches any safe state is a trap: it cannot be
        // recovered to a safe state.
        const hazards = v.hazardousStatesWithoutSafeReaction();
        const h3 = document.createElement('div');
        h3.style.cssText = 'font-size:11px;text-transform:uppercase;color:var(--text-dim);letter-spacing:0.5px;margin:0.6rem 0 0.3rem;';
        h3.innerHTML = `Hazardous states without a safe-state reaction <span class="count-badge">${hazards.length}</span>`;
        wrap.appendChild(h3);
        if (hazards.length === 0) {
            const ok = document.createElement('div');
            ok.style.cssText = 'font-size:12px;color:var(--green);padding:0.25rem 0.5rem;';
            ok.textContent = '✓ Every non-safe mode can reach a safe state.';
            wrap.appendChild(ok);
        } else {
            const ul2 = document.createElement('ul');
            ul2.className = 'summary-list';
            hazards.forEach(it => {
                const li = document.createElement('li'); li.className = 'error';
                li.innerHTML = `<span>${tmEsc(it.text)}</span>`;
                ul2.appendChild(li);
            });
            wrap.appendChild(ul2);
        }
        container.appendChild(wrap);
    }
}


// =============================================================================
// 1c. Chain → element-requirement generator
// =============================================================================

class ChainRequirementGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    _transitionFor(chain) {
        return (this.doc.modeTransitions || []).find(t => t.id === chain.modeTransitionId);
    }
    _ready(chain) {
        const tr = this._transitionFor(chain);
        if (!tr || !tr.fromMode || !tr.toMode || !tr.trigger) return false;
        const elemSegs = chain.segments.filter(s => s.kind === 'element' && s.refId);
        if (elemSegs.length === 0) return false;
        // ready if any element req for this transition is still missing,
        // or the acceptance req is missing
        const fromMode = (this.doc.modes || []).find(m => m.id === tr.fromMode);
        const toMode   = (this.doc.modes || []).find(m => m.id === tr.toMode);
        const fromName = fromMode ? (fromMode.name || fromMode.id) : tr.fromMode;
        const toName   = toMode ? (toMode.name || toMode.id) : tr.toMode;
        const accMissing = !this.doc.requirements.some(r =>
            r.chapterId === 'ch05_acceptance' && r.predicate === 'transition' &&
            r.fromState === fromName && r.toState === toName && r.trigger === tr.trigger);
        const elemMissing = elemSegs.some(seg => !this.doc.requirements.some(r =>
            r.chapterId === 'ch07_elements' && r.elementId === seg.refId && r.source === tr.id));
        return accMissing || elemMissing;
    }

    generate() {
        let added = 0;
        (this.doc.timingChains || []).forEach(chain => {
            const tr = this._transitionFor(chain);
            if (!tr || !tr.fromMode || !tr.toMode || !tr.trigger) return;
            const fromMode = this.doc.modes.find(m => m.id === tr.fromMode);
            const toMode   = this.doc.modes.find(m => m.id === tr.toMode);
            if (!fromMode || !toMode) return;
            const fromName = fromMode.name || fromMode.id;
            const toName   = toMode.name   || toMode.id;
            const elemSegs = chain.segments.filter(s => s.kind === 'element' && s.refId);
            if (elemSegs.length === 0) return;

            const ss  = tmSafeStateForMode(this.doc, toMode.id);
            const sg  = tmGoverningSg(this.doc, tr);
            const asil = sg ? sg.asil : '';
            const safeLabel = ss ? (ss.description || toName) : toName;
            const ftti = sg ? sg.ftti : '';
            // Entry signal (for the "on <signal>" wording of the reaction):
            // the first external/internal interface hop of the chain.
            const entrySeg = chain.segments.find(s =>
                (s.kind === 'externalIf' || s.kind === 'internalIf') && s.refId);
            const entryName = entrySeg ? tmSegLabel(this.doc, entrySeg) : '';

            // Find-or-create the acceptance requirement for this transition,
            // using the SAME match keys as the System-Breakdown generator so
            // we never duplicate one it already made.
            let acc = this.doc.requirements.find(r =>
                r.chapterId === 'ch05_acceptance' && r.predicate === 'transition' &&
                r.fromState === fromName && r.toState === toName && r.trigger === tr.trigger);
            if (!acc) {
                acc = new Requirement({
                    chapterId: 'ch05_acceptance', conditional: 'when', conditionalText: tr.trigger,
                    subject: 'the system', predicate: 'transition',
                    fromState: fromName, toState: toName, trigger: tr.trigger,
                    transitionTime: tr.transitionTime || '', asil: asil,
                    rationale: `Generated from mode transition ${tr.id} (${fromName} → ${toName}).`,
                    verification: ['inspection']
                });
                acc.id = this.doc.nextId('requirement');
                acc.modifiedAt = new Date().toISOString();
                this.doc.requirements.push(acc);
                added++;
            }

            // One element TSR per element hop. For a transition the author
            // flagged as a safe-state transition, the TERMINAL element hop
            // is the safety mechanism that drives the safe state, so it is
            // emitted as a detect-and-react TSR (FRTI end of the chain);
            // every other hop is a propagation (process) TSR. For ordinary
            // transitions, all hops are process TSRs.
            elemSegs.forEach((seg) => {
                const el = this.doc.elements.find(e => e.id === seg.refId);
                if (!el) return;
                const exists = this.doc.requirements.some(r =>
                    r.chapterId === 'ch07_elements' && r.elementId === seg.refId &&
                    r.source === tr.id && r.predicate === 'process');
                if (exists) return;
                const r = new Requirement({
                    chapterId: 'ch07_elements', elementId: el.id, subject: el.name || el.id,
                    conditional: 'when', conditionalText: tr.trigger,
                    predicate: 'process',
                    input: `the ${fromName} → ${toName} transition request`,
                    output: 'its part of the transition',
                    envelope: seg.budget ? `within ${seg.budget}` : '',
                    asil: asil, parentAcceptanceReqs: [acc.id], source: tr.id,
                    rationale: `Generated from timing chain ${chain.id} — ${el.name || el.id} hop of ${fromName} → ${toName} (budget ${seg.budget || 'unset'}).`,
                    verification: ['inspection']
                });
                r.id = this.doc.nextId('requirement');
                r.modifiedAt = new Date().toISOString();
                this.doc.requirements.push(r);
                added++;
            });
        });

        // Reactions: each SafeStateReaction row on a transition that is a
        // genuine safe-state reaction (non-safe → safe) and names a detecting
        // element becomes a standalone detect-and-react TSR — no timing chain
        // required. A transition may have several reactions (the same fault
        // observed on different interfaces); each yields its own TSR,
        // de-duplicated by reactionRef so siblings are not collapsed.
        (this.doc.safeStateReactions || []).forEach(reaction => {
            const tr = (this.doc.modeTransitions || []).find(t => t.id === reaction.transitionId);
            if (!tr || !tr.trigger) return;
            if (!tmIsSafeStateReaction(this.doc, tr)) return;
            if (!reaction.detectingElementId) return;
            const el = this.doc.elements.find(e => e.id === reaction.detectingElementId);
            if (!el) return;
            if (this.doc.requirements.some(r =>
                r.chapterId === 'ch07_elements' && r.predicate === 'detect' &&
                r.reactionRef === reaction.id)) return;
            const acc = this._acceptanceFor(tr);
            if (acc.added) added++;
            const toMode = this.doc.modes.find(m => m.id === tr.toMode);
            const ss = tmResolveReactionSafeState(this.doc, reaction, tr);
            const sg = tmSgForSafeState(this.doc, ss);
            const safeLabel = ss ? (ss.description || (toMode && toMode.name) || tr.toMode)
                                 : ((toMode && toMode.name) || tr.toMode);
            const time = reaction.reactionBudget || tr.transitionTime || (sg ? sg.ftti : '');
            let sigName = '';
            if (reaction.observedSignalId && reaction.observedSignalId.indexOf(':') > -1) {
                const k = reaction.observedSignalId.slice(0, reaction.observedSignalId.indexOf(':'));
                const id = reaction.observedSignalId.slice(reaction.observedSignalId.indexOf(':') + 1);
                const obj = k === 'sig'
                    ? (this.doc.hsiSignals || []).find(s => s.id === id)
                    : (this.doc.interfaces || []).find(i => i.id === id);
                if (obj) sigName = obj.name || obj.id;
            }
            const r = new Requirement({
                chapterId: 'ch07_elements', elementId: el.id, subject: el.name || el.id,
                conditional: 'ubiquitous', predicate: 'detect',
                condition: tr.trigger + (sigName ? ` on ${sigName}` : ''),
                reaction: `transition the system to ${safeLabel}`,
                detectionTime: time || '',
                safeStateRef: ss ? ss.id : '',
                asil: sg ? sg.asil : '', parentAcceptanceReqs: [acc.req.id],
                source: tr.id, reactionRef: reaction.id,
                rationale: `Generated safe-state reaction — ${el.name || el.id} detects "${tr.trigger}"${sigName ? ` on ${sigName}` : ''} and drives ${safeLabel}.`,
                verification: ['inspection']
            });
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            this.doc.requirements.push(r);
            added++;
        });

        return added;
    }

    /** Find-or-create the transition acceptance requirement, with the same
     *  match keys the System-Breakdown generator uses (so no duplicate).
     *  Returns { req, added }. */
    _acceptanceFor(tr) {
        const fromMode = this.doc.modes.find(m => m.id === tr.fromMode);
        const toMode   = this.doc.modes.find(m => m.id === tr.toMode);
        const fromName = fromMode ? (fromMode.name || fromMode.id) : tr.fromMode;
        const toName   = toMode ? (toMode.name || toMode.id) : tr.toMode;
        let acc = this.doc.requirements.find(r =>
            r.chapterId === 'ch05_acceptance' && r.predicate === 'transition' &&
            r.fromState === fromName && r.toState === toName && r.trigger === tr.trigger);
        if (acc) return { req: acc, added: false };
        const sg = tmSgForSafeState(this.doc, tmSafeStateForMode(this.doc, tr.toMode));
        acc = new Requirement({
            chapterId: 'ch05_acceptance', conditional: 'when', conditionalText: tr.trigger,
            subject: 'the system', predicate: 'transition',
            fromState: fromName, toState: toName, trigger: tr.trigger,
            transitionTime: tr.transitionTime || '', asil: sg ? sg.asil : '',
            rationale: `Generated from mode transition ${tr.id} (${fromName} → ${toName}).`,
            verification: ['inspection']
        });
        acc.id = this.doc.nextId('requirement');
        acc.modifiedAt = new Date().toISOString();
        this.doc.requirements.push(acc);
        return { req: acc, added: true };
    }

    /** Count of safe-state reaction rows (on genuine non-safe → safe
     *  transitions) that name a detecting element but whose detect TSR is
     *  not yet generated. */
    _reactionsReady() {
        return (this.doc.safeStateReactions || []).filter(reaction => {
            const tr = (this.doc.modeTransitions || []).find(t => t.id === reaction.transitionId);
            if (!tr || !tr.trigger || !tmIsSafeStateReaction(this.doc, tr)) return false;
            if (!reaction.detectingElementId) return false;
            return !this.doc.requirements.some(r =>
                r.chapterId === 'ch07_elements' && r.predicate === 'detect' &&
                r.reactionRef === reaction.id);
        }).length;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        this._renderBody(wrap);
        container.appendChild(wrap);
    }

    /** Body render, separated so the ⟳ Refresh button can re-read the
     *  chains/reactions state above WITHOUT relying on the editor's
     *  event chain (v1.6.3 — same pattern as the HSI generator). The doc
     *  object is shared and mutated in place by the sections above, so a
     *  re-read is always current. */
    _renderBody(wrap) {
        wrap.innerHTML = `<div class="section-title">Generate Requirements
            <span class="help-icon" title="One click generates everything: per timing chain — the transition acceptance requirement (Chapter 4) and a process TSR per element hop (Chapter 6); per safe-state transition that has a detecting element assigned above — the detect-and-react safety-mechanism TSR (Chapter 6), with no chain required. Re-clicking is safe; existing requirements are skipped.">?</span>
            <button class="btn-add" style="font-size:11px;" title="Re-read the chains and safe-state reactions above and recompute what can be generated.">⟳ Refresh</button>
        </div>`;
        wrap.querySelector('.section-title button').addEventListener('click',
            () => this._renderBody(wrap));

        const chainsReady = (this.doc.timingChains || []).filter(c => this._ready(c)).length;
        const reactionsReady = this._reactionsReady();
        const total = chainsReady + reactionsReady;

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:var(--text-mid);margin-bottom:0.5rem;';
        summary.innerHTML = `<strong>${chainsReady}</strong> chain(s) and <strong>${reactionsReady}</strong> safe-state reaction(s) with requirements still to generate.`;
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn-add btn-generate';
        btn.textContent = 'Generate all timing requirements → Chapters 4 & 6';
        btn.disabled = total === 0;
        wrap.appendChild(btn);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;display:none;';
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            setTimeout(() => this.onChange(), 0);
            status.style.display = 'block';
            if (n === 0) {
                status.style.background = 'var(--bg-hover)'; status.style.color = 'var(--text-mid)';
                status.textContent = 'Nothing to do — everything derivable is already generated.';
            } else {
                status.style.background = 'var(--green-bg)'; status.style.color = 'var(--green)';
                status.textContent = `Added ${n} requirement(s): transition acceptance requirements → Chapter 4, element process TSRs and safe-state detect-and-react TSRs → Chapter 6. Open those chapters to refine attributes.`;
            }
        });
    }
}



// =============================================================================
// 2. Safe-state reaction setup (assign the "who/signal/time"; the single
//    end-of-chapter generator turns these into detect-and-react TSRs)
// =============================================================================

class SafeStateReactionSetup {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    /** Transitions that are genuine safe-state reactions: a triggered
     *  transition FROM a non-safe state INTO a safe state. Safe→safe
     *  transitions are excluded — they are not fault reactions. */
    _reactionTransitions() {
        return (this.doc.modeTransitions || []).filter(tr =>
            tmIsSafeStateReaction(this.doc, tr) && tr.trigger);
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Safe-State Reaction Requirements
            <span class="help-icon" title="Lists every safe-state REACTION: a transition from a non-safe (operational/hazardous) state into a safe state. Transitions between two safe states are not reactions and are not listed. For each reaction, add one or more rows saying WHO detects the fault and commands the safe state, on WHICH interface/signal it is observed, and in WHAT time. A single transition may carry several reactions (e.g. the same fault observed on different interfaces). The Generate button at the end turns each row into a detect-and-react TSR — no timing chain required. ASIL and FTTI are inherited from the Safety Goal governing the target safe state.">?</span>
        </div>`;

        const reactions = this._reactionTransitions();
        if (reactions.length === 0) {
            const e = document.createElement('div');
            e.style.cssText = 'font-size:12px;color:var(--text-dim);padding:0.25rem 0.5rem;';
            e.textContent = 'No safe-state reactions yet. A reaction is a transition from a non-safe state into a safe state (target marked a safe state in Item Definition). Declare such transitions in System Breakdown and they appear here automatically.';
            wrap.appendChild(e);
            container.appendChild(wrap);
            return;
        }

        const elems = this.doc.elementsForDiscipline('system');
        const signals = (this.doc.hsiSignals || []).map(s => ({ value: 'sig:' + s.id, label: 'signal ' + (s.name || s.id), consumer: s.consumerElementId || '' }))
            .concat((this.doc.interfaces || []).filter(i => i.scope === 'internal').map(i => ({ value: 'iif:' + i.id, label: 'interface ' + (i.name || i.id), consumer: i.consumerElementId || '' })));

        reactions.forEach(tr => {
            const toMode = this.doc.modes.find(m => m.id === tr.toMode);
            const ss = tmSafeStateForMode(this.doc, tr.toMode);
            const safeLabel = ss ? (ss.description || (toMode && toMode.name) || tr.toMode) : ((toMode && toMode.name) || tr.toMode);
            const sg = tmSgForSafeState(this.doc, ss);

            const box = document.createElement('div');
            box.style.cssText = 'background:var(--bg-elevated);border:1px solid var(--border);border-radius:6px;padding:0.5rem 0.65rem;margin-bottom:0.5rem;';

            // Header maps the Safety Goal / ASIL / FTTI onto this transition.
            const label = document.createElement('div');
            label.style.cssText = 'font-size:12px;color:var(--text-mid);margin-bottom:0.4rem;';
            label.innerHTML = `<strong>${tmEsc(tmTransitionLabel(this.doc, tr))}</strong> → safe state: ${tmEsc(safeLabel)}`
                + (sg ? ` · governed by ${tmEsc(sg.name || sg.id)} · ${tmEsc(sg.asil || 'QM')}${sg.ftti ? ' · FTTI ' + tmEsc(sg.ftti) : ''}`
                      : ` · <span style="color:var(--amber);">no governing Safety Goal — link the safe state to one to inherit ASIL/FTTI</span>`);
            box.appendChild(label);

            // One editable row per SafeStateReaction allocated to this transition.
            const rows = tmReactionsFor(this.doc, tr.id);
            rows.forEach(reaction => box.appendChild(this._renderReactionRow(tr, reaction, elems, signals, sg)));

            if (rows.length === 0) {
                const hint = document.createElement('div');
                hint.style.cssText = 'font-size:11px;color:var(--amber);margin:0.15rem 0 0.35rem;';
                hint.textContent = 'No reaction requirement yet — add one to say who detects the fault and drives the safe state.';
                box.appendChild(hint);
            }

            const add = document.createElement('button');
            add.className = 'btn-add';
            add.style.marginTop = '0.35rem';
            add.textContent = '+ Add reaction requirement';
            add.title = 'Add another way this safe state is reached (e.g. the fault observed on a different interface).';
            add.addEventListener('click', () => {
                const r = new SafeStateReaction({ transitionId: tr.id });
                r.id = this.doc.nextId('safeStateReaction');
                (this.doc.safeStateReactions ||= []).push(r);
                this.onChange();
            });
            box.appendChild(add);

            wrap.appendChild(box);
        });
        container.appendChild(wrap);
    }

    _renderReactionRow(tr, reaction, elems, signals, sg) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap;padding:0.3rem 0;border-top:1px solid var(--border);';

        // WHO — detecting element
        const elSel = document.createElement('select');
        const ed = document.createElement('option'); ed.value = ''; ed.textContent = '— element —'; elSel.appendChild(ed);
        elems.forEach(e => { const o = document.createElement('option'); o.value = e.id; o.textContent = e.name || e.id; if (reaction.detectingElementId === e.id) o.selected = true; elSel.appendChild(o); });
        elSel.addEventListener('change', () => { reaction.detectingElementId = elSel.value; this.onChange(); });
        row.appendChild(tmSlot('Detected by', elSel, 'flex:0 0 180px;'));

        // OBSERVED ON — signal / internal interface the fault is seen on
        const sigSel = document.createElement('select');
        const sd = document.createElement('option'); sd.value = ''; sd.textContent = '— interface / signal —'; sigSel.appendChild(sd);
        signals.forEach(s => { const o = document.createElement('option'); o.value = s.value; o.textContent = s.label; if (reaction.observedSignalId === s.value) o.selected = true; sigSel.appendChild(o); });
        sigSel.addEventListener('change', () => {
            reaction.observedSignalId = sigSel.value;
            const s = signals.find(x => x.value === sigSel.value);
            if (s && s.consumer && !reaction.detectingElementId && elems.some(e => e.id === s.consumer)) {
                reaction.detectingElementId = s.consumer;
            }
            this.onChange();
        });
        row.appendChild(tmSlot('Observed on', sigSel, 'flex:0 0 200px;'));

        // ACHIEVES SAFE STATE — which safe state this reaction reaches.
        // Options are the safe states the target mode realises (selection,
        // not authoring — the binding lives in the Safe States table). Auto-
        // selected when the mode realises exactly one; required to pick when
        // it realises several, so ASIL/FTTI are unambiguous.
        const ssOpts = tmSafeStatesForMode(this.doc, tr.toMode);
        const effectiveSs = (reaction.safeStateRef
            || (ssOpts.length === 1 ? ssOpts[0].id : ''));
        const ssSel = document.createElement('select');
        const sp = document.createElement('option'); sp.value = '';
        sp.textContent = ssOpts.length ? '— safe state —' : '(none declared)';
        ssSel.appendChild(sp);
        ssOpts.forEach(s => {
            const o = document.createElement('option');
            o.value = s.id; o.textContent = s.description || s.id;
            if (effectiveSs === s.id) o.selected = true;
            ssSel.appendChild(o);
        });
        ssSel.addEventListener('change', () => { reaction.safeStateRef = ssSel.value; this.onChange(); });
        row.appendChild(tmSlot('Achieves safe state', ssSel, 'flex:0 0 200px;'));
        if (ssOpts.length > 1 && !reaction.safeStateRef) {
            const pick = document.createElement('span');
            pick.style.cssText = 'font-size:11px;color:var(--amber);align-self:center;';
            pick.textContent = 'pick one (mode realises several)';
            row.appendChild(pick);
        }

        // TIME — reaction budget (defaults shown from transition time / FTTI)
        const time = document.createElement('input');
        time.type = 'text'; time.value = reaction.reactionBudget || '';
        time.placeholder = tr.transitionTime || (sg ? sg.ftti : '') || 'e.g. 50 ms';
        time.addEventListener('input', () => { reaction.reactionBudget = time.value; });
        time.addEventListener('change', () => setTimeout(() => this.onChange(), 0));
        row.appendChild(tmSlot('Within', time, 'flex:0 0 120px;'));

        const del = document.createElement('button');
        del.className = 'del-btn req-delete'; del.title = 'Remove this reaction requirement'; del.textContent = '✕';
        del.style.alignSelf = 'end';
        del.addEventListener('click', () => {
            this.doc.safeStateReactions = (this.doc.safeStateReactions || []).filter(r => r.id !== reaction.id);
            this.onChange();
        });
        row.appendChild(del);

        if (!reaction.detectingElementId) {
            const flag = document.createElement('span');
            flag.style.cssText = 'font-size:11px;color:var(--amber);align-self:center;';
            flag.textContent = 'needs an element';
            row.appendChild(flag);
        }
        return row;
    }
}

Chapters.register('system', {
    id: 'ch_timing',
    number: '7',
    title: 'Timing Analysis',
    order: 110,
    intro: 'Timing analysis of the safety concept (ISO 26262-1, FTTI = FDTI + FRTI). Two parts. Timing Chains decompose a mode transition into the ordered hops it travels (external interface → element → internal interface), budgeting each hop and checking the Σ against the transition\'s time budget — these produce the per-element propagation requirements; each chain shows its TC-… ID so the diagnostics can refer to it. Safe-State Reaction Requirements lists every safe-state REACTION — a transition from a non-safe (operational/hazardous) state into a safe state — and lets you add one or more reaction requirements per transition (who detects the fault, on which interface, in what time), with ASIL/FTTI inherited from the governing Safety Goal. A single reaction transition can carry several requirements when the same fault is observed on different interfaces. The single Generate button at the end produces everything: transition acceptance requirements (Chapter 4) and the element TSRs (Chapter 6). Internal interfaces are declared in the HSI chapter.',
    allowsRequirements: false,
    subjectMode: 'none',
    authoring: true,
    declarations: [],
    extraWidgets: (doc, onChange) => [
        new TimingChainBuilder(doc, onChange),
        new SafeStateReactionSetup(doc, onChange),
        new TimingDiagnostic(doc),
        new ChainRequirementGenerator(doc, onChange)
    ],
    checklist: [
        { id: 'ct1', text: 'Every safety-relevant mode transition has a timing chain.',
          help: 'A chain decomposes the transition into element/interface hops with time budgets.' },
        { id: 'ct2', text: 'Every chain Σ of hop budgets is within the transition time budget / FTTI.',
          help: 'The Timing Diagnostics list flags over-budget chains.' },
        { id: 'ct3', text: 'Every internal interface used in a chain has a producer, consumer and budget.',
          help: 'Internal interfaces are declared in the HSI chapter.' },
        { id: 'ct4', text: 'Every safe-state reaction (non-safe → safe) has at least one reaction requirement with a detecting element.',
          help: 'Safe-State Reaction Requirements lists them; add a row per detecting element / observed interface. Hazardous modes that cannot reach any safe state are flagged separately in Timing Diagnostics.' },
        { id: 'ct5', text: 'Requirements generated (Generate button at the end).',
          help: 'Acceptance requirements → Chapter 4; element process + detect-and-react TSRs → Chapter 6.' }
    ]
});
