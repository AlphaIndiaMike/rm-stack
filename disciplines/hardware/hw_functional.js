/**
 * disciplines/hardware/hw_functional.js
 *
 * HW Chapter 3 — HW Functional Requirements. ASPICE HWE.1,
 * ISO 26262-5:6. The functional behaviour the hardware must provide,
 * derived from the System TSRs allocated to HW.
 *
 * Carries the lightweight 'hwComponent' declaration ONLY so a
 * requirement can name a component as its subject. Not an architecture
 * editor — no schematic, BOM, λ/FIT or partitioning tables.
 */

Chapters.register('hardware', {
    id: 'hw_functional',
    number: '3',
    title: 'HW Functional Requirements',
    order: 30,
    intro: 'Functional behaviour the hardware must provide. Each requirement derives from one or more System Technical Safety Requirements (Parent System TSR(s)).',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 120 },
    declarations: ['hwComponent'],
    checklist: [
        { id: 'hwf1', text: 'Every HW functional requirement derives from ≥1 System TSR.',
          help: 'Set Parent System TSR(s). The Inputs chapter flags TSRs with no derived requirement.' },
        { id: 'hwf2', text: 'Subject is a declared HW component or "the hardware" — never a schematic net.',
          help: 'Keeps requirements at HWE.1 level, not detailed design.' },
        { id: 'hwf3', text: 'Every requirement passes SMART and predicate/EARS checks.' },
        { id: 'hwf4', text: 'ASIL inherited from the parent TSR (or QM if the TSR is QM).' },
        { id: 'hwf5', text: 'Verification method stated per requirement.' }
    ]
});
