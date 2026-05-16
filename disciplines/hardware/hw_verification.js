/**
 * disciplines/hardware/hw_verification.js
 *
 * HW Chapter 9 — HW Requirements Verification & Acceptance Status.
 * Mirrors software/sw_verification.js. Verification-method coverage +
 * implemented toggle + System parent → HW requirement trace with
 * integrity-inheritance check. Not a test tool.
 */

const HW_TRACE_CHAPTERS = ['hw_functional', 'ch09_hsi', 'ch10_hw',
    'hw_resource', 'hw_reliability'];

class HwTraceStatusReport {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">HW Trace & Acceptance Status (auto-generated)
            <span class="help-icon" title="System parent → HW requirement → verification method → implemented. Integrity column flags a safety HW requirement whose ASIL/SIL differs from its parent (no decomposition at this hop).">?</span>
        </div>`;

        const byId = {};
        this.doc.requirements.forEach(r => { byId[r.id] = r; });
        const hwReqs = this.doc.requirements.filter(
            r => HW_TRACE_CHAPTERS.includes(r.chapterId));

        if (hwReqs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No HW requirements authored yet.';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const total = hwReqs.length;
        const withMethod = hwReqs.filter(r => r.verification).length;
        const traced = hwReqs.filter(r =>
            Array.isArray(r.parentSystemReqs) && r.parentSystemReqs.length > 0).length;
        const implemented = hwReqs.filter(r => r.implemented).length;

        const summary = document.createElement('div');
        summary.className = 'chapter-intro';
        summary.innerHTML = `
            <strong>${total}</strong> HW requirement(s) &nbsp;·&nbsp;
            <strong>${traced}</strong> traced &nbsp;·&nbsp;
            <strong>${withMethod}</strong> with a verification method &nbsp;·&nbsp;
            <strong style="color:${implemented === total ? '#198754' : '#fd7e14'};">${implemented}/${total}</strong> implemented
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';
        const cols = '105px 1fr 1.1fr 95px 95px 105px';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `<div>HW Req</div><div>Statement</div><div>Parent(s)</div><div>Integrity</div><div>Verif</div><div>Implemented</div>`;
        table.appendChild(head);

        hwReqs.forEach(r => {
            const pIds = r.parentSystemReqs || [];
            const parents = pIds.join(', ') || '— none —';
            const stmt = GrammarValidator.buildStatement(r) || '(incomplete)';
            const lvl = (r.asil || '').trim();
            let intHtml = '<span style="color:#999;">—</span>';
            const safetyParents = pIds.map(id => byId[id])
                .filter(p => p && (p.asil || '').trim() &&
                             (p.asil || '').trim() !== 'QM');
            if (safetyParents.length) {
                const ok = safetyParents.some(p => (p.asil || '').trim() === lvl);
                intHtml = ok
                    ? `<span style="color:#198754;font-weight:600;">✓ ${lvl || 'QM'}</span>`
                    : `<span style="color:#dc3545;font-weight:600;">✗ ${lvl || 'QM'} ≠ parent</span>`;
            }
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#0d6efd;">${r.id}</div>
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${stmt.replace(/"/g,'&quot;')}">${stmt}</div>
                <div style="font-family:monospace;font-size:11px;color:${parents === '— none —' ? '#dc3545' : '#555'};">${parents}</div>
                <div style="font-size:11px;">${intHtml}</div>
                <div>${r.verification || '<span style="color:#dc3545;">—</span>'}</div>
                <div>${r.implemented
                    ? '<span style="color:#198754;font-weight:600;">✓ done</span>'
                    : '<span style="color:#999;">○ open</span>'}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}

Chapters.register('hardware', {
    id: 'hw_verification',
    number: '9',
    title: 'HW Requirements Verification & Acceptance Status',
    order: 90,
    intro: 'Auto-generated. Verification-method coverage, per-requirement acceptance status (the implemented toggle), and the System parent → HW requirement trace with integrity-inheritance check. Not a test tool.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new HwTraceStatusReport(doc)],
    checklist: [
        { id: 'hv1', text: 'Every HW requirement has a verification method assigned.' },
        { id: 'hv2', text: 'Every HW requirement traces to a System parent (acceptance or TSR).' },
        { id: 'hv3', text: 'No integrity gap: every safety HW requirement carries its parent\'s ASIL/SIL.' },
        { id: 'hv4', text: 'Acceptance status reviewed: implemented requirements toggled on.' },
        { id: 'hv5', text: 'External RM IDs (Polarion / PTC) filled where mirrored — carry/print only, no sync.' }
    ]
});
