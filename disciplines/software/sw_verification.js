/**
 * disciplines/software/sw_verification.js
 *
 * SW Chapter 9 — SW Requirements Verification & Status. NOT a test
 * tool. Two things only:
 *   1. Each SW requirement already carries a verification method
 *      attribute (review / analysis / test / ...). This chapter
 *      reports method coverage and the per-requirement acceptance
 *      status (the `implemented` toggle flipped from any requirement
 *      list — e.g. on a tablet during acceptance).
 *   2. An auto trace report: System TSR → SW requirement → status,
 *      the SW analogue of the System Traceability chapter.
 */

const SW_TRACE_CHAPTERS =
    ['sw_functional', 'sw_interface', 'ch11_sw', 'sw_resource', 'ch13_calibration'];

class SwTraceStatusReport {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">SW Trace & Acceptance Status (auto-generated)
            <span class="help-icon" title="System TSR → SW requirement → verification method → implemented. The implemented flag is the toggle on each requirement row; flip it during acceptance.">?</span>
        </div>`;

        const swReqs = this.doc.requirements.filter(
            r => SW_TRACE_CHAPTERS.includes(r.chapterId));

        if (swReqs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No SW requirements authored yet.';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const total = swReqs.length;
        const withMethod = swReqs.filter(r => r.verification).length;
        const traced = swReqs.filter(r =>
            Array.isArray(r.parentSystemReqs) && r.parentSystemReqs.length > 0).length;
        const implemented = swReqs.filter(r => r.implemented).length;

        const summary = document.createElement('div');
        summary.className = 'chapter-intro';
        summary.innerHTML = `
            <strong>${total}</strong> SW requirement(s) &nbsp;·&nbsp;
            <strong>${traced}</strong> traced to a System TSR &nbsp;·&nbsp;
            <strong>${withMethod}</strong> with a verification method &nbsp;·&nbsp;
            <strong style="color:${implemented === total ? '#198754' : '#fd7e14'};">${implemented}/${total}</strong> marked implemented
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';
        const cols = '110px 1fr 1.1fr 100px 110px';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `<div>SW Req</div><div>Statement</div><div>Parent TSR(s)</div><div>Verif</div><div>Implemented</div>`;
        table.appendChild(head);

        swReqs.forEach(r => {
            const parents = (r.parentSystemReqs || []).join(', ') || '— none —';
            const stmt = GrammarValidator.buildStatement(r) || '(incomplete)';
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#0d6efd;">${r.id}</div>
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${stmt.replace(/"/g,'&quot;')}">${stmt}</div>
                <div style="font-family:monospace;font-size:11px;color:${parents === '— none —' ? '#dc3545' : '#555'};">${parents}</div>
                <div>${r.verification || '<span style="color:#dc3545;">—</span>'}</div>
                <div>${r.implemented
                    ? '<span style="color:#198754;font-weight:600;">✓ implemented</span>'
                    : '<span style="color:#999;">○ open</span>'}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}

Chapters.register('software', {
    id: 'sw_verification',
    number: '9',
    title: 'SW Requirements Verification & Status',
    order: 90,
    intro: 'Auto-generated. Verification-method coverage and per-requirement acceptance status (the implemented toggle on each requirement row), plus the System TSR → SW requirement trace. Not a test tool.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new SwTraceStatusReport(doc)],
    checklist: [
        { id: 'sv1', text: 'Every SW requirement has a verification method assigned.' },
        { id: 'sv2', text: 'Every SW requirement traces to a parent System TSR.' },
        { id: 'sv3', text: 'Acceptance status reviewed: implemented requirements toggled on.',
          help: 'Flip the implemented toggle on each requirement row as you accept it.' },
        { id: 'sv4', text: 'External RM IDs (Polarion / PTC) filled where the requirement was mirrored.',
          help: 'Optional External ID field on each requirement — carry/print only, no sync.' }
    ]
});
