/**
 * disciplines/software/sw_operational.js
 *
 * SW Chapter 8 — SW Operational, Robustness & Constraint Requirements.
 * Content domain: operating limits/conditions, defensive behaviour on
 * invalid input, freedom-from-interference where mixed-criticality,
 * and process/standard constraints expressed as requirements. ASPICE
 * SWE.1 (non-functional + constraints), ISO 26262-6:6, IEC 61508-3:7.2
 * (process constraints shall be specified). Safety and non-safety.
 */

Chapters.register('software', {
    id: 'sw_operational',
    number: '8',
    title: 'SW Operational, Robustness & Constraint Requirements',
    order: 80,
    intro: 'Operating limits and conditions, defensive/robust behaviour on invalid or out-of-range input, freedom-from-interference for mixed-criticality, and standard/process constraints stated as requirements. Safety and non-safety.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 60 },
    checklist: [
        { id: 'swo1', text: 'Operating conditions / limits the software must respect stated as requirements.' },
        { id: 'swo2', text: 'Defensive behaviour on invalid, stale or out-of-range input specified (robustness).' },
        { id: 'swo3', text: 'Freedom-from-interference requirements where safety and non-safety code share resources (ISO 26262-9:6).' },
        { id: 'swo4', text: 'Process / standard constraints that bind the implementation stated as requirements.',
          help: 'IEC 61508-3:7.2 — process constraints shall be specified with the requirements.' },
        { id: 'swo5', text: 'Relevant requirements/constraints from the HW design captured (register maps, memory map, HW timing, errata the SW must respect).',
          help: 'ISO 26262-6:6 lists "relevant requirements of the HW design specification" as an input the SW requirements shall consider, alongside the HSI.' },
        { id: 'swo6', text: 'Each requirement traces to a System parent; safety ones inherit the parent ASIL/SIL.' }
    ]
});
