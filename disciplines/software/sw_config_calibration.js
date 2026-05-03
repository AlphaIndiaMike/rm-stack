/**
 * disciplines/software/sw_config_calibration.js
 *
 * SW Chapter 8 — SW Configuration and Calibration. REUSES chapter id
 * 'ch13_calibration' so calibration parameters are shared with the
 * System view.
 */

Chapters.register('software', {
    id: 'ch13_calibration',
    number: '8',
    title: 'SW Configuration and Calibration',
    order: 80,
    intro: 'Calibration parameters, build-time configuration, variant management.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 30 },
    checklist: [
        { id: 'scc1', text: 'Every calibration has range, default, unit, owner.' },
        { id: 'scc2', text: 'Build configuration captured (variant matrix).' },
        { id: 'scc3', text: 'ASIL-relevant calibrations have integrity protection.' },
        { id: 'scc4', text: 'Calibration validation method declared per parameter.' }
    ]
});
