/**
 * ui_widgets.js
 *
 * Small reusable UI widgets that don't belong in the core editor file.
 * Currently just MultiSelectDropdown.
 *
 * Why no library
 * --------------
 * The tool ships as one portable HTML folder, jQuery as the only
 * concession allowed. Neither bootstrap-multiselect nor select2 nor
 * any popper-based combobox library is in the bundle. The widget below
 * is ~120 lines and covers every place the user asked for "dropdown
 * with multi check revealed by symbol on the row" — so we built it
 * native instead of pulling in a dependency.
 */

class MultiSelectDropdown {

    /**
     * @param {Array<{value, label}>} options  full set of choices
     * @param {Array<string>}         selected initial selected values
     * @param {Function}              onChange (newValues:string[]) => void
     * @param {Object}                opts     { unitLabel, emptyLabel }
     */
    constructor(options, selected, onChange, opts) {
        this.options = options || [];
        this.selected = new Set(selected || []);
        this.onChange = onChange || (() => {});
        opts = opts || {};
        this.unitLabel  = opts.unitLabel  || 'item';
        this.emptyLabel = opts.emptyLabel || `(no ${this.unitLabel}s declared yet)`;
        // Optional: fired once when the popover closes (after any
        // sequence of checkbox toggles). Used by callers that need to
        // refresh dependent UI (e.g. the right-pane model summary)
        // without flickering during in-flight selections.
        this.onClose    = opts.onClose    || (() => {});
        // Single-select mode (v1.6.1): exactly one (or zero) value;
        // choosing an option replaces the selection and closes the
        // popover. Gives single trace dropdowns (e.g. Parent Safety
        // Goal) the same search the multi-selects already have.
        this.single     = !!opts.single;

        // Visible button — sits in the row cell. Background colour and
        // icon convey selection state at a glance:
        //   gray with ○ when nothing is selected
        //   green with ✓ when at least one is selected
        // Click opens the popover.
        this.btn = document.createElement('button');
        this.btn.type = 'button';
        this.btn.className = 'multiselect-btn';
        this.btn.addEventListener('click', e => {
            e.stopPropagation();
            this._toggle();
        });

        this.popover = null;
        this.outsideClickHandler = null;
        this._refreshButton();
    }

    /** The DOM node the caller mounts in their layout. */
    get element() { return this.btn; }

    /**
     * Update the in-memory option set without rebuilding the widget
     * (e.g. user added a new mode after this widget was rendered).
     * Stays selected on entries that still exist; drops the rest.
     */
    setOptions(options) {
        this.options = options || [];
        const valid = new Set(this.options.map(o => o.value));
        // Drop selections that no longer reference an existing option.
        for (const v of [...this.selected]) if (!valid.has(v)) this.selected.delete(v);
        this._refreshButton();
        if (this.popover) { this._close(); this._open(); }
    }

    /** Re-paint the button to reflect this.selected. */
    _refreshButton() {
        const n = this.selected.size;
        const total = this.options.length;
        if (n === 0) {
            this.btn.className = 'multiselect-btn empty';
            // Visually cool, gray. ○ icon + plain text — no ambiguity.
            this.btn.innerHTML = `<span class="ms-icon">○</span> none<span class="ms-of">${total ? ' of ' + total : ''}</span>`;
            this.btn.setAttribute('title',
                total === 0 ? this.emptyLabel
                            : `No ${this.unitLabel}s selected — click to choose from ${total}.`);
        } else {
            // Show the actual names if they fit. If the list would
            // overflow (>40 chars), fall back to "N of M" so the row
            // doesn't blow up horizontally.
            const names = [...this.selected].map(v => {
                const opt = this.options.find(o => o.value === v);
                return opt ? opt.label : v;
            });
            const joined = names.join(', ');
            const display = joined.length <= 40 ? joined : `${n} of ${total}`;
            this.btn.className = 'multiselect-btn selected';
            this.btn.innerHTML = `<span class="ms-icon">✓</span> ${display}`;
            this.btn.setAttribute('title',
                names.length === 1
                    ? `Selected: ${names[0]}`
                    : `Selected (${n}): ${names.join(', ')}`);
        }
    }

    _toggle() {
        if (this.popover) this._close();
        else this._open();
    }

    _open() {
        const rect = this.btn.getBoundingClientRect();
        this.popover = document.createElement('div');
        this.popover.className = 'multiselect-popover';
        // position:fixed avoids issues with scrollable parents and works
        // identically inside or outside any container.
        this.popover.style.position = 'fixed';
        this.popover.style.top  = (rect.bottom + 4) + 'px';
        this.popover.style.left = rect.left + 'px';
        this.popover.style.minWidth = Math.max(180, rect.width) + 'px';

        if (this.options.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ms-empty';
            empty.textContent = this.emptyLabel;
            this.popover.appendChild(empty);
        } else {
            // Search filter. Shown whenever the list is beyond trivial
            // size — v1.6.2 lowered the threshold from 8 to 4 after field
            // feedback: typical projects hold 5–8 functions/goals/modes,
            // so the old threshold made the search look absent entirely.
            // Filtering is case-insensitive substring over the visible
            // label; it never changes selection, only visibility.
            const FILTER_THRESHOLD = 4;
            let filterInput = null;
            if (this.options.length > FILTER_THRESHOLD) {
                const fwrap = document.createElement('div');
                fwrap.className = 'ms-filter';
                filterInput = document.createElement('input');
                filterInput.type = 'text';
                filterInput.placeholder = `Search ${this.options.length} ${this.unitLabel}s…`;
                filterInput.className = 'ms-filter-input';
                // Don't let keystrokes bubble to row/table handlers.
                filterInput.addEventListener('keydown', e => e.stopPropagation());
                fwrap.appendChild(filterInput);
                this.popover.appendChild(fwrap);
            }

            const list = document.createElement('div');
            list.className = 'ms-list';
            const rows = [];
            this.options.forEach(opt => {
                const row = document.createElement('label');
                row.className = 'ms-row';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = this.selected.has(opt.value);
                cb.addEventListener('change', () => {
                    if (this.single) {
                        this.selected.clear();
                        if (cb.checked) this.selected.add(opt.value);
                        this._refreshButton();
                        this.onChange([...this.selected]);
                        this._close();
                        return;
                    }
                    if (cb.checked) this.selected.add(opt.value);
                    else            this.selected.delete(opt.value);
                    this._refreshButton();
                    this.onChange([...this.selected]);
                });
                row.appendChild(cb);
                const span = document.createElement('span');
                span.className = 'ms-label';
                span.textContent = opt.label;
                row.appendChild(span);
                list.appendChild(row);
                rows.push({ row, hay: opt.label.toLowerCase() });
            });
            this.popover.appendChild(list);

            if (filterInput) {
                let noHits = null;
                filterInput.addEventListener('input', () => {
                    const q = filterInput.value.trim().toLowerCase();
                    let visible = 0;
                    rows.forEach(({ row, hay }) => {
                        const show = !q || hay.indexOf(q) !== -1;
                        row.style.display = show ? '' : 'none';
                        if (show) visible++;
                    });
                    if (!noHits) {
                        noHits = document.createElement('div');
                        noHits.className = 'ms-empty';
                        noHits.textContent = 'No matches.';
                        list.appendChild(noHits);
                    }
                    noHits.style.display = visible === 0 ? '' : 'none';
                });
                // Focus the search box when the popover opens so the
                // user can type immediately.
                setTimeout(() => filterInput.focus(), 0);
            }
        }
        document.body.appendChild(this.popover);

        // If the popover would overflow the viewport bottom, flip it up.
        const popRect = this.popover.getBoundingClientRect();
        if (popRect.bottom > window.innerHeight - 8) {
            const flipped = rect.top - popRect.height - 4;
            if (flipped > 8) this.popover.style.top = flipped + 'px';
        }

        // Outside-click closes. We listen on mousedown so the click that
        // opened the popover (already past mousedown by the time this
        // handler is attached) can't trigger an immediate close.
        this.outsideClickHandler = e => {
            if (!this.popover) return;
            if (this.popover.contains(e.target)) return;
            if (e.target === this.btn || this.btn.contains(e.target)) return;
            this._close();
        };
        // Defer one tick so the very click that opened doesn't close it.
        setTimeout(() => {
            document.addEventListener('mousedown', this.outsideClickHandler, true);
        }, 0);
    }

    _close() {
        const wasOpen = !!this.popover;
        if (this.popover) {
            this.popover.remove();
            this.popover = null;
        }
        if (this.outsideClickHandler) {
            document.removeEventListener('mousedown', this.outsideClickHandler, true);
            this.outsideClickHandler = null;
        }
        // Defer onClose to the next macrotask so any in-flight click that
        // *triggered* this close (e.g. the user clicking a sibling button
        // to switch from Mode-1's picker to Mode-2's) can complete before
        // the host table re-renders. Without this defer, refresh runs
        // synchronously during the mousedown handler, the table is rebuilt,
        // and the bubble-phase click on the sibling button reaches a node
        // that's already detached — the second picker silently fails to
        // open. setTimeout(_, 0) schedules onClose after the current event
        // chain has unwound.
        if (wasOpen) setTimeout(() => this.onClose(), 0);
    }
}
