/**
 * declarations/safeState.js
 *
 * Declaration kind: 'safeState' — named safe conditions (per ISO 26262
 * Part 1 / IEC 61508-4). Each binds upward to one or more Safety Goals
 * it satisfies, and downward to one or more Operating Modes that
 * realize it. The validator's timing crosscheck reads these bindings to
 * verify transitions into safe-state-realizing modes meet FTTI.
 */

Declarations.register('safeState', {
    title: 'Safe States',
    sectionHelp: 'Each safe state binds upward to Safety Goal(s) it satisfies, and downward to Operating Mode(s) that realize it.',
    singular: 'Safe State',
    helpHeaders: {
        'Description':  'Prose description — what is true while the system is in this safe state.',
        'Triggers':     'Conditions that demand the system enter this safe state.',
        'Modes':        'Multi-select. Pick ONLY the Operating Mode(s) that realize this safe state — i.e. being in that mode IS being in this safe state. Every mode picked here will read as SAFE everywhere (transition "Reaches" column, timing checks). Do NOT pick the operational modes this safe state protects or is reachable from.',
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
    remove: (doc, id) => {
        doc.safeStates = doc.safeStates.filter(x => x.id !== id);
        // Clear legacy SafetyGoal.safeStates references pointing at it.
        doc.cascadeSafeStateRemoval(id);
    },
    updateFromRow: (doc, id, row) => {
        const item = doc.safeStates.find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input[type="text"]');
        item.description = inputs[0].value;
        item.triggers    = inputs[1].value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="Description (what is true here)">
        <input type="text" value="${(item.triggers||'').replace(/"/g,'&quot;')}" placeholder="Trigger conditions">
        <span class="ms-mount" data-ms="modes"></span>
        <span class="ms-mount" data-ms="sgs"></span>
        <button class="del-btn req-delete" title="Delete this safe state">✕</button>
    `,
    postRender: (row, item, doc, refresh) => {
        const modesMount = row.querySelector('.ms-mount[data-ms="modes"]');
        if (modesMount) {
            const modeOpts = doc.modes.map(m => ({
                value: m.id, label: m.name || `(unnamed ${m.id})`
            }));
            const ms = new MultiSelectDropdown(
                modeOpts, item.modeRefs,
                newRefs => { item.modeRefs = newRefs; },
                { unitLabel: 'mode',
                  emptyLabel: 'No operating modes declared yet.',
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
                newRefs => { item.sgRefs = newRefs; },
                { unitLabel: 'safety goal',
                  emptyLabel: 'No Safety Goals declared yet.',
                  onClose: refresh });
            sgMount.replaceWith(ms.element);
        }
    }
});
