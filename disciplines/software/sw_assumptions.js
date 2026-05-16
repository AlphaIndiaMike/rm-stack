/**
 * disciplines/software/sw_assumptions.js
 *
 * SW Chapter 9 — SW Assumptions and Open Points. REUSES chapter id
 * 'ch17_assumptions' (shared store across all four views).
 */

Chapters.register('software', {
    id: 'ch17_assumptions',
    number: '9',
    title: 'SW Assumptions and Open Points',
    order: 90,
    intro: 'Assumptions the SW requirements depend on but do not enforce — platform, OS/scheduler, hardware behaviour, integration partners. Each owned, tracked, closed.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'sa1', text: 'Assumptions on OS / scheduler / RTOS captured with owner.' },
        { id: 'sa2', text: 'Assumptions on HW behaviour (timing, interrupts, memory map) captured.' },
        { id: 'sa3', text: 'Assumptions on integration-partner SW elements captured.' },
        { id: 'sa4', text: 'No open assumption blocks signoff without an explicit waiver.' }
    ]
});
