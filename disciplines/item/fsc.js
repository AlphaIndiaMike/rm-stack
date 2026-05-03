/**
 * disciplines/item/fsc.js
 *
 * Item Chapter 4 — Functional Safety Concept. REUSES chapter id
 * 'ch04_fsc' from the System discipline. FSRs written here appear in
 * the System view's FSC chapter and vice versa. Per ISO 26262-3:7.
 */

Chapters.register('item', {
    id: 'ch04_fsc',
    number: '4',
    title: 'Functional Safety Concept',
    order: 40,
    intro: 'FSRs realising each Safety Goal. Warning, degradation, emergency operation strategies.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 5, max: 30 },
    checklist: [
        { id: 'i4a', text: 'Every Safety Goal has ≥1 FSR.' },
        { id: 'i4b', text: 'Every FSR has parent SG, ASIL, FTTI contribution, safe-state ref.' },
        { id: 'i4c', text: 'Warning concept addressed.' },
        { id: 'i4d', text: 'Degradation concept addressed.' },
        { id: 'i4e', text: 'Emergency operation strategy or explicit N/A.' },
        { id: 'i4f', text: 'End-user supervision assumptions captured (will be lifted into AoUs).' }
    ]
});
