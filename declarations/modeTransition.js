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
        'Time':    'Time budget for the transition to complete (e.g. "100 ms"). Compared against parent SG FTTI by the timing diagnostic.',
        'Reaches': 'Derived (read-only): whether this transition reaches a safe state, based on the target mode being marked a safe state in Item Definition. Hover the label for the reason.'
    },
    headers: ['ID', 'From', 'To', 'Trigger', 'Guard', 'Time', 'Reaches', ''],
    gridCols: '90px 130px 130px 1fr 1fr 90px 110px 40px',
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
        <span data-tr="reaches" style="align-self:center;font-size:11px;"></span>
        <button class="del-btn req-delete" title="Delete this transition">✕</button>
    `,
    postRender: (row, item, doc) => {
        const fill = (sel, current) => {
            if (!sel) return;
            const opts = ['<option value="">— select —</option>']
                .concat(doc.modes.map(m =>
                    `<option value="${m.id}" ${m.id === current ? 'selected' : ''}>${(m.name||m.id).replace(/"/g,'&quot;')}</option>`));
            sel.innerHTML = opts.join('');
        };
        fill(row.querySelector('select[data-tr="from"]'), item.fromMode);
        fill(row.querySelector('select[data-tr="to"]'),   item.toMode);

        // Derived, read-only "reaches a safe state?" label. The target
        // mode's safe-state status is already declared in Item Definition,
        // so we show it rather than ask the author to restate it.
        const lbl = row.querySelector('span[data-tr="reaches"]');
        if (lbl) {
            const toMode = (doc.modes || []).find(m => m.id === item.toMode);
            const realisesSS = toMode && ((doc.safeStates || []).some(s => (s.modeRefs || []).includes(toMode.id)));
            const safe = !!(toMode && (toMode.isSafeState || realisesSS));
            if (!toMode) {
                lbl.textContent = '—';
                lbl.style.color = 'var(--text-dim)';
                lbl.title = 'Set a target mode first.';
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
