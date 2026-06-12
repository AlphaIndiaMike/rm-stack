/**
 * ui_summary.js
 *
 * Right pane: live model summary - elements, interfaces, item functions,
 * safety goals, timing chains, orphans. Updates on every change.
 *
 * Tooltips
 * --------
 * Every cryptic glyph and abbreviation here carries a `title` attribute
 * so a hover reveals the full meaning. We use native HTML tooltips
 * deliberately — no external popover library — because the tool ships
 * as a single portable HTML and pure-CSS hover is good enough.
 */

class SummaryView {

    constructor(doc) { this.doc = doc; }
    setDocument(doc) { this.doc = doc; }

    render(container) {
        container.innerHTML = '';
        const validator = new DocumentValidator(this.doc);

        // Budget
        container.appendChild(this._budgetSection(validator));

        // Elements
        container.appendChild(this._elementsSection(validator));

        // Item functions
        container.appendChild(this._itemFunctionsSection(validator));

        // Safety Goals
        container.appendChild(this._safetyGoalsSection(validator));

        // Interfaces
        container.appendChild(this._interfacesSection());

        // Trace health
        container.appendChild(this._traceHealthSection(validator));

        // Orphans
        container.appendChild(this._orphansSection(validator));

        // Integrity tracking — ASIL/SIL downtrace health
        container.appendChild(this._integritySection(validator));

        // Budget Est. — development-cost estimate from requirement words
        container.appendChild(this._budgetEstimateSection(validator));
    }

    /** Integrity Tracking — per downstream discipline: safety parents
     *  untraced, insufficient (below-rank: warning), and satisfied via
     *  the SIL\u2194ASIL convention (info). */
    _integritySection(validator) {
        const rows = validator.integrityTracking();
        const tip = 'Downtrace health of safety-classified (ASIL/SIL) System requirements into HW and SW. "Untraced" = nothing derived yet; "insufficient" = the best derived requirement sits below the parent\'s integrity (a warning — legitimate only as deliberate decomposition); "via SIL\u2194ASIL" = satisfied across standards by the project\'s declared equivalence (informational).';
        const items = rows.map(r => {
            const label = r.kind === 'hw' ? 'System → HW' : 'System → SW';
            const bad = r.untraced + r.insufficient;
            const parts = [];
            if (r.untraced)     parts.push(`${r.untraced} untraced`);
            if (r.insufficient) parts.push(`${r.insufficient} insufficient`);
            if (r.crossFamily)  parts.push(`${r.crossFamily} via SIL\u2194ASIL \u2139`);
            return {
                text: `${label} <small style="color:#999;">${r.safetyParents} safety parent${r.safetyParents === 1 ? '' : 's'}</small>`,
                badge: parts.length ? parts.join(' · ') : '✓ all traced',
                badgeTitle: tip,
                cls: bad > 0 ? 'warn' : ''
            };
        });
        return this._makeList('Integrity Tracking (ASIL/SIL)', null, items,
            'no safety-classified requirements yet', tip);
    }

    /** Requirement Budget — per-discipline committed/ceiling. */
    _budgetSection(validator) {
        const sectionTip = 'For a budget conscious project the number of requirements must be tracked, as each requirement creates development and verification costs.';
        const budgets = validator.allDisciplineBudgets();
        const active = this.doc.discipline;

        const items = budgets.map(b => {
            const isActive = b.id === active;
            const barColor = b.overBudget ? 'var(--red)'
                : b.percent > 80 ? 'var(--amber)' : 'var(--green)';
            const text = `
                <span style="display:block;">
                    ${isActive ? '▸ ' : ''}${b.label}
                </span>
                <span class="track" style="width:130px;">
                    <span style="display:block;height:100%;background:${barColor};width:${Math.min(100, b.percent)}%;"></span>
                </span>`;
            return {
                text,
                badge: `${b.count} / ${b.max}`,
                badgeTitle: `${b.percent}% of the ${b.label} ceiling`
                    + (b.overBudget ? ' — over budget' : ''),
                cls: b.overBudget ? 'error' : ''
            };
        });

        return this._makeList('Requirement Budget', null,
            items, 'no disciplines', sectionTip);
    }

    _elementsSection(validator) {
        const cov = validator.elementCoverage();
        const tip = 'System elements declared in Chapter 6. Badge shows how many element requirements (Chapter 7) trace to each.';
        return this._makeList('Elements', cov.length, cov.map(e => ({
            text: `${e.name || '(unnamed)'} <small style="color:#999;" title="Inherited or decomposed integrity level">(${e.asil || 'QM'})</small>`,
            badge: `${e.reqCount} req`,
            badgeTitle: e.empty
                ? 'No element requirements yet — Chapter 7 leaf is empty.'
                : (e.overBudget
                    ? `${e.reqCount} requirements — exceeds the per-leaf budget of 4–13.`
                    : (e.underBudget
                        ? `${e.reqCount} requirements — below the per-leaf budget of 4–13.`
                        : `${e.reqCount} requirements — within the per-leaf budget of 4–13.`)),
            cls: e.empty ? 'warn' : e.overBudget ? 'error' : e.underBudget ? 'warn' : ''
        })), null, tip);
    }

    _itemFunctionsSection(validator) {
        const cov = validator.itemFunctionCoverage();
        const tip = 'Item functions declared in Chapter 2. Each function should be reflected in ≥1 acceptance requirement (A) and ≥1 element requirement (E).';
        return this._makeList('Item Functions', cov.length, cov.map(f => ({
            text: `${f.name || f.id}`,
            badge: `<span title="Acceptance requirements traced to this function">A:${f.acceptance}</span> <span title="Element requirements (Chapter 7) traced to this function">E:${f.element}</span>`,
            badgeTitle: f.covered
                ? 'Covered: at least one acceptance requirement traces here.'
                : 'No acceptance requirement traces to this item function — orphaned.',
            cls: !f.covered ? 'error' : ''
        })), null, tip);
    }

    _safetyGoalsSection(validator) {
        const cov = validator.safetyGoalCoverage();
        const tip = 'Safety Goals declared in Chapter 3. End-to-end "complete" means an FSR (Ch 4), an acceptance requirement (Ch 5), and at least one element requirement (Ch 7) all trace to the SG.';
        return this._makeList('Safety Goals', cov.length, cov.map(s => ({
            // Display the integrity level in parentheses after the name,
            // e.g. "Avoid unintended deceleration (ASIL-B)" or "(SIL-2)".
            // Empty string falls back to (QM) so the user can read the
            // label without inspecting the column.
            text: `${s.name || s.id} <small style="color:#666;" title="Integrity level — ISO 26262 ASIL or IEC 61508 SIL">(${s.asil || 'QM'})</small>`,
            badge: s.complete ? '✓' : '⚠',
            badgeTitle: s.complete
                ? 'End-to-end traceable: FSR ✓, acceptance ✓, element ✓.'
                : `Gap: FSR ${s.hasFsr ? '✓' : '✗'}, acceptance ${s.hasAcceptance ? '✓' : '✗'}, element ${s.hasElement ? '✓' : '✗'}.`,
            cls: !s.complete ? 'warn' : ''
        })), null, tip);
    }

    _interfacesSection() {
        const list = this.doc.interfaces;
        const tip = 'External interfaces declared in Chapter 6. Producer → Consumer shows information flow direction. Phase 2 expands this with HW/SW kind and SMART signal properties.';
        return this._makeList('Interfaces', list.length, list.map(i => ({
            text: `${i.name || '(unnamed)'}`,
            badge: `${i.producer || '?'}→${i.consumer || '?'}`,
            badgeTitle: (!i.producer || !i.consumer)
                ? 'Producer or consumer not specified — interface is incomplete.'
                : `Producer: ${i.producer} → Consumer: ${i.consumer}`,
            cls: (!i.producer || !i.consumer) ? 'warn' : ''
        })), null, tip);
    }

    /** Trace Health — one compact section the other panels can't show
     *  at a glance: how many committed requirements in this discipline
     *  have NO parent link at all (untraced), and how many safety
     *  requirements break integrity inheritance (a safety parent's
     *  ASIL/SIL not carried — no decomposition at the System hop).
     *  Reuses data already in the document; no new computation cost. */
    _traceHealthSection(validator) {
        const tip = 'Untraced = committed requirements with no parent link of any kind. Integrity gap = a requirement whose safety parent (ASIL/SIL) is not carried unchanged (no decomposition at the System→SW/HW hop).';
        const byId = {};
        this.doc.requirements.forEach(r => { byId[r.id] = r; });

        const reqs = this.doc.requirements.filter(r => {
            const ch = findChapter(this.doc.discipline, r.chapterId);
            return ch && ch.allowsRequirements;
        });

        let untraced = 0, integrityGaps = 0;
        reqs.forEach(r => {
            const hasParent =
                (r.parentSystemReqs   || []).length ||
                (r.parentFsrs         || []).length ||
                (r.parentAcceptanceReqs || []).length ||
                (r.parentItemFunctions  || []).length ||
                r.parentSG ||
                (typeof r.source === 'string' && r.source.trim());
            if (!hasParent) untraced++;

            const safetyParents = (r.parentSystemReqs || [])
                .map(id => byId[id])
                .filter(p => p && (p.asil || '').trim()
                          && (p.asil || '').trim() !== 'QM');
            if (safetyParents.length) {
                const lvl = (r.asil || '').trim();
                if (!safetyParents.some(p => (p.asil || '').trim() === lvl)) {
                    integrityGaps++;
                }
            }
        });

        const items = [
            { text: 'Untraced requirements',
              badge: String(untraced),
              badgeTitle: 'No parent link of any kind',
              cls: untraced ? 'error' : '' },
            { text: 'Safety integrity gaps',
              badge: String(integrityGaps),
              badgeTitle: 'Parent ASIL/SIL not inherited',
              cls: integrityGaps ? 'error' : '' }
        ];
        return this._makeList('Trace Health', null, items, null, tip);
    }

    _orphansSection(validator) {
        const orph = validator.orphanReport();
        const tip = 'Requirements that reference an element, item function, or Safety Goal that is not declared. Every orphan must be resolved before signoff.';
        return this._makeList('Orphans', orph.length, orph.map(o => ({
            text: `${this.doc.nameForId(o.id)} <small style="color:#999;font-family:monospace;">${o.id}</small>`,
            badge: o.issue,
            badgeTitle: o.issue,
            cls: 'error'
        })), orph.length === 0 ? 'No orphans' : null, tip);
    }

    /** Budget Est. — development-cost estimate. The UI deliberately
     *  presents this as an empirical estimate and does NOT disclose the
     *  estimation model (the model and its tuning are proprietary to the
     *  project owner; see budgetEstimate() in validator.js and the rates
     *  in chapter_registry.js — source-level only, never user-facing). */
    _budgetEstimateSection(validator) {
        const est = validator.budgetEstimate();
        const fmt = n => n.toLocaleString('de-DE'); // 21.000 style
        const tip = 'Empirical estimation based on the declared requirements. It considers all development costs including implementation, validation, staff, and other supporting assets.';
        const items = est.perDiscipline.map(d => ({
            text: `${d.label} <small style="color:#999;">${d.reqCount} requirement${d.reqCount === 1 ? '' : 's'}</small>`,
            badge: `${fmt(d.cost)} €`,
            badgeTitle: `Estimated development cost attributable to the ${d.label} discipline.`,
            cls: ''
        }));
        items.push({
            text: '<strong>Estimated development cost</strong>',
            badge: `<strong>${fmt(est.totalCost)} €</strong>`,
            badgeTitle: 'Estimated total development cost across all disciplines.',
            cls: ''
        });
        return this._makeList('Budget Est.', null, items, 'no requirements yet', tip);
    }

    _makeList(title, count, items, emptyText, sectionTip) {
        const div = document.createElement('div');
        div.className = 'summary-section';
        let itemsHtml;
        if (items.length === 0) {
            itemsHtml = `<li style="color:#999;font-style:italic;">${emptyText || 'none declared'}</li>`;
        } else {
            itemsHtml = items.slice(0, 30).map(i =>
                `<li class="${i.cls || ''}"><span>${i.text}</span><span class="count-badge" ${i.badgeTitle ? `title="${i.badgeTitle.replace(/"/g,'&quot;')}"` : ''}>${i.badge}</span></li>`
            ).join('');
            if (items.length > 30) {
                itemsHtml += `<li style="color:#999;">…${items.length - 30} more</li>`;
            }
        }
        const titleHtml = sectionTip
            ? `${title} <span class="help-icon" title="${sectionTip}">?</span>`
            : title;
        const countHtml = (count == null)
            ? ''
            : `<span title="Count">${count}</span>`;
        div.innerHTML = `
            <h6><span>${titleHtml}</span>${countHtml}</h6>
            <ul class="summary-list">${itemsHtml}</ul>
        `;
        return div;
    }
}
