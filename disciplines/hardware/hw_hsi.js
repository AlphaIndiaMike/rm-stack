/**
 * disciplines/hardware/hw_hsi.js
 *
 * HW Chapter 6 — HW-Software Interface (HW perspective). REUSES chapter
 * id 'ch09_hsi' so the signal catalog is shared with the System view:
 * the HSI Signal Catalog (doc.hsiSignals) is one store, viewed from
 * both disciplines.
 *
 * The chapter-specific widgets (coverage diagnostic, requirement
 * generator) are registered by the System discipline's ch09_hsi.js.
 * This registration only needs the outline metadata + the hsiSignal
 * declaration so the HW view shows the same catalog table.
 */

Chapters.register('hardware', {
    id: 'ch09_hsi',
    number: '6',
    title: 'HW-Software Interface',
    order: 60,
    intro: 'Signal catalog from the HW side — pin assignments, electrical levels, edge characteristics, diagnostic visibility. Shared catalog with the System discipline.',
    allowsRequirements: true,
    subjectMode: 'none',
    declarations: ['hsiSignal'],
    checklist: [
        { id: 'hhsi1', text: 'Every HW signal has a pin / connector position.' },
        { id: 'hhsi2', text: 'Electrical levels and edge characteristics stated per signal.' },
        { id: 'hhsi3', text: 'Period / jitter for periodic signals stated.' },
        { id: 'hhsi4', text: 'Failure behaviour at the HW pin specified (high-Z, pulled, latched).' },
        { id: 'hhsi5', text: 'Diagnostic readout path declared per safety-relevant signal.' }
    ]
});
