/**
 * disciplines/software/sw_qualification.js
 *
 * SW Chapter 7 — SW Qualification Testing. ASPICE SWE.6, ISO 26262-6:11.
 * Verification of the integrated SW against the SW requirements.
 */

Chapters.register('software', {
    id: 'sw_qualification',
    number: '7',
    title: 'SW Qualification Testing',
    order: 70,
    intro: 'Verification that integrated SW satisfies its safety requirements (SW-SR level).',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'sqt1', text: 'Test cases trace to SW-SRs.' },
        { id: 'sqt2', text: 'Requirements coverage ≥ target per ASIL.' },
        { id: 'sqt3', text: 'Fault-injection test for safety mechanisms.' },
        { id: 'sqt4', text: 'Test report independent of development per ASIL.' }
    ]
});
