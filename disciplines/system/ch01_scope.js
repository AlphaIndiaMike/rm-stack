/**
 * disciplines/system/ch01_scope.js
 *
 * System Chapter 2 (display) — Scope, Purpose, Standards, Tailoring.
 */

Chapters.register('system', {
    id: 'ch01_scope',
    number: '',
    title: 'Scope, Purpose, Standards, Tailoring',
    order: 20,
    intro: 'Purpose of this document, what it is and is not, related documents, glossary.',
    allowsRequirements: false,
    subjectMode: 'none',
    checklist: [
        { id: 'c1a', text: 'Purpose statement present, names the system under specification.',
          help: 'One sentence stating what the system is and why this document exists. Names the item under specification (per ISO 26262-3 / IEC 61508-1 scoping requirements). Without it the rest of the document has no anchor.' },
        { id: 'c1b', text: '"This document is not" list present.',
          help: 'Explicit non-scope: things readers might expect to find here but won\'t. Reduces wasted review time.' },
        { id: 'c1c', text: 'In-scope and out-of-scope items enumerated.',
          help: 'Bulleted list of what is covered (functions, operating modes, environments) and what is excluded.' },
        { id: 'c1d', text: 'Relationship to upstream and downstream documents stated with IDs.',
          help: 'Upstream: HARA, Item Definition, customer requirements, regulations. Downstream: HW-RS, SW-RS, test specs.' },
        { id: 'c1e', text: 'Glossary and abbreviations present or referenced.',
          help: 'Local glossary or reference to a project-wide one. Every term used must be defined or referenced.' }
    ]
});
