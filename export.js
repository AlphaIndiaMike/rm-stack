/**
 * export.js
 *
 * Browser-side exporters.
 *
 *   exportTxt(doc) → opens a modal with two options:
 *       • Simple   — Markdown-style: # Chapter headings, each requirement
 *                    as a plain paragraph (statement only). Clean for
 *                    Polarion copy-paste where you want just the text.
 *       • Detailed — Full attribute dump: every non-empty field, IDs
 *                    resolved to names, formatted for Polarion / DOORS.
 *
 *   exportPdf(doc) → builds a complete printable HTML document and opens
 *                    it in a new tab as a Blob URL. The new tab has a
 *                    "Print / Save as PDF" button that triggers the
 *                    browser's native print dialog.
 *
 * Both TXT variants and the PDF share ATTR_DEFS so adding a new
 * requirement field shows up everywhere automatically.
 *
 * ID resolution
 * -------------
 * Fields that store IDs (allocation, modes, parentSG, safeStateRef, …)
 * are resolved to human-readable names via doc.nameForId() so the
 * exported text is self-contained and readable without the tool open.
 */

const ATTR_DEFS = [
    // Identity / external reference
    { key: 'externalId',            label: 'External ID' },
    // Predicate-specific slots
    { key: 'conditional',           label: 'Conditional' },
    { key: 'conditionalText',       label: 'Conditional text' },
    { key: 'stateGuard',            label: 'State guard' },
    { key: 'predicate',             label: 'Predicate' },
    { key: 'input',                 label: 'Input' },
    { key: 'output',                label: 'Output' },
    { key: 'capability',            label: 'Capability' },
    { key: 'actor',                 label: 'Actor' },
    { key: 'envelope',              label: 'Envelope' },
    { key: 'condition',             label: 'Condition' },
    { key: 'reaction',              label: 'Reaction' },
    { key: 'detectionTime',         label: 'Reaction time' },
    { key: 'dcTarget',              label: 'DC target' },
    { key: 'fromState',             label: 'From state' },
    { key: 'toState',               label: 'To state' },
    { key: 'trigger',               label: 'Trigger' },
    { key: 'transitionTime',        label: 'Transition time' },
    { key: 'property',              label: 'Property' },
    { key: 'value',                 label: 'Value' },
    { key: 'unit',                  label: 'Unit' },
    { key: 'tolerance',             label: 'Tolerance' },
    { key: 'standard',              label: 'Standard' },
    { key: 'clause',                label: 'Clause' },
    { key: 'prohibitedBehavior',    label: 'Prohibited behavior' },
    { key: 'boundingCondition',     label: 'Bounding condition' },
    // Quality attributes
    { key: 'rationale',             label: 'Rationale' },
    { key: 'source',                label: 'Source' },
    { key: 'verification',          label: 'Verification',          list: true },
    { key: 'passCriterion',         label: 'Pass criterion' },
    // Safety attributes
    { key: 'asil',                  label: 'ASIL' },
    { key: 'parentSG',              label: 'Parent SG',             resolveId: true },
    { key: 'ftti',                  label: 'FTTI' },
    { key: 'safeStateRef',          label: 'Safe state',            resolveId: true },
    // Allocation / status — all ID arrays resolved to names
    { key: 'allocation',            label: 'Allocation',            list: true, resolveIds: true },
    { key: 'modes',                 label: 'Modes',                 list: true, resolveIds: true },
    { key: 'interfaceRefs',         label: 'Interface refs',        list: true, resolveIds: true },
    { key: 'hwSwAllocation',        label: 'HW/SW allocation' },
    { key: 'parentSystemReqs',      label: 'Parent System TSR(s)',  list: true, resolveIds: true },
    { key: 'parentAcceptanceReqs',  label: 'Parent acceptance req(s)', list: true, resolveIds: true },
    { key: 'parentFsrs',            label: 'Parent FSR(s)',         list: true, resolveIds: true },
    { key: 'parentItemFunctions',   label: 'Parent item function(s)', list: true, resolveIds: true },
    { key: 'implemented',           label: 'Implemented' },
    { key: 'status',                label: 'Status' }
];

const DECL_DEFS = [
    { key: 'itemFunctions', label: 'Item Functions', cols: ['id', 'name', 'description', 'activeModes'] },
    { key: 'safetyGoals',   label: 'Safety Goals',   cols: ['id', 'name', 'asil', 'hazardRef', 'safeStates', 'ftti', 'emergencyInterval'] },
    { key: 'elements',      label: 'Elements',       cols: ['id', 'name', 'asil', 'purpose', 'allocatedItemFunctions'] },
    { key: 'modes',         label: 'Operating Modes',cols: ['id', 'name', 'description', 'isSafeState'] },
    { key: 'interfaces',    label: 'Interfaces',     cols: ['id', 'name', 'producer', 'consumer', 'direction', 'dataType', 'range', 'period', 'jitter', 'failureBehavior'] },
    { key: 'assumptions',   label: 'Assumptions',    cols: ['id', 'text', 'owner', 'status', 'closureTarget'] }
];


class Exporter {

    // ------------------------------------------------------------------
    //  Public entry points
    // ------------------------------------------------------------------

    static exportTxt(doc) {
        Exporter._showExportModal(doc);
    }

    static exportPdf(doc) {
        const blob = new Blob([Exporter._buildHtml(doc)], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, '_blank');
        if (!w) {
            URL.revokeObjectURL(url);
            alert('Popup blocked. Allow popups for this page and try again.');
            return;
        }
        // The new window keeps the URL alive; revoke after a generous delay.
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }

    // ------------------------------------------------------------------
    //  Export-choice modal
    // ------------------------------------------------------------------

    static _showExportModal(doc) {
        // Remove any stale instance
        const existing = document.getElementById('exportModal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'exportModal';
        overlay.className = 'export-modal-overlay';

        overlay.innerHTML = `
            <div class="export-modal-box" role="dialog" aria-modal="true" aria-labelledby="exportModalTitle">
                <div class="export-modal-header">
                    <span id="exportModalTitle" class="export-modal-title">Export as TXT</span>
                    <button class="export-modal-close" title="Cancel" aria-label="Close">✕</button>
                </div>
                <div class="export-modal-body">
                    <p class="export-modal-hint">Choose the format that fits your workflow:</p>
                    <div class="export-modal-options">
                        <button class="export-option-btn" id="exportSimpleBtn">
                            <span class="export-option-icon">📄</span>
                            <span class="export-option-label">Simple</span>
                            <span class="export-option-desc">Markdown-style headings with each requirement as a plain statement. Clean for pasting into Polarion as new items.</span>
                        </button>
                        <button class="export-option-btn" id="exportDetailedBtn">
                            <span class="export-option-icon">📋</span>
                            <span class="export-option-label">Detailed</span>
                            <span class="export-option-desc">Full attribute dump — every non-empty field, IDs resolved to names. For a complete record or import into DOORS.</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Close on overlay click or ✕ button
        const close = () => overlay.remove();
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.export-modal-close').addEventListener('click', close);

        overlay.querySelector('#exportSimpleBtn').addEventListener('click', () => {
            close();
            Exporter._download(Exporter._buildTxtSimple(doc), 'text/plain;charset=utf-8', 'txt', doc, 'simple');
        });
        overlay.querySelector('#exportDetailedBtn').addEventListener('click', () => {
            close();
            Exporter._download(Exporter._buildTxtDetailed(doc), 'text/plain;charset=utf-8', 'txt', doc, 'detailed');
        });

        document.body.appendChild(overlay);
        // Focus the first button for keyboard accessibility
        overlay.querySelector('#exportSimpleBtn').focus();
    }

    // ------------------------------------------------------------------
    //  SIMPLE TXT — Markdown-style, statement only
    // ------------------------------------------------------------------

    static _buildTxtSimple(doc) {
        const out = [];
        const stamp = new Date().toISOString().substring(0, 10);
        const outline = Chapters.outline(doc.discipline) || [];
        const title = doc.title || 'System Requirements Specification';

        out.push(`# ${title}`);
        out.push(`Discipline: ${doc.discipline}  |  Generated: ${stamp}`);
        out.push('');

        outline.forEach(chapter => {
            if (chapter.autoExpand === 'elements') {
                doc.elementsForDiscipline(doc.discipline).forEach(el => {
                    const reqs = doc.requirementsForElement(el.id);
                    if (reqs.length === 0) return;
                    out.push(`## ${chapter.title} — ${el.name || '(unnamed)'} (${el.asil || 'QM'})`);
                    out.push('');
                    reqs.forEach(req => {
                        const stmt = GrammarValidator.buildStatement(req);
                        if (!stmt) return;
                        out.push(`**${req.id}**`);
                        out.push('');
                        out.push(stmt);
                        out.push('');
                    });
                });
            } else {
                const reqs = doc.requirementsForChapter(chapter.id).filter(r => !r.elementId);
                if (reqs.length === 0) return;
                out.push(`## ${chapter.title}`);
                out.push('');
                reqs.forEach(req => {
                    const stmt = GrammarValidator.buildStatement(req);
                    if (!stmt) return;
                    out.push(`**${req.id}**`);
                    out.push('');
                    out.push(stmt);
                    out.push('');
                });
            }
        });

        return out.join('\n');
    }

    // ------------------------------------------------------------------
    //  DETAILED TXT — full attribute dump, IDs resolved
    // ------------------------------------------------------------------

    static _buildTxtDetailed(doc) {
        const out = [];
        const stamp = new Date().toISOString().substring(0, 10);
        const classLabel = (CLASS_BUDGETS[doc.docClass] || {}).label || doc.docClass;
        const outline = Chapters.outline(doc.discipline) || [];

        // --- Header ---
        out.push('═'.repeat(72));
        out.push('  ' + (doc.title || 'System Requirements Specification').toUpperCase());
        out.push('');
        out.push(`  Discipline:  ${doc.discipline}`);
        out.push(`  Class:       ${classLabel}`);
        out.push(`  Generated:   ${stamp}`);
        out.push(`  Schema:      v${doc.schemaVersion || 1}`);
        out.push('═'.repeat(72));
        out.push('');

        // --- Context model ---
        out.push('━'.repeat(72));
        out.push('  CONTEXT MODEL');
        out.push('━'.repeat(72));
        DECL_DEFS.forEach(def => Exporter._appendDeclSection(out, doc, def));

        // --- Per-chapter requirements ---
        out.push('');
        out.push('━'.repeat(72));
        out.push('  REQUIREMENTS');
        out.push('━'.repeat(72));

        outline.forEach(chapter => {
            if (chapter.autoExpand === 'elements') {
                doc.elementsForDiscipline(doc.discipline).forEach(el => {
                    const reqs = doc.requirementsForElement(el.id);
                    if (reqs.length === 0) return;
                    Exporter._pushChapterHeader(out,
                        `${chapter.title} — ${el.name} (ASIL ${el.asil || 'QM'})`,
                        chapter.intro);
                    reqs.forEach(req => Exporter._appendReqTxt(out, req, doc));
                });
            } else {
                const reqs = doc.requirementsForChapter(chapter.id).filter(r => !r.elementId);
                if (reqs.length === 0) return;
                Exporter._pushChapterHeader(out, `${chapter.title}`, chapter.intro);
                reqs.forEach(req => Exporter._appendReqTxt(out, req, doc));
            }
        });

        out.push('');
        out.push('═'.repeat(72));
        out.push('  END OF DOCUMENT');
        out.push('═'.repeat(72));
        return out.join('\n');
    }

    static _appendDeclSection(out, doc, def) {
        const items = doc[def.key] || [];
        out.push('');
        out.push(`▌ ${def.label.toUpperCase()} (${items.length})`);
        out.push('');
        if (items.length === 0) {
            out.push('  (none declared)');
            return;
        }
        items.forEach(item => {
            const idLabel = item.id ? `[${item.id}]` : '';
            const nameLabel = item.name || item.text || '';
            out.push(`  ${idLabel}  ${nameLabel}`.trimEnd());
            def.cols.forEach(col => {
                if (col === 'id' || col === 'name' || col === 'text') return;
                let v = item[col];
                if (v == null || v === '' || v === false) return;
                if (Array.isArray(v)) v = v.length ? v.join(', ') : null;
                if (v == null) return;
                out.push(`      ${col.padEnd(22)} ${v}`);
            });
        });
    }

    static _pushChapterHeader(out, label, intro) {
        out.push('');
        out.push('─'.repeat(72));
        out.push(`  ${label}`);
        if (intro) out.push(`  ${intro}`);
        out.push('─'.repeat(72));
        out.push('');
    }

    static _appendReqTxt(out, req, doc) {
        out.push(`Requirement: ${req.id}`);
        out.push(`Statement:`);
        out.push(`  ${GrammarValidator.buildStatement(req) || '(incomplete)'}`);
        out.push(`Attributes:`);
        let any = false;
        ATTR_DEFS.forEach(({ key, label, list, resolveId, resolveIds }) => {
            let v = req[key];
            if (typeof v === 'boolean') { if (!v) return; v = 'Yes'; }
            if (v == null || v === '') return;
            if (list) {
                if (!Array.isArray(v) || v.length === 0) return;
                if (resolveIds) {
                    v = v.map(id => doc.nameForId(id)).filter(Boolean).join(', ');
                } else {
                    v = v.join(', ');
                }
            } else if (resolveId && v) {
                v = doc.nameForId(v) || v;
            }
            if (!v) return;
            out.push(`  ${(label + ':').padEnd(26)} ${v}`);
            any = true;
        });
        if (!any) out.push('  (none set)');
        out.push('');
    }

    // ------------------------------------------------------------------
    //  HTML BUILDER (PDF route)
    // ------------------------------------------------------------------

    static _buildHtml(doc) {
        const stamp = new Date().toISOString().substring(0, 10);
        const classLabel = (CLASS_BUDGETS[doc.docClass] || {}).label || doc.docClass;
        const outline = Chapters.outline(doc.discipline) || [];
        const title = doc.title || 'System Requirements Specification';

        const body = [];

        body.push(`<header>
            <h1>${esc(title)}</h1>
            <div class="meta">
                Discipline: <strong>${esc(doc.discipline)}</strong> &nbsp;·&nbsp;
                Class: <strong>${esc(classLabel)}</strong> &nbsp;·&nbsp;
                Generated: <strong>${esc(stamp)}</strong>
            </div>
        </header>`);

        // --- TOC ---
        body.push('<nav class="toc"><h2>Contents</h2><ol>');
        body.push('<li><a href="#ctx">Context Model</a></li>');
        outline.forEach(c => {
            body.push(`<li><a href="#ch-${esc(c.id)}">${esc(c.title)}</a></li>`);
        });
        body.push('</ol></nav>');

        // --- Context model ---
        body.push('<section id="ctx"><h2>Context Model</h2>');
        DECL_DEFS.forEach(def => body.push(renderDeclTable(doc, def)));
        body.push('</section>');

        // --- Chapters ---
        outline.forEach(chapter => {
            body.push(`<section id="ch-${esc(chapter.id)}">`);
            body.push(`<h2>${esc(chapter.title)}</h2>`);
            if (chapter.intro) body.push(`<p class="intro">${esc(chapter.intro)}</p>`);

            if (chapter.autoExpand === 'elements') {
                const exEls = doc.elementsForDiscipline(doc.discipline);
                if (exEls.length === 0) {
                    body.push('<p class="empty">No elements declared yet.</p>');
                }
                exEls.forEach(el => {
                    body.push(`<h3>${esc(el.name || '(unnamed)')} <small>ASIL ${esc(el.asil || 'QM')}</small></h3>`);
                    if (el.purpose) body.push(`<p>${esc(el.purpose)}</p>`);
                    const reqs = doc.requirementsForElement(el.id);
                    if (reqs.length === 0) body.push('<p class="empty">No requirements yet.</p>');
                    reqs.forEach(r => body.push(renderReqHtml(r, doc)));
                });
            } else {
                const reqs = doc.requirementsForChapter(chapter.id).filter(r => !r.elementId);
                if (reqs.length === 0 && !chapter.checklist?.length) {
                    body.push('<p class="empty">No content.</p>');
                }
                reqs.forEach(r => body.push(renderReqHtml(r, doc)));
            }

            // Checklist status
            if (chapter.checklist && chapter.checklist.length) {
                const state = doc.checklistBucket(doc.discipline, chapter.id);
                body.push('<h4>Completeness Checklist</h4><ul class="checklist">');
                chapter.checklist.forEach(item => {
                    const done = !!state[item.id];
                    body.push(`<li class="${done ? 'done' : ''}">${done ? '☑' : '☐'} ${esc(item.text)}</li>`);
                });
                body.push('</ul>');
            }
            body.push('</section>');
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
${body.join('\n')}
</body>
</html>`;
    }

    // ------------------------------------------------------------------
    //  Common file-download helper
    // ------------------------------------------------------------------

    static _download(content, mime, ext, doc, variant) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const suffix = variant ? `-${variant}` : '';
        a.href = url;
        a.download = `syrs-${doc.discipline}-${stamp}${suffix}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}


// ===== Helpers used by the HTML builder =====

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderReqHtml(req, doc) {
    const stmt = GrammarValidator.buildStatement(req) || '(incomplete statement)';
    const rows = [];
    ATTR_DEFS.forEach(({ key, label, list, resolveId, resolveIds }) => {
        let v = req[key];
        if (typeof v === 'boolean') { if (!v) return; v = 'Yes'; }
        if (v == null || v === '') return;
        if (list) {
            if (!Array.isArray(v) || v.length === 0) return;
            if (resolveIds) {
                v = v.map(id => doc.nameForId(id)).filter(Boolean).join(', ');
            } else {
                v = v.join(', ');
            }
        } else if (resolveId && v) {
            v = doc.nameForId(v) || v;
        }
        if (!v) return;
        rows.push(`<tr><th>${esc(label)}</th><td>${esc(v)}</td></tr>`);
    });
    return `
        <article class="req">
            <header><span class="req-id">${esc(req.id)}</span></header>
            <p class="req-statement">${esc(stmt)}</p>
            ${rows.length ? `<table class="req-attrs">${rows.join('')}</table>` : ''}
        </article>
    `;
}

function renderDeclTable(doc, def) {
    const items = doc[def.key] || [];
    const headerRow = def.cols.map(c => `<th>${esc(c)}</th>`).join('');
    if (items.length === 0) {
        return `<h3>${esc(def.label)} <small>(0)</small></h3><p class="empty">None declared.</p>`;
    }
    const bodyRows = items.map(it => '<tr>' + def.cols.map(c => {
        const v = it[c];
        const out = Array.isArray(v) ? v.join(', ') : (v === true ? '✓' : (v === false ? '' : (v || '')));
        return `<td>${esc(out)}</td>`;
    }).join('') + '</tr>').join('');
    return `
        <h3>${esc(def.label)} <small>(${items.length})</small></h3>
        <table class="decl-table">
            <thead><tr>${headerRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}


// ===== Print CSS embedded in the generated HTML =====

const PRINT_CSS = `
    body { font-family: Georgia, "Times New Roman", serif; max-width: 8.5in; margin: 0.5in auto; padding: 0 1rem 2rem; color: #000; line-height: 1.5; font-size: 11pt; }
    h1 { font-size: 22pt; border-bottom: 2px solid #000; padding-bottom: 0.4rem; margin-top: 0; }
    h2 { font-size: 15pt; margin-top: 2rem; border-bottom: 1px solid #888; padding-bottom: 0.2rem; }
    h3 { font-size: 12pt; margin-top: 1.2rem; color: #222; }
    h4 { font-size: 11pt; margin-top: 1rem; }
    .meta { color: #555; font-size: 10pt; margin-bottom: 1.5rem; }
    .toc { background: #f5f5f5; padding: 0.75rem 1.5rem; border: 1px solid #ddd; margin-bottom: 1.5rem; }
    .toc h2 { margin: 0 0 0.4rem 0; border: none; font-size: 13pt; }
    .toc ol { margin: 0; padding-left: 1.25rem; font-size: 10.5pt; }
    .toc a { color: #0d6efd; text-decoration: none; }
    .req { border-left: 3px solid #444; padding: 0.5rem 0.75rem; margin: 0.6rem 0; background: #fafafa; page-break-inside: avoid; }
    .req-id { font-family: "Courier New", monospace; font-weight: bold; font-size: 10pt; color: #444; }
    .req-statement { margin: 0.4rem 0; }
    .req-attrs { width: 100%; font-size: 10pt; border-collapse: collapse; margin-top: 0.3rem; }
    .req-attrs th { text-align: left; font-weight: 600; padding: 2px 8px 2px 0; vertical-align: top; width: 160px; color: #555; }
    .req-attrs td { padding: 2px 0; }
    .decl-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 0.3rem 0 1rem 0; }
    .decl-table th, .decl-table td { border: 1px solid #aaa; padding: 4px 6px; text-align: left; vertical-align: top; }
    .decl-table th { background: #eee; font-weight: 600; }
    .checklist { font-size: 10pt; padding-left: 1.25rem; }
    .checklist li.done { color: #888; }
    .intro { color: #555; font-style: italic; }
    .empty { color: #888; font-style: italic; font-size: 10pt; }
    section { page-break-inside: auto; }
    .print-btn { position: fixed; top: 1rem; right: 1rem; padding: 8px 18px; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11pt; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.15); z-index: 100; }
    @media print {
        body { margin: 0; }
        .print-btn { display: none; }
        h2 { page-break-before: always; }
        h2:first-of-type, .toc + section h2 { page-break-before: auto; }
    }
`;
