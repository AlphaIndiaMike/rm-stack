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
        const state = this.doc.checklistBucket(this.doc.discipline, chapter.id);
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

    /** Total requirement count vs class budget. Unchanged — this is the
     *  "applies overall" number shown in the top bar. */
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

    /** Per-discipline budget. Sits next to the overall budget, it does
     *  not replace it.
     *
     *  Ceiling: the System discipline resolves to the document-class
     *  ceiling (the existing, happy-with-it number); the other three
     *  scale off it via DISCIPLINE_BUDGET_FACTORS (item 1/3, hw/sw 3x).
     *
     *  Count: requirements whose chapter is in this discipline's outline.
     *  The outline is the same partition the editor and exporter use, so
     *  the count matches exactly what the user can see and edit in that
     *  discipline's view. Chapters shared between disciplines (e.g.
     *  ch09_hsi in System/HW/SW, ch13_calibration in System/SW)
     *  count toward every discipline that surfaces them — consistent
     *  with the one-JSON-four-views rule: the budget is a view too. */
    disciplineBudgetStatus(disciplineId) {
        const systemMax =
            (CLASS_BUDGETS[this.doc.docClass] || CLASS_BUDGETS.complex).max;
        const factor = DISCIPLINE_BUDGET_FACTORS[disciplineId] != null
            ? DISCIPLINE_BUDGET_FACTORS[disciplineId]
            : 1;
        const max = Math.round(systemMax * factor);
        const chapterIds = new Set(
            (Chapters.outline(disciplineId) || []).map(c => c.id));
        const count = this.doc.requirements.filter(
            r => chapterIds.has(r.chapterId)).length;
        return {
            discipline: disciplineId,
            count,
            max,
            factor,
            overBudget: count > max,
            percent: max > 0 ? Math.round((count / max) * 100) : 0
        };
    }

    /** Budget status for every registered discipline, in outline order.
     *  Used by the right-pane summary to show the whole picture at a
     *  glance. */
    allDisciplineBudgets() {
        return Disciplines.all().map(d => ({
            id: d.id,
            label: d.label,
            ...this.disciplineBudgetStatus(d.id)
        }));
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
        // Declared Safety Actors are legitimate FSR subjects in the FSC:
        // an FSR allocated to "the driver" or "the ESC system" is not an
        // orphan. "the system" is always implicitly valid (handled below).
        const declaredActorNames = new Set(
            (this.doc.safetyActors || []).map(a => a.name).filter(Boolean));
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
                !declaredInterfaceNames.has(req.subject) &&
                !declaredActorNames.has(req.subject)) {
                push(req, `Subject "${req.subject}" not a declared element, interface, or safety actor`);
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
            (req.parentSystemReqs || []).forEach(id => {
                if (!declaredReqs.has(id)) push(req, `Parent System requirement ${id} not declared`);
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
        return this.doc.elementsForDiscipline(this.doc.discipline).map(el => {
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

    /** Does this element trace up to a declared Safety Goal through the
     *  requirement chain the data model is built on?
     *    TSR.parentAcceptanceReqs -> acceptance.parentFsrs -> FSR.parentSG
     *  A legacy direct parentSG on the TSR or the acceptance req also counts.
     *  This is the chain the Traceability matrix walks; the Element Coverage
     *  Diagnostic uses it so a complete chain clears the flag — and there is
     *  no phantom "no parent SG" the user cannot fix (a TSR has, by design,
     *  no direct parent-SG field). */
    elementTracesToSG(elementId) {
        const reqById = new Map(this.doc.requirements.map(r => [r.id, r]));
        const declaredSGs = new Set(this.doc.safetyGoals.map(g => g.id));
        const accTracesToSG = (acc) => {
            if (!acc) return false;
            if (acc.parentSG && declaredSGs.has(acc.parentSG)) return true; // legacy acc→SG
            return (acc.parentFsrs || []).some(fsrId => {
                const fsr = reqById.get(fsrId);
                return fsr && fsr.parentSG && declaredSGs.has(fsr.parentSG);
            });
        };
        return this.doc.requirementsForElement(elementId).some(r => {
            if (r.parentSG && declaredSGs.has(r.parentSG)) return true; // legacy TSR→SG
            return (r.parentAcceptanceReqs || []).some(accId => accTracesToSG(reqById.get(accId)));
        });
    }

    /** Requirements with validation errors/warnings. Skips requirements
     *  whose chapter is not in the active discipline's outline — those
     *  are either cross-discipline rows (one-JSON, many-views) or rows
     *  stranded by a removed chapter; either way they are not visible in
     *  this view, so flagging them here would be noise (and findChapter
     *  would hand validate() an empty subject context). */
    requirementIssues() {
        const issues = [];
        this.doc.requirements.forEach(req => {
            const chapter = findChapter(this.doc.discipline, req.chapterId);
            if (!chapter) return;
            const ctx = {
                declaredSubjects: this.doc.declaredSubjectsForChapter(chapter)
            };
            const { errors, warnings } = GrammarValidator.validate(req, ctx);
            if (errors.length || warnings.length) {
                issues.push({ id: req.id, errors, warnings });
            }
        });
        return issues;
    }

    /**
     * SW / HW input-coverage diagnostic. The System Technical Safety
     * Requirements (chapterId 'ch07_elements') are the upstream contract
     * for the HW-RS and SW-RS documents. This reports, per TSR:
     *   - its hwSwAllocation (hw / sw / both / — unset)
     *   - how many requirements in `targetChapterIds` derive from it
     *     (via parentSystemReqs back-reference)
     *   - a gap flag when the TSR is allocated to this discipline but
     *     nothing here derives from it.
     *
     * targetKind is 'sw' or 'hw'; targetChapterIds is the set of chapter
     * ids that count as "a derived requirement in this discipline".
     */
    /**
     * SW / HW input-coverage diagnostic — combined parent layer.
     *
     * The upstream contract for the SW-RS / HW-RS is BOTH System layers
     * that can carry a sub-domain portion:
     *   - ch05_acceptance  (black-box; where QM / non-safety parents live)
     *   - ch07_elements    (TSR white-box; where safety parents live)
     * ASPICE SWE.1/HWE.1 is full requirements engineering — safety and
     * non-safety together — so there is no safety/non-safety split; the
     * integrity (ASIL/SIL/QM) is an attribute on the requirement.
     *
     * Per System parent, this reports:
     *   - derivedCount: SW/HW requirements (in targetChapterIds) whose
     *     parentSystemReqs references it.
     *   - integrity inheritance: there is NO ASIL/SIL decomposition at
     *     the TSR→SW/HW hop, so a safety-classified parent (asil set and
     *     not 'QM') must have >=1 derived requirement carrying the EXACT
     *     same level. Strict equality — a higher child level does not
     *     satisfy a lower parent, ASIL and SIL never substitute.
     *
     * States (mutually exclusive, first match wins):
     *   gap          allocated to this discipline, nothing derives
     *   integrityGap derived req(s) exist but none inherits the parent's
     *                ASIL/SIL (safety parents only)
     *   advisory     no allocation set and nothing derives (cannot assess)
     *   covered      derived, and integrity inherited if safety
     *   notHere      not allocated here and nothing derives
     */
    systemReqDerivationCoverage(targetKind, targetChapterIds) {
        const allow = new Set(targetChapterIds || []);
        const parents = this.doc.requirements.filter(r =>
            r.chapterId === 'ch05_acceptance' ||
            r.chapterId === 'ch07_elements');
        return parents.map(p => {
            const derived = this.doc.requirements.filter(r =>
                allow.has(r.chapterId) &&
                Array.isArray(r.parentSystemReqs) &&
                r.parentSystemReqs.includes(p.id));
            const level = (p.asil || '').trim();
            const isSafety = level !== '' && level !== 'QM';
            const integrityInherited = !isSafety ||
                derived.some(r => (r.asil || '').trim() === level);
            const alloc = (p.hwSwAllocation || '').toLowerCase();
            const allocatedHere = alloc === targetKind || alloc === 'both';
            const allocUnset = !alloc;
            const layer = p.chapterId === 'ch07_elements'
                ? 'TSR' : 'Acceptance';

            let state;
            if ((allocatedHere || derived.length > 0) && derived.length === 0) {
                state = 'gap';
            } else if (derived.length > 0 && !integrityInherited) {
                state = 'integrityGap';
            } else if (derived.length === 0 && allocUnset) {
                state = 'advisory';
            } else if (derived.length > 0) {
                state = 'covered';
            } else {
                state = 'notHere';
            }

            return {
                id: p.id,
                layer,
                statement: GrammarValidator.buildStatement(p) || '(incomplete)',
                asil: level || 'QM',
                isSafety,
                allocation: alloc || '—',
                allocatedHere,
                allocUnset,
                derivedCount: derived.length,
                integrityInherited,
                state,
                // legacy flags kept so existing widgets keep working
                gap: state === 'gap',
                advisory: state === 'advisory'
            };
        });
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
     * Timing crosscheck. Every transition that has a governing FTTI must
     * complete within it. A transition obtains a governing FTTI in one of
     * two ways (see governingFttiForTransition):
     *   - its explicit Safety Goal link (author's direct choice), or
     *   - the Safety Goal(s) guarding the safe state its target realises
     *     (tightest FTTI wins; legacy SG.safeStates link still honoured).
     * Transitions with neither are skipped — there is nothing to check.
     *
     * Both transitionTime and ftti are run through Timing.parseMs so
     * "1 s" / "1000 ms" / "1000" all compare correctly.
     */
    timingCrosscheck() {
        const issues = [];
        const trans = this.doc.modeTransitions || [];

        trans.forEach(t => {
            const gov = governingFttiForTransition(this.doc, t);
            if (gov.ms === null) return;                          // no governing FTTI: nothing to check
            const where = gov.source === 'link'
                ? `linked Safety Goal "${gov.sg.name || gov.sg.id}"`
                : `safe state "${this._safeStateLabelForTransition(t)}"`;
            if (isNaN(gov.ms)) {                                  // goal chosen but its FTTI is unparseable
                issues.push({ kind: 'ftti-unparseable', tId: t.id,
                    text: `Transition ${t.id}: governing FTTI "${gov.text}" is not a parseable duration.` });
                return;
            }
            const ttMs = Timing.parseMs(t.transitionTime);
            if (ttMs == null) {
                issues.push({ kind: 'ttime-missing', tId: t.id,
                    text: `Transition ${t.id} has a governing FTTI (${Timing.formatMs(gov.ms)}, from ${where}) but no transition time; it cannot be checked.` });
            } else if (isNaN(ttMs)) {
                issues.push({ kind: 'ttime-unparseable', tId: t.id,
                    text: `Transition ${t.id}: time "${t.transitionTime}" not parseable as a duration.` });
            } else if (ttMs > gov.ms) {
                issues.push({ kind: 'ttime-over-ftti', tId: t.id,
                    text: `Transition ${t.id} takes ${Timing.formatMs(ttMs)} but its governing FTTI (from ${where}) is ${Timing.formatMs(gov.ms)}.` });
            }
        });
        return issues;
    }

    /** Best label for the safe state a transition's target realises (for
     *  diagnostic text only). */
    _safeStateLabelForTransition(t) {
        const ss = (this.doc.safeStates || []).find(s => (s.modeRefs || []).includes(t.toMode));
        return ss ? (ss.description || ss.id) : '';
    }

    /**
     * Timing-chain check. Each TimingChain decomposes one ModeTransition
     * into ordered hops with per-hop time budgets. The Σ of those budgets
     * must fit the transition's own time budget (transitionTime); where
     * the transition has none, fall back to the FTTI of the Safety Goal
     * governing the target safe state. Returns one result per chain:
     *   { chainId, name, status, budgetMs, budgetSource, sumMs,
     *     missingBudgets, dangling }
     * status:
     *   'no-transition' chain not anchored to a transition
     *   'no-budget'     transition has no transitionTime and no FTTI to use
     *   'incomplete'    one or more hop budgets missing/unparseable
     *   'over'          Σ of hop budgets exceeds the budget
     *   'ok'            fully specified and within budget
     */
    timingChainCheck() {
        const chains = this.doc.timingChains || [];
        const modes = this.doc.modes || [];
        const safeStates = this.doc.safeStates || [];
        const sgs = this.doc.safetyGoals || [];
        const resolveBudget = (tr) => {
            // Prefer the transition's own time budget.
            const tt = Timing.parseMs(tr.transitionTime);
            if (tt != null && !isNaN(tt)) return { ms: tt, src: 'transition time' };
            // Else the governing FTTI: the transition's explicit Safety Goal
            // link if set, otherwise the goal guarding the target safe state.
            const gov = governingFttiForTransition(this.doc, tr);
            if (gov.ms != null && !isNaN(gov.ms)) return { ms: gov.ms, src: 'FTTI' };
            return { ms: null, src: null };
        };
        return chains.map(ch => {
            const tr = (this.doc.modeTransitions || []).find(t => t.id === ch.modeTransitionId);
            let sumMs = 0, missingBudgets = 0, dangling = 0;
            (ch.segments || []).forEach(seg => {
                const found =
                    (seg.kind === 'element'    && (this.doc.elements   || []).some(e => e.id === seg.refId)) ||
                    (seg.kind === 'externalIf' && (this.doc.hsiSignals  || []).some(s => s.id === seg.refId)) ||
                    (seg.kind === 'internalIf' && (this.doc.interfaces  || []).some(i => i.id === seg.refId));
                if (!found) dangling++;
                const b = Timing.parseMs(seg.budget);
                if (b == null || isNaN(b)) missingBudgets++;
                else sumMs += b;
            });
            const budget = tr ? resolveBudget(tr) : { ms: null, src: null };
            let status;
            if (!tr)                                    status = 'no-transition';
            else if (budget.ms == null)                 status = 'no-budget';
            else if (missingBudgets > 0)                status = 'incomplete';
            else if (sumMs > budget.ms)                 status = 'over';
            else                                        status = 'ok';
            return {
                chainId: ch.id, name: ch.name || ch.id, status,
                budgetMs: budget.ms, budgetSource: budget.src,
                sumMs, missingBudgets, dangling
            };
        });
    }

    /**
     * Safe-state reaction timing check. A safe-state REACTION is a
     * transition FROM a non-safe (operational / hazardous) state INTO a
     * safe state — the fault reaction whose detect-and-react path must
     * complete within FTTI. A transition between two safe states is not a
     * reaction and is intentionally excluded (it has nothing to detect),
     * so it never raises a spurious "no detecting element" warning.
     * "Safe" is DERIVED from the mode (Mode.isSafeState, or a SafeState
     * that references the mode) — not a separate checkbox.
     */
    safeStateTransitionCheck() {
        const issues = [];
        const modes = this.doc.modes || [];
        const safeStates = this.doc.safeStates || [];
        const sgs = this.doc.safetyGoals || [];
        const isSafe = (m) => !!(m && (m.isSafeState || safeStates.some(s => (s.modeRefs || []).includes(m.id))));
        const reaches = (t) => {
            const toMode = modes.find(m => m.id === t.toMode);
            const fromMode = modes.find(m => m.id === t.fromMode);
            if (!toMode) return false;
            return isSafe(toMode) && !isSafe(fromMode);
        };
        (this.doc.modeTransitions || [])
            .filter(reaches)
            .forEach(t => {
                const toMode = modes.find(m => m.id === t.toMode);
                const ss = safeStates.find(s => (s.modeRefs || []).includes(t.toMode));
                const ssLabel = ss ? (ss.description || ss.id)
                                   : (toMode ? (toMode.name || toMode.id) : t.toMode);
                let fttiMs = null;
                // Explicit transition→Safety Goal link wins (author's direct
                // choice); otherwise fall back to the tightest FTTI among the
                // goals guarding the realised safe state.
                if (t.safetyGoalRef) {
                    const linked = sgs.find(sg => sg.id === t.safetyGoalRef);
                    const ms = linked ? Timing.parseMs(linked.ftti) : null;
                    if (typeof ms === 'number' && !isNaN(ms)) fttiMs = ms;
                }
                if (fttiMs == null && ss) {
                    const ms = sgs
                        .filter(sg => (sg.safeStates || []).includes(ss.id) || (ss.sgRefs || []).includes(sg.id))
                        .map(sg => Timing.parseMs(sg.ftti))
                        .filter(v => typeof v === 'number' && !isNaN(v));
                    if (ms.length) fttiMs = Math.min.apply(null, ms);
                }
                const ttMs = Timing.parseMs(t.transitionTime);
                if (fttiMs == null) {
                    issues.push({ kind: 'no-ftti', tId: t.id,
                        text: `Safe-state transition ${t.id} (→ ${ssLabel}) has no governing FTTI — link the target safe state to a Safety Goal with an FTTI to time-check it.` });
                } else if (ttMs == null) {
                    issues.push({ kind: 'ttime-missing', tId: t.id,
                        text: `Safe-state transition ${t.id} has no transition time; FTTI ${Timing.formatMs(fttiMs)} cannot be checked.` });
                } else if (isNaN(ttMs)) {
                    issues.push({ kind: 'ttime-unparseable', tId: t.id,
                        text: `Safe-state transition ${t.id}: time "${t.transitionTime}" is not a parseable duration.` });
                } else if (ttMs > fttiMs) {
                    issues.push({ kind: 'ttime-over-ftti', tId: t.id,
                        text: `Safe-state transition ${t.id} takes ${Timing.formatMs(ttMs)} but the governing FTTI for "${ssLabel}" is ${Timing.formatMs(fttiMs)}.` });
                }
            });
        return issues;
    }

    /**
     * Hazardous states without a safe-state reaction. A non-safe
     * (operational / hazardous) mode from which NO transition path reaches
     * any safe state is a trap — the system can enter it but can never be
     * driven to a safe state. This is the warning about the ACTUAL
     * dangerous states (as opposed to flagging transitions between two safe
     * states). Reachability is multi-hop, so an operational → degraded →
     * safe path is correctly accepted.
     */
    hazardousStatesWithoutSafeReaction() {
        const modes = this.doc.modes || [];
        const trans = this.doc.modeTransitions || [];
        const safeStates = this.doc.safeStates || [];
        const isSafe = (m) => !!(m && (m.isSafeState || safeStates.some(s => (s.modeRefs || []).includes(m.id))));
        const adj = new Map();
        modes.forEach(m => adj.set(m.id, []));
        trans.forEach(t => { if (adj.has(t.fromMode)) adj.get(t.fromMode).push(t.toMode); });
        const reachesSafe = (start) => {
            const seen = new Set([start]);
            const queue = [start];
            while (queue.length) {
                const cur = queue.shift();
                for (const nxt of (adj.get(cur) || [])) {
                    const nm = modes.find(m => m.id === nxt);
                    if (nm && isSafe(nm)) return true;
                    if (!seen.has(nxt)) { seen.add(nxt); queue.push(nxt); }
                }
            }
            return false;
        };
        const issues = [];
        modes.filter(m => !isSafe(m)).forEach(m => {
            if (!reachesSafe(m.id)) {
                issues.push({ kind: 'no-safe-reaction', modeId: m.id,
                    text: `Hazardous mode "${m.name || m.id}" has no transition path into any safe state — no safe-state reaction is defined for it.` });
            }
        });
        return issues;
    }
}
