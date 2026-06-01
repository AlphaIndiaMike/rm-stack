/**
 * disciplines/item/fsc.js
 *
 * Item Chapter 4 — Functional Safety Concept (ISO 26262-3:7). This is an
 * ITEM-LEVEL work product and is intentionally NOT surfaced in the System
 * discipline: Part 3 produces the FSC/FSRs at the item level; Part 4
 * (System) refines them into Technical Safety Requirements (ch07). FSRs
 * authored here are still reachable by chapter id, so the System
 * Acceptance and TSR chapters can reference them as parents without FSC
 * appearing in — or counting against — the System discipline.
 */

Chapters.register('item', {
    id: 'ch04_fsc',
    number: '4',
    title: 'Functional Safety Concept',
    order: 40,
    intro: 'Tier-1 / ASPICE SYS.1 layer: FSRs realising each Safety Goal, each allocated to a subject — the system (the item), an external measure, or an assumed driver/operator action (declared in the Safety Actors table below). Warning, degradation and emergency-operation strategies are captured here too. Allocation to preliminary architecture is a design activity and out of scope.',
    allowsRequirements: true,
    subjectMode: 'actor',
    declarations: ['safetyActor'],
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
