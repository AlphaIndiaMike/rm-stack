/**
 * disciplines/system/ch04_fsc.js
 *
 * System Chapter 3 (display) — Functional Safety Concept. The first
 * chapter that allows requirements (FSRs). Each FSR has a parent SG
 * and contributes to the FTTI budget.
 */

Chapters.register('system', {
    id: 'ch04_fsc',
    number: '3',
    title: 'Functional Safety Concept',
    order: 50,
    intro: 'FSRs, warning and degradation concept, emergency operation.',
    allowsRequirements: true,
    subjectMode: 'system',
    requirementBudget: { min: 5, max: 30 },
    checklist: [
        { id: 'c4a', text: 'Every Safety Goal has ≥1 FSR.',
          help: 'Each SG must be realised by at least one FSR with parentSG set. Right-pane Safety Goals shows ✓ when at least one FSR exists.' },
        { id: 'c4b', text: 'Every FSR has parent SG, allocation, ASIL, safe-state ref, FTTI contribution.',
          help: 'The FSR attribute panel collects parent SG (dropdown), allocation, ASIL, safe state, FTTI contribution.' },
        { id: 'c4c', text: 'Warning and degradation concept present.',
          help: 'Warning: how the user is informed. Degradation: how function is reduced rather than lost. Both are explicit FSR fields.' },
        { id: 'c4d', text: 'End-user supervision assumptions explicit.',
          help: 'What the end-user is assumed to monitor or do. These become AoUs in the Assumptions chapter.' },
        { id: 'c4e', text: 'Emergency operation strategy present or explicit N/A.',
          help: 'For systems with no available safe state during normal operation. ISO 26262-3 Annex B.' }
    ]
});
