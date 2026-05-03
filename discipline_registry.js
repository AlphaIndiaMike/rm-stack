/**
 * discipline_registry.js
 *
 * Central registry for the four disciplines (System, Item, Hardware,
 * Software). Each discipline file (disciplines/system.js etc.) calls
 * Disciplines.register({...}) once; chapter files call Chapters.register
 * (chapter_registry.js) to attach themselves to a discipline.
 *
 * The dropdown in the top bar reads from Disciplines.all().
 *
 * Data model rule: disciplines are *views* over a single SyrsDocument.
 * The same JSON file holds every discipline's content; chapter IDs are
 * the partition key for requirements / checklist state. Switching the
 * dropdown swaps the outline; nothing in the document data is gated
 * by discipline.
 */

const Disciplines = (() => {
    const _byId = {};

    return {
        register(spec) {
            if (!spec || !spec.id) throw new Error('Discipline needs id');
            _byId[spec.id] = {
                id: spec.id,
                label: spec.label || spec.id,
                shortLabel: spec.shortLabel || spec.label || spec.id,
                order: spec.order != null ? spec.order : 99,
                enabled: spec.enabled !== false,
                description: spec.description || ''
            };
        },

        get(id) { return _byId[id] || null; },

        all() {
            return Object.values(_byId).sort((a, b) =>
                (a.order || 99) - (b.order || 99));
        },

        ids() { return Object.keys(_byId); }
    };
})();
