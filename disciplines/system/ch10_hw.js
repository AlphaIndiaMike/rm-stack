/**
 * disciplines/system/ch10_hw.js
 *
 * System Chapter 8 (display) — HW Safety Requirements. Summary layer.
 * Full HW detail lives in the HW-RS document (the Hardware discipline
 * adds richer chapters; this one is the System view).
 *
 * The Hardware discipline registers a chapter with this same id
 * ('ch10_hw'), so requirements with chapterId='ch10_hw' are visible in
 * both views — one JSON, two perspectives.
 *
 * NOTE on allocation: the old allocation matrix was removed — it tried
 * to do per-element allocation before the project was ready for it.
 * Allocation belongs on each requirement (Requirement.allocation
 * already exists as an array of element IDs) and will be surfaced as a
 * proper per-requirement attribute later. For now, author HW-SRs here
 * directly.
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
    checklist: [
        { id: 'c10a', text: 'Every HW-implemented safety mechanism has an HW-SR with DC target.',
          help: 'Diagnostic Coverage (DC) per ISO 26262-5:8 — typically 60% (low), 90% (medium), 99% (high).' },
        { id: 'c10b', text: 'Architectural metrics stated: SPFM, LFM, PMHF per ASIL.',
          help: 'SPFM ≥97% (D)/90% (C); PMHF ≤1e-8/h (D), ≤1e-7/h (C). ISO 26262-5 Annex F.' },
        { id: 'c10c', text: 'Reference to HW development document with version.' },
        { id: 'c10d', text: 'Every HW-SR traces to a parent TSR.',
          help: 'Use the Parent System TSR(s) attribute on each HW-SR to record the trace (ch07 Technical Safety Requirements).' }
    ]
});
