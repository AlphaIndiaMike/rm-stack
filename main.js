/**
 * main.js
 *
 * Entry point. Wires the three panes, the top bar, persistence.
 */

let doc;
let outlineView, editorView, summaryView;

document.addEventListener('DOMContentLoaded', () => {

    // Custom tooltip layer — replaces native `title` with an instant,
    // cursor-following bubble. Reads from any element that already
    // carries `title` or `data-tip`. Single global instance lives for
    // the lifetime of the page.
    new TooltipManager();

    // --- Unsaved-changes guard ---------------------------------------
    // `dirty` is true whenever the in-memory document has edits not yet
    // written to a saved .json. It is set on every model change, cleared
    // on save and on load (a freshly loaded file matches its own file),
    // and consulted by the beforeunload handler below so the browser
    // warns before the user loses work. Module-scope so onModelChanged,
    // the save button and the load handler can all reach it.
    let dirty = false;
    const markDirty = () => { dirty = true; };
    const markClean = () => { dirty = false; };
    window.__markDirty = markDirty;   // reached by onModelChanged (top-level fn)
    window.__markClean = markClean;

    // Native confirmation on tab/window close or reload, only when there
    // are unsaved changes. Per the HTML spec the browser shows its own
    // generic prompt; preventDefault + returnValue is the cross-browser
    // incantation that triggers it. No dialog appears when `dirty` is
    // false, so a saved project closes without friction.
    window.addEventListener('beforeunload', e => {
        if (!dirty) return;
        e.preventDefault();
        e.returnValue = '';   // required by Chrome/Edge to show the prompt
        return '';
    });

    // --- Initial document ---
    doc = new SyrsDocument({ discipline: 'system', docClass: 'complex' });

    // --- Views ---
    outlineView = new OutlineView(doc, onChapterSelected);
    editorView  = new EditorView(doc, onModelChanged);
    summaryView = new SummaryView(doc);

    // --- Top bar wiring ---
    document.getElementById('docClassSelect').value = doc.docClass;

    // Populate the discipline dropdown from the Disciplines registry.
    // Each discipline file (disciplines/*.js) registered itself at load
    // time. Disabled disciplines are still shown but greyed out so the
    // user can see what's coming. The dropdown's value is the discipline
    // id which doc.discipline carries; switching reloads only the
    // outline (the document data stays the same — one JSON, four views).
    const disciplineSelect = document.getElementById('disciplineSelect');
    disciplineSelect.innerHTML = '';
    Disciplines.all().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.label;
        opt.disabled = !d.enabled;
        if (d.description) opt.title = d.description;
        disciplineSelect.appendChild(opt);
    });
    disciplineSelect.value = doc.discipline;

    document.getElementById('docClassSelect').addEventListener('change', e => {
        doc.docClass = e.target.value;
        onModelChanged();
    });

    document.getElementById('disciplineSelect').addEventListener('change', e => {
        // One JSON, four views. Switching the discipline swaps the
        // outline that drives the left pane; the underlying document
        // data is shared (Safety Goals declared in System show up in
        // Item, HW components in System Ch.5 show up in HW chapters,
        // etc.). The chapter selection is cleared because chapter ids
        // may differ between disciplines.
        doc.discipline = e.target.value;
        selectDefaultChapterOrWelcome(false);
        recordContext(editorView.currentChapter ? editorView.currentChapter.id : null,
                      editorView.currentElement ? editorView.currentElement.id : null);
        renderAll();
    });

    document.getElementById('exportTxtButton').addEventListener('click', () => {
        Exporter.exportTxt(doc);
    });

    document.getElementById('exportPdfButton').addEventListener('click', () => {
        Exporter.exportPdf(doc);
    });

    document.getElementById('saveJsonButton').addEventListener('click', () => {
        Persistence.save(doc, () => { refreshProjectNamePill(); markClean(); });
    });

    // Project pill — click (or Enter/Space) to name or rename the project
    // via the shared name modal. Renaming changes persisted data, so it
    // marks the document dirty; the pill updates immediately.
    const projectPill = document.getElementById('projectNamePill');
    const openRename = () => {
        const hasName = !!(doc.projectName && doc.projectName.trim());
        Persistence.promptName(doc.projectName,
            hasName ? 'Rename project' : 'Name this project',
            hasName ? 'Rename' : 'Save name').then(name => {
            if (name == null) return;                                   // cancelled
            if (name.trim() === (doc.projectName || '').trim()) return; // unchanged
            doc.projectName = name.trim();
            refreshProjectNamePill();
            markDirty();
        });
    };
    projectPill.addEventListener('click', openRename);
    projectPill.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRename(); }
    });

    const loadInput = document.getElementById('loadJsonInput');    document.getElementById('loadJsonButton').addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const loaded = await Persistence.load(file);
            // Preserve the discipline the user is currently viewing unless
            // the file carries a saved context that names one. A file with
            // no UI-context info must NOT yank the user to a default
            // discipline — keep them where they are and land on that
            // discipline's first input-bearing chapter.
            const currentDiscipline = doc ? doc.discipline : 'system';
            doc = loaded;
            if (doc.lastContext && doc.lastContext.discipline) {
                doc.discipline = doc.lastContext.discipline;
            } else {
                doc.discipline = currentDiscipline;
            }
            outlineView.setDocument(doc);
            editorView.setDocument(doc);
            summaryView.setDocument(doc);
            document.getElementById('docClassSelect').value = doc.docClass;
            document.getElementById('disciplineSelect').value = doc.discipline;
            refreshProjectNamePill();
            markClean();   // a just-loaded project matches its file on disk
            selectDefaultChapterOrWelcome(true);
            renderAll();
        } catch (err) {
            alert('Failed to load file: ' + err.message);
        }
        loadInput.value = '';
    });

    // --- Pane collapse toggles ---
    // Above 959px: both panes are always visible in the grid; toggle
    // buttons are hidden by CSS and clicks are no-ops.
    // Below 960px / portrait: panes become fixed off-canvas drawers.
    // A backdrop is injected so tapping outside closes the drawer.
    const paneWrap = document.querySelector('.three-pane-container');

    // Inject a single shared backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'pane-backdrop';
    paneWrap.appendChild(backdrop);

    const narrowMq = window.matchMedia(
        '(max-width: 959px), (max-aspect-ratio: 3/4)');
    let leftVisible  = false;
    let rightVisible = false;

    function applyPaneClasses() {
        const narrow = narrowMq.matches;
        paneWrap.classList.toggle('show-left',  narrow && leftVisible);
        paneWrap.classList.toggle('show-right', narrow && rightVisible);
        document.getElementById('toggleLeftPane')
            .classList.toggle('active', narrow && leftVisible);
        document.getElementById('toggleRightPane')
            .classList.toggle('active', narrow && rightVisible);
    }

    function closeAll() {
        leftVisible  = false;
        rightVisible = false;
        applyPaneClasses();
    }

    document.getElementById('toggleLeftPane').addEventListener('click', () => {
        if (!narrowMq.matches) return;        // no-op on wide screens
        leftVisible  = !leftVisible;
        rightVisible = false;                 // only one drawer at a time
        applyPaneClasses();
    });
    document.getElementById('toggleRightPane').addEventListener('click', () => {
        if (!narrowMq.matches) return;
        rightVisible = !rightVisible;
        leftVisible  = false;
        applyPaneClasses();
    });

    // Backdrop tap closes whichever drawer is open
    backdrop.addEventListener('click', closeAll);

    // Crossing the breakpoint (resize / rotate) resets to defaults
    const onRegimeChange = () => { closeAll(); };
    if (narrowMq.addEventListener) narrowMq.addEventListener('change', onRegimeChange);
    else if (narrowMq.addListener) narrowMq.addListener(onRegimeChange);
    applyPaneClasses();

    // --- Initial render ---
    refreshProjectNamePill();
    selectDefaultChapterOrWelcome(true);
    renderAll();
});

/**
 * Update the header project-name pill from the current document. Shows
 * the name when set; shows a muted "untitled" when unnamed.
 */
function refreshProjectNamePill() {
    const pill = document.getElementById('projectNamePill');
    if (!pill) return;
    const name = (doc && doc.projectName || '').trim();
    if (name) {
        pill.textContent = name;
        pill.classList.remove('unnamed');
        pill.title = 'Click to rename this project';
    } else {
        pill.textContent = 'untitled';
        pill.classList.add('unnamed');
        pill.title = 'Click to name this project';
    }
}

function onChapterSelected(chapterId, elementId) {
    editorView.load(chapterId, elementId);
    outlineView.setActive(chapterId, elementId);
    recordContext(chapterId, elementId);
    renderAll();
}

function onModelChanged() {
    // Any edit makes the in-memory document diverge from the last saved
    // file; the beforeunload guard relies on this flag.
    if (window.__markDirty) window.__markDirty();
    renderAll();
}

/**
 * Snapshot the current editing context onto the document so it persists
 * with the project file and can be restored on the next load. Called on
 * every chapter/element/discipline change.
 */
function recordContext(chapterId, elementId) {
    if (!doc) return;
    doc.lastContext = {
        discipline: doc.discipline,
        chapterId: chapterId || null,
        elementId: elementId || null
    };
}

/**
 * First chapter in a discipline's outline where the user actually does
 * input — one that has requirement authoring (allowsRequirements),
 * declaration tables (declarations), or per-element expansion
 * (autoExpand). This skips pure front-matter / scope / governance-only
 * chapters, landing on e.g. Item Definition for Item (declarations)
 * rather than the Functional Safety Concept (first allowsRequirements)
 * or the front-matter checklist. Falls back to outline[0] if nothing
 * qualifies.
 */
function firstEditableChapter(disciplineId) {
    const outline = Chapters.outline(disciplineId) || [];
    return outline.find(c =>
        c.allowsRequirements ||
        (c.declarations && c.declarations.length) ||
        c.autoExpand
    ) || outline[0] || null;
}

/**
 * Decide what the centre pane shows when the context changes (startup,
 * discipline switch, project load):
 *   - empty document   → no chapter selected → WelcomePanel shows.
 *   - has data + valid saved lastContext → restore it (the chapter, and
 *                        the element if it still exists).
 *   - has data, no/invalid saved context → first EDITABLE chapter
 *                        (allowsRequirements), not front-matter/checklist.
 *
 * Minimum-viable back-compat: a file with no lastContext (older save)
 * simply lands on the first editable chapter.
 *
 * `useSavedContext` is true on project load/boot (restore), false on a
 * manual discipline switch (the saved context belongs to another
 * discipline, so we pick that discipline's first editable chapter).
 */
function selectDefaultChapterOrWelcome(useSavedContext) {
    if (WelcomePanel.isDocumentEmpty(doc)) {
        editorView.currentChapter = null;
        editorView.currentElement = null;
        outlineView.setActive(null, null);
        return;
    }

    const outline = Chapters.outline(doc.discipline) || [];

    // Try to restore a saved context that belongs to the active discipline.
    if (useSavedContext && doc.lastContext &&
        doc.lastContext.discipline === doc.discipline &&
        doc.lastContext.chapterId) {
        const ctx = doc.lastContext;
        const chapterExists = outline.some(c => c.id === ctx.chapterId);
        if (chapterExists) {
            // Validate the element still exists if one was recorded.
            let elementId = ctx.elementId;
            if (elementId && !(doc.elements || []).some(e => e.id === elementId)) {
                elementId = null;
            }
            editorView.load(ctx.chapterId, elementId);
            outlineView.setActive(ctx.chapterId, elementId);
            return;
        }
    }

    // Fall back: first chapter the user can actually edit.
    const target = firstEditableChapter(doc.discipline);
    if (target) {
        editorView.load(target.id, null);
        outlineView.setActive(target.id, null);
        recordContext(target.id, null);
    } else {
        editorView.currentChapter = null;
        editorView.currentElement = null;
    }
}

function renderAll() {
    outlineView.render(document.getElementById('outlineContainer'));
    editorView.render(
        document.getElementById('editorContainer'),
        document.getElementById('chapterTitle'),
        document.getElementById('chapterCompleteness')
    );
    summaryView.render(document.getElementById('summaryContainer'));

    // Top-bar Load/Save and the center pane-header are only meaningful
    // once a chapter is open; before that, the welcome panel takes over.
    const inEditor = !!editorView.currentChapter;
    const actions = document.getElementById('topBarActions');
    const header  = document.getElementById('chapterPaneHeader');
    if (actions) actions.classList.toggle('hidden', !inEditor);
    if (header)  header.classList.toggle('d-none', !inEditor); // Bootstrap d-none still loaded via CDN — OK

    // Update the outline-pane completeness badge: how many of the selected
    // discipline's outline chapters are GREEN (checklists fully done — the
    // same rule that colours the outline). Deliberately NOT a requirement
    // count: budgets and the cost estimate make requirements feel
    // expensive; completeness must reward chapters turning green instead.
    const validator = new DocumentValidator(doc);
    const ds = validator.disciplineCompleteness(doc.discipline);
    const counter = document.getElementById('budgetCounter');
    counter.textContent = `${ds.percent} %`;
    counter.className = ds.percent >= 100 ? 'budget-badge ok' : ds.percent >= 50 ? 'budget-badge warn' : 'budget-badge over';
    const discLabel = (Disciplines.get(doc.discipline) || {}).label || doc.discipline;
    counter.title = `Completeness of the ${discLabel} discipline: ${ds.green} of ${ds.total} outline chapters are green (chapter checklist fully done — the same rule that colours the outline). Requirement counts don't raise this number; they only raise cost. Budgets are in the right-pane Requirement Budget panel.`;
}
