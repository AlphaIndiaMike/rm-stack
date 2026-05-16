/**
 * disciplines/software/sw_safety_reqs.js
 *
 * SW Chapter 5 — SW Fault Detection, Diagnostics & Safety Mechanisms.
 * Content domain (not "the safety chapter"): the requirements that
 * detect, indicate and mitigate faults, plus self-test and monitoring.
 * Mostly safety-classified, but defined by content. REUSES chapter id
 * 'ch11_sw' so the System view's SW summary shares this store.
 * ISO 26262-6:6, IEC 61508-3:7.2; collaboration with the HW FMEA
 * (IEC 61508-3:7.2 — how the SW defends against HW failures).
 */

Chapters.register('software', {
    id: 'ch11_sw',
    number: '5',
    title: 'SW Fault Detection, Diagnostics & Safety Mechanisms',
    order: 50,
    intro: 'Detection, indication and mitigation of faults; self-test; monitoring (watchdog/alive, control-flow, plausibility, range/CRC). Each carries a DC target and detection+reaction ≤ FTTI, and derives from a System parent inheriting its ASIL/SIL.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 110 },
    checklist: [
        { id: 'ssr1', text: 'For each safety-related HW fault (from the HW FMEA): a SW detection, indication and mitigation requirement.',
          help: 'IEC 61508-3:7.2 — close HW/SW collaboration: how does the SW defend against the HW failure modes.' },
        { id: 'ssr2', text: 'Every diagnostic requirement states a Diagnostic Coverage (DC) target.' },
        { id: 'ssr3', text: 'Every diagnostic requirement states detection + reaction time, and it is ≤ FTTI.',
          help: 'Use the "detect" predicate: one requirement carries the detected condition AND the reaction.' },
        { id: 'ssr4', text: 'On-board / off-board self-test functions specified.' },
        { id: 'ssr5', text: 'Each requirement traces to a System parent and inherits its ASIL/SIL unchanged.' },
        { id: 'ssr6', text: 'Safe state / degraded behaviour referenced for each error reaction.' },
        { id: 'ssr7', text: 'Freedom-from-interference requirements stated where safety and non-safety share an element (ISO 26262-9:6).' }
    ]
});
