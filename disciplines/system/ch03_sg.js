/**
 * disciplines/system/ch03_sg.js
 *
 * System Chapter 2 (display) — Safety Goals and ASILs. Safety Goals
 * declared from HARA. SafeStates declared here too because they bind
 * upward to SGs (which goal does this safe state realize?) and
 * downward to modes (which mode is the safe state in?).
 */

Chapters.register('system', {
    id: 'ch03_sg',
    number: '2',
    title: 'Safety Goals and ASILs',
    order: 40,
    intro: 'Input from HARA. Every SG carries ASIL, safe state, FTTI.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['safetyGoal', 'safeState'],
    checklist: [
        { id: 'c3a', text: 'Every Safety Goal has ID, hazard ref, ASIL, safe state(s), FTTI.',
          help: 'Each SG row carries: stable ID (SG-NNNN), hazard reference, integrity level (ASIL or SIL), at least one safe state (linked via the SafeState row\'s SG multi-select), and FTTI value with units.' },
        { id: 'c3b', text: 'Every Safety Goal traces back to a HARA entry.',
          help: 'HARA = Hazard Analysis and Risk Assessment (ISO 26262-3:6 / IEC 61508-1:7.4).' },
        { id: 'c3c', text: 'No Safety Goal without ASIL (QM explicit if applicable).',
          help: 'QM is explicit, not blank. A blank means HARA wasn\'t closed for that hazard.' },
        { id: 'c3d', text: 'Safe states cross-referenced to mode/state model.',
          help: 'Each safe state row has Modes multi-select. Tick when every safe state has at least one realising mode.' },
        { id: 'c3e', text: 'HARA document referenced with version.',
          help: 'Reference upstream HARA document by ID and version.' }
    ]
});
