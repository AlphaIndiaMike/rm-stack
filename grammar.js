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
            id: 'detect',
            label: 'Detect / Monitor / Respond',
            verb: 'detect',
            kind: 'functional',
            template: '[condition] and [reaction]',
            fields: [
                { id: 'condition',     label: 'Condition detected', required: true },
                { id: 'reaction',      label: 'Reaction',           required: true },
                { id: 'detectionTime', label: 'Detection time',     required: true, hint: 'e.g. ≤50 ms' },
                { id: 'reactionTime',  label: 'Reaction time',      required: true, hint: 'must be ≤ FTTI' },
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

    // ASIL levels
    asilLevels: ['QM', 'A', 'B', 'C', 'D'],

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
        let prefix = cond.prefix;
        if (req.conditional !== 'ubiquitous' && req.conditionalText) {
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
                body = `detect ${req.condition || '[condition]'} and ${req.reaction || '[reaction]'}`;
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
            req.conditionalText, req.input, req.output, req.capability, req.actor,
            req.envelope, req.condition, req.reaction, req.trigger,
            req.property, req.value, req.tolerance, req.standard, req.clause,
            req.prohibitedBehavior, req.boundingCondition, req.rationale
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

        // 11. ASIL C/D + inspection-only verification is flagged
        if ((req.asil === 'C' || req.asil === 'D') && req.verification === 'inspection') {
            warnings.push(`ASIL ${req.asil} with inspection-only verification requires justification.`);
        }

        // 12. Source required
        if (!req.source) {
            warnings.push('No upstream source referenced.');
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
