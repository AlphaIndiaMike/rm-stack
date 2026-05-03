/**
 * disciplines/software/sw_arch_design.js
 *
 * SW Chapter 3 — SW Architectural Design. ASPICE SWE.2, ISO 26262-6:7.
 *
 * Declares SW units (the 'swUnit' kind filters doc.elements to
 * componentKind='sw') and the data interfaces between them. The same
 * interface store is shared with HW; data interfaces (kind='data')
 * are the SW-relevant subset.
 */

Chapters.register('software', {
    id: 'sw_arch_design',
    number: '3',
    title: 'SW Architectural Design',
    order: 30,
    intro: 'Static architecture: components, interfaces, partitioning. Dynamic architecture: tasks, periodicity, communication patterns.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 60 },
    declarations: ['swUnit', 'interface'],
    checklist: [
        { id: 'sad1', text: 'Every SW unit has unique ID, name, ASIL, language.' },
        { id: 'sad2', text: 'Static structure (component containment) documented.' },
        { id: 'sad3', text: 'Dynamic behaviour: scheduling, periodicity, IPC declared.' },
        { id: 'sad4', text: 'Memory partitioning for mixed-ASIL units (MPU/MMU).' },
        { id: 'sad5', text: 'Interfaces between units have direction, type, range, period.' },
        { id: 'sad6', text: 'Architectural patterns (layered / pipe-and-filter / event-driven) documented.' }
    ]
});
