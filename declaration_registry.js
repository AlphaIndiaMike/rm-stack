/**
 * declaration_registry.js
 *
 * A "declaration kind" is a row-table editor for a given list on the
 * SyrsDocument (elements, interfaces, modes, safety goals, ...). Each
 * declaration kind lives in its own file under declarations/ and calls
 * Declarations.register(kind, config).
 *
 * A declaration config is:
 *   title          shown above the table
 *   sectionHelp    optional explanatory paragraph
 *   singular       label for the "+ Add ..." button
 *   helpHeaders    { 'Header text': 'tooltip body' }
 *   headers        array of column headers
 *   gridCols       CSS grid-template-columns string for the row layout
 *   getList        doc => array of items
 *   add            doc => void (mutates doc, no return)
 *   remove         (doc, id) => void
 *   updateFromRow  (doc, id, rowEl) => void  — called on every keystroke
 *   commitFromRow  (doc, id, rowEl) => void  — optional, called on blur
 *                  / Enter / select change. Lexicon banking goes here,
 *                  never in updateFromRow.
 *   renderRow      item => HTML string for one row's cells
 *   postRender     (rowEl, item, doc, refresh) => void  — optional;
 *                  used to mount sub-widgets (multi-select, expand
 *                  button, etc.) after the row HTML is in place.
 *
 * Chapters list the kinds they want by string name in their
 * declarations array: Chapters.register('system', { ..., declarations:
 * ['element', 'interface'] }).
 */

const Declarations = (() => {
    const _byKind = {};
    return {
        register(kind, config) {
            if (!kind) throw new Error('register: kind required');
            if (_byKind[kind]) {
                console.warn(`Declarations.register: overwriting "${kind}"`);
            }
            _byKind[kind] = config;
        },
        get(kind) { return _byKind[kind] || null; },
        kinds()    { return Object.keys(_byKind); }
    };
})();
