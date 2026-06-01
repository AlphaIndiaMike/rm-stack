/**
 * declarations/interface.js
 *
 * Declaration kind: 'interface'
 *
 * Per-row editor for doc.interfaces. Same store serves system, HW, and
 * SW chapters; the kind discriminator (data | physical) lets HW chapters
 * filter to physical and SW chapters filter to data, while the System
 * breakdown shows everything.
 *
 * Field naming: the storage uses producer / consumer (legacy), the UI
 * labels them Node A / Node B because peer-to-peer buses (CAN, FlexRay)
 * have no inherent direction. The direction selector adds A→B / A←B /
 * A↔B semantics on top.
 *
 * SMART details (data type, range, period, jitter, failure behaviour,
 * notes) live in a sub-row that the user expands per interface; they
 * are read by the HSI Signal Coverage diagnostic in Chapter 9.
 */

Declarations.register('interface', {
    title: 'External Interfaces',
    sectionHelp: 'Boundary I/O. Each row captures the SMART signal definition: direction, kind (data/physical), protocol, data type, range, units, period, jitter, failure behaviour. Click ▸ on a row to expand the detail panel.',
    singular: 'Interface',
    helpHeaders: {
        'Name':      'Interface label (e.g. CAN_PT, LIN_BCM, HV_BUS).',
        'Kind':      'data = software signal/message; physical = HW pin/bus/connector/supply.',
        'Node A':    'One communication partner. Direction column says whether this side produces, consumes, or peers. Autocompletes from declared elements and previously-typed names.',
        'Direction': 'A→B (Node A produces), A←B (Node A consumes), or A↔B (bidirectional / peer-to-peer).',
        'Node B':    'The other communication partner.',
        'Protocol':  'Protocol or physical medium (CAN, LIN, FlexRay, Ethernet, 12V supply, K-line, etc.).',
        '▸':         'Expand to edit SMART details: data type, range, units, period, jitter, failure behaviour, notes.'
    },
    headers: ['ID', 'Name', 'Kind', 'Node A', 'Direction', 'Node B', 'Protocol', '▸', ''],
    gridCols: '90px 1fr 90px 1fr 130px 1fr 110px 30px 40px',
    getList: doc => doc.interfaces.filter(i => (i.scope || 'external') === 'external'),
    add: doc => {
        const iface = new InterfaceSpec();
        iface.id = doc.nextId('interfaceSpec');
        iface.scope = 'external';
        doc.interfaces.push(iface);
    },
    remove: (doc, id) => { doc.interfaces = doc.interfaces.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.interfaces.find(x => x.id === id);
        if (!item) return;
        const inputs  = row.querySelectorAll('input[type="text"]');
        const selects = row.querySelectorAll('select');
        item.name      = inputs[0].value;
        item.producer  = inputs[1].value;  // Node A
        item.consumer  = inputs[2].value;  // Node B
        item.protocol  = inputs[3].value;
        item.kind      = selects[0].value;
        item.direction = selects[1].value;
    },
    commitFromRow: (doc, id) => {
        const item = doc.interfaces.find(x => x.id === id);
        if (!item) return;
        doc.addToLexicon('producers', item.producer);
        doc.addToLexicon('consumers', item.consumer);
    },
    renderRow: item => {
        const dirArrow = {
            'producer-to-consumer': 'A→B',
            'consumer-to-producer': 'A←B',
            'bidirectional':        'A↔B',
            'unidirectional':       'A→B'  // legacy
        }[item.direction] || 'A→B';
        return `
            <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. CAN_PT">
            <select data-if="kind">
                <option value="data" ${item.kind==='data'?'selected':''}>data</option>
                <option value="physical" ${item.kind==='physical'?'selected':''}>physical</option>
            </select>
            <input type="text" list="lex-producers" value="${(item.producer||'').replace(/"/g,'&quot;')}" placeholder="Node A">
            <select data-if="direction" title="${dirArrow}">
                <option value="producer-to-consumer" ${item.direction==='producer-to-consumer'||item.direction==='unidirectional'?'selected':''}>A→B (A produces)</option>
                <option value="consumer-to-producer" ${item.direction==='consumer-to-producer'?'selected':''}>A←B (A consumes)</option>
                <option value="bidirectional"        ${item.direction==='bidirectional'?'selected':''}>A↔B (bidirectional)</option>
            </select>
            <input type="text" list="lex-consumers" value="${(item.consumer||'').replace(/"/g,'&quot;')}" placeholder="Node B">
            <input type="text" value="${(item.protocol||'').replace(/"/g,'&quot;')}" placeholder="CAN, LIN, ...">
            <button type="button" class="if-expand" data-if-id="${item.id}" title="Edit SMART details (data type, range, period, jitter, failure behaviour)" class="if-expand-btn">▸</button>
            <button class="del-btn req-delete" title="Delete this interface">✕</button>
        `;
    },
    postRender: (row, item) => {
        const btn = row.querySelector('.if-expand');
        if (!btn) return;
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const next = row.nextElementSibling;
            if (next && next.classList && next.classList.contains('if-detail-row')) {
                next.remove();
                btn.textContent = '▸';
                return;
            }
            const detail = document.createElement('div');
            detail.className = 'if-detail-row';
            // Styled by .if-detail-row in styles.css
            const f = (k, ph) => `<label style="font-size:11px;">${k}<input type="text" data-if-detail="${k}" value="${(item[k]||'').replace(/"/g,'&quot;')}" placeholder="${ph}" style="display:block;width:100%;font-size:12px;padding:3px 6px;"></label>`;
            detail.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                    ${f('dataType', 'uint16, float32, signed bit, ...')}
                    ${f('range',    '0..255, -10..+10, ...')}
                    ${f('unit',     'km/h, V, °C, ...')}
                    ${f('period',   '10 ms')}
                    ${f('jitter',   '±1 ms')}
                    ${f('failureBehavior', 'hold last / safe value / ...')}
                    <label style="font-size:11px;grid-column:1 / -1;">notes
                        <input type="text" data-if-detail="notes" value="${(item.notes||'').replace(/"/g,'&quot;')}" placeholder="Anything else worth recording" style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                    </label>
                </div>`;
            detail.querySelectorAll('input[data-if-detail]').forEach(inp => {
                inp.addEventListener('input', () => {
                    item[inp.getAttribute('data-if-detail')] = inp.value;
                });
            });
            row.parentNode.insertBefore(detail, row.nextSibling);
            btn.textContent = '▾';
        });
    }
});
