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

        const sysEls = this.doc.elementsForDiscipline(this.doc.discipline);
        if (sysEls.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No elements declared yet — add them in Chapter 5 (System Breakdown).';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid var(--border);border-radius:4px;overflow:hidden;';
        const cols = '1.5fr 80px 100px 1fr 1fr 1fr 1.5fr';

        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:var(--bg-elevated);font-size:11px;text-transform:uppercase;color:var(--text-dim);font-weight:600;border-bottom:1px solid var(--border);`;
        const hd = (label, help) => `<div>${label} <span class="help-icon" title="${help.replace(/"/g,'&quot;')}">?</span></div>`;
        head.innerHTML = `
            <div>Element</div>
            <div>ASIL</div>
            ${hd('Reqs / 4–13', 'TSR count for this element. Fulfil: open the element (click the row) and add requirements. 4 is the under-specification floor, 13 the decomposition ceiling.')}
            ${hd('Implements', 'How many Item Functions this element realizes. Fulfil: in Chapter 5 System Breakdown, set the \'Implements\' multi-select on the element row.')}
            ${hd('Traces to SG', 'Whether any of this element\'s TSRs reaches a Safety Goal through the chain TSR → parent acceptance requirement → parent FSR → parent Safety Goal. Fulfil: set \'Parent acceptance req(s)\' on a TSR, make sure that acceptance requirement has \'Parent FSR(s)\', and the FSR a \'Parent Safety Goal\'.')}
            ${hd('Has acceptance', 'Whether any of this element\'s TSRs has \'Parent acceptance req(s)\' set. Fulfil: open the element and set the parent on each TSR.')}
            <div>Status</div>
        `;
        table.appendChild(head);

        const validator = new DocumentValidator(this.doc);
        const cov = validator.elementCoverage();
        // "Traces to SG" follows the real chain (TSR → acceptance → FSR → SG)
        // via the validator, not a direct parentSG field a TSR cannot carry.
        cov.forEach(c => {
            const reqs = this.doc.requirementsForElement(c.id);
            const hasSG = validator.elementTracesToSG(c.id);
            const hasAccept = reqs.some(r =>
                Array.isArray(r.parentAcceptanceReqs) && r.parentAcceptanceReqs.length > 0);
            let status = 'green';
            const issues = [];
            if (c.empty)            { status = 'red';    issues.push('no requirements'); }
            else if (c.overBudget)  { status = 'red';    issues.push(`${c.reqCount} > 13`); }
            else if (c.underBudget) { status = 'orange'; issues.push(`${c.reqCount} < 4`); }
            if (!hasAccept)         { if (status === 'green') status = 'orange'; issues.push('no parent acceptance'); }
            if (!hasSG)             { if (status === 'green') status = 'orange'; issues.push('no trace to a Safety Goal'); }
            const statusLabel = status === 'green' ? '✓ ok'
                : status === 'orange' ? '⚠ ' + issues.join(', ')
                : '✗ ' + issues.join(', ');

            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid var(--border);cursor:pointer;align-items:center;`;
            row.innerHTML = `
                <div style="font-weight:500;color:var(--accent);">${(c.name || '(unnamed)')}</div>
                <div>${c.asil || 'QM'}</div>
                <div>${c.reqCount} <span class="completeness-dot ${status}" style="margin-left:6px;"></span></div>
                <div style="${c.allocatedCount === 0 ? 'color:var(--amber);' : ''}" title="${c.allocatedCount === 0 ? 'No item functions allocated — set the Implements multi-select on this element in System Breakdown.' : ''}">${c.allocatedCount === 0 ? '⚠ 0' : c.allocatedCount}</div>
                <div>${hasSG ? '✓' : '—'}</div>
                <div>${hasAccept ? '✓' : '—'}</div>
                <div title="${statusLabel.replace(/"/g,'&quot;')}">${statusLabel}</div>
            `;
            row.addEventListener('mouseenter', () => row.style.background = 'var(--bg-elevated)');
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
    number: '5',
    title: 'Technical Safety Requirements (White-Box Layer)',
    order: 80,
    intro: 'Technical Safety Concept (ISO 26262-4:6 / ASPICE SYS.3). TSRs refine the black-box acceptance contract against the system architecture. OVERALL technical-safety-concept requirements (system-wide mechanisms, cross-element behaviour) are authored here at the chapter root with subject "the system"; element-specific TSRs live in the auto-expanded sub-chapter per declared element (subject = element name). Each TSR carries its HW/SW allocation — that allocation is the handoff to the HW-RS / SW-RS documents.',
    allowsRequirements: true,
    subjectMode: 'system',
    autoExpand: 'elements',
    // The coverage diagnostic is a chapter-level overview; inside an
    // element sub-chapter it is noise (and repeats on every level).
    widgetsAtRootOnly: true,
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
          help: 'Parent acceptance req(s) attribute. Keeps the SG → FSR → acceptance → TSR chain closed.' }
    ]
});
