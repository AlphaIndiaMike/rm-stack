/**
 * disciplines/item.js
 *
 * Registers the Item-level discipline. Standards reference: ISO 26262-3
 * (Concept phase: Item Definition, HARA, Functional Safety Concept).
 *
 * The Item discipline is a smaller view of the same SyrsDocument, focused
 * on the customer-facing concept layer: what the item is, what hazards
 * it introduces, what Safety Goals constrain it, and what Functional
 * Safety Concept addresses each goal. It deliberately leaves out the
 * System-level breakdown / allocation / HW / SW chapters because those
 * are downstream of the Item.
 *
 * Chapters that share content with the System discipline (Item Definition,
 * Safety Goals, FSC) reuse the same chapter IDs so the data is shared —
 * editing the Safety Goals in Item view shows up in System view too.
 */

Disciplines.register({
    id: 'item',
    label: 'Item',
    shortLabel: 'Item',
    order: 1,
    enabled: true,
    docTitle: 'Item Definition & Functional Safety Concept',
    description: 'Item-level definition + HARA + Functional Safety Concept per ISO 26262-3. Foundation for the System / HW / SW work products.'
});
