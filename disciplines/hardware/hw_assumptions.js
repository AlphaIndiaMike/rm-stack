/**
 * disciplines/hardware/hw_assumptions.js
 *
 * HW Chapter 8 — Assumptions specific to the HW work product. Same
 * store as the cross-disciplinary assumptions list (ch17_assumptions
 * in System and Item) — REUSES the chapter id so all three views see
 * and edit the same rows.
 */

Chapters.register('hardware', {
    id: 'ch17_assumptions',
    number: '8',
    title: 'HW Assumptions and Open Points',
    order: 80,
    intro: 'Assumptions on operating context, neighbouring elements, supply quality.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'ha1', text: 'AoUs on supply voltage / current / EMI environment captured.' },
        { id: 'ha2', text: 'AoUs on neighbouring HW elements (heat, EMI, mechanical) captured.' },
        { id: 'ha3', text: 'SEooC integration AoUs explicit (or N/A).' }
    ]
});
