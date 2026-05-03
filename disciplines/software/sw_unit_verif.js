/**
 * disciplines/software/sw_unit_verif.js
 *
 * SW Chapter 5 — SW Unit Verification. ASPICE SWE.4, ISO 26262-6:9.
 * Unit test, static analysis, code review.
 */

Chapters.register('software', {
    id: 'sw_unit_verif',
    number: '5',
    title: 'SW Unit Verification',
    order: 50,
    intro: 'Static analysis, code review, unit test. Coverage targets per ASIL.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'suv1', text: 'Static analysis run with documented rule set; deviations triaged.' },
        { id: 'suv2', text: 'Code review record per unit (independence per ASIL).' },
        { id: 'suv3', text: 'Statement coverage ≥ target per ASIL.',
          help: 'ISO 26262-6:9 — coverage targets scale with ASIL.' },
        { id: 'suv4', text: 'Branch / MC-DC coverage per ASIL where required.' },
        { id: 'suv5', text: 'Boundary value, requirements-based, error-guessing test cases present.' },
        { id: 'suv6', text: 'Test environment documented (host / target / instrumented).' }
    ]
});
