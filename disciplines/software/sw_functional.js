/**
 * disciplines/software/sw_functional.js
 *
 * SW Chapter 3 — SW Functional Requirements. ASPICE SWE.1,
 * ISO 26262-6:6. The functional behaviour the software must provide,
 * derived from the System TSRs allocated to SW.
 *
 * Carries the lightweight 'swUnit' declaration ONLY so a requirement
 * can name a unit as its subject ("the BrakeMonitor unit shall ...").
 * This is not an architecture editor — no scheduling, partitioning or
 * interface tables. Subject = a declared SW unit, or any element.
 */

Chapters.register('software', {
    id: 'sw_functional',
    number: '3',
    title: 'SW Functional Requirements',
    order: 30,
    intro: 'Functional behaviour the software must provide. Each requirement derives from one or more System Technical Safety Requirements (Parent System TSR(s)).',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 120 },
    declarations: ['swUnit'],
    checklist: [
        { id: 'swf1', text: 'Every SW functional requirement derives from ≥1 System TSR.',
          help: 'Set Parent System TSR(s) on each requirement. The Inputs chapter flags TSRs with no derived requirement.' },
        { id: 'swf2', text: 'Subject is a declared SW unit or "the software" — never an internal data structure.',
          help: 'Keeps requirements at SWE.1 level, not detailed design.' },
        { id: 'swf3', text: 'Every requirement passes SMART and predicate/EARS checks.' },
        { id: 'swf4', text: 'ASIL inherited from the parent TSR (or QM if the TSR is QM).' },
        { id: 'swf5', text: 'Verification method stated per requirement.' }
    ]
});
