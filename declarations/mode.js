/**
 * declarations/mode.js
 *
 * Declaration kind: 'mode' — operating modes (Off, Nominal, Degraded,
 * Safe, Shutdown, ...). Item-level data; declared in the Item Definition
 * chapter. Mode transitions (declarations/modeTransition.js) close the
 * graph in the System Breakdown chapter.
 *
 * Active-functions multi-select is the canonical edit point for the
 * mode↔itemFunction many-to-many; the inverse view on Item Functions
 * goes through the same setter (doc.setActiveFunctionsForMode).
 */

Declarations.register('mode', {
    title: 'Operating Modes',
    singular: 'Mode',
    helpHeaders: {
        'Name':             'Short ID-style name for the mode (e.g. "Nominal", "Degraded", "Safe").',
        'Description':      'What is true while the system is in this mode? Behaviour, constraints, observable state.',
        'Active functions': 'Multi-select. Item functions that are active when the system is in this mode.',
        'Safe state?':      'Tick if this mode is a designated safe state. The formal SafeState entity binds upward to Safety Goals.'
    },
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
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. Nominal, Degraded, Safe">
        <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="What is true while in this mode?">
        <span class="ms-mount" data-ms="active-functions"></span>
        <input type="checkbox" ${item.isSafeState ? 'checked' : ''} style="justify-self:center;" title="Designated safe state.">
        <button class="del-btn req-delete" title="Delete this mode">✕</button>
    `,
    postRender: (row, item, doc, refresh) => {
        const mount = row.querySelector('.ms-mount[data-ms="active-functions"]');
        if (!mount) return;
        const fnOpts = doc.itemFunctions.map(f => ({
            value: f.id, label: f.name || `(unnamed ${f.id})`
        }));
        const ms = new MultiSelectDropdown(
            fnOpts, doc.activeFunctionsForMode(item.id),
            newRefs => doc.setActiveFunctionsForMode(item.id, newRefs),
            { unitLabel: 'function',
              emptyLabel: 'No item functions declared yet — add them in the Item Functions table above.',
              onClose: refresh });
        mount.replaceWith(ms.element);
    }
});
