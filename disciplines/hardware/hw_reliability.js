/**
 * disciplines/hardware/hw_reliability.js
 *
 * HW Chapter 7 — HW Reliability & Quality Requirements. The non-safety
 * quality content domain: service life, mission profile, reliability
 * targets, robustness/qualification expectations stated as
 * requirements. ASPICE HWE.1 (non-functional), ISO 26262-5:6.
 * Typically QM but a safety parent's integrity is still inherited if
 * one is referenced.
 */

Chapters.register('hardware', {
    id: 'hw_reliability',
    number: '7',
    title: 'HW Reliability & Quality Requirements',
    order: 70,
    intro: 'Service life, mission profile, reliability targets and qualification/robustness expectations stated as requirements. Mostly non-safety quality, but integrity is inherited when a safety parent is referenced.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 50 },
    checklist: [
        { id: 'hrel1', text: 'Service life / mission profile stated as a requirement.' },
        { id: 'hrel2', text: 'Reliability / availability targets stated where contractually or safety relevant.' },
        { id: 'hrel3', text: 'Qualification / robustness expectations (e.g. AEC-Q-type) stated as requirements.' },
        { id: 'hrel4', text: 'Each requirement traces to a System parent; safety ones inherit the parent ASIL/SIL.' }
    ]
});
