/**
 * disciplines/hardware/hw_inputs.js
 *
 * HW Chapter 2 — HW Requirements Inputs. Auto-generated coverage of the
 * combined System parent layer (acceptance + TSR). Mirrors
 * software/sw_inputs.js. Integrity rule: no ASIL/SIL decomposition at
 * the System→HW hop — a safety parent needs >=1 derived HW requirement
 * at the SAME level.
 */

const HW_DERIVING_CHAPTERS = ['hw_functional', 'ch09_hsi', 'ch10_hw',
    'hw_resource', 'hw_reliability'];

class HwInputCoverage {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">HW Input Coverage — System requirements with a HW portion
            <span class="help-icon" title="Combined parent layer: System acceptance (non-safety/QM) + System TSR (safety). Covered when >=1 HW requirement lists it under Parent System requirement(s). Safety parents also require >=1 derived HW requirement with the SAME ASIL/SIL — no decomposition at this hop.">?</span>
        </div>`;

        const validator = new DocumentValidator(this.doc);
        const cov = validator.systemReqDerivationCoverage('hw', HW_DERIVING_CHAPTERS);

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
        head.innerHTML = `<div>Req</div><div>Layer</div><div>Integrity</div><div>Statement</div><div>HW reqs</div><div>Status</div>`;
        table.appendChild(head);

        cov.forEach(c => {
            let status, color;
            if (c.state === 'gap')               { status = '✗ nothing derived';            color = 'var(--red)'; }
            else if (c.state === 'integrityGap') { status = `✗ no HW req at ${c.asil}`;      color = 'var(--red)'; }
            else if (c.state === 'advisory')     { status = '⚠ allocation not set';          color = 'var(--amber)'; }
            else if (c.state === 'covered')      { status = `✓ ${c.derivedCount} HW req(s)`; color = 'var(--green)'; }
            else                                 { status = '— no HW portion';               color = '#999'; }

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
// HW Takeover Generator — derive HW requirements from allocated System TSRs
// =============================================================================
//
// Mirror of the SW takeover generator (software/sw_inputs.js). A System
// TSR (ch07_elements) allocated to HW (or both) is taken over into a
// derived HW requirement on every HW component that implements the TSR's
// element (Element.implementsElementIds, set on the HW Components table).
// Idempotent; copies the EARS predicate/fields verbatim, swaps the
// subject to the component, inherits ASIL unchanged, and sets
// parentSystemReqs to close the trace.

const HW_DERIVABLE_FIELDS = [
    'conditional', 'conditionalText', 'stateGuard', 'predicate',
    'input', 'output', 'capability', 'actor', 'envelope', 'condition',
    'reaction', 'detectionTime', 'dcTarget', 'fromState', 'toState',
    'trigger', 'transitionTime', 'property', 'value', 'unit', 'tolerance',
    'standard', 'clause', 'prohibitedBehavior', 'boundingCondition',
    'safeStateRef', 'fttiContribution',
    'signalName', 'pin', 'signalProperties', 'signalConsumer',
    'signalTiming', 'signalFailure'
];

class HwTakeoverGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    _allocatedTsrs() {
        return this.doc.requirements.filter(r => {
            if (r.chapterId !== 'ch07_elements' || !r.elementId) return false;
            const a = (r.hwSwAllocation || '').toLowerCase();
            return a === 'hw' || a === 'both';
        });
    }

    _pairs() {
        const comps = this.doc.elementsForDiscipline('hardware');
        const out = [];
        this._allocatedTsrs().forEach(p => {
            comps.forEach(c => {
                if (Array.isArray(c.implementsElementIds) &&
                    c.implementsElementIds.includes(p.elementId)) {
                    out.push({ parent: p, unit: c });
                }
            });
        });
        return out;
    }

    _isDerived(p, c) {
        return this.doc.requirements.some(r =>
            r.chapterId === 'hw_functional' &&
            r.elementId === c.id &&
            Array.isArray(r.parentSystemReqs) &&
            r.parentSystemReqs.includes(p.id));
    }

    generate() {
        let added = 0;
        this._pairs().forEach(({ parent, unit }) => {
            if (this._isDerived(parent, unit)) return;
            const data = {
                chapterId: 'hw_functional',
                elementId: unit.id,
                subject: unit.name || unit.id,
                asil: parent.asil || '',
                parentSystemReqs: [parent.id],
                verification: (Array.isArray(parent.verification) && parent.verification.length)
                    ? parent.verification.slice() : ['inspection'],
                rationale: `Derived from System TSR ${parent.id} (allocated to HW), implemented by ${unit.name || unit.id}.`
            };
            HW_DERIVABLE_FIELDS.forEach(f => {
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
        wrap.innerHTML = `<div class="section-title">Generate HW Requirements from allocated System TSRs
            <span class="help-icon" title="One click: each System TSR allocated to HW becomes a derived HW requirement on every HW component that implements the TSR's element (set 'Implements' on the HW Components table). The statement and predicate are copied; the subject becomes the component and ASIL is inherited unchanged. Re-clicking is safe — already-derived pairs are skipped.">?</span>
        </div>`;

        const allocated = this._allocatedTsrs();
        const pairs = this._pairs();
        const already = pairs.filter(({ parent, unit }) => this._isDerived(parent, unit)).length;
        const ready = pairs.length - already;
        const unmapped = allocated.filter(p =>
            !pairs.some(pr => pr.parent.id === p.id)).length;

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:var(--text-mid);margin-bottom:0.5rem;';
        summary.innerHTML = `${allocated.length} TSR(s) allocated to HW · ${pairs.length} component mapping(s) · ${already} already derived · <strong>${ready}</strong> ready`
            + (unmapped > 0 ? ` · <span style="color:var(--amber);">${unmapped} allocated TSR(s) with no implementing HW component — set "Implements" on the HW Components table</span>` : '') + '.';
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn-add btn-generate';
        btn.textContent = `Generate ${ready} requirement(s) → HW Functional`;
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
                status.textContent = 'Nothing to do — every allocated TSR with an implementing component is already derived.';
            } else {
                status.style.background = 'var(--green-bg)';
                status.style.color = 'var(--green)';
                status.textContent = `Added ${n} HW requirement(s) to HW Functional & Behavioural. Open that chapter to refine attributes.`;
            }
        });

        container.appendChild(wrap);
    }
}

Chapters.register('hardware', {
    id: 'hw_inputs',
    number: '2',
    title: 'HW Requirements Inputs',
    order: 20,
    intro: 'Auto-generated. Coverage of every System requirement with a HW portion — acceptance (non-safety) and TSR (safety) together. Safety parents must have a derived HW requirement at the same ASIL/SIL.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: (doc, onChange) => [new HwInputCoverage(doc), new HwTakeoverGenerator(doc, onChange)],
    checklist: [
        { id: 'hi1', text: 'Every System requirement with a HW portion has ≥1 derived HW requirement (safety and non-safety).' },
        { id: 'hi2', text: 'Every safety-classified System parent has ≥1 derived HW requirement carrying the SAME integrity.',
          help: 'No ASIL/SIL decomposition at the System→HW hop.' },
        { id: 'hi3', text: 'No System requirement relevant to HW is left with allocation unset.' }
    ]
});
