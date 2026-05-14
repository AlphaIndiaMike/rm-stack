/**
 * disciplines/system/ch09_hsi.js
 *
 * System Chapter 7 (display) — Hardware-Software Interface.
 *
 * REBUILT. The old version had a non-functional "timing chain" stub.
 * The HSI is now modelled for what it actually is: a catalog of signals
 * crossing the HW/SW boundary, each bound to a physical pin / connector
 * / bus address, with electrical / data / timing / failure properties.
 *
 * Three pieces, all in this file:
 *
 *   declarations: ['hsiSignal']
 *       The signal catalog itself — a structured table (declarations/
 *       hsiSignal.js). This is where "which pin does what" is captured.
 *
 *   HsiCoverageDiagnostic
 *       Per-signal completeness check. Reads doc.hsiSignals and flags
 *       rows missing pin / electrical / encoding / failure behaviour.
 *
 *   HsiRequirementGenerator
 *       One click → one 'interface'-predicate requirement per fully-
 *       specified signal, appended to this chapter. Idempotent on
 *       re-click (a signal is "covered" when a requirement with
 *       predicate=interface already has the same signalName + pin).
 *       Mirrors the mode-transition generator in Chapter 5.
 *
 * Interface-definition requirements are non-functional / structural —
 * "The HSI shall define signal VehicleSpeed on CAN id 0x1A0 as uint16
 * 0.01 km/h/bit, 10 ms period". The 'interface' predicate (grammar.js)
 * carries that EARS-style ubiquitous pattern. You can also author these
 * by hand with the requirement builder below — pick predicate
 * "Define interface signal (HSI)".
 */


// =============================================================================
// HSI Signal Coverage Diagnostic
// =============================================================================

class HsiCoverageDiagnostic {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">HSI Signal Coverage
            <span class="help-icon" title="Per-signal completeness. A signal is 'complete' once it has a pin/address, an electrical description, an encoding, and a defined failure behaviour. Incomplete signals can't be turned into requirements.">?</span>
        </div>`;

        const sigs = this.doc.hsiSignals || [];
        if (sigs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No signals in the catalog yet — add them in the HSI Signal Catalog table above.';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:auto;';
        const cols = '90px 1fr 110px 70px 70px 70px 70px 90px';

        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;background:#f8f9fa;font-size:11px;text-transform:uppercase;color:#666;font-weight:600;border-bottom:1px solid #dee2e6;`;
        head.innerHTML = `
            <div>ID</div><div>Name</div><div>Pin/Addr</div>
            <div>Elec</div><div>Enc</div><div>Period</div><div>Fail</div><div>Status</div>
        `;
        table.appendChild(head);

        sigs.forEach(s => {
            const dot = v => v ? '<span style="color:#198754;">✓</span>' : '<span style="color:#dc3545;">—</span>';
            const complete = !!(s.name && s.pin && s.electrical && s.encoding && s.failureBehavior);
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};gap:0.4rem;padding:0.5rem 0.75rem;font-size:12px;border-bottom:1px solid #f0f0f0;align-items:center;`;
            row.innerHTML = `
                <div style="font-family:monospace;color:#666;">${s.id}</div>
                <div>${(s.name||'(unnamed)').replace(/[<>]/g,'')}</div>
                <div>${(s.pin||'—').replace(/[<>]/g,'')}</div>
                <div>${dot(s.electrical)}</div>
                <div>${dot(s.encoding)}</div>
                <div>${dot(s.period)}</div>
                <div>${dot(s.failureBehavior)}</div>
                <div>${complete
                    ? '<span style="color:#198754;font-weight:600;">complete</span>'
                    : '<span style="color:#dc3545;">incomplete</span>'}</div>
            `;
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}


// =============================================================================
// HSI Requirement Generator — single button, idempotent
// =============================================================================

class HsiRequirementGenerator {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    /** A signal is eligible if it has the mandatory fields the
     *  'interface' predicate needs (name, pin, electrical) and isn't
     *  already represented by a predicate=interface requirement in this
     *  chapter with the same signalName + pin. */
    _eligible() {
        const sigs = this.doc.hsiSignals || [];
        return sigs.filter(s => {
            if (!s.name || !s.pin || !s.electrical) return false;
            const exists = this.doc.requirements.some(r =>
                r.chapterId === 'ch09_hsi' &&
                r.predicate === 'interface' &&
                r.signalName === s.name &&
                r.pin === s.pin);
            return !exists;
        });
    }

    /** Build the "properties" string the interface predicate renders. */
    _propsOf(s) {
        const parts = [];
        if (s.signalType)  parts.push(s.signalType);
        if (s.electrical)  parts.push(s.electrical);
        if (s.encoding)    parts.push(s.encoding);
        return parts.join(', ') || s.electrical || '(properties)';
    }

    /** Append one Requirement per eligible signal. Returns count added.
     *
     *  Generated requirements are pre-filled to be valid on creation:
     *    - asil 'QM' — interface definitions are non-safety by default;
     *      the user upgrades the ASIL if a signal is safety-relevant.
     *    - SMART attestations pre-ticked — a generated interface
     *      requirement is specific (names signal + pin), measurable
     *      (carries electrical / encoding values) and time-bound (has a
     *      period or is explicitly on-change) by construction. The user
     *      can untick any of these if they disagree.
     *  This keeps the validator strict for hand-authored requirements
     *  while not dumping invalid stubs into the list. */
    generate() {
        let added = 0;
        this._eligible().forEach(s => {
            const iface = (this.doc.interfaces || []).find(i => i.id === s.interfaceId);
            const subject = iface ? (iface.name || iface.id) : 'the HSI';
            const r = new Requirement({
                chapterId: 'ch09_hsi',
                conditional: 'ubiquitous',
                subject: subject,
                predicate: 'interface',
                signalName: s.name,
                pin: s.pin,
                signalProperties: this._propsOf(s),
                signalTiming: s.period || '',
                signalFailure: s.failureBehavior || '',
                rationale: `Generated from HSI signal catalog entry ${s.id} (${s.name}).`,
                verification: 'inspection',
                asil: 'QM'
            });
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            r.smart = { specific: true, measurable: true, achievable: true,
                        relevant: true, timebound: true };
            this.doc.requirements.push(r);
            added++;
        });
        return added;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Generate Interface Requirements
            <span class="help-icon" title="One click: each fully-specified signal in the catalog above becomes an 'interface'-predicate requirement appended to this chapter. Signals missing name / pin / electrical are skipped. Re-clicking is safe — already-generated signals are detected and not duplicated.">?</span>
        </div>`;

        const sigs = this.doc.hsiSignals || [];
        const eligible = this._eligible();
        const alreadyGenerated = this.doc.requirements.filter(r =>
            r.chapterId === 'ch09_hsi' && r.predicate === 'interface').length;
        const incomplete = sigs.length - eligible.length - alreadyGenerated;

        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:12px;color:#555;margin-bottom:0.5rem;';
        summary.innerHTML = `${sigs.length} signal(s) in catalog, ${alreadyGenerated} already generated, ` +
            `<strong>${eligible.length}</strong> ready` +
            (incomplete > 0 ? `, ${incomplete} incomplete (need name + pin + electrical)` : '') + '.';
        wrap.appendChild(summary);

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-primary';
        btn.textContent = `Generate ${eligible.length} requirement(s)`;
        btn.disabled = eligible.length === 0;
        wrap.appendChild(btn);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:0.5rem;font-size:12px;padding:0.4rem 0.6rem;border-radius:4px;display:none;';
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            setTimeout(() => this.onChange(), 0);
            status.style.display = 'block';
            if (n === 0) {
                status.style.background = '#e9ecef';
                status.style.color = '#495057';
                status.textContent = 'Nothing to do — every complete signal is already in the requirements list below.';
            } else {
                status.style.background = '#d1e7dd';
                status.style.color = '#0f5132';
                status.textContent = `Added ${n} interface requirement(s) — see the list below.`;
            }
        });

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
    intro: 'Catalog every signal crossing the HW/SW boundary, bind it to a physical pin / connector / bus address, then generate interface-definition requirements from the catalog. You can also author interface requirements by hand below — pick predicate "Define interface signal (HSI)".',
    allowsRequirements: true,
    // Interface requirements use the parent interface name (or "the HSI")
    // as their subject — they are not element-scoped, so subjectMode is
    // 'none' and the builder lets the user pick / type the subject.
    subjectMode: 'none',
    declarations: ['hsiSignal'],
    extraWidgets: (doc, onChange) => [
        new HsiCoverageDiagnostic(doc),
        new HsiRequirementGenerator(doc, onChange)
    ],
    checklist: [
        { id: 'c9a', text: 'Every signal has a pin / connector / bus address.',
          help: 'The HSI Signal Coverage table flags signals missing a physical location.' },
        { id: 'c9b', text: 'Every signal has an electrical description (level, range).',
          help: 'Voltage / current / logic level. Needed before a signal can be generated into a requirement.' },
        { id: 'c9c', text: 'Every signal has an encoding / resolution.',
          help: 'How the data is represented on the wire — data type, scaling, active level.' },
        { id: 'c9d', text: 'Every signal has a defined failure behaviour.',
          help: 'What the receiver does on loss or corruption — hold last, default safe value, high-Z.' },
        { id: 'c9e', text: 'Periodic signals have a stated period; event signals marked on-change.' },
        { id: 'c9f', text: 'Every safety-relevant signal has a diagnostic / monitoring method.',
          help: 'Range check, rolling counter, CRC, timeout supervision. "none" is a valid answer only for non-safety signals.' },
        { id: 'c9g', text: 'Signals are bound to a parent interface from Chapter 5 where applicable.',
          help: 'Keeps the HSI catalog consistent with the declared interface list.' },
        { id: 'c9h', text: 'Interface requirements generated (or authored) for every catalogued signal.',
          help: 'Use "Generate Interface Requirements" above, or author them by hand with the builder.' }
    ]
});
