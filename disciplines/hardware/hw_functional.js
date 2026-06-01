/**
 * disciplines/hardware/hw_functional.js
 *
 * HW Chapter 3 — HW Functional & Behavioural Requirements. ASPICE
 * HWE.1, ISO 26262-5:6, IEC 61508-2:7.2. What the hardware does;
 * safety and non-safety together, integrity as the ASIL/SIL attribute.
 * Carries the lightweight 'hwComponent' declaration only to name
 * subjects. Not an architecture editor (no schematic/BOM/FIT).
 */

Chapters.register('hardware', {
    id: 'hw_functional',
    number: '3',
    title: 'HW Functional & Behavioural Requirements',
    order: 30,
    intro: 'What the hardware does: nominal functions, operating states/transitions, and — for safety-classified parents — fault-reaction behaviour. Each derives from a System acceptance or TSR requirement; safety integrity inherited unchanged.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 140 },
    declarations: ['hwComponent'],
    checklist: [
        { id: 'hwf1', text: 'Every System requirement with a functional HW portion has its behaviour specified (safety and non-safety).' },
        { id: 'hwf2', text: 'Operating states and transitions specified (power-up, shutdown, reset).' },
        { id: 'hwf3', text: 'For safety-classified requirements: fault-reaction / safe-state behaviour specified.' },
        { id: 'hwf4', text: 'Each requirement traces to a System parent and (if safety) carries the parent ASIL/SIL unchanged.' },
        { id: 'hwf5', text: 'Subject is a declared HW component or "the hardware" — not a schematic net (detailed design).' }
    ]
});
