/**
 * disciplines/software/sw_inputs.js
 *
 * SW Chapter 2 — SW Requirements Inputs. The upstream contract for the
 * SW-RS is the set of System Technical Safety Requirements (ch07,
 * white-box) allocated to SW. This chapter is auto-generated: it does
 * not hold requirements, it shows a coverage diagnostic of which
 * SW-allocated TSRs have ≥1 SW requirement deriving from them — the
 * SW analogue of the System Element Coverage Diagnostic.
 *
 * Allocation is the TSR's hwSwAllocation (sw / both). Derivation is the
 * parentSystemReqs back-reference from any SW requirement chapter.
 * Nothing to enter here; it reads the structured fields.
 */

// Chapter ids that count as "a SW requirement deriving from a TSR".
const SW_DERIVING_CHAPTERS =
    ['sw_functional', 'sw_interface', 'ch11_sw', 'sw_resource'];

class SwInputCoverage {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">SW Input Coverage — System TSRs allocated to SW
            <span class="help-icon" title="System Technical Safety Requirements (System Ch.6) carrying HW/SW allocation = sw or both. A row is covered when ≥1 SW requirement lists it under Parent System TSR(s). Set allocation on each TSR in the System discipline.">?</span>
        </div>`;

        const validator = new DocumentValidator(this.doc);
        const cov = validator.systemReqDerivationCoverage('sw', SW_DERIVING_CHAPTERS);

        if (cov.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No System Technical Safety Requirements exist yet — author them in the System discipline (Chapter 6).';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const allocated = cov.filter(c => c.allocatedHere);
        const gaps = allocated.filter(c => c.gap).length;
        const advisory = cov.filter(c => c.advisory).length;

        const summary = document.createElement('div');
        summary.className = 'chapter-intro';
        summary.style.background = gaps > 0 ? '#fff4f4' : '#f4fff4';
        summary.style.borderLeftColor = gaps > 0 ? '#dc3545' : '#198754';
        summary.innerHTML = `
            <strong>${allocated.length}</strong> TSR(s) allocated to SW &nbsp;·&nbsp;
            <strong style="color:${gaps > 0 ? '#dc3545' : '#198754'};">${gaps}</strong> with no SW requirement deriving from them
            ${advisory > 0 ? `&nbsp;·&nbsp; <strong style="color:#fd7e14;">${advisory}</strong> TSR(s) have no HW/SW allocation set yet` : ''}
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';
        const cols = '110px 70px 90px 1fr 90px 1.2fr';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `<div>TSR</div><div>ASIL</div><div>Alloc</div><div>Statement</div><div>SW reqs</div><div>Status</div>`;
        table.appendChild(head);

        cov.forEach(c => {
            let status, color;
            if (c.gap)            { status = '✗ allocated to SW, nothing derives'; color = '#dc3545'; }
            else if (c.advisory)  { status = '⚠ allocation not set';                color = '#fd7e14'; }
            else if (c.allocatedHere) { status = `✓ ${c.derivedCount} SW req(s)`;    color = '#198754'; }
            else                  { status = '— not allocated to SW';                color = '#999'; }

            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#0d6efd;">${c.id}</div>
                <div>${c.asil}</div>
                <div>${c.allocation}</div>
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.statement.replace(/"/g,'&quot;')}">${c.statement}</div>
                <div>${c.derivedCount}</div>
                <div style="color:${color};" title="${status.replace(/"/g,'&quot;')}">${status}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}

Chapters.register('software', {
    id: 'sw_inputs',
    number: '2',
    title: 'SW Requirements Inputs',
    order: 20,
    intro: 'Auto-generated. The System Technical Safety Requirements allocated to SW are the inputs to the SW-RS. Each must have at least one SW requirement deriving from it (Parent System TSR(s) attribute).',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new SwInputCoverage(doc)],
    checklist: [
        { id: 'si1', text: 'Every System TSR allocated to SW has ≥1 derived SW requirement.',
          help: 'The diagnostic above shows a ✗ for any SW-allocated TSR with nothing deriving from it.' },
        { id: 'si2', text: 'No TSR relevant to SW is left with allocation unset.',
          help: 'Set HW/SW allocation on each TSR in the System discipline (Chapter 6).' },
        { id: 'si3', text: 'HSI signals consumed by SW reviewed (Chapter 4) and assumptions captured (Chapter 8).' }
    ]
});
