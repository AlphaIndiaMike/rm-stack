/**
 * ui_outline.js
 *
 * Renders the left-pane navigation. The pane is split into two sections:
 *
 *   1. OUTLINE — chapters where the user actually inputs content
 *      (requirements, declarations, or auto-expanded element leaves).
 *      Chapter 7 still expands one row per declared element.
 *
 *   2. REMINDERS — chapters that are pure governance / quality-gate
 *      checklists (front matter, scope, allocation rules, FMEA/FTA
 *      summaries, traceability report, etc.). These produce no authored
 *      content; they exist only to remind the user what would otherwise
 *      be missed.
 *
 * The categorization is derived from the existing outline.js data
 * (allowsRequirements / declarations / autoExpand) so the data
 * definitions stay the single source of truth — no new flag added.
 */

class OutlineView {

    constructor(doc, onSelect) {
        this.doc = doc;
        this.onSelect = onSelect;
        this.activeChapterId = null;
        this.activeElementId = null;
    }

    setDocument(doc) {
        this.doc = doc;
    }

    setActive(chapterId, elementId) {
        this.activeChapterId = chapterId;
        this.activeElementId = elementId || null;
    }

    /** A chapter belongs in the outline (vs. reminders) iff the user
     *  actually inputs something there. `authoring: true` is an explicit
     *  opt-in for tool chapters whose input is via extraWidgets rather
     *  than declarations / a requirement builder (e.g. Timing Analysis). */
    static isAuthoringChapter(chapter) {
        return !!(chapter.allowsRequirements
                || (chapter.declarations && chapter.declarations.length > 0)
                || chapter.autoExpand
                || chapter.authoring);
    }

    render(container) {
        container.innerHTML = '';
        // Outline comes from the chapter registry — each chapter file
        // self-registers under its discipline. Switching the top-bar
        // dropdown changes doc.discipline; this call returns the new
        // outline; the underlying SyrsDocument data is unchanged. One
        // JSON, four views.
        const outline = Chapters.outline(this.doc.discipline) || [];
        const validator = new DocumentValidator(this.doc);

        const authoring = outline.filter(OutlineView.isAuthoringChapter);
        const reminders = outline.filter(c => !OutlineView.isAuthoringChapter(c));

        // --- Outline section: chapters the user authors ---
        authoring.forEach((chapter, idx) => {
            container.appendChild(this._renderChapter(chapter, validator, false, idx + 1));

            // Chapter 7 (or any autoExpand='elements') gets one child row
            // per declared element.
            if (chapter.autoExpand === 'elements') {
                const els = this.doc.elementsForDiscipline(this.doc.discipline);
                els.forEach(el => {
                    container.appendChild(this._renderElementChild(chapter, el));
                });
                if (els.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'outline-chapter child';
                    empty.style.fontStyle = 'italic';
                    empty.style.color = '#999';
                    empty.textContent = '(no elements declared yet)';
                    container.appendChild(empty);
                }
            }
        });

        // --- Checklists section: governance / quality-gate items ---
        if (reminders.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'outline-section-divider';
            divider.innerHTML = `
                <span>Checklists</span>
                <span class="outline-section-hint">no input, gates only</span>
            `;
            container.appendChild(divider);

            reminders.forEach((chapter, idx) => {
                container.appendChild(this._renderChapter(chapter, validator, true, idx + 1));
            });
        }
    }

    _renderChapter(chapter, validator, isReminder, displayNum) {
        const div = document.createElement('div');
        div.className = 'outline-chapter';
        if (isReminder) div.classList.add('reminder');
        if (this.activeChapterId === chapter.id && !this.activeElementId) {
            div.classList.add('active');
        }

        const status = validator.chapterStatus(chapter);
        const pct = validator.chapterCompleteness(chapter);
        div.classList.add('status-' + status);
        div.title = pct + '% complete';

        // Trailing label differs by section:
        //   - Authoring: requirement count when non-zero
        //   - Reminders: checklist progress as done/total
        let trailingLabel = '';
        if (isReminder) {
            const state = this.doc.checklistBucket(this.doc.discipline, chapter.id);
            const total = (chapter.checklist || []).length;
            const done  = (chapter.checklist || []).filter(c => state[c.id]).length;
            if (total > 0) trailingLabel = `<span class="outline-count">${done}/${total}</span>`;
        } else {
            const reqCount = this.doc.requirementsForChapter(chapter.id).length;
            if (reqCount > 0) trailingLabel = `<span class="outline-count">(${reqCount})</span>`;
        }

        div.innerHTML = `
            <span>
                <span class="chapter-num">${displayNum}</span>
                ${chapter.title}
                ${trailingLabel}
            </span>
        `;

        div.addEventListener('click', () => this.onSelect(chapter.id, null));
        return div;
    }

    _renderElementChild(chapter, element) {
        const div = document.createElement('div');
        div.className = 'outline-chapter child';
        if (this.activeChapterId === chapter.id && this.activeElementId === element.id) {
            div.classList.add('active');
        }

        const reqCount = this.doc.requirementsForElement(element.id).length;
        let statusClass = 'red';
        if (reqCount >= 4 && reqCount <= 13) statusClass = 'green';
        else if (reqCount > 0) statusClass = 'orange';
        div.classList.add('status-' + statusClass);

        div.innerHTML = `
            <span>
                <span style="color:#999;">7.x</span>
                ${element.name || '(unnamed element)'}
                <span class="outline-count">(${reqCount})</span>
            </span>
        `;

        div.addEventListener('click', () => this.onSelect(chapter.id, element.id));
        return div;
    }
}
