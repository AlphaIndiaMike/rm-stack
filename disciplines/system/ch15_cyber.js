/**
 * disciplines/system/ch15_cyber.js
 *
 * System Chapter 12 (display) — Cybersecurity Interaction. Reference to
 * TARA + safety-security interaction points. Per ISO/SAE 21434.
 */

Chapters.register('system', {
    id: 'ch15_cyber',
    number: '12',
    title: 'Cybersecurity Interaction',
    order: 160,
    intro: 'Safety-security interaction points. Reference to TARA.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 0, max: 15 },
    checklist: [
        { id: 'c15a', text: 'Reference to TARA and cybersecurity concept with version.',
          help: 'TARA = Threat Analysis and Risk Assessment per ISO/SAE 21434.' },
        { id: 'c15b', text: 'Safety-security interaction points identified.',
          help: 'Where a security mechanism affects safety (latency added by message authentication) or vice versa.' },
        { id: 'c15c', text: 'Conflicts between safety and security requirements listed with resolution.' },
        { id: 'c15d', text: 'Secure boot/update impact on FTTI documented.',
          help: 'Secure boot adds startup latency; OTA may interrupt service. Document worst-case FTTI impact.' }
    ]
});
