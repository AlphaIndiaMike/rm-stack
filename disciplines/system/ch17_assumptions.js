/**
 * disciplines/system/ch17_assumptions.js
 *
 * System Chapter 14 (display) — Assumptions, Open Points, SEooC
 * Conditions. Reuses the assumption declaration table from Item
 * Definition (same doc.assumptions store, two access points).
 */

Chapters.register('system', {
    id: 'ch17_assumptions',
    number: '14',
    title: 'Assumptions, Open Points, SEooC Conditions',
    order: 180,
    intro: 'Every assumption owned, every open point with closure target.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['assumption'],
    checklist: [
        { id: 'c17a', text: 'Every assumption has ID, owner, status, closure target.',
          help: 'Owner, status (open/closed), and closure target (date or milestone) on every row.' },
        { id: 'c17b', text: 'Every open point has ID, owner, impact, closure target.',
          help: 'Open points = unresolved questions blocking signoff. Capture as assumption with status=open.' },
        { id: 'c17c', text: 'SEooC assumptions of use enumerated if applicable.',
          help: 'Safety Element out of Context: assumed integration conditions become acceptance conditions.' },
        { id: 'c17d', text: 'No open point blocks a signed chapter without explicit waiver.',
          help: 'Either close the open point or attach a waiver (rationale, scope, expiry).' }
    ]
});
