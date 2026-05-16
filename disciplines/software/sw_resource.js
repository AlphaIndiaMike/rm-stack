/**
 * disciplines/software/sw_resource.js
 *
 * SW Chapter 6 — SW Performance, Timing & Resource Requirements. The
 * non-functional content domain: response time, throughput, period,
 * memory/stack/CPU budgets. Applies to safety AND non-safety functions
 * (performance is a non-safety quality too). Targets/constraints, not
 * measured results. ASPICE SWE.1 BP1 (non-functional), ISO 26262-6:6,
 * IEC 61508-3:7.2.
 */

Chapters.register('software', {
    id: 'sw_resource',
    number: '6',
    title: 'SW Performance, Timing & Resource Requirements',
    order: 60,
    intro: 'Worst-case response time, throughput, period/activation rate, memory/stack/CPU budgets — stated as requirements (targets, not measurements). Applies to safety and non-safety functions alike.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 70 },
    checklist: [
        { id: 'swr1', text: 'Every time-critical function (safety or performance) has a worst-case response-time requirement.' },
        { id: 'swr2', text: 'Period / activation rate stated for every periodic function.' },
        { id: 'swr3', text: 'Memory, stack and CPU-load budgets stated as requirements where relevant.' },
        { id: 'swr4', text: 'For safety-classified timing: consistent with the parent\'s FTTI, integrity inherited.' },
        { id: 'swr5', text: 'Each requirement traces to a System parent.' }
    ]
});
