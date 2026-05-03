/**
 * disciplines/system/ch11_sw.js
 *
 * System Chapter 9 (display) — SW Safety Requirements. Summary layer.
 * Full SW detail in the SW-RS document (the Software discipline adds
 * richer chapters; this one is the System view).
 */

Chapters.register('system', {
    id: 'ch11_sw',
    number: '9',
    title: 'SW Safety Requirements',
    order: 120,
    intro: 'High-level SW-SRs. Full detail in SW-RS document.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 40 },
    extraWidgets: (doc, onChange) => [
        new AllocationMatrixWidget(doc, onChange, 'ch11_sw', 'SW Allocation Matrix')
    ],
    checklist: [
        { id: 'c11a', text: 'Every SW-implemented safety mechanism has a SW-SR with DC target.',
          help: 'ISO 26262-6:6 — range checks, plausibility checks, voting, control-flow monitors, watchdogs.' },
        { id: 'c11b', text: 'SW-SRs addressing HW random faults explicitly identified.',
          help: 'When a SW mechanism handles an HW random fault, tag the SW-SR so the HW DC analysis can claim coverage. Avoid double-counting.' },
        { id: 'c11c', text: 'Reference to SW development document with version.' },
        { id: 'c11d', text: 'Freedom-from-interference requirements present for mixed-ASIL SW.',
          help: 'ISO 26262-9:6. Memory (MPU/MMU), timing (WCRT analysis), information exchange (qualified IPC).' }
    ]
});
