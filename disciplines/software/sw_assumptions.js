/**
 * disciplines/software/sw_assumptions.js
 *
 * SW Chapter 9 — SW Assumptions. REUSES chapter id 'ch17_assumptions'.
 */

Chapters.register('software', {
    id: 'ch17_assumptions',
    number: '9',
    title: 'SW Assumptions and Open Points',
    order: 90,
    intro: 'Assumptions on platform, OS, hardware, integration.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'sa1', text: 'AoUs on OS / scheduler / RTOS captured.' },
        { id: 'sa2', text: 'AoUs on HW behaviour (timing, interrupts, memory map) captured.' },
        { id: 'sa3', text: 'AoUs on integration partner SW elements.' }
    ]
});
