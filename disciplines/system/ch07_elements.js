/**
 * disciplines/system/ch07_elements.js
 *
 * System Chapter 6 (display) — Element Requirements (White-Box Layer).
 * Auto-expands one sub-chapter per declared element. When no element
 * is selected, shows the Element Coverage Diagnostic so the user can
 * see at a glance which elements need work.
 */


// =============================================================================
// Element coverage diagnostic — shown at the chapter root
// =============================================================================

class ElementCoverageDiagnostic {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Element Coverage Diagnostic
            <span class="help-icon" title="Per-element status: requirement count vs 4–13 budget, ASIL, gap flags. Click a row to drill into that element.">?</span>
        </div>`;

        if (!this.doc.elements || this.doc.elements.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No elements declared yet — add them in Chapter 5 (System Breakdown).';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';
        const cols = '1.5fr 80px 100px 1fr 1fr 1fr 1.5fr';

        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `
            <div>Element</div>
            <div>ASIL</div>
            <div>Reqs / 4–13</div>
            <div>Allocated fns</div>
            <div>Has parent SG</div>
            <div>Has acceptance</div>
            <div>Status</div>
        `;
        table.appendChild(head);

        const validator = new DocumentValidator(this.doc);
        const cov = validator.elementCoverage();
        cov.forEach(c => {
            const reqs = this.doc.requirementsForElement(c.id);
            const hasSG = reqs.some(r => r.parentSG);
            const hasAccept = reqs.some(r =>
                Array.isArray(r.parentAcceptanceReqs) && r.parentAcceptanceReqs.length > 0);
            let status = 'green';
            const issues = [];
            if (c.empty)            { status = 'red';    issues.push('no requirements'); }
            else if (c.overBudget)  { status = 'red';    issues.push(`${c.reqCount} > 13`); }
            else if (c.underBudget) { status = 'orange'; issues.push(`${c.reqCount} < 4`); }
            if (!hasSG)             { if (status === 'green') status = 'orange'; issues.push('no parent SG'); }
            if (!hasAccept)         { if (status === 'green') status = 'orange'; issues.push('no parent acceptance'); }
            const statusLabel = status === 'green' ? '✓ ok'
                : status === 'orange' ? '⚠ ' + issues.join(', ')
                : '✗ ' + issues.join(', ');

            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;cursor:pointer;align-items:center;`;
            row.innerHTML = `
                <div style="font-weight:500;color:#0d6efd;">${(c.name || '(unnamed)')}</div>
                <div>${c.asil || 'QM'}</div>
                <div>${c.reqCount} <span class="completeness-dot ${status}" style="margin-left:6px;"></span></div>
                <div>${c.allocatedCount}</div>
                <div>${hasSG ? '✓' : '—'}</div>
                <div>${hasAccept ? '✓' : '—'}</div>
                <div title="${statusLabel.replace(/"/g,'&quot;')}">${statusLabel}</div>
            `;
            row.addEventListener('mouseenter', () => row.style.background = '#f8f9fa');
            row.addEventListener('mouseleave', () => row.style.background = '');
            row.addEventListener('click', () => {
                // Routes through main's onChapterSelected so left pane updates
                if (typeof onChapterSelected === 'function') {
                    onChapterSelected('ch07_elements', c.id);
                }
            });
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}


// =============================================================================
// Chapter registration
// =============================================================================

Chapters.register('system', {
    id: 'ch07_elements',
    number: '6',
    title: 'Technical Safety Requirements (White-Box Layer)',
    order: 80,
    intro: 'Technical Safety Concept (ISO 26262-4:6 / ASPICE SYS.3). TSRs refine the black-box acceptance contract against the system architecture and are allocated to architectural elements. Auto-expands one sub-chapter per declared element; subject = element name. Each TSR carries its HW/SW allocation — that allocation is the handoff to the HW-RS / SW-RS documents.',
    allowsRequirements: false,
    subjectMode: 'none',
    autoExpand: 'elements',
    extraWidgets: doc => [new ElementCoverageDiagnostic(doc)],
    checklist: [
        { id: 'c7a', text: 'Every element has ≥1 Technical Safety Requirement.',
          help: 'The diagnostic above shows the TSR count per element.' },
        { id: 'c7b', text: 'No element exceeds requirement budget (4–13 per leaf).',
          help: '4 is the floor below which the element is under-specified; 13 is the ceiling above which it should be decomposed.' },
        { id: 'c7c', text: 'Expansion ratio from acceptance requirements within 3–15.',
          help: 'Below 3 = TSR layer rubber-stamping acceptance; above 15 = TSR layer taking on HW/SW design responsibility.' },
        { id: 'c7d', text: 'Every TSR allocated to HW, SW or both (the HW-RS / SW-RS handoff).',
          help: 'Set "HW/SW allocation" on each TSR. The SW/HW Requirements Inputs chapters flag TSRs allocated to that discipline with nothing deriving from them.' },
        { id: 'c7e', text: 'Every TSR traces up to a parent acceptance requirement.',
          help: 'Parent acceptance req(s) attribute. Keeps the SG → FSR → acceptance → TSR chain closed.' },
        { id: 'c7f', text: 'Every TSR passes SMART and predicate/EARS checks.',
          help: 'The builder validates both as you type.' }
    ]
});
