/**
 * disciplines/hardware/hw_safety_reqs.js
 *
 * HW Chapter 5 — HW Fault Handling, Diagnostics & Safety Mechanisms.
 * Content domain. REUSES chapter id 'ch10_hw' (shared with the System
 * HW summary). ISO 26262-5:6/7, IEC 61508-2:7.2. FMEDA metric numbers
 * are computed externally; here the metric TARGETS are stated as
 * obligations and the safety mechanisms as requirements with DC.
 */

Chapters.register('hardware', {
    id: 'ch10_hw',
    number: '5',
    title: 'HW Fault Handling, Diagnostics & Safety Mechanisms',
    order: 50,
    intro: 'Fault detection/handling, safety mechanisms with DC targets, and the architectural-metric targets (SPFM/LFM/PMHF per ASIL) as obligations — computation external. Each derives from a System parent inheriting its ASIL/SIL.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 110 },
    checklist: [
        { id: 'hsr1', text: 'Every HW safety mechanism is a requirement with a Diagnostic Coverage (DC) target.',
          help: 'ISO 26262-5:8 — 60% / 90% / 99% per ASIL and fault class.' },
        { id: 'hsr2', text: 'Fault-handling / detection-and-reaction stated for each safety-related fault, timing ≤ FTTI where applicable.' },
        { id: 'hsr3', text: 'Architectural-metric targets (SPFM/LFM/PMHF per ASIL) referenced as obligations; computation external.' },
        { id: 'hsr4', text: 'Each requirement traces to a System parent and inherits its ASIL/SIL unchanged.' },
        { id: 'hsr5', text: 'Safe state / fault reaction referenced for each safety mechanism.' },
        { id: 'hsr6', text: 'Operating conditions inherited from Chapter 6 (performance & operating conditions).' }
    ]
});
