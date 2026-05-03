/**
 * disciplines/system/ch09_hsi.js
 *
 * System Chapter 7 (display) — Hardware-Software Interface.
 *
 * STATUS — PARTIAL. Two widgets live here:
 *
 *   HsiSignalCoverageDiagnostic
 *       Working. Reads doc.interfaces and reports per-row whether the
 *       SMART fields (data type / range / unit / period / jitter /
 *       failure behaviour) are filled in. The "▸ expand" button on
 *       interface rows in Chapter 5 fills these. Fine to keep.
 *
 *   timingChain declaration kind   — STUB / BROKEN.
 *       The original implementation never persisted stages and the row
 *       editor was a placeholder. The intent was: each timing chain is
 *       a sensor → fusion → actuator path, with a parent SG, and stages
 *       allocated to elements; the validator's timingCrosscheck would
 *       compare the sum of stage times against the parent SG's FTTI.
 *       That whole path needs a rebuild. See declarations/timingChain.js
 *       for the rebuild target shape.
 *
 * REBUILD PLAN (next time we touch this chapter):
 *   1. Replace declarations/timingChain.js with a real config that
 *      stores stages on doc.timingChains.
 *   2. Add a "TimingChainBudgetCheck" widget here that computes
 *      sum(stages.period) per chain and compares to parent SG FTTI.
 *   3. Wire validator.timingCrosscheck to read from doc.timingChains
 *      instead of (or in addition to) modeTransitions.
 */


// =============================================================================
// HSI Signal Coverage Diagnostic — works as-is
// =============================================================================

class HsiSignalCoverageDiagnostic {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">HSI Signal Coverage
            <span class="help-icon" title="Each interface declared in Chapter 5 should have direction, type, range, period, jitter, failure behaviour. Missing fields are flagged here. Edit the interface row in Ch. 5 (▸ expand) to fill them.">?</span>
        </div>`;

        const ifs = this.doc.interfaces || [];
        if (ifs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No interfaces declared yet — add them in Chapter 5 (External Interfaces).';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:auto;';
        const cols = '90px 1fr 70px 90px 70px 70px 70px 70px 70px 90px';

        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `
            <div>ID</div><div>Name</div><div>Kind</div><div>Direction</div>
            <div>Type</div><div>Range</div><div>Unit</div><div>Period</div><div>Jitter</div><div>Failure</div>
        `;
        table.appendChild(head);

        ifs.forEach(item => {
            const dot = v => v ? '<span style="color:#198754;">✓</span>' : '<span style="color:#dc3545;">—</span>';
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:12px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#666;">${item.id}</div>
                <div>${(item.name||'(unnamed)').replace(/[<>]/g,'')}</div>
                <div>${item.kind || '—'}</div>
                <div>${item.direction || '—'}</div>
                <div>${dot(item.dataType)}</div>
                <div>${dot(item.range)}</div>
                <div>${dot(item.unit)}</div>
                <div>${dot(item.period)}</div>
                <div>${dot(item.jitter)}</div>
                <div>${dot(item.failureBehavior)}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}


// =============================================================================
// Broken-feature notice — visible to the user so they don't think the
// blank table is their fault
// =============================================================================

class TimingChainBrokenNotice {

    constructor() {}
    setDocument() {}

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title" style="color:#92400e;">Timing Chain Editor — under reconstruction</div>`;
        const body = document.createElement('div');
        body.style.cssText = 'background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:0.6rem 0.9rem;font-size:13px;color:#7c2d12;';
        body.innerHTML = `
            The Timing Chains table below is a placeholder. Stages are not yet persisted, and the
            timingCrosscheck validator only inspects mode transitions, not chains. Use the Mode
            Diagnostics in Chapter 5 (System Breakdown) to verify safe-state transition timing
            against FTTI in the meantime.
            <br><br>
            <em>Rebuild plan is documented at the top of disciplines/system/ch09_hsi.js.</em>
        `;
        wrap.appendChild(body);
        container.appendChild(wrap);
    }
}


// =============================================================================
// Chapter registration
// =============================================================================

Chapters.register('system', {
    id: 'ch09_hsi',
    number: '7',
    title: 'Hardware-Software Interface',
    order: 100,
    intro: 'Signal/message catalog, timing chains, diagnostic paths.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 10, max: 60 },
    declarations: ['timingChain'],   // stub kind; see file header
    extraWidgets: doc => [
        new HsiSignalCoverageDiagnostic(doc),
        new TimingChainBrokenNotice()
    ],
    checklist: [
        { id: 'c9a', text: 'Every signal has ID, direction, type, range, resolution, period, jitter, failure behavior.',
          help: 'The HSI Signal Coverage table at the top scores each interface from Ch. 5. Click ▸ on a Ch. 5 interface row to fill in the SMART details.' },
        { id: 'c9b', text: 'Every producer has ≥1 consumer and vice versa.' },
        { id: 'c9c', text: 'Every safety-relevant timing chain closes within FTTI.',
          help: 'BLOCKED until timing chain editor is rebuilt — see file header.' },
        { id: 'c9d', text: 'Every timing chain stage allocated to an element with matching local timing.',
          help: 'BLOCKED until timing chain editor is rebuilt.' },
        { id: 'c9e', text: 'Diagnostic data path exists for every safety mechanism.' },
        { id: 'c9f', text: 'Startup, shutdown, error handling across HSI specified.' },
        { id: 'c9g', text: 'Data persistence rules specified.' }
    ]
});
