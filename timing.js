/**
 * timing.js
 *
 * Duration parser/formatter. The internal representation is milliseconds
 * (number); the user-facing representation is whatever they typed,
 * formatted back to a sensible unit on display.
 *
 * Accepted input shapes (case-insensitive, whitespace-tolerant):
 *   "100"    → 100 ms (bare number = ms)
 *   "100ms"  → 100 ms
 *   "1 s"    → 1000 ms
 *   "1.5s"   → 1500 ms
 *   "200 µs" → 0.2 ms      (µs and us both accepted)
 *   "2 min"  → 120000 ms
 *
 * Returns:
 *   - a number (ms) on success
 *   - null for empty input
 *   - NaN for unparseable input (caller decides whether to flag)
 */

const Timing = (() => {

    const RE = /^(-?\d+(?:\.\d+)?)\s*(ms|s|m|min|h|hr|us|µs)?$/i;

    function parseMs(input) {
        if (input == null) return null;
        const s = String(input).trim();
        if (!s) return null;
        const m = RE.exec(s);
        if (!m) return NaN;
        const v = parseFloat(m[1]);
        const u = (m[2] || 'ms').toLowerCase();
        switch (u) {
            case 'ms':           return v;
            case 's':            return v * 1000;
            case 'm':  case 'min': return v * 60000;
            case 'h':  case 'hr':  return v * 3600000;
            case 'us': case 'µs':  return v / 1000;
        }
        return NaN;
    }

    /** Render ms as the most readable unit. */
    function formatMs(ms) {
        if (ms == null || isNaN(ms)) return '';
        if (ms === 0) return '0 ms';
        if (Math.abs(ms) >= 60000) return +(ms / 60000).toFixed(3) + ' min';
        if (Math.abs(ms) >= 1000)  return +(ms / 1000).toFixed(3) + ' s';
        if (Math.abs(ms) < 1)      return +(ms * 1000).toFixed(3) + ' µs';
        return +ms.toFixed(3) + ' ms';
    }

    return { parseMs, formatMs };
})();
