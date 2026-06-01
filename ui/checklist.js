/**
 * ui/checklist.js
 *
 * Renders the Chapter Completeness Checklist + signoff field at the
 * bottom of every chapter. Reads checklist state via
 * doc.checklistBucket(discipline, chapterId) and signoff state via
 * doc.signoffFor(discipline, chapterId) — both keyed by
 * `discipline:chapterId` so chapters shared across disciplines keep
 * independent governance state.
 *
 * Each checklist item may carry an optional `help` string; if present,
 * a `?` icon is appended to the label and the custom tooltip layer
 * reveals the explanation on hover.
 */

const ChecklistView = {

    render(doc, chapter, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'checklist-section';
        wrap.innerHTML = `<div class="section-title">Chapter Completeness Checklist</div>`;

        const ckey = SyrsDocument.checklistKey(doc.discipline, chapter.id);
        const state = doc.checklistBucket(doc.discipline, chapter.id);

        (chapter.checklist || []).forEach(item => {
            const row = document.createElement('div');
            row.className = 'checklist-item';
            const checked = state[item.id] ? 'checked' : '';
            const helpIcon = item.help
                ? ` <span class="help-icon" title="${item.help.replace(/"/g, '&quot;')}">?</span>`
                : '';
            row.innerHTML = `
                <input type="checkbox" id="chk-${item.id}" ${checked}>
                <label for="chk-${item.id}">${item.text}${helpIcon}</label>
            `;
            row.querySelector('input').addEventListener('change', e => {
                if (!doc.checklistState[ckey]) doc.checklistState[ckey] = {};
                doc.checklistState[ckey][item.id] = e.target.checked;
                onChange();
            });
            wrap.appendChild(row);
        });

        // Signoff
        const signoff = document.createElement('div');
        signoff.className = 'signoff-row';
        const current = doc.signoffFor(doc.discipline, chapter.id);
        signoff.innerHTML = `
            <label class="signoff-label">Signoff (chapter owner):</label>
            <input type="text" list="owners-datalist" class="signoff-input" id="signoffInput"
                   placeholder="Name" value="${current ? current.owner : ''}"
                   title="Pick from previously-used names or type a new one. Names are remembered in the project file.">
            <button class="btn-add signoff-btn" id="signoffBtn">Sign</button>
            ${current ? `<span class="signoff-status">Signed by ${current.owner} on ${new Date(current.timestamp).toLocaleString()}</span>` : ''}
        `;
        signoff.querySelector('#signoffBtn').addEventListener('click', () => {
            const name = signoff.querySelector('#signoffInput').value.trim();
            if (!name) { alert('Enter signoff name first.'); return; }
            doc.signoffs[SyrsDocument.checklistKey(doc.discipline, chapter.id)] =
                { owner: name, timestamp: new Date().toISOString() };
            doc.addToLexicon('signoffNames', name);
            onChange();
        });
        wrap.appendChild(signoff);

        return wrap;
    }
};
