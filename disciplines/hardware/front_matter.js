/**
 * disciplines/hardware/front_matter.js
 *
 * HW Chapter 1 — Front Matter for the HW Requirements Specification.
 *
 * Scope: ASPICE HWE.1 (hardware requirements) and ISO 26262-5:6 HW
 * safety requirements. It deliberately does NOT cover HW architecture
 * / detailed design (HWE.2, schematics, BOM), FMEDA / quantitative
 * safety analyses (ISO 26262-5:8), or HW verification (5:9-10) —
 * those are produced in CAD, reliability and test tools.
 */

Chapters.register('hardware', {
    id: 'hw_front_matter',
    number: '1',
    title: 'HW Document Front Matter',
    order: 10,
    intro: 'Document scope, applicable standards (ISO 26262-5:6, ASPICE HWE.1), signoff. Scope boundary: requirements only — architecture, schematic detailed design, FMEDA and verification are out of scope and produced in their own tools.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'hfm1', text: 'HW requirements document scope declared.' },
        { id: 'hfm2', text: 'ISO 26262-5:6 + ASPICE HWE.1 referenced as the governing clauses.' },
        { id: 'hfm3', text: 'Scope boundary explicit: HW architecture/detailed design (HWE.2), FMEDA (5:8), verification (5:9-10) are produced outside this tool.',
          help: 'This document stops at HWE.1 requirements plus HW safety requirements with DC targets. Name the external CAD/reliability/test tools so reviewers know where the boundary is.' },
        { id: 'hfm4', text: 'Signoff roles declared (HW lead, safety manager).' }
    ]
});
