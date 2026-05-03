/**
 * ui/declaration_table.js
 *
 * Renders one declaration table (item functions, modes, elements,
 * interfaces, ...). Looks up the kind config in the Declarations
 * registry; chapters list kinds by string in their `declarations`
 * array.
 *
 *   const tbl = DeclarationTable.render(doc, 'element', () => onChange());
 *
 * CRITICAL — click-twice prevention
 * ---------------------------------
 * Event policy is split by control type so that a half-typed input
 * doesn't tear down the DOM mid-click on another button:
 *
 *   - text/number inputs: `input` event → live-write to model only,
 *     no re-render. Focus survives typing. Right-pane summary may go
 *     briefly stale on names; catches up on next add/remove.
 *   - text/number inputs: `change` event (blur / Enter) → commit
 *     (lexicon banking) + setTimeout(onChange, 0). The deferred
 *     onChange lets a click on a sibling button reach its target
 *     before the table re-renders.
 *   - select / checkbox: `change` event → write + commit + immediate
 *     onChange. Safe because clicking these means the user already
 *     left any in-flight text input.
 *   - The document-level mousedown blur listener (installed in
 *     EditorView constructor) catches outside-clicks so a value typed
 *     into a text input commits even when the user clicks dead space.
 *
 * Modifying these handlers risks reintroducing the click-twice bug
 * the user spent weeks pinning down.
 */

const DeclarationTable = {

    render(doc, kind, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'requirements-section';

        const config = Declarations.get(kind);
        if (!config) {
            wrap.innerHTML = `<div class="empty-state">Unknown declaration kind: <code>${kind}</code></div>`;
            return wrap;
        }

        const titleHtml = config.sectionHelp
            ? `${config.title} <span class="help-icon" title="${config.sectionHelp.replace(/"/g,'&quot;')}">?</span>`
            : config.title;
        wrap.innerHTML = `<div class="section-title">${titleHtml}</div>`;

        const list = config.getList(doc);

        if (list.length > 0) {
            const header = document.createElement('div');
            header.className = 'declaration-header';
            header.style.display = 'grid';
            header.style.gridTemplateColumns = config.gridCols;
            header.style.gap = '0.4rem';
            header.innerHTML = config.headers.map(h => {
                const help = config.helpHeaders && config.helpHeaders[h];
                return help
                    ? `<div>${h} <span class="help-icon" title="${help.replace(/"/g,'&quot;')}">?</span></div>`
                    : `<div>${h}</div>`;
            }).join('');
            wrap.appendChild(header);
        }

        list.forEach(item => {
            const row = document.createElement('div');
            row.className = 'declaration-row';
            row.style.gridTemplateColumns = config.gridCols;
            row.innerHTML = config.renderRow(item);

            // Sub-widget mounting hook (multi-selects, expand buttons, ...)
            if (typeof config.postRender === 'function') {
                config.postRender(row, item, doc, () => onChange());
            }

            const delBtn = row.querySelector('.del-btn');
            if (delBtn) {
                delBtn.addEventListener('click', () => {
                    config.remove(doc, item.id);
                    onChange();
                });
            }

            // Text / number inputs — live write on `input`, deferred
            // commit + onChange on `change`. See file header.
            row.querySelectorAll('input[type="text"], input[type="number"]').forEach(inp => {
                inp.addEventListener('input', () => {
                    config.updateFromRow(doc, item.id, row);
                });
                inp.addEventListener('change', () => {
                    if (typeof config.commitFromRow === 'function') {
                        config.commitFromRow(doc, item.id, row);
                    }
                    setTimeout(() => onChange(), 0);
                });
            });

            // Select / checkbox — immediate.
            row.querySelectorAll('select, input[type="checkbox"]').forEach(inp => {
                inp.addEventListener('change', () => {
                    config.updateFromRow(doc, item.id, row);
                    if (typeof config.commitFromRow === 'function') {
                        config.commitFromRow(doc, item.id, row);
                    }
                    onChange();
                });
            });

            wrap.appendChild(row);
        });

        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary btn-add';
        btn.textContent = `+ Add ${config.singular}`;
        btn.style.marginTop = '0.5rem';
        btn.addEventListener('click', () => {
            config.add(doc);
            onChange();
        });
        wrap.appendChild(btn);

        return wrap;
    }
};
