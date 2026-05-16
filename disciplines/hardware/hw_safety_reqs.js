/**
 * disciplines/hardware/hw_safety_reqs.js
 *
 * HW Chapter 5 — HW Diagnostic & Safety Requirements. ASPICE HWE.1,
 * ISO 26262-5:6. REUSES chapter id 'ch10_hw' from the System
 * discipline, so the System view's "HW Safety Requirements" summary
 * and this detailed view share one store — one JSON, two perspectives.
 *
 * The old FMEDA-metric checklist (SPFM / LFM / PMHF targets) was
 * removed: those are computed in a reliability tool and the
 * computation is out of scope here. What stays is the requirement-
 * level obligation: every HW safety mechanism is a requirement with a
 * DC target and a detection+reaction path, derived from a System TSR
 * (ISO 26262-5:6 derives HW-SRs from the Technical Safety
 * Requirements, not directly from FSRs).
 */

Chapters.register('hardware', {
    id: 'ch10_hw',
    number: '5',
    title: 'HW Diagnostic & Safety Requirements',
    order: 50,
    intro: 'Hardware safety mechanisms as requirements: monitoring, redundancy, diagnostics, safe electrical behaviour. Each carries a DC target and a detection+reaction path, and derives from a System TSR. FMEDA metrics themselves are computed externally.',
    allowsRequirements: true,
    subjectMode: 'element',
    requirementBudget: { min: 0, max: 100 },
    checklist: [
        { id: 'hsr1', text: 'Every HW safety mechanism is a requirement with a Diagnostic Coverage (DC) target.',
          help: 'ISO 26262-5:8 — typically 60% / 90% / 99% depending on ASIL and fault class (single-point / residual / latent).' },
        { id: 'hsr2', text: 'Every HW-SR states detection + reaction (the diagnostic path), and timing ≤ FTTI where applicable.',
          help: 'Use the "detect" predicate: one requirement carries the detected fault AND the reaction.' },
        { id: 'hsr3', text: 'Every HW-SR derives from a parent System TSR.',
          help: 'Set Parent System TSR(s). ISO 26262-5:6 derives HW safety requirements from the Technical Safety Requirements.' },
        { id: 'hsr4', text: 'Architectural-metric *targets* (SPFM/LFM/PMHF per ASIL) referenced as the obligation; the computation itself is external.' },
        { id: 'hsr5', text: 'Operating conditions inherited from the environmental envelope (Chapter 6).' },
        { id: 'hsr6', text: 'Safe state / fault reaction referenced for each safety mechanism.' }
    ]
});
