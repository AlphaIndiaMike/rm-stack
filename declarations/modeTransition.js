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
        'Safety Goal': 'Optional. The Safety Goal whose FTTI governs this transition\'s time budget. Set it to time-check a transition against a real FTTI WITHOUT marking its target a safe state. Leave empty to fall back to the FTTI of the goal guarding the target safe state (if any). Linking a goal here does NOT make the target a safe state.',
        'Time':    'Time budget for the transition to complete (e.g. "100 ms"). Compared against the governing FTTI by the timing diagnostic.',
        'Trigger': 'The EVENT that fires the transition (EARS "When …"), e.g. "ignition off", "fault detected".',
        'Guard':   'Optional PRECONDITION that must already be true for the trigger to take effect (EARS "While …"), e.g. "vehicle speed < 5 km/h". Not the same as the trigger: the trigger is the event, the guard is the state it must occur in. Leave empty when the trigger applies unconditionally.',
        'Reaches': 'Derived (read-only): whether this transition reaches a safe state, based on the target mode being marked a safe state in Item Definition. Independent of the Safety Goal link. Hover the label for the reason.'
    },
    headers: ['ID', 'From', 'To', 'Safety Goal', 'Time', 'Trigger', 'Guard', 'Reaches', ''],
    gridCols: '90px 110px 110px 150px 75px 1fr 1fr 62px 36px',
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
        // Selects are read by their data-tr attribute (order-proof);
        // text inputs by DOM position — keep in sync with renderRow:
        //   inputs[0]=Time, [1]=Trigger, [2]=Guard  (v1.5.7 column order).
        const inputs  = row.querySelectorAll('input[type="text"]');
        const sel = k => row.querySelector(`select[data-tr="${k}"]`);
        item.fromMode       = sel('from') ? sel('from').value : item.fromMode;
        item.toMode         = sel('to')   ? sel('to').value   : item.toMode;
        item.safetyGoalRef  = sel('sg')   ? sel('sg').value   : (item.safetyGoalRef || '');
        item.transitionTime = inputs[0].value;
        item.trigger        = inputs[1].value;
        item.guard          = inputs[2].value;
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
        <select data-tr="sg" title="Safety Goal whose FTTI governs this transition (optional)."></select>
        <input type="text" value="${(item.transitionTime||'').replace(/"/g,'&quot;')}" placeholder="100 ms">
        <input type="text" list="lex-triggers" value="${(item.trigger||'').replace(/"/g,'&quot;')}" placeholder="e.g. ignition off">
        <input type="text" value="${(item.guard||'').replace(/"/g,'&quot;')}" placeholder="optional precondition (EARS: While …)">
        <span data-tr="reaches" class="tr-reaches"></span>
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
            const setState = (cls, text, title) => {
                lbl.className = `tr-reaches ${cls}`;
                lbl.textContent = text;
                lbl.title = title;
            };
            if (!toMode) {
                if (item.toMode) {
                    setState('orphaned', '⚠',
                        `Orphaned: target mode ${item.toMode} no longer exists. Re-select a live target or delete the row.`);
                } else {
                    setState('unset', '—', 'Set a target mode first.');
                }
            } else if (safe) {
                setState('safe', '⛟ safe',
                    `Reaches a safe state: target mode "${toMode.name || toMode.id}" reads SAFE — ${toMode.isSafeState ? 'its "Safe state?" flag is ticked in Item Definition' : ''}${toMode.isSafeState && realisesSS ? ' and ' : ''}${realisesSS ? 'a declared Safe State lists it under "Modes"' : ''}. See the Mode safety readout in the diagnostics below for the per-mode picture. The Timing Analysis chapter derives its safe-state reaction requirement.`);
            } else {
                setState('operational', 'operational',
                    `Not a safe-state transition: target mode "${toMode.name || toMode.id}" is neither flagged as a safe state in Item Definition nor listed under any Safe State's "Modes".`);
            }
        }
    }
});
