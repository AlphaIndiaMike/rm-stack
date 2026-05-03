/**
 * disciplines/hardware/hw_arch_design.js
 *
 * HW Chapter 3 — HW Architectural Design. Declares the HW components
 * (uses the 'hwComponent' declaration kind, which filters
 * doc.elements to componentKind='hw'). Interfaces declared in System
 * Ch. 5 with kind='physical' surface here through the same store —
 * see disciplines/hardware/hw_interfaces.js when that filter view
 * lands. For now we point at the standard interface kind.
 *
 * Per ISO 26262-5:7 + ASPICE HWE.2.
 */

Chapters.register('hardware', {
    id: 'hw_arch_design',
    number: '3',
    title: 'HW Architectural Design',
    order: 30,
    intro: 'HW components, physical interfaces, partitioning of HW safety mechanisms.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 60 },
    declarations: ['hwComponent', 'interface'],
    checklist: [
        { id: 'had1', text: 'Every HW component has unique ID, name, part number, ASIL.' },
        { id: 'had2', text: 'Failure rate (λ in FIT) sourced (datasheet / SN29500 / IEC 62380) per component.' },
        { id: 'had3', text: 'Component hierarchy (parent ⇒ children) reflects physical containment.' },
        { id: 'had4', text: 'Every physical interface has direction, protocol, electrical class.' },
        { id: 'had5', text: 'Static partitioning of safety mechanisms documented.' },
        { id: 'had6', text: 'ASIL allocation per HW component traceable to ASIL decomposition decisions.' }
    ]
});
