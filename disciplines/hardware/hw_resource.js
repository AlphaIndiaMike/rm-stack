/**
 * disciplines/hardware/hw_resource.js
 *
 * HW Chapter 6 — HW Resource, Environmental & Derating Requirements.
 * ISO 26262-5:6, ASPICE HWE.1. The operating-envelope, derating and
 * EMC obligations stated as requirements (targets the design must
 * meet), inheriting the System environmental envelope. Not measured
 * test results.
 */

Chapters.register('hardware', {
    id: 'hw_resource',
    number: '6',
    title: 'HW Resource, Environmental & Derating Requirements',
    order: 60,
    intro: 'Operating envelope, derating and EMC obligations stated as requirements: voltage/current/temperature ranges, derating margins, EMC class. Targets, not measured results. Inherits the System environmental envelope.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 60 },
    checklist: [
        { id: 'hwr1', text: 'Operating envelope (voltage, current, temperature) stated as requirements.' },
        { id: 'hwr2', text: 'Derating policy stated as requirements (voltage/current/power/temperature margins).' },
        { id: 'hwr3', text: 'EMC / ESD class stated as requirements where safety-relevant.' },
        { id: 'hwr4', text: 'Envelope consistent with the System environmental envelope (System Ch.11).' },
        { id: 'hwr5', text: 'Each environmental requirement derives from a System TSR (Parent System TSR(s)).' }
    ]
});
