/**
 * declarations/assumption.js
 *
 * Declaration kind: 'assumption' — Assumptions of Use (AoU) plus open
 * points. Same store powers both Item Definition's AoU table and the
 * dedicated Assumptions chapter at the back of the document.
 */

Declarations.register('assumption', {
    title: 'Assumptions of Use',
    singular: 'Assumption',
    helpHeaders: {
        'Owner':  'Person responsible for closing this assumption.',
        'Status': 'Open until verified, evidenced, or designed-out; closed when retired.'
    },
    headers: ['ID', 'Text', 'Owner', 'Status', ''],
    gridCols: '90px 1fr 1fr 80px 40px',
    getList: doc => doc.assumptions,
    add: doc => {
        const a = new Assumption();
        a.id = doc.nextId('assumption');
        doc.assumptions.push(a);
    },
    remove: (doc, id) => { doc.assumptions = doc.assumptions.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.assumptions.find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input, select');
        item.text = inputs[0].value;
        item.owner = inputs[1].value;
        item.status = inputs[2].value;
    },
    commitFromRow: (doc, id) => {
        const item = doc.assumptions.find(x => x.id === id);
        if (item) doc.addToLexicon('owners', item.owner);
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.text||'').replace(/"/g,'&quot;')}" placeholder="State the assumption (one sentence)">
        <input type="text" list="owners-datalist" value="${(item.owner||'').replace(/"/g,'&quot;')}" placeholder="Owner">
        <select><option ${item.status==='open'?'selected':''}>open</option><option ${item.status==='closed'?'selected':''}>closed</option></select>
        <button class="del-btn req-delete" title="Delete this assumption">✕</button>
    `
});
