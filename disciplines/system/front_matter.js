/**
 * disciplines/system/front_matter.js
 *
 * System Chapter 1 — Front Matter. Document class, scope, applicable
 * standards, signoff roles, change control. No requirements, no
 * declarations. Pure governance checklist.
 */

Chapters.register('system', {
    id: 'front_matter',
    number: '1',
    title: 'Front Matter',
    order: 10,
    intro: 'Document class, scope, applicable standards, signoff roles, change control.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'fm1', text: 'Document class declared and matches budget ceiling.' },
        { id: 'fm2', text: 'ASIL scope declared.' },
        { id: 'fm3', text: 'Applicable standards listed with version and date.' },
        { id: 'fm4', text: 'Tailoring decisions listed with justification per clause.' },
        { id: 'fm5', text: 'Signoff roles declared for every chapter.' },
        { id: 'fm6', text: 'Baseline version, change history, and change control process referenced.' }
    ]
});
