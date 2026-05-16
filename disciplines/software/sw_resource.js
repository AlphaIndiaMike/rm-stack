/**
 * disciplines/software/sw_resource.js
 *
 * SW Chapter 6 — SW Resource, Timing & Performance Requirements.
 * ISO 26262-6:6/7 properties, ASPICE SWE.1 (the SWE.2-level resource
 * and timing *constraints* that legitimately belong on a requirement).
 *
 * These are constraints/budgets stated as requirements — worst-case
 * response time, period/rate, memory and stack budgets, CPU load
 * ceilings. They are NOT measured results (that is integration
 * verification, out of scope) — they are the targets the design must
 * meet, derived from System TSR timing.
 */

Chapters.register('software', {
    id: 'sw_resource',
    number: '6',
    title: 'SW Resource, Timing & Performance Requirements',
    order: 60,
    intro: 'Timing and resource constraints stated as requirements: worst-case response time, period/rate, memory/stack budgets, CPU-load ceilings. Targets, not measured results. Derived from System TSR timing.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 60 },
    checklist: [
        { id: 'swr1', text: 'Every timing-critical function has a worst-case response-time requirement.' },
        { id: 'swr2', text: 'Period / activation rate stated for every periodic safety function.' },
        { id: 'swr3', text: 'Memory and stack budgets stated as requirements where ASIL-relevant.' },
        { id: 'swr4', text: 'Timing requirements consistent with the FTTI of the parent TSR.',
          help: 'A SW response-time requirement must leave margin within the Safety Goal FTTI.' },
        { id: 'swr5', text: 'Each resource requirement derives from a System TSR (Parent System TSR(s)).' }
    ]
});
