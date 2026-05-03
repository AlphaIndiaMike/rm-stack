/**
 * disciplines/system/ch10_hw.js
 *
 * System Chapter 8 (display) — HW Safety Requirements. Summary layer.
 * Full HW detail lives in the HW-RS document (the Hardware discipline
 * adds richer chapters; this one is the System view).
 *
 * Reuses AllocationMatrixWidget to surface upstream requirements that
 * could be HW-allocated. The Hardware discipline registers a chapter
 * with this same id ('ch10_hw') so requirements with chapterId='ch10_hw'
 * are visible in both views — one JSON, two perspectives.
 */

Chapters.register('system', {
    id: 'ch10_hw',
    number: '8',
    title: 'HW Safety Requirements',
    order: 110,
    intro: 'High-level HW-SRs with DC targets. Full detail in HW-RS document.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 40 },
    extraWidgets: (doc, onChange) => [
        new AllocationMatrixWidget(doc, onChange, 'ch10_hw', 'HW Allocation Matrix')
    ],
    checklist: [
        { id: 'c10a', text: 'Every HW-implemented safety mechanism has an HW-SR with DC target.',
          help: 'Diagnostic Coverage (DC) per ISO 26262-5:8 — typically 60% (low), 90% (medium), 99% (high).' },
        { id: 'c10b', text: 'Architectural metrics stated: SPFM, LFM, PMHF per ASIL.',
          help: 'SPFM ≥97% (D)/90% (C); PMHF ≤1e-8/h (D), ≤1e-7/h (C). ISO 26262-5 Annex F.' },
        { id: 'c10c', text: 'Reference to HW development document with version.' },
        { id: 'c10d', text: 'Every HW-SR traces to a parent TSR.',
          help: 'Each HW-SR must allocate from at least one Chapter 6 element requirement via the matrix above.' }
    ]
});
