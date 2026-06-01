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
        summary.style.background = (gaps || intGaps) ? 'var(--red-bg)' : 'var(--green-bg)';
        summary.style.borderLeftColor = (gaps || intGaps) ? 'var(--red)' : 'var(--green)';
        summary.innerHTML = `
            Safety (ASIL/SIL): <strong>${safetyCovered}/${safety.length}</strong> covered &nbsp;·&nbsp;
            Non-safety (QM): <strong>${nonSafetyCovered}/${nonSafety.length}</strong> covered &nbsp;·&nbsp;
            <strong style="color:${gaps ? 'var(--red)' : 'var(--green)'};">${gaps}</strong> with nothing derived &nbsp;·&nbsp;
            <strong style="color:${intGaps ? 'var(--red)' : 'var(--green)'};">${intGaps}</strong> integrity not inherited
        `;
        wrap.appendChild(summary);

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid var(--border);border-radius:4px;overflow:hidden;';
        const cols = '105px 95px 70px 1fr 80px 1.3fr';
        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:var(--bg-elevated);font-size:11px;text-transform:uppercase;color:var(--text-dim);font-weight:600;border-bottom:1px solid var(--border);`;
        head.innerHTML = `<div>Req</div><div>Layer</div><div>Integrity</div><div>Statement</div><div>SW reqs</div><div>Status</div>`;
        table.appendChild(head);

        cov.forEach(c => {
            let status, color;
            if (c.state === 'gap')               { status = '✗ nothing derived';                 color = 'var(--red)'; }
            else if (c.state === 'integrityGap') { status = `✗ no SW req at ${c.asil}`;           color = 'var(--red)'; }
            else if (c.state === 'advisory')     { status = '⚠ allocation not set';               color = 'var(--amber)'; }
            else if (c.state === 'covered')      { status = `✓ ${c.derivedCount} SW req(s)`;      color = 'var(--green)'; }
            else                                 { status = '— no SW portion';                    color = '#999'; }

            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:13px;border-bottom:1px solid var(--border);align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:var(--accent);">${c.id}</div>
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


// =============================================================================
// SW Takeover Generator — derive SW requirements from allocated System TSRs
// =============================================================================
//
// The "allocate to SYS requirements" workflow. A System Technical Safety
// Requirement (ch07_elements) carries an HW/SW allocation; when it is
// allocated to SW (or both), it should be taken over into a derived SW
// requirement on whichever SW unit implements that TSR's element. The
// unit→element link is Element.implementsElementIds, set on the SW Units
// table (SW Functional chapter).
//
// Mirrors the System-Breakdown / HSI generators: idempotent on re-click,
// pre-flight summary, one Requirement per (parent TSR, implementing unit)
// pair. The derived requirement copies the parent's EARS predicate and
// fields verbatim and only swaps the subject to the unit name, so the
// statement stays valid EARS; ASIL is inherited unchanged (no
// decomposition at this hop) and parentSystemReqs closes the trace.
// Attribute fields the author must still judge (verification beyond the
// inherited default, refined rationale) may leave the requirement amber/
// red until completed — that is expected; the statement text is correct
// from the start.

const SW_DERIVABLE_FIELDS = [
    'conditional', 'conditionalText', 'stateGuard', 'predicate',
    'input', 'output', 'capability', 'actor', 'envelope', 'condition',
    'reaction', 'detectionTime', 'dcTarget', 'fromState', 'toState',
    'trigger', 'transitionTime', 'property', 'value', 'unit', 'tolerance',
    'standard', 'clause', 'prohibitedBehavior', 'boundingCondition',
    'safeStateRef', 'fttiContribution',
    'signalName', 'pin', 'signalProperties', 'signalConsumer',
    'signalTiming', 'signalFailure'
];

class SwTakeoverGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    /** System TSRs (ch07_elements) allocated to SW (or both), with an
     *  element. */
    _allocatedTsrs() {
        return this.doc.requirements.filter(r => {
            if (r.chapterId !== 'ch07_elements' || !r.elementId) return false;
            const a = (r.hwSwAllocation || '').toLowerCase();
            return a === 'sw' || a === 'both';
        });
    }

    /** [{ parent, unit }] for every allocated TSR × implementing SW unit. */
    _pairs() {
        const units = this.doc.elementsForDiscipline('software');
        const out = [];
        this._allocatedTsrs().forEach(p => {
            units.forEach(u => {
                if (Array.isArray(u.implementsElementIds) &&
                    u.implementsElementIds.includes(p.elementId)) {
                    out.push({ parent: p, unit: u });
                }
            });
        });
        return out;
    }

    _isDerived(p, u) {
        return this.doc.requirements.some(r =>
            r.chapterId === 'sw_functional' &&
            r.elementId === u.id &&
            Array.isArray(r.parentSystemReqs) &&
            r.parentSystemReqs.includes(p.id));
    }

    generate() {
        let added = 0;
        this._pairs().forEach(({ parent, unit }) => {
            if (this._isDerived(parent, unit)) return;
            const data = {
                chapterId: 'sw_functional',
                elementId: unit.id,
                subject: unit.name || unit.id,
                asil: parent.asil || '',
                parentSystemReqs: [parent.id],
                verification: (Array.isArray(parent.verification) && parent.verification.length)
                    ? parent.verification.slice() : ['inspection'],
                rationale: `Derived from System TSR ${parent.id} (allocated to SW), implemented by ${unit.name || unit.id}.`
            };
            SW_DERIVABLE_FIELDS.forEach(f => {
                if (parent[f] != null && parent[f] !== '') data[f] = parent[f];
            });
            const r = new Requirement(data);
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            if (parent.smart) r.smart = Object.assign({}, parent.smart);
            this.doc.requirements.push(r);
            added++;
        });
        return added;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Generate SW Requirements from allocated System TSRs
            <span class="help-icon" title="One click: each System TSR allocated to SW becomes a derived SW requirement on every SW unit that implements the TSR's element (set 'Implements' on the SW Units table). The statement and predicate are copied; the subject becomes the unit and ASIL is inherited unchanged. Re-clicking is safe — already-derived pairs are skipped.">?</span>
        </div>`;

        const allocated = this._allocatedTsrs();
        const pairs = this._pairs();
        const already = pairs.filter(({ parent, unit }) => this._isDerived(parent, unit)).length;
        const ready = pairs.length - already;
        const unmapped = allocated.filter(p =>
            !pairs.some(pr => pr.parent.id === p.id)).length;

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:var(--text-mid);margin-bottom:0.5rem;';
        summary.innerHTML = `${allocated.length} TSR(s) allocated to SW · ${pairs.length} unit mapping(s) · ${already} already derived · <strong>${ready}</strong> ready`
            + (unmapped > 0 ? ` · <span style="color:var(--amber);">${unmapped} allocated TSR(s) with no implementing SW unit — set "Implements" on the SW Units table</span>` : '') + '.';
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn-add btn-generate';
        btn.textContent = `Generate ${ready} requirement(s) → SW Functional`;
        btn.disabled = ready === 0;
        wrap.appendChild(btn);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;display:none;';
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            setTimeout(() => this.onChange(), 0);
            status.style.display = 'block';
            if (n === 0) {
                status.style.background = 'var(--bg-hover)';
                status.style.color = 'var(--text-mid)';
                status.textContent = 'Nothing to do — every allocated TSR with an implementing unit is already derived.';
            } else {
                status.style.background = 'var(--green-bg)';
                status.style.color = 'var(--green)';
                status.textContent = `Added ${n} SW requirement(s) to SW Functional & Behavioural. Open that chapter to refine attributes.`;
            }
        });

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
    extraWidgets: (doc, onChange) => [new SwInputCoverage(doc), new SwTakeoverGenerator(doc, onChange)],
    checklist: [
        { id: 'si1', text: 'Every System requirement with a SW portion has ≥1 derived SW requirement (safety and non-safety).' },
        { id: 'si2', text: 'Every safety-classified (ASIL/SIL) System parent has ≥1 derived SW requirement carrying the SAME integrity.',
          help: 'No ASIL/SIL decomposition at the System→SW hop — the integrity is inherited unchanged. The diagnostic flags integrity gaps.' },
        { id: 'si3', text: 'No System requirement relevant to SW is left with allocation unset.' }
    ]
});
