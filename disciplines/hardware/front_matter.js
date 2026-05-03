/**
 * disciplines/hardware/front_matter.js
 *
 * HW Chapter 1 — Front Matter for the HW Requirements + Architectural
 * Design document. Per ISO 26262-5 + ASPICE HWE.1 / HWE.2.
 */

Chapters.register('hardware', {
    id: 'hw_front_matter',
    number: '1',
    title: 'HW Document Front Matter',
    order: 10,
    intro: 'Document scope, applicable standards (ISO 26262-5, ASPICE HWE), tailoring, signoff roles.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'hfm1', text: 'HW document scope declared.' },
        { id: 'hfm2', text: 'ISO 26262-5 + ASPICE HWE.x clauses referenced.' },
        { id: 'hfm3', text: 'Tailoring decisions justified per clause.' },
        { id: 'hfm4', text: 'Signoff roles declared (HW lead, safety manager).' }
    ]
});
