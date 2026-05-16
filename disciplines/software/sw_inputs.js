/**
 * disciplines/software/sw_inputs.js
 *
 * SW Chapter 2 — SW Requirements Inputs. Auto-generated coverage of the
 * combined System parent layer (black-box acceptance + TSR white-box).
 * No safety/non-safety chapter split — the table shows every System
 * requirement with a SW portion and whether it is covered, grouped by
 * integrity so safety AND non-safety completeness are both visible.
 *
 * Integrity rule: there is NO ASIL/SIL decomposition at the System->SW
 * hop, so a safety-classified parent must have >=1 derived SW
 * requirement carrying the SAME ASIL/SIL. That is the "integrity gap"
 * state below.
 */

const SW_DERIVING_CHAPTERS = ['sw_functional', 'ch09_hsi', 'ch11_sw',
    'sw_resource', 'ch13_calibration', 'sw_operational'];

class SwInputCoverage {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">SW Input Coverage — System requirements with a SW portion
            <span class="help-icon" title="Combined parent layer: System acceptance (black-box, where QM/non-safety parents live) + System TSR (white-box, safety parents). A row is covered when >=1 SW requirement lists it under Parent System requirement(s). Safety parents (ASIL/SIL) also require >=1 derived SW requirement with the SAME integrity — no decomposition at this hop.">?</span>
        </div>`;

        const validator = new DocumentValidator(this.doc);
        const cov = validator.systemReqDerivationCoverage('sw', SW_DERIVING_CHAPTERS);

        if (cov.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No System acceptance or TSR requirements exist yet — author them in the System discipline.';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const safety = cov.filter(c => c.isSafety);
        const nonSafety = cov.filter(c => !c.isSafety);
        const gaps = cov.filter(c => c.state === 'gap').length;
        const intGaps = cov.filter(c => c.state === 'integrityGap').length;
        const safetyCovered = safety.filter(c => c.state === 'covered').length;
        const nonSafetyCovered = nonSafety.filter(c => c.state === 'covered').length;

        const summary = document.createElement('div');
        summary.className = 'chapter-intro';
        summary.style.background = (gaps || intGaps) ? '#fff4f4' : '#f4fff4';
        summary.style.borderLeftColor = (gaps || intGaps) ? '#dc3545' : '#198754';
        summary.innerHTML = `
            Safety (ASIL/SIL): <strong>${safetyCovered}/${safety.length}</strong> covered &nbsp;·&nbsp;
            Non-safety (QM): <strong>${nonSafetyCovered}/${nonSafety.length}</strong> covered &nbsp;·&nbsp;
            <strong style="color:${gaps ? '#dc3545' : '#198754'};">${gaps}</strong> with nothing derived &nbsp;·&nbsp;
            <strong style="color:${intGaps ? '#dc3545' : '#198754'};">${intGaps}</strong> integrity not inherited
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:hidden;';
        const cols = '105px 95px 70px 1fr 80px 1.3fr';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `<div>Req</div><div>Layer</div><div>Integrity</div><div>Statement</div><div>SW reqs</div><div>Status</div>`;
        table.appendChild(head);

        cov.forEach(c => {
            let status, color;
            if (c.state === 'gap')               { status = '✗ nothing derived';                 color = '#dc3545'; }
            else if (c.state === 'integrityGap') { status = `✗ no SW req at ${c.asil}`;           color = '#dc3545'; }
            else if (c.state === 'advisory')     { status = '⚠ allocation not set';               color = '#fd7e14'; }
            else if (c.state === 'covered')      { status = `✓ ${c.derivedCount} SW req(s)`;      color = '#198754'; }
            else                                 { status = '— no SW portion';                    color = '#999'; }

            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#0d6efd;">${c.id}</div>
                <div>${c.layer}</div>
                <div>${c.asil}</div>
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
    intro: 'Auto-generated. Coverage of every System requirement with a SW portion — acceptance (non-safety/QM) and TSR (safety) together. Safety parents must have a derived SW requirement at the same ASIL/SIL (no decomposition at this hop).',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: doc => [new SwInputCoverage(doc)],
    checklist: [
        { id: 'si1', text: 'Every System requirement with a SW portion has ≥1 derived SW requirement (safety and non-safety).' },
        { id: 'si2', text: 'Every safety-classified (ASIL/SIL) System parent has ≥1 derived SW requirement carrying the SAME integrity.',
          help: 'No ASIL/SIL decomposition at the System→SW hop — the integrity is inherited unchanged. The diagnostic flags integrity gaps.' },
        { id: 'si3', text: 'No System requirement relevant to SW is left with allocation unset.' }
    ]
});
