/**
 * disciplines/item/assumptions.js
 *
 * Item Chapter 6 — Assumptions, SEooC Conditions. REUSES chapter id
 * 'ch17_assumptions' so the same store and checklist surface in System
 * and Item views.
 */

Chapters.register('item', {
    id: 'ch17_assumptions',
    number: '6',
    title: 'Assumptions and SEooC Conditions',
    order: 60,
    intro: 'Operating-context assumptions the item depends on but does not enforce. Each must be owned, tracked, and closed.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'ia1', text: 'Every AoU has owner and closure target.' },
        { id: 'ia2', text: 'Open points migrated to AoUs with status=open.' },
        { id: 'ia3', text: 'SEooC integration assumptions explicit (or N/A).' },
        { id: 'ia4', text: 'No open AoU blocks signoff without explicit waiver.' }
    ]
});
