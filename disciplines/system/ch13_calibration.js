/**
 * disciplines/system/ch13_calibration.js
 *
 * System Chapter 10 (display) — Calibration and Configuration. Each
 * calibratable parameter is captured as a requirement (use the builder
 * with predicate "exhibit" or "process"; the property/value/unit/range
 * slots carry the structured detail).
 *
 * NOTE on allocation: an old per-element allocation matrix was removed
 * (it tried to do allocation before the project was ready for it).
 * Allocation lives on each requirement (Requirement.allocation, an array
 * of element IDs). Author calibration requirements here directly.
 */

Chapters.register('system', {
    id: 'ch13_calibration',
    number: '9',
    title: 'Calibration and Configuration',
    order: 140,
    intro: 'Calibratable parameters with ranges, defaults, validation.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 20 },
    checklist: [
        { id: 'c13a', text: 'Every calibratable parameter has ID, range, default, unit, owner, ASIL.',
          help: 'Use the requirement builder with predicate "exhibit" or "process".' },
        { id: 'c13b', text: 'Validation method per parameter stated.',
          help: 'Range check, CRC, dual-store comparison, signed-data verification.' },
        { id: 'c13c', text: 'ASIL-relevant parameters have integrity protection requirement.',
          help: 'Calibrations whose corruption could violate a Safety Goal need redundant storage / signature / write-protected partition.' }
    ]
});
