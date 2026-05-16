/**
 * validator.js
 *
 * Document-level integrity and coverage checks. Produces the flags
 * rendered in the right-pane summary and in the outline pane.
 */

class DocumentValidator {

    constructor(doc) {
        this.doc = doc;
    }

    /** Completeness percentage for a chapter (0-100). */
    chapterCompleteness(chapter) {
        if (!chapter) return 0;
        const state = this.doc.checklistState[chapter.id] || {};
        const total = (chapter.checklist || []).length;
        if (total === 0) return 100;
        const done = chapter.checklist.filter(c => state[c.id]).length;
        return Math.round((done / total) * 100);
    }

    /** Traffic light color based on completeness and content count. */
    chapterStatus(chapter) {
        const pct = this.chapterCompleteness(chapter);
        if (pct >= 100) return 'green';
        if (pct >= 50)  return 'orange';
        return 'red';
    }

    /** Total requirement count vs class budget. */
    budgetStatus() {
        const total = this.doc.requirements.length;
        const budget = CLASS_BUDGETS[this.doc.docClass] || CLASS_BUDGETS.complex;
        return {
            count: total,
            max: budget.max,
            overBudget: total > budget.max,
            percent: Math.round((total / budget.max) * 100)
        };
    }

    /** Orphan report — requirements referencing undeclared things.
     *  Names are resolved through `doc.nameForId` so the badge in the
     *  right-pane summary shows e.g. "Avoid runaway" rather than
     *  "SG-0001". Dangling refs still display the original ID so the
     *  user can locate the broken pointer. */
    orphanReport() {
        const orphans = [];
        const declaredElementNames = new Set(this.doc.elements.map(e => e.name));
        const declaredElementIds   = new Set(this.doc.elements.map(e => e.id));
        // Declared interfaces are also legitimate subjects: an interface-
        // definition (HSI) requirement says "the CAN_PT shall define
        // signal X ..." where the subject is the interface itself.
        const declaredInterfaceNames = new Set(
            (this.doc.interfaces || []).map(i => i.name).filter(Boolean));
        const declaredFunctions    = new Set(this.doc.itemFunctions.map(f => f.id));
        const declaredSGs          = new Set(this.doc.safetyGoals.map(g => g.id));
        const declaredModes        = new Set(this.doc.modes.map(m => m.id));
        const declaredSafeStates   = new Set((this.doc.safeStates || []).map(s => s.id));
        const declaredReqs         = new Set(this.doc.requirements.map(r => r.id));

        const push = (req, issue) => orphans.push({ id: req.id, issue });

        this.doc.requirements.forEach(req => {
            // Subject must be declared: "the system", a declared element,
            // a declared interface (HSI requirements), or the literal
            // "the HSI" the generator falls back to when a signal has
            // no parent interface.
            if (req.subject &&
                req.subject !== 'the system' &&
                req.subject !== 'the HSI' &&
                !declaredElementNames.has(req.subject) &&
                !declaredInterfaceNames.has(req.subject)) {
                push(req, `Subject "${req.subject}" not a declared element or interface`);
            }
            // parentSG if present must resolve
            if (req.parentSG && !declaredSGs.has(req.parentSG)) {
                push(req, `Parent SG "${this.doc.nameForId(req.parentSG)}" not declared`);
            }
            // safeStateRef if present must resolve to a declared SafeState
            if (req.safeStateRef && !declaredSafeStates.has(req.safeStateRef)) {
                push(req, `Safe state "${this.doc.nameForId(req.safeStateRef)}" not declared`);
            }
            // Structured array refs
            (req.parentFsrs || []).forEach(id => {
                if (!declaredReqs.has(id)) push(req, `Parent FSR ${id} not declared`);
            });
            (req.parentAcceptanceReqs || []).forEach(id => {
                if (!declaredReqs.has(id)) push(req, `Parent acceptance req ${id} not declared`);
            });
            (req.parentItemFunctions || []).forEach(id => {
                if (!declaredFunctions.has(id)) push(req, `Parent item function ${id} not declared`);
            });
            (req.modeApplicability || []).forEach(id => {
                if (!declaredModes.has(id)) push(req, `Mode applicability ${id} not declared`);
            });
            (req.allocation || []).forEach(id => {
                // Allocation entries can be element IDs (modern) or free-text labels (legacy).
                // Only flag when the value matches the ELEM-prefix pattern but not declared.
                if (/^ELEM-/.test(id) && !declaredElementIds.has(id)) {
                    push(req, `Allocated element ${id} not declared`);
                }
            });
            // Legacy: source field as space-separated IDs
            if (typeof req.source === 'string' && req.source.trim()) {
                req.source.split(/[\s,]+/).forEach(tok => {
                    if (!tok) return;
                    if (/^SG-/.test(tok)    && !declaredSGs.has(tok))       push(req, `Source SG ${tok} not declared`);
                    if (/^ITEMF-/.test(tok) && !declaredFunctions.has(tok)) push(req, `Source item function ${tok} not declared`);
                    if (/^ELEM-/.test(tok)  && !declaredElementIds.has(tok))push(req, `Source element ${tok} not declared`);
                    if (/^REQ-/.test(tok)   && !declaredReqs.has(tok))      push(req, `Source requirement ${tok} not declared`);
                });
            }
        });

        return orphans;
    }

    /** Item function coverage: how many acceptance / element requirements
     *  trace to each. Counts both the structured `parentItemFunctions`
     *  array (preferred) and a legacy `source` substring match so old
     *  data keeps working. */
    itemFunctionCoverage() {
        const has = (req, fnId) =>
            (Array.isArray(req.parentItemFunctions) && req.parentItemFunctions.includes(fnId))
            || (req.source && req.source.includes(fnId));
        return this.doc.itemFunctions.map(fn => {
            const tracedAcceptance = this.doc.requirements.filter(r =>
                r.chapterId === 'ch05_acceptance' && has(r, fn.id)
            ).length;
            const tracedElement = this.doc.requirements.filter(r =>
                r.chapterId === 'ch07_elements' && has(r, fn.id)
            ).length;
            return {
                id: fn.id,
                name: fn.name,
                acceptance: tracedAcceptance,
                element: tracedElement,
                covered: tracedAcceptance > 0
            };
        });
    }

    /** Safety Goal coverage end-to-end. Walks the structured parent
     *  chain: SG ← FSR (via parentSG); Acceptance ← FSR (via parentFsrs);
     *  Element ← Acceptance (via parentAcceptanceReqs). Falls back to
     *  legacy direct parentSG-on-everything for old data. */
    safetyGoalCoverage() {
        const reqs = this.doc.requirements;
        return this.doc.safetyGoals.map(sg => {
            const fsrs = reqs.filter(r =>
                r.chapterId === 'ch04_fsc' && r.parentSG === sg.id);
            const fsrIds = new Set(fsrs.map(r => r.id));
            const accReqs = reqs.filter(r =>
                r.chapterId === 'ch05_acceptance' && (
                    (Array.isArray(r.parentFsrs) && r.parentFsrs.some(id => fsrIds.has(id)))
                    || r.parentSG === sg.id  // legacy
                ));
            const accIds = new Set(accReqs.map(r => r.id));
            const elemReqs = reqs.filter(r =>
                r.chapterId === 'ch07_elements' && (
                    (Array.isArray(r.parentAcceptanceReqs) && r.parentAcceptanceReqs.some(id => accIds.has(id)))
                    || r.parentSG === sg.id  // legacy
                ));
            return {
                id: sg.id,
                name: sg.name,
                asil: sg.asil,
                ftti: sg.ftti,
                hasFsr:        fsrs.length > 0,
                hasAcceptance: accReqs.length > 0,
                hasElement:    elemReqs.length > 0,
                fsrCount:      fsrs.length,
                acceptanceCount: accReqs.length,
                elementCount:  elemReqs.length,
                complete: fsrs.length > 0 && accReqs.length > 0 && elemReqs.length > 0
            };
        });
    }

    /** Element coverage: requirement count, allocated function count. */
    elementCoverage() {
        return this.doc.elements.map(el => {
            const reqCount = this.doc.requirementsForElement(el.id).length;
            return {
                id: el.id,
                name: el.name,
                asil: el.asil,
                allocatedCount: (el.allocatedItemFunctions || []).length,
                reqCount: reqCount,
                overBudget: reqCount > 13,
                underBudget: reqCount < 4 && reqCount > 0,
                empty: reqCount === 0
            };
        });
    }

    /** Requirements with validation errors/warnings. */
    requirementIssues() {
        const issues = [];
        this.doc.requirements.forEach(req => {
            const ctx = {
                declaredSubjects: this.doc.declaredSubjectsForChapter(
                    findChapter(this.doc.discipline, req.chapterId)
                )
            };
            const { errors, warnings } = GrammarValidator.validate(req, ctx);
            if (errors.length || warnings.length) {
                issues.push({ id: req.id, errors, warnings });
            }
        });
        return issues;
    }

    /**
     * Forgotten transitions in the mode graph. Flags:
     *   - modes with no outbound transitions (terminal but not a safe state)
     *   - modes with no inbound transitions (unreachable)
     *   - safe states with no transition into any of their realizing modes
     */
    forgottenTransitions() {
        const issues = [];
        const modes = this.doc.modes || [];
        const trans = this.doc.modeTransitions || [];
        modes.forEach(m => {
            const outbound = trans.filter(t => t.fromMode === m.id).length;
            const inbound  = trans.filter(t => t.toMode   === m.id).length;
            if (outbound === 0 && !m.isSafeState) {
                issues.push({ kind: 'no-outbound', modeId: m.id,
                    text: `Mode "${m.name || m.id}" has no outbound transitions.` });
            }
            if (inbound === 0) {
                issues.push({ kind: 'unreachable', modeId: m.id,
                    text: `Mode "${m.name || m.id}" has no inbound transitions — unreachable.` });
            }
        });
        (this.doc.safeStates || []).forEach(ss => {
            const refs = ss.modeRefs || [];
            if (refs.length === 0) return; // separate checklist concern
            const reachable = refs.some(modeId =>
                trans.some(t => t.toMode === modeId));
            if (!reachable) {
                issues.push({ kind: 'safe-state-unreachable', ssId: ss.id,
                    text: `Safe state "${ss.description || ss.id}" has no transition into any of its realizing modes.` });
            }
        });
        return issues;
    }

    /**
     * Timing crosscheck. Every transition INTO a mode that realizes a
     * safe state must complete within the FTTI of any Safety Goal that
     * references that safe state. Returns a list of issues where the
     * transition time exceeds the SG's FTTI (or where one side is
     * unparseable, which is a less severe warning).
     *
     * Both transitionTime and ftti are run through Timing.parseMs so
     * "1 s" / "1000 ms" / "1000" all compare correctly.
     */
    timingCrosscheck() {
        const issues = [];
        const safeStates = this.doc.safeStates || [];
        const sgs        = this.doc.safetyGoals || [];
        const trans      = this.doc.modeTransitions || [];

        safeStates.forEach(ss => {
            const guardingSGs = sgs.filter(sg =>
                (sg.safeStates || []).includes(ss.id) ||
                (ss.sgRefs || []).includes(sg.id)
            );
            if (guardingSGs.length === 0) return;
            const tightestFttiMs = guardingSGs
                .map(sg => Timing.parseMs(sg.ftti))
                .filter(v => typeof v === 'number' && !isNaN(v))
                .reduce((a, b) => Math.min(a, b), Infinity);
            if (!isFinite(tightestFttiMs)) return;
            (ss.modeRefs || []).forEach(modeId => {
                trans.filter(t => t.toMode === modeId).forEach(t => {
                    const ttMs = Timing.parseMs(t.transitionTime);
                    if (ttMs == null) {
                        issues.push({ kind: 'ttime-missing', tId: t.id,
                            text: `Transition ${t.id} into safe-state mode has no transition time; FTTI ${Timing.formatMs(tightestFttiMs)} cannot be checked.` });
                    } else if (isNaN(ttMs)) {
                        issues.push({ kind: 'ttime-unparseable', tId: t.id,
                            text: `Transition ${t.id}: time "${t.transitionTime}" not parseable as a duration.` });
                    } else if (ttMs > tightestFttiMs) {
                        issues.push({ kind: 'ttime-over-ftti', tId: t.id,
                            text: `Transition ${t.id} takes ${Timing.formatMs(ttMs)} but FTTI for safe state "${ss.description || ss.id}" is ${Timing.formatMs(tightestFttiMs)}.` });
                    }
                });
            });
        });
        return issues;
    }
}
