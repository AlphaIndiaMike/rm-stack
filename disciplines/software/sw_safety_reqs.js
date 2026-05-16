/**
 * disciplines/software/sw_safety_reqs.js
 *
 * SW Chapter 5 — SW Diagnostic & Safety Requirements. ASPICE SWE.1,
 * ISO 26262-6:6. REUSES chapter id 'ch11_sw' from the System
 * discipline, so the System view's "SW Safety Requirements" summary
 * and this detailed view share one store — one JSON, two perspectives.
 *
 * This is the "new world" the user flagged: the software safety
 * mechanisms — monitoring, plausibility, range/CRC checks, watchdog /
 * alive supervision, control-flow monitoring, debouncing, and the
 * error reaction. Each diagnostic requirement carries a Diagnostic
 * Coverage (DC) target and a detection+reaction time that must fit
 * inside the FTTI (the 'detect' predicate binds both halves with a
 * single detectionTime — see model_base.js).
 *
 * Derivation is up to the System TSRs (Parent System TSR(s)), per
 * ISO 26262-6:6 deriving SW safety requirements from the technical
 * safety requirements — not directly from FSRs.
 */

Chapters.register('software', {
    id: 'ch11_sw',
    number: '5',
    title: 'SW Diagnostic & Safety Requirements',
    order: 50,
    intro: 'Software safety mechanisms: monitoring, plausibility, range/CRC, watchdog, control-flow, error reaction. Each carries a DC target and detection+reaction time ≤ FTTI, and derives from a System TSR.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 100 },
    checklist: [
        { id: 'ssr1', text: 'Every SW diagnostic requirement states a Diagnostic Coverage (DC) target.',
          help: 'ISO 26262-6 — range checks, plausibility, voting, control-flow monitors, watchdogs each claim a DC.' },
        { id: 'ssr2', text: 'Every diagnostic requirement states detection + reaction time, and it is ≤ FTTI.',
          help: 'Use the "detect" predicate: one requirement carries the detected condition AND the reaction, bound by a single detection time covering the full detect-and-react path.' },
        { id: 'ssr3', text: 'Every SW-SR derives from a parent System TSR.',
          help: 'Set Parent System TSR(s). ISO 26262-6:6 derives SW safety requirements from the Technical Safety Requirements.' },
        { id: 'ssr4', text: 'SW mechanisms covering HW random faults are tagged (avoid double-counting in the HW metrics).' },
        { id: 'ssr5', text: 'Freedom-from-interference requirements stated for mixed-ASIL SW (memory, timing, exchange).',
          help: 'ISO 26262-9:6 — stated as requirements here, not as a partitioning design.' },
        { id: 'ssr6', text: 'Safe state / degraded behaviour referenced for each error reaction.' }
    ]
});
