#!/usr/bin/env node
/**
 * Keyword enrichment pass for public/saved-sounds.json.
 *
 * Goal: every entry in the catalog has enough well-chosen keywords that
 * the engine's AI Director, search, scene-preset matcher, and ambient-bed
 * picker can actually find the right sound.
 *
 * What this does (idempotent — safe to rerun):
 *   1. Tokenize each entry's `name` and add significant words as keywords.
 *   2. Expand keyword synonyms (sword -> blade/weapon/melee, rain -> weather/storm, etc.).
 *   3. For music/ambience, ensure at least one MOOD tag and one CONTEXT tag
 *      so calculateMusicScore has signal instead of returning ties.
 *   4. Normalize: lowercase, trim, dedupe, strip stopwords, cap at 16 keywords.
 *   5. Backfill: if an entry still has < 5 keywords after enrichment, log it.
 *
 * Runs after retag-catalog.js in the catalog-maintenance pipeline.
 *
 *   node scripts/enrich-keywords.js            # dry-run
 *   node scripts/enrich-keywords.js --write    # overwrite saved-sounds.json
 *   node scripts/enrich-keywords.js --check    # exit 1 if the catalog would change (CI)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, '..', 'public', 'saved-sounds.json');

// ────────────────────────────────────────────────────────────────────────────
// Rules
// ────────────────────────────────────────────────────────────────────────────

// Stopwords stripped from name-derived keywords (still allowed if the user
// put them in explicitly — we never remove existing keywords, only add).
const STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'of', 'to', 'in', 'on', 'at', 'by',
    'for', 'with', 'from', 'into', 'onto', 'up', 'down',
    'is', 'it', 'its', 'be', 'as', 'so',
    // Pronouns and auxiliaries from track titles ("you are near", "we are the visitors").
    'i', 'me', 'my', 'you', 'your', 'we', 'us', 'our', 'they', 'them', 'their',
    'he', 'she', 'his', 'her', 'am', 'are', 'was', 'were', 'this', 'that',
    'music', 'sfx', 'sound', 'effect', 'ambience', 'ambient',
    'loop', 'looping',
]);

const PROTECTED_KEYWORDS = new Set([
    'fantasy', 'horror', 'tavern', 'christmas', 'halloween', 'scifi',
    'combat', 'nature', 'weather', 'ambience', 'ambient',
]);

// Synonym / related-term map. Keys are lower-case triggers found anywhere
// in a name or existing keyword set; values are extra tags to add.
// Keep conservative — we're adding signal, not spam.
const SYNONYMS = {
    // Weapons
    sword:      ['blade', 'weapon', 'melee'],
    blade:      ['sword', 'weapon', 'melee'],
    dagger:     ['blade', 'weapon', 'melee', 'rogue'],
    knife:      ['blade', 'weapon', 'melee'],
    axe:        ['weapon', 'melee'],
    mace:       ['weapon', 'melee', 'blunt'],
    hammer:     ['weapon', 'melee', 'blunt'],
    warhammer:  ['weapon', 'melee', 'blunt'],
    flail:      ['weapon', 'melee'],
    rapier:     ['weapon', 'melee', 'fencing'],
    spear:      ['weapon', 'melee', 'polearm'],
    staff:      ['weapon'],
    bow:        ['weapon', 'ranged', 'archer'],
    crossbow:   ['weapon', 'ranged', 'archer'],
    arrow:      ['ranged', 'archer', 'weapon'],
    bolt:       ['ranged', 'weapon'],
    pistol:     ['gun', 'firearm', 'ranged'],
    cannon:     ['firearm', 'ranged', 'siege'],
    whip:       ['weapon'],

    // Combat concepts
    fight:      ['combat', 'battle'],
    battle:     ['combat', 'fight', 'war'],
    combat:     ['fight', 'battle'],
    attack:     ['combat'],
    parry:      ['combat', 'block'],
    block:      ['combat', 'defense'],
    shield:     ['defense', 'block'],
    dodge:      ['combat', 'evade'],
    critical:   ['combat', 'hit'],
    crit:       ['critical', 'combat'],
    duel:       ['combat', 'fight'],
    siege:      ['war', 'battle', 'medieval'],
    war:        ['battle', 'combat'],
    charge:     ['combat', 'attack'],

    // Magic
    spell:      ['magic', 'arcane', 'cast', 'casting'],
    magic:      ['spell', 'arcane'],
    magical:    ['magic', 'arcane', 'spell'],
    fireball:   ['fire', 'spell', 'magic', 'evocation'],
    lightning:  ['electric', 'thunder', 'spell', 'magic'],
    healing:    ['heal', 'cleric', 'divine', 'holy'],
    heal:       ['healing', 'cleric', 'divine'],
    curse:      ['dark', 'magic', 'evil'],
    cursed:     ['curse', 'dark', 'magic'],
    poison:     ['toxic', 'dark'],
    charm:      ['enchantment', 'magic'],
    summon:     ['magic', 'ritual', 'conjure'],
    summoning:  ['summon', 'magic', 'ritual'],
    ritual:     ['magic', 'ceremonial'],
    portal:     ['magic', 'teleport', 'arcane'],
    teleport:   ['portal', 'magic'],
    arcane:     ['magic', 'spell'],
    divine:     ['holy', 'cleric'],
    holy:       ['divine', 'cleric'],
    wizard:     ['mage', 'arcane', 'magic'],
    mage:       ['wizard', 'arcane', 'magic'],
    warlock:    ['magic', 'dark', 'pact'],
    cleric:     ['holy', 'divine', 'heal'],
    druid:      ['nature', 'magic'],
    sorcerer:   ['magic', 'arcane'],
    eldritch:   ['dark', 'cosmic', 'horror'],
    necromantic:['dark', 'death', 'undead'],

    // Weather / environment
    rain:       ['weather', 'storm', 'water'],
    storm:      ['weather', 'rain', 'thunder'],
    thunder:    ['storm', 'weather', 'lightning'],
    lightning:  ['storm', 'electric', 'thunder'],
    snow:       ['winter', 'weather', 'cold'],
    blizzard:   ['snow', 'winter', 'weather', 'cold'],
    wind:       ['weather', 'breeze'],
    breeze:     ['wind', 'weather'],
    fog:        ['mist', 'weather', 'eerie'],
    mist:       ['fog', 'weather'],
    rainy:      ['rain', 'weather'],
    sunny:      ['day', 'warm'],
    cold:       ['winter', 'ice'],
    ice:        ['cold', 'winter', 'frozen'],
    frozen:     ['ice', 'cold', 'winter'],
    fire:       ['flame', 'heat'],
    flame:      ['fire', 'heat'],
    lava:       ['fire', 'volcanic', 'heat'],
    volcano:    ['volcanic', 'fire', 'lava'],
    volcanic:   ['volcano', 'fire', 'lava'],
    earthquake: ['disaster', 'shake'],
    avalanche:  ['snow', 'disaster', 'mountain'],
    rockslide:  ['disaster', 'mountain'],

    // Biomes / locations
    forest:     ['woodland', 'nature', 'trees'],
    woodland:   ['forest', 'nature', 'trees'],
    jungle:     ['rainforest', 'tropical'],
    rainforest: ['jungle', 'tropical'],
    desert:     ['sand', 'arid', 'dry'],
    tundra:     ['cold', 'winter', 'arctic'],
    arctic:     ['cold', 'winter', 'tundra'],
    cave:       ['cavern', 'underground'],
    cavern:     ['cave', 'underground'],
    underground:['cave', 'dungeon'],
    dungeon:    ['underground', 'dnd'],
    swamp:      ['marsh', 'bog', 'wetland'],
    marsh:      ['swamp', 'wetland'],
    mountain:   ['peak', 'altitude'],
    coast:      ['sea', 'ocean', 'beach'],
    coastal:    ['coast', 'sea', 'ocean'],
    sea:        ['ocean', 'water', 'nautical'],
    ocean:      ['sea', 'water', 'nautical'],
    river:      ['water', 'stream'],
    stream:     ['river', 'water', 'creek'],
    brook:      ['stream', 'water', 'creek'],
    waterfall:  ['water', 'cascade'],
    lake:       ['water'],
    underwater: ['ocean', 'sea', 'submerged'],
    sky:        ['air', 'aerial'],
    meadow:     ['grass', 'field', 'peaceful'],
    countryside:['rural', 'farm'],
    farm:       ['countryside', 'rural'],
    graveyard:  ['cemetery', 'undead', 'dead'],
    cemetery:   ['graveyard', 'dead'],
    battlefield:['war', 'battle', 'death'],
    ruins:      ['ancient', 'ruined'],
    ancient:    ['old', 'historic'],

    // Structures / interiors
    tavern:     ['pub', 'inn', 'bar', 'medieval'],
    inn:        ['tavern', 'pub'],
    castle:     ['fortress', 'medieval'],
    fortress:   ['castle', 'medieval'],
    temple:     ['sacred', 'holy', 'religious'],
    crypt:      ['tomb', 'undead', 'dead'],
    tomb:       ['crypt', 'dead'],
    library:    ['books', 'study', 'scholar'],
    throne:     ['royal', 'king', 'queen'],
    royal:      ['throne', 'noble', 'king'],
    noble:      ['royal', 'wealthy'],
    market:     ['marketplace', 'bazaar', 'vendors'],
    marketplace:['market', 'bazaar'],
    bazaar:     ['market', 'exotic'],
    forge:      ['blacksmith', 'smith', 'anvil'],
    blacksmith: ['forge', 'smith'],
    stable:     ['horse', 'barn'],
    harbor:     ['port', 'docks', 'sea'],
    docks:      ['harbor', 'port', 'sea'],
    ship:       ['boat', 'nautical'],

    // Creatures
    dragon:     ['beast', 'monster', 'fantasy', 'boss'],
    wolf:       ['beast', 'canine'],
    bear:       ['beast'],
    horse:      ['mount'],
    zombie:     ['undead', 'monster'],
    skeleton:   ['undead', 'monster'],
    ghost:      ['undead', 'spirit', 'spectral'],
    spirit:     ['ghost', 'spectral', 'undead'],
    vampire:    ['undead', 'monster', 'gothic'],
    orc:        ['monster', 'humanoid'],
    goblin:     ['monster', 'humanoid'],
    troll:      ['monster', 'beast'],
    giant:      ['monster', 'humanoid'],
    demon:      ['monster', 'evil'],
    devil:      ['monster', 'evil'],
    undead:     ['death', 'monster'],
    monster:    ['creature', 'beast'],
    beast:      ['creature', 'monster'],
    creature:   ['beast', 'monster'],
    bird:       ['avian'],
    fish:       ['aquatic'],
    insect:     ['bug'],
    kraken:     ['monster', 'sea', 'tentacle'],
    phoenix:    ['fire', 'bird', 'rebirth'],
    unicorn:    ['magical', 'pure', 'horse'],
    griffon:    ['beast', 'flight'],
    owlbear:    ['monster', 'beast', 'dnd'],
    beholder:   ['monster', 'dnd'],
    'mind flayer': ['monster', 'psychic', 'dnd'],
    illithid:   ['mind flayer', 'monster', 'dnd'],

    // Moods
    epic:       ['heroic', 'grand', 'cinematic'],
    heroic:     ['epic', 'brave'],
    grand:      ['epic', 'majestic'],
    majestic:   ['grand', 'regal'],
    dark:       ['ominous', 'evil', 'sinister'],
    ominous:    ['dark', 'foreboding'],
    eerie:      ['unsettling', 'creepy', 'horror'],
    creepy:     ['eerie', 'horror', 'unsettling'],
    horror:     ['scary', 'creepy', 'fear'],
    scary:      ['horror', 'fear'],
    tense:      ['suspense', 'tension'],
    suspense:   ['tense', 'tension'],
    tension:    ['tense', 'suspense'],
    peaceful:   ['calm', 'serene', 'gentle'],
    calm:       ['peaceful', 'gentle', 'quiet'],
    gentle:     ['soft', 'calm'],
    sad:        ['melancholy', 'sorrow'],
    melancholy: ['sad', 'sorrow', 'reflective'],
    joyful:     ['happy', 'celebration'],
    happy:      ['joyful', 'cheerful'],
    triumph:    ['victory', 'heroic', 'celebration'],
    triumphant: ['triumph', 'victory', 'heroic'],
    victory:    ['triumph', 'win', 'heroic'],
    mysterious: ['mystery', 'intrigue'],
    mystery:    ['mysterious', 'intrigue'],
    romantic:   ['love', 'tender'],
    tender:     ['gentle', 'romantic'],
    whimsical:  ['playful', 'light', 'comedic'],
    playful:    ['whimsical', 'light'],

    // Genres / settings
    medieval:   ['fantasy', 'historic'],
    fantasy:    ['medieval', 'magical'],
    'high fantasy': ['fantasy', 'heroic', 'epic'],
    'dark fantasy': ['fantasy', 'grimdark', 'dark'],
    grimdark:   ['dark fantasy', 'brooding'],
    'sci-fi':   ['science fiction', 'futuristic', 'space'],
    scifi:      ['sci-fi', 'futuristic'],
    space:      ['sci-fi', 'cosmic', 'stars'],
    cosmic:     ['space', 'sci-fi'],
    cyberpunk:  ['sci-fi', 'futuristic', 'neon'],
    steampunk:  ['victorian', 'clockwork', 'industrial'],
    gothic:     ['dark', 'horror', 'victorian'],
    lovecraft:  ['cosmic', 'horror', 'eldritch'],
    lovecraftian:['lovecraft', 'cosmic', 'horror'],
    western:    ['cowboy', 'frontier', 'desert'],
    cowboy:     ['western'],
    pirate:     ['sea', 'nautical', 'sailing'],
    viking:     ['norse', 'warrior'],
    norse:      ['viking'],
    samurai:    ['asian', 'japanese'],
    ninja:      ['stealth', 'asian'],
    egyptian:   ['ancient', 'desert'],
    arabian:    ['desert', 'exotic'],
    tropical:   ['jungle', 'rainforest'],
    celtic:     ['irish', 'folk'],
    folk:       ['acoustic', 'traditional'],
    halloween:  ['spooky', 'horror'],
    christmas:  ['holiday', 'winter', 'festive'],
    holiday:    ['festive', 'celebration'],

    // Tempos / energy
    fast:       ['quick', 'energetic'],
    slow:       ['relaxed'],
    quiet:      ['soft', 'peaceful'],
    loud:       ['powerful', 'intense'],
    intense:    ['powerful', 'heavy'],
    heavy:      ['intense', 'powerful'],
    aggressive: ['intense', 'violent'],
    violent:    ['aggressive', 'intense'],

    // Event / impact cues
    explosion:  ['blast', 'boom', 'detonation', 'impact'],
    missile:    ['projectile', 'spell', 'cast', 'arcane'],

    // Character / role cues
    rogue:      ['thief', 'stealth'],
    thief:      ['rogue', 'stealth'],
    stealth:    ['sneak', 'rogue'],
    sneak:      ['stealth', 'rogue'],
    assassin:   ['rogue', 'stealth'],
    bard:       ['music', 'tavern', 'lute'],
    barbarian:  ['rage', 'warrior'],
    paladin:    ['holy', 'warrior'],
    ranger:     ['bow', 'forest'],
    fighter:    ['warrior', 'combat'],
    warrior:    ['fighter', 'combat'],
    king:       ['royal', 'throne'],
    queen:      ['royal', 'throne'],
    princess:   ['royal'],
    prince:     ['royal'],

    // Everyday / foley cues (for generic utility SFX)
    walk:       ['walking', 'footsteps', 'movement'],
    walking:    ['walk', 'footsteps', 'movement'],
    footsteps:  ['walking', 'movement'],
    boots:      ['footsteps', 'walking'],
    gravel:     ['footsteps', 'ground', 'outdoor'],
    hardwood:   ['footsteps', 'floor', 'indoor'],
    pencil:     ['writing', 'paper', 'foley', 'scribble', 'desk'],
    writing:    ['pencil', 'paper', 'foley'],
    paper:      ['writing', 'foley'],
    car:        ['vehicle', 'modern'],
    engine:     ['motor', 'vehicle'],
    vehicle:    ['modern', 'engine'],
    celebration:['joyful', 'festive', 'party'],
    curiosity:  ['mystery', 'intrigue', 'investigation'],
    retriever:  ['dog', 'canine', 'pet', 'animal'],
    barks:      ['bark', 'dog', 'animal'],
    scuba:      ['underwater', 'diving', 'aquatic'],
    breathing:  ['breath', 'human', 'body'],
};

const DERIVED_TRIGGER_BLOCKLIST = new Set(
    [
        ...Object.values(SYNONYMS).flat(),
        'axe', 'blast', 'bolt', 'boom', 'breathing', 'knife', 'punch', 'shot', 'staff', 'stream',
    ]
        .map(normalizeKeyword)
        .filter(Boolean)
);

// Moods we can auto-assign for music/ambience when none is present.
// Scanned in order; first hit wins.
const MOOD_RULES = [
    { mood: 'heroic',     match: /\b(heroic|epic|triumph|victory|glory|adventure|quest)\b/i },
    { mood: 'tense',      match: /\b(tense|suspense|chase|pursuit|ambush|stealth|tension)\b/i },
    { mood: 'combat',     match: /\b(battle|combat|fight|war|skirmish|siege|duel|brawl)\b/i },
    { mood: 'dark',       match: /\b(dark|ominous|sinister|foreboding|grimdark|gothic|evil)\b/i },
    { mood: 'horror',     match: /\b(horror|creepy|eerie|scary|haunted|fear|dread|lovecraft)\b/i },
    { mood: 'mystery',    match: /\b(mystery|mysterious|detective|investigation|noir|intrigue)\b/i },
    { mood: 'peaceful',   match: /\b(peaceful|calm|serene|gentle|quiet|resting|camp)\b/i },
    { mood: 'sad',        match: /\b(sad|melancholy|sorrow|mournful|funeral|dirge|lament)\b/i },
    { mood: 'joyful',     match: /\b(joyful|happy|celebration|festival|wedding|feast|jig)\b/i },
    { mood: 'romantic',   match: /\b(romantic|love|tender|serenade)\b/i },
    { mood: 'whimsical',  match: /\b(whimsical|playful|fairy|comedic|light)\b/i },
    { mood: 'exploration',match: /\b(exploration|journey|travel|voyage|expedition|pass)\b/i },
    { mood: 'magical',    match: /\b(magic|arcane|enchanted|mystical|ethereal)\b/i },
];

// Context tags (where/when this plays). Also first-hit-wins.
const CONTEXT_RULES = [
    { tag: 'tavern',     match: /\b(tavern|inn|pub|bar)\b/i },
    { tag: 'city',       match: /\b(city|market|bazaar|street|slum|district|alley|marketplace)\b/i },
    { tag: 'dungeon',    match: /\b(dungeon|crypt|tomb|underground|cave|cavern|underdark)\b/i },
    { tag: 'forest',     match: /\b(forest|woodland|jungle|rainforest|meadow|grove)\b/i },
    { tag: 'mountain',   match: /\b(mountain|peak|summit|pass|cliff)\b/i },
    { tag: 'sea',        match: /\b(sea|ocean|coast|harbor|docks|naval|pirate|ship|sailing)\b/i },
    { tag: 'desert',     match: /\b(desert|sand|dunes|arabian|egyptian)\b/i },
    { tag: 'swamp',      match: /\b(swamp|marsh|bayou|bog)\b/i },
    { tag: 'temple',     match: /\b(temple|sacred|holy|shrine|cathedral|monastery)\b/i },
    { tag: 'castle',     match: /\b(castle|fortress|keep|throne|royal|noble)\b/i },
    { tag: 'battlefield',match: /\b(battlefield|war|siege|army|cavalry)\b/i },
    { tag: 'wilderness', match: /\b(wilderness|wild|camp|campfire|outdoors)\b/i },
    { tag: 'space',      match: /\b(space|cosmic|starship|alien|planet|spaceship)\b/i },
    { tag: 'feywild',    match: /\b(feywild|fey|fairy|enchanted)\b/i },
    { tag: 'graveyard',  match: /\b(graveyard|cemetery|crypt)\b/i },
    { tag: 'weather',    match: /\b(rain|storm|thunder|snow|wind|blizzard|weather)\b/i },
];

// ────────────────────────────────────────────────────────────────────────────
// Core
// ────────────────────────────────────────────────────────────────────────────

function normalizeKeyword(k) {
    return String(k || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function isMeaningful(k) {
    if (!k) return false;
    if (PROTECTED_KEYWORDS.has(k)) return true;
    if (k.length < 2) return false;
    if (STOPWORDS.has(k)) return false;
    if (/^\d+$/.test(k)) return false;
    return true;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tokenizeName(name) {
    // Split on non-word boundaries, lowercase, drop trivial tokens.
    return String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9\- ]+/g, ' ')
        .split(/\s+/)
        .filter(isMeaningful);
}

function expandSynonyms(keywords, sourceKeywords = keywords) {
    const out = new Set(keywords);
    const sources = [...new Set(sourceKeywords.map(normalizeKeyword).filter(isMeaningful))];
    const haystack = ' ' + sources.join(' ') + ' ';

    for (const [trigger, extras] of Object.entries(SYNONYMS)) {
        const normalizedTrigger = normalizeKeyword(trigger);
        const re = new RegExp(`(?:^|[\\s-])${escapeRegExp(normalizedTrigger)}(?:[\\s-]|$)`, 'i');
        if (re.test(haystack) || sources.includes(normalizedTrigger)) {
            for (const extra of extras) {
                const keyword = normalizeKeyword(extra);
                if (isMeaningful(keyword) && !out.has(keyword)) {
                    out.add(keyword);
                }
            }
        }
    }

    return out;
}

function inferMood(name, keywords) {
    const hay = (name + ' ' + keywords.join(' ')).toLowerCase();
    for (const rule of MOOD_RULES) if (rule.match.test(hay)) return rule.mood;
    return null;
}

function inferContext(name, keywords) {
    const hay = (name + ' ' + keywords.join(' ')).toLowerCase();
    for (const rule of CONTEXT_RULES) if (rule.match.test(hay)) return rule.tag;
    return null;
}

function enrichEntry(entry, stats) {
    const out = { ...entry };
    const before = {
        keywords: [...(entry.keywords || [])].map(normalizeKeyword).filter(isMeaningful),
    };
    const nameTokens = tokenizeName(entry.name);

    // Start from existing keywords, normalized.
    const kw = new Set(before.keywords);

    // 1. Name tokens.
    for (const tok of nameTokens) kw.add(tok);

    // 2. Synonym expansion (runs against name + existing keywords).
    const sourceKeywords = new Set([
        ...nameTokens,
        ...before.keywords.filter((keyword) => !DERIVED_TRIGGER_BLOCKLIST.has(keyword)),
    ]);
    const expanded = expandSynonyms([...kw], [...sourceKeywords]);
    for (const e of expanded) kw.add(e);

    // 3. For music/ambience, ensure a mood + context tag so the scorer has signal.
    if (entry.type === 'music' || entry.type === 'ambience') {
        const haystackKw = [...kw];
        const hasMoodTag = MOOD_RULES.some(r => haystackKw.some(k => r.match.test(k)));
        if (!hasMoodTag) {
            const m = inferMood(entry.name, haystackKw);
            if (m) { kw.add(m); stats.moodAdds[m] = (stats.moodAdds[m] || 0) + 1; }
        }
        const hasContextTag = CONTEXT_RULES.some(r => haystackKw.some(k => r.match.test(k)));
        if (!hasContextTag) {
            const c = inferContext(entry.name, haystackKw);
            if (c) { kw.add(c); stats.contextAdds[c] = (stats.contextAdds[c] || 0) + 1; }
        }
    }

    // 4. Normalize and cap. Stable order: originals first (for readable diffs),
    //    then newly-added keywords alphabetically. Genre tags emitted by
    //    retag-catalog.js are always preserved so the two scripts converge.
    const normalized = [...kw].map(normalizeKeyword).filter(isMeaningful);
    const originals = before.keywords.filter(k => normalized.includes(k));
    const added = normalized
        .filter(k => !before.keywords.includes(k))
        .sort();
    const dedupedOrdered = [];
    const seen = new Set();
    for (const k of [...originals, ...added]) {
        if (seen.has(k)) continue;
        seen.add(k);
        dedupedOrdered.push(k);
    }
    // Cap at 20, but always keep PROTECTED tags (retag genre tags) — they're
    // low-volume and highly-signal so they shouldn't be trimmed.
    const CAP = 20;
    if (dedupedOrdered.length > CAP) {
        const protectedTags = dedupedOrdered.filter(k => PROTECTED_KEYWORDS.has(k));
        const nameTags = dedupedOrdered.filter(k => nameTokens.includes(k) && !PROTECTED_KEYWORDS.has(k));
        const unprotected = dedupedOrdered.filter(k => !PROTECTED_KEYWORDS.has(k) && !nameTokens.includes(k));
        const reserved = [...protectedTags, ...nameTags];
        const keep = unprotected.slice(0, Math.max(0, CAP - reserved.length));
        // Preserve original relative order.
        const keepSet = new Set([...reserved, ...keep]);
        out.keywords = dedupedOrdered.filter(k => keepSet.has(k));
    } else {
        out.keywords = dedupedOrdered;
    }

    // 5. Track changes + light quality check.
    const changed = (
        out.keywords.length !== before.keywords.length ||
        out.keywords.some((k, i) => k !== before.keywords[i])
    );
    if (changed) {
        stats.changed++;
        stats.addedTotal += Math.max(0, out.keywords.length - before.keywords.length);
    }
    if (out.keywords.length < 5) stats.thinEntries.push(entry.name);

    return out;
}

function main() {
    const write = process.argv.includes('--write');
    const check = process.argv.includes('--check');
    const verbose = process.argv.includes('--verbose');

    const raw = fs.readFileSync(CATALOG_PATH, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.files)) {
        console.error('Expected { files: [...] } in', CATALOG_PATH);
        process.exit(1);
    }

    const stats = {
        total: data.files.length,
        changed: 0,
        addedTotal: 0,
        moodAdds: {},
        contextAdds: {},
        thinEntries: [],
        byType: { music: 0, ambience: 0, sfx: 0 },
    };

    const next = data.files.map((f) => {
        stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
        return enrichEntry(f, stats);
    });

    const avgKw = (next.reduce((s, f) => s + (f.keywords?.length || 0), 0) / next.length).toFixed(1);

    console.log(`Catalog entries:           ${stats.total}  (music ${stats.byType.music} / ambience ${stats.byType.ambience} / sfx ${stats.byType.sfx})`);
    console.log(`Entries with new keywords: ${stats.changed}`);
    console.log(`Keywords added (net):      ${stats.addedTotal}`);
    console.log(`Avg keywords per entry:    ${avgKw}`);
    if (Object.keys(stats.moodAdds).length) {
        console.log('Mood tags auto-assigned:');
        for (const [tag, n] of Object.entries(stats.moodAdds).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${tag.padEnd(14)} +${n}`);
        }
    }
    if (Object.keys(stats.contextAdds).length) {
        console.log('Context tags auto-assigned:');
        for (const [tag, n] of Object.entries(stats.contextAdds).sort((a, b) => b[1] - a[1])) {
            console.log(`  ${tag.padEnd(14)} +${n}`);
        }
    }
    if (stats.thinEntries.length) {
        console.log(`\nEntries still below 5 keywords (${stats.thinEntries.length}):`);
        const preview = verbose ? stats.thinEntries : stats.thinEntries.slice(0, 10);
        for (const name of preview) console.log(`  - ${name}`);
        if (!verbose && stats.thinEntries.length > 10) console.log(`  ... (+${stats.thinEntries.length - 10} more; pass --verbose to see all)`);
    }

    if (write) {
        const serialized = JSON.stringify({ ...data, files: next }, null, 2);
        fs.writeFileSync(CATALOG_PATH, serialized + '\n', 'utf8');
        console.log(`\nWrote ${CATALOG_PATH}`);
    } else if (check) {
        if (stats.changed > 0) {
            console.error(`\nKeyword drift detected: ${stats.changed} entries would change.`);
            console.error('Run `node scripts/enrich-keywords.js --write` and commit the result.');
            process.exit(1);
        } else {
            console.log('\nCatalog keywords are in sync with enrichment rules.');
        }
    } else {
        console.log('\n(dry-run — pass --write to overwrite or --check to fail on drift)');
    }
}

main();
