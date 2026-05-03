/**
 * persistence.js
 *
 * Load/save the document as JSON. Browser-side only (no server).
 *
 * No migration layer
 * ------------------
 * This is a development-stage project; saved files don't need to be
 * forward-compatible with prior schema versions. The SyrsDocument
 * constructor is defensive about missing/legacy fields anyway —
 * idCounters seed from existing IDs, lexicon defaults to empty arrays,
 * old single-letter ASIL values are normalized via migrateAsilValue —
 * so a "migrate" step that just re-tags the schema version was pure
 * ceremony and has been removed. If a real schema break ever lands,
 * reintroduce a migration here.
 */

class Persistence {

    static save(doc) {
        const json = JSON.stringify(doc.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        a.href = url;
        a.download = `syrs-${doc.discipline}-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
