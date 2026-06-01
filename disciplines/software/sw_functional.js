/**
 * disciplines/software/sw_functional.js
 *
 * SW Chapter 3 — SW Functional & Behavioural Requirements. ASPICE
 * SWE.1, ISO 26262-6:6, IEC 61508-3:7.2. What the software does:
 * nominal functions, operating modes and mode transitions, and (for
 * safety-classified parents) safe-state and degradation behaviour.
 * Safety and non-safety requirements sit together — integrity is the
 * ASIL/SIL attribute, not a chapter division.
 *
 * Carries the lightweight 'swUnit' declaration only so a requirement
 * can name a unit as its subject. Not an architecture editor.
 */

Chapters.register('software', {
    id: 'sw_functional',
    number: '3',
    title: 'SW Functional & Behavioural Requirements',
    order: 30,
    intro: 'What the software does: nominal functions, operating modes and transitions, and — for safety-classified parents — safe-state and degradation behaviour. Each derives from a System acceptance or TSR requirement; safety integrity is inherited unchanged.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 140 },
    declarations: ['swUnit'],
    checklist: [
        { id: 'swf1', text: 'Every System requirement with a functional SW portion has its behaviour specified here (safety and non-safety).' },
        { id: 'swf2', text: 'Operating modes and every mode transition specified, including power-up / shutdown.' },
        { id: 'swf3', text: 'For safety-classified requirements: safe-state behaviour and degradation/limp-home specified.',
          help: 'Applies to requirements whose System parent carries an ASIL/SIL.' },
        { id: 'swf4', text: 'Each requirement traces to a System parent and (if safety) carries the parent\'s ASIL/SIL unchanged.',
          help: 'No decomposition at this hop — the Inputs coverage flags integrity gaps.' },
        { id: 'swf5', text: 'Subject is a declared SW unit or "the software" — not an internal data structure (that is detailed design).' }
    ]
});
