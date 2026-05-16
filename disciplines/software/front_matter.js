/**
 * disciplines/software/front_matter.js
 *
 * SW Chapter 1 — Front Matter for the SW Requirements Specification.
 *
 * Scope: full software requirements engineering — ASPICE SWE.1,
 * ISO 26262-6:6, IEC 61508-3:7.2. SAFETY AND NON-SAFETY requirements
 * together. Per ASPICE 4.0 "functional / non-functional" and
 * "safety / non-safety" are NOT structuring criteria: chapters group
 * by requirement content domain; the integrity (ASIL / SIL / QM) is an
 * attribute on each requirement. Out of scope: SW architecture
 * (SWE.2), detailed design (SWE.3), and verification execution
 * (SWE.4/5/6) — produced in their own tools.
 */

Chapters.register('software', {
    id: 'sw_front_matter',
    number: '1',
    title: 'SW Document Front Matter',
    order: 10,
    intro: 'Scope, applicable standards (ISO 26262-6:6, IEC 61508-3:7.2, ASPICE SWE.1), signoff. Covers the complete SW requirement set — safety and non-safety — not a safety-only spec.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'sfm1', text: 'SW requirements document scope declared (the SW portion of the system).' },
        { id: 'sfm2', text: 'Governing clauses referenced: ISO 26262-6:6 and/or IEC 61508-3:7.2, plus ASPICE SWE.1.' },
        { id: 'sfm3', text: 'Both safety and non-safety SW requirements are in scope of this document.',
          help: 'ASPICE SWE.1 is full requirements engineering. Non-safety (QM) requirements are first-class here, not omitted.' },
        { id: 'sfm4', text: 'Scope boundary explicit: SW architecture (SWE.2), detailed design (SWE.3), verification execution (SWE.4-6) are produced outside this tool.' },
        { id: 'sfm5', text: 'Coding / language standard cited (MISRA-C / AUTOSAR C++ / equivalent) as a downstream constraint.' },
        { id: 'sfm6', text: 'Signoff roles declared (SW lead, safety manager).' }
    ]
});
