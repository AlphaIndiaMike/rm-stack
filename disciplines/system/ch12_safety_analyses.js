/**
 * disciplines/system/ch12_safety_analyses.js
 *
 * System Chapter 4 (display) — Safety Analyses Summary. References to
 * external FMEA / FTA / DFA documents plus a summary of top findings.
 * No declarations on this chapter (the Hardware discipline owns the
 * detailed FMEA / FMEDA via declarations/failureMode.js).
 */

Chapters.register('system', {
    id: 'ch12_safety_analyses',
    number: '4',
    title: 'Safety Analyses Summary',
    order: 130,
    intro: 'FMEA, FTA, DFA summaries with links to full analyses.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'c12a', text: 'System FMEA referenced with version; summary of top failure modes present.',
          help: 'Reference the system-level FMEA document; list top failure modes by severity / occurrence / detection.' },
        { id: 'c12b', text: 'FTA top events listed; every top event traces to a Safety Goal.',
          help: 'Each top event of the fault tree must map to a Safety Goal in Ch. 2.' },
        { id: 'c12c', text: 'DFA performed; common-cause and cascading findings listed.',
          help: 'ISO 26262-9. Common-cause failures, cascading failures, resulting freedom-from-interference requirements.' },
        { id: 'c12d', text: 'Every single-point fault has a linked safety mechanism requirement.',
          help: 'Forbidden for ASIL B+. Each must be addressed by an FSR / TSR.' },
        { id: 'c12e', text: 'Every latent fault has mechanism or justified acceptance.',
          help: 'A latent fault needs a detection mechanism with adequate DC, or explicit justified acceptance.' },
        { id: 'c12f', text: 'Residual risk argument present for ASIL C/D.',
          help: 'Quantitative argument required: PMHF below ASIL target (1e-7/h for C, 1e-8/h for D).' }
    ]
});
