/**
 * main.js
 *
 * Entry point. Wires the three panes, the top bar, persistence.
 */

let doc;
let outlineView, editorView, summaryView;

document.addEventListener('DOMContentLoaded', () => {

    // --- Initial document ---
    doc = new SyrsDocument({ discipline: 'system', docClass: 'complex' });

    // --- Views ---
    outlineView = new OutlineView(doc, onChapterSelected);
    editorView  = new EditorView(doc, onModelChanged);
    summaryView = new SummaryView(doc);

    // --- Top bar wiring ---
    document.getElementById('docClassSelect').value = doc.docClass;
    document.getElementById('disciplineSelect').value = doc.discipline;

    document.getElementById('docClassSelect').addEventListener('change', e => {
        doc.docClass = e.target.value;
        onModelChanged();
    });

    document.getElementById('disciplineSelect').addEventListener('change', e => {
        // For V1 only 'system' is enabled; future versions swap the outline here
        doc.discipline = e.target.value;
        editorView.currentChapter = null;
        editorView.currentElement = null;
        renderAll();
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

    document.getElementById('resetButton').addEventListener('click', () => {
        if (!confirm('Reset all content? Unsaved changes will be lost.')) return;
        doc = new SyrsDocument({ discipline: 'system', docClass: 'complex' });
        outlineView.setDocument(doc);
        editorView.setDocument(doc);
        summaryView.setDocument(doc);
        editorView.currentChapter = null;
        editorView.currentElement = null;
        renderAll();
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

    // Update budget counter in top bar
    const validator = new DocumentValidator(doc);
    const s = validator.budgetStatus();
    const counter = document.getElementById('budgetCounter');
    counter.textContent = `${s.count} / ${s.max}`;
    counter.className = 'badge ' + (s.overBudget ? 'bg-danger' : s.percent > 80 ? 'bg-warning text-dark' : 'bg-secondary');
}
