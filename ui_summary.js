/**
 * ui_summary.js
 *
 * Right pane: live model summary - elements, interfaces, item functions,
 * safety goals, timing chains, orphans. Updates on every change.
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
        div.innerHTML = `
            <h6><span>Requirement Budget</span><span>${s.count} / ${s.max}</span></h6>
            <div style="height:8px;background:#e9ecef;border-radius:4px;overflow:hidden;">
                <div style="height:100%;background:${barColor};width:${Math.min(100, s.percent)}%;"></div>
            </div>
            ${s.overBudget ? '<div class="validation-warn" style="margin-top:4px;font-size:11px;">Over budget. Consider splitting to HW/SW docs.</div>' : ''}
        `;
        return div;
    }

    _elementsSection(validator) {
        const cov = validator.elementCoverage();
        return this._makeList('Elements', cov.length, cov.map(e => ({
            text: `${e.name || '(unnamed)'} <small style="color:#999;">${e.asil}</small>`,
            badge: `${e.reqCount} req`,
            cls: e.empty ? 'warn' : e.overBudget ? 'error' : e.underBudget ? 'warn' : ''
        })));
    }

    _itemFunctionsSection(validator) {
        const cov = validator.itemFunctionCoverage();
        return this._makeList('Item Functions', cov.length, cov.map(f => ({
            text: `${f.name || f.id}`,
            badge: `A:${f.acceptance} E:${f.element}`,
            cls: !f.covered ? 'error' : ''
        })));
    }

    _safetyGoalsSection(validator) {
        const cov = validator.safetyGoalCoverage();
        return this._makeList('Safety Goals', cov.length, cov.map(s => ({
            text: `${s.name || s.id} <small style="color:#999;">${s.asil}</small>`,
            badge: s.complete ? '✓' : '⚠',
            cls: !s.complete ? 'warn' : ''
        })));
    }

    _interfacesSection() {
        const list = this.doc.interfaces;
        return this._makeList('Interfaces', list.length, list.map(i => ({
            text: `${i.name || '(unnamed)'}`,
            badge: `${i.producer || '?'}→${i.consumer || '?'}`,
            cls: (!i.producer || !i.consumer) ? 'warn' : ''
        })));
    }

    _orphansSection(validator) {
        const orph = validator.orphanReport();
        return this._makeList('Orphans', orph.length, orph.map(o => ({
            text: o.id,
            badge: o.issue,
            cls: 'error'
        })), orph.length === 0 ? 'No orphans' : null);
    }

    _makeList(title, count, items, emptyText) {
        const div = document.createElement('div');
        div.className = 'summary-section';
        let itemsHtml;
        if (items.length === 0) {
            itemsHtml = `<li style="color:#999;font-style:italic;">${emptyText || 'none declared'}</li>`;
        } else {
            itemsHtml = items.slice(0, 30).map(i =>
                `<li class="${i.cls || ''}"><span>${i.text}</span><span class="count-badge">${i.badge}</span></li>`
            ).join('');
            if (items.length > 30) {
                itemsHtml += `<li style="color:#999;">…${items.length - 30} more</li>`;
            }
        }
        div.innerHTML = `
            <h6><span>${title}</span><span>${count}</span></h6>
            <ul class="summary-list">${itemsHtml}</ul>
        `;
        return div;
    }
}
