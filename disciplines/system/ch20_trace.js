/**
 * disciplines/system/ch20_trace.js
 *
 * System Chapter 6 (display) — Traceability. Auto-generated content:
 * SG → FSR → acceptance → element → HW/SW chain coverage report,
 * item function coverage, orphan list. Reads from the structured parent
 * fields on every requirement.
 */

class TraceabilityReport {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Trace Matrix (auto-generated)
            <span class="help-icon" title="Built automatically from the parent links on every requirement: parent Safety Goal, parent FSR(s), parent acceptance requirement(s), item function(s), and HW/SW allocation. Edit a requirement's parent fields to change a trace.">?</span>
        </div>`;

        const validator = new DocumentValidator(this.doc);
        const sgCov = validator.safetyGoalCoverage();
        const fnCov = validator.itemFunctionCoverage();
        const orphans = validator.orphanReport();

        let html = '<h6 style="font-size:12px;">Safety Goal Coverage</h6>';
        if (sgCov.length === 0) {
            html += '<p class="text-muted small">No Safety Goals declared.</p>';
        } else {
            html += '<table class="table table-sm table-bordered" style="font-size:12px;">';
            html += '<thead><tr><th>Safety Goal</th><th>Integrity</th><th>FTTI</th><th>FSR</th><th>Accept</th><th>Element</th><th>End-to-end</th></tr></thead><tbody>';
            sgCov.forEach(s => {
                html += `<tr>
                    <td>${(s.name || '(unnamed)')} <small style="color:#999;font-family:monospace;">${s.id}</small></td>
                    <td>${s.asil || 'QM'}</td>
                    <td>${s.ftti || '—'}</td>
                    <td title="${s.fsrCount} FSR(s) trace to this SG">${s.hasFsr ? `✓ ${s.fsrCount}` : '✗'}</td>
                    <td title="${s.acceptanceCount} acceptance req(s) trace through FSR(s)">${s.hasAcceptance ? `✓ ${s.acceptanceCount}` : '✗'}</td>
                    <td title="${s.elementCount} element req(s) trace through acceptance">${s.hasElement ? `✓ ${s.elementCount}` : '✗'}</td>
                    <td>${s.complete ? '<span style="color:var(--green);">✓ complete</span>' : '<span style="color:var(--red);">✗ gap</span>'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '<h6 style="font-size:12px;margin-top:1rem;">Item Function Coverage</h6>';
        if (fnCov.length === 0) {
            html += '<p class="text-muted small">No item functions declared.</p>';
        } else {
            html += '<table class="table table-sm table-bordered" style="font-size:12px;">';
            html += '<thead><tr><th>Item Function</th><th>Acceptance count</th><th>Element count</th><th>Covered</th></tr></thead><tbody>';
            fnCov.forEach(f => {
                html += `<tr>
                    <td>${(f.name || '(unnamed)')} <small style="color:#999;font-family:monospace;">${f.id}</small></td>
                    <td>${f.acceptance}</td>
                    <td>${f.element}</td>
                    <td>${f.covered ? '✓' : '✗'}</td>
                </tr>`;
            });
            html += '</tbody></table>';
        }

        html += '<h6 style="font-size:12px;margin-top:1rem;">Orphans</h6>';
        if (orphans.length === 0) {
            html += '<p class="text-success small">No orphans.</p>';
        } else {
            html += '<ul class="small">';
            orphans.forEach(o => {
                html += `<li><strong>${this.doc.nameForId(o.id)}</strong> <small style="color:#999;font-family:monospace;">${o.id}</small>: ${o.issue}</li>`;
            });
            html += '</ul>';
        }
        wrap.innerHTML += html;
        container.appendChild(wrap);
    }
}


Chapters.register('system', {
    id: 'ch20_trace',
    number: '16',
    title: 'Traceability',
    order: 210,
    intro: 'Trace matrix, orphan report, coverage reports.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new TraceabilityReport(doc)],
    checklist: [
        { id: 'c20a', text: 'Trace matrix present: SG → FSR → TSR → acceptance → element → HW/SW → verification.' },
        { id: 'c20b', text: 'Zero orphans, or every orphan has a waiver.' },
        { id: 'c20c', text: 'Coverage report per item function.' },
        { id: 'c20d', text: 'Coverage report per Safety Goal.' }
    ]
});
