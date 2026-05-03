/**
 * disciplines/item/hara.js
 *
 * Item Chapter 3 — HARA. Item-discipline-specific chapter capturing
 * the Hazard Analysis and Risk Assessment summary. Per ISO 26262-3:6.
 *
 * The full HARA spreadsheet lives outside this tool; this chapter is
 * the project-internal summary + Safety Goal derivation. Safety Goals
 * declared here are the same store as System's Ch. 2 (declarations:
 * safetyGoal — same id as the System version, intentionally shared).
 *
 * NOTE on operational scenarios: ISO 26262-3 also expects operational
 * scenarios listed (situations the item operates in for risk assessment).
 * For now they live as free-form prose in the HARA upstream document;
 * future enhancement could add an 'operationalScenario' declaration kind
 * with a structured table.
 */

Chapters.register('item', {
    id: 'item_hara',
    number: '3',
    title: 'HARA — Hazard Analysis and Risk Assessment',
    order: 30,
    intro: 'Hazardous events identified and rated (S, E, C → ASIL). Each row should map to one Safety Goal.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['safetyGoal', 'safeState'],
    checklist: [
        { id: 'h1', text: 'HARA document referenced (ID + version).' },
        { id: 'h2', text: 'Every hazardous event has S, E, C ratings and resulting ASIL.' },
        { id: 'h3', text: 'Every Safety Goal traces to ≥1 hazardous event.' },
        { id: 'h4', text: 'Safe states declared for each Safety Goal that requires one.' },
        { id: 'h5', text: 'FTTI declared per Safety Goal (numeric value with unit).' },
        { id: 'h6', text: 'ASIL decomposition decisions (if any) documented with independence argument.' },
        { id: 'h7', text: 'HARA reviewed and signed off by the safety manager.' }
    ]
});
