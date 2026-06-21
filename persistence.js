/**
 * persistence.js
 *
 * Load/save the document. Browser-side only (no server).
 *
 * File format & extension
 * -----------------------
 * The on-disk format is JSON, but the tool's own extension is `.rms`
 * (Requirement-Studio project). Files are saved as
 * `snake_case(projectName)_YYYY-MM-DD.rms` and the Load dialog filters
 * to `.rms`. The single source of truth is `Persistence.EXT` /
 * `Persistence.MIME` — change them in one place to retune. Content is
 * unchanged from the previous JSON files, so an old `.json` export can
 * still be loaded if the user picks "all files"; only the default
 * filter and the produced extension changed.
 *
 * Project name & filename
 * -----------------------
 * A project carries a top-level `projectName`. If unnamed, `save` opens
 * the name modal first. The same modal (`Persistence.promptName`) backs
 * the project-pill rename, so naming and renaming share one dialog.
 *
 * No migration layer
 * ------------------
 * Development-stage project; the SyrsDocument constructor is defensive
 * about missing/legacy fields. A missing `projectName` reads as unnamed.
 */

class Persistence {

    // Single source of truth for the project file format.
    static get EXT()  { return 'rms'; }                         // Requirement-Studio project
    static get MIME() { return 'application/json'; }            // contents are JSON

    /**
     * Save the document. If unnamed, prompt for a name first (modal),
     * then download. If already named, download immediately (no friction).
     * `onNamed` (optional) is called after a name is freshly set so the
     * caller can refresh the header pill.
     */
    static save(doc, onNamed) {
        if (!doc.projectName || !doc.projectName.trim()) {
            Persistence.promptName(doc.projectName, 'Name this project', 'Save Project').then(name => {
                if (name == null) return;          // cancelled — abort save
                doc.projectName = name.trim();
                if (typeof onNamed === 'function') onNamed(doc.projectName);
                Persistence._download(doc);
            });
            return;
        }
        Persistence._download(doc);
    }

    /** Pure filename composition: snake_case(name)_YYYY-MM-DD.rms.
     *  Separated from _download so it is testable without the DOM. */
    static fileName(doc, date) {
        const d = date || new Date().toISOString().substring(0, 10);
        const base = Persistence.snakeCase(doc && doc.projectName) || 'untitled';
        return `${base}_${d}.${Persistence.EXT}`;
    }

    /** Build the file and trigger the browser download. */
    static _download(doc) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        const blob = new Blob([json], { type: Persistence.MIME });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = Persistence.fileName(doc);
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
     * Modal asking for / editing the project name. Resolves with the
     * entered name, or null if cancelled. Reused by both Save (unnamed
     * project) and the project-pill rename, so the two share one dialog.
     * `title` and `ctaLabel` let the caller word it for either flow.
     */
    static promptName(current, title, ctaLabel) {
        return new Promise(resolve => {
            const existing = document.getElementById('nameModal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'nameModal';
            overlay.className = 'export-modal-overlay';
            overlay.innerHTML = `
                <div class="export-modal-box" role="dialog" aria-modal="true" aria-labelledby="nameModalTitle">
                    <div class="export-modal-header">
                        <span id="nameModalTitle" class="export-modal-title">${title || 'Name this project'}</span>
                        <button class="export-modal-close" title="Cancel" aria-label="Close">✕</button>
                    </div>
                    <div class="export-modal-body">
                        <p class="export-modal-hint">
                            The name is stored in the project file and used for the
                            download filename (<code>snake_case_date.${Persistence.EXT}</code>).
                        </p>
                        <input type="text" id="projectNameInput" class="name-modal-input"
                               placeholder="e.g. Front Radar ECU" value="${(current || '').replace(/"/g, '&quot;')}"
                               autocomplete="off" spellcheck="false">
                        <div class="name-modal-preview" id="nameModalPreview"></div>
                        <div class="name-modal-actions">
                            <button class="btn-add" id="nameCancelBtn">Cancel</button>
                            <button class="btn-add btn-generate" id="nameSaveBtn">${ctaLabel || 'Save Project'}</button>
                        </div>
                    </div>
                </div>`;

            const input   = overlay.querySelector('#projectNameInput');
            const preview = overlay.querySelector('#nameModalPreview');
            const saveBtn = overlay.querySelector('#nameSaveBtn');

            const refreshPreview = () => {
                const base = Persistence.snakeCase(input.value) || 'untitled';
                const date = new Date().toISOString().substring(0, 10);
                preview.textContent = `${base}_${date}.${Persistence.EXT}`;
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
