/**
 * declarations/modeTransition.js
 *
 * Declaration kind: 'modeTransition' — directed edges in the mode graph.
 * Lives in the System Breakdown chapter. The mode simulator widget
 * (disciplines/system/ch06_breakdown.js) walks this graph.
 *
 * Trigger and guard values are banked into doc.lexicon.triggers on
 * commit (blur/Enter) so future rows autocomplete and the simulator's
 * trigger picker has the full vocabulary even before everything is
 * wired up.
 */

Declarations.register('modeTransition', {
    title: 'Mode Transitions',
    sectionHelp: 'Directed edges in the mode/state model. Each transition has source mode, target mode, trigger that fires it, optional guard condition, and a time budget.',
    singular: 'Transition',
    helpHeaders: {
        'From':    'Source mode the transition starts in.',
        'To':      'Target mode the transition ends in.',
        'Trigger': 'Event or condition that causes the transition to fire.',
        'Guard':   'Optional precondition that must be true for the trigger to take effect.',
        'Time':    'Time budget for the transition to complete (e.g. "100 ms"). Compared against the governing FTTI by the timing diagnostic.',
        'Safety Goal': 'Optional. The Safety Goal whose FTTI governs this transition\'s time budget. Set it to time-check a transition against a real FTTI WITHOUT marking its target a safe state. Leave empty to fall back to the FTTI of the goal guarding the target safe state (if any). Linking a goal here does NOT make the target a safe state.',
        'Reaches': 'Derived (read-only): whether this transition reaches a safe state, based on the target mode being marked a safe state in Item Definition. Independent of the Safety Goal link. Hover the label for the reason.'
    },
    headers: ['ID', 'From', 'To', 'Trigger', 'Guard', 'Time', 'Safety Goal', 'Reaches', ''],
    gridCols: '90px 120px 120px 1fr 1fr 80px 160px 110px 40px',
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
        item.safetyGoalRef  = selects[2] ? selects[2].value : (item.safetyGoalRef || '');
        // "reaches a safe state" is derived from the target mode — not set here.
    },
    commitFromRow: (doc, id) => {
        const item = doc.modeTransitions.find(x => x.id === id);
        if (item) doc.addToLexicon('triggers', item.trigger);
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
        <select data-tr="from"></select>
        <select data-tr="to"></select>
        <input type="text" list="lex-triggers" value="${(item.trigger||'').replace(/"/g,'&quot;')}" placeholder="e.g. ignition off">
        <input type="text" value="${(item.guard||'').replace(/"/g,'&quot;')}" placeholder="optional precondition">
        <input type="text" value="${(item.transitionTime||'').replace(/"/g,'&quot;')}" placeholder="100 ms">
        <select data-tr="sg" title="Safety Goal whose FTTI governs this transition (optional)."></select>
        <span data-tr="reaches" style="align-self:center;font-size:11px;"></span>
        <button class="del-btn req-delete" title="Delete this transition">✕</button>
    `,
    postRender: (row, item, doc) => {
        // A reference to a deleted entity is rendered as a visible, selected
        // "deleted" option rather than silently falling back to "— select —"
        // (which would also silently erase the ref on the next row edit).
        // The author can then re-link to a live entity or clear it — the
        // orphan is always fixable from this row, never only in the JSON.
        const fill = (sel, current) => {
            if (!sel) return;
            const opts = ['<option value="">— select —</option>']
                .concat(doc.modes.map(m =>
                    `<option value="${m.id}" ${m.id === current ? 'selected' : ''}>${(m.name||m.id).replace(/"/g,'&quot;')}</option>`));
            if (current && !doc.modes.some(m => m.id === current)) {
                opts.push(`<option value="${current}" selected class="dead-ref">⚠ deleted mode (${current})</option>`);
            }
            sel.innerHTML = opts.join('');
            sel.classList.toggle('has-dead-ref', !!current && !doc.modes.some(m => m.id === current));
            if (sel.classList.contains('has-dead-ref')) {
                sel.title = 'This transition references a mode that no longer exists. Pick a live mode, or "— select —" to clear; stub transitions can be deleted with ✕.';
            }
        };
        fill(row.querySelector('select[data-tr="from"]'), item.fromMode);
        fill(row.querySelector('select[data-tr="to"]'),   item.toMode);

        // Safety Goal link — the FTTI source for this transition's timing
        // check. Optional and orthogonal to safe-state status: an author can
        // give an operational transition a real FTTI without pretending its
        // target is a safe state (which used to be the only way).
        const sgSel = row.querySelector('select[data-tr="sg"]');
        if (sgSel) {
            const opts = ['<option value="">— none —</option>'].concat(
                (doc.safetyGoals || []).map(g => {
                    const label = `${(g.name || g.id)}${g.ftti ? ` · FTTI ${g.ftti}` : ' · no FTTI'}`;
                    return `<option value="${g.id}" ${g.id === item.safetyGoalRef ? 'selected' : ''}>${label.replace(/"/g,'&quot;')}</option>`;
                }));
            const sgDead = !!item.safetyGoalRef && !(doc.safetyGoals || []).some(g => g.id === item.safetyGoalRef);
            if (sgDead) {
                opts.push(`<option value="${item.safetyGoalRef}" selected class="dead-ref">⚠ deleted goal (${item.safetyGoalRef})</option>`);
            }
            sgSel.innerHTML = opts.join('');
            sgSel.classList.toggle('has-dead-ref', sgDead);
            if (sgDead) sgSel.title = 'This transition links a Safety Goal that no longer exists — its FTTI cannot govern anything. Pick a live goal or "— none —".';
        }

        // Derived, read-only "reaches a safe state?" label. The target
        // mode's safe-state status is already declared in Item Definition,
        // so we show it rather than ask the author to restate it.
        const lbl = row.querySelector('span[data-tr="reaches"]');
        if (lbl) {
            const toMode = (doc.modes || []).find(m => m.id === item.toMode);
            const realisesSS = toMode && ((doc.safeStates || []).some(s => (s.modeRefs || []).includes(toMode.id)));
            const safe = !!(toMode && (toMode.isSafeState || realisesSS));
            if (!toMode) {
                lbl.textContent = item.toMode ? '⚠ orphaned' : '—';
                lbl.style.color = item.toMode ? 'var(--amber)' : 'var(--text-dim)';
                lbl.title = item.toMode
                    ? `Target mode ${item.toMode} no longer exists — this transition is orphaned. Re-select a live target or delete the row.`
                    : 'Set a target mode first.';
            } else if (safe) {
                lbl.textContent = '⛟ safe state';
                lbl.style.color = 'var(--green)';
                lbl.title = `Reaches a safe state: target mode "${toMode.name || toMode.id}" is marked a safe state in Item Definition${realisesSS && !toMode.isSafeState ? ' (via a declared safe state)' : ''}. The Timing Analysis chapter derives its safe-state reaction requirement.`;
            } else {
                lbl.textContent = 'operational';
                lbl.style.color = 'var(--text-mid)';
                lbl.title = `Not a safe-state transition: target mode "${toMode.name || toMode.id}" is not marked a safe state in Item Definition.`;
            }
        }
    }
});
