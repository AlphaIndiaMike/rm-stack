/**
 * disciplines/item/ch02_item.js
 *
 * Item Chapter 2 — Item Definition. REUSES chapter id 'ch02_item' from
 * the System discipline. Both registrations point at the same stored
 * data: doc.itemFunctions, doc.modes, doc.assumptions. Editing here is
 * editing there. This is the core of "one JSON, four views".
 *
 * The number / order may differ between disciplines because each
 * discipline has its own outline.
 */

Chapters.register('item', {
    id: 'ch02_item',
    number: '2',
    title: 'Item Definition',
    order: 20,
    intro: 'Item functions, operating modes, environmental envelope, boundaries, assumptions of use. Per ISO 26262-3:5.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['itemFunction', 'mode', 'assumption'],
    checklist: [
        { id: 'i2c', text: 'Boundary defined as enumerated interfaces (cross-ref System Ch. 5).',
          help: 'External Interfaces table is owned by the System discipline.' },
        { id: 'i2d', text: 'Environmental envelope quantified (numbers with units).' },
        { id: 'i2e', text: 'Item dependencies on external systems listed.' },
        { id: 'i2f', text: 'Assumptions of use enumerated with owners and closure targets.' }
    ]
});
