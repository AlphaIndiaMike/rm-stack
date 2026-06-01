/**
 * disciplines/system/ch19_verif.js
 *
 * System Chapter 5 (display) — Verification Strategy. Default
 * verification method per requirement class, coverage targets per ASIL,
 * tool qualification implications, independence requirements.
 */

Chapters.register('system', {
    id: 'ch19_verif',
    number: '15',
    title: 'Verification Strategy',
    order: 200,
    intro: 'Default verification method per requirement class.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'c19a', text: 'Default verification method per requirement class stated.',
          help: 'Per chapter / requirement type: inspection / analysis / test / simulation.' },
        { id: 'c19b', text: 'Coverage targets stated per ASIL.',
          help: 'Branch / MC-DC / requirements-coverage thresholds per ISO 26262-6:9.' },
        { id: 'c19c', text: 'Tool qualification implications identified.',
          help: 'ISO 26262-8:11. Any tool whose output influences a safety artefact needs TCL classification + qualification evidence.' },
        { id: 'c19d', text: 'Independence requirements for verification per ASIL stated.',
          help: 'ISO 26262-2:6. No independence / different person / team / organisation, scaling with ASIL.' }
    ]
});
