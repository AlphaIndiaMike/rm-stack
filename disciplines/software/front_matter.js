/**
 * disciplines/software/front_matter.js
 *
 * SW Chapter 1 — Front Matter for the SW Requirements Specification.
 *
 * Scope: ASPICE SWE.1 (software requirements) plus SWE.2-level
 * *constraints* that legitimately belong on a requirement (resource,
 * timing, partitioning stated as requirements). It deliberately does
 * NOT cover architecture design (SWE.2), detailed design / unit
 * construction (SWE.3) or any verification activity (SWE.4/5/6,
 * ISO 26262-6:9-11) — those are produced in design and test tools.
 */

Chapters.register('software', {
    id: 'sw_front_matter',
    number: '1',
    title: 'SW Document Front Matter',
    order: 10,
    intro: 'Document scope, applicable standards (ISO 26262-6:6, ASPICE SWE.1), coding standard, signoff. Scope boundary: requirements only — architecture, detailed design and test are out of scope and produced in their own tools.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'sfm1', text: 'SW requirements document scope declared.' },
        { id: 'sfm2', text: 'ISO 26262-6:6 + ASPICE SWE.1 referenced as the governing clauses.' },
        { id: 'sfm3', text: 'Coding standard cited (MISRA-C / AUTOSAR C++ / equivalent) as a downstream constraint.' },
        { id: 'sfm4', text: 'Scope boundary explicit: architecture (SWE.2), detailed design (SWE.3), verification (SWE.4-6) are produced outside this tool.',
          help: 'This document stops at SWE.1 requirements plus SWE.2-level constraints expressed as requirements. Name the external design/test tools so reviewers know where the boundary is.' },
        { id: 'sfm5', text: 'Signoff roles declared (SW lead, safety manager).' }
    ]
});
