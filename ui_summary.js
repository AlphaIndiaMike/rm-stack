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

        // Orphans
        container.appendChild(this._orphansSection(validator));
    }

    _budgetSection(validator) {
        const s = validator.budgetStatus();
        const div = document.createElement('div');
        div.className = 'summary-section';
        const barColor = s.overBudget ? '#dc3545' : s.percent > 80 ? '#fd7e14' : '#198754';
        const tip = `Total committed requirements vs the ceiling for the selected document class. Going over budget is the cue to split the document into HW-RS / SW-RS.`;
        div.innerHTML = `
            <h6>
                <span>Requirement Budget <span class="help-icon" title="${tip}">?</span></span>
                <span title="committed / class ceiling">${s.count} / ${s.max}</span>
            </h6>
            <div style="height:8px;background:#e9ecef;border-radius:4px;overflow:hidden;" title="${s.percent}% of class ceiling">
                <div style="height:100%;background:${barColor};width:${Math.min(100, s.percent)}%;"></div>
            </div>
            ${s.overBudget ? '<div class="validation-warn" style="margin-top:4px;font-size:11px;">Over budget. Consider splitting to HW/SW docs.</div>' : ''}
        `;
        return div;
    }

    _elementsSection(validator) {
        const cov = validator.elementCoverage();
        const tip = 'System elements declared in Chapter 6. Badge shows how many element requirements (Chapter 7) trace to each.';
        return this._makeList('Elements', cov.length, cov.map(e => ({
            text: `${e.name || '(unnamed)'} <small style="color:#999;" title="Inherited or decomposed ASIL">${e.asil}</small>`,
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
            text: `${s.name || s.id} <small style="color:#999;" title="ASIL or SIL level">${s.asil}</small>`,
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

    _orphansSection(validator) {
        const orph = validator.orphanReport();
        const tip = 'Requirements that reference an element, item function, or Safety Goal that is not declared. Every orphan must be resolved before signoff.';
        return this._makeList('Orphans', orph.length, orph.map(o => ({
            text: o.id,
            badge: o.issue,
            badgeTitle: o.issue,
            cls: 'error'
        })), orph.length === 0 ? 'No orphans' : null, tip);
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
        div.innerHTML = `
            <h6><span>${titleHtml}</span><span title="Count">${count}</span></h6>
            <ul class="summary-list">${itemsHtml}</ul>
        `;
        return div;
    }
}
