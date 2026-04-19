/**
 * outline.js
 *
 * Defines the document outline per discipline, and the per-chapter
 * completeness checklists the chapter owner signs.
 *
 * Each chapter declares:
 *   - id, number, title
 *   - intro: short description shown at top of the chapter editor
 *   - allowsRequirements: whether the user can add shall-statements here
 *   - subjectMode: 'system' | 'element' | 'none' - constrains the subject dropdown
 *   - requirementBudget: { min, max } for counter warnings (optional)
 *   - checklist: array of { id, text } items signed by owner
 *   - declarations: optional list of declaration types managed in this chapter
 *                   (e.g. Chapter 2 declares item functions, Chapter 6 declares elements)
 */

const OUTLINES = {

    system: [
        {
            id: 'front_matter',
            number: '0',
            title: 'Front Matter',
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
        },
        {
            id: 'ch01_scope',
            number: '1',
            title: 'Scope, Purpose, Standards, Tailoring',
            intro: 'Purpose of this document, what it is and is not, related documents, glossary.',
            allowsRequirements: false,
            subjectMode: 'none',
            checklist: [
                { id: 'c1a', text: 'Purpose statement present, names the system under specification.' },
                { id: 'c1b', text: '"This document is not" list present.' },
                { id: 'c1c', text: 'In-scope and out-of-scope items enumerated.' },
                { id: 'c1d', text: 'Relationship to upstream and downstream documents stated with IDs.' },
                { id: 'c1e', text: 'Glossary and abbreviations present or referenced.' }
            ]
        },
        {
            id: 'ch02_item',
            number: '2',
            title: 'Item Definition Summary',
            intro: 'Item functions drive downstream. Declared here, referenced everywhere.',
            allowsRequirements: false,
            subjectMode: 'none',
            declarations: ['itemFunction', 'mode', 'assumption'],
            checklist: [
                { id: 'c2a', text: 'Every item function has a stable unique ID.' },
                { id: 'c2b', text: 'Item function count within expected range (10–30 for ADAS).' },
                { id: 'c2c', text: 'Boundary defined as enumerated interfaces, not prose.' },
                { id: 'c2d', text: 'Operating modes enumerated with IDs.' },
                { id: 'c2e', text: 'Every item function mapped to active modes.' },
                { id: 'c2f', text: 'Environmental envelope quantified (no adjectives).' },
                { id: 'c2g', text: 'Assumptions of use enumerated with IDs.' },
                { id: 'c2h', text: 'Reference to full item definition document with version.' }
            ]
        },
        {
            id: 'ch03_sg',
            number: '3',
            title: 'Safety Goals and ASILs',
            intro: 'Input from HARA. Every SG carries ASIL, safe state, FTTI.',
            allowsRequirements: false,
            subjectMode: 'none',
            declarations: ['safetyGoal'],
            checklist: [
                { id: 'c3a', text: 'Every Safety Goal has ID, hazard ref, ASIL, safe state(s), FTTI.' },
                { id: 'c3b', text: 'Every Safety Goal traces back to a HARA entry.' },
                { id: 'c3c', text: 'No Safety Goal without ASIL (QM explicit if applicable).' },
                { id: 'c3d', text: 'Safe states cross-referenced to mode/state model.' },
                { id: 'c3e', text: 'HARA document referenced with version.' }
            ]
        },
        {
            id: 'ch04_fsc',
            number: '4',
            title: 'Functional Safety Concept Summary',
            intro: 'FSRs, warning and degradation concept, emergency operation.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 5, max: 30 },
            checklist: [
                { id: 'c4a', text: 'Every Safety Goal has ≥1 FSR.' },
                { id: 'c4b', text: 'Every FSR has parent SG, allocation, ASIL, safe-state ref, FTTI contribution.' },
                { id: 'c4c', text: 'Warning and degradation concept present.' },
                { id: 'c4d', text: 'Driver-in-the-loop assumptions explicit.' },
                { id: 'c4e', text: 'Emergency operation strategy present or explicit N/A.' }
            ]
        },
        {
            id: 'ch05_acceptance',
            number: '5',
            title: 'System Acceptance Requirements (Black-Box Layer)',
            intro: 'The external contract. Subject is always "the system". Tight budget.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 10, max: 60 },
            checklist: [
                { id: 'c5a', text: 'Functional acceptance count within 10–20.' },
                { id: 'c5b', text: 'Non-functional acceptance count within ≤40.' },
                { id: 'c5c', text: 'Every item function has ≥1 acceptance requirement.' },
                { id: 'c5d', text: 'Every Safety Goal has ≥1 acceptance requirement addressing it.' },
                { id: 'c5e', text: 'Every acceptance requirement has subject = "the system".' },
                { id: 'c5f', text: 'Every acceptance requirement has source, rationale, verification method, pass criterion.' },
                { id: 'c5g', text: 'ASIL-relevant acceptance requirements carry ASIL, parent SG, FTTI, safe state.' },
                { id: 'c5h', text: 'No acceptance requirement references an undeclared element.' }
            ]
        },
        {
            id: 'ch06_breakdown',
            number: '6',
            title: 'System Breakdown',
            intro: 'Elements declared here. Chapter 7 is auto-generated from this list.',
            allowsRequirements: false,
            subjectMode: 'none',
            declarations: ['element', 'interface', 'modeTransition'],
            checklist: [
                { id: 'c6a', text: 'Element count within expected range (10–30 for ADAS).' },
                { id: 'c6b', text: 'Every element has unique ID, name, purpose, inherited ASIL.' },
                { id: 'c6c', text: 'Allocation matrix covers every item function to ≥1 element.' },
                { id: 'c6d', text: 'No orphan elements (every element has ≥1 allocated item function).' },
                { id: 'c6e', text: 'ASIL decomposition decisions listed with independence arguments.' },
                { id: 'c6f', text: 'Mode model covers power-off, startup, nominal, degraded, safe, shutdown.' },
                { id: 'c6g', text: 'Every mode transition has ID, source, target, trigger.' },
                { id: 'c6h', text: 'Every safe state from Chapter 3 present in mode model.' }
            ]
        },
        {
            id: 'ch07_elements',
            number: '7',
            title: 'Element Requirements (White-Box Layer)',
            intro: 'Auto-expands one sub-chapter per declared element. Subject = element name.',
            allowsRequirements: false,
            subjectMode: 'none',
            autoExpand: 'elements',
            checklist: [
                { id: 'c7a', text: 'Every element has ≥1 requirement.' },
                { id: 'c7b', text: 'No element exceeds requirement budget (4–13 per leaf).' },
                { id: 'c7c', text: 'Expansion ratio from acceptance requirements within 3–15.' },
                { id: 'c7d', text: 'Every requirement passes SMART and predicate/EARS checks.' }
            ]
        },
        {
            id: 'ch08_allocation',
            number: '8',
            title: 'HW/SW Allocation',
            intro: 'Each Chapter 7 requirement allocated to HW, SW, or both.',
            allowsRequirements: false,
            subjectMode: 'none',
            checklist: [
                { id: 'c8a', text: 'Every Chapter 7 requirement has HW/SW allocation.' },
                { id: 'c8b', text: 'Allocation rationale based on fault origin, not medium.' },
                { id: 'c8c', text: 'ASIL decomposition independence argument present (memory, timing, information).' },
                { id: 'c8d', text: 'Shared resources identified with arbitration approach.' }
            ]
        },
        {
            id: 'ch09_hsi',
            number: '9',
            title: 'Hardware-Software Interface',
            intro: 'Signal/message catalog, timing chains, diagnostic paths.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 10, max: 60 },
            declarations: ['timingChain'],
            checklist: [
                { id: 'c9a', text: 'Every signal has ID, direction, type, range, resolution, period, jitter, failure behavior.' },
                { id: 'c9b', text: 'Every producer has ≥1 consumer and vice versa.' },
                { id: 'c9c', text: 'Every safety-relevant timing chain closes within FTTI.' },
                { id: 'c9d', text: 'Every timing chain stage allocated to an element with matching local timing.' },
                { id: 'c9e', text: 'Diagnostic data path exists for every safety mechanism.' },
                { id: 'c9f', text: 'Startup, shutdown, error handling across HSI specified.' },
                { id: 'c9g', text: 'Data persistence rules specified.' }
            ]
        },
        {
            id: 'ch10_hw',
            number: '10',
            title: 'HW Safety Requirements (Summary)',
            intro: 'High-level HW-SRs with DC targets. Full detail in HW-RS document.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 0, max: 40 },
            checklist: [
                { id: 'c10a', text: 'Every HW-implemented safety mechanism has an HW-SR with DC target.' },
                { id: 'c10b', text: 'Architectural metrics stated: SPFM, LFM, PMHF per ASIL.' },
                { id: 'c10c', text: 'Reference to HW development document with version.' },
                { id: 'c10d', text: 'Every HW-SR traces to a parent TSR.' }
            ]
        },
        {
            id: 'ch11_sw',
            number: '11',
            title: 'SW Safety Requirements (Summary)',
            intro: 'High-level SW-SRs. Full detail in SW-RS document.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 0, max: 40 },
            checklist: [
                { id: 'c11a', text: 'Every SW-implemented safety mechanism has a SW-SR with DC target.' },
                { id: 'c11b', text: 'SW-SRs addressing HW random faults explicitly identified.' },
                { id: 'c11c', text: 'Reference to SW development document with version.' },
                { id: 'c11d', text: 'Freedom-from-interference requirements present for mixed-ASIL SW.' }
            ]
        },
        {
            id: 'ch12_safety_analyses',
            number: '12',
            title: 'Safety Analyses Summary',
            intro: 'FMEA, FTA, DFA summaries with links to full analyses.',
            allowsRequirements: false,
            subjectMode: 'none',
            checklist: [
                { id: 'c12a', text: 'System FMEA referenced with version; summary of top failure modes present.' },
                { id: 'c12b', text: 'FTA top events listed; every top event traces to a Safety Goal.' },
                { id: 'c12c', text: 'DFA performed; common-cause and cascading findings listed.' },
                { id: 'c12d', text: 'Every single-point fault has a linked safety mechanism requirement.' },
                { id: 'c12e', text: 'Every latent fault has mechanism or justified acceptance.' },
                { id: 'c12f', text: 'Residual risk argument present for ASIL C/D.' }
            ]
        },
        {
            id: 'ch13_calibration',
            number: '13',
            title: 'Calibration and Configuration',
            intro: 'Calibratable parameters with ranges, defaults, validation.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 0, max: 20 },
            checklist: [
                { id: 'c13a', text: 'Every calibratable parameter has ID, range, default, unit, owner, ASIL.' },
                { id: 'c13b', text: 'Validation method per parameter stated.' },
                { id: 'c13c', text: 'ASIL-relevant parameters have integrity protection requirement.' }
            ]
        },
        {
            id: 'ch14_env',
            number: '14',
            title: 'Environmental and Operational Envelope',
            intro: 'Temperature, voltage, EMC, vibration, ingress.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 0, max: 20 },
            checklist: [
                { id: 'c14a', text: 'Temperature range (operating, storage) specified.' },
                { id: 'c14b', text: 'Supply voltage range and transients specified.' },
                { id: 'c14c', text: 'EMC class per standard clause.' },
                { id: 'c14d', text: 'Vibration and shock per standard clause.' },
                { id: 'c14e', text: 'Ingress protection rating.' }
            ]
        },
        {
            id: 'ch15_cyber',
            number: '15',
            title: 'Cybersecurity Interaction',
            intro: 'Safety-security interaction points. Reference to TARA.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 0, max: 15 },
            checklist: [
                { id: 'c15a', text: 'Reference to TARA and cybersecurity concept with version.' },
                { id: 'c15b', text: 'Safety-security interaction points identified.' },
                { id: 'c15c', text: 'Conflicts between safety and security requirements listed with resolution.' },
                { id: 'c15d', text: 'Secure boot/update impact on FTTI documented.' }
            ]
        },
        {
            id: 'ch16_hmi',
            number: '16',
            title: 'Human Factors / HMI and Warning Concept',
            intro: 'Driver warnings, takeover requests, degradation notifications.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 0, max: 20 },
            checklist: [
                { id: 'c16a', text: 'Driver warnings enumerated with trigger, modality, timing.' },
                { id: 'c16b', text: 'Takeover requests specified with lead time (if L3+).' },
                { id: 'c16c', text: 'Degradation notifications specified.' },
                { id: 'c16d', text: 'Regulatory references (UN R79, R157, etc.) present or N/A.' }
            ]
        },
        {
            id: 'ch17_assumptions',
            number: '17',
            title: 'Assumptions, Open Points, SEooC Conditions',
            intro: 'Every assumption owned, every open point with closure target.',
            allowsRequirements: false,
            subjectMode: 'none',
            checklist: [
                { id: 'c17a', text: 'Every assumption has ID, owner, status, closure target.' },
                { id: 'c17b', text: 'Every open point has ID, owner, impact, closure target.' },
                { id: 'c17c', text: 'SEooC assumptions of use enumerated if applicable.' },
                { id: 'c17d', text: 'No open point blocks a signed chapter without explicit waiver.' }
            ]
        },
        {
            id: 'ch18_lifecycle',
            number: '18',
            title: 'Production, Operation, Service, Decommissioning',
            intro: 'Field behavior constraints from Part 7.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 0, max: 15 },
            checklist: [
                { id: 'c18a', text: 'End-of-line test requirements or reference to production test spec.' },
                { id: 'c18b', text: 'Field service constraints stated.' },
                { id: 'c18c', text: 'OTA/update requirements present or explicit N/A.' },
                { id: 'c18d', text: 'Decommissioning requirements present or explicit N/A.' }
            ]
        },
        {
            id: 'ch19_verif',
            number: '19',
            title: 'Verification Strategy',
            intro: 'Default verification method per requirement class.',
            allowsRequirements: false,
            subjectMode: 'none',
            checklist: [
                { id: 'c19a', text: 'Default verification method per requirement class stated.' },
                { id: 'c19b', text: 'Coverage targets stated per ASIL.' },
                { id: 'c19c', text: 'Tool qualification implications identified.' },
                { id: 'c19d', text: 'Independence requirements for verification per ASIL stated.' }
            ]
        },
        {
            id: 'ch20_trace',
            number: '20',
            title: 'Traceability',
            intro: 'Trace matrix, orphan report, coverage reports.',
            allowsRequirements: false,
            subjectMode: 'none',
            autoContent: 'traceability',
            checklist: [
                { id: 'c20a', text: 'Trace matrix present: SG → FSR → TSR → acceptance → element → HW/SW → verification.' },
                { id: 'c20b', text: 'Zero orphans, or every orphan has a waiver.' },
                { id: 'c20c', text: 'Coverage report per item function.' },
                { id: 'c20d', text: 'Coverage report per Safety Goal.' }
            ]
        }
    ]

    // V2: item, software, hardware outlines slot in here
};

/**
 * Helper: find a chapter by id within a discipline outline.
 */
function findChapter(discipline, chapterId) {
    const outline = OUTLINES[discipline];
    if (!outline) return null;
    return outline.find(ch => ch.id === chapterId);
}

/**
 * Budget ceilings per document class.
 */
const CLASS_BUDGETS = {
    simple:  { max: 200, label: 'Simple' },
    complex: { max: 300, label: 'Complex' },
    adas:    { max: 400, label: 'ADAS Platform' }
};
