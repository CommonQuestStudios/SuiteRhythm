/**
 * Multi-word narrative phrase triggers.
 *
 * Single keywords miss "drew his sword" or "crack of thunder"; these entries
 * catch the high drama phrasing. Each entry names the exact catalog sound it
 * should play (`sound`) so resolution is deterministic: a phrase is only ever
 * useful if it reliably lands on a real file. `query` is kept as the human
 * readable label and as a last resort lookup for user defined phrases.
 */

import { normalizeSoundName } from '../sound-catalog.js';
import { isMentionNegated } from './trigger-system.js';

export const PHRASE_TRIGGERS = [
    // Wind & weather context (before creature/combat so "roar of the wind" wins)
    { patterns: ['roar of the wind', 'roar of the storm', 'roar of the gale', 'wind roared', 'storm roared', 'gale roared', 'wind roars', 'storm roars', 'roaring wind', 'roaring storm', 'roaring gale', 'roaring tempest'], query: 'wind howling storm', sound: 'wind howl', volume: 0.7 },
    { patterns: ['roar of the sea', 'roar of the ocean', 'roar of the waves', 'sea roared', 'ocean roared', 'waves roared', 'roaring sea', 'roaring ocean', 'roaring waves', 'roar of the surf'], query: 'ocean waves crashing', sound: 'ocean wave crash shore', volume: 0.7 },
    { patterns: ['roar of the fire', 'roar of the flames', 'roar of the blaze', 'fire roars', 'flames roar', 'fire roared', 'flames roared', 'roaring fire', 'roaring flames', 'roaring inferno'], query: 'fire roaring crackling', sound: 'bonfire large roaring', volume: 0.7 },
    { patterns: ['roar of the crowd', 'crowd roars', 'crowd roared', 'roaring crowd', 'roaring audience', 'audience roared'], query: 'crowd cheering', sound: 'crowd cheering', volume: 0.7 },
    { patterns: ['wind howled', 'wind was howling', 'howl of the wind', 'howling wind', 'wind howling', 'howling gale', 'gale howled'], query: 'wind howling', sound: 'wind howl', volume: 0.7 },
    { patterns: ['waves crashed', 'waves crashing', 'crash of the waves', 'sea crashed', 'surf crashed', 'waves crash'], query: 'ocean waves crashing', sound: 'ocean wave crash shore', volume: 0.7 },
    // Combat actions
    { patterns: ['drew his sword', 'drew her sword', 'drew their sword', 'draws his sword', 'draws her sword', 'drew a sword', 'draws a sword', 'pulled out his sword', 'pulled out her sword', 'unsheathed his sword', 'unsheathed her sword'], query: 'sword draw', sound: 'draw sword', volume: 0.8 },
    { patterns: ['swings his sword', 'swings her sword', 'swung his sword', 'swung her sword', 'slashes with', 'slashed with', 'brings his blade', 'brings her blade', 'blade cuts', 'sword slices'], query: 'sword slash', sound: 'sword swing', volume: 0.85 },
    { patterns: ['notched an arrow', 'nocked an arrow', 'drew an arrow', 'draws an arrow', 'takes aim', 'takes her aim', 'takes his aim', 'took aim', 'lines up the shot'], query: 'bow draw', sound: 'bowstring draw tension', volume: 0.7 },
    { patterns: ['fires the arrow', 'fired the arrow', 'releases the arrow', 'released the arrow', 'lets the arrow fly', 'let the arrow fly', 'looses the arrow', 'loosed the arrow'], query: 'arrow release', sound: 'arrow fly whoosh', volume: 0.75 },
    { patterns: ['kicks the door', 'kicked the door', 'kicks open the door', 'kicked open the door', 'kicks down the door', 'kicked down the door', 'door flies open', 'door flew open', 'burst through the door', 'bursts through the door', 'slams the door', 'slammed the door', 'door slams', 'door slammed'], query: 'door slam', sound: 'door slam heavy', volume: 0.85 },
    { patterns: ['throws a punch', 'threw a punch', 'throws his fist', 'throws her fist', 'lands a blow', 'landed a blow', 'delivers a punch', 'delivered a punch', 'connects with a punch'], query: 'punch impact', sound: 'punch impact', volume: 0.8 },
    { patterns: ['cracks of thunder', 'crack of thunder', 'thunder crashes', 'thunder crashed', 'thunder rolls', 'thunder rolled', 'thunder booms', 'thunder boomed', 'thunder cracked', 'lightning strikes', 'lightning struck', 'lightning flashes', 'lightning flashed'], query: 'thunder crack', sound: 'thunder crack close', volume: 0.9 },
    // Environment
    { patterns: ['the room goes dark', 'the room went dark', 'lights go out', 'lights went out', 'candle goes out', 'candle went out', 'torch goes out', 'torch went out', 'plunged into darkness'], query: 'candle extinguish', sound: 'torch extinguish', volume: 0.6 },
    { patterns: ['glass shatters', 'glass shattered', 'window shatters', 'window shattered', 'mirror shatters', 'mirror shattered', 'shatters into pieces', 'shattered into pieces', 'breaks the glass', 'broke the glass', 'glass breaks', 'glass broke', 'smashes the window', 'smashed the window'], query: 'glass shatter', sound: 'glass shatter', volume: 0.85 },
    { patterns: ['fire spreads', 'fire spread', 'flames erupt', 'flames erupted', 'burst into flames', 'bursts into flames', 'catches fire', 'caught fire', 'erupts in flames', 'erupted in flames'], query: 'fire roar', sound: 'fire spreading crackle', volume: 0.8 },
    { patterns: ['heavy rain', 'rain begins', 'rain began', 'starts to rain', 'started to rain', 'rain pours', 'rain poured', 'pouring rain', 'downpour', 'sheets of rain'], query: 'heavy rain', sound: 'heavy rain downpour', volume: 0.6 },
    { patterns: ['creaking floorboards', 'floor creaks', 'floor creaked', 'floorboard creaks', 'floorboard creaked', 'floorboards creaked', 'old staircase', 'stairs creak', 'stairs creaked', 'creaking stairs'], query: 'floorboard creak', sound: 'wood stair groan', volume: 0.6 },
    // Creatures / NPCs
    { patterns: ['wolf howls', 'wolf howled', 'wolves howl', 'wolves howled', 'howl in the distance', 'distant howl', 'howling in the night'], query: 'wolf howl', sound: 'wolf howl', volume: 0.75 },
    { patterns: ['horse gallops', 'horse galloped', 'horse charges', 'horse charged', 'horses thunder', 'horses thundered', 'hooves pound', 'hooves pounded', 'clatter of hooves', 'sound of hooves', 'thunder of hooves'], query: 'horse gallop', sound: 'horse galloping', volume: 0.7 },
    { patterns: ['crowd cheers', 'crowd cheered', 'crowd erupts', 'crowd erupted', 'audience applauds', 'audience applauded', 'cheers from the crowd', 'roar of the crowd'], query: 'crowd cheer', sound: 'crowd cheering', volume: 0.7 },
    { patterns: ['screams echo', 'screams echoed', 'a scream rings', 'a scream rang', 'someone screams', 'someone screamed', 'lets out a scream', 'let out a scream', 'blood curdling scream', 'piercing scream'], query: 'scream', sound: 'woman scream', volume: 0.9 },
    { patterns: ['bell rings', 'bell rang', 'bell tolls', 'bell tolled', 'church bell', 'alarm bell', 'bells ring', 'bells rang', 'bells toll', 'bells tolled'], query: 'bell toll', sound: 'church bell toll', volume: 0.7 },
    { patterns: ['ears ringing', 'ear ringing', 'ears are ringing', 'ringing in her ears', 'ringing in his ears', 'ringing in my ears', 'head ringing', 'ears rang', 'ears began to ring'], query: 'ringing in ears tinnitus', sound: 'ringing in ears', volume: 0.75 },
    // Magic
    { patterns: ['casts a spell', 'cast a spell', 'waves her wand', 'waves his wand', 'waved her wand', 'waved his wand', 'mutters an incantation', 'muttered an incantation', 'speaks the words of power', 'spoke the words of power', 'activates the rune', 'activated the rune', 'channels her magic', 'channels his magic', 'channeled her magic', 'channeled his magic'], query: 'magic spell cast', sound: 'magic spell', volume: 0.8 },
    { patterns: ['explosion rips', 'explosion ripped', 'explosion tears', 'explosion tore', 'massive explosion', 'deafening explosion', 'explosion rocks', 'explosion rocked', 'explosion shakes', 'explosion shook'], query: 'explosion large', sound: 'big explosion', volume: 0.95 },
];

/** Normalize text the same way for patterns and transcripts. */
export function normalizePhraseText(text) {
    return ` ${String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
}

/**
 * Return the entries whose patterns appear in the text, in table order.
 * A pattern that is negated or reported as over ("the thunder of hooves
 * faded", "no one slammed the door") does not count.
 * @param {string} text
 * @param {Array} table
 */
export function matchPhraseTriggers(text, table = PHRASE_TRIGGERS) {
    const haystack = normalizePhraseText(text);
    if (haystack.trim().length === 0) return [];
    const hits = [];
    for (const entry of table) {
        if (!entry || !Array.isArray(entry.patterns)) continue;
        const matchedPattern = entry.patterns.find((pattern) => {
            const normalized = normalizePhraseText(pattern);
            if (!haystack.includes(normalized)) return false;
            const fragment = normalized.trim().split(' ').map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
            return !isMentionNegated(fragment, haystack);
        });
        if (matchedPattern) hits.push({ ...entry, matchedPattern });
    }
    return hits;
}

/**
 * Find the catalog SFX a phrase entry should play.
 * Exact name on `sound`, then `query`, then a normalized name comparison so a
 * catalog rename that only changes punctuation or casing does not kill a cue.
 * @param {{ sound?: string, query?: string }} entry
 * @param {Array<{ id?: string, name?: string, type?: string }>} catalog
 */
export function resolvePhraseSound(entry, catalog) {
    if (!entry || !Array.isArray(catalog) || catalog.length === 0) return null;
    const sfx = catalog.filter((s) => s && s.type === 'sfx');
    const wanted = [entry.sound, entry.query].filter(Boolean).map((v) => String(v).toLowerCase().trim());
    if (!wanted.length) return null;

    for (const target of wanted) {
        const exact = sfx.find((s) =>
            String(s.name || '').toLowerCase() === target || String(s.id || '').toLowerCase() === target
        );
        if (exact) return exact;
    }
    for (const target of wanted) {
        const key = normalizeSoundName(target);
        if (!key) continue;
        const loose = sfx.find((s) => normalizeSoundName(s.name) === key || normalizeSoundName(s.id) === key);
        if (loose) return loose;
    }
    return null;
}
