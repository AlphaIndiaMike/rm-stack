/**
 * declarations/internalInterface.js
 *
 * Declaration kind: 'internalInterface'
 *
 * A *view* of doc.interfaces filtered to scope === 'internal'. The same
 * InterfaceSpec store serves the System Breakdown "External Interfaces"
 * table (scope 'external', free-text boundary partners) and this one;
 * the scope discriminator keeps the two catalogs separate (the same
 * one-store / many-views pattern as elements ↔ hw components ↔ sw units).
 *
 * An internal interface is an element-to-element / HW-to-HW link inside
 * the system box — e.g. two controllers talking over CAN: "CAN_INT1 from
 * MCU1 to MCU2". Both endpoints are declared SYSTEM elements (bound by
 * ID, not free text), so the timing-chain builder can walk them. Each
 * carries a per-hop time budget that the chain sum vs FTTI check reads.
 *
 * Inline columns stay minimal (Name, From, To, Protocol); the SMART
 * detail (period, jitter, budget, failure behaviour, notes) lives behind
 * the ▸ expander, reusing the .if-detail-row / .if-expand-btn styling.
 */

Declarations.register('internalInterface', {
    title: 'Internal Interfaces',
    sectionHelp: 'Element-to-element / HW-to-HW links inside the system (e.g. CAN_INT1 from MCU1 to MCU2). Endpoints are declared system elements. Click ▸ to set period, jitter, time budget and failure behaviour. These are the internal hops a timing chain walks.',
    singular: 'Internal Interface',
    helpHeaders: {
        'Name':     'Internal interface label (e.g. CAN_INT1, SPI_A, InterCore_Mbox).',
        'From':     'Producing system element (or endpoint A when bidirectional).',
        'To':       'Consuming system element (or endpoint B when bidirectional).',
        '→':        'Direction. Click the arrow in a row to toggle: → producer-to-consumer, ↔ bidirectional (e.g. CAN).',
        'Protocol': 'Protocol or medium (CAN, SPI, shared memory, discrete line, ...).',
        '▸':        'Expand to edit period, jitter, time budget, failure behaviour, notes.'
    },
    headers: ['ID', 'Name', 'From', '→', 'To', 'Protocol', '▸', ''],
    gridCols: '90px 1fr 1fr 30px 1fr 130px 30px 40px',
    getList: doc => doc.interfaces.filter(i => i.scope === 'internal'),
    add: doc => {
        const iface = new InterfaceSpec();
        iface.id = doc.nextId('interfaceSpec');
        iface.scope = 'internal';
        iface.kind = 'data';
        doc.interfaces.push(iface);
    },
    remove: (doc, id) => { doc.interfaces = doc.interfaces.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.interfaces.find(x => x.id === id);
        if (!item) return;
        const inputs  = row.querySelectorAll('input[type="text"]');
        const selects = row.querySelectorAll('select');
        item.name             = inputs[0].value;
        item.protocol         = inputs[1].value;
        item.producerElementId = selects[0].value;
        item.consumerElementId = selects[1].value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="e.g. CAN_INT1">
        <select data-iif="producer" title="Producing system element."></select>
        <button type="button" data-iif="dir" class="iif-dir"
            title="Click to toggle direction: → producer-to-consumer, ↔ bidirectional (e.g. CAN)."
            style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:14px;align-self:center;">${item.direction === 'bidirectional' ? '↔' : '→'}</button>
        <select data-iif="consumer" title="Consuming system element."></select>
        <input type="text" value="${(item.protocol||'').replace(/"/g,'&quot;')}" placeholder="CAN, SPI, ...">
        <button type="button" class="if-expand if-expand-btn" data-if-id="${item.id}" title="Edit period, jitter, budget, failure behaviour">▸</button>
        <button class="del-btn req-delete" title="Delete this internal interface">✕</button>
    `,
    postRender: (row, item, doc) => {
        // Populate the two element dropdowns from declared system elements.
        const elems = doc.elementsForDiscipline('system');
        const fill = (sel, current) => {
            if (!sel) return;
            const opts = ['<option value="">— element —</option>'].concat(
                elems.map(e => `<option value="${e.id}" ${e.id === current ? 'selected' : ''}>${(e.name || e.id).replace(/"/g,'&quot;')}</option>`));
            sel.innerHTML = opts.join('');
        };
        fill(row.querySelector('select[data-iif="producer"]'), item.producerElementId);
        fill(row.querySelector('select[data-iif="consumer"]'), item.consumerElementId);

        // Direction toggle — reuses the existing InterfaceSpec.direction
        // field ('producer-to-consumer' | 'bidirectional'). Buses like
        // CAN are inherently bidirectional; before v1.6.5 the arrow was
        // a static → and the model value was unreachable from the UI.
        const dirBtn = row.querySelector('button[data-iif="dir"]');
        if (dirBtn) {
            dirBtn.addEventListener('click', () => {
                item.direction = item.direction === 'bidirectional'
                    ? 'producer-to-consumer' : 'bidirectional';
                dirBtn.textContent = item.direction === 'bidirectional' ? '↔' : '→';
            });
        }

        // ▸ expander — SMART detail panel (own input listeners write to
        // the item directly, exactly like declarations/interface.js).
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
            const f = (k, ph) => `<label style="font-size:11px;">${k}<input type="text" data-iif-detail="${k}" value="${(item[k]||'').replace(/"/g,'&quot;')}" placeholder="${ph}" style="display:block;width:100%;font-size:12px;padding:3px 6px;"></label>`;
            detail.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                    ${f('period', '10 ms')}
                    ${f('jitter', '±1 ms')}
                    ${f('budget', 'time budget for this hop, e.g. 5 ms')}
                    ${f('failureBehavior', 'hold last / safe value / ...')}
                    <label style="font-size:11px;grid-column:2 / -1;">notes
                        <input type="text" data-iif-detail="notes" value="${(item.notes||'').replace(/"/g,'&quot;')}" placeholder="Anything else worth recording" style="display:block;width:100%;font-size:12px;padding:3px 6px;">
                    </label>
                </div>`;
            detail.querySelectorAll('input[data-iif-detail]').forEach(inp => {
                inp.addEventListener('input', () => {
                    item[inp.getAttribute('data-iif-detail')] = inp.value;
                });
            });
            row.parentNode.insertBefore(detail, row.nextSibling);
            btn.textContent = '▾';
        });
    }
});
