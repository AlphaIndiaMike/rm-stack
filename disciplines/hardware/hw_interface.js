/**
 * disciplines/hardware/hw_interface.js
 *
 * HW Chapter 4 — HW Interface, Electrical & Pin Requirements. ASPICE
 * HWE.1, ISO 26262-5:6. Requirements on the hardware's externally
 * visible interfaces from the HW side: pin/connector assignment,
 * electrical levels, edge characteristics, period/jitter, and the
 * failure behaviour at the pin.
 *
 * REUSES chapter id 'ch09_hsi' (the HSI Signal Catalog,
 * doc.hsiSignals) so HW, SW and System share one signal store —
 * this is the HW perspective. Supersedes the old hw_hsi.js.
 */

Chapters.register('hardware', {
    id: 'ch09_hsi',
    number: '4',
    title: 'HW Interface, Electrical & Pin Requirements',
    order: 40,
    intro: 'Requirements on the hardware interfaces — pin/connector assignment, electrical levels, edge characteristics, period/jitter, failure behaviour at the pin. Shared HSI signal catalog with the System and SW views.',
    allowsRequirements: true,
    subjectMode: 'none',
    requirementBudget: { min: 0, max: 80 },
    declarations: ['hsiSignal'],
    checklist: [
        { id: 'hwi1', text: 'Every HW signal has a pin / connector position requirement.' },
        { id: 'hwi2', text: 'Electrical levels and edge characteristics stated per signal.' },
        { id: 'hwi3', text: 'Period / jitter stated for every periodic signal.' },
        { id: 'hwi4', text: 'Failure behaviour at the pin specified (high-Z, pulled, latched) for safety-relevant signals.',
          help: 'ISO 26262-5:6 — the HW must define a safe electrical behaviour on fault.' },
        { id: 'hwi5', text: 'Each interface requirement derives from a System TSR or HSI signal row.' }
    ]
});
