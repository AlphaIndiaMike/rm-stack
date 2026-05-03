/**
 * disciplines/software/sw_safety_reqs.js
 *
 * SW Chapter 2 — SW Safety Requirements. REUSES chapter id 'ch11_sw'
 * from the System discipline. ASPICE SWE.1, ISO 26262-6:6.
 *
 * Surfaces the allocation matrix so SW engineers can see upstream
 * element requirements and the SW-allocated subset.
 */

Chapters.register('software', {
    id: 'ch11_sw',
    number: '2',
    title: 'SW Safety Requirements',
    order: 20,
    intro: 'SW safety requirements with DC targets and parent TSR refs. ASPICE SWE.1, ISO 26262-6:6.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 80 },
    extraWidgets: (doc, onChange) => [
        new AllocationMatrixWidget(doc, onChange, 'ch11_sw', 'SW Allocation Matrix')
    ],
    checklist: [
        { id: 'ssr1', text: 'Every SW-SR has a DC target and fault model.' },
        { id: 'ssr2', text: 'Every SW-SR traces to a parent TSR.' },
        { id: 'ssr3', text: 'SW mechanisms covering HW random faults are tagged (no double-counting).' },
        { id: 'ssr4', text: 'Freedom-from-interference requirements stated for mixed-ASIL SW.' },
        { id: 'ssr5', text: 'Timing constraints (response time, period) per SW-SR where relevant.' }
    ]
});
