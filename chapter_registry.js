/**
 * chapter_registry.js
 *
 * Each chapter file calls Chapters.register(disciplineId, chapterSpec)
 * once at load time. The editor never imports chapter content directly —
 * it asks the registry for the outline of the active discipline, and
 * for the spec of whatever chapter the user has selected.
 *
 * A chapter spec carries:
 *   id              stable identifier (also the partition key for
 *                   requirements written into this chapter and for
 *                   checklist state)
 *   number          display number ('1', '2', ...) shown in the outline
 *   title           display title
 *   order           sort order within the discipline's outline
 *   intro           one-sentence orientation shown at the top
 *   allowsRequirements (bool)
 *   subjectMode     'system' | 'element' | 'none' — constrains the
 *                   subject dropdown in the requirement builder
 *   requirementBudget { min, max } — optional warning targets
 *   declarations    array of declaration kinds (see declaration_registry).
 *                   The editor renders one table per kind.
 *   autoExpand      'elements' — expand into per-element leaves
 *   autoContent     'traceability' — render auto-generated content
 *   checklist       [{ id, text, help }]
 *   extraWidgets    function(doc, onChange, editor) → array of widget
 *                   instances. Each widget has render(container).
 *                   Used for chapter-specific tooling (mode simulator,
 *                   allocation matrix, HSI diagnostic, ...).
 *
 * Two disciplines may register the same chapter ID with different
 * outline metadata (title, order). They share the underlying data
 * (requirements with that chapterId, checklist state). That is the
 * "one JSON, four views" rule made concrete.
 */

const Chapters = (() => {
    const _byKey = {};         // `${disciplineId}:${chapterId}` → spec
    const _byDiscipline = {};  // disciplineId → array of chapter specs

    return {
        register(disciplineId, spec) {
            if (!disciplineId) throw new Error('register: disciplineId required');
            if (!spec || !spec.id) throw new Error('register: chapter.id required');
            const key = `${disciplineId}:${spec.id}`;
            _byKey[key] = spec;
            (_byDiscipline[disciplineId] ||= []).push(spec);
            // Re-sort on every insertion — number of chapters is small,
            // cost is negligible, and load order is no longer significant.
            _byDiscipline[disciplineId].sort((a, b) =>
                (a.order || 9999) - (b.order || 9999));
        },

        /** Get one chapter spec. */
        get(disciplineId, chapterId) {
            return _byKey[`${disciplineId}:${chapterId}`] || null;
        },

        /** Full ordered outline for a discipline. */
        outline(disciplineId) {
            return (_byDiscipline[disciplineId] || []).slice();
        }
    };
})();

/** Find a chapter by id within a discipline (back-compat shim — was a
 *  free function in outline.js; some validators still call it). */
function findChapter(disciplineId, chapterId) {
    return Chapters.get(disciplineId, chapterId);
}

/** Budget ceilings per document class.
 *
 *  v1.5.3: the anchor moved from System to ITEM, and the classes got
 *  size names instead of product names ("ADAS Platform" was a product,
 *  not a class). `max` is the ITEM-level requirement ceiling; the other
 *  disciplines derive from it via DISCIPLINE_BUDGET_FACTORS:
 *      Item = reference · System = 3×Item · HW = 3×System · SW = 3×System
 *  Legacy docClass values in old saves ('adas') are normalised on load
 *  (see SyrsDocument constructor). */
const CLASS_BUDGETS = {
    simple:   { max: 50,  label: 'Simple' },
    medium:   { max: 100, label: 'Medium' },
    advanced: { max: 150, label: 'Advanced' },
    complex:  { max: 300, label: 'Complex' }
};

/** Per-discipline requirement budgets, expressed as a factor of the
 *  ITEM ceiling (CLASS_BUDGETS[docClass].max).
 *
 *  Item is the reference (factor 1): the concept layer (Item Definition
 *  + HARA + FSC) is the smallest, most stable statement of the problem.
 *  Each refinement step multiplies by ~3:
 *
 *    item     1 — the reference ceiling, driven by the Class dropdown.
 *    system   3 — the System contract decomposes each concept-level
 *                 statement into roughly three system requirements.
 *    hardware 9 — 3× System: HW-RS decomposes the System contract into
 *    software 9   far more detail (component design, FMEDA, units, ...).
 *
 *  These are the initial limits and the single place to retune them.
 *  Edit a factor here; the validator and both budget readouts pick it
 *  up. A missing entry falls back to factor 1 (same as Item). */
const DISCIPLINE_BUDGET_FACTORS = {
    item:     1,
    system:   3,
    hardware: 9,
    software: 9
};

/** Development-cost estimate: EUR per requirement WORD, per discipline.
 *  Used by the right-pane "Budget Est." panel. The estimate is words of
 *  the built requirement statement × the owning discipline's rate,
 *  summed over all requirements (requirements only — declarations,
 *  diagnostics and other tooling don't cost into the product).
 *  This is the single place to retune the rates. */
const BUDGET_COST_RATES_EUR_PER_WORD = {
    item:     3000,
    system:   1000,
    hardware: 1000,
    software: 500
};
