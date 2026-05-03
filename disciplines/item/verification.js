/**
 * disciplines/item/verification.js
 *
 * Item Chapter 5 — Verification of the Functional Safety Concept.
 * Per ISO 26262-3:7.4.4. Confirmation that the FSC realises every
 * Safety Goal, that warning / degradation strategies are adequate,
 * and that AoUs cover the gap between item behaviour and operating
 * context.
 */

Chapters.register('item', {
    id: 'item_verification',
    number: '5',
    title: 'Verification of the FSC',
    order: 50,
    intro: 'Reviews and analyses confirming the Functional Safety Concept is complete and consistent.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'iv1', text: 'FSC review record present (date, attendees, findings, status).' },
        { id: 'iv2', text: 'Every FSR cross-checked against its parent SG.' },
        { id: 'iv3', text: 'Independence appropriate to ASIL (per ISO 26262-2:6).' },
        { id: 'iv4', text: 'AoU completeness reviewed: end-user supervision, environment, neighbours.' },
        { id: 'iv5', text: 'Open points have closure targets and owners.' }
    ]
});
