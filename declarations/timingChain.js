/**
 * declarations/timingChain.js
 *
 * Declaration kind: 'timingChain' — sensor → processing → actuator
 * latency chains used by the HSI chapter to verify that every safety
 * chain closes within the parent SG's FTTI.
 *
 * STATUS: stub. The original implementation never actually persisted
 * stages; the chapter (ch09_hsi) is on the rebuild list. When the
 * rebuild lands, replace this file's body with a real implementation
 * that stores doc.timingChains as an array of:
 *   { id, name, parentSgId, stages: [{ elementId, periodMs, jitterMs }] }
 * and renders one row per chain plus a sub-row of stages.
 */

Declarations.register('timingChain', {
    title: 'Timing Chains',
    sectionHelp: 'STUB — see comment in declarations/timingChain.js. Will be rebuilt when the HSI chapter is fixed.',
    singular: 'Timing Chain',
    headers: ['ID', 'Name', 'Stages', 'Budget', ''],
    gridCols: '90px 1fr 1fr 80px 40px',
    getList: () => [],
    add:    () => {},
    remove: () => {},
    updateFromRow: () => {},
    renderRow: () => `<div></div><div></div><div></div><div></div><button class="del-btn req-delete">✕</button>`
});
