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

    /** Orphan report - requirements referencing undeclared things. */
    orphanReport() {
        const orphans = [];
        const declaredElements = new Set(this.doc.elements.map(e => e.name));
        const declaredFunctions = new Set(this.doc.itemFunctions.map(f => f.id));
        const declaredSGs = new Set(this.doc.safetyGoals.map(g => g.id));

        this.doc.requirements.forEach(req => {
            // Subject must be declared (or "the system")
            if (req.subject && req.subject !== 'the system' && !declaredElements.has(req.subject)) {
                orphans.push({ id: req.id, issue: `Subject "${req.subject}" not a declared element` });
            }
            // parentSG if present must resolve
            if (req.parentSG && !declaredSGs.has(req.parentSG)) {
                orphans.push({ id: req.id, issue: `Parent SG "${req.parentSG}" not declared` });
            }
        });

        return orphans;
    }

    /** Item function coverage: how many acceptance requirements trace to each. */
    itemFunctionCoverage() {
        return this.doc.itemFunctions.map(fn => {
            const tracedAcceptance = this.doc.requirements.filter(r =>
                r.chapterId === 'ch05_acceptance' && r.source && r.source.includes(fn.id)
            ).length;
            const tracedElement = this.doc.requirements.filter(r =>
                r.chapterId === 'ch07_elements' && r.source && r.source.includes(fn.id)
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

    /** Safety Goal coverage end-to-end. */
    safetyGoalCoverage() {
        return this.doc.safetyGoals.map(sg => {
            const hasFsr = this.doc.requirements.some(r => r.chapterId === 'ch04_fsc' && r.parentSG === sg.id);
            const hasAcceptance = this.doc.requirements.some(r => r.chapterId === 'ch05_acceptance' && r.parentSG === sg.id);
            const hasElement = this.doc.requirements.some(r => r.chapterId === 'ch07_elements' && r.parentSG === sg.id);
            return {
                id: sg.id,
                name: sg.name,
                asil: sg.asil,
                ftti: sg.ftti,
                hasFsr,
                hasAcceptance,
                hasElement,
                complete: hasFsr && hasAcceptance && hasElement
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
}
