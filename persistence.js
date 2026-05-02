/**
 * persistence.js
 *
 * Load/save the document as JSON. Browser-side only (no server).
 * Schema versioning: if a loaded file has an older schemaVersion,
 * migrations could be chained here.
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
                    const migrated = Persistence.migrate(data);
                    const doc = new SyrsDocument(migrated);
                    resolve(doc);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsText(file);
        });
    }

    static migrate(data) {
        // Forward migrations live here as new schema versions ship.
        // The SyrsDocument constructor is defensive about missing fields
        // (idCounters, lexicon, safeStates) and seeds counters from
        // existing IDs, so each step below is mostly a tag bump — the
        // real work happens defensively in the constructors.
        if (!data.schemaVersion) data.schemaVersion = 1;
        if (data.schemaVersion === 1) {
            // v1 → v2: idCounters and lexicon introduced. Filled in by
            // the SyrsDocument constructor (counter seeded from existing
            // IDs, lexicon defaulted to empty arrays per category).
            data.schemaVersion = 2;
        }
        if (data.schemaVersion === 2) {
            // v2 → v3: SIL/ASIL widening + SafeState collection.
            // - asil values 'A'..'D' are migrated to 'ASIL-A'..'ASIL-D'
            //   inside each model class's constructor (migrateAsilValue).
            // - data.safeStates defaults to [] when absent.
            data.schemaVersion = 3;
        }
        return data;
    }
}
