/**
 * declarations/failureMode.js
 *
 * Declaration kind: 'failureMode' — FMEA / FMEDA rows for HW components.
 * One row = one failure mode of a component. Failure rate (λ in FIT)
 * and diagnostic coverage (DC, 0..1) feed PMHF / SPFM / LFM computation
 * (ISO 26262-5:8 + Annex F).
 *
 * NEW for the four-discipline scaffolding. The data class FailureMode
 * is in model_base.js. Until HW analyses ship a proper widget, this
 * table is the place to capture the data.
 */

Declarations.register('failureMode', {
    title: 'Failure Modes (FMEA / FMEDA)',
    sectionHelp: 'Per ISO 26262-5:8. Each row: failure mode of a component, its effect on the safety goal, the failure rate (λ in FIT), and the diagnostic coverage of any detection mechanism.',
    singular: 'Failure Mode',
    helpHeaders: {
        'Component':  'HW component this failure mode belongs to (declared in HW Components).',
        'Mode':       'Failure mode description (e.g. "Output stuck at high", "Open circuit").',
        'Effect':     'System-level effect / which Safety Goal could be violated.',
        'λ (FIT)':    'Failure rate, failures per 10⁹ h.',
        'DC':         'Diagnostic coverage of any detection mechanism (0..1).',
        'Class':      'Per ISO 26262-5: safe / single-point / residual / multi-point latent / multi-point detected.'
    },
    headers: ['ID', 'Component', 'Mode', 'Effect', 'λ (FIT)', 'DC', 'Class', ''],
    gridCols: '80px 130px 1fr 1fr 80px 60px 130px 40px',
    getList: doc => doc.failureModes || [],
    add: doc => {
        const fm = new FailureMode();
        fm.id = doc.nextId('failureMode');
        (doc.failureModes ||= []).push(fm);
    },
    remove: (doc, id) => { doc.failureModes = (doc.failureModes || []).filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = (doc.failureModes || []).find(x => x.id === id);
        if (!item) return;
        const sels = row.querySelectorAll('select');
        const inputs = row.querySelectorAll('input[type="text"]');
        const numIns = row.querySelectorAll('input[type="number"]');
        item.componentId       = sels[0].value;
        item.description       = inputs[0].value;
        item.effect            = inputs[1].value;
        item.failureRate       = parseFloat(numIns[0].value) || 0;
        item.diagnosticCoverage= Math.max(0, Math.min(1, parseFloat(numIns[1].value) || 0));
        item.classification    = sels[1].value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <select data-fm="component"></select>
        <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="Failure mode description">
        <input type="text" value="${(item.effect||'').replace(/"/g,'&quot;')}" placeholder="System-level effect">
        <input type="number" min="0" step="0.1" value="${item.failureRate || 0}">
        <input type="number" min="0" max="1" step="0.01" value="${item.diagnosticCoverage || 0}">
        <select>
            <option value=""                       ${!item.classification ? 'selected' : ''}>—</option>
            <option value="safe"                   ${item.classification==='safe'?'selected':''}>safe</option>
            <option value="single-point"           ${item.classification==='single-point'?'selected':''}>single-point</option>
            <option value="residual"               ${item.classification==='residual'?'selected':''}>residual</option>
            <option value="multi-point-latent"     ${item.classification==='multi-point-latent'?'selected':''}>multi-point latent</option>
            <option value="multi-point-detected"   ${item.classification==='multi-point-detected'?'selected':''}>multi-point detected</option>
        </select>
        <button class="del-btn req-delete" title="Delete this failure mode">✕</button>
    `,
    postRender: (row, item, doc) => {
        const sel = row.querySelector('select[data-fm="component"]');
        if (!sel) return;
        const opts = ['<option value="">— pick component —</option>']
            .concat(doc.elements
                .filter(e => e.componentKind === 'hw')
                .map(e => `<option value="${e.id}" ${item.componentId===e.id?'selected':''}>${(e.name||e.id).replace(/"/g,'&quot;')}</option>`));
        sel.innerHTML = opts.join('');
    }
});
