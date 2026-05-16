/**
 * disciplines/software/sw_config_calibration.js
 *
 * SW Chapter 7 — SW Configuration and Calibration. REUSES chapter id
 * 'ch13_calibration' so calibration parameters are the same store
 * shared with the System view. Calibration parameters are requirements
 * (range, default, unit, owner, integrity) — squarely SWE.1 — so this
 * chapter stays.
 */

Chapters.register('software', {
    id: 'ch13_calibration',
    number: '7',
    title: 'SW Configuration and Calibration',
    order: 70,
    intro: 'Calibration parameters and build-time configuration as requirements: range, default, unit, owner, integrity protection. Shared store with the System view.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'scc1', text: 'Every calibration parameter has range, default, unit, owner.' },
        { id: 'scc2', text: 'Build / variant configuration captured as requirements.' },
        { id: 'scc3', text: 'ASIL-relevant calibrations have an integrity-protection requirement.' },
        { id: 'scc4', text: 'Each calibration requirement derives from a System TSR or item function.' }
    ]
});
