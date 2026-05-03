/**
 * declarations/element.js
 *
 * Declaration kind: 'element'
 *
 * Drives the System Elements / HW Components / SW Units row-tables.
 * The same Element class on the document is shared across disciplines;
 * `componentKind` (system | hw | sw) discriminates which view a row
 * appears in. The HW / SW chapters register variants of this config
 * (declarations/hwComponent.js, swUnit.js) that filter by kind.
 */

Declarations.register('element', {
    title: 'System Elements',
    singular: 'Element',
    helpHeaders: {
        'Name':    'Stable element identifier, no spaces (e.g. SteeringECU). The user-facing display name.',
        'Purpose': 'One-sentence statement of why the element exists in the architecture.',
        'Parent':  'Optional. Parent element in the system breakdown. Self and descendants are excluded from the dropdown to prevent cycles.',
        'Qty':     'Number of identical instances of this element (e.g. 4 wheel-speed sensors). Right-pane Elements count sums these.',
        'ASIL':    'Inherited or decomposed ASIL.'
    },
    headers: ['ID', 'Name', 'Purpose', 'Parent', 'Qty', 'ASIL', ''],
    gridCols: '90px 1fr 1fr 160px 60px 80px 40px',
    // Tree-ordered list with transient _depth on each item so renderRow
    // can indent the name. The componentKind filter keeps system rows
    // out of HW/SW chapters and vice versa.
    getList: doc => doc.elementsInTreeOrder().filter(e =>
        !e.componentKind || e.componentKind === 'system'),
    add: doc => {
        const el = new Element();
        el.id = doc.nextId('element');
        el.asil = 'QM';
        el.componentKind = 'system';
        doc.elements.push(el);
    },
    remove: (doc, id) => { doc.elements = doc.elements.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.elements.find(x => x.id === id);
        if (!item) return;
        const inputs  = row.querySelectorAll('input[type="text"]');
        const numIn   = row.querySelector('input[type="number"]');
        const selects = row.querySelectorAll('select');
        item.name    = inputs[0].value;
        item.purpose = inputs[1].value;
        item.parentId = selects[0].value;
        item.asil     = selects[1].value;
        const q = parseInt(numIn.value, 10);
        item.quantity = (isNaN(q) || q < 1) ? 1 : q;
    },
    renderRow: item => {
        const depth = item._depth || 0;
        const indent = depth > 0 ? '<span style="color:#adb5bd;">' + '·  '.repeat(depth) + '</span>' : '';
        return `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <div style="display:flex;align-items:center;gap:0.25rem;">
                ${indent}<input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Element name (no spaces)" style="flex:1;">
            </div>
            <input type="text" value="${(item.purpose||'').replace(/"/g,'&quot;')}" placeholder="One-sentence purpose">
            <select data-elem="parent" title="Parent element in the breakdown."></select>
            <input type="number" min="1" step="1" value="${item.quantity || 1}" title="Number of identical instances.">
            <select title="Inherited or decomposed ASIL.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
            <button class="del-btn req-delete" title="Delete this element">✕</button>
        `;
    },
    postRender: (row, item, doc) => {
        const sel = row.querySelector('select[data-elem="parent"]');
        if (!sel) return;
        const blocked = doc.descendantsOf(item.id);
        const opts = [`<option value="" ${!item.parentId ? 'selected' : ''}>(root)</option>`];
        doc.elements.forEach(e => {
            if (blocked.has(e.id)) return;
            if (e.componentKind && e.componentKind !== 'system') return;
            opts.push(`<option value="${e.id}" ${item.parentId === e.id ? 'selected' : ''}>${(e.name || e.id).replace(/"/g,'&quot;')}</option>`);
        });
        sel.innerHTML = opts.join('');
    }
});
