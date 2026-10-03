/**
 * Safe readers for numeric user settings persisted in localStorage.
 *
 * A bare `parseFloat(localStorage.getItem(...))` turns any corrupted or
 * hand edited value into NaN, which then flows silently into GainNode math
 * and mutes or distorts playback. Every numeric preference goes through here
 * so bad values collapse to the documented default and stay inside range.
 */

function clamp(value, min, max) {
    if (typeof min === 'number' && value < min) return min;
    if (typeof max === 'number' && value > max) return max;
    return value;
}

/**
 * @param {string|null|undefined} raw
 * @param {{ fallback: number, min?: number, max?: number, integer?: boolean }} opts
 */
export function coerceStoredNumber(raw, { fallback, min, max, integer = false }) {
    if (raw === null || raw === undefined || raw === '') return fallback;
    const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return clamp(parsed, min, max);
}

/**
 * @param {Storage|null|undefined} storage  usually window.localStorage
 * @param {string} key
 * @param {{ fallback: number, min?: number, max?: number, integer?: boolean }} opts
 */
export function readStoredNumber(storage, key, opts) {
    let raw = null;
    try {
        raw = storage?.getItem?.(key) ?? null;
    } catch {
        raw = null;
    }
    return coerceStoredNumber(raw, opts);
}
