/**
 * disciplines/system/ch09_hsi.js
 *
 * System Chapter 6 (display) — Hardware-Software Interface.
 *
 * Two sections that read as plain sentences:
 *
 *   1. External Interface Mapping  (always shown)
 *      Per signal: "external interface — signal — controller (MCU)".
 *
 *   2. Internal Mapping  (only when there is more than one controller)
 *      Per inter-controller link: "MCU1 — interface — signal — interface
 *      — MCU2". Interfaces are free-text with autocomplete (lex-interfaces);
 *      the signal is chosen from the HSI catalog.
 *
 * Styling reuses the declaration-table classes (.declaration-header /
 * .declaration-row / .req-id / .validation-ok / .validation-warn /
 * .empty-state / .btn-add), so these tables look identical to the rest of
 * the tool. The only inline style is the dynamic grid-template-columns,
 * exactly as ui/declaration_table.js does it.
 */

// Lay a grid out the same way ui/declaration_table.js does: header gets
// display:grid + columns + gap inline; rows get .declaration-row (which is
// already display:grid in CSS) plus the dynamic columns inline.
function hsiHeader(cols, cells) {
    const h = document.createElement('div');
    h.className = 'declaration-header';
    h.style.display = 'grid';
    h.style.gridTemplateColumns = cols;
    h.style.gap = '0.4rem';
    h.innerHTML = cells.map(c => `<div>${c}</div>`).join('');
    return h;
}
function hsiRow(cols) {
    const r = document.createElement('div');
    r.className = 'declaration-row';
    r.style.gridTemplateColumns = cols;
    return r;
}
function hsiCell(text, cls) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    d.textContent = text;
    return d;
}


// =============================================================================
// 1. External Interface Mapping — interface → signal → MCU
// =============================================================================

class ExternalInterfaceMapping {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    _controllers() {
        return (this.doc.elements || []).filter(e => (e.componentKind || 'system') === 'system');
    }
    _externalIfs() {
        return (this.doc.interfaces || []).filter(i => (i.scope || 'external') === 'external');
    }
    _internalIfs() {
        return (this.doc.interfaces || []).filter(i => i.scope === 'internal');
    }
    _opts(selectedId, list, placeholder) {
        return ['<option value="">' + (placeholder || '—') + '</option>'].concat(
            list.map(o => `<option value="${o.id}" ${o.id === selectedId ? 'selected' : ''}>${(o.name || o.id).replace(/"/g,'&quot;')}</option>`)
        ).join('');
    }
    /** External AND internal interfaces, grouped. A signal from an
     *  in-system source (e.g. Radar → MCU) travels over an INTERNAL
     *  interface; until v1.6.3 those were unselectable here, so such
     *  signals could never be mapped. */
    _ifOptsGrouped(selectedId, exts, ints, placeholder) {
        const opt = o => `<option value="${o.id}" ${o.id === selectedId ? 'selected' : ''}>${(o.name || o.id).replace(/"/g,'&quot;')}</option>`;
        let html = '<option value="">' + (placeholder || '— interface —') + '</option>';
        if (exts.length) html += '<optgroup label="External interfaces">' + exts.map(opt).join('') + '</optgroup>';
        if (ints.length) html += '<optgroup label="Internal interfaces">' + ints.map(opt).join('') + '</optgroup>';
        return html;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Interface Mapping
            <span class="help-icon" title="For each signal in the catalog above, choose the interface it travels over — external (sensor/actuator boundary) or internal (between in-system elements, e.g. Radar → MCU) — and the controller (MCU) it terminates on. Reads left to right: interface — signal — controller.">?</span>
        </div>`;

        const sigs = this.doc.hsiSignals || [];
        if (sigs.length === 0) {
            const e = document.createElement('div');
            e.className = 'empty-state';
            e.textContent = 'No signals yet — add them in the HSI Signal Catalog above, then map each to its interface and controller here.';
            wrap.appendChild(e);
            container.appendChild(wrap);
            return;
        }

        const exts = this._externalIfs();
        const ints = this._internalIfs();
        const ctrls = this._controllers();
        const cols = '1fr 1.6rem 1fr 1.6rem 1fr 5rem';

        wrap.appendChild(hsiHeader(cols, ['Interface (ext / int)', '', 'Signal', '', 'Controller (MCU)', 'Status']));

        sigs.forEach(s => {
            const row = hsiRow(cols);

            const ifSel = document.createElement('select');
            ifSel.classList.add('select-truncate');
            ifSel.innerHTML = this._ifOptsGrouped(s.interfaceId, exts, ints, '— interface —');
            ifSel.addEventListener('change', () => { s.interfaceId = ifSel.value; this.onChange(); });

            const mcuSel = document.createElement('select');
            mcuSel.classList.add('select-truncate');
            mcuSel.innerHTML = this._opts(s.elementId, ctrls, '— controller —');
            mcuSel.addEventListener('change', () => { s.elementId = mcuSel.value; this.onChange(); });

            const mapped = !!(s.interfaceId && s.elementId);

            row.appendChild(ifSel);
            row.appendChild(hsiCell('→'));
            row.appendChild(hsiCell(s.name || '(unnamed)'));
            row.appendChild(hsiCell('→'));
            row.appendChild(mcuSel);
            row.appendChild(hsiCell(mapped ? 'mapped' : 'incomplete', mapped ? 'validation-ok' : 'validation-warn'));
            wrap.appendChild(row);
        });

        if (exts.length === 0 && ints.length === 0) {
            const note = document.createElement('div');
            note.className = 'empty-state';
            note.textContent = 'No interfaces declared yet — add external or internal interfaces in System Breakdown.';
            wrap.appendChild(note);
        }
        if (ctrls.length === 0) {
            const note = document.createElement('div');
            note.className = 'empty-state';
            note.textContent = 'No controllers declared yet — declare your elements (e.g. MCU1) in System Breakdown.';
            wrap.appendChild(note);
        }
        container.appendChild(wrap);
    }
}


// =============================================================================
// 2. Internal Mapping — MCU1 → interface → signal → interface → MCU2
//    (only when there is more than one controller)
// =============================================================================

class InternalMapping {

    constructor(doc, onChange) {
        this.doc = doc;
        this.onChange = onChange || (() => {});
    }
    setDocument(doc) { this.doc = doc; }

    _controllers() {
        return (this.doc.elements || []).filter(e => (e.componentKind || 'system') === 'system');
    }
    _links() {
        return (this.doc.interfaces || []).filter(i => i.scope === 'internal');
    }
    _ctrlOpts(selectedId, list) {
        return ['<option value="">— controller —</option>'].concat(
            list.map(e => `<option value="${e.id}" ${e.id === selectedId ? 'selected' : ''}>${(e.name || e.id).replace(/"/g,'&quot;')}</option>`)
        ).join('');
    }
    _signalOpts(selectedName) {
        return ['<option value="">— signal —</option>'].concat(
            (this.doc.hsiSignals || []).filter(s => s.name).map(s =>
                `<option value="${s.name.replace(/"/g,'&quot;')}" ${s.name === selectedName ? 'selected' : ''}>${s.name.replace(/[<>]/g,'')}</option>`)
        ).join('');
    }

    render(container) {
        const ctrls = this._controllers();
        // Only relevant with more than one controller. With one (or none),
        // there is nothing to link — hide the section, flag nothing.
        if (ctrls.length < 2) return;

        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">Internal Mapping
            <span class="help-icon" title="Links between controllers (shown because you have more than one MCU/ECU). Each row reads: source controller — interface — signal — interface — destination controller. Interfaces are free text and autocomplete from interfaces used elsewhere; the signal is chosen from the HSI catalog.">?</span>
        </div>`;

        const links = this._links();
        const cols = '1fr 1fr 1fr 1fr 1fr 2rem';

        wrap.appendChild(hsiHeader(cols, ['From controller', 'Interface', 'Signal', 'Interface', 'To controller', '']));

        links.forEach(i => {
            const row = hsiRow(cols);

            const fromSel = document.createElement('select');
            fromSel.innerHTML = this._ctrlOpts(i.producerElementId, ctrls);
            fromSel.addEventListener('change', () => { i.producerElementId = fromSel.value; this.onChange(); });

            const ifFrom = document.createElement('input');
            ifFrom.type = 'text'; ifFrom.value = i.name || '';
            ifFrom.setAttribute('list', 'lex-interfaces'); ifFrom.placeholder = 'e.g. CAN0';
            ifFrom.addEventListener('input', () => { i.name = ifFrom.value; });
            ifFrom.addEventListener('change', () => { this.doc.addToLexicon('interfaces', ifFrom.value); setTimeout(() => this.onChange(), 0); });

            const sigSel = document.createElement('select');
            sigSel.innerHTML = this._signalOpts(i.signalName);
            sigSel.addEventListener('change', () => { i.signalName = sigSel.value; this.onChange(); });

            const ifTo = document.createElement('input');
            ifTo.type = 'text'; ifTo.value = i.interfaceTo || '';
            ifTo.setAttribute('list', 'lex-interfaces'); ifTo.placeholder = 'e.g. CAN2';
            ifTo.addEventListener('input', () => { i.interfaceTo = ifTo.value; });
            ifTo.addEventListener('change', () => { this.doc.addToLexicon('interfaces', ifTo.value); setTimeout(() => this.onChange(), 0); });

            const toSel = document.createElement('select');
            toSel.innerHTML = this._ctrlOpts(i.consumerElementId, ctrls);
            toSel.addEventListener('change', () => { i.consumerElementId = toSel.value; this.onChange(); });

            const del = document.createElement('button');
            del.className = 'del-btn req-delete'; del.title = 'Delete this internal link'; del.textContent = '✕';
            del.addEventListener('click', () => {
                this.doc.interfaces = (this.doc.interfaces || []).filter(x => x.id !== i.id);
                this.onChange();
            });

            row.appendChild(fromSel);
            row.appendChild(ifFrom);
            row.appendChild(sigSel);
            row.appendChild(ifTo);
            row.appendChild(toSel);
            row.appendChild(del);
            wrap.appendChild(row);
        });

        const add = document.createElement('button');
        add.className = 'btn-add';
        add.style.marginTop = '0.5rem';
        add.textContent = '+ Add internal link';
        add.addEventListener('click', () => {
            const iface = new InterfaceSpec();
            iface.id = this.doc.nextId('interfaceSpec');
            iface.scope = 'internal';
            iface.kind = 'data';
            (this.doc.interfaces ||= []).push(iface);
            this.onChange();
        });
        wrap.appendChild(add);

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

    /** A signal is eligible if it has the mandatory fields the 'interface'
     *  predicate needs (name, pin, electrical) and isn't already represented
     *  by a predicate=interface requirement with the same signalName + pin. */
    /** Which required fields a signal is still missing, with WHERE to
     *  set each — pure and testable; drives the per-signal summary so
     *  "incomplete" is never a mystery (v1.6.5). */
    _missingOf(s) {
        const out = [];
        if (!s.name)       out.push('name (catalog row)');
        if (!s.pin)        out.push('pin / address (catalog row)');
        if (!s.electrical) out.push('electrical (▸ detail of the catalog row)');
        return out;
    }

    _eligible() {
        const sigs = this.doc.hsiSignals || [];
        return sigs.filter(s => {
            if (this._missingOf(s).length) return false;
            return !this.doc.requirements.some(r =>
                r.chapterId === 'ch09_hsi' && r.predicate === 'interface' &&
                r.signalName === s.name && r.pin === s.pin);
        });
    }

    _propsOf(s) {
        const parts = [];
        if (s.signalType) parts.push(s.signalType);
        if (s.electrical) parts.push(s.electrical);
        if (s.encoding)   parts.push(s.encoding);
        return parts.join(', ') || s.electrical || '(properties)';
    }

    /** Append one Requirement per eligible signal. Subject is the owning
     *  controller (a real declared element, never an orphan); falls back to
     *  the parent interface, then "the HSI". Idempotent. */
    generate() {
        let added = 0;
        this._eligible().forEach(s => {
            const element = s.elementId ? this.doc.elements.find(e => e.id === s.elementId) : null;
            const iface = (this.doc.interfaces || []).find(i => i.id === s.interfaceId);
            const subject = element ? (element.name || element.id)
                          : iface   ? (iface.name || iface.id)
                          : 'the HSI';
            const r = new Requirement({
                chapterId: 'ch09_hsi',
                conditional: 'ubiquitous',
                subject: subject,
                predicate: 'interface',
                signalName: s.name,
                pin: s.pin,
                signalProperties: this._propsOf(s),
                signalConsumer: element ? (element.name || element.id) : '',
                signalTiming: s.period || '',
                signalFailure: s.failureBehavior || '',
                rationale: `Generated from HSI signal ${s.id} (${s.name})`
                    + (iface ? `, on interface ${iface.name || iface.id}` : '')
                    + (element ? `, terminating on ${element.name || element.id}` : '') + '.',
                verification: ['inspection'],
                asil: 'QM'
            });
            r.id = this.doc.nextId('requirement');
            r.modifiedAt = new Date().toISOString();
            r.smart = { specific: true, measurable: true, achievable: true, relevant: true, timebound: true };
            this.doc.requirements.push(r);
            added++;
        });
        return added;
    }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        this._renderBody(wrap);
        container.appendChild(wrap);
    }

    /** Body render, separated so the ⟳ Refresh button can re-read the
     *  catalog/mapping state above WITHOUT relying on the editor's event
     *  chain (v1.6.3 — the summary went stale when upstream edits did
     *  not propagate a re-render). The doc object is shared and mutated
     *  in place by the tables above, so a re-read is always current. */
    _renderBody(wrap) {
        wrap.innerHTML = `<div class="section-title">Generate Interface Requirements
            <span class="help-icon" title="One click: each fully-specified signal (name + pin + electrical) becomes an 'interface'-predicate requirement whose subject is the controller it terminates on. Re-clicking is safe — already-generated signals are skipped.">?</span>
            <button class="btn-add" style="margin-left:auto;font-size:11px;" title="Re-read the signal catalog and mapping above and recompute what can be generated.">⟳ Refresh</button>
        </div>`;
        wrap.querySelector('.section-title button').addEventListener('click',
            () => this._renderBody(wrap));

        const sigs = this.doc.hsiSignals || [];
        const eligible = this._eligible();
        const alreadyGenerated = this.doc.requirements.filter(r =>
            r.chapterId === 'ch09_hsi' && r.predicate === 'interface').length;
        const incomplete = sigs.length - eligible.length - alreadyGenerated;

        const summary = document.createElement('div');
        summary.className = 'empty-state';
        summary.innerHTML = `${sigs.length} signal(s), ${alreadyGenerated} already generated, ` +
            `<strong>${eligible.length}</strong> ready` +
            (incomplete > 0 ? `, ${incomplete} incomplete` : '') + '.';
        wrap.appendChild(summary);

        // Name each incomplete signal and the EXACT fields it misses,
        // with where to set them — "incomplete" must never be a mystery.
        const missRows = sigs
            .map(s => ({ s, miss: this._missingOf(s) }))
            .filter(x => x.miss.length);
        if (missRows.length) {
            const ul = document.createElement('ul');
            ul.className = 'summary-list';
            missRows.slice(0, 6).forEach(({ s, miss }) => {
                const li = document.createElement('li');
                li.className = 'warn';
                li.textContent = `${s.name || s.id || '(unnamed signal)'} — missing ${miss.join(', ')}`;
                ul.appendChild(li);
            });
            if (missRows.length > 6) {
                const li = document.createElement('li');
                li.className = 'warn';
                li.textContent = `… and ${missRows.length - 6} more.`;
                ul.appendChild(li);
            }
            wrap.appendChild(ul);
        }

        const btn = document.createElement('button');
        btn.className = 'btn-add btn-generate';
        btn.textContent = `Generate ${eligible.length} requirement(s)`;
        btn.disabled = eligible.length === 0;
        wrap.appendChild(btn);

        const status = document.createElement('div');
        wrap.appendChild(status);

        btn.addEventListener('click', () => {
            const n = this.generate();
            setTimeout(() => this.onChange(), 0);
            if (n === 0) {
                status.className = 'validation-warn';
                status.textContent = 'Nothing to do — every complete signal is already in the requirements list below.';
            } else {
                status.className = 'validation-ok';
                status.textContent = `Added ${n} interface requirement(s) — see the list below.`;
            }
        });
    }
}


// =============================================================================
// Chapter registration
// =============================================================================

Chapters.register('system', {
    id: 'ch09_hsi',
    number: '6',
    title: 'Hardware-Software Interface',
    order: 100,
    intro: 'Map each signal to the external interface it belongs to (declared in System Breakdown) and the controller (MCU) it terminates on. If the system has more than one controller, a second section appears for internal links between them (MCU1 — interface — signal — interface — MCU2). Signal properties are defined in the catalog table; the Generate button turns complete signals into interface requirements whose subject is the owning controller.',
    allowsRequirements: true,
    subjectMode: 'none',
    declarations: ['hsiSignal'],
    extraWidgets: (doc, onChange) => [
        new ExternalInterfaceMapping(doc, onChange),
        new InternalMapping(doc, onChange),
        new HsiRequirementGenerator(doc, onChange)
    ],
    checklist: [
        { id: 'c9a', text: 'Every signal has a pin / connector / bus address.',
          help: 'Set in the HSI Signal Catalog (Pin/Addr) or its ▸ detail.' },
        { id: 'c9b', text: 'Every signal has an electrical description (level, range).',
          help: 'In the ▸ detail of each catalog row. Needed before a signal can be generated into a requirement.' },
        { id: 'c9c', text: 'Every signal has an encoding / resolution.',
          help: 'Data type, scaling, active level — in the ▸ detail.' },
        { id: 'c9d', text: 'Every signal has a defined failure behaviour.',
          help: 'What the receiver does on loss or corruption — in the ▸ detail.' },
        { id: 'c9e', text: 'Every signal is mapped to an external interface and a controller.',
          help: 'External Interface Mapping — interface — signal — controller. Rows show "mapped" once both are set.' },
        { id: 'c9f', text: 'Every safety-relevant signal has a diagnostic / monitoring method.',
          help: 'Range check, rolling counter, CRC, timeout. "none" is valid only for non-safety signals.' },
        { id: 'c9g', text: 'For multi-controller systems, inter-controller links are captured in Internal Mapping.',
          help: 'Shown only when there is more than one controller: MCU1 — interface — signal — interface — MCU2.' },
        { id: 'c9h', text: 'Interface requirements generated (or authored) for every signal.',
          help: 'Use "Generate Interface Requirements", or author by hand with the builder.' }
    ]
});
