/**
 * disciplines/hardware/hw_assumptions.js
 *
 * HW Chapter 7 — HW Assumptions and Open Points. REUSES chapter id
 * 'ch17_assumptions' so the assumptions store and checklist surface in
 * the System, Item, SW and HW views alike.
 */

Chapters.register('hardware', {
    id: 'ch17_assumptions',
    number: '7',
    title: 'HW Assumptions and Open Points',
    order: 70,
    intro: 'Assumptions the HW requirements depend on but do not enforce — supply quality, EMI environment, neighbouring elements, SEooC integration. Each owned, tracked, closed.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'ha1', text: 'Assumptions on supply voltage / current / EMI environment captured with owner.' },
        { id: 'ha2', text: 'Assumptions on neighbouring HW elements (heat, EMI, mechanical) captured.' },
        { id: 'ha3', text: 'SEooC integration assumptions explicit (or N/A).' },
        { id: 'ha4', text: 'No open assumption blocks signoff without an explicit waiver.' }
    ]
});
