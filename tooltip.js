/**
 * tooltip.js
 *
 * Custom tooltip layer.
 *
 * Why this exists
 * ---------------
 * Native HTML `title` attributes have three problems for this tool:
 *   1. They open after a 1–2 s delay — too slow when scanning a dense
 *      summary pane.
 *   2. On tiny inline elements (e.g. an `A:0` span, a single ✓ glyph,
 *      a 10×10 status dot) some browsers never trigger them at all.
 *   3. They appear at an OS-determined position, not next to the
 *      cursor — easy to miss, especially in the right-pane summary
 *      where the cursor is already at the edge of the screen.
 *
 * The manager below replaces them with one shared <div> that:
 *   - opens immediately on mouseenter,
 *   - follows the cursor (offset by 14 px so it never sits *under*
 *     the pointer),
 *   - flips to the other side of the cursor when it would overflow
 *     the viewport,
 *   - reads from the existing `title` attributes already scattered
 *     across the codebase, OR from `data-tip` if a future caller
 *     prefers that (some elements use `title` for other UA features
 *     and shouldn't be hijacked).
 *
 * The manager strips the `title` attribute while it is showing so
 * the browser's native tooltip does not also fire, and restores it on
 * leave so the value stays in the DOM (export, accessibility tree,
 * automated tests).
 *
 * Single global instance is enough — created from main.js once the
 * DOM is ready. No teardown needed; document-level listeners survive
 * any number of editor re-renders.
 */

class TooltipManager {

    constructor() {
        this.el = document.createElement('div');
        this.el.className = 'custom-tooltip';
        this.el.setAttribute('role', 'tooltip');
        this.el.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.el);

        this.activeTarget = null;
        this.savedTitle = null;

        // Document-level delegation. mouseover/mouseout bubble, so a
        // single pair of listeners covers every element ever rendered,
        // including nodes added by future editor re-renders.
        document.addEventListener('mouseover', this._onOver.bind(this), true);
        document.addEventListener('mouseout',  this._onOut.bind(this),  true);
        document.addEventListener('mousemove', this._onMove.bind(this));
        // Hide on scroll/blur so the tooltip never floats over stale
        // content the user has already moved past.
        window.addEventListener('scroll', () => this._hide(), true);
        window.addEventListener('blur',   () => this._hide());
    }

    /**
     * Walk up from the moused element looking for the nearest ancestor
     * that carries an explanation. We accept either:
     *   - data-tip="..."  (preferred for new code; never collides
     *                      with other UA behaviours)
     *   - title="..."     (everything Phase 1 already wrote)
     * The first non-empty value wins.
     */
    _findTipTarget(start) {
        let el = start;
        while (el && el.nodeType === 1 && el !== document.body) {
            if (el.hasAttribute('data-tip')) {
                const v = el.getAttribute('data-tip');
                if (v && v.trim()) return { el, text: v, source: 'data-tip' };
            }
            if (el.hasAttribute('title')) {
                const v = el.getAttribute('title');
                if (v && v.trim()) return { el, text: v, source: 'title' };
            }
            el = el.parentNode;
        }
        return null;
    }

    _onOver(e) {
        const found = this._findTipTarget(e.target);
        if (!found) {
            // Moved out of any tip-bearing region.
            if (this.activeTarget) this._hide();
            return;
        }
        // Same target as before — nothing to do, position is updated
        // by mousemove.
        if (found.el === this.activeTarget) return;

        // Switching targets — clean up the previous one first.
        if (this.activeTarget) this._hide();

        // Suppress the native tooltip from also opening.
        if (found.source === 'title') {
            this.savedTitle = found.el.getAttribute('title');
            found.el.removeAttribute('title');
        } else {
            this.savedTitle = null;
        }
        this.activeTarget = found.el;

        this.el.textContent = found.text;
        this.el.classList.add('visible');
        this.el.setAttribute('aria-hidden', 'false');
        this._position(e);
    }

    _onOut(e) {
        if (!this.activeTarget) return;
        // Mouse may just be moving to a child of the active target —
        // ignore that; only hide when leaving the target's subtree.
        const to = e.relatedTarget;
        if (to && this.activeTarget.contains(to)) return;
        this._hide();
    }

    _onMove(e) {
        if (!this.activeTarget) return;
        this._position(e);
    }

    /**
     * Position the tooltip near the cursor with viewport flipping.
     * Default offset is 14 px down-right; if that would push the
     * tooltip off-screen we flip horizontally and/or vertically.
     */
    _position(e) {
        const OFFSET = 14;
        const PAD    = 8;
        // Measure once per move — the size depends on the text content.
        const w = this.el.offsetWidth;
        const h = this.el.offsetHeight;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let x = e.clientX + OFFSET;
        let y = e.clientY + OFFSET;
        if (x + w > vw - PAD) x = e.clientX - w - OFFSET;
        if (y + h > vh - PAD) y = e.clientY - h - OFFSET;
        if (x < PAD) x = PAD;
        if (y < PAD) y = PAD;

        this.el.style.left = x + 'px';
        this.el.style.top  = y + 'px';
    }

    _hide() {
        this.el.classList.remove('visible');
        this.el.setAttribute('aria-hidden', 'true');
        // Restore the title attribute we hijacked, but only if the
        // element still exists in the DOM. After an editor re-render
        // the original node may be gone.
        if (this.activeTarget && this.savedTitle !== null
                && document.body.contains(this.activeTarget)) {
            this.activeTarget.setAttribute('title', this.savedTitle);
        }
        this.activeTarget = null;
        this.savedTitle = null;
    }
}
