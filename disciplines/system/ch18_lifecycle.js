/**
 * disciplines/system/ch18_lifecycle.js
 *
 * System Chapter 15 (display) — Production, Operation, Service,
 * Decommissioning. Field behavior constraints from Part 7.
 */

Chapters.register('system', {
    id: 'ch18_lifecycle',
    number: '15',
    title: 'Production, Operation, Service, Decommissioning',
    order: 190,
    intro: 'Field behavior constraints from Part 7.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 0, max: 15 },
    checklist: [
        { id: 'c18a', text: 'End-of-line test requirements or reference to production test spec.',
          help: 'Manufacturing tests confirming safety-relevant features after assembly.' },
        { id: 'c18b', text: 'Field service constraints stated.',
          help: 'Required tooling, calibration data integrity after replacement, mandatory re-tests.' },
        { id: 'c18c', text: 'OTA/update requirements present or explicit N/A.',
          help: 'Prerequisites, rollback strategy, integrity verification, behaviour during interruption.' },
        { id: 'c18d', text: 'Decommissioning requirements present or explicit N/A.',
          help: 'Data wipe, safe HV disposal, deactivation of paired safety elements.' }
    ]
});
