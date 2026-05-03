/**
 * disciplines/software/sw_integration_verif.js
 *
 * SW Chapter 6 — SW Integration and Integration Verification. ASPICE
 * SWE.5, ISO 26262-6:10.
 */

Chapters.register('software', {
    id: 'sw_integration_verif',
    number: '6',
    title: 'SW Integration and Verification',
    order: 60,
    intro: 'Integration of SW units into the SW item; integration test against architectural design.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'siv1', text: 'Integration strategy declared (bottom-up / top-down / sandwich).' },
        { id: 'siv2', text: 'Integration test cases trace to architectural requirements.' },
        { id: 'siv3', text: 'Resource usage measured: stack, heap, CPU, memory.' },
        { id: 'siv4', text: 'Worst-case response time analysis done for safety-relevant tasks.' },
        { id: 'siv5', text: 'Freedom-from-interference verified for mixed-ASIL.' }
    ]
});
