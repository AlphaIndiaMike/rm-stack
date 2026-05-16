/**
 * disciplines/software/sw_interface.js
 *
 * SW Chapter 4 — SW Interface Requirements. ASPICE SWE.1,
 * ISO 26262-6:6 (HW-SW interface), IEC 61508-3:7.2. REUSES chapter id
 * 'ch09_hsi' so the HSI Signal Catalog is one store shared with the
 * System and HW views. Requirements on every interface the software
 * consumes/produces — safety and non-safety alike.
 */

Chapters.register('software', {
    id: 'ch09_hsi',
    number: '4',
    title: 'SW Interface Requirements',
    order: 40,
    intro: 'Requirements on the software interfaces — signals/messages consumed and produced, ranges, units, resolution, timing, and substitute/failure values. Shared HSI signal catalog with the System and HW views. Covers safety and non-safety interfaces.',
    allowsRequirements: true,
    subjectMode: 'none',
    requirementBudget: { min: 0, max: 90 },
    declarations: ['hsiSignal'],
    checklist: [
        { id: 'swi1', text: 'Every signal the SW consumes has range, unit, resolution, refresh/period.' },
        { id: 'swi2', text: 'Every signal the SW produces has range, unit, timing and default value.' },
        { id: 'swi3', text: 'Substitute / failure value defined for every safety-relevant input.',
          help: 'ISO 26262-6:6 — behaviour on missing or invalid input must be specified for safety-classified data.' },
        { id: 'swi4', text: 'HW-SW interface obligations from the HSI captured as SW requirements.' },
        { id: 'swi5', text: 'Each interface requirement traces to a System parent; safety ones inherit the parent ASIL/SIL.' },
        { id: 'swi6', text: 'No interface requirement specifies an internal API (that is detailed design — out of scope).' }
    ]
});
