/**
 * declarations/itemFunction.js
 *
 * Declaration kind: 'itemFunction' — what the item does for the
 * end-user. Item-level data; declared in Item Definition.
 *
 * The active-modes multi-select is the secondary view of the
 * mode↔function many-to-many; the canonical store lives on
 * itemFunction.activeModes (read by the inverse picker on Mode rows).
 */

Declarations.register('itemFunction', {
    title: 'Item Functions',
    singular: 'Item Function',
    helpHeaders: {
        'Name':            'Short, stable label. Stays the same across the project.',
        'Description':     'What this function does for the end-user. One sentence, observable behaviour, no implementation detail.',
        'Active in modes': 'Multi-select. Operating modes in which this function is active.'
    },
    headers: ['ID', 'Name', 'Description', 'Active in modes', ''],
    gridCols: '90px 1fr 1fr 200px 40px',
    getList: doc => doc.itemFunctions,
    add: doc => {
        const f = new ItemFunction();
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
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.name || '').replace(/"/g,'&quot;')}" placeholder="e.g. Adaptive Cruise Control">
        <input type="text" value="${(item.description || '').replace(/"/g,'&quot;')}" placeholder="What does this function do for the end-user?">
        <span class="ms-mount" data-ms="active-modes"></span>
        <button class="del-btn req-delete" title="Delete this item function">✕</button>
    `,
    postRender: (row, item, doc, refresh) => {
        const mount = row.querySelector('.ms-mount[data-ms="active-modes"]');
        if (!mount) return;
        const modeOpts = doc.modes.map(m => ({
            value: m.id, label: m.name || `(unnamed ${m.id})`
        }));
        const ms = new MultiSelectDropdown(
            modeOpts, item.activeModes || [],
            newRefs => { item.activeModes = newRefs; },
            { unitLabel: 'mode',
              emptyLabel: 'No operating modes declared yet — add them in the Operating Modes table.',
              onClose: refresh });
        mount.replaceWith(ms.element);
    }
});
