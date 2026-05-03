/**
 * disciplines/hardware.js
 *
 * Registers the Hardware discipline. Standards reference: ISO 26262-5
 * (Hardware) + ASPICE HWE.1 / HWE.2.
 *
 * The Hardware discipline owns the HW Requirements Specification work
 * product. It picks up the HW-allocated requirements written at the
 * System level (chapterId 'ch10_hw' on those requirements) and the
 * HW-classified elements (componentKind='hw'), then adds HW-specific
 * chapters: detailed component design, FMEA / FMEDA, fault metrics
 * (SPFM / LFM / PMHF).
 *
 * Same SyrsDocument, different outline. No data duplication.
 */

Disciplines.register({
    id: 'hardware',
    label: 'Hardware',
    shortLabel: 'Hardware',
    order: 3,
    enabled: true,
    description: 'HW Requirements Specification + HW Architectural Design per ISO 26262-5 / ASPICE HWE.x. Inherits HW-allocated requirements and HW components from the System / Item layers.'
});
