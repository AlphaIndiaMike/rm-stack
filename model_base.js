/**
 * model_base.js
 *
 * Core data classes. All serialize to/from plain JSON objects.
 * The document is the aggregation.
 *
 * IDs
 * ---
 * IDs are stable handles. They use a discipline-wide prefix and a
 * zero-padded 4-digit sequential suffix (e.g. ITEMF-0007). The counter
 * is persisted in `doc.idCounters` so it survives save/load and never
 * collides on round-trip. Old random-suffix IDs (ITEMF-A1B2) loaded
 * from legacy files are preserved as-is; the counter seeds itself to
 * `max(numericSuffix, count) + 1` so newly-added items get clean
 * sequential IDs even alongside legacy ones.
 *
 * IDs are stored on every object. The UI displays *names* (rename-safe),
 * not IDs, but cross-object references in the JSON use IDs so a rename
 * never breaks a link.
 *
 * Lexicon
 * -------
 * `doc.lexicon` collects free-text values typed into structured
 * predicate slots (capability, actor, condition, ...) plus owners and
 * signoff names, so the next time the user types into the same kind
 * of slot they get autocomplete suggestions. Passive — never enforced.
 *
 * Writes happen ONLY at commit time (see SyrsDocument.addToLexicon).
 * Calling addToLexicon from an `input` handler instead of a commit
 * handler would store every keystroke as a lexicon entry; the
 * prefix-prune inside addToLexicon prevents that pollution from
 * persisting once a real commit lands.
 */

const ID_PREFIX = {
    requirement:    'REQ',
    itemFunction:   'ITEMF',
    mode:           'MODE',
    modeTransition: 'TR',
    assumption:     'AOU',
    safetyGoal:     'SG',
    safeState:      'SS',
    element:        'ELEM',
    interfaceSpec:  'IF',
    failureMode:    'FM'
};

/**
 * Migrate a legacy single-letter ASIL value to the prefixed form
 * introduced when SIL support landed. 'A'..'D' → 'ASIL-A'..'ASIL-D'.
 * 'QM' and already-prefixed values pass through unchanged. Empty/null
 * stay empty/null. Idempotent so it can run on every load.
 */
function migrateAsilValue(val) {
    if (!val) return val;
    if (/^[A-D]$/.test(val)) return 'ASIL-' + val;
    return val;
}

class Requirement {
    constructor(data) {
        data = data || {};
        this.id            = data.id || Requirement.generateId();
        this.chapterId     = data.chapterId || null;
        this.elementId     = data.elementId || null; // for Chapter 7 leaves
        this.conditional   = data.conditional || 'ubiquitous';
        this.conditionalText = data.conditionalText || '';
        this.subject       = data.subject || '';
        this.predicate     = data.predicate || '';
        // Predicate-specific fields (dynamically populated)
        this.input = data.input || '';
        this.output = data.output || '';
        this.capability = data.capability || '';
        this.actor = data.actor || '';
        this.envelope = data.envelope || '';
        this.condition = data.condition || '';
        this.reaction = data.reaction || '';
        this.detectionTime = data.detectionTime || '';
        this.reactionTime = data.reactionTime || '';
        this.dcTarget = data.dcTarget || '';
        this.fromState = data.fromState || '';
        this.toState = data.toState || '';
        this.trigger = data.trigger || '';
        this.transitionTime = data.transitionTime || '';
        this.property = data.property || '';
        this.value = data.value || '';
        this.unit = data.unit || '';
        this.tolerance = data.tolerance || '';
        this.standard = data.standard || '';
        this.clause = data.clause || '';
        this.prohibitedBehavior = data.prohibitedBehavior || '';
        this.boundingCondition = data.boundingCondition || '';
        // Attributes
        this.rationale     = data.rationale || '';
        this.source        = data.source || '';
        this.allocation    = data.allocation || [];
        // Structured upstream traceability (per-chapter attribute).
        // parentItemFunctions: array of ItemFunction IDs that this
        //   requirement realises. Used by validator.itemFunctionCoverage
        //   so the right-pane A:/E: counters reflect actual mappings
        //   rather than hoping the user typed the ID into Source.
        // parentFsrs: array of FSR (Ch.4) requirement IDs that this
        //   acceptance/element req traces from.
        // parentAcceptanceReqs: array of Ch.5 requirement IDs that
        //   this element req decomposes.
        this.parentItemFunctions = data.parentItemFunctions || [];
        this.parentFsrs          = data.parentFsrs || [];
        this.parentAcceptanceReqs= data.parentAcceptanceReqs || [];
        this.modeApplicability   = data.modeApplicability || [];
        this.warningStrategy     = data.warningStrategy || '';
        this.degradationStrategy = data.degradationStrategy || '';
        this.supervisionAssumption = data.supervisionAssumption || '';
        this.fttiContribution    = data.fttiContribution || '';
        this.verification  = data.verification || '';
        this.passCriterion = data.passCriterion || '';
        this.asil          = migrateAsilValue(data.asil || '');
        this.parentSG      = data.parentSG || '';
        this.ftti          = data.ftti || '';
        this.safeStateRef  = data.safeStateRef || '';
        this.modes         = data.modes || [];
        this.interfaceRefs = data.interfaceRefs || [];
        this.hwSwAllocation = data.hwSwAllocation || '';
        // SMART attestations
        this.smart = data.smart || { specific:false, measurable:false, achievable:false, relevant:false, timebound:false };
        // Status
        this.status        = data.status || 'draft';
        this.createdAt     = data.createdAt || new Date().toISOString();
        this.modifiedAt    = data.modifiedAt || this.createdAt;
    }

    /**
     * Fallback ID generator. Used only when an instance is constructed
     * outside the document factory (e.g. legacy code paths). Real IDs
     * are assigned by SyrsDocument.nextId(kind) at commit time.
     */
    static generateId() {
        return 'REQ-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    get statement() {
        return GrammarValidator.buildStatement(this);
    }

    toJSON() {
        return Object.assign({}, this);
    }
}


class Element {
    constructor(data) {
        data = data || {};
        this.id        = data.id || Element.generateId();
        this.name      = data.name || '';
        this.purpose   = data.purpose || '';
        this.asil      = migrateAsilValue(data.asil || 'QM');
        this.allocatedItemFunctions = data.allocatedItemFunctions || [];
        this.parentId  = data.parentId || '';
        this.quantity  = (data.quantity != null) ? data.quantity : 1;

        // Discipline discriminator. 'system' (default) is the System
        // breakdown view; 'hw' is the HW Components view (HW chapters);
        // 'sw' is the SW Units view (SW chapters). Each declaration
        // file (declarations/element.js, declarations/hwComponent.js,
        // declarations/swUnit.js) filters by this value so the same
        // doc.elements array serves all three disciplines without
        // duplication.
        this.componentKind = data.componentKind || 'system';

        // HW-specific fields. Filled in only on hw rows; ignored
        // elsewhere. Included on every Element instance so JSON shape
        // stays uniform (no schema migration when a system element is
        // re-classified as HW).
        this.partNumber  = data.partNumber  || '';
        this.failureRate = data.failureRate || 0;   // FIT (fail / 10⁹ h)

        // SW-specific.
        this.programmingLang = data.programmingLang || '';
    }
    static generateId() { return 'ELEM-' + Math.random().toString(36).substr(2, 5).toUpperCase(); }
    toJSON() {
        // _depth is a transient render-time tag (see elementsInTreeOrder)
        // and must not be persisted.
        const { _depth, ...rest } = this;
        return rest;
    }
}


class ItemFunction {
    constructor(data) {
        data = data || {};
        this.id        = data.id || ItemFunction.generateId();
        this.name      = data.name || '';
        this.description = data.description || '';
        this.activeModes = data.activeModes || [];
    }
    static generateId() { return 'ITEMF-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


class SafetyGoal {
    constructor(data) {
        data = data || {};
        this.id        = data.id || SafetyGoal.generateId();
        this.name      = data.name || '';
        this.hazardRef = data.hazardRef || '';
        this.asil      = migrateAsilValue(data.asil || 'QM');
        // safeStates: array of SafeState IDs (SS-xxxx) that realize this
        // goal's safe-state condition. Legacy projects stored free text
        // here — that text is preserved by the caller (UI legacy block)
        // for one release, then dropped.
        this.safeStates = data.safeStates || [];
        this.ftti      = data.ftti || '';
        this.emergencyInterval = data.emergencyInterval || '';
    }
    static generateId() { return 'SG-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


/**
 * SafeState — a named safe condition the system can be brought into.
 *
 * Sits *between* Safety Goals and Operating Modes in the conceptual
 * model: an SG references one or more SafeStates as its acceptable
 * fault-reaction targets, and each SafeState is realized by one or
 * more declared Modes (so the user can read the mode/state model
 * without leaving Chapter 3 — closes ISO 26262 Part 3 clause 7
 * "safe states cross-referenced to mode/state model").
 *
 *   description : prose — what is true while the system is here
 *   triggers    : the conditions that demand entry to this state
 *   modeRefs    : array of Mode IDs that realize this safe state
 *   sgRefs      : array of SG IDs that reference this safe state
 *
 * Bidirectional references are stored canonically here (mode-side and
 * SG-side mirror this on read). Editing from either end ends up here.
 */
class SafeState {
    constructor(data) {
        data = data || {};
        this.id          = data.id || SafeState.generateId();
        this.description = data.description || '';
        this.triggers    = data.triggers || '';
        this.modeRefs    = data.modeRefs || [];
        this.sgRefs      = data.sgRefs || [];
    }
    static generateId() { return 'SS-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


class Mode {
    constructor(data) {
        data = data || {};
        this.id        = data.id || Mode.generateId();
        this.name      = data.name || '';
        this.description = data.description || '';
        this.isSafeState = !!data.isSafeState;
    }
    static generateId() { return 'MODE-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


/**
 * ModeTransition — directed edge in the mode/state model.
 *
 *   fromMode / toMode : Mode IDs (or '' if not yet picked)
 *   trigger           : event/condition that fires the transition
 *   guard             : additional precondition (optional)
 *   transitionTime    : time budget for completing the transition
 *
 * Used for c6g of Chapter 6 ("Every mode transition has ID, source,
 * target, trigger.") and for cross-referencing FSR safe-state refs
 * against the actual transition graph at validation time.
 */
class ModeTransition {
    constructor(data) {
        data = data || {};
        this.id             = data.id || ModeTransition.generateId();
        this.fromMode       = data.fromMode || '';
        this.toMode         = data.toMode || '';
        this.trigger        = data.trigger || '';
        this.guard          = data.guard || '';
        this.transitionTime = data.transitionTime || '';
    }
    static generateId() { return 'TR-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


class InterfaceSpec {
    constructor(data) {
        data = data || {};
        this.id        = data.id || InterfaceSpec.generateId();
        this.name      = data.name || '';
        this.producer  = data.producer || '';
        this.consumer  = data.consumer || '';
        // direction: 'producer-to-consumer' | 'consumer-to-producer'
        //          | 'bidirectional'
        // (legacy 'unidirectional' is treated as producer-to-consumer)
        this.direction = data.direction || 'producer-to-consumer';
        // kind: 'data' (SW signal/message) or 'physical' (HW pin/bus/connector)
        this.kind      = data.kind || 'data';
        // Protocol or physical medium ('CAN', 'LIN', 'FlexRay', '12V supply', etc.)
        this.protocol  = data.protocol || '';
        this.dataType  = data.dataType || '';
        this.range     = data.range || '';
        this.unit      = data.unit || '';
        this.period    = data.period || '';
        this.jitter    = data.jitter || '';
        this.failureBehavior = data.failureBehavior || '';
        this.notes     = data.notes || '';
    }
    static generateId() { return 'IF-' + Math.random().toString(36).substr(2, 5).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


class Assumption {
    constructor(data) {
        data = data || {};
        this.id = data.id || Assumption.generateId();
        this.text = data.text || '';
        this.owner = data.owner || '';
        this.status = data.status || 'open';
        this.closureTarget = data.closureTarget || '';
    }
    static generateId() { return 'AOU-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


/**
 * FailureMode — one row of an FMEA / FMEDA. Belongs to a HW component.
 * Failure rate (λ in FIT) and diagnostic coverage feed PMHF / SPFM /
 * LFM computation per ISO 26262-5:8 + Annex F. Lives on doc.failureModes;
 * surfaced through declarations/failureMode.js.
 */
class FailureMode {
    constructor(data) {
        data = data || {};
        this.id                 = data.id || FailureMode.generateId();
        this.componentId        = data.componentId || '';      // ELEM-xxx
        this.description        = data.description || '';
        this.effect             = data.effect || '';
        this.failureRate        = data.failureRate || 0;        // FIT
        this.diagnosticCoverage = data.diagnosticCoverage || 0; // 0..1
        this.classification     = data.classification || '';    // safe / single-point / residual / multi-point latent / multi-point detected
        this.mitigation         = data.mitigation || '';        // safety mechanism reference
    }
    static generateId() { return 'FM-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
}


/**
 * The document - aggregates everything.
 */
class SyrsDocument {
    constructor(data) {
        data = data || {};
        this.schemaVersion = 3;
        this.discipline    = data.discipline || 'system';
        this.docClass      = data.docClass || 'complex';
        this.title         = data.title || 'Untitled System Requirements Specification';
        this.requirements  = (data.requirements || []).map(r => new Requirement(r));
        this.elements      = (data.elements || []).map(e => new Element(e));
        this.itemFunctions = (data.itemFunctions || []).map(f => new ItemFunction(f));
        this.safetyGoals   = (data.safetyGoals || []).map(g => new SafetyGoal(g));
        this.safeStates    = (data.safeStates || []).map(s => new SafeState(s));
        this.modes         = (data.modes || []).map(m => new Mode(m));
        this.modeTransitions = (data.modeTransitions || []).map(t => new ModeTransition(t));
        this.interfaces    = (data.interfaces || []).map(i => new InterfaceSpec(i));
        this.assumptions   = (data.assumptions || []).map(a => new Assumption(a));
        this.failureModes  = (data.failureModes || []).map(f => new FailureMode(f));
        this.checklistState = data.checklistState || {}; // { chapterId: { checkId: bool } }
        this.signoffs      = data.signoffs || {};         // { chapterId: { owner, timestamp } }

        // Persisted ID counters: { itemFunction: 7, mode: 3, ... }.
        // Seeded from existing IDs on load so new items continue the sequence.
        this.idCounters    = data.idCounters || {};

        // Persisted vocabulary for autocomplete. Categories cover predicate
        // slots and people-name fields. Adding a new category is safe; the
        // default-empty dance below will fill it in.
        this.lexicon       = data.lexicon || {};
        ['capabilities','actors','conditions','reactions','triggers',
         'inputs','outputs','properties','units','tolerances','standards',
         'fromStates','toStates','prohibitedBehaviors','boundingConditions',
         'owners','signoffNames','producers','consumers'].forEach(k => {
             if (!Array.isArray(this.lexicon[k])) this.lexicon[k] = [];
        });

        this.createdAt     = data.createdAt || new Date().toISOString();
        this.modifiedAt    = data.modifiedAt || this.createdAt;

        // Backfill counters from any existing IDs we already loaded.
        this._seedIdCounters();
    }

    /**
     * Seed every counter to (max-numeric-suffix-found, collection-size).
     * Legacy random-suffix IDs don't match the regex and are skipped, so
     * a freshly-seeded counter starts at the size of the collection.
     */
    _seedIdCounters() {
        const sources = [
            ['requirement',    this.requirements],
            ['itemFunction',   this.itemFunctions],
            ['mode',           this.modes],
            ['modeTransition', this.modeTransitions],
            ['assumption',     this.assumptions],
            ['safetyGoal',     this.safetyGoals],
            ['safeState',      this.safeStates],
            ['element',        this.elements],
            ['interfaceSpec',  this.interfaces],
            ['failureMode',    this.failureModes]
        ];
        sources.forEach(([kind, arr]) => {
            const prefix = ID_PREFIX[kind];
            let max = this.idCounters[kind] || 0;
            (arr || []).forEach(it => {
                if (!it || !it.id) return;
                const m = new RegExp('^' + prefix + '-(\\d+)$').exec(it.id);
                if (m) max = Math.max(max, parseInt(m[1], 10));
            });
            // Ensure counter is at least the current collection size, so
            // documents with legacy random IDs never re-issue 0001.
            this.idCounters[kind] = Math.max(max, (arr || []).length);
        });
    }

    /**
     * Allocate the next ID for `kind`. Persisted in idCounters so the
     * sequence survives save/load.
     */
    nextId(kind) {
        const prefix = ID_PREFIX[kind];
        if (!prefix) throw new Error('Unknown id kind: ' + kind);
        const next = (this.idCounters[kind] || 0) + 1;
        this.idCounters[kind] = next;
        return prefix + '-' + String(next).padStart(4, '0');
    }

    /**
     * Display name for any object referenced by ID. Falls back to the ID
     * if the target was deleted, so dangling references never render as
     * "(undefined)". Used by UI everywhere a name is shown for an ID.
     */
    nameForId(id) {
        if (!id) return '';
        const all = [
            ...this.itemFunctions, ...this.elements, ...this.safetyGoals,
            ...this.safeStates,
            ...this.modes, ...this.interfaces, ...this.assumptions,
            ...this.requirements
        ];
        const hit = all.find(x => x && x.id === id);
        if (!hit) return id; // dangling — show ID so user can debug
        // SafeState has no `name`; its description is the user-facing label.
        return hit.name || hit.text || hit.description || id;
    }

    /**
     * Add a value to a lexicon category for future autocomplete.
     *
     * Contract — call ONLY at commit time
     * -----------------------------------
     * Lexicon writes must happen on a discrete user commit (a Save button,
     * an Enter key, a structured commit handler) — never inside an `input`
     * event listener. Calling this on every keystroke pollutes the lexicon
     * with every prefix the user typed on the way to the real word
     * ("E", "En", "Env", ..., "Environment"), which then shows up in every
     * autocomplete dropdown forever.
     *
     * Defensive prune
     * ---------------
     * To make the contract self-healing, when adding `value` we also drop
     * any existing entries in the same category that are strict prefixes
     * of `value`. So if a callsite ever regresses and writes keystrokes
     * ("E", "En", "Env"), the very next genuine commit ("Environment")
     * cleans up its own trail.
     */
    addToLexicon(category, value) {
        if (!value) return;
        const v = String(value).trim();
        if (!v) return;
        if (!Array.isArray(this.lexicon[category])) this.lexicon[category] = [];
        // Drop any existing entry that is a strict prefix of `v` — those
        // are typing-trace pollution from a prior bug, or stale partial
        // commits superseded by this longer one.
        this.lexicon[category] = this.lexicon[category].filter(existing =>
            !(typeof existing === 'string'
              && existing.length < v.length
              && v.startsWith(existing))
        );
        if (!this.lexicon[category].includes(v)) this.lexicon[category].push(v);
    }

    /**
     * Mode ↔ Function helpers.
     *
     * The canonical store is `ItemFunction.activeModes` — a per-function
     * array of mode IDs that activate the function. The UI lets the user
     * edit this from either side (mode row picks functions, function row
     * picks modes); both sides go through these helpers so the storage
     * stays consistent and the diff logic lives in one place.
     */

    /** Functions whose activeModes contains modeId. */
    activeFunctionsForMode(modeId) {
        if (!modeId) return [];
        return this.itemFunctions
            .filter(f => (f.activeModes || []).includes(modeId))
            .map(f => f.id);
    }

    /**
     * Set the active-functions list for a given mode. Diffs the new list
     * against each function's current activeModes and adds/removes the
     * modeId only where it changes — never touches functions outside the
     * picker's option set.
     */
    setActiveFunctionsForMode(modeId, functionIds) {
        if (!modeId) return;
        const newSet = new Set(functionIds || []);
        this.itemFunctions.forEach(f => {
            const isNow = newSet.has(f.id);
            const has   = (f.activeModes || []).includes(modeId);
            if (isNow && !has) {
                f.activeModes = [...(f.activeModes || []), modeId];
            } else if (!isNow && has) {
                f.activeModes = (f.activeModes || []).filter(m => m !== modeId);
            }
        });
    }

    toJSON() {
        return {
            schemaVersion: this.schemaVersion,
            discipline: this.discipline,
            docClass: this.docClass,
            title: this.title,
            requirements: this.requirements.map(r => r.toJSON()),
            elements: this.elements.map(e => e.toJSON()),
            itemFunctions: this.itemFunctions.map(f => f.toJSON()),
            safetyGoals: this.safetyGoals.map(g => g.toJSON()),
            safeStates: this.safeStates.map(s => s.toJSON()),
            modes: this.modes.map(m => m.toJSON()),
            modeTransitions: this.modeTransitions.map(t => t.toJSON()),
            interfaces: this.interfaces.map(i => i.toJSON()),
            assumptions: this.assumptions.map(a => a.toJSON()),
            failureModes: this.failureModes.map(f => f.toJSON()),
            checklistState: this.checklistState,
            signoffs: this.signoffs,
            idCounters: this.idCounters,
            lexicon: this.lexicon,
            createdAt: this.createdAt,
            modifiedAt: new Date().toISOString()
        };
    }

    /** Requirements belonging to a specific chapter */
    requirementsForChapter(chapterId) {
        return this.requirements.filter(r => r.chapterId === chapterId);
    }

    /** Requirements belonging to a specific element (Chapter 7 leaves) */
    requirementsForElement(elementId) {
        return this.requirements.filter(r => r.elementId === elementId);
    }

    /**
     * Elements walked in tree order (parents before children, siblings
     * grouped). Each entry is the existing Element instance with a
     * transient `_depth` numeric tag for indentation. _depth is excluded
     * from toJSON so it never persists.
     *
     * Orphan handling: an element whose parentId points to a deleted
     * parent appears at root (depth 0) so it's never lost.
     */
    elementsInTreeOrder() {
        const byParent = new Map();
        this.elements.forEach(e => {
            const p = e.parentId || '';
            if (!byParent.has(p)) byParent.set(p, []);
            byParent.get(p).push(e);
        });
        const placed = new Set();
        const out = [];
        const visit = (parentId, depth) => {
            (byParent.get(parentId) || []).forEach(e => {
                e._depth = depth;
                placed.add(e.id);
                out.push(e);
                visit(e.id, depth + 1);
            });
        };
        visit('', 0);
        // Surface orphans (parent deleted) at the root, after the legit tree.
        this.elements.forEach(e => {
            if (!placed.has(e.id)) {
                e._depth = 0;
                out.push(e);
            }
        });
        return out;
    }

    /** Set of element IDs that descend from `elementId`, plus elementId
     *  itself. Used by the parent-picker to exclude self and descendants
     *  so cycles can't be introduced. */
    descendantsOf(elementId) {
        const out = new Set([elementId]);
        let grew = true;
        while (grew) {
            grew = false;
            this.elements.forEach(e => {
                if (e.parentId && out.has(e.parentId) && !out.has(e.id)) {
                    out.add(e.id);
                    grew = true;
                }
            });
        }
        return out;
    }

    /**
     * Subjects that can be referenced in shall-statements, given a chapter.
     */
    declaredSubjectsForChapter(chapter) {
        if (!chapter) return [];
        if (chapter.subjectMode === 'system') return ['the system'];
        if (chapter.subjectMode === 'element') {
            return this.elements.map(e => e.name).filter(Boolean);
        }
        return [];
    }
}
