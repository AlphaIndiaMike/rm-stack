/**
 * disciplines/hardware/hw_detailed_design.js
 *
 * HW Chapter 4 — HW Detailed Design. Schematic-level decisions, BOM
 * pin-mapping, derating, layout constraints. Most detail lives in
 * external design tools (Altium, Cadence, etc.) — this chapter is the
 * project-internal narrative + checklist.
 *
 * Per ISO 26262-5:7.4.4 + ASPICE HWE.2 BP3-BP6.
 */

Chapters.register('hardware', {
    id: 'hw_detailed_design',
    number: '4',
    title: 'HW Detailed Design',
    order: 40,
    intro: 'Schematic decisions, BOM, derating, layout constraints. References to external CAD artefacts.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 40 },
    checklist: [
        { id: 'hdd1', text: 'Schematic + BOM referenced (ID + revision).' },
        { id: 'hdd2', text: 'Derating policy declared (voltage, current, power, temperature margins).' },
        { id: 'hdd3', text: 'Critical traces / clearances / EMC layout constraints captured as requirements.' },
        { id: 'hdd4', text: 'Test points for safety-relevant signals declared.' },
        { id: 'hdd5', text: 'Diagnostic boundary (what BIT covers) documented.' }
    ]
});
