/**
 * disciplines/software/sw_interface.js
 *
 * SW Chapter 4 — SW Interface Requirements. ASPICE SWE.1,
 * ISO 26262-6:6. Requirements ON the software's externally-visible
 * interfaces: signals/messages it consumes and produces, ranges,
 * units, timing, and failure values.
 *
 * REUSES chapter id 'ch09_hsi' so the HSI Signal Catalog
 * (doc.hsiSignals) is one store shared with the System and HW views —
 * the SW view of the same signals. The catalog-editing widgets
 * (coverage diagnostic, generator) are registered by the System
 * discipline's ch09_hsi.js; here we only need the outline metadata +
 * the hsiSignal declaration so the SW view shows the same catalog and
 * can author interface requirements against it.
 */

Chapters.register('software', {
    id: 'ch09_hsi',
    number: '4',
    title: 'SW Interface Requirements',
    order: 40,
    intro: 'Requirements on the software interfaces — signals/messages consumed and produced, ranges, units, timing, failure values. Shared HSI signal catalog with the System and HW views.',
    allowsRequirements: true,
    subjectMode: 'none',
    requirementBudget: { min: 0, max: 80 },
    declarations: ['hsiSignal'],
    checklist: [
        { id: 'swi1', text: 'Every signal the SW consumes has range, unit, resolution, refresh/period.' },
        { id: 'swi2', text: 'Every signal the SW produces has range, unit, timing and default/failure value.' },
        { id: 'swi3', text: 'Substitute / failure values defined for every safety-relevant input.',
          help: 'ISO 26262-6:6 — behaviour on missing or invalid input must be specified.' },
        { id: 'swi4', text: 'Each interface requirement derives from a System TSR or HSI signal row.' },
        { id: 'swi5', text: 'No interface requirement specifies an internal API (that is detailed design — out of scope).' }
    ]
});
