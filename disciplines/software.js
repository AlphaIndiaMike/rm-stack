/**
 * disciplines/software.js
 *
 * Registers the Software discipline. Standards reference: ISO 26262-6
 * (Software) + ASPICE SWE.1 / SWE.2 / SWE.3 / SWE.4 / SWE.5 / SWE.6.
 *
 * The Software discipline owns the SW Requirements Specification work
 * product. It picks up SW-allocated requirements (chapterId 'ch11_sw'
 * on those requirements) and SW-classified elements (componentKind='sw'),
 * then adds SW-specific chapters: SW architectural design, detailed
 * design and unit construction, unit verification, SW integration and
 * verification, qualification testing.
 *
 * Same SyrsDocument, different outline.
 */

Disciplines.register({
    id: 'software',
    label: 'Software',
    shortLabel: 'Software',
    order: 4,
    enabled: true,
    description: 'SW Requirements Specification + SW Architectural Design per ISO 26262-6 / ASPICE SWE.x.'
});
