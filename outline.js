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
                { id: 'c1a', text: 'Purpose statement present, names the system under specification.',
                  help: 'One sentence stating what the system is and why this document exists. Names the item under specification (per ISO 26262-3 / IEC 61508-1 scoping requirements). Without it the rest of the document has no anchor.' },
                { id: 'c1b', text: '"This document is not" list present.',
                  help: 'Explicit non-scope: things readers might expect to find here but won\'t. E.g. "this document does not specify HW pinout — see HW-RS". Reduces wasted review time and prevents scope creep from review comments.' },
                { id: 'c1c', text: 'In-scope and out-of-scope items enumerated.',
                  help: 'Bulleted list of what is covered (functions, operating modes, environments) and what is excluded (versions, variants, geographies). Out-of-scope items reduce the reviewer\'s burden to check coverage.' },
                { id: 'c1d', text: 'Relationship to upstream and downstream documents stated with IDs.',
                  help: 'Upstream: HARA, Item Definition, customer requirements, regulations. Downstream: HW-RS, SW-RS, test specs. Each linked by document ID and version. Tick when every relationship is named.' },
                { id: 'c1e', text: 'Glossary and abbreviations present or referenced.',
                  help: 'Either a local glossary at the end of this document, or a reference to a project-wide glossary by ID/version. ASIL, FTTI, HARA, FSR, FMEA — every term used must be defined or referenced.' }
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
                { id: 'c2a', text: 'Every item function has a stable unique ID.',
                  help: 'IDs in the Item Functions table above are auto-generated (ITEMF-NNNN) and persisted. They never change once assigned, so cross-document references stay valid even when names get reworded.' },
                { id: 'c2b', text: 'Item function count within expected range (10–30 for ADAS).',
                  help: 'A typical ADAS item has 10–30 distinct item functions. Below 10 suggests the item is under-decomposed; above 30 suggests it\'s actually multiple items and should be split. Range may differ outside automotive.' },
                { id: 'c2c', text: 'Boundary defined as enumerated interfaces, not prose.',
                  help: 'The item boundary should be expressed as a list of structured interfaces (Chapter 6 — External Interfaces table), not a paragraph saying "the item interacts with the rest of the vehicle". Each interface is one row with producer/consumer/direction/protocol.' },
                { id: 'c2d', text: 'Operating modes enumerated with IDs.',
                  help: 'Operating Modes table above. Each mode has a stable ID (MODE-NNNN). The mode/state model in Chapter 6 references these. Ticking this confirms every distinct mode the item exhibits is captured.' },
                { id: 'c2e', text: 'Every item function mapped to active modes.',
                  help: 'Each item function row has an "Active in modes" multi-select; or equivalently, each mode row has an "Active functions" multi-select (same data, two views). Tick when every function is marked active in at least one mode.' },
                { id: 'c2f', text: 'Environmental envelope quantified (no adjectives).',
                  help: 'Environmental envelope = the operational ranges the item must withstand: temperature (operating/storage), supply voltage and transients, EMC class, vibration/shock, ingress protection. "Quantified, no adjectives" means values with units (e.g. "-40 °C to +85 °C operating", not "wide temperature range"). Full structured detail belongs in Chapter 14 — tick this box once Chapter 14 carries the numbers.' },
                { id: 'c2g', text: 'Assumptions of use enumerated with IDs.',
                  help: 'Assumptions of Use table above. Each assumption has stable ID (AOU-NNNN), text, owner, status. AoUs are statements about the operating context the item depends on but does not enforce — closure or invalidation must be tracked.' },
                { id: 'c2h', text: 'Reference to full item definition document with version.',
                  help: 'You don\'t need to enter anything here. If you have the formal Item Definition document at hand (Word/PDF/Polarion), tick this box. Otherwise leave it unchecked until the document exists.' }
            ]
        },
        {
            id: 'ch03_sg',
            number: '3',
            title: 'Safety Goals and ASILs',
            intro: 'Input from HARA. Every SG carries ASIL, safe state, FTTI.',
            allowsRequirements: false,
            subjectMode: 'none',
            declarations: ['safetyGoal', 'safeState'],
            checklist: [
                { id: 'c3a', text: 'Every Safety Goal has ID, hazard ref, ASIL, safe state(s), FTTI.',
                  help: 'Each row in the Safety Goals table above must carry: stable ID (SG-NNNN), hazard reference (free text or HARA hazard ID), integrity level (ASIL or SIL), at least one safe state (set via Safe States table below — link via SG multi-select), and FTTI value with units.' },
                { id: 'c3b', text: 'Every Safety Goal traces back to a HARA entry.',
                  help: 'HARA = Hazard Analysis and Risk Assessment (ISO 26262-3:6 / equivalent systematic hazard ID per IEC 61508-1:7.4). If you have the HARA at hand, every Safety Goal listed above should map to an identified hazard scenario. Tick when verified — no field to fill in here.' },
                { id: 'c3c', text: 'No Safety Goal without ASIL (QM explicit if applicable).',
                  help: 'Every SG row\'s integrity column must be filled. QM is explicit ("no safety integrity beyond standard QM"), not blank. A blank means the HARA wasn\'t closed for that hazard.' },
                { id: 'c3d', text: 'Safe states cross-referenced to mode/state model.',
                  help: 'The Safe States table above binds each safe state to one or more Operating Modes (Modes multi-select). Tick when every safe state has at least one realising mode declared in Chapter 2.' },
                { id: 'c3e', text: 'HARA document referenced with version.',
                  help: 'Reference the HARA document by ID and version. Same pattern as Item Definition: no field to fill in here, just confirmation that the upstream document exists and is identified.' }
            ]
        },
        {
            id: 'ch04_fsc',
            number: '4',
            title: 'Functional Safety Concept',
            intro: 'FSRs, warning and degradation concept, emergency operation.',
            allowsRequirements: true,
            subjectMode: 'system',
            requirementBudget: { min: 5, max: 30 },
            checklist: [
                { id: 'c4a', text: 'Every Safety Goal has ≥1 FSR.',
                  help: 'Each SG must be realised by at least one Functional Safety Requirement in this chapter, with parentSG set to the SG\'s ID. Right-pane Safety Goals section shows ✓ when at least one FSR exists; ⚠ otherwise.' },
                { id: 'c4b', text: 'Every FSR has parent SG, allocation, ASIL, safe-state ref, FTTI contribution.',
                  help: 'The FSR attribute panel collects all five: Parent Safety Goal (dropdown), allocation (Chapter 6 element via the SW/HW matrix in Ch. 10/11), ASIL, Safe state ref (dropdown of declared SafeStates), FTTI contribution (time budget consumed by this FSR — must sum ≤ SG\'s FTTI across all FSRs).' },
                { id: 'c4c', text: 'Warning and degradation concept present.',
                  help: 'The FSR attribute panel has explicit Warning strategy and Degradation strategy fields. Warning: how the end-user is informed before/during a fault. Degradation: how function is reduced rather than lost. Tick when every FSR addressing a fault has both fields populated (or "N/A" with rationale).' },
                { id: 'c4d', text: 'End-user supervision assumptions explicit.',
                  help: 'The FSR attribute panel has an End-user supervision assumption field. State what the end-user is assumed to monitor or do (e.g. "driver maintains ability to override steering within 0.5 s"). These become AoUs in Chapter 17.' },
                { id: 'c4e', text: 'Emergency operation strategy present or explicit N/A.',
                  help: 'For systems with no available safe state during normal operation (e.g. EPS while driving), an emergency operation strategy is required: the system continues with reduced integrity for a bounded time. Reference ISO 26262-3 Annex B. Tick N/A if no such mode exists.' }
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
                { id: 'c5a', text: 'Functional acceptance count within 10–20.',
                  help: 'Functional acceptance requirements verify that each item function does what it should. Below 10 = under-specified; above 20 = mixing functional with non-functional, split them out. Range may differ outside automotive.' },
                { id: 'c5b', text: 'Non-functional acceptance count within ≤40.',
                  help: 'Non-functional = performance, timing, reliability, robustness, environmental. Above 40 usually indicates duplication across requirements; consolidate.' },
                { id: 'c5c', text: 'Every item function has ≥1 acceptance requirement.',
                  help: 'Right-pane Item Functions section shows A:N — the acceptance count traceable to each function via parentItemFunctions. Tick when every function has A>0.' },
                { id: 'c5d', text: 'Every Safety Goal has ≥1 acceptance requirement addressing it.',
                  help: 'Acceptance requirements trace to FSR(s) via parentFsrs, and FSRs trace to SG via parentSG, so the chain SG→FSR→Acceptance is complete. Right-pane Safety Goals badge ✓ confirms coverage.' },
                { id: 'c5e', text: 'Every acceptance requirement has subject = "the system".',
                  help: 'Acceptance requirements are black-box: written about "the system" as a whole, not about internal elements. The chapter\'s subject mode is fixed to "system" so every requirement here automatically gets that subject — this checklist row is a confirmation.' },
                { id: 'c5f', text: 'Every acceptance requirement has source, rationale, verification method, pass criterion.',
                  help: 'The acceptance attribute panel collects: parent FSR(s) and item function(s) (source via structured arrays), rationale, verification method, pass criterion. Tick when every requirement is fully populated.' },
                { id: 'c5g', text: 'ASIL-relevant acceptance requirements carry ASIL, parent SG, FTTI, safe state.',
                  help: 'For acceptance requirements derived from a safety chain: ASIL inherited from parent FSR, parent SG via the FSR\'s parentSG (resolved automatically), FTTI may need restating if pass criterion involves timing, safe state ref where relevant.' },
                { id: 'c5h', text: 'No acceptance requirement references an undeclared element.',
                  help: 'Acceptance is system-level so element references are unusual. If allocation field is set, it must reference a declared element (Chapter 6). The orphan report on the right pane flags any broken references.' }
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
                { id: 'c6a', text: 'Element count within expected range (10–30 for ADAS).',
                  help: 'Architectural elements declared in the Elements table above. Below 10 = under-decomposed (most elements will overflow the 4–13 per-leaf budget); above 30 = consider whether grouping into subsystems is needed.' },
                { id: 'c6b', text: 'Every element has unique ID, name, purpose, inherited ASIL.',
                  help: 'Elements table row: ID auto-generated, name (no spaces), purpose (one-sentence), ASIL (inherited from item or decomposed per ISO 26262-9:5). Tick when every row is fully populated.' },
                { id: 'c6c', text: 'Allocation matrix covers every item function to ≥1 element.',
                  help: 'Each item function must be allocated to at least one element. Element.allocatedItemFunctions stores this. Right-pane Item Functions section shows E:N counts — each function should have E>0.' },
                { id: 'c6d', text: 'No orphan elements (every element has ≥1 allocated item function).',
                  help: 'An element with zero allocated functions doesn\'t justify its existence in the architecture. Either allocate functions to it or remove it. Right-pane Elements section flags zero-allocation elements.' },
                { id: 'c6e', text: 'ASIL decomposition decisions listed with independence arguments.',
                  help: 'When ASIL D decomposes to e.g. ASIL B(D) + ASIL B(D) on independent elements (ISO 26262-9:5), the independence argument (memory, timing, information) must be documented. Reference DFA findings (Chapter 12) here.' },
                { id: 'c6f', text: 'Mode model covers power-off, startup, nominal, degraded, safe, shutdown.',
                  help: 'Standard mode taxonomy: Off, Startup, Nominal, Degraded (one or more), Safe (one or more), Shutdown. Modes table above should declare each. Mode Transitions table closes the graph.' },
                { id: 'c6g', text: 'Every mode transition has ID, source, target, trigger.',
                  help: 'Mode Transitions table above. Each row: ID, From mode (dropdown), To mode (dropdown), Trigger, optional Guard, optional Time. Tick when every transition needed by the mode graph is captured.' },
                { id: 'c6h', text: 'Every safe state from Chapter 3 present in mode model.',
                  help: 'Each declared SafeState (Chapter 3) must reference at least one Mode (Chapter 2/6) that realises it. The SafeState row\'s Modes multi-select makes the binding. Tick when every safe state has at least one mode link.' }
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
                { id: 'c7a', text: 'Every element has ≥1 requirement.',
                  help: 'The Element Coverage Diagnostic at the top of this chapter (visible when no element is selected) shows the requirement count per element. Tick when every element has ≥1 requirement.' },
                { id: 'c7b', text: 'No element exceeds requirement budget (4–13 per leaf).',
                  help: '4 is the floor below which the element is under-specified; 13 is the ceiling above which it should be decomposed. Right-pane Elements section flags both. The diagnostic table at the chapter root shows status per element.' },
                { id: 'c7c', text: 'Expansion ratio from acceptance requirements within 3–15.',
                  help: 'Expansion ratio = (sum of element requirements across all elements) / (acceptance requirements). Below 3 suggests element layer is rubber-stamping acceptance; above 15 suggests element layer is taking on responsibility that belongs in HW/SW.' },
                { id: 'c7d', text: 'Every requirement passes SMART and predicate/EARS checks.',
                  help: 'SMART = Specific, Measurable, Achievable, Relevant, Time-bounded. EARS = Easy Approach to Requirements Syntax (ubiquitous / event-driven / unwanted-behavior / state-driven / optional patterns). The builder validates both as you type — tick when no requirement on this leaf has a red dot.' }
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
                { id: 'c8a', text: 'Every Chapter 7 requirement has HW/SW allocation.',
                  help: 'Element requirements are technology-agnostic; each must be allocated to HW, SW, or both. The HW Allocation Matrix (Chapter 10) and SW Allocation Matrix (Chapter 11) drive this. Tick when every Chapter 7 requirement appears as allocated in at least one matrix.' },
                { id: 'c8b', text: 'Allocation rationale based on fault origin, not medium.',
                  help: 'A safety mechanism for an HW random fault is HW-allocated even if implemented in SW (the fault originates in HW). A SW-systematic fault mechanism is SW-allocated. Document the rationale per ISO 26262-4:7.' },
                { id: 'c8c', text: 'ASIL decomposition independence argument present (memory, timing, information).',
                  help: 'When decomposing across HW/SW or across redundant SW partitions, three independence dimensions must be argued: memory partitioning (MMU/MPU), timing partitioning (worst-case scheduler analysis), information flow (no shared state). Reference DFA findings.' },
                { id: 'c8d', text: 'Shared resources identified with arbitration approach.',
                  help: 'CPU time, memory bandwidth, network bandwidth, sensors — any resource shared between mixed-ASIL functions needs an arbitration approach (priority, time-triggered scheduling, hypervisor) and a freedom-from-interference (FFI) argument.' }
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
                { id: 'c9a', text: 'Every signal has ID, direction, type, range, resolution, period, jitter, failure behavior.',
                  help: 'The HSI Signal Coverage table at the top of this chapter scores each interface from Chapter 6 against these eight fields. Click ▸ on a Chapter 6 interface row to fill in the SMART details. Tick when every signal shows ✓ on every column.' },
                { id: 'c9b', text: 'Every producer has ≥1 consumer and vice versa.',
                  help: 'A signal with no consumer is dead data; a signal with no producer is undefined input. Each interface row in Chapter 6 has both producer and consumer fields. The right-pane Interfaces section flags rows where either is missing.' },
                { id: 'c9c', text: 'Every safety-relevant timing chain closes within FTTI.',
                  help: 'For each safety chain (sensor → fusion → actuator), the sum of stage times must be ≤ FTTI of the parent SG. Document the chain stages with worst-case execution time and the budget split. Reference Chapter 4 FSR FTTI contributions.' },
                { id: 'c9d', text: 'Every timing chain stage allocated to an element with matching local timing.',
                  help: 'Each stage of a timing chain runs in some element. That element must have a local timing requirement (period or deadline) that supports the chain budget. The element\'s ASIL must be ≥ the chain\'s ASIL.' },
                { id: 'c9e', text: 'Diagnostic data path exists for every safety mechanism.',
                  help: 'Each safety mechanism (Chapter 12 outputs) needs a path to report its status: which DTC, on which protocol (UDS, OBD), how often. Without this the mechanism\'s effectiveness can\'t be observed in the field.' },
                { id: 'c9f', text: 'Startup, shutdown, error handling across HSI specified.',
                  help: 'Define what every signal does at startup (default value, source priority, time before valid), at shutdown (sequence, dependencies), and on detected error (hold last / safe value / not-available marker).' },
                { id: 'c9g', text: 'Data persistence rules specified.',
                  help: 'For data that must survive ignition cycles (calibration, fault memory, mileage counters, learned values): which storage medium, which protection (CRC, redundant copies), what behaviour on corruption.' }
            ]
        },
        {
            id: 'ch10_hw',
            number: '10',
            title: 'HW Safety Requirements',
            intro: 'High-level HW-SRs with DC targets. Full detail in HW-RS document.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 0, max: 40 },
            checklist: [
                { id: 'c10a', text: 'Every HW-implemented safety mechanism has an HW-SR with DC target.',
                  help: 'Diagnostic Coverage (DC) target per ISO 26262-5:8 — typically 60% (low), 90% (medium), 99% (high) depending on ASIL and fault model. Each HW safety mechanism requirement here must state its DC target.' },
                { id: 'c10b', text: 'Architectural metrics stated: SPFM, LFM, PMHF per ASIL.',
                  help: 'SPFM = Single-Point Fault Metric, LFM = Latent Fault Metric, PMHF = Probabilistic Metric for random Hardware Failures. Targets per ISO 26262-5 Annex F: SPFM ≥97% (D)/90% (C); PMHF ≤1e-8/h (D), ≤1e-7/h (C). State the achieved values.' },
                { id: 'c10c', text: 'Reference to HW development document with version.',
                  help: 'This chapter is a summary; the full HW development document (HW-RS, HW design, HW V&V) is the source of truth. Reference it by ID and version.' },
                { id: 'c10d', text: 'Every HW-SR traces to a parent TSR.',
                  help: 'TSR = Technical Safety Requirement (Chapter 7 element req). Each HW-SR must allocate from at least one Chapter 7 requirement via the HW Allocation Matrix above. Tick when every HW-SR has at least one ticked cell in its row.' }
            ]
        },
        {
            id: 'ch11_sw',
            number: '11',
            title: 'SW Safety Requirements',
            intro: 'High-level SW-SRs. Full detail in SW-RS document.',
            allowsRequirements: true,
            subjectMode: 'element',
            requirementBudget: { min: 0, max: 40 },
            checklist: [
                { id: 'c11a', text: 'Every SW-implemented safety mechanism has a SW-SR with DC target.',
                  help: 'Same DC concept as for HW (ISO 26262-6:6) but for SW-implemented mechanisms: range checks, plausibility checks, voting, control-flow monitors, watchdogs. State the DC target per ASIL.' },
                { id: 'c11b', text: 'SW-SRs addressing HW random faults explicitly identified.',
                  help: 'When a SW mechanism handles an HW random fault (e.g. SW range check on an analog input that may have stuck-at faults), the SW-SR should be tagged so the HW DC analysis can claim coverage from it. Avoid double-counting.' },
                { id: 'c11c', text: 'Reference to SW development document with version.',
                  help: 'Like c10c — this chapter is the safety summary; the SW development document (SW-RS, SW architecture, SW unit design) holds the rest. Reference by ID and version.' },
                { id: 'c11d', text: 'Freedom-from-interference requirements present for mixed-ASIL SW.',
                  help: 'Per ISO 26262-9:6 — when SW components of different ASILs share a processor, FFI must be argued for memory (MPU/MMU partitioning), timing (worst-case response time analysis with monitoring), and information exchange (qualified inter-component communication). State the FFI requirements explicitly.' }
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
                { id: 'c12a', text: 'System FMEA referenced with version; summary of top failure modes present.',
                  help: 'FMEA = Failure Mode and Effects Analysis. Reference the system-level FMEA document with version, then list the top failure modes by severity / occurrence / detection score (or RPN).' },
                { id: 'c12b', text: 'FTA top events listed; every top event traces to a Safety Goal.',
                  help: 'FTA = Fault Tree Analysis. Each top event of the fault tree (e.g. "Unintended deceleration") must map to a Safety Goal in Chapter 3. Tick when every FTA top event has a structured parent SG.' },
                { id: 'c12c', text: 'DFA performed; common-cause and cascading findings listed.',
                  help: 'DFA = Dependent Failure Analysis (ISO 26262-9). Identifies common-cause failures (one cause → multiple elements affected) and cascading failures (one element\'s failure propagates). List findings and resulting freedom-from-interference requirements.' },
                { id: 'c12d', text: 'Every single-point fault has a linked safety mechanism requirement.',
                  help: 'A single-point fault (one fault → SG violated, no detection) is forbidden for ASIL B+. Each must be addressed by a safety mechanism captured as a requirement (FSR / TSR), referenced from this list.' },
                { id: 'c12e', text: 'Every latent fault has mechanism or justified acceptance.',
                  help: 'A latent fault (undetected fault that combined with another fault leads to SG violation) needs a detection mechanism with adequate diagnostic coverage, or an explicit justification for acceptance with rationale.' },
                { id: 'c12f', text: 'Residual risk argument present for ASIL C/D.',
                  help: 'Quantitative residual risk argument required for high-integrity SGs: PMHF (Probabilistic Metric for random Hardware Failures) below the ASIL target (ISO 26262-5 Annex F: 1e-7/h for ASIL C, 1e-8/h for ASIL D).' }
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
                { id: 'c13a', text: 'Every calibratable parameter has ID, range, default, unit, owner, ASIL.',
                  help: 'Use the requirement builder with predicate "exhibit" or "process" — the property/value/unit/range slots capture the structured detail. Owner field on each requirement\'s rationale or a dedicated ownership note. Tick when every calibration parameter requirement has all six fields.' },
                { id: 'c13b', text: 'Validation method per parameter stated.',
                  help: 'How is each calibration value validated before use? Range check, CRC, dual-store comparison, signed-data verification. The Verification method field on each row captures this.' },
                { id: 'c13c', text: 'ASIL-relevant parameters have integrity protection requirement.',
                  help: 'Calibrations whose corruption could violate a Safety Goal need integrity protection: redundant storage, cryptographic signature, write-protected partition. Add explicit requirements here referencing the parent SG.' }
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
                { id: 'c14a', text: 'Temperature range (operating, storage) specified.',
                  help: 'Operating range is the temperatures at which the system must perform per spec; storage is the non-powered range it must survive without damage. Both are quantified with units (e.g. -40 to +85 °C operating, -55 to +125 °C storage). Reference the standard clause used (LV124, ISO 16750-4, etc.).' },
                { id: 'c14b', text: 'Supply voltage range and transients specified.',
                  help: 'Steady-state range (e.g. 9–16 V for 12 V systems), plus transient profiles per LV124, ISO 16750-2, or 21434: load dump, jump start, cranking, reverse polarity, micro-interruption.' },
                { id: 'c14c', text: 'EMC class per standard clause.',
                  help: 'Conducted emissions/immunity, radiated emissions/immunity, ESD class. Reference the relevant standard (CISPR 25, ISO 11452-x, ISO 10605) and the class/level required.' },
                { id: 'c14d', text: 'Vibration and shock per standard clause.',
                  help: 'Random vibration profile (PSD), sinusoidal sweep, mechanical shock peak/duration. Reference standard (ISO 16750-3, IEC 60068-2-x) and mounting location class (engine, body, wheel).' },
                { id: 'c14e', text: 'Ingress protection rating.',
                  help: 'IP code per IEC 60529 (e.g. IP6K9K for engine bay, IP54 for cabin). Tick when the IP class is documented for every relevant enclosure.' }
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
                { id: 'c15a', text: 'Reference to TARA and cybersecurity concept with version.',
                  help: 'TARA = Threat Analysis and Risk Assessment per ISO/SAE 21434. Reference the document with version. Tick if you have the TARA at hand or know its location — no field to fill in here.' },
                { id: 'c15b', text: 'Safety-security interaction points identified.',
                  help: 'Where a security mechanism affects safety (e.g. message authentication that adds latency to a safety-critical CAN frame) or vice versa. List each interaction with both the safety and the security requirement IDs.' },
                { id: 'c15c', text: 'Conflicts between safety and security requirements listed with resolution.',
                  help: 'Example: a safety req mandates fastest possible reaction; a security req mandates message authentication that adds latency. Document each conflict and how it was resolved (which requirement was relaxed, what the trade-off was).' },
                { id: 'c15d', text: 'Secure boot/update impact on FTTI documented.',
                  help: 'Secure boot adds startup latency; OTA updates may interrupt service. Document the worst-case impact on FTTI and any safe-state requirements during update windows.' }
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
                { id: 'c16a', text: 'Driver/operator warnings enumerated with trigger, modality, timing.',
                  help: 'Each warning needs: what triggers it (which fault/state), how it is presented (visual/auditory/haptic), when it appears relative to the trigger (latency budget). Use the Functional Safety Concept warning-strategy field on each FSR.' },
                { id: 'c16b', text: 'Takeover requests specified with lead time (if L3+).',
                  help: 'For SAE Level 3+ automation: the time the system gives the human to resume control. Typical regulatory floor is 10 s (UN R157). Below L3 this row is N/A — tick the box once.' },
                { id: 'c16c', text: 'Degradation notifications specified.',
                  help: 'When the system enters a degraded mode, the end-user must be informed in a non-ambiguous way. Specify the message, the modality, and the persistence (latches until ignition cycle / clears with fault).' },
                { id: 'c16d', text: 'Regulatory references (UN R79, R157, etc.) present or N/A.',
                  help: 'List the regulations applicable to the item (UN R79 for steering, R13 for braking, R157 for L3 ALKS, FMVSS for US, etc.) and the clauses cited. Tick "N/A" if the item is below the threshold.' }
            ]
        },
        {
            id: 'ch17_assumptions',
            number: '17',
            title: 'Assumptions, Open Points, SEooC Conditions',
            intro: 'Every assumption owned, every open point with closure target.',
            allowsRequirements: false,
            subjectMode: 'none',
            // Surface the existing AoU declaration table here so the user
            // can edit assumptions in the same place the checklist lives.
            // The data is shared with Chapter 2 (it lives on doc.assumptions).
            declarations: ['assumption'],
            checklist: [
                { id: 'c17a', text: 'Every assumption has ID, owner, status, closure target.',
                  help: 'The Assumptions of Use table above captures ID, text, owner, and status. Closure target lives in the closureTarget field on each row. Tick when every assumption is fully populated.' },
                { id: 'c17b', text: 'Every open point has ID, owner, impact, closure target.',
                  help: 'Open points are unresolved questions blocking signoff. Capture each as an assumption with status="open" and a stated closure target (date or milestone). Closing requires evidence and an explicit status flip.' },
                { id: 'c17c', text: 'SEooC assumptions of use enumerated if applicable.',
                  help: 'Safety Element out of Context — when developing a generic component without a final integration target, the assumed integration conditions (mounting, supply, neighbouring elements, expected use) become acceptance conditions for any future integrator. Tick "N/A" if not SEooC.' },
                { id: 'c17d', text: 'No open point blocks a signed chapter without explicit waiver.',
                  help: 'A chapter cannot be signed off if any open point would invalidate the work in it. Either close the open point or attach a waiver (rationale, scope, expiry) before signoff.' }
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
                { id: 'c18a', text: 'End-of-line test requirements or reference to production test spec.',
                  help: 'Manufacturing tests that confirm safety-relevant features after assembly. Either list the EoL tests inline as requirements here, or reference the production test spec document with version.' },
                { id: 'c18b', text: 'Field service constraints stated.',
                  help: 'Constraints that propagate to service operations: required tooling, calibration data integrity after replacement, mandatory re-tests, decommissioning of paired safety elements.' },
                { id: 'c18c', text: 'OTA/update requirements present or explicit N/A.',
                  help: 'If over-the-air updates are supported: prerequisites for an update window (vehicle parked, ignition off), rollback strategy, integrity verification, behaviour during update interruption.' },
                { id: 'c18d', text: 'Decommissioning requirements present or explicit N/A.',
                  help: 'End-of-life: data wipe of personal/cryptographic material, safe disposal of HV components, deactivation of paired safety elements. Tick N/A if the item is consumable or has no decommission obligation.' }
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
                { id: 'c19a', text: 'Default verification method per requirement class stated.',
                  help: 'Per chapter / requirement type, declare the default method (inspection / analysis / test / simulation). Individual requirements may override but the default reduces noise and surfaces missing rationale when something deviates.' },
                { id: 'c19b', text: 'Coverage targets stated per ASIL.',
                  help: 'Branch / MC-DC / requirements-coverage thresholds per ASIL per ISO 26262-6:9. Higher ASILs require higher coverage. Reference your test strategy document or state values inline.' },
                { id: 'c19c', text: 'Tool qualification implications identified.',
                  help: 'Per ISO 26262-8:11, any tool whose output influences a safety-relevant artefact (compiler, code generator, test harness, requirements tool) needs a TCL classification and qualification evidence. List affected tools and the qualification path.' },
                { id: 'c19d', text: 'Independence requirements for verification per ASIL stated.',
                  help: 'ISO 26262-2:6 sets independence levels (no independence / different person / different team / different organisation) for review and verification activities, scaling with ASIL. State which level applies to which activity.' }
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
                { id: 'c20a', text: 'Trace matrix present: SG → FSR → TSR → acceptance → element → HW/SW → verification.',
                  help: 'The auto-generated trace matrix on this page reads structured parent fields (parentSG, parentFsrs, parentAcceptanceReqs, parentItemFunctions, allocation). Tick when the matrix shows a complete chain for every Safety Goal.' },
                { id: 'c20b', text: 'Zero orphans, or every orphan has a waiver.',
                  help: 'Orphans are listed in the right-pane summary. Resolve each by fixing the broken pointer, or attach a waiver (rationale + expiry) for the few that legitimately can\'t be closed.' },
                { id: 'c20c', text: 'Coverage report per item function.',
                  help: 'Right-pane Item Functions section: A:N E:M means N acceptance reqs and M element reqs trace to that function. Coverage is satisfied when every function has A>0 and E>0.' },
                { id: 'c20d', text: 'Coverage report per Safety Goal.',
                  help: 'Right-pane Safety Goals section: ✓ means FSR + acceptance + element all trace to the SG; ⚠ means at least one stage is missing. Hover the badge for the exact gap.' }
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
