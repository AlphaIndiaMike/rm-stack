/**
 * disciplines/hardware/hw_resource.js
 *
 * HW Chapter 6 — HW Performance & Operating-Condition Requirements.
 * Non-functional content domain: electrical performance, environmental
 * envelope, EMC immunity limits, derating. Stated as requirements
 * (targets, not measured results). ISO 26262-5:6, IEC 61508-2:7.2.3
 * (EMC immunity limits; de-rating). Safety and non-safety.
 */

Chapters.register('hardware', {
    id: 'hw_resource',
    number: '6',
    title: 'HW Performance & Operating-Condition Requirements',
    order: 60,
    intro: 'Electrical performance, environmental operating envelope, EMC/ESD immunity limits, derating — stated as requirements. Inherits the System environmental envelope. Safety and non-safety.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 70 },
    checklist: [
        { id: 'hwr1', text: 'Operating envelope (voltage, current, temperature) stated as requirements.' },
        { id: 'hwr2', text: 'Electrical performance characteristics stated as requirements.' },
        { id: 'hwr3', text: 'EMC / ESD immunity limits stated (IEC 61508-2:7.2.3.2 e).' },
        { id: 'hwr4', text: 'Derating policy stated as requirements (margins; IEC 61508-2 de-rating).' },
        { id: 'hwr5', text: 'Envelope consistent with the System environmental envelope; each requirement traces to a System parent.' }
    ]
});
