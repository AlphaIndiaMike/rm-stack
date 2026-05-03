/**
 * disciplines/system.js
 *
 * Registers the System Requirements Specification discipline. The
 * chapter files in disciplines/system/ each call Chapters.register
 * ('system', ...) to attach themselves to this outline.
 *
 * Standards reference: ISO 26262-4 (System), ASPICE SYS.1–SYS.5.
 */

Disciplines.register({
    id: 'system',
    label: 'System',
    shortLabel: 'System',
    order: 2,
    enabled: true,
    description: 'System Requirements Specification per ISO 26262-4 / ASPICE SYS.x. Item-level inputs (Item Definition, Safety Goals) are present here too because the SyRS owns the full chain SG → FSR → acceptance → element → HW/SW.'
});
