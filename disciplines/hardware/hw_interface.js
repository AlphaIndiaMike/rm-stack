/**
 * disciplines/hardware/hw_interface.js
 *
 * HW Chapter 4 — HW Interface, Electrical & Pin Requirements. REUSES
 * chapter id 'ch09_hsi' (shared HSI catalog). ISO 26262-5:6,
 * IEC 61508-2:7.2, ASPICE HWE.1. Safety and non-safety interfaces.
 */

Chapters.register('hardware', {
    id: 'ch09_hsi',
    number: '4',
    title: 'HW Interface, Electrical & Pin Requirements',
    order: 40,
    intro: 'Requirements on the hardware interfaces — pin/connector assignment, electrical levels, edge characteristics, period/jitter, and failure behaviour at the pin. Shared HSI catalog with System and SW views. Safety and non-safety.',
    allowsRequirements: true,
    subjectMode: 'none',
    requirementBudget: { min: 0, max: 90 },
    declarations: ['hsiSignal'],
    checklist: [
        { id: 'hwi1', text: 'Every HW signal has a pin / connector position requirement.' },
        { id: 'hwi2', text: 'Electrical levels and edge characteristics stated per signal.' },
        { id: 'hwi3', text: 'Period / jitter stated for every periodic signal.' },
        { id: 'hwi4', text: 'Failure behaviour at the pin specified (high-Z, pulled, latched) for safety-relevant signals.' },
        { id: 'hwi5', text: 'Each interface requirement traces to a System parent; safety ones inherit the parent ASIL/SIL.' }
    ]
});
