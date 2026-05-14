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
    sectionHelp: 'One row per signal crossing the hardware-software boundary. Bind each signal to a physical pin / connector / bus address and record its electrical, data, timing, and failure properties. Use "Generate interface requirements" below to turn fully-specified rows into requirements.',
    singular: 'Signal',
    helpHeaders: {
        'Name':       'Signal or message identifier (e.g. VehicleSpeed, VBAT, CAN_TX0).',
        'Interface':  'Parent interface this signal belongs to (declared in Chapter 5). Optional but recommended — keeps the catalog consistent.',
        'Pin/Addr':   'Physical location: pin number, connector position, or bus address (e.g. Pin 7, Conn-A.3, CAN id 0x1A0).',
        'Dir':        'Direction from the item\'s perspective: input (into the item), output (out of the item), or bidirectional.',
        'Type':       'Signal class: analog, digital, pwm, bus-message, discrete, or power.',
        'Electrical': 'Voltage / current / level description (e.g. 0–5 V, 12 V nominal, 3.3 V CMOS).',
        'Encoding':   'Data encoding / resolution (e.g. uint16 0.01 km/h/bit, active-low).',
        'Period':     'Update period (e.g. 10 ms, on-change, continuous).',
        'Failure':    'Behaviour on loss or corruption (e.g. hold last value, default safe value, high-Z).',
        'Diag':       'How the signal is monitored (e.g. range check, rolling counter + CRC, none).'
    },
    headers: ['ID', 'Name', 'Interface', 'Pin/Addr', 'Dir', 'Type', 'Electrical', 'Encoding', 'Period', 'Failure', 'Diag', ''],
    gridCols: '80px 110px 130px 110px 90px 110px 1fr 1fr 90px 1fr 1fr 40px',
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
        const sels   = row.querySelectorAll('select');
        item.name            = inputs[0].value;
        item.pin             = inputs[1].value;
        item.electrical      = inputs[2].value;
        item.encoding        = inputs[3].value;
        item.period          = inputs[4].value;
        item.failureBehavior = inputs[5].value;
        item.diagnostic      = inputs[6].value;
        item.interfaceId     = sels[0].value;
        item.direction       = sels[1].value;
        item.signalType      = sels[2].value;
    },
    renderRow: item => {
        const dir = d => `<option value="${d}" ${item.direction === d ? 'selected' : ''}>${d}</option>`;
        const typ = t => `<option value="${t}" ${item.signalType === t ? 'selected' : ''}>${t}</option>`;
        return `
            <div class="req-id" style="align-self:center;">${item.id}</div>
            <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Signal name">
            <select data-hsi="interface"></select>
            <input type="text" value="${(item.pin||'').replace(/"/g,'&quot;')}" placeholder="Pin / addr">
            <select data-hsi="direction">${dir('input')}${dir('output')}${dir('bidirectional')}</select>
            <select data-hsi="type">${typ('analog')}${typ('digital')}${typ('pwm')}${typ('bus-message')}${typ('discrete')}${typ('power')}</select>
            <input type="text" value="${(item.electrical||'').replace(/"/g,'&quot;')}" placeholder="0–5 V, 12 V, ...">
            <input type="text" value="${(item.encoding||'').replace(/"/g,'&quot;')}" placeholder="uint16, active-low, ...">
            <input type="text" value="${(item.period||'').replace(/"/g,'&quot;')}" placeholder="10 ms">
            <input type="text" value="${(item.failureBehavior||'').replace(/"/g,'&quot;')}" placeholder="hold last, ...">
            <input type="text" value="${(item.diagnostic||'').replace(/"/g,'&quot;')}" placeholder="range check, ...">
            <button class="del-btn req-delete" title="Delete this signal">✕</button>
        `;
    },
    postRender: (row, item, doc) => {
        const sel = row.querySelector('select[data-hsi="interface"]');
        if (!sel) return;
        const opts = ['<option value="">— interface —</option>']
            .concat((doc.interfaces || []).map(iface =>
                `<option value="${iface.id}" ${item.interfaceId === iface.id ? 'selected' : ''}>${(iface.name || iface.id).replace(/"/g,'&quot;')}</option>`));
        sel.innerHTML = opts.join('');
    }
});
