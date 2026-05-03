/**
 * declarations/safetyGoal.js
 *
 * Declaration kind: 'safetyGoal' — top-of-pyramid safety constraints
 * derived from HARA. Each carries an ASIL, an FTTI, and binds to one
 * or more SafeStates (declared separately, see safeState.js).
 */

Declarations.register('safetyGoal', {
    title: 'Safety Goals',
    singular: 'Safety Goal',
    helpHeaders: {
        'Name':     'Hazard-derived goal, phrased as the avoidance condition (e.g. "Avoid unintended deceleration").',
        'SIL/ASIL': 'ISO 26262 ASIL or IEC 61508 SIL, or QM if non-safety.',
        'FTTI':     'Fault Tolerant Time Interval — quantified time, e.g. "1 s" or "200 ms".'
    },
    headers: ['ID', 'Name', 'SIL/ASIL', 'FTTI', ''],
    gridCols: '90px 1fr 100px 100px 40px',
    getList: doc => doc.safetyGoals,
    add: doc => {
        const g = new SafetyGoal();
        g.id = doc.nextId('safetyGoal');
        doc.safetyGoals.push(g);
    },
    remove: (doc, id) => { doc.safetyGoals = doc.safetyGoals.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.safetyGoals.find(x => x.id === id);
        if (!item) return;
        const inputs = row.querySelectorAll('input, select');
        item.name = inputs[0].value;
        item.asil = inputs[1].value;
        item.ftti = inputs[2].value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder="Avoidance condition (e.g. 'Avoid unintended deceleration')">
        <select title="Integrity level.">${GRAMMAR.asilLevels.map(a=>`<option ${item.asil===a?'selected':''}>${a}</option>`).join('')}</select>
        <input type="text" value="${(item.ftti||'').replace(/"/g,'&quot;')}" placeholder="e.g. 1 s">
        <button class="del-btn req-delete" title="Delete this Safety Goal">✕</button>
    `
});
