/**
 * declarations/safetyActor.js
 *
 * Declaration kind: 'safetyActor' — the actors an FSR can be allocated
 * to in the Functional Safety Concept. ISO 26262-3 allocates FSRs to the
 * item, to external measures, or to assumed driver/operator actions.
 *
 * This is a deliberately lightweight list, NOT a preliminary-architecture
 * model: the declared names feed the FSR Subject dropdown in the FSC
 * chapter. "the system" is always available as the internal subject even
 * when no actors are declared, so the table is only needed to add
 * external measures (another ECU, ESC, run-flat tyre, ...) and assumed
 * human/environment actors (driver, operator, other road user).
 *
 * Item-global data (shared across the Item and System views, since both
 * surface the FSC chapter — one JSON, four views).
 */

Declarations.register('safetyActor', {
    title: 'Safety Actors (FSR allocation targets)',
    singular: 'Actor',
    sectionHelp: 'Declare external measures and assumed driver/operator actors so an FSR can be allocated to them. "the system" (the item itself) is always available as a subject and does not need to be declared here.',
    helpHeaders: {
        'Name': 'How the actor reads as an FSR subject, e.g. "the driver", "the ESC system", "the run-flat tyre".',
        'Kind': 'Internal = the item itself. External measure = a distinct E/E system or other-technology measure in the vehicle. Human/Environment = an assumed driver / operator / road-user action.',
        'Description': 'Optional: what this actor is assumed to do, or its role in achieving the safety goals.'
    },
    headers: ['ID', 'Name', 'Kind', 'Description', ''],
    gridCols: '90px 1fr 150px 1fr 40px',
    getList: doc => doc.safetyActors,
    add: doc => {
        const a = new SafetyActor();
        a.id = doc.nextId('safetyActor');
        doc.safetyActors.push(a);
    },
    remove: (doc, id) => { doc.safetyActors = doc.safetyActors.filter(x => x.id !== id); },
    updateFromRow: (doc, id, row) => {
        const item = doc.safetyActors.find(x => x.id === id);
        if (!item) return;
        const textInputs = row.querySelectorAll('input[type="text"]');
        item.name = textInputs[0].value;
        item.description = textInputs[1].value;
        const sel = row.querySelector('select');
        if (sel) item.kind = sel.value;
    },
    renderRow: item => `
        <div class="req-id" style="align-self:center;" title="Internal stable ID.">${item.id}</div>
        <input type="text" value="${(item.name||'').replace(/"/g,'&quot;')}" placeholder='e.g. the driver, the ESC system'>
        <select title="Allocation category">
            <option value="internal"          ${item.kind==='internal'?'selected':''}>Internal</option>
            <option value="external_measure"  ${item.kind==='external_measure'?'selected':''}>External measure</option>
            <option value="human_environment" ${item.kind==='human_environment'?'selected':''}>Human / Environment</option>
        </select>
        <input type="text" value="${(item.description||'').replace(/"/g,'&quot;')}" placeholder="Assumed action or role (optional)">
        <button class="del-btn req-delete" title="Delete this actor">✕</button>
    `
});
