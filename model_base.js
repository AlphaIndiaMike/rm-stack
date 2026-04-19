/**
 * model_base.js
 *
 * Core data classes. All serialize to/from plain JSON objects.
 * The document is the aggregation.
 */

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
        this.verification  = data.verification || '';
        this.passCriterion = data.passCriterion || '';
        this.asil          = data.asil || '';
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
        this.asil      = data.asil || 'QM';
        this.allocatedItemFunctions = data.allocatedItemFunctions || [];
    }
    static generateId() { return 'ELEM-' + Math.random().toString(36).substr(2, 5).toUpperCase(); }
    toJSON() { return Object.assign({}, this); }
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
        this.asil      = data.asil || 'QM';
        this.safeStates = data.safeStates || [];
        this.ftti      = data.ftti || '';
        this.emergencyInterval = data.emergencyInterval || '';
    }
    static generateId() { return 'SG-' + Math.random().toString(36).substr(2, 4).toUpperCase(); }
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


class InterfaceSpec {
    constructor(data) {
        data = data || {};
        this.id        = data.id || InterfaceSpec.generateId();
        this.name      = data.name || '';
        this.producer  = data.producer || '';
        this.consumer  = data.consumer || '';
        this.direction = data.direction || 'unidirectional';
        this.dataType  = data.dataType || '';
        this.range     = data.range || '';
        this.period    = data.period || '';
        this.jitter    = data.jitter || '';
        this.failureBehavior = data.failureBehavior || '';
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
 * The document - aggregates everything.
 */
class SyrsDocument {
    constructor(data) {
        data = data || {};
        this.schemaVersion = 1;
        this.discipline    = data.discipline || 'system';
        this.docClass      = data.docClass || 'complex';
        this.title         = data.title || 'Untitled System Requirements Specification';
        this.requirements  = (data.requirements || []).map(r => new Requirement(r));
        this.elements      = (data.elements || []).map(e => new Element(e));
        this.itemFunctions = (data.itemFunctions || []).map(f => new ItemFunction(f));
        this.safetyGoals   = (data.safetyGoals || []).map(g => new SafetyGoal(g));
        this.modes         = (data.modes || []).map(m => new Mode(m));
        this.interfaces    = (data.interfaces || []).map(i => new InterfaceSpec(i));
        this.assumptions   = (data.assumptions || []).map(a => new Assumption(a));
        this.checklistState = data.checklistState || {}; // { chapterId: { checkId: bool } }
        this.signoffs      = data.signoffs || {};         // { chapterId: { owner, timestamp } }
        this.createdAt     = data.createdAt || new Date().toISOString();
        this.modifiedAt    = data.modifiedAt || this.createdAt;
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
            modes: this.modes.map(m => m.toJSON()),
            interfaces: this.interfaces.map(i => i.toJSON()),
            assumptions: this.assumptions.map(a => a.toJSON()),
            checklistState: this.checklistState,
            signoffs: this.signoffs,
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
