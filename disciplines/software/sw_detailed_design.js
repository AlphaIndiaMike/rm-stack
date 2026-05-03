/**
 * disciplines/software/sw_detailed_design.js
 *
 * SW Chapter 4 — SW Detailed Design + Unit Construction. ASPICE SWE.3,
 * ISO 26262-6:8. Class-level / function-level decisions, control-flow
 * monitors, range checks.
 */

Chapters.register('software', {
    id: 'sw_detailed_design',
    number: '4',
    title: 'SW Detailed Design and Unit Construction',
    order: 40,
    intro: 'Per-unit detailed design: data structures, control flow, defensive coding patterns, internal interfaces.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 80 },
    checklist: [
        { id: 'sdd1', text: 'Detailed design document(s) referenced per SW unit.' },
        { id: 'sdd2', text: 'Defensive coding patterns documented (range checks, plausibility, assertions).' },
        { id: 'sdd3', text: 'Control-flow monitor design captured.' },
        { id: 'sdd4', text: 'Static analysis configuration declared (rule set, severity).' },
        { id: 'sdd5', text: 'Naming conventions and module structure declared.' },
        { id: 'sdd6', text: 'Reused / qualified components listed with qualification evidence.' }
    ]
});
