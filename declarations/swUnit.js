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
        'Name':       'Unit identifier (e.g. CtrlLoop_Lat, SignalRouter, FaultMgr).',
        'Purpose':    'One-sentence role.',
        'Language':   'Implementation language (C, C++, Rust, Simulink, ...).',
        'Implements': 'Multi-select. The system element(s) this SW unit implements. A System TSR allocated to SW can then be taken over into a derived SW requirement on this unit (see SW Requirements Inputs → Generate).',
        'ASIL':       'ASIL allocated to this unit.'
    },
    headers: ['ID', 'Name', 'Purpose', 'Language', 'Implements', 'ASIL', ''],
    gridCols: '90px 1fr 1fr 110px 170px 80px 40px',
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
        <span class="ms-mount" data-ms="impl"></span>
        <select title="ASIL allocated to this unit.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
        <button class="del-btn req-delete" title="Delete this unit">✕</button>
    `,
    postRender: (row, item, doc, refresh) => {
        const mount = row.querySelector('.ms-mount[data-ms="impl"]');
        if (!mount) return;
        const opts = doc.elementsForDiscipline('system').map(e => ({
            value: e.id, label: e.name || `(unnamed ${e.id})`
        }));
        const ms = new MultiSelectDropdown(
            opts, item.implementsElementIds || [],
            newRefs => { item.implementsElementIds = newRefs; },
            { unitLabel: 'system element',
              emptyLabel: 'No system elements declared yet.',
              onClose: refresh });
        mount.replaceWith(ms.element);
    }
});
