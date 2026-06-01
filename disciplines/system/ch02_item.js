/**
 * disciplines/system/ch02_item.js
 *
 * System Chapter 1 (display) — Item Definition. Item-level data: item
 * functions, operating modes, assumptions of use. Same chapter ID is
 * registered by the Item discipline, sharing the data.
 */

Chapters.register('system', {
    id: 'ch02_item',
    number: '1',
    title: 'Item Definition',
    order: 30,
    intro: 'Item functions drive downstream. Declared here, referenced everywhere.',
    allowsRequirements: false,
    subjectMode: 'none',
    declarations: ['itemFunction', 'mode', 'assumption'],
    checklist: [
        { id: 'c2b', text: 'Item function count within expected range (10–30 for ADAS).',
          help: 'Below 10 = under-decomposed; above 30 = consider splitting into multiple items.' },
        { id: 'c2c', text: 'Boundary defined as enumerated interfaces, not prose.',
          help: 'Item boundary expressed as interface rows in Chapter 5, not paragraphs.' },
        { id: 'c2d', text: 'Operating modes enumerated.',
          help: 'Operating Modes table above. Every declared mode becomes a valid scope token for requirement conditionals.' },
        { id: 'c2e', text: 'Every item function mapped to active modes.',
          help: 'The Active-in-modes multi-select on each item function row, or equivalently Active-functions on each mode row (same data, two views).' },
        { id: 'c2f', text: 'Environmental envelope quantified (no adjectives).',
          help: 'Operating ranges with numeric values: temperature, supply voltage, EMC, vibration, IP. Full structured detail in Chapter 14.' },
        { id: 'c2g', text: 'Assumptions of use enumerated.',
          help: 'AoUs are statements about the operating context the item depends on but does not enforce. Each one needs an owner and a closure target.' },
        { id: 'c2h', text: 'Reference to full item definition document with version.',
          help: 'External Item Definition document (Word/PDF/Polarion) referenced by ID and version.' }
    ]
});
