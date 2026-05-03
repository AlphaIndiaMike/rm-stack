/**
 * ui/checklist.js
 *
 * Renders the Chapter Completeness Checklist + signoff field at the
 * bottom of every chapter. Reads checklist state from
 * doc.checklistState[chapterId] and signoff state from
 * doc.signoffs[chapterId].
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

        const state = doc.checklistState[chapter.id] || {};

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
                if (!doc.checklistState[chapter.id]) doc.checklistState[chapter.id] = {};
                doc.checklistState[chapter.id][item.id] = e.target.checked;
                onChange();
            });
            wrap.appendChild(row);
        });

        // Signoff
        const signoff = document.createElement('div');
        signoff.style.marginTop = '0.75rem';
        signoff.style.padding = '0.5rem';
        signoff.style.background = '#f8f9fa';
        signoff.style.borderRadius = '4px';
        const current = doc.signoffs[chapter.id];
        signoff.innerHTML = `
            <label style="font-size:12px;font-weight:600;">Signoff (chapter owner):</label>
            <input type="text" list="owners-datalist" class="form-control form-control-sm" id="signoffInput"
                   placeholder="Name" value="${current ? current.owner : ''}" style="max-width:240px;display:inline-block;margin-left:0.5rem;"
                   title="Pick from previously-used names or type a new one. Names are remembered in the project file.">
            <button class="btn btn-sm btn-outline-success" id="signoffBtn" style="margin-left:0.5rem;">Sign</button>
            ${current ? `<span style="margin-left:1rem;font-size:11px;color:#198754;">Signed by ${current.owner} on ${new Date(current.timestamp).toLocaleString()}</span>` : ''}
        `;
        signoff.querySelector('#signoffBtn').addEventListener('click', () => {
            const name = signoff.querySelector('#signoffInput').value.trim();
            if (!name) { alert('Enter signoff name first.'); return; }
            doc.signoffs[chapter.id] = { owner: name, timestamp: new Date().toISOString() };
            doc.addToLexicon('signoffNames', name);
            onChange();
        });
        wrap.appendChild(signoff);

        return wrap;
    }
};
