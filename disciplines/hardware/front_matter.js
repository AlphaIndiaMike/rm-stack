/**
 * disciplines/hardware/front_matter.js
 *
 * HW Chapter 1 — Front Matter for the HW Requirements Specification.
 * Full hardware requirements engineering — ASPICE HWE.1,
 * ISO 26262-5:6, IEC 61508-2:7.2. Safety and non-safety together;
 * integrity (ASIL/SIL/QM) is an attribute, not a chapter split. Out of
 * scope: HW architecture/detailed design (HWE.2/3), FMEDA computation
 * (ISO 26262-5:8), HW verification execution (HWE.4 / 5:9-10).
 */

Chapters.register('hardware', {
    id: 'hw_front_matter',
    number: '1',
    title: 'HW Document Front Matter',
    order: 10,
    intro: 'Scope, applicable standards (ISO 26262-5:6, IEC 61508-2:7.2, ASPICE HWE.1), signoff. Covers the complete HW requirement set — safety and non-safety.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'hfm1', text: 'HW requirements document scope declared (the HW portion of the system).' },
        { id: 'hfm2', text: 'Governing clauses referenced: ISO 26262-5:6 and/or IEC 61508-2:7.2, plus ASPICE HWE.1.' },
        { id: 'hfm3', text: 'Both safety and non-safety HW requirements are in scope of this document.' },
        { id: 'hfm4', text: 'Scope boundary explicit: HW architecture/detailed design (HWE.2/3), FMEDA (5:8), verification execution (HWE.4) are produced outside this tool.' },
        { id: 'hfm5', text: 'Signoff roles declared (HW lead, safety manager).' }
    ]
});
