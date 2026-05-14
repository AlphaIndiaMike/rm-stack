/**
 * disciplines/hardware/hw_safety_reqs.js
 *
 * HW Chapter 2 — HW Safety Requirements. REUSES chapter id 'ch10_hw'
 * from the System discipline, so HW-SRs written here are the same
 * requirements visible in the System view's HW Safety Requirements
 * chapter. ASPICE HWE.1, ISO 26262-5:6.
 *
 * NOTE on allocation: the old allocation matrix was removed — it tried
 * to do per-element allocation before the project was ready for it.
 * Record the upstream trace with each HW-SR's Parent FSR(s) attribute;
 * per-element allocation will return as a proper requirement attribute
 * later.
 */

Chapters.register('hardware', {
    id: 'ch10_hw',
    number: '2',
    title: 'HW Safety Requirements',
    order: 20,
    intro: 'Detailed HW safety requirements with DC targets, parent TSR refs, fault model coverage. Per ISO 26262-5:6 + ASPICE HWE.1.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 80 },
    checklist: [
        { id: 'hsr1', text: 'Every HW-SR has a DC target appropriate to its fault model.',
          help: 'Per ISO 26262-5:8 — typically 60% / 90% / 99% depending on ASIL and whether the fault is single-point, residual, or latent.' },
        { id: 'hsr2', text: 'Every HW-SR traces to a parent TSR (Chapter 6 element req).' },
        { id: 'hsr3', text: 'Architectural metrics targets stated (SPFM, LFM, PMHF) per ASIL.' },
        { id: 'hsr4', text: 'Operating conditions inherited from environmental envelope.' },
        { id: 'hsr5', text: 'Reference to detailed HW analyses (FMEDA, dependent failure analysis).' }
    ]
});
