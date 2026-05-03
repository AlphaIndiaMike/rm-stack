/**
 * disciplines/item/front_matter.js
 *
 * Item Chapter 1 — Front Matter. Same governance content as the System
 * front matter; uses a different chapter id so the checklist state is
 * scoped to Item-discipline signoff.
 */

Chapters.register('item', {
    id: 'item_front_matter',
    number: '1',
    title: 'Item Document Front Matter',
    order: 10,
    intro: 'Document class, scope, applicable standards, signoff roles for the Item Definition document.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'ifm1', text: 'Item name and scope declared.' },
        { id: 'ifm2', text: 'Applicable standards listed (ISO 26262-3 + tailoring).' },
        { id: 'ifm3', text: 'Signoff roles for Item document declared.' },
        { id: 'ifm4', text: 'Baseline / change history referenced.' }
    ]
});
