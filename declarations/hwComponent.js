/**
 * declarations/hwComponent.js
 *
 * Declaration kind: 'hwComponent'
 *
 * View of doc.elements filtered to componentKind='hw'. Adds HW-relevant
 * fields (partNumber, failureRate in FIT) on the same Element class.
 * Used by the Hardware discipline's "HW Architectural Design" chapter.
 */

Declarations.register('hwComponent', {
    title: 'HW Components',
    sectionHelp: 'Physical hardware items (ICs, sensors, actuators, connectors). Same Element store as system elements; filtered here by componentKind=hw. Failure rates feed FMEDA later.',
    singular: 'HW Component',
    helpHeaders: {
        'Name':         'Component identifier (e.g. SBC_NXP_FS66).',
        'Part #':       'Manufacturer part number for traceability and BOM matching.',
        'Purpose':      'One-sentence role in the architecture.',
        'λ (FIT)':      'Failure rate in FIT (failures per 10⁹ hours). Feeds FMEDA / PMHF computations.',
        'ASIL':         'ASIL allocated to this component.'
    },
    headers: ['ID', 'Name', 'Part #', 'Purpose', 'λ (FIT)', 'ASIL', ''],
    gridCols: '90px 1fr 130px 1fr 80px 80px 40px',
    getList: doc => doc.elements.filter(e => e.componentKind === 'hw'),
    add: doc => {
        const el = new Element();
        el.id = doc.nextId('element');
        el.componentKind = 'hw';
        el.asil = 'QM';
        doc.elements.push(el);
    },
    remove: (doc, id) => { doc.elements = doc.elements.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.elements.find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input[type="text"]');
        const numIn  = row.querySelector('input[type="number"]');
        const sel    = row.querySelector('select');
        item.name        = inputs[0].value;
        item.partNumber  = inputs[1].value;
        item.purpose     = inputs[2].value;
        const fit = parseFloat(numIn.value);
        item.failureRate = isNaN(fit) ? 0 : fit;
        item.asil = sel.value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Component name">
        <input type="text" value="${(item.partNumber||'').replace(/"/g,'&quot;')}" placeholder="Part number">
        <input type="text" value="${(item.purpose||'').replace(/"/g,'&quot;')}" placeholder="Role in the architecture">
        <input type="number" min="0" step="0.1" value="${item.failureRate || 0}" title="FIT (failures / 10⁹ h)">
        <select title="ASIL allocated to this component.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
        <button class="del-btn req-delete" title="Delete this component">✕</button>
    `
});
