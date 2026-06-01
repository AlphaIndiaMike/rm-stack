/**
 * disciplines/software/sw_verification.js
 *
 * SW Chapter 10 — SW Requirements Verification & Acceptance Status.
 * Not a test tool. Verification-method coverage + the implemented
 * toggle (acceptance) + an auto trace report over the combined System
 * parent layer, showing integrity inheritance per requirement.
 */

const SW_TRACE_CHAPTERS = ['sw_functional', 'ch09_hsi', 'ch11_sw',
    'sw_resource', 'ch13_calibration', 'sw_operational'];

class SwTraceStatusReport {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">SW Trace & Acceptance Status (auto-generated)
            <span class="help-icon" title="System parent → SW requirement → verification method → implemented. Integrity column flags a safety SW requirement whose ASIL/SIL differs from its parent (no decomposition allowed at this hop).">?</span>
        </div>`;

        const byId = {};
        this.doc.requirements.forEach(r => { byId[r.id] = r; });
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
        const withMethod = swReqs.filter(r => r.verification && r.verification.length).length;
        const traced = swReqs.filter(r =>
            Array.isArray(r.parentSystemReqs) && r.parentSystemReqs.length > 0).length;
        const implemented = swReqs.filter(r => r.implemented).length;

        const summary = document.createElement('div');
        summary.className = 'chapter-intro';
        summary.innerHTML = `
            <strong>${total}</strong> SW requirement(s) &nbsp;·&nbsp;
            <strong>${traced}</strong> traced &nbsp;·&nbsp;
            <strong>${withMethod}</strong> with a verification method &nbsp;·&nbsp;
            <strong style="color:${implemented === total ? 'var(--green)' : 'var(--amber)'};">${implemented}/${total}</strong> implemented
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid var(--border);border-radius:4px;overflow:hidden;';
        const cols = '105px 1fr 1.1fr 95px 95px 105px';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:var(--bg-elevated);font-size:11px;text-transform:uppercase;color:var(--text-dim);font-weight:600;border-bottom:1px solid var(--border);`;
        head.innerHTML = `<div>SW Req</div><div>Statement</div><div>Parent(s)</div><div>Integrity</div><div>Verif</div><div>Implemented</div>`;
        table.appendChild(head);

        swReqs.forEach(r => {
            const pIds = r.parentSystemReqs || [];
            const parents = pIds.join(', ') || '— none —';
            const stmt = GrammarValidator.buildStatement(r) || '(incomplete)';
            const lvl = (r.asil || '').trim();
            // integrity check: if any parent is safety-classified, this
            // requirement must carry that exact level.
            let intHtml = '<span style="color:#999;">—</span>';
            const safetyParents = pIds.map(id => byId[id])
                .filter(p => p && (p.asil || '').trim() &&
                             (p.asil || '').trim() !== 'QM');
            if (safetyParents.length) {
                const ok = safetyParents.some(p => (p.asil || '').trim() === lvl);
                intHtml = ok
                    ? `<span style="color:var(--green);font-weight:600;">✓ ${lvl || 'QM'}</span>`
                    : `<span style="color:var(--red);font-weight:600;">✗ ${lvl || 'QM'} ≠ parent</span>`;
            }
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid var(--border);align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:var(--accent);">${r.id}</div>
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${stmt.replace(/"/g,'&quot;')}">${stmt}</div>
                <div style="font-family:monospace;font-size:11px;color:${parents === '— none —' ? 'var(--red)' : 'var(--text-mid)'};">${parents}</div>
                <div style="font-size:11px;">${intHtml}</div>
                <div>${(r.verification && r.verification.length) ? r.verification.join(", ") : "<span style=\"color:var(--red);\">—</span>"}</div>
                <div>${r.implemented
                    ? '<span style="color:var(--green);font-weight:600;">✓ done</span>'
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
    number: '10',
    title: 'SW Requirements Verification & Acceptance Status',
    order: 100,
    intro: 'Auto-generated. Verification-method coverage, per-requirement acceptance status (the implemented toggle), and the System parent → SW requirement trace with integrity-inheritance check. Not a test tool.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new SwTraceStatusReport(doc)],
    checklist: [
        { id: 'sv1', text: 'Every SW requirement has a verification method assigned.' },
        { id: 'sv2', text: 'Every SW requirement traces to a System parent (acceptance or TSR).' },
        { id: 'sv3', text: 'No integrity gap: every safety SW requirement carries its parent\'s ASIL/SIL.' },
        { id: 'sv4', text: 'Acceptance status reviewed: implemented requirements toggled on.' },
        { id: 'sv5', text: 'External RM IDs (Polarion / PTC) filled where mirrored — carry/print only, no sync.' }
    ]
});
