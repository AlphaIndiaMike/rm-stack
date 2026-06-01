/**
 * declarations/hsiSignal.js
 *
 * Declaration kind: 'hsiSignal'
 *
 * The Hardware-Software Interface is a catalog of signals. Each row
 * binds one signal to a physical location (pin / connector / bus
 * address) and records its electrical, timing, data, and failure
 * properties. This is structural / non-functional information — "pin 7
 * carries VBAT", "CAN id 0x1A0 transmits VehicleSpeed every 10 ms" —
 * which is why it lives in a structured table rather than being forced
 * into a behavioural EARS sentence.
 *
 * Stored on doc.hsiSignals. Each row optionally references a parent
 * InterfaceSpec (declared in System Ch.5) via interfaceId, so the HSI
 * catalog stays consistent with the interface list.
 *
 * Fully-specified rows can be turned into requirements in one click —
 * see the HsiRequirementGenerator widget in disciplines/system/ch09_hsi.js,
 * which builds 'interface'-predicate requirements from them.
 *
 * Replaces the old 'timingChain' stub, which never persisted anything.
 * Per-signal timing now lives on the `period` field here; transition-
 * into-safe-state timing is covered by the mode simulator in Ch.5.
 */

Declarations.register('hsiSignal', {
    title: 'HSI Signal Catalog',
    sectionHelp: 'One row per signal at an element\'s hardware-software boundary. Bind each signal to a physical pin / connector / bus address and record electrical, data, timing, and failure properties. Allocate it to its owning element (MCU) and SW unit in the HSI Allocation section. Use "Generate interface requirements" below to turn fully-specified rows into requirements.',
    singular: 'Signal',
    helpHeaders: {
        'Name':       'Signal or message identifier (e.g. VehicleSpeed, VBAT, CAN_TX0).',
        'Interface':  'Parent interface this signal belongs to (declared in Chapter 5). Optional but recommended — keeps the catalog consistent.',
        'Pin/Addr':   'Physical location: pin number, connector position, or bus address (e.g. Pin 7, Conn-A.3, CAN id 0x1A0).',
        'Dir':        'HW<->SW direction within the element: hw->sw (HW provides, SW reads) or sw->hw (SW drives, HW outputs).',
        'Type':       'Signal class: analog, digital, pwm, bus-message, discrete, or power.',
        'Electrical': 'Voltage / current / level description (e.g. 0–5 V, 12 V nominal, 3.3 V CMOS).',
        'Encoding':   'Data encoding / resolution (e.g. uint16 0.01 km/h/bit, active-low).',
        'Period':     'Update period (e.g. 10 ms, on-change, continuous).',
        'Failure':    'Behaviour on loss or corruption (e.g. hold last value, default safe value, high-Z).',
        'Diag':       'How the signal is monitored (e.g. range check, rolling counter + CRC, none).'
    },
    headers: ['ID', 'Name', 'Pin/Addr', '▸', ''],
    gridCols: '80px 1fr 1fr 30px 40px',
    getList: doc => doc.hsiSignals || [],
    add: doc => {
        const s = new HsiSignal();
        s.id = doc.nextId('hsiSignal');
        (doc.hsiSignals ||= []).push(s);
    },
    remove: (doc, id) => { doc.hsiSignals = (doc.hsiSignals || []).filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = (doc.hsiSignals || []).find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input[type="text"]');
        item.name = inputs[0].value;
        item.pin  = inputs[1].value;
    },
    renderRow: item => `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Signal name">
            <input type="text" value="${(item.pin||'').replace(/"/g,'&quot;')}" placeholder="Pin / addr">
            <button type="button" class="if-expand if-expand-btn" data-if-id="${item.id}" title="Edit type, electrical, encoding, period, failure, diagnostic">▸</button>
            <button class="del-btn req-delete" title="Delete this signal">✕</button>
    `,
    postRender: (row, item, doc) => {
        // ▸ expander — the bulk of the signal definition (type, electrical,
        // encoding, period, failure behaviour, diagnostic) lives here so
        // the catalog row stays readable. Detail controls write to the
        // item directly; the catalog row only carries name/pin/dir/iface.
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
            const types = ['analog','digital','pwm','bus-message','discrete','power'];
            const typeOpts = types.map(t => `<option value="${t}" ${item.signalType === t ? 'selected' : ''}>${t}</option>`).join('');
            const f = (k, label, ph) => `<label style="font-size:11px;">${label}<input type="text" data-hsi-detail="${k}" value="${(item[k]||'').replace(/"/g,'&quot;')}" placeholder="${ph}" style="display:block;width:100%;font-size:12px;padding:3px 6px;"></label>`;
            detail.innerHTML = `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;">
                    <label style="font-size:11px;">Type<select data-hsi-detail-sel="signalType" style="display:block;width:100%;font-size:12px;padding:3px 6px;">${typeOpts}</select></label>
                    ${f('electrical', 'Electrical', '0–5 V, 12 V, ...')}
                    ${f('encoding', 'Encoding', 'uint16, active-low, ...')}
                    ${f('period', 'Period', '10 ms, on-change')}
                    ${f('failureBehavior', 'Failure', 'hold last, default safe, ...')}
                    ${f('diagnostic', 'Diagnostic', 'range check, CRC, none')}
                </div>`;
            detail.querySelectorAll('input[data-hsi-detail]').forEach(inp => {
                inp.addEventListener('input', () => {
                    item[inp.getAttribute('data-hsi-detail')] = inp.value;
                });
            });
            const tsel = detail.querySelector('select[data-hsi-detail-sel="signalType"]');
            if (tsel) tsel.addEventListener('change', () => { item.signalType = tsel.value; });
            row.parentNode.insertBefore(detail, row.nextSibling);
            btn.textContent = '▾';
        });
    }
});
