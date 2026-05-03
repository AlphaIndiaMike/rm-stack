/**
 * declarations/swUnit.js
 *
 * Declaration kind: 'swUnit'
 *
 * View of doc.elements filtered to componentKind='sw'. Used by the
 * Software discipline's "SW Architectural Design" chapter. SW units
 * are the building blocks for SWE.2 (architecture) and SWE.3 (detailed
 * design + unit construction).
 */

Declarations.register('swUnit', {
    title: 'SW Units',
    sectionHelp: 'Software components / units (per ISO 26262-6 + ASPICE SWE.2). Same Element store as system elements, filtered here by componentKind=sw.',
    singular: 'SW Unit',
    helpHeaders: {
        'Name':     'Unit identifier (e.g. CtrlLoop_Lat, SignalRouter, FaultMgr).',
        'Purpose':  'One-sentence role.',
        'Language': 'Implementation language (C, C++, Rust, Simulink, ...).',
        'ASIL':     'ASIL allocated to this unit.'
    },
    headers: ['ID', 'Name', 'Purpose', 'Language', 'ASIL', ''],
    gridCols: '90px 1fr 1fr 110px 80px 40px',
    getList: doc => doc.elements.filter(e => e.componentKind === 'sw'),
    add: doc => {
        const el = new Element();
        el.id = doc.nextId('element');
        el.componentKind = 'sw';
        el.asil = 'QM';
        doc.elements.push(el);
    },
    remove: (doc, id) => { doc.elements = doc.elements.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.elements.find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input[type="text"]');
        const sel    = row.querySelector('select');
        item.name             = inputs[0].value;
        item.purpose          = inputs[1].value;
        item.programmingLang  = inputs[2].value;
        item.asil             = sel.value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Unit name">
        <input type="text" value="${(item.purpose||'').replace(/"/g,'&quot;')}" placeholder="One-sentence role">
        <input type="text" value="${(item.programmingLang||'').replace(/"/g,'&quot;')}" placeholder="C / C++ / Rust / ...">
        <select title="ASIL allocated to this unit.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
        <button class="del-btn req-delete" title="Delete this unit">✕</button>
    `
});
