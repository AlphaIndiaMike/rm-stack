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
            id: 'process',
            label: 'Process / Compute / Transform',
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
            // ATOMIC detect. The template renders only the detection
            // behaviour — "detect [condition] within [detectionTime]".
            // The *reaction* to a detected condition is a SEPARATE
            // requirement (author it with `transition` or `provide`)
            // that traces to this one as its parent. The old template
            // "[condition] and [reaction]" fused two behaviours with
            // two distinct timing budgets into one non-atomic
            // statement; that is fixed here.
            id: 'detect',
            label: 'Detect / Monitor condition',
            verb: 'detect',
            kind: 'functional',
            template: '[condition] within [detectionTime]',
            fields: [
                { id: 'condition',     label: 'Condition detected', required: true },
                { id: 'detectionTime', label: 'Detection time',     required: true, hint: 'e.g. ≤50 ms — must leave room for the reaction within FTTI' },
                { id: 'dcTarget',      label: 'DC target',          required: false, hint: 'e.g. ≥90% (for safety mechanisms)' }
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
                { id: 'signalTiming',     label: 'Timing',            required: false, hint: 'e.g. 10 ms period, on-change' },
                { id: 'signalFailure',    label: 'Failure behaviour', required: false, hint: 'e.g. hold last value, default to 0' }
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
        { word: 'as required',  reason: 'Not specified. Give a condition.' }
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
        let prefix = '';
        const hasTrigger = req.conditional !== 'ubiquitous' && req.conditionalText;
        if (req.stateGuard) {
            prefix = `While ${req.stateGuard}, `;
            if (hasTrigger) {
                prefix += `when ${req.conditionalText}, `;
            }
        } else if (hasTrigger) {
            prefix = cond.prefix + req.conditionalText + ', ';
        }

        // Predicate-specific object rendering
        let body = '';
        switch (pred.id) {
            case 'process':
                body = `process ${req.input || '[input]'} into ${req.output || '[output]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'provide':
                body = `provide the capability ${req.capability || '[capability]'} to ${req.actor || '[actor]'}`;
                if (req.envelope) body += ` ${req.envelope}`;
                break;
            case 'detect':
                body = `detect ${req.condition || '[condition]'}`;
                if (req.detectionTime) body += ` within ${req.detectionTime}`;
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
                body = `define signal ${req.signalName || '[signal]'} on ${req.pin || '[pin]'} as ${req.signalProperties || '[properties]'}`;
                if (req.signalTiming)  body += `, ${req.signalTiming}`;
                if (req.signalFailure) body += `; on failure ${req.signalFailure}`;
                break;
            case 'prohibit':
                body = `not ${req.prohibitedBehavior || '[prohibited behavior]'}`;
                if (req.boundingCondition) body += ` ${req.boundingCondition}`;
                break;
        }

        return `${prefix}${subject} shall ${body}.`;
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
            req.envelope, req.condition, req.trigger,
            req.property, req.value, req.tolerance, req.standard, req.clause,
            req.prohibitedBehavior, req.boundingCondition, req.rationale,
            req.signalName, req.pin, req.signalProperties, req.signalTiming, req.signalFailure
        ].filter(Boolean).join(' ');

        GRAMMAR.forbiddenWords.forEach(fw => {
            const re = new RegExp(`\\b${fw.word.replace('.', '\\.')}\\b`, 'i');
            if (re.test(textBlobs)) {
                warnings.push(`Forbidden word "${fw.word}": ${fw.reason}`);
            }
        });

        // 6. Rationale required
        if (!req.rationale || req.rationale.trim().length < 5) {
            errors.push('Rationale is empty or too short.');
        } else if (/^because it is required\.?$/i.test(req.rationale.trim())) {
            errors.push('Rationale is tautological.');
        }

        // 7. Verification method required
        if (!req.verification) {
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

        // 10. Prohibition requirements cannot be verified by test alone
        if (pred.requiresAnalysisVerification && req.verification === 'test') {
            warnings.push('Prohibition requirements should not be verified by test alone. Add analysis.');
        }

        // 11. High-integrity (ASIL C/D or SIL 3/4) + inspection-only
        //     verification is flagged. Both frameworks treat their top
        //     tiers the same way for this purpose.
        if (GRAMMAR.highIntegrityLevels.includes(req.asil) && req.verification === 'inspection') {
            warnings.push(`${req.asil} with inspection-only verification requires justification.`);
        }

        // 13. Allocation required (except for acceptance chapter where subject is "the system")
        if (!req.allocation && req.subject !== 'the system') {
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
