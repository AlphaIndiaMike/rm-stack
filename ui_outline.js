/**
 * ui_outline.js
 *
 * Renders the left-pane outline. Each chapter shows its completeness
 * indicator. Chapter 7 auto-expands into one node per declared element.
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

    render(container) {
        container.innerHTML = '';
        const outline = OUTLINES[this.doc.discipline];
        const validator = new DocumentValidator(this.doc);

        outline.forEach(chapter => {
            const node = this._renderChapter(chapter, validator);
            container.appendChild(node);

            // Auto-expand Chapter 7 into one node per element
            if (chapter.autoExpand === 'elements') {
                this.doc.elements.forEach(el => {
                    const childNode = this._renderElementChild(chapter, el, validator);
                    container.appendChild(childNode);
                });
                if (this.doc.elements.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'outline-chapter child';
                    empty.style.fontStyle = 'italic';
                    empty.style.color = '#999';
                    empty.textContent = '(no elements declared yet)';
                    container.appendChild(empty);
                }
            }
        });
    }

    _renderChapter(chapter, validator) {
        const div = document.createElement('div');
        div.className = 'outline-chapter';
        if (this.activeChapterId === chapter.id && !this.activeElementId) {
            div.classList.add('active');
        }

        const reqCount = this.doc.requirementsForChapter(chapter.id).length;
        const status = validator.chapterStatus(chapter);
        const pct = validator.chapterCompleteness(chapter);

        div.innerHTML = `
            <span>
                <span class="chapter-num">${chapter.number}</span>
                ${chapter.title}
                ${reqCount > 0 ? `<span style="color:#999;font-size:11px;">(${reqCount})</span>` : ''}
            </span>
            <span class="completeness-dot ${status}" title="${pct}% complete"></span>
        `;

        div.addEventListener('click', () => this.onSelect(chapter.id, null));
        return div;
    }

    _renderElementChild(chapter, element, validator) {
        const div = document.createElement('div');
        div.className = 'outline-chapter child';
        if (this.activeChapterId === chapter.id && this.activeElementId === element.id) {
            div.classList.add('active');
        }

        const reqCount = this.doc.requirementsForElement(element.id).length;
        let statusClass = 'red';
        if (reqCount >= 4 && reqCount <= 13) statusClass = 'green';
        else if (reqCount > 0) statusClass = 'orange';

        div.innerHTML = `
            <span>
                <span style="color:#999;">7.x</span>
                ${element.name || '(unnamed element)'}
                <span style="color:#999;font-size:11px;">(${reqCount})</span>
            </span>
            <span class="completeness-dot ${statusClass}"></span>
        `;

        div.addEventListener('click', () => this.onSelect(chapter.id, element.id));
        return div;
    }
}
