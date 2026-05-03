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

/** Budget ceilings per document class. Lives here because the legacy
 *  outline.js used to define both, and the validator imports it. */
const CLASS_BUDGETS = {
    simple:  { max: 200, label: 'Simple' },
    complex: { max: 300, label: 'Complex' },
    adas:    { max: 400, label: 'ADAS Platform' }
};
