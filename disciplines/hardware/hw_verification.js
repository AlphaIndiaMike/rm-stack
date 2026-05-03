/**
 * disciplines/hardware/hw_verification.js
 *
 * HW Chapter 7 — HW Verification. Per ISO 26262-5:9 + 5:10.
 */

Chapters.register('hardware', {
    id: 'hw_verification',
    number: '7',
    title: 'HW Verification',
    order: 70,
    intro: 'Verification activities — review, analysis, fault injection, environmental and EMC test.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'hv1', text: 'Verification plan referenced.' },
        { id: 'hv2', text: 'Method matrix per HW-SR (review / analysis / fault injection / test / simulation).' },
        { id: 'hv3', text: 'Fault-injection coverage adequate to the DC claims.' },
        { id: 'hv4', text: 'Environmental tests (per Ch. 14) executed and reported.' },
        { id: 'hv5', text: 'Independence per ASIL satisfied.' }
    ]
});
