/**
 * Turns thumbs down feedback into behavior.
 *
 * A "wrong" mark on a cue suppresses that trigger -> sound pairing for the
 * rest of the session; repeated marks on the same sound disable it outright
 * (the Sound Library already lets the user re-enable disabled sounds).
 * A "correct" mark clears the pairing's strikes. Pure: the engine owns
 * persistence and playback.
 */

export const SESSION_SUPPRESS_MS = 30 * 60 * 1000;
export const DISABLE_AFTER_STRIKES = 3;

function pairKey(trigger, soundId) {
    return `${String(trigger || '').toLowerCase().trim()}|${String(soundId || '').toLowerCase().trim()}`;
}

/** @returns {Record<string, { strikes: number, until: number }>} */
export function normalizeSuppressions(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out = {};
    for (const [key, value] of Object.entries(raw)) {
        const strikes = Number(value?.strikes);
        const until = Number(value?.until);
        if (!key.includes('|') || !Number.isFinite(strikes) || strikes <= 0) continue;
        out[key] = { strikes: Math.floor(strikes), until: Number.isFinite(until) ? until : 0 };
    }
    return out;
}

/**
 * @returns {{ store: Object, strikes: number, disableSound: boolean }}
 */
export function recordWrong(store, { trigger = '', soundId = '', now = Date.now() } = {}) {
    if (!soundId) return { store, strikes: 0, disableSound: false };
    const next = { ...store };
    const keys = new Set([pairKey(trigger, soundId), pairKey('', soundId)]);
    let strikes = 0;
    for (const key of keys) {
        const prev = next[key] || { strikes: 0, until: 0 };
        next[key] = { strikes: prev.strikes + 1, until: now + SESSION_SUPPRESS_MS };
        strikes = Math.max(strikes, next[key].strikes);
    }
    return { store: next, strikes, disableSound: strikes >= DISABLE_AFTER_STRIKES };
}

export function recordCorrect(store, { trigger = '', soundId = '' } = {}) {
    if (!soundId) return store;
    const next = { ...store };
    delete next[pairKey(trigger, soundId)];
    // A confirmed hit also forgives earlier sound only strikes.
    delete next[pairKey('', soundId)];
    return next;
}

/** True when this trigger -> sound pairing (or the sound by itself) is suppressed. */
export function isSuppressed(store, { trigger = '', soundId = '', now = Date.now() } = {}) {
    if (!store || !soundId) return false;
    for (const key of [pairKey(trigger, soundId), pairKey('', soundId)]) {
        const entry = store[key];
        if (entry && entry.until > now) return true;
    }
    return false;
}

/** Drop expired entries that never reached the disable threshold. */
export function pruneSuppressions(store, now = Date.now()) {
    const out = {};
    for (const [key, entry] of Object.entries(store || {})) {
        if (entry.until > now || entry.strikes >= DISABLE_AFTER_STRIKES) out[key] = entry;
    }
    return out;
}
