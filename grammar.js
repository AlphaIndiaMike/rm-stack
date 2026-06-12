/**
 * grammar.js
 *
 * Defines the requirement sentence grammar, predicate taxonomy,
 * SMART rules, forbidden words, and validators.
 *
 * Extensible per discipline: each discipline can override or extend
 * predicate definitions and forbidden words.
 */

const GRAMMAR = {

    // Conditional slot options (EARS-inspired + prohibition branch)
    conditionals: [
        { id: 'ubiquitous', label: '(none - ubiquitous)', prefix: '',          semantics: 'Invariant. Always applies.' },
        { id: 'when',       label: 'When',                prefix: 'When ',     semantics: 'Event-driven. Nominal trigger.' },
        { id: 'while',      label: 'While',               prefix: 'While ',    semantics: 'State-driven. Continuous within a state.' },
        { id: 'during',     label: 'During',              prefix: 'During ',   semantics: 'State-driven. Alternative phrasing.' },
        { id: 'at',         label: 'At',                  prefix: 'At ',       semantics: 'Time-point.' },
        { id: 'if',         label: 'If',                  prefix: 'If ',       semantics: 'Unwanted/fault condition.' },
        { id: 'where',      label: 'Where',               prefix: 'Where ',    semantics: 'Variant/configuration-dependent.' }
    ],

    // Predicate types: the verb pattern that follows SHALL
    // Each predicate carries its own structured object fields
    predicates: [
        {
            // Abstraction layer: acceptance / black-box. Use at the
            // System or Item level when stating *what* output is derived
            // from *what* input, with no commitment to implementation.
            // "the system shall compute the engine torque setpoint from
            // pedal position, RPM, and gear."
            id: 'compute',
            label: 'Compute (black-box / acceptance layer)',
            verb: 'compute',
            kind: 'functional',
            template: '[output] from [input]',
            fields: [
                { id: 'output',   label: 'Output (what is computed)', required: true },
                { id: 'input',    label: 'Input(s)',                  required: true },
                { id: 'envelope', label: 'Performance envelope',      required: false, hint: 'e.g. within 20 ms, ±0.5 Nm' }
            ]
        },
        {
            // Abstraction layer: element / HW. Use when the requirement
            // states a *defined transformation rule* applied to an input
            // — direction is meaningful. "the ADC interface shall
            // transform raw ADC counts to engineering units using the
            // calibration table."
            id: 'transform',
            label: 'Transform (element / HW layer)',
            verb: 'transform',
            kind: 'functional',
            template: '[input] into [output]',
            fields: [
                { id: 'input',    label: 'Input',  required: true },
                { id: 'output',   label: 'Output (transformation result)', required: true },
                { id: 'envelope', label: 'Performance envelope', required: false, hint: 'e.g. within 5 ms, resolution 10 bits' }
            ]
        },
        {
            // Generic processing — appropriate when the requirement is
            // about the *what* (this gets processed) and the *how* is
            // out of scope. "the gateway shall process incoming CAN
            // frames matching id 0x1A0 into the speed bus message."
            id: 'process',
            label: 'Process (generic input-to-output)',
            verb: 'process',
            kind: 'functional',
            template: '[input] into [output]',
            fields: [
                { id: 'input',  label: 'Input',  required: true  },
                { id: 'output', label: 'Output', required: true  },
                { id: 'envelope', label: 'Performance envelope', required: false, hint: 'e.g. within 20 ms, ±0.5 Nm' }
            ]
        },
        {
            id: 'provide',
            label: 'Provide capability to actor',
            verb: 'provide',
            kind: 'functional',
            template: 'the capability [capability] to [actor]',
            fields: [
                { id: 'capability', label: 'Capability', required: true },
                { id: 'actor',      label: 'Actor',      required: true },
                { id: 'envelope',   label: 'Performance envelope', required: false }
            ]
        },
        {
            // Canonical EARS event-driven pattern for safety-mechanism
            // detection. The sentence shape is:
            //
            //   "When [condition is detected], the [subject] shall
            //    [reaction] within [detectionTime]. [DC target]"
            //
            // The previous template ("[condition] within [detectionTime]")
            // was incomplete — detect *what*, do *what about it*? — and
            // failed SMART Measurable. The reaction is the behaviour the
            // requirement actually demands and belongs in the sentence,
            // not split into a separate requirement.
            //
            // detectionTime is the bound on the whole detect-and-react
            // path (must be ≤ FTTI of the parent SG). dcTarget is the
            // Diagnostic Coverage figure of merit for this mechanism per
            // ISO 26262-5 Annex F.
            id: 'detect',
            label: 'Detect condition and react (safety mechanism)',
            verb: 'detect',
            kind: 'functional',
            template: 'detect [condition] and [reaction] within [detectionTime]',
            fields: [
                { id: 'condition',     label: 'Condition detected', required: true,  hint: 'e.g. loss of the wheel-speed signal' },
                { id: 'reaction',      label: 'Reaction',           required: true,  hint: 'what the subject shall do once the condition is detected' },
                { id: 'detectionTime', label: 'Reaction time', required: true, hint: 'e.g. ≤50 ms — time from the condition occurring to the reaction completing, must be ≤ FTTI of the parent SG' },
                { id: 'dcTarget',      label: 'DC target',          required: false, hint: 'e.g. ≥90% (ISO 26262-5 Annex F)' }
            ],
            isSafetyMechanism: true
        },
        {
            id: 'transition',
            label: 'Transition to / Enter / Exit state',
            verb: 'transition',
            kind: 'functional',
            template: 'from [fromState] to [toState] upon [trigger]',
            fields: [
                { id: 'fromState',      label: 'From state',      required: true  },
                { id: 'toState',        label: 'To state',        required: true  },
                { id: 'trigger',        label: 'Trigger',         required: true  },
                { id: 'transitionTime', label: 'Transition time', required: false }
            ]
        },
        {
            id: 'exhibit',
            label: 'Exhibit property / quality',
            verb: 'exhibit',
            kind: 'non_functional',
            template: '[property] of [value] [unit] [tolerance]',
            fields: [
                { id: 'property',  label: 'Property name', required: true },
                { id: 'value',     label: 'Value',         required: true },
                { id: 'unit',      label: 'Unit',          required: true },
                { id: 'tolerance', label: 'Tolerance',     required: false }
            ]
        },
        {
            id: 'conform',
            label: 'Conform to / Comply with standard',
            verb: 'conform',
            kind: 'non_functional',
            template: 'to [standard] [clause]',
            fields: [
                { id: 'standard', label: 'Standard reference', required: true },
                { id: 'clause',   label: 'Clause',             required: false }
            ]
        },
        {
            // Structural / interface-definition statements. Not a
            // behavioural "when X do Y" — an HSI requirement defines a
            // signal's binding to a physical location and its electrical
            // / timing / data properties. EARS-wise this is a ubiquitous
            // pattern ("The <interface> shall define ..."). The HSI
            // chapter's generator builds these from hsiSignal rows, and
            // the user can also author them by hand here.
            id: 'interface',
            label: 'Define interface signal (HSI)',
            verb: 'define',
            kind: 'non_functional',
            template: 'signal [signalName] on [pin] as [signalProperties]',
            fields: [
                { id: 'signalName',       label: 'Signal name',       required: true,  hint: 'e.g. VehicleSpeed, VBAT, CAN_TX0' },
                { id: 'pin',              label: 'Pin / connector / bus address', required: true, hint: 'e.g. Pin 7, Conn-A.3, CAN id 0x1A0' },
                { id: 'signalProperties', label: 'Electrical / data properties',  required: true, hint: 'e.g. 0–5 V analog, uint16 0.01 km/h/bit' },
                { id: 'signalConsumer',   label: 'Consumer (for use by)', required: false, hint: 'element the signal is destined for, e.g. BrakeECU' },
                { id: 'signalTiming',     label: 'Timing',            required: false, hint: 'e.g. 10 ms period, on-change' },
                { id: 'signalFailure',    label: 'Failure behaviour', required: false, hint: 'e.g. hold last value, default to 0' }
            ]
        },
        {
            // Abstraction: any level. The bounding verb — the requirement
            // IS the bound, so SMART measurability is forced by the
            // template: a quantity and a numeric bound are both required.
            // "While reverse gear is engaged, the system shall limit
            // vehicle speed to ≤ 10 km/h."
            id: 'limit',
            label: 'Limit quantity to bound',
            verb: 'limit',
            kind: 'functional',
            template: '[limitedQuantity] to [limitBound]',
            fields: [
                { id: 'limitedQuantity', label: 'Quantity limited', required: true, hint: 'e.g. vehicle speed, output current, message rate' },
                { id: 'limitBound',      label: 'Bound',            required: true, hint: 'e.g. ≤ 10 km/h, ≤ 2 A — the bound IS the pass criterion' }
            ]
        },
        {
            // Abstraction: System / SW. Closed-loop holding of a setpoint
            // — absorbs "control/regulate" (vague without a setpoint).
            // Naturally EARS state-driven: pair with a While guard.
            // "While ACC is active, the system shall maintain headway
            // time at 1.8 s ± 0.2 s."
            id: 'maintain',
            label: 'Maintain quantity at setpoint',
            verb: 'maintain',
            kind: 'functional',
            template: '[maintainedQuantity] at [setpoint] [setpointTolerance]',
            fields: [
                { id: 'maintainedQuantity', label: 'Quantity maintained', required: true, hint: 'e.g. headway time, rail voltage' },
                { id: 'setpoint',           label: 'Setpoint',            required: true, hint: 'e.g. 1.8 s, 5.0 V' },
                { id: 'setpointTolerance',  label: 'Tolerance',           required: true, hint: 'e.g. ± 0.2 s — makes the hold testable' }
            ]
        },
        {
            // Abstraction: Item (driver/operator information), also
            // System. One piece of information, one recipient, one
            // deadline — atomic by template. "If the lane-keeping
            // function becomes unavailable, the item shall indicate the
            // unavailability to the driver within 500 ms."
            id: 'indicate',
            label: 'Indicate information to recipient',
            verb: 'indicate',
            kind: 'functional',
            template: '[information] to [recipient] within [indicationLatency]',
            fields: [
                { id: 'information',       label: 'Information indicated', required: true, hint: 'one piece of information — split "and" into separate requirements' },
                { id: 'recipient',          label: 'Recipient',             required: true, hint: 'e.g. the driver, the operator, the diagnostic tester' },
                { id: 'indicationLatency',  label: 'Latency',               required: false, hint: 'e.g. within 500 ms of the condition' }
            ]
        },
        {
            // Abstraction: HW / SW. Runtime communication behaviour,
            // observable on the wire — distinct from the static
            // 'interface' signal declaration. "the software unit shall
            // transmit the wheel-speed message on CAN-1 every 10 ms."
            // NOTE: there is deliberately no 'receive' counterpart —
            // reception is not externally observable; specify what the
            // subject DOES with the data (compute/process) or how it
            // reacts to its absence (detect).
            id: 'transmit',
            label: 'Transmit message on channel',
            verb: 'transmit',
            kind: 'functional',
            template: '[message] on [channel] [transmitTiming]',
            fields: [
                { id: 'message',        label: 'Message / signal', required: true, hint: 'e.g. the wheel-speed message' },
                { id: 'channel',        label: 'Channel',          required: true, hint: 'e.g. CAN-1, SPI, the diagnostic interface' },
                { id: 'transmitTiming', label: 'Timing',           required: true, hint: 'e.g. every 10 ms, within 5 ms of computation' }
            ]
        },
        {
            // Abstraction: HW / SW. Persistence — testable by cycling
            // the persistence condition and reading back. "When a DTC is
            // confirmed, the software unit shall store the freeze-frame
            // in NvM retaining across power cycles."
            id: 'store',
            label: 'Store data with persistence',
            verb: 'store',
            kind: 'functional',
            template: '[dataStored] in [storageMedium] retaining across [persistenceCondition]',
            fields: [
                { id: 'dataStored',           label: 'Data stored',    required: true, hint: 'e.g. the freeze-frame, the calibration set' },
                { id: 'storageMedium',        label: 'Medium',         required: true, hint: 'e.g. NvM, EEPROM' },
                { id: 'persistenceCondition', label: 'Retained across', required: false, hint: 'e.g. power cycles, software update' }
            ]
        },
        {
            id: 'prohibit',
            label: 'Not (prohibition)',
            verb: 'not',
            kind: 'functional',
            template: '[prohibitedBehavior] [boundingCondition]',
            fields: [
                { id: 'prohibitedBehavior', label: 'Prohibited behavior',  required: true },
                { id: 'boundingCondition',  label: 'Bounding condition',   required: false }
            ],
            requiresAnalysisVerification: true
        }
    ],

    // Forbidden words linter
    // Matches whole words, case-insensitive
    forbiddenWords: [
        { word: 'should',       reason: 'Ambiguous modality. Use "shall" for requirements.' },
        { word: 'will',         reason: 'Ambiguous modality. Use "shall" for requirements.' },
        { word: 'may',          reason: 'Optional. Requirements are mandatory.' },
        { word: 'might',        reason: 'Ambiguous modality.' },
        { word: 'could',        reason: 'Ambiguous modality.' },
        { word: 'approximately',reason: 'Not measurable. Give a bounded value.' },
        { word: 'about',        reason: 'Not measurable. Give a bounded value.' },
        { word: 'roughly',      reason: 'Not measurable.' },
        { word: 'appropriate',  reason: 'Subjective. Specify the criterion.' },
        { word: 'adequate',     reason: 'Subjective.' },
        { word: 'sufficient',   reason: 'Subjective.' },
        { word: 'user-friendly',reason: 'Subjective. Specify a measurable usability criterion.' },
        { word: 'robust',       reason: 'Subjective. Specify tolerance or fault coverage.' },
        { word: 'fast',         reason: 'Not measurable.' },
        { word: 'efficient',    reason: 'Subjective.' },
        { word: 'easy',         reason: 'Subjective.' },
        { word: 'minimize',     reason: 'Not bounded. Give a maximum value.' },
        { word: 'maximize',     reason: 'Not bounded. Give a minimum value.' },
        { word: 'optimize',     reason: 'Not bounded. Give a target value.' },
        { word: 'etc',          reason: 'Incomplete enumeration.' },
        { word: 'etc.',         reason: 'Incomplete enumeration.' },
        { word: 'TBD',          reason: 'Unresolved. Close before signoff.' },
        { word: 'TBC',          reason: 'Unresolved. Close before signoff.' },
        { word: 'as needed',    reason: 'Not specified. Give a condition.' },
        { word: 'as required',  reason: 'Not specified. Give a condition.' },
        // Unobservable-activity verbs (v1.6.0): the object is internal
        // activity, not an observable effect — structurally untestable.
        { scope: 'statement', word: 'monitor',      reason: 'Not testable as such — monitoring has no pass criterion. Specify the observable outcome: use "detect" (condition + reaction + time) or "indicate" (information + recipient).' },
        { scope: 'statement', word: 'receive',      reason: 'Reception is not externally observable. Specify what the subject DOES with the data (compute/process) or how it reacts to its absence (detect timeout).' },
        { scope: 'statement', word: 'manage',       reason: 'Not testable — names internal activity, not an observable effect. State the observable behavior.' },
        { scope: 'statement', word: 'handle',       reason: 'Not testable — names internal activity. State the observable behavior (detect / limit / transition / indicate).' },
        { scope: 'statement', word: 'support',      reason: 'Not testable. State the concrete capability (provide) or behavior.' },
        { scope: 'statement', word: 'ensure',       reason: 'Not testable as such. State the property directly as the requirement.' },
        { scope: 'statement', word: 'be able to',   reason: 'Capability hedging. State the behavior itself: the subject SHALL do it.' }
    ],

    // Integrity levels.
    //
    // ISO 26262 (automotive) and IEC 61508 (general functional safety) use
    // independent classifications and are NOT mathematically equivalent.
    // We therefore expose them as parallel options in one dropdown rather
    // than mapping one to the other. QM is shared.
    //
    // Legacy projects authored before this widening used single-letter
    // values ('A'..'D'). They are migrated to the prefixed form on load
    // (see migrateAsilValue in model_base.js).
    asilLevels: ['QM',
                 'ASIL-A', 'ASIL-B', 'ASIL-C', 'ASIL-D',
                 'SIL-1',  'SIL-2',  'SIL-3',  'SIL-4'],

    /** Per-discipline vocabulary (v1.5.9). EARS/SMART are level-agnostic —
     *  the PATTERN is valid at every abstraction level — but the
     *  vocabulary should not be: the subject names the thing under
     *  specification at THAT level, and some predicates fit one level
     *  better than another (Item speaks black-box, SW speaks white-box).
     *  This is guidance, not prohibition: preferred predicates sort
     *  first in the editor and carry a recommendation tag; nothing is
     *  forbidden, so cross-level data stays editable. */
    disciplineVocabulary: {
        item: {
            subject: 'the item',
            subjectHint: 'Concept level: name the item or the actor (e.g. "the item", "the driver").',
            preferredPredicates: ['provide', 'detect', 'indicate', 'prohibit', 'transition', 'limit']
        },
        system: {
            subject: 'the system',
            subjectHint: 'System level: "the system", or the element for white-box TSRs.',
            preferredPredicates: ['compute', 'limit', 'maintain', 'detect', 'transition', 'prohibit']
        },
        hardware: {
            subject: 'the component',
            subjectHint: 'HW level: name the component (e.g. "the ADC interface", "the watchdog").',
            preferredPredicates: ['transform', 'limit', 'exhibit', 'interface', 'transmit', 'detect']
        },
        software: {
            subject: 'the software unit',
            subjectHint: 'SW level: name the unit/component (e.g. "the input handler", "the scheduler").',
            preferredPredicates: ['process', 'transform', 'store', 'transmit', 'limit', 'maintain']
        }
    },

    /** Integrity equivalence ladder (v1.5.9). PROJECT CONVENTION, not a
     *  normative mapping: IEC 61508 and ISO 26262 define no official
     *  correspondence (literature most often cites ASIL-D ≈ SIL-3, with
     *  SIL-4 above anything automotive). This project declares the
     *  monotone 1:1 ladder below; every cross-family acceptance is
     *  surfaced to the user as a non-blocking info note so the
     *  implication (e.g. ASIL HW-metric requirements that SIL does not
     *  mirror) stays visible. */
    integrityRank: { 'QM': 0,
        'ASIL-A': 1, 'ASIL-B': 2, 'ASIL-C': 3, 'ASIL-D': 4,
        'SIL-1':  1, 'SIL-2':  2, 'SIL-3':  3, 'SIL-4':  4 },

    integrityFamily(level) {
        const l = String(level || '').trim();
        if (/^ASIL-/.test(l)) return 'asil';
        if (/^SIL-/.test(l))  return 'sil';
        return 'qm';
    },

    /** Does a child integrity level satisfy a parent's?
     *  Returns { ok, crossFamily, decomposed }:
     *    ok          child rank >= parent rank (SIL-2 satisfies ASIL-B,
     *                not ASIL-C; a higher child always satisfies)
     *    crossFamily ok via the SIL<->ASIL convention — show the
     *                non-blocking info note
     *    decomposed  child rank < parent rank — insufficient downtrace
     *                (a WARNING: legitimate under ISO 26262-9
     *                decomposition, but the user must have done it
     *                deliberately) */
    integritySatisfies(childLevel, parentLevel) {
        const c = String(childLevel || '').trim(), p = String(parentLevel || '').trim();
        const cr = this.integrityRank[c], pr = this.integrityRank[p];
        if (pr == null || cr == null) return { ok: false, crossFamily: false, decomposed: false, crossCeiling: false };
        // Cross-standard ceiling (v1.6.1): toward a SIL parent, an ASIL
        // child's effective rank caps at 3 — literature places ASIL-D at
        // ~SIL-3, and SIL-4 sits ABOVE the automotive range. So ASIL-D
        // does NOT satisfy SIL-4 (and no decomposition can fix that —
        // it is a different standard's ceiling, not a rank shortfall),
        // while ASIL-D under SIL-3 still satisfies (with the info note).
        const effective = (this.integrityFamily(p) === 'sil' &&
                           this.integrityFamily(c) === 'asil')
            ? Math.min(cr, 3) : cr;
        const ok = effective >= pr;
        const crossCeiling = !ok && cr >= pr;   // raw rank reached, ceiling blocked it
        const crossFamily = ok && pr > 0 &&
            this.integrityFamily(c) !== this.integrityFamily(p);
        return { ok, crossFamily, decomposed: !ok && !crossCeiling, crossCeiling };
    },

    /**
     * Map a stored level value to a CSS modifier class for the badge.
     * QM         → asil-qm     ASIL-A..D → asil-a..d     SIL-1..4 → sil-1..4
     * Empty/unknown → '' (no modifier — base badge styling).
     */
    asilCssClass: function(val) {
        if (!val) return '';
        if (val === 'QM') return 'asil-qm';
        if (/^ASIL-[A-D]$/.test(val)) return 'asil-' + val.slice(5).toLowerCase();
        if (/^SIL-[1-4]$/.test(val))  return 'sil-'  + val.slice(4);
        return '';
    },

    /**
     * "High integrity" set used by validation rules that flag inspection-only
     * verification, mandate DC targets on safety mechanisms, etc. Both
     * frameworks' top two tiers are in here.
     */
    highIntegrityLevels: ['ASIL-C', 'ASIL-D', 'SIL-3', 'SIL-4'],

    // Verification methods
    verificationMethods: [
        { id: 'inspection',   label: 'Inspection',      allowedForHighAsil: false },
        { id: 'review',       label: 'Review',          allowedForHighAsil: true  },
        { id: 'analysis',     label: 'Analysis',        allowedForHighAsil: true  },
        { id: 'simulation',   label: 'Simulation',      allowedForHighAsil: true  },
        { id: 'test',         label: 'Test',            allowedForHighAsil: true  },
        { id: 'fault_inject', label: 'Fault injection', allowedForHighAsil: true  }
    ],

    // SMART attestations - user must confirm
    smartAttestations: [
        { id: 'specific',   label: 'Specific — one subject, one behavior, no compound clauses.' },
        { id: 'measurable', label: 'Measurable — envelope quantified, or "unbounded" explicit with rationale.' },
        { id: 'achievable', label: 'Achievable — envelope physically plausible for the allocated element.' },
        { id: 'relevant',   label: 'Relevant — traces to a declared upstream source.' },
        { id: 'timebound',  label: 'Time-bound — mode/event qualifier present, or explicit "ubiquitous".' }
    ]
};


/**
 * Grammar validator - checks a requirement statement and attributes.
 * Returns { errors: [...], warnings: [...], statement: "..." }
 */
class GrammarValidator {

    /**
     * Build the full shall-statement from structured inputs.
     */
    static buildStatement(req) {
        const cond = GRAMMAR.conditionals.find(c => c.id === req.conditional) || GRAMMAR.conditionals[0];
        const pred = GRAMMAR.predicates.find(p => p.id === req.predicate);
        if (!pred) return '';

        const subject = req.subject || '[subject]';

        // Build the prefix. Three cases:
        //   1. No state guard → existing behaviour (the conditional alone).
        //   2. State guard + no trigger → "While [guard], ".
        //   3. State guard + trigger → combined EARS pattern
        //      "While [guard], when [trigger], ". The trigger is always
        //      rendered as "when" in this case even if the conditional
        //      dropdown is set to "while"/"if"/etc., because EARS'
        //      combined pattern is specifically "While ..., when ...".
        //
        //   4. predicate === 'detect' has its own *body* shape (see the
        //      'detect' case below — the condition becomes a mid-sentence
        //      "when ... is detected" clause). The PREFIX rules are the
        //      same as every other predicate: state guard, conditional
        //      dropdown, or both. The author can produce e.g.:
        //        While charging, the system shall ignore update request
        //            when update request is detected within 10 ms.
        //      Note: prefer state words (While / During / Where) in the
        //      conditional dropdown for detect; event words (When / If
        //      / At) would clash with the synthesised "when ... is
        //      detected" clause.
        let prefix = '';
        const hasTrigger = req.conditional !== 'ubiquitous' && req.conditionalText;
        if (req.stateGuard) {
            prefix = `While ${req.stateGuard}, `;
            if (hasTrigger) prefix += `when ${req.conditionalText}, `;
        } else if (hasTrigger) {
            prefix = cond.prefix + req.conditionalText + ', ';
        }

        // Predicate-specific object rendering
        let body = '';
        switch (pred.id) {
            case 'compute':
                // Acceptance/black-box: "compute [output] from [input]"
                body = `compute ${req.output || '[output]'} from ${req.input || '[input]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'transform':
                // Element/HW: "transform [input] into [output]"
                body = `transform ${req.input || '[input]'} into ${req.output || '[output]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'process':
                body = `process ${req.input || '[input]'} into ${req.output || '[output]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'provide':
                body = `provide the capability ${req.capability || '[capability]'} to ${req.actor || '[actor]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'detect':
                // Render the body exactly as the user specified:
                //   "[reaction] when [condition] is detected within [time]"
                // Condition + reaction are stored separately on the
                // model; this is the only place they get glued
                // together, with the trigger clause sitting
                // mid-sentence (NOT in the prefix). The DC trailer is
                // appended at the end if present.
                {
                    const cnd = (req.condition || '[condition]').trim();
                    const trigger = /\bis detected\b/i.test(cnd) ? cnd : `${cnd} is detected`;
                    body = `${req.reaction || '[reaction]'} when ${trigger}`;
                    if (req.detectionTime) body += ` within ${req.detectionTime}`;
                    if (req.dcTarget)      body += ` (DC ${req.dcTarget})`;
                }
                break;
            case 'transition':
                body = `transition from ${req.fromState || '[fromState]'} to ${req.toState || '[toState]'} upon ${req.trigger || '[trigger]'}`;
                if (req.transitionTime) body += ` within ${req.transitionTime}`;
                break;
            case 'exhibit':
                body = `exhibit ${req.property || '[property]'} of ${req.value || '[value]'} ${req.unit || ''}`.trim();
                if (req.tolerance) body += ` ${req.tolerance}`;
                break;
            case 'conform':
                body = `conform to ${req.standard || '[standard]'}`;
                if (req.clause) body += ` ${req.clause}`;
                break;
            case 'interface':
                body = `define signal ${req.signalName || '[signal]'} on ${req.pin || '[pin]'}`;
                if (req.signalConsumer) body += ` for ${req.signalConsumer}`;
                body += ` as ${req.signalProperties || '[properties]'}`;
                if (req.signalTiming)  body += `, ${req.signalTiming}`;
                if (req.signalFailure) body += `; on failure ${req.signalFailure}`;
                break;
            case 'prohibit':
                body = `not ${req.prohibitedBehavior || '[prohibited behavior]'}`;
                if (req.boundingCondition) body += ` ${req.boundingCondition}`;
                break;
            case 'limit':
                body = `limit ${req.limitedQuantity || '[quantity]'} to ${req.limitBound || '[bound]'}`;
                break;
            case 'maintain':
                body = `maintain ${req.maintainedQuantity || '[quantity]'} at ${req.setpoint || '[setpoint]'}`;
                if (req.setpointTolerance) body += ` ${req.setpointTolerance}`;
                break;
            case 'indicate':
                body = `indicate ${req.information || '[information]'} to ${req.recipient || '[recipient]'}`;
                if (req.indicationLatency) body += ` within ${req.indicationLatency.replace(/^within\s+/i, '')}`;
                break;
            case 'transmit':
                body = `transmit ${req.message || '[message]'} on ${req.channel || '[channel]'}`;
                if (req.transmitTiming) body += ` ${req.transmitTiming}`;
                break;
            case 'store':
                body = `store ${req.dataStored || '[data]'} in ${req.storageMedium || '[medium]'}`;
                if (req.persistenceCondition) body += ` retaining across ${req.persistenceCondition.replace(/^retaining across\s+/i, '')}`;
                break;
        }

        // When the sentence has no conditional prefix the subject leads
        // the sentence and must be capitalised ("The system shall ...").
        // When a prefix is present ("When ...,", "While ...,") the
        // subject sits mid-sentence and stays lowercase. The subject
        // string is stored lowercase in the model regardless; this is
        // purely a render-time fix.
        const subjectOut = prefix
            ? subject
            : subject.charAt(0).toUpperCase() + subject.slice(1);
        return `${prefix}${subjectOut} shall ${body}.`;
    }

    /**
     * Validate a requirement object.
     * Returns { errors, warnings } arrays.
     */
    static validate(req, context) {
        const errors = [];
        const warnings = [];
        context = context || {};

        // 1. Predicate must be chosen
        if (!req.predicate) {
            errors.push('Predicate type not chosen.');
            return { errors, warnings };
        }

        const pred = GRAMMAR.predicates.find(p => p.id === req.predicate);
        if (!pred) {
            errors.push(`Unknown predicate type: ${req.predicate}`);
            return { errors, warnings };
        }

        // 2. Subject must be populated and (if context provides declaredSubjects) be one of them
        if (!req.subject) {
            errors.push('Subject is empty.');
        } else if (context.declaredSubjects && context.declaredSubjects.length > 0) {
            if (!context.declaredSubjects.includes(req.subject)) {
                errors.push(`Subject "${req.subject}" is not a declared element or function.`);
            }
        }

        // 3. Conditional text required if conditional is not ubiquitous
        if (req.conditional && req.conditional !== 'ubiquitous' && !req.conditionalText) {
            errors.push(`Conditional "${req.conditional}" chosen but no condition text provided.`);
        }

        // 4. Mandatory predicate fields must be filled
        pred.fields.forEach(f => {
            if (f.required && !req[f.id]) {
                errors.push(`Field "${f.label}" is required for predicate "${pred.label}".`);
            }
        });

        // 5. Forbidden words check across all free text
        const textBlobs = [
            req.conditionalText, req.stateGuard, req.input, req.output, req.capability, req.actor,
            req.envelope, req.condition, req.reaction, req.trigger,
            req.property, req.value, req.tolerance, req.standard, req.clause,
            req.prohibitedBehavior, req.boundingCondition, req.rationale,
            req.signalName, req.pin, req.signalProperties, req.signalConsumer, req.signalTiming, req.signalFailure,
            req.limitedQuantity, req.limitBound, req.maintainedQuantity, req.setpoint, req.setpointTolerance,
            req.information, req.recipient, req.indicationLatency,
            req.message, req.channel, req.transmitTiming,
            req.dataStored, req.storageMedium, req.persistenceCondition
        ].filter(Boolean).join(' ');

        // Statement-only scope: the unobservable-activity verbs are fine
        // in rationale prose ("to ensure the driver is warned"); they are
        // only forbidden inside the requirement statement itself.
        const statementBlobs = req.rationale
            ? textBlobs.replace(req.rationale, '')
            : textBlobs;
        GRAMMAR.forbiddenWords.forEach(fw => {
            const re = new RegExp(`\\b${fw.word.replace('.', '\\.')}\\b`, 'i');
            const haystack = fw.scope === 'statement' ? statementBlobs : textBlobs;
            if (re.test(haystack)) {
                warnings.push(`Forbidden word "${fw.word}": ${fw.reason}`);
            }
        });

        // Atomicity (v1.6.0): "and"/"or" inside a RESPONSE field suggests
        // two requirements glued together — warn, don't block. Deliberately
        // NOT applied to conditions/guards: a compound guard ("While A and
        // B") is legitimate EARS; a compound RESPONSE is not atomic.
        const responseFields = [
            ['output', req.output], ['reaction', req.reaction],
            ['capability', req.capability], ['information', req.information],
            ['limited quantity', req.limitedQuantity],
            ['maintained quantity', req.maintainedQuantity],
            ['message', req.message], ['data stored', req.dataStored],
            ['prohibited behavior', req.prohibitedBehavior]
        ];
        responseFields.forEach(([label, v]) => {
            if (v && /\b(and|or)\b/i.test(v)) {
                warnings.push(`Atomicity: "${label}" contains "and/or" — this looks like two requirements in one. Split them so each is individually traceable and testable.`);
            }
        });

        // 6. Rationale required
        if (!req.rationale || req.rationale.trim().length < 5) {
            errors.push('Rationale is empty or too short.');
        } else if (/^because it is required\.?$/i.test(req.rationale.trim())) {
            errors.push('Rationale is tautological.');
        }

        // 7. Verification method required (at least one)
        const verif = Array.isArray(req.verification)
            ? req.verification
            : (req.verification ? [req.verification] : []);
        if (verif.length === 0) {
            errors.push('Verification method not chosen.');
        }

        // 8. ASIL required (QM is explicit)
        if (!req.asil) {
            errors.push('ASIL not chosen (use "QM" if non-safety).');
        }

        // 9. Safety mechanism requirements need DC target and safe-state reference
        if (pred.isSafetyMechanism && req.asil && req.asil !== 'QM') {
            if (!req.dcTarget) warnings.push('Safety mechanism missing DC target.');
            if (!req.safeStateRef) warnings.push('Safety mechanism missing safe-state reference.');
        }

        // 10. Prohibition requirements cannot be verified by test ALONE
        if (pred.requiresAnalysisVerification &&
            verif.length === 1 && verif[0] === 'test') {
            warnings.push('Prohibition requirements should not be verified by test alone. Add analysis.');
        }

        // 11. High-integrity (ASIL C/D or SIL 3/4) + inspection-ONLY
        //     verification is flagged. Both frameworks treat their top
        //     tiers the same way for this purpose.
        if (GRAMMAR.highIntegrityLevels.includes(req.asil) &&
            verif.length === 1 && verif[0] === 'inspection') {
            warnings.push(`${req.asil} with inspection-only verification requires justification.`);
        }

        // 13. Allocation required, except where the subject IS the
        //     allocation: the acceptance chapter (subject "the system")
        //     and the FSC (subject is a declared Safety Actor, flagged by
        //     context.allocationOptional).
        if (!req.allocation && req.subject !== 'the system' && !context.allocationOptional) {
            warnings.push('No element allocation specified.');
        }

        // 14. SMART attestations all ticked
        GRAMMAR.smartAttestations.forEach(s => {
            if (!req.smart || !req.smart[s.id]) {
                errors.push(`SMART attestation "${s.label.split(' —')[0]}" not confirmed.`);
            }
        });

        return { errors, warnings };
    }
}
