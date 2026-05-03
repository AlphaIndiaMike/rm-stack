/**
 * disciplines/system/ch08_allocation.js
 *
 * System Chapter 3 (display, but order 90 in the document) — HW/SW
 * Allocation. Shows the cross-reference matrix of upstream requirements
 * (FSR, acceptance, element) to declared elements. Tick a cell to mark
 * a requirement as allocated to an element. Storage is on
 * Requirement.allocation (array of element IDs).
 *
 * The same widget class is reused by Chapter 10 (HW), Chapter 11 (SW),
 * and Chapter 13 (Calibration). Each registers it via extraWidgets,
 * passing the chapterId so the matrix can exclude that chapter's own
 * requirements from the rows (the matrix is for allocating *upstream*
 * requirements down into HW/SW).
 */

class AllocationMatrixWidget {

    /** @param {SyrsDocument} doc
     *  @param {function} onChange
     *  @param {string} chapterId  the chapter the matrix lives on (so
     *                             that chapter's own reqs are excluded
     *                             from the rows)
     *  @param {string} title      shown above the matrix
     */
    constructor(doc, onChange, chapterId, title) {
        this.doc       = doc;
        this.onChange  = onChange || (() => {});
        this.chapterId = chapterId;
        this.title     = title || 'Allocation Matrix';
    }

    setDocument(doc) { this.doc = doc; }

    render(container) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';
        wrap.innerHTML = `<div class="section-title">${this.title}
            <span class="help-icon" title="Allocate existing FSR / acceptance / element requirements to elements. Tick a cell to mark the requirement as allocated to that element. Storage: Requirement.allocation array of element IDs.">?</span>
        </div>`;

        const elements = this.doc.elements || [];
        if (elements.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No elements declared yet — add them in Chapter 5 (System Breakdown).';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        // Source rows: requirements that are *not* in this chapter (the
        // matrix is for allocating *upstream* requirements).
        const rows = this.doc.requirements.filter(r => r.chapterId !== this.chapterId);
        if (rows.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No upstream requirements yet — author them in Ch. 3 (FSC), Ch. 4 (Acceptance) or Ch. 6 (Element) first.';
            wrap.appendChild(empty);
            container.appendChild(wrap);
            return;
        }

        const cols  = `260px ${elements.map(()=>'80px').join(' ')}`;
        const table = document.createElement('div');
        table.style.cssText = 'border:1px solid #dee2e6;border-radius:4px;overflow:auto;max-height:500px;';

        const head = document.createElement('div');
        head.style.cssText = `display:grid;grid-template-columns:${cols};background:#f8f9fa;border-bottom:1px solid #dee2e6;position:sticky;top:0;`;
        head.innerHTML = `<div style="padding:6px 10px;font-size:11px;text-transform:uppercase;font-weight:600;color:#666;">Requirement</div>` +
            elements.map(e => `<div style="padding:6px 4px;font-size:11px;font-weight:600;color:#666;text-align:center;writing-mode:vertical-rl;transform:rotate(180deg);height:80px;" title="${(e.purpose||'').replace(/"/g,'&quot;')}">${e.name||e.id} <small style="font-weight:400;">(${e.asil||'QM'})</small></div>`).join('');
        table.appendChild(head);

        rows.forEach(req => {
            const row = document.createElement('div');
            row.style.cssText = `display:grid;grid-template-columns:${cols};border-bottom:1px solid #f0f0f0;`;
            const stmt = (req.statement || '').slice(0, 80) || '(incomplete)';
            row.innerHTML = `<div style="padding:6px 10px;font-size:12px;"><div style="font-family:monospace;font-size:10px;color:#666;">${req.id}</div><div title="${stmt.replace(/"/g,'&quot;')}" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${stmt}</div></div>` +
                elements.map(e => {
                    const allocated = (req.allocation || []).includes(e.id);
                    return `<div style="padding:6px 4px;text-align:center;border-left:1px solid #f0f0f0;"><input type="checkbox" data-alloc="${e.id}" ${allocated?'checked':''}></div>`;
                }).join('');
            row.querySelectorAll('input[data-alloc]').forEach(cb => {
                cb.addEventListener('change', () => {
                    const elemId = cb.getAttribute('data-alloc');
                    if (cb.checked) {
                        if (!Array.isArray(req.allocation)) req.allocation = [];
                        if (!req.allocation.includes(elemId)) req.allocation.push(elemId);
                    } else {
                        req.allocation = (req.allocation || []).filter(x => x !== elemId);
                    }
                    this.onChange();
                });
            });
            table.appendChild(row);
        });

        wrap.appendChild(table);
        container.appendChild(wrap);
    }
}


Chapters.register('system', {
    id: 'ch08_allocation',
    number: '3',
    title: 'HW/SW Allocation',
    order: 90,
    intro: 'Each Chapter 6 requirement allocated to HW, SW, or both.',
    allowsRequirements: false,
    subjectMode: 'none',
    extraWidgets: (doc, onChange) => [
        new AllocationMatrixWidget(doc, onChange, 'ch08_allocation', 'HW/SW Allocation Matrix')
    ],
    checklist: [
        { id: 'c8a', text: 'Every Chapter 6 requirement has HW/SW allocation.' },
        { id: 'c8b', text: 'Allocation rationale based on fault origin, not medium.',
          help: 'A safety mechanism for an HW random fault is HW-allocated even if implemented in SW. Document the rationale per ISO 26262-4:7.' },
        { id: 'c8c', text: 'ASIL decomposition independence argument present (memory, timing, information).',
          help: 'When decomposing across HW/SW, three independence dimensions must be argued.' },
        { id: 'c8d', text: 'Shared resources identified with arbitration approach.',
          help: 'CPU, memory bandwidth, network, sensors — any shared resource between mixed-ASIL functions needs an arbitration approach and an FFI argument.' }
    ]
});
