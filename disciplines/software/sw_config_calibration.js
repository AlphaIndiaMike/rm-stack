/**
 * disciplines/software/sw_config_calibration.js
 *
 * SW Chapter 7 — SW Configuration & Calibration Data Requirements.
 * REUSES chapter id 'ch13_calibration' (shared store with the System
 * view). Calibration/configuration data as requirements — squarely
 * SWE.1, applies to safety and non-safety data. ISO 26262-6:6
 * (configurable software / calibration data).
 */

Chapters.register('software', {
    id: 'ch13_calibration',
    number: '7',
    title: 'SW Configuration & Calibration Data Requirements',
    order: 70,
    intro: 'Calibration parameters and build-time configuration as requirements: range, default, unit, owner, integrity protection. Shared store with the System view. Safety and non-safety data alike.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 40 },
    checklist: [
        { id: 'scc1', text: 'Every calibration parameter has range, default, unit, owner.' },
        { id: 'scc2', text: 'Build / variant configuration captured as requirements.' },
        { id: 'scc3', text: 'Safety-classified calibration data has an integrity-protection requirement and inherits the parent ASIL/SIL.' },
        { id: 'scc4', text: 'Each calibration requirement traces to a System parent.' }
    ]
});
