/**
 * disciplines/hardware/hw_hsi.js
 *
 * HW Chapter 6 — HW-Software Interface (HW perspective). REUSES chapter
 * id 'ch09_hsi' so the same store is shared with the System view.
 *
 * NOTE: timing chains are still under reconstruction (see ch09_hsi.js
 * file header in the System discipline).
 */

Chapters.register('hardware', {
    id: 'ch09_hsi',
    number: '6',
    title: 'HW-Software Interface',
    order: 60,
    intro: 'Signal catalog, timing characteristics, electrical class, diagnostic visibility — from the HW side.',
    allowsRequirements: true,
    subjectMode: 'element',
    declarations: ['timingChain'],   // stub
    checklist: [
        { id: 'hhsi1', text: 'Every HW signal has direction, electrical level, edge characteristics.' },
        { id: 'hhsi2', text: 'Period / jitter for periodic signals stated.' },
        { id: 'hhsi3', text: 'Failure behaviour at the HW pin specified (high-Z, pulled, latched).' },
        { id: 'hhsi4', text: 'Diagnostic readout path declared per safety mechanism.' }
    ]
});
