/**
 * persistence.js
 *
 * Load/save the document as JSON. Browser-side only (no server).
 *
 * Project name & filename
 * -----------------------
 * A project carries a top-level `projectName`. The save filename is
 * `snake_case(projectName)_YYYY-MM-DD.json`. If the project is unnamed
 * (empty `projectName`), `Persistence.save` opens a small modal asking
 * for the name first, stores it on the document, then downloads. Once a
 * name is set, subsequent saves download directly with no modal.
 *
 * No migration layer
 * ------------------
 * This is a development-stage project; saved files don't need to be
 * forward-compatible with prior schema versions. The SyrsDocument
 * constructor is defensive about missing/legacy fields anyway — a
 * missing `projectName` simply reads as unnamed. If a real schema break
 * ever lands, reintroduce a migration here.
 */

class Persistence {

    /**
     * Save the document. If unnamed, prompt for a name first (modal),
     * then download. If already named, download immediately (no friction).
     * `onNamed` (optional) is called after a name is freshly set so the
     * caller can refresh the header pill.
     */
    static save(doc, onNamed) {
        if (!doc.projectName || !doc.projectName.trim()) {
            Persistence._promptName(doc.projectName).then(name => {
                if (name == null) return;          // cancelled — abort save
                doc.projectName = name.trim();
                if (typeof onNamed === 'function') onNamed(doc.projectName);
                Persistence._download(doc);
            });
            return;
        }
        Persistence._download(doc);
    }

    /** Build the file and trigger the browser download. */
    static _download(doc) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().substring(0, 10);   // YYYY-MM-DD
        const base = Persistence.snakeCase(doc.projectName) || 'untitled';
        a.href = url;
        a.download = `${base}_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * snake_case a free-text project name:
     *   "My ADAS Project!" → "my_adas_project"
     * Lowercase, non-alphanumerics → underscore, collapse repeats, trim.
     */
    static snakeCase(s) {
        return String(s || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_{2,}/g, '_');
    }

    /**
     * Modal asking for the project name. Resolves with the entered name,
     * or null if cancelled. Styled with the shared modal classes.
     */
    static _promptName(current) {
        return new Promise(resolve => {
            const existing = document.getElementById('nameModal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'nameModal';
            overlay.className = 'export-modal-overlay';
            overlay.innerHTML = `
                <div class="export-modal-box" role="dialog" aria-modal="true" aria-labelledby="nameModalTitle">
                    <div class="export-modal-header">
                        <span id="nameModalTitle" class="export-modal-title">Name this project</span>
                        <button class="export-modal-close" title="Cancel" aria-label="Close">✕</button>
                    </div>
                    <div class="export-modal-body">
                        <p class="export-modal-hint">
                            The name is stored in the project file and used for the
                            download filename (<code>snake_case_date.json</code>).
                        </p>
                        <input type="text" id="projectNameInput" class="name-modal-input"
                               placeholder="e.g. Front Radar ECU" value="${(current || '').replace(/"/g, '&quot;')}"
                               autocomplete="off" spellcheck="false">
                        <div class="name-modal-preview" id="nameModalPreview"></div>
                        <div class="name-modal-actions">
                            <button class="btn-add" id="nameCancelBtn">Cancel</button>
                            <button class="btn-add btn-generate" id="nameSaveBtn">Save Project</button>
                        </div>
                    </div>
                </div>`;

            const input   = overlay.querySelector('#projectNameInput');
            const preview = overlay.querySelector('#nameModalPreview');
            const saveBtn = overlay.querySelector('#nameSaveBtn');

            const refreshPreview = () => {
                const base = Persistence.snakeCase(input.value) || 'untitled';
                const date = new Date().toISOString().substring(0, 10);
                preview.textContent = `${base}_${date}.json`;
                saveBtn.disabled = !input.value.trim();
            };

            const cleanup = (val) => { overlay.remove(); resolve(val); };

            overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(null); });
            overlay.querySelector('.export-modal-close').addEventListener('click', () => cleanup(null));
            overlay.querySelector('#nameCancelBtn').addEventListener('click', () => cleanup(null));
            saveBtn.addEventListener('click', () => {
                const v = input.value.trim();
                if (v) cleanup(v);
            });
            input.addEventListener('input', refreshPreview);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter' && input.value.trim()) cleanup(input.value.trim());
                if (e.key === 'Escape') cleanup(null);
            });

            document.body.appendChild(overlay);
            refreshPreview();
            input.focus();
            input.select();
        });
    }

    static load(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(new SyrsDocument(data));
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsText(file);
        });
    }
}
