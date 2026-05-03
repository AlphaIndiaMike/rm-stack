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
        editorView.currentChapter = null;
        editorView.currentElement = null;
        renderAll();
    });

    document.getElementById('exportTxtButton').addEventListener('click', () => {
        Exporter.exportTxt(doc);
    });

    document.getElementById('exportPdfButton').addEventListener('click', () => {
        Exporter.exportPdf(doc);
    });

    document.getElementById('saveJsonButton').addEventListener('click', () => {
        Persistence.save(doc);
    });

    const loadInput = document.getElementById('loadJsonInput');
    document.getElementById('loadJsonButton').addEventListener('click', () => loadInput.click());
    loadInput.addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const loaded = await Persistence.load(file);
            doc = loaded;
            outlineView.setDocument(doc);
            editorView.setDocument(doc);
            summaryView.setDocument(doc);
            document.getElementById('docClassSelect').value = doc.docClass;
            document.getElementById('disciplineSelect').value = doc.discipline;
            editorView.currentChapter = null;
            editorView.currentElement = null;
            renderAll();
        } catch (err) {
            alert('Failed to load file: ' + err.message);
        }
        loadInput.value = '';
    });

    // --- Initial render ---
    renderAll();
});

function onChapterSelected(chapterId, elementId) {
    editorView.load(chapterId, elementId);
    outlineView.setActive(chapterId, elementId);
    renderAll();
}

function onModelChanged() {
    renderAll();
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
    if (actions) actions.classList.toggle('d-none', !inEditor);
    if (header)  header.classList.toggle('d-none', !inEditor);

    // Update budget counter in top bar
    const validator = new DocumentValidator(doc);
    const s = validator.budgetStatus();
    const counter = document.getElementById('budgetCounter');
    counter.textContent = `${s.count} / ${s.max}`;
    counter.className = 'badge ' + (s.overBudget ? 'bg-danger' : s.percent > 80 ? 'bg-warning text-dark' : 'bg-secondary');
    counter.title = `Total committed requirements (${s.count}) vs the document-class ceiling (${s.max}). Going over budget is the cue to split into HW-RS / SW-RS documents.`;
}
