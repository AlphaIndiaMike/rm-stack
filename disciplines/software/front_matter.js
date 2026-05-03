/**
 * disciplines/software/front_matter.js
 *
 * SW Chapter 1 — Front Matter for the SW Requirements + Architectural
 * Design + Detailed Design document set. Per ISO 26262-6 + ASPICE
 * SWE.1 / SWE.2 / SWE.3 / SWE.4.
 */

Chapters.register('software', {
    id: 'sw_front_matter',
    number: '1',
    title: 'SW Document Front Matter',
    order: 10,
    intro: 'Document scope, applicable standards (ISO 26262-6, ASPICE SWE), tailoring, signoff roles.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'sfm1', text: 'SW document scope declared.' },
        { id: 'sfm2', text: 'ISO 26262-6 + ASPICE SWE.x clauses referenced.' },
        { id: 'sfm3', text: 'Coding standard cited (MISRA-C / AUTOSAR C++ / equivalent).' },
        { id: 'sfm4', text: 'Toolchain qualification status documented (TCL, qualification report).' },
        { id: 'sfm5', text: 'Signoff roles declared.' }
    ]
});
