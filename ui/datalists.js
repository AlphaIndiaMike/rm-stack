/**
 * ui/datalists.js
 *
 * Per-chapter HTML5 <datalist> mount point. Renders one datalist per
 * autocomplete category referenced by chapter inputs. Native browser
 * datalists, no library.
 *
 * Categories rendered:
 *   owners-datalist  : owner / signoff names (assumptions + signoffs + lexicon)
 *   lex-producers    : interface Node A (declared elements + lexicon)
 *   lex-consumers    : interface Node B
 *   lex-triggers     : mode-transition triggers
 *
 * The element is inserted into the chapter root once per render. Inputs
 * reference it by `list="owners-datalist"` etc. Refresh on every
 * chapter render so newly-banked entries appear without a page reload.
 */

const Datalists = {

    render(doc) {
        const wrap = document.createElement('div');
        wrap.style.display = 'none';

        const mkList = (id, values) => {
            const dl = document.createElement('datalist');
            dl.id = id;
            const seen = new Set();
            values.forEach(v => {
                if (!v) return;
                const s = String(v).trim();
                if (!s || seen.has(s)) return;
                seen.add(s);
                const opt = document.createElement('option');
                opt.value = s;
                dl.appendChild(opt);
            });
            return dl;
        };

        const owners = [
            ...(doc.assumptions || []).map(a => a.owner),
            ...Object.values(doc.signoffs || {}).map(s => s && s.owner),
            ...((doc.lexicon && doc.lexicon.owners) || []),
            ...((doc.lexicon && doc.lexicon.signoffNames) || [])
        ];
        wrap.appendChild(mkList('owners-datalist', owners));

        const elementNames = (doc.elements || []).map(e => e.name);
        const producers = [
            ...elementNames,
            ...((doc.lexicon && doc.lexicon.producers) || [])
        ];
        const consumers = [
            ...elementNames,
            ...((doc.lexicon && doc.lexicon.consumers) || [])
        ];
        wrap.appendChild(mkList('lex-producers', producers));
        wrap.appendChild(mkList('lex-consumers', consumers));

        const triggers = [
            ...((doc.modeTransitions || []).map(t => t.trigger).filter(Boolean)),
            ...((doc.lexicon && doc.lexicon.triggers) || [])
        ];
        wrap.appendChild(mkList('lex-triggers', triggers));

        return wrap;
    }
};
