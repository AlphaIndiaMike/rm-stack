/**
 * disciplines/hardware/hw_safety_analyses.js
 *
 * HW Chapter 5 — HW Safety Analyses. FMEA + FMEDA via the failureMode
 * declaration kind (per declarations/failureMode.js). Per ISO 26262-5:8
 * + Annex F. Plus a placeholder for SPFM / LFM / PMHF computed metrics
 * — the math is not yet in the validator and will land in a future
 * chapter rebuild.
 */

Chapters.register('hardware', {
    id: 'hw_safety_analyses',
    number: '5',
    title: 'HW Safety Analyses (FMEA / FMEDA)',
    order: 50,
    intro: 'Failure-mode analysis per HW component. SPFM / LFM / PMHF metrics derived from the table below.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['failureMode'],
    checklist: [
        { id: 'hsa1', text: 'Every HW component has at least one failure mode classified.' },
        { id: 'hsa2', text: 'Failure rates (λ) cited from a recognised source (datasheet / SN29500 / IEC 62380).' },
        { id: 'hsa3', text: 'DC values per failure mode justified (analysis, fault-injection, datasheet claim).' },
        { id: 'hsa4', text: 'SPFM ≥ target per ASIL (≥97% for D, ≥90% for C).',
          help: 'Computation not automated yet — verify externally for now.' },
        { id: 'hsa5', text: 'LFM ≥ target per ASIL (≥80% for D, ≥60% for C).' },
        { id: 'hsa6', text: 'PMHF ≤ target per ASIL (1e-8/h for D, 1e-7/h for C).' },
        { id: 'hsa7', text: 'Dependent failure analysis (DFA) findings cross-referenced.' }
    ]
});
