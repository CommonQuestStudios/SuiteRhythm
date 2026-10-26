#!/usr/bin/env node
/**
 * Coverage-gap ElevenLabs batch: seamless ambience loops plus one-shot SFX
 * for the genres the catalog is thin on (sci-fi, modern action, western,
 * steampunk/industrial, horror, animals, extra spells, game UI/sports,
 * everyday foley, vehicles, nature one-shots, human reactions).
 *
 * Generates with ElevenLabs Sound Generation (measured at 10 credits per
 * requested second on the Starter plan), uploads to R2, and appends entries
 * to public/saved-sounds.json.
 * Already cataloged names/files are skipped, so the script is safe to re-run.
 *
 * Usage:
 *   node scripts/generate-coverage-gaps.js --dry-run
 *   node scripts/generate-coverage-gaps.js --limit 2      # first N uncataloged sounds
 *   node scripts/generate-coverage-gaps.js --group scifi  # one group only
 *   node scripts/generate-coverage-gaps.js
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = readArgValue('--limit', Number.POSITIVE_INFINITY, Number);
const GROUP = readArgValue('--group', null, String);
const API_KEY = process.env.ELEVENLABS_API_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || 'cueai-media';
const PREFIX = 'sounds/';
const CREDITS_PER_SECOND = 10;
const AMBIENCE_SECONDS = 30;
const REQUIRED_ENV = ['ELEVENLABS_API_KEY', 'R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY'];

function readArgValue(flag, fallback, cast) {
    const index = process.argv.indexOf(flag);
    if (index === -1 || index + 1 >= process.argv.length) return fallback;
    const value = cast(process.argv[index + 1]);
    return value === undefined || Number.isNaN(value) ? fallback : value;
}

const r2 = DRY_RUN ? null : new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Ambience loops: name must end in "ambience" so retag-catalog keeps them typed as ambience.
function ambience(name, group, keywords, prompt) {
    return {
        name,
        filename: `${name.replace(/[^a-z0-9]+/g, '-')}.mp3`,
        duration: AMBIENCE_SECONDS,
        type: 'ambience',
        loop: true,
        group,
        keywords: [...keywords, 'ambience', 'ambient', 'loop', 'background'],
        prompt: `${prompt} Seamless loop, steady level, no music, no spoken words.`,
    };
}

function sfx(name, duration, group, keywords, prompt) {
    return {
        name,
        filename: `${name.replace(/[^a-z0-9]+/g, '-')}.mp3`,
        duration,
        type: 'sfx',
        group,
        keywords,
        prompt,
    };
}

const SOUNDS = [
    // ── Ambience loops: sci-fi ──
    ambience('spaceship bridge hum ambience', 'scifi', ['spaceship', 'bridge', 'hum', 'scifi', 'space', 'console', 'beeps', 'starship'], 'Starship bridge interior: low engine hum, soft console beeps and gentle air circulation.'),
    ambience('space station corridor ambience', 'scifi', ['space', 'station', 'corridor', 'scifi', 'hallway', 'vent', 'hum', 'metal'], 'Space station corridor: ventilation hiss, distant mechanical thrum and faint electrical hum in a metal hallway.'),
    ambience('derelict spacecraft creaking ambience', 'scifi', ['derelict', 'spacecraft', 'creaking', 'scifi', 'abandoned', 'hull', 'groan', 'eerie'], 'Abandoned derelict spacecraft: hull metal groaning, sparse flickering electrical crackles, cold empty echo.'),
    ambience('alien planet wind ambience', 'scifi', ['alien', 'planet', 'wind', 'scifi', 'otherworldly', 'desolate', 'strange', 'atmosphere'], 'Alien planet surface: strange hollow wind, subtle otherworldly tonal drones and distant unfamiliar calls.'),
    ambience('cyberpunk rain street ambience', 'scifi', ['cyberpunk', 'rain', 'street', 'neon', 'city', 'scifi', 'futuristic', 'night'], 'Cyberpunk city street at night: steady rain on pavement, neon sign buzz, distant hover traffic and muffled synthetic announcements.'),
    ambience('laboratory equipment hum ambience', 'scifi', ['laboratory', 'lab', 'equipment', 'hum', 'science', 'beeps', 'research', 'sterile'], 'Science laboratory: refrigeration hum, periodic instrument beeps, bubbling liquid and air filtration.'),
    ambience('server room fans ambience', 'scifi', ['server', 'room', 'fans', 'computer', 'data', 'center', 'hum', 'tech'], 'Data center server room: dense cooling fan whir, hard drive clicks and steady electrical hum.'),
    ambience('cryo bay cold hum ambience', 'scifi', ['cryo', 'bay', 'cold', 'hum', 'scifi', 'frozen', 'pods', 'hiss'], 'Cryogenic bay: deep cold hum, periodic frost venting hisses and soft pod monitor pulses.'),

    // ── Ambience loops: modern ──
    ambience('hospital ward ambience', 'modern', ['hospital', 'ward', 'medical', 'monitor', 'beeps', 'nurses', 'clinic', 'room'], 'Hospital ward: distant heart monitor beeps, soft PA chimes, quiet footsteps and cart wheels in a hallway.'),
    ambience('school hallway ambience', 'modern', ['school', 'hallway', 'students', 'lockers', 'chatter', 'class', 'corridor', 'teen'], 'Busy school hallway between classes: locker doors, indistinct student chatter and echoing footsteps.'),
    ambience('airport terminal ambience', 'modern', ['airport', 'terminal', 'travel', 'announcements', 'crowd', 'luggage', 'flight', 'hall'], 'Airport terminal: large hall murmur, rolling luggage, distant indistinct PA announcements and chimes.'),
    ambience('train station platform ambience', 'modern', ['train', 'station', 'platform', 'travel', 'crowd', 'announcement', 'rail', 'commute'], 'Train station platform: crowd murmur, distant train idling, platform announcement chimes and echo.'),
    ambience('subway car interior ambience', 'modern', ['subway', 'car', 'interior', 'metro', 'train', 'rails', 'commute', 'rumble'], 'Inside a moving subway car: rail rumble, rhythmic track clatter, rattling and air noise.'),
    ambience('busy cafe espresso ambience', 'modern', ['cafe', 'coffee', 'shop', 'espresso', 'chatter', 'cups', 'barista', 'indoor'], 'Busy coffee shop: espresso machine steaming, cups and saucers, low indistinct chatter.'),
    ambience('nightclub muffled bass ambience', 'modern', ['nightclub', 'club', 'muffled', 'bass', 'party', 'crowd', 'dance', 'wall'], 'Nightclub heard through a wall: muffled thumping bass, distant crowd noise, occasional door opening.'),
    ambience('parking garage ambience', 'modern', ['parking', 'garage', 'concrete', 'echo', 'cars', 'fluorescent', 'underground', 'urban'], 'Underground parking garage: fluorescent light buzz, distant car echo, tire squeaks and dripping.'),
    ambience('empty warehouse echo ambience', 'modern', ['warehouse', 'empty', 'echo', 'industrial', 'large', 'space', 'abandoned', 'drip'], 'Large empty warehouse: hollow echoing room tone, distant drips, metal roof ticking and wind at the doors.'),
    ambience('prison cellblock ambience', 'modern', ['prison', 'cellblock', 'jail', 'cell', 'bars', 'inmates', 'echo', 'guard'], 'Prison cellblock: echoing concrete, distant cell doors, muffled inmate voices and a buzzing light.'),
    ambience('police station office ambience', 'modern', ['police', 'station', 'office', 'radio', 'phones', 'detective', 'precinct', 'indoor'], 'Police precinct office: distant radio dispatch chatter, ringing phones, typing and murmured voices.'),
    ambience('suburban evening sprinklers ambience', 'modern', ['suburban', 'evening', 'sprinklers', 'neighborhood', 'lawn', 'dog', 'quiet', 'street'], 'Quiet suburban street at dusk: lawn sprinklers ticking, a distant dog, faint traffic and crickets starting.'),
    ambience('highway distant traffic night ambience', 'modern', ['highway', 'traffic', 'distant', 'night', 'road', 'cars', 'motel', 'urban'], 'Distant highway at night: continuous wash of passing cars and trucks, occasional doppler swell.'),
    ambience('construction site distant ambience', 'modern', ['construction', 'site', 'distant', 'machinery', 'hammering', 'city', 'work', 'urban'], 'Construction site heard from a block away: distant hammering, reversing beepers, engines and metal clangs.'),

    // ── Ambience loops: nature ──
    ambience('beach day gentle waves ambience', 'nature', ['beach', 'day', 'gentle', 'waves', 'seagulls', 'shore', 'summer', 'ocean'], 'Sunny beach: gentle lapping waves, soft breeze and occasional distant seagulls.'),
    ambience('snowfall quiet ambience', 'nature', ['snowfall', 'quiet', 'snow', 'winter', 'calm', 'hush', 'cold', 'still'], 'Quiet snowfall: near-silent hush with very soft wind, faint snow settling on branches.'),
    ambience('pond frogs evening ambience', 'nature', ['pond', 'frogs', 'evening', 'croaking', 'water', 'insects', 'marsh', 'dusk'], 'Pond at dusk: chorus of croaking frogs, light insects and gentle water movement.'),
    ambience('lake shore morning ambience', 'nature', ['lake', 'shore', 'morning', 'water', 'lapping', 'birds', 'loon', 'calm'], 'Lake shore at dawn: soft lapping water, distant loon call, light birdsong and a gentle breeze.'),
    ambience('deep cave wind ambience', 'nature', ['deep', 'cave', 'wind', 'hollow', 'drip', 'underground', 'echo', 'cavern'], 'Deep cave: hollow wind moving through passages, distant drips and vast stone echo.'),
    ambience('arctic tundra wind ambience', 'nature', ['arctic', 'tundra', 'wind', 'ice', 'cold', 'frozen', 'desolate', 'snow'], 'Arctic tundra: constant frigid wind, blowing ice crystals and creaking frozen ground.'),
    ambience('volcanic cavern rumble ambience', 'nature', ['volcanic', 'cavern', 'rumble', 'lava', 'heat', 'magma', 'underground', 'fire'], 'Volcanic cavern: low rumbling, bubbling lava, steam vents and rock crackle.'),
    ambience('thunderstorm indoors ambience', 'nature', ['thunderstorm', 'indoors', 'rain', 'thunder', 'window', 'storm', 'cozy', 'house'], 'Thunderstorm heard from inside a house: muffled rain on the roof and windows, rolling distant thunder.'),
    ambience('bamboo forest breeze ambience', 'nature', ['bamboo', 'forest', 'breeze', 'leaves', 'creak', 'asia', 'calm', 'wind'], 'Bamboo forest: stalks creaking and knocking in a breeze, rustling leaves and distant birds.'),
    ambience('savanna evening ambience', 'nature', ['savanna', 'evening', 'africa', 'insects', 'grassland', 'distant', 'animals', 'warm'], 'African savanna at sunset: warm wind in dry grass, insects and distant animal calls.'),

    // ── Ambience loops: fantasy ──
    ambience('haunted house interior ambience', 'fantasy', ['haunted', 'house', 'interior', 'creak', 'horror', 'ghost', 'spooky', 'old'], 'Haunted house interior: slow floorboard creaks, wind through cracks, faint whispers and a distant clock.'),
    ambience('wizard tower study ambience', 'fantasy', ['wizard', 'tower', 'study', 'magic', 'arcane', 'candles', 'books', 'fantasy'], 'Wizard tower study: soft arcane hum, bubbling alembics, candle flicker and parchment rustle.'),
    ambience('elven forest magical ambience', 'fantasy', ['elven', 'forest', 'magical', 'elf', 'fantasy', 'shimmer', 'birds', 'enchanted'], 'Enchanted elven forest: gentle wind in ancient trees, delicate magical shimmers and soft birdsong.'),
    ambience('underdark cavern ambience', 'fantasy', ['underdark', 'cavern', 'dnd', 'fantasy', 'dark', 'drip', 'skitter', 'deep'], 'Vast underground fantasy cavern: dripping water, distant skittering, low wind and faint eerie glow tones.'),
    ambience('pirate ship deck sailing ambience', 'fantasy', ['pirate', 'ship', 'deck', 'sailing', 'sea', 'rigging', 'waves', 'creak'], 'Sailing ship deck at sea: hull creak, rigging rope strain, flapping canvas, waves against the bow and gulls.'),
    ambience('siege camp night ambience', 'fantasy', ['siege', 'camp', 'night', 'army', 'medieval', 'fires', 'soldiers', 'war'], 'Medieval army camp at night: many crackling fires, distant indistinct soldier voices, horses and clinking armor.'),
    ambience('distant battlefield ambience', 'fantasy', ['distant', 'battlefield', 'battle', 'war', 'medieval', 'clash', 'shouts', 'drums'], 'Distant medieval battle: far-off clash of steel, muffled war shouts, horns and drums carried on the wind.'),
    ambience('church interior quiet ambience', 'fantasy', ['church', 'interior', 'quiet', 'cathedral', 'reverent', 'stone', 'echo', 'holy'], 'Quiet stone church interior: vast reverberant room tone, soft shuffling, distant door and a faint candle flicker.'),
    ambience('royal throne room ambience', 'fantasy', ['royal', 'throne', 'room', 'court', 'castle', 'king', 'murmur', 'hall'], 'Royal throne room: hushed courtier murmur, echoing stone hall, occasional armor shift and torch crackle.'),
    ambience('mine shaft deep ambience', 'fantasy', ['mine', 'shaft', 'deep', 'pickaxe', 'dwarf', 'tunnel', 'drip', 'underground'], 'Deep mine shaft: distant pickaxes, timber supports creaking, dripping water and rattling carts.'),
    ambience('dwarven forge hall ambience', 'fantasy', ['dwarven', 'forge', 'hall', 'dwarf', 'anvil', 'furnace', 'fantasy', 'hammer'], 'Dwarven forge hall: roaring furnaces, rhythmic distant hammering on anvils, bellows and echoing stone.'),
    ambience('graveyard fog night ambience', 'fantasy', ['graveyard', 'fog', 'night', 'cemetery', 'owl', 'wind', 'horror', 'spooky'], 'Foggy graveyard at night: low wind, distant owl, creaking iron gate and faint unsettling tones.'),

    // ── Ambience loops: misc ──
    ambience('carnival fairground ambience', 'misc', ['carnival', 'fairground', 'fair', 'rides', 'crowd', 'games', 'festival', 'fun'], 'Carnival fairground: distant calliope-like ride tones, crowd chatter, game bells and ride whooshes.'),
    ambience('stadium crowd roar ambience', 'misc', ['stadium', 'crowd', 'roar', 'sports', 'fans', 'arena', 'cheer', 'match'], 'Large sports stadium: continuous crowd roar, chants swelling, distant whistle and PA echo.'),
    ambience('farm morning ambience', 'misc', ['farm', 'morning', 'rooster', 'cows', 'barn', 'rural', 'countryside', 'animals'], 'Farm at sunrise: rooster crowing, distant cows, chickens clucking and a light breeze.'),
    ambience('rain on tent canvas ambience', 'misc', ['rain', 'tent', 'canvas', 'camping', 'cozy', 'drops', 'outdoor', 'night'], 'Rain falling on a tent: patter on canvas, dripping edges, soft wind outside.'),
    ambience('spa relaxing water ambience', 'misc', ['spa', 'relaxing', 'water', 'calm', 'fountain', 'trickle', 'peaceful', 'zen'], 'Relaxing spa: gentle fountain trickle, soft water movement and a faint singing bowl tone.'),

    // ── Ambience loops: sci-fi (extended) ──
    ambience('starship engine room ambience', 'scifi', ['starship', 'engine', 'room', 'reactor', 'scifi', 'throb', 'machinery', 'power'], 'Starship engine room: deep pulsing reactor throb, coolant hiss, heavy machinery hum and metal resonance.'),
    ambience('alien hive interior ambience', 'scifi', ['alien', 'hive', 'interior', 'scifi', 'organic', 'wet', 'skitter', 'horror'], 'Inside an alien hive: wet organic pulsing, distant chittering, dripping slime and a low living hum.'),
    ambience('space debris field ambience', 'scifi', ['space', 'debris', 'field', 'hull', 'pings', 'scifi', 'wreckage', 'drift'], 'Drifting through a space debris field heard from inside a ship: small hull pings, scraping metal and deep silence hum.'),
    ambience('orbital observation deck ambience', 'scifi', ['orbital', 'observation', 'deck', 'station', 'scifi', 'quiet', 'hum', 'window'], 'Quiet orbital station observation deck: soft life-support hum, distant footsteps and gentle console tones.'),
    ambience('mars colony habitat ambience', 'scifi', ['mars', 'colony', 'habitat', 'scifi', 'dome', 'air', 'pumps', 'wind'], 'Mars colony habitat: air recycler pumps, muffled thin wind against the dome and soft electronics.'),
    ambience('cyberpunk night market ambience', 'scifi', ['cyberpunk', 'night', 'market', 'crowd', 'neon', 'vendors', 'scifi', 'city'], 'Cyberpunk night market: dense crowd murmur, sizzling food stalls, synthetic ad jingles and electric buzz, no clear words.'),

    // ── Ambience loops: modern (extended) ──
    ambience('hotel lobby ambience', 'modern', ['hotel', 'lobby', 'reception', 'luggage', 'murmur', 'elevator', 'travel', 'indoor'], 'Upscale hotel lobby: soft murmur, luggage carts, elevator chimes and distant reception phones.'),
    ambience('shopping mall ambience', 'modern', ['shopping', 'mall', 'crowd', 'stores', 'escalator', 'indoor', 'retail', 'murmur'], 'Busy shopping mall: echoing crowd murmur, escalator hum, distant store music bleed and footsteps.'),
    ambience('restaurant kitchen rush ambience', 'modern', ['restaurant', 'kitchen', 'rush', 'cooking', 'pans', 'sizzle', 'chef', 'busy'], 'Busy restaurant kitchen: sizzling pans, clattering plates, ticket printer and shouted indistinct orders.'),
    ambience('gym weights ambience', 'modern', ['gym', 'weights', 'fitness', 'clank', 'treadmill', 'workout', 'indoor', 'exercise'], 'Fitness gym: clanking weight plates, treadmill hum, muffled music bleed and exertion grunts.'),
    ambience('elevator ride hum ambience', 'modern', ['elevator', 'ride', 'hum', 'lift', 'cables', 'building', 'indoor', 'quiet'], 'Inside a moving elevator: smooth motor hum, cable whir, soft rattles and a muffled floor chime.'),
    ambience('apartment night city window ambience', 'modern', ['apartment', 'night', 'city', 'window', 'traffic', 'siren', 'urban', 'quiet'], 'Quiet apartment at night with an open window: distant traffic, a far siren, faint neighbor sounds.'),
    ambience('laundromat ambience', 'modern', ['laundromat', 'washers', 'dryers', 'tumble', 'coins', 'indoor', 'hum', 'spin'], 'Laundromat: tumbling dryers, spinning washers, coin clinks and a fluorescent buzz.'),
    ambience('bus ride interior ambience', 'modern', ['bus', 'ride', 'interior', 'engine', 'city', 'transit', 'rattle', 'commute'], 'Inside a moving city bus: diesel engine drone, rattling windows, air brakes and muffled passenger murmur.'),
    ambience('airplane cabin cruising ambience', 'modern', ['airplane', 'cabin', 'cruising', 'flight', 'engine', 'drone', 'travel', 'passengers'], 'Airplane cabin at cruising altitude: steady engine drone, air vents and soft passenger rustle.'),
    ambience('emergency room ambience', 'modern', ['emergency', 'room', 'hospital', 'er', 'monitors', 'urgent', 'medical', 'busy'], 'Hospital emergency room: beeping monitors, curtain rings, hurried footsteps, pages and distant urgent voices.'),
    ambience('courtroom murmur ambience', 'modern', ['courtroom', 'murmur', 'court', 'trial', 'gallery', 'judge', 'legal', 'indoor'], 'Courtroom before session: hushed gallery murmur, papers shuffling, wooden benches creaking in a large room.'),
    ambience('casino floor ambience', 'modern', ['casino', 'floor', 'slots', 'gambling', 'chips', 'crowd', 'bells', 'vegas'], 'Casino floor: layered slot machine jingles, chip clatter, crowd murmur and distant win bells.'),
    ambience('bowling alley ambience', 'modern', ['bowling', 'alley', 'pins', 'strike', 'lanes', 'crowd', 'indoor', 'fun'], 'Bowling alley: rolling balls, crashing pins, ball return thunks and crowd chatter.'),
    ambience('indoor swimming pool ambience', 'modern', ['indoor', 'swimming', 'pool', 'splash', 'echo', 'water', 'kids', 'natatorium'], 'Indoor swimming pool: echoing splashes, distant shouts and whistles, water lapping in a tiled hall.'),
    ambience('rooftop city wind ambience', 'modern', ['rooftop', 'city', 'wind', 'skyline', 'traffic', 'height', 'urban', 'night'], 'City rooftop: gusting wind, distant traffic wash far below, flag rope clanking and a far siren.'),
    ambience('abandoned asylum ambience', 'modern', ['abandoned', 'asylum', 'horror', 'drip', 'creak', 'eerie', 'hospital', 'haunted'], 'Abandoned asylum: dripping water, distant metal door bangs, buzzing broken lights and unsettling faint moans.'),
    ambience('bunker generator hum ambience', 'modern', ['bunker', 'generator', 'hum', 'underground', 'concrete', 'military', 'shelter', 'diesel'], 'Underground bunker: steady diesel generator hum, ventilation ducts and concrete room echo.'),

    // ── Ambience loops: nature (extended) ──
    ambience('tropical rainforest rain ambience', 'nature', ['tropical', 'rainforest', 'rain', 'jungle', 'birds', 'frogs', 'canopy', 'humid'], 'Tropical rainforest during rain: heavy drops on broad leaves, exotic birds and frogs under the canopy.'),
    ambience('alpine mountain stream ambience', 'nature', ['alpine', 'mountain', 'stream', 'water', 'rocks', 'wind', 'birds', 'fresh'], 'Alpine mountain stream: clear water over rocks, light wind and high-altitude birdsong.'),
    ambience('canyon wind echo ambience', 'nature', ['canyon', 'wind', 'echo', 'desert', 'rock', 'vast', 'hawk', 'empty'], 'Vast desert canyon: hollow wind through rock walls, long echoes and a distant hawk cry.'),
    ambience('wetlands dawn birds ambience', 'nature', ['wetlands', 'dawn', 'birds', 'marsh', 'reeds', 'ducks', 'water', 'morning'], 'Wetlands at dawn: rich bird chorus, ducks, reeds rustling and gentle water.'),
    ambience('pine forest night wind ambience', 'nature', ['pine', 'forest', 'night', 'wind', 'owl', 'trees', 'dark', 'creak'], 'Pine forest at night: wind sighing through needles, creaking trunks and a distant owl.'),
    ambience('summer meadow bees ambience', 'nature', ['summer', 'meadow', 'bees', 'flowers', 'insects', 'birds', 'warm', 'field'], 'Summer wildflower meadow: buzzing bees, grasshoppers, songbirds and a warm breeze.'),
    ambience('coastal cliffs seabirds ambience', 'nature', ['coastal', 'cliffs', 'seabirds', 'ocean', 'wind', 'gulls', 'waves', 'shore'], 'Sea cliffs: wind, crashing waves far below and wheeling seabird colonies.'),
    ambience('glacier creaking ambience', 'nature', ['glacier', 'creaking', 'ice', 'cold', 'arctic', 'groan', 'wind', 'frozen'], 'On a glacier: deep ice groans and cracks, trickling meltwater and cold wind.'),
    ambience('desert day heat ambience', 'nature', ['desert', 'day', 'heat', 'sun', 'dry', 'wind', 'insects', 'barren'], 'Desert at midday: dry hot wind, faint shimmering insect buzz and shifting sand.'),
    ambience('prairie wind grass ambience', 'nature', ['prairie', 'wind', 'grass', 'plains', 'open', 'meadowlark', 'western', 'field'], 'Open prairie: steady wind through tall grass, distant meadowlark and vast openness.'),
    ambience('thunderstorm open field ambience', 'nature', ['thunderstorm', 'open', 'field', 'rain', 'thunder', 'storm', 'heavy', 'outdoor'], 'Thunderstorm in an open field: heavy rain, gusting wind and rolling thunder near and far.'),
    ambience('tide pools ambience', 'nature', ['tide', 'pools', 'rocks', 'ocean', 'trickle', 'gulls', 'shore', 'coast'], 'Rocky tide pools: water trickling between rocks, small waves, kelp pops and distant gulls.'),
    ambience('mangrove swamp night ambience', 'nature', ['mangrove', 'swamp', 'night', 'insects', 'water', 'frogs', 'humid', 'tropical'], 'Mangrove swamp at night: thick insect drone, frogs, dripping roots and lapping brackish water.'),
    ambience('cave waterfall ambience', 'nature', ['cave', 'waterfall', 'underground', 'water', 'echo', 'rush', 'drip', 'cavern'], 'Underground waterfall in a cavern: rushing water with huge stone echo and nearby drips.'),
    ambience('hurricane winds ambience', 'nature', ['hurricane', 'winds', 'storm', 'gale', 'rain', 'debris', 'disaster', 'weather'], 'Hurricane: screaming gale winds, sheets of rain, rattling debris and creaking structures.'),

    // ── Ambience loops: fantasy (extended) ──
    ambience('dragon lair ambience', 'fantasy', ['dragon', 'lair', 'cave', 'treasure', 'breathing', 'fantasy', 'embers', 'danger'], 'Dragon lair: deep slow beast breathing, shifting coins, ember crackle and cavern echo.'),
    ambience('goblin camp ambience', 'fantasy', ['goblin', 'camp', 'fantasy', 'chittering', 'fire', 'dnd', 'squabble', 'night'], 'Goblin camp at night: chittering squabbles, clanking pots, crackling fire and skittering, no clear words.'),
    ambience('orc war camp drums ambience', 'fantasy', ['orc', 'war', 'camp', 'drums', 'fantasy', 'dnd', 'chanting', 'fire'], 'Orc war camp: pounding war drums, guttural distant chanting, roaring fires and clanging iron.'),
    ambience('fairy glade ambience', 'fantasy', ['fairy', 'glade', 'fey', 'magical', 'sparkle', 'forest', 'fantasy', 'enchanted'], 'Fairy glade: tinkling magical sparkles, soft fluttering wings, gentle brook and birdsong.'),
    ambience('witch hut swamp ambience', 'fantasy', ['witch', 'hut', 'swamp', 'cauldron', 'bubbling', 'halloween', 'creak', 'fantasy'], 'Witch hut in a swamp: bubbling cauldron, creaking boards, crows outside and bottles clinking.'),
    ambience('abandoned temple ambience', 'fantasy', ['abandoned', 'temple', 'ruins', 'wind', 'drip', 'ancient', 'fantasy', 'echo'], 'Abandoned ancient temple: wind through broken pillars, dripping water, settling stone and bird flutters.'),
    ambience('ancient library whispers ambience', 'fantasy', ['ancient', 'library', 'whispers', 'books', 'magic', 'fantasy', 'pages', 'quiet'], 'Ancient magical library: hushed room tone, faint whispering books, pages turning on their own and candle flicker.'),
    ambience('alchemist lab bubbling ambience', 'fantasy', ['alchemist', 'lab', 'bubbling', 'potions', 'glass', 'fantasy', 'fire', 'brew'], 'Alchemist laboratory: bubbling flasks, hissing burners, glass clinks and occasional small pops.'),
    ambience('torture chamber dungeon ambience', 'fantasy', ['torture', 'chamber', 'dungeon', 'chains', 'drip', 'horror', 'fantasy', 'moan'], 'Dungeon torture chamber: rattling chains, dripping water, distant moans and a crackling brazier.'),
    ambience('medieval rooftops night ambience', 'fantasy', ['medieval', 'rooftops', 'night', 'city', 'wind', 'thief', 'fantasy', 'bells'], 'Medieval city rooftops at night: wind over tiles, distant bells, muffled street life far below.'),
    ambience('elven city ambience', 'fantasy', ['elven', 'city', 'elf', 'fantasy', 'fountains', 'chimes', 'serene', 'graceful'], 'Elven city: gentle fountains, wind chimes, soft distant singing tones and rustling leaves.'),
    ambience('frozen fortress ambience', 'fantasy', ['frozen', 'fortress', 'ice', 'castle', 'wind', 'fantasy', 'cold', 'echo'], 'Frozen fortress interior: icy wind through halls, creaking ice, echoing drips and a distant horn.'),
    ambience('haunted forest ambience', 'fantasy', ['haunted', 'forest', 'horror', 'whispers', 'crows', 'dead', 'trees', 'fog'], 'Haunted dead forest: creaking bare trees, crows, faint whispers and unsettling distant snaps.'),
    ambience('necropolis undead ambience', 'fantasy', ['necropolis', 'undead', 'graves', 'moans', 'horror', 'fantasy', 'bones', 'dark'], 'Necropolis: shifting bones, distant undead moans, wind through tombs and faint dark chanting.'),
    ambience('feywild shimmering ambience', 'fantasy', ['feywild', 'shimmering', 'fey', 'dnd', 'magic', 'dreamlike', 'fantasy', 'wild'], 'Feywild: dreamlike shimmering tones, overlapping strange birdsong, giggles on the wind and sparkle.'),
    ambience('shadowfell drone ambience', 'fantasy', ['shadowfell', 'drone', 'dark', 'dnd', 'gloom', 'despair', 'fantasy', 'eerie'], 'Shadowfell: oppressive low drone, hollow wind, distant hopeless whispers and faint rattles.'),
    ambience('hell fire brimstone ambience', 'fantasy', ['hell', 'fire', 'brimstone', 'demons', 'lava', 'screams', 'fantasy', 'infernal'], 'Infernal hellscape: roaring fires, bubbling brimstone, distant tormented screams and demonic rumbles.'),
    ambience('celestial realm ambience', 'fantasy', ['celestial', 'realm', 'heaven', 'choir', 'light', 'holy', 'fantasy', 'serene'], 'Celestial realm: soft sustained choir-like tones, gentle wind and shimmering light, no words.'),
    ambience('ship below deck ambience', 'fantasy', ['ship', 'below', 'deck', 'hull', 'creak', 'water', 'sailors', 'hammock'], 'Below deck on a wooden ship: hull creaking, water sloshing against the hull, rope strain and muffled footsteps above.'),
    ambience('monastery chanting ambience', 'fantasy', ['monastery', 'chanting', 'monks', 'temple', 'meditation', 'bells', 'holy', 'calm'], 'Monastery: distant monks chanting, soft bell, wind in a courtyard and stone echo, no clear words.'),
    ambience('coliseum arena crowd ambience', 'fantasy', ['coliseum', 'arena', 'crowd', 'gladiator', 'roar', 'ancient', 'fantasy', 'fight'], 'Ancient coliseum: roaring crowd, horns, clashing distant steel and chanting.'),
    ambience('jousting tournament ambience', 'fantasy', ['jousting', 'tournament', 'medieval', 'crowd', 'horses', 'trumpets', 'fantasy', 'fair'], 'Medieval tournament grounds: cheering crowd, trumpets, horses snorting and banners flapping.'),
    ambience('royal banquet feast ambience', 'fantasy', ['royal', 'banquet', 'feast', 'castle', 'laughter', 'goblets', 'fantasy', 'hall'], 'Royal banquet hall: laughter and chatter, clinking goblets, cutlery and a distant lute.'),
    ambience('windmill farm ambience', 'fantasy', ['windmill', 'farm', 'creak', 'wind', 'rural', 'medieval', 'fantasy', 'blades'], 'Windmill: rhythmic creaking blades turning, grinding millstone, wind and distant sheep.'),
    ambience('desert bazaar ambience', 'fantasy', ['desert', 'bazaar', 'market', 'merchants', 'crowd', 'arabian', 'spices', 'fantasy'], 'Desert bazaar: bustling merchants calling, haggling crowd, camels, jingling wares and a distant flute, no clear words.'),
    ambience('caravan camels travel ambience', 'fantasy', ['caravan', 'camels', 'travel', 'desert', 'bells', 'sand', 'wind', 'journey'], 'Desert caravan on the move: camel groans, jingling bells, creaking packs and wind over sand.'),

    // ── Ambience loops: misc (extended) ──
    ambience('christmas market ambience', 'misc', ['christmas', 'market', 'holiday', 'crowd', 'bells', 'festive', 'winter', 'snow'], 'Outdoor Christmas market: cheerful crowd, jingling bells, sizzling food stalls and snow crunch.'),
    ambience('halloween night street ambience', 'misc', ['halloween', 'night', 'street', 'trick', 'treat', 'kids', 'spooky', 'wind'], 'Halloween night neighborhood: distant kids laughing, doorbells, wind in dry leaves and spooky yard decorations.'),
    ambience('summer bbq backyard ambience', 'misc', ['summer', 'bbq', 'backyard', 'grill', 'sizzle', 'party', 'laughter', 'outdoor'], 'Backyard summer barbecue: grill sizzle, laughter and chatter, bottles clinking and birds.'),
    ambience('cozy bookshop ambience', 'misc', ['cozy', 'bookshop', 'books', 'pages', 'quiet', 'shop', 'bell', 'indoor'], 'Cozy bookshop: pages turning, soft footsteps on wood, occasional door bell and muffled street outside.'),
    ambience('train ride countryside ambience', 'misc', ['train', 'ride', 'countryside', 'rails', 'clatter', 'journey', 'window', 'travel'], 'Riding a train through the countryside: rhythmic rail clatter, gentle sway and distant horn.'),
    ambience('wedding reception ambience', 'misc', ['wedding', 'reception', 'party', 'toast', 'glasses', 'laughter', 'celebration', 'indoor'], 'Wedding reception: happy chatter, clinking glasses, laughter and distant band warming up.'),
    ambience('classroom lecture murmur ambience', 'misc', ['classroom', 'lecture', 'murmur', 'school', 'students', 'chalk', 'pens', 'indoor'], 'Classroom during a lesson: pens scratching, shifting chairs, chalk on board and quiet murmur.'),
    ambience('empty theater stage ambience', 'misc', ['empty', 'theater', 'stage', 'quiet', 'creak', 'echo', 'curtain', 'indoor'], 'Empty theater: vast quiet room tone, stage boards creaking, distant ventilation and a settling curtain.'),

    // ── Ambience loops: top-up (run after the main batch; credit guard stops when funds run out) ──
    ambience('ice cave crystal ambience', 'topup', ['ice', 'cave', 'crystal', 'frozen', 'drip', 'echo', 'glitter', 'cold'], 'Ice cave: glassy ice creaks, crystalline drips with long cold echo and faint wind.'),
    ambience('thieves guild hideout ambience', 'topup', ['thieves', 'guild', 'hideout', 'rogue', 'whispers', 'coins', 'fantasy', 'secret'], 'Thieves guild hideout: hushed conspiratorial whispers, coins counted, dice, creaking floor and a distant trapdoor, no clear words.'),
    ambience('lighthouse storm ambience', 'topup', ['lighthouse', 'storm', 'sea', 'waves', 'wind', 'foghorn', 'rain', 'coast'], 'Lighthouse in a storm: crashing waves on rocks, howling wind, rain on glass and a distant foghorn.'),
    ambience('ghost ship deck ambience', 'topup', ['ghost', 'ship', 'deck', 'haunted', 'creak', 'fog', 'whispers', 'sea'], 'Haunted ghost ship: slow hull creaks, tattered sails flapping, dead calm water and faint spectral whispers.'),
    ambience('steampunk workshop ambience', 'topup', ['steampunk', 'workshop', 'gears', 'steam', 'tinker', 'clock', 'brass', 'inventor'], 'Steampunk inventor workshop: ticking clockwork, periodic steam puffs, tinkering tools and whirring gears.'),
    ambience('spaceport hangar ambience', 'topup', ['spaceport', 'hangar', 'scifi', 'ships', 'engines', 'crew', 'loading', 'echo'], 'Busy spaceport hangar: distant ship engines idling, loading machinery, PA tones and echoing crew activity, no clear words.'),
    ambience('wasteland wind ruins ambience', 'topup', ['wasteland', 'wind', 'ruins', 'post', 'apocalyptic', 'desolate', 'metal', 'creak'], 'Post-apocalyptic wasteland: dry wind through ruined structures, creaking metal signs and distant rumbles.'),
    ambience('zombie horde distant ambience', 'topup', ['zombie', 'horde', 'distant', 'moans', 'horror', 'undead', 'apocalypse', 'shuffle'], 'Distant zombie horde: mass of shuffling feet and overlapping undead moans approaching slowly, no words.'),
    ambience('harvest festival ambience', 'topup', ['harvest', 'festival', 'autumn', 'village', 'fiddle', 'crowd', 'medieval', 'celebration'], 'Village harvest festival: cheerful crowd, distant fiddle, laughter, clinking mugs and crackling bonfire.'),
    ambience('snowy village night ambience', 'topup', ['snowy', 'village', 'night', 'winter', 'quiet', 'wind', 'fire', 'medieval'], 'Snowy medieval village at night: soft wind, snow crunch footsteps passing, a distant dog and crackling hearths behind shutters.'),
    ambience('rainy medieval street ambience', 'topup', ['rainy', 'medieval', 'street', 'rain', 'cobblestone', 'gutters', 'cart', 'city'], 'Rainy medieval street: rain on cobblestones, gurgling gutters, a passing cart and muffled voices under awnings.'),
    ambience('desert ruins night ambience', 'topup', ['desert', 'ruins', 'night', 'wind', 'sand', 'ancient', 'jackal', 'stars'], 'Ancient desert ruins at night: cool wind through broken stone, shifting sand and a distant jackal cry.'),
    // ── SFX: sci-fi ──
    sfx('airlock door hiss open', 4, 'scifi', ['airlock', 'door', 'hiss', 'open', 'scifi', 'space', 'pressure', 'seal'], 'Spaceship airlock door unsealing with a pressurized hiss and heavy mechanical slide open, no music'),
    sfx('scifi door slide open', 2, 'scifi', ['scifi', 'door', 'slide', 'open', 'automatic', 'whoosh', 'future', 'station'], 'Futuristic automatic door sliding open with a smooth servo whoosh and soft click, no music'),
    sfx('hologram activate flicker', 3, 'scifi', ['hologram', 'activate', 'flicker', 'scifi', 'projection', 'glitch', 'hum', 'display'], 'Holographic display activating with an electric flicker, glitchy static and settling hum, no music'),
    sfx('computer hacking keystrokes', 6, 'scifi', ['computer', 'hacking', 'keystrokes', 'typing', 'hacker', 'beeps', 'code', 'terminal'], 'Rapid hacker keystrokes with terminal beeps and data processing blips, tense tech scene, no music, no voices'),
    sfx('drone hover pass', 5, 'scifi', ['drone', 'hover', 'pass', 'quadcopter', 'buzz', 'flyby', 'surveillance', 'rotor'], 'Quadcopter drone hovering then passing overhead, high rotor buzz with doppler shift, no music'),
    sfx('mech footsteps heavy', 5, 'scifi', ['mech', 'footsteps', 'heavy', 'robot', 'giant', 'metal', 'hydraulic', 'stomp'], 'Giant bipedal mech walking, heavy hydraulic steps with metal clanks and servo whines, no music'),
    sfx('energy shield impact', 2, 'scifi', ['energy', 'shield', 'impact', 'scifi', 'force', 'field', 'deflect', 'zap'], 'Energy shield absorbing a blast, electric ripple impact and crackling deflection, no music'),
    sfx('plasma rifle shot', 2, 'scifi', ['plasma', 'rifle', 'shot', 'scifi', 'gun', 'blaster', 'energy', 'fire'], 'Single plasma rifle shot, hot energy discharge with sizzling tail, sci-fi weapon, no music'),
    sfx('jetpack thrust burst', 4, 'scifi', ['jetpack', 'thrust', 'burst', 'rocket', 'flight', 'scifi', 'boost', 'fire'], 'Jetpack igniting with a roaring thrust burst and flame whoosh, sci-fi flight, no music'),
    sfx('teleporter pad energize', 4, 'scifi', ['teleporter', 'pad', 'energize', 'scifi', 'beam', 'transport', 'shimmer', 'dematerialize'], 'Teleporter pad charging and energizing, rising shimmer and dematerialization sparkle, no music'),
    sfx('laser cannon charge fire', 4, 'scifi', ['laser', 'cannon', 'charge', 'fire', 'scifi', 'weapon', 'beam', 'blast'], 'Large laser cannon charging up with a rising whine then firing a massive beam blast, no music'),
    sfx('spaceship engine startup', 6, 'scifi', ['spaceship', 'engine', 'startup', 'scifi', 'power', 'ignition', 'thrusters', 'launch'], 'Spaceship engines powering up from silence, systems coming online and thrusters igniting to a roar, no music'),
    sfx('hyperdrive jump', 4, 'scifi', ['hyperdrive', 'jump', 'warp', 'lightspeed', 'scifi', 'space', 'whoosh', 'travel'], 'Starship hyperdrive jump, building energy then a sudden stretching whoosh into lightspeed, no music'),
    sfx('alien communication chatter', 4, 'scifi', ['alien', 'communication', 'chatter', 'scifi', 'signal', 'language', 'strange', 'radio'], 'Strange alien communication signal, chirping clicks and warbling tones over a radio, no human words, no music'),
    sfx('robot malfunction glitch', 3, 'scifi', ['robot', 'malfunction', 'glitch', 'scifi', 'error', 'sparks', 'broken', 'short'], 'Robot malfunctioning, stuttering servo glitches, electrical sparks and a power-down whine, no music'),
    sfx('scifi scanner sweep', 3, 'scifi', ['scifi', 'scanner', 'sweep', 'scan', 'beam', 'detect', 'analysis', 'beep'], 'Sci-fi handheld scanner sweeping, oscillating electronic pulse with a confirmation beep, no music'),
    sfx('cryo pod open hiss', 4, 'scifi', ['cryo', 'pod', 'open', 'hiss', 'scifi', 'frozen', 'awaken', 'steam'], 'Cryogenic pod unsealing with a frost hiss, venting steam and a lid lifting on hydraulics, no music'),
    sfx('energy blade ignite hum', 3, 'scifi', ['energy', 'blade', 'ignite', 'hum', 'scifi', 'sword', 'plasma', 'weapon'], 'Energy sword blade igniting with a sharp snap then a steady electric hum, no music'),
    sfx('scifi computer error beep', 2, 'scifi', ['scifi', 'computer', 'error', 'beep', 'alert', 'denied', 'warning', 'console'], 'Futuristic computer error tone, descending denied beeps, no music'),
    sfx('missile launch whoosh', 3, 'scifi', ['missile', 'launch', 'whoosh', 'rocket', 'weapon', 'fire', 'military', 'scifi'], 'Missile launching from a tube, ignition thump and rocket whoosh streaking away, no explosion, no music'),
    sfx('spaceship landing thrusters', 6, 'scifi', ['spaceship', 'landing', 'thrusters', 'scifi', 'touchdown', 'descent', 'engine', 'hiss'], 'Spaceship descending and landing, thrusters roaring then easing, landing gear thud and venting hiss, no music'),
    sfx('blaster reload clip', 2, 'scifi', ['blaster', 'reload', 'clip', 'scifi', 'weapon', 'energy', 'cell', 'click'], 'Sci-fi blaster reloading, energy cell ejected and new clip locking in with an electronic chime, no music'),

    // ── SFX: modern action ──
    sfx('pistol shot close', 2, 'action', ['pistol', 'shot', 'close', 'gun', 'handgun', 'fire', 'bang', 'modern'], 'Single modern pistol gunshot at close range, sharp crack with short room echo, no music'),
    sfx('pistol reload magazine', 3, 'action', ['pistol', 'reload', 'magazine', 'gun', 'handgun', 'clip', 'slide', 'rack'], 'Pistol magazine ejected, new magazine inserted and slide racked, detailed gun Foley, no music'),
    sfx('shotgun pump rack', 2, 'action', ['shotgun', 'pump', 'rack', 'gun', 'chamber', 'weapon', 'cock', 'threat'], 'Pump-action shotgun racking a shell, heavy metallic clack-clack, no shot, no music'),
    sfx('shotgun blast', 2, 'action', ['shotgun', 'blast', 'gun', 'shot', 'boom', 'fire', 'weapon', 'loud'], 'Single shotgun blast, deep powerful boom with outdoor echo tail, no music'),
    sfx('assault rifle burst', 3, 'action', ['assault', 'rifle', 'burst', 'gun', 'automatic', 'fire', 'military', 'shots'], 'Short three-round assault rifle burst, sharp automatic gunfire with echo, no music'),
    sfx('machine gun long burst', 5, 'action', ['machine', 'gun', 'long', 'burst', 'automatic', 'fire', 'military', 'heavy'], 'Heavy machine gun sustained burst, rapid automatic fire with shell casings falling, no music'),
    sfx('silenced pistol shot', 2, 'action', ['silenced', 'pistol', 'shot', 'suppressor', 'gun', 'stealth', 'quiet', 'spy'], 'Suppressed pistol shot, muffled thwip with mechanical slide action, stealth scene, no music'),
    sfx('sniper rifle shot distant', 3, 'action', ['sniper', 'rifle', 'shot', 'distant', 'gun', 'echo', 'long', 'range'], 'Single sniper rifle shot heard from a distance, sharp crack with long rolling echo across terrain, no music'),
    sfx('bullet impact metal', 2, 'action', ['bullet', 'impact', 'metal', 'ricochet', 'hit', 'ping', 'steel', 'gunfight'], 'Bullet striking a metal surface, sharp ping and ricochet whine, no gunshot, no music'),
    sfx('bullet impact wood', 2, 'action', ['bullet', 'impact', 'wood', 'hit', 'splinter', 'thunk', 'cover', 'gunfight'], 'Bullet hitting a wooden wall, splintering thunk, no gunshot, no music'),
    sfx('handcuffs click ratchet', 2, 'action', ['handcuffs', 'click', 'ratchet', 'police', 'arrest', 'cuffs', 'metal', 'lock'], 'Handcuffs closing with a quick metal ratchet click, arrest scene Foley, no music'),
    sfx('jail cell door slam', 3, 'action', ['jail', 'cell', 'door', 'slam', 'prison', 'bars', 'lock', 'metal'], 'Heavy barred jail cell door sliding and slamming shut with a lock clank and echo, no music'),
    sfx('police radio chatter static', 5, 'action', ['police', 'radio', 'chatter', 'static', 'dispatch', 'walkie', 'cop', 'squelch'], 'Police radio squelch and static bursts with muffled unintelligible dispatch chatter, no clear words, no music'),
    sfx('car crash collision', 4, 'action', ['car', 'crash', 'collision', 'accident', 'metal', 'glass', 'impact', 'wreck'], 'Violent car crash, screeching tires, crunching metal impact and shattering glass, no music, no voices'),
    sfx('tires skid long', 4, 'action', ['tires', 'skid', 'long', 'screech', 'brakes', 'car', 'chase', 'asphalt'], 'Long tire skid on asphalt, car braking hard with a screeching slide, no crash, no music'),
    sfx('car alarm blaring', 6, 'action', ['car', 'alarm', 'blaring', 'siren', 'street', 'honk', 'security', 'urban'], 'Car alarm going off on a street, cycling honks and electronic siren patterns, no music'),
    sfx('car door slam', 2, 'action', ['car', 'door', 'slam', 'shut', 'vehicle', 'close', 'thunk', 'exit'], 'Car door slammed shut firmly, solid thunk from outside the vehicle, no music'),
    sfx('jet fighter flyby', 6, 'action', ['jet', 'fighter', 'flyby', 'plane', 'military', 'roar', 'aircraft', 'fast'], 'Military jet fighter flying past at low altitude, approaching scream and roaring doppler pass, no music'),
    sfx('helicopter close hover', 8, 'action', ['helicopter', 'close', 'hover', 'rotor', 'chopper', 'blades', 'military', 'loud'], 'Helicopter hovering close overhead, heavy thumping rotor blades and turbine whine, no music'),
    sfx('tank treads rumble', 7, 'action', ['tank', 'treads', 'rumble', 'military', 'armor', 'tracks', 'war', 'engine'], 'Battle tank rolling forward, squeaking metal treads, heavy diesel engine rumble, no gunfire, no music'),
    sfx('grenade explosion', 3, 'action', ['grenade', 'explosion', 'blast', 'military', 'boom', 'debris', 'war', 'combat'], 'Hand grenade exploding outdoors, sharp concussive blast with debris and ringing tail, no music'),
    sfx('large window smash', 3, 'action', ['large', 'window', 'smash', 'glass', 'shatter', 'crash', 'break', 'burst'], 'Large plate glass window smashing, big shatter with glass shards raining down, no music'),
    sfx('door kicked open', 2, 'action', ['door', 'kicked', 'open', 'breach', 'kick', 'burst', 'splinter', 'police'], 'Door kicked open violently, frame splintering and door slamming against a wall, no voices, no music'),
    sfx('taser crackle', 2, 'action', ['taser', 'crackle', 'stun', 'electric', 'zap', 'police', 'shock', 'weapon'], 'Taser stun gun crackling with rapid electric arc clicks, no voices, no music'),

    // ── SFX: western ──
    sfx('revolver hammer cock', 1, 'western', ['revolver', 'hammer', 'cock', 'gun', 'western', 'cowboy', 'click', 'standoff'], 'Revolver hammer being cocked back, crisp mechanical click, western standoff, no music'),
    sfx('revolver fire single', 2, 'western', ['revolver', 'fire', 'single', 'gunshot', 'western', 'cowboy', 'six', 'shooter'], 'Single old west revolver gunshot, punchy crack with dusty open-air echo, no music'),
    sfx('revolver cylinder spin', 2, 'western', ['revolver', 'cylinder', 'spin', 'gun', 'western', 'roulette', 'click', 'cowboy'], 'Revolver cylinder spinning with rapid ratcheting clicks then snapping shut, no music'),
    sfx('saloon doors swing', 3, 'western', ['saloon', 'doors', 'swing', 'western', 'bar', 'creak', 'entrance', 'cowboy'], 'Old west saloon batwing doors swinging open and flapping back with creaky hinges, no music, no voices'),
    sfx('lasso rope whirl throw', 3, 'western', ['lasso', 'rope', 'whirl', 'throw', 'cowboy', 'western', 'rodeo', 'catch'], 'Cowboy whirling a lasso overhead then throwing it, rope whoosh and a snap tight, no music'),
    sfx('harmonica lonely sting', 5, 'western', ['harmonica', 'lonely', 'sting', 'western', 'cowboy', 'desert', 'blues', 'solo'], 'Single lonely harmonica phrase, bluesy western sting with a slow bend, solo instrument only'),
    sfx('spittoon ping', 1, 'western', ['spittoon', 'ping', 'western', 'saloon', 'spit', 'brass', 'cowboy', 'comic'], 'Spit landing in a brass spittoon with a wet metallic ping, western saloon gag, no music'),
    sfx('gold pan sifting gravel', 5, 'western', ['gold', 'pan', 'sifting', 'gravel', 'prospector', 'river', 'western', 'mining'], 'Prospector swirling a metal gold pan, gravel and water sloshing, river in background, no music'),
    sfx('stagecoach passing', 7, 'western', ['stagecoach', 'passing', 'horses', 'wagon', 'western', 'wheels', 'gallop', 'dirt'], 'Horse-drawn stagecoach galloping past on a dirt road, pounding hooves, rattling wheels and creaking wood, no music'),
    sfx('boots on wooden porch', 4, 'western', ['boots', 'wooden', 'porch', 'footsteps', 'western', 'cowboy', 'spurs', 'walk'], 'Heavy cowboy boots walking slowly across a wooden porch, hollow boards and faint spur jingle, no music'),
    sfx('dynamite explosion', 3, 'western', ['dynamite', 'explosion', 'blast', 'western', 'mine', 'tnt', 'boom', 'rocks'], 'Dynamite exploding in a rocky canyon, deep boom with falling rock debris and echo, no music'),

    // ── SFX: steampunk / industrial ──
    sfx('steam valve hiss release', 4, 'industrial', ['steam', 'valve', 'hiss', 'release', 'steampunk', 'pipe', 'pressure', 'boiler'], 'Steam valve opening with a loud pressurized hiss that tapers off, steampunk boiler room, no music'),
    sfx('clockwork gears turning', 6, 'industrial', ['clockwork', 'gears', 'turning', 'steampunk', 'mechanism', 'ticking', 'cogs', 'machine'], 'Intricate clockwork mechanism running, interlocking brass gears ticking and whirring, no music'),
    sfx('pressure gauge creak groan', 3, 'industrial', ['pressure', 'gauge', 'creak', 'groan', 'steampunk', 'metal', 'strain', 'pipe'], 'Metal pipes groaning under pressure with a creaking strain and a rattling gauge, no music'),
    sfx('airship propeller drone', 8, 'industrial', ['airship', 'propeller', 'drone', 'steampunk', 'zeppelin', 'engine', 'flight', 'sky'], 'Steampunk airship propellers droning steadily with a chugging engine and wind, no music'),
    sfx('factory machinery clank', 7, 'industrial', ['factory', 'machinery', 'clank', 'industrial', 'press', 'rhythm', 'metal', 'production'], 'Industrial factory floor machinery, rhythmic metal press clanks, hissing pneumatics and conveyor hum, no music'),
    sfx('jackhammer pavement', 5, 'industrial', ['jackhammer', 'pavement', 'construction', 'drill', 'concrete', 'loud', 'street', 'work'], 'Jackhammer breaking pavement, rapid pneumatic hammering on concrete, no music'),
    sfx('power drill', 3, 'industrial', ['power', 'drill', 'tool', 'electric', 'screw', 'construction', 'motor', 'workshop'], 'Electric power drill running in two short bursts, motor whine and bit biting into wood, no music'),
    sfx('welding sparks sizzle', 5, 'industrial', ['welding', 'sparks', 'sizzle', 'torch', 'metal', 'workshop', 'arc', 'industrial'], 'Arc welding torch crackling and sizzling with sparks on steel, no music'),
    sfx('hydraulic press slam', 3, 'industrial', ['hydraulic', 'press', 'slam', 'industrial', 'crush', 'machine', 'metal', 'heavy'], 'Hydraulic press descending with a hiss then slamming down with a heavy crushing thud, no music'),
    sfx('conveyor belt rolling', 6, 'industrial', ['conveyor', 'belt', 'rolling', 'factory', 'industrial', 'rollers', 'motor', 'warehouse'], 'Conveyor belt running steadily, rubber belt over rollers with a motor hum and occasional rattle, no music'),
    sfx('chainsaw rev cutting', 5, 'industrial', ['chainsaw', 'rev', 'cutting', 'saw', 'wood', 'log', 'engine', 'lumber'], 'Chainsaw revving up and biting into a thick oak log, screaming engine and chewing wood, no music'),
    sfx('hammer nails wood', 4, 'industrial', ['hammer', 'nails', 'wood', 'carpentry', 'build', 'construction', 'tap', 'workshop'], 'Hammer driving nails into wood, several firm strikes with slight ring, carpentry Foley, no music'),
    sfx('hand saw wood', 5, 'industrial', ['hand', 'saw', 'wood', 'cutting', 'carpentry', 'sawing', 'plank', 'workshop'], 'Hand saw cutting through a wooden plank, steady rasping back-and-forth strokes, no music'),
    sfx('metal grinder sparks', 4, 'industrial', ['metal', 'grinder', 'sparks', 'angle', 'workshop', 'steel', 'screech', 'industrial'], 'Angle grinder screeching against steel with a shower of sparks, no music'),
    // ── SFX: horror ──
    sfx('creepy music box', 8, 'horror', ['creepy', 'music', 'box', 'horror', 'eerie', 'lullaby', 'haunted', 'toy'], 'Creepy slow music box melody, detuned and winding down, haunted nursery feel, solo music box only'),
    sfx('eerie children giggling distant', 5, 'horror', ['eerie', 'children', 'giggling', 'distant', 'horror', 'ghost', 'laugh', 'creepy'], 'Distant eerie children giggling echoing through an empty house, ghostly and unsettling, no words, no music'),
    sfx('overlapping whispers', 6, 'horror', ['overlapping', 'whispers', 'voices', 'horror', 'haunted', 'unintelligible', 'creepy', 'madness'], 'Many overlapping unintelligible whispers swirling around the listener, unsettling horror texture, no clear words, no music'),
    sfx('flies buzzing corpse', 5, 'horror', ['flies', 'buzzing', 'corpse', 'horror', 'swarm', 'dead', 'rot', 'insects'], 'Thick swarm of flies buzzing around something dead, close and nauseating, no music'),
    sfx('tv static white noise', 5, 'horror', ['tv', 'static', 'white', 'noise', 'television', 'horror', 'signal', 'broken'], 'Old television static hiss with crackling white noise and a faint channel pop, no music'),
    sfx('radio tuning dial', 5, 'horror', ['radio', 'tuning', 'dial', 'static', 'stations', 'vintage', 'frequency', 'search'], 'Old radio dial turning through static, snippets of warbled signals and squeals, no clear speech, no music'),
    sfx('pounding inside walls', 4, 'horror', ['pounding', 'inside', 'walls', 'horror', 'knocking', 'trapped', 'thump', 'haunted'], 'Desperate pounding from inside a wall, muffled fists thumping on plaster, horror scene, no voices, no music'),
    sfx('door closing by itself creak', 4, 'horror', ['door', 'closing', 'itself', 'creak', 'horror', 'slow', 'haunted', 'latch'], 'Door slowly creaking closed on its own and clicking shut, haunted house, no music'),
    sfx('fingernails scraping wood', 4, 'horror', ['fingernails', 'scraping', 'wood', 'horror', 'scratch', 'claw', 'coffin', 'creepy'], 'Fingernails dragging and scraping slowly down a wooden surface, horror scratch, no music'),
    sfx('breathing behind you', 5, 'horror', ['breathing', 'behind', 'horror', 'close', 'raspy', 'stalker', 'creepy', 'whisper'], 'Slow raspy breathing very close behind the listener, unsettling and intimate, no words, no music'),
    sfx('ghostly moan wail', 5, 'horror', ['ghostly', 'moan', 'wail', 'ghost', 'horror', 'spirit', 'haunted', 'echo'], 'Ghostly moaning wail echoing through a hallway, mournful spectral voice, no words, no music'),
    sfx('chains dragging floor', 5, 'horror', ['chains', 'dragging', 'floor', 'horror', 'metal', 'ghost', 'dungeon', 'heavy'], 'Heavy chains being dragged slowly across a stone floor, horror dungeon Foley, no music'),
    sfx('heavy footsteps upstairs', 5, 'horror', ['heavy', 'footsteps', 'upstairs', 'horror', 'ceiling', 'creak', 'intruder', 'house'], 'Heavy slow footsteps crossing the floor upstairs, creaking boards heard from below, no music'),
    sfx('jump scare sting', 2, 'horror', ['jump', 'scare', 'sting', 'horror', 'shock', 'hit', 'stinger', 'scream'], 'Sudden horror jump scare stinger, violent dissonant orchestral hit with a screeching tail'),
    sfx('witch cackle', 3, 'horror', ['witch', 'cackle', 'laugh', 'halloween', 'evil', 'hag', 'horror', 'spooky'], 'Wicked old witch cackling with shrill delight, halloween character laugh, no words, no music'),
    sfx('werewolf transformation', 6, 'horror', ['werewolf', 'transformation', 'horror', 'bones', 'growl', 'monster', 'moon', 'change'], 'Werewolf transformation, bones cracking and stretching, pained growls turning into a feral snarl, no music'),
    sfx('vampire hiss', 2, 'horror', ['vampire', 'hiss', 'horror', 'fangs', 'undead', 'snarl', 'dracula', 'threat'], 'Vampire hissing with bared fangs, sharp sibilant snarl, no words, no music'),
    sfx('blood splatter wet', 2, 'horror', ['blood', 'splatter', 'wet', 'gore', 'horror', 'splash', 'slash', 'impact'], 'Wet blood splatter hitting a floor, heavy gore splash, no music'),

    // ── SFX: animals ──
    sfx('bees buzzing hive', 5, 'animals', ['bees', 'buzzing', 'hive', 'swarm', 'honey', 'insects', 'garden', 'summer'], 'Beehive buzzing with many bees, dense droning swarm close by, no music'),
    sfx('mosquito whine close', 4, 'animals', ['mosquito', 'whine', 'close', 'insect', 'buzz', 'ear', 'annoying', 'night'], 'Single mosquito whining right by the ear, darting high-pitched buzz, no music'),
    sfx('duck quack pond', 3, 'animals', ['duck', 'quack', 'pond', 'bird', 'water', 'farm', 'mallard', 'park'], 'Duck quacking several times on a pond with light water splashes, no music'),
    sfx('geese honking flock', 4, 'animals', ['geese', 'honking', 'flock', 'birds', 'goose', 'migration', 'sky', 'farm'], 'Flock of geese honking loudly as they fly overhead, no music'),
    sfx('sheep bleating', 3, 'animals', ['sheep', 'bleating', 'baa', 'farm', 'flock', 'lamb', 'pasture', 'animal'], 'Sheep bleating in a field, a couple of baas near and far, no music'),
    sfx('goat bleat', 2, 'animals', ['goat', 'bleat', 'farm', 'animal', 'maa', 'barn', 'pasture', 'funny'], 'Single goat bleating loudly, farm animal call, no music'),
    sfx('turkey gobble', 2, 'animals', ['turkey', 'gobble', 'bird', 'farm', 'thanksgiving', 'animal', 'call', 'fowl'], 'Wild turkey gobbling loudly, rapid gobble call, no music'),
    sfx('coyote yip howl', 5, 'animals', ['coyote', 'yip', 'howl', 'desert', 'night', 'wild', 'pack', 'western'], 'Coyotes yipping and howling at night in the desert, distant pack chorus, no music'),
    sfx('hyena laughing', 4, 'animals', ['hyena', 'laughing', 'cackle', 'africa', 'savanna', 'wild', 'predator', 'night'], 'Hyena laughing and whooping, eerie cackling animal call, no music'),
    sfx('dolphin clicks whistle', 4, 'animals', ['dolphin', 'clicks', 'whistle', 'ocean', 'sea', 'marine', 'playful', 'underwater'], 'Dolphin chirping whistles and rapid echolocation clicks at the water surface, no music'),
    sfx('parrot squawk talk', 3, 'animals', ['parrot', 'squawk', 'talk', 'bird', 'tropical', 'pirate', 'macaw', 'jungle'], 'Parrot squawking and chattering with mimicking bird noises, no clear human words, no music'),
    sfx('rattlesnake rattle warning', 4, 'animals', ['rattlesnake', 'rattle', 'warning', 'snake', 'desert', 'danger', 'western', 'hiss'], 'Rattlesnake rattling its tail in warning with a short hiss, desert danger, no music'),
    sfx('bull snort stomp', 3, 'animals', ['bull', 'snort', 'stomp', 'cattle', 'angry', 'charge', 'farm', 'rodeo'], 'Angry bull snorting heavily and stomping a hoof in dirt, no music'),
    sfx('pigeons flutter coo', 3, 'animals', ['pigeons', 'flutter', 'coo', 'birds', 'city', 'wings', 'park', 'urban'], 'Pigeons cooing then fluttering up in a burst of wings, city park, no music'),
    sfx('woodpecker pecking', 3, 'animals', ['woodpecker', 'pecking', 'bird', 'forest', 'tree', 'drumming', 'tap', 'nature'], 'Woodpecker drumming rapidly on a tree trunk in a quiet forest, no music'),
    sfx('gorilla chest beat roar', 4, 'animals', ['gorilla', 'chest', 'beat', 'roar', 'ape', 'jungle', 'primate', 'threat'], 'Gorilla beating its chest with hollow thumps and letting out a roaring grunt, no music'),

    // ── SFX: spells ──
    sfx('acid splash sizzle spell', 3, 'spells', ['acid', 'splash', 'sizzle', 'spell', 'magic', 'dnd', 'corrosive', 'cantrip'], 'Acid splash spell, wet glob impact with a hissing corrosive sizzle, fantasy magic, no music'),
    sfx('water spell wave splash', 3, 'spells', ['water', 'spell', 'wave', 'splash', 'magic', 'dnd', 'tidal', 'cast'], 'Water magic spell, conjured wave surging and crashing with a magical shimmer, no music'),
    sfx('chain lightning crackle', 3, 'spells', ['chain', 'lightning', 'crackle', 'spell', 'magic', 'dnd', 'electric', 'arc'], 'Chain lightning spell, electric bolt arcing between several targets with crackling zaps, no music'),
    sfx('poison cloud spell', 4, 'spells', ['poison', 'cloud', 'spell', 'magic', 'dnd', 'gas', 'toxic', 'cast'], 'Poison cloud spell billowing out, dark hissing vapor with a bubbling toxic undertone, no music'),
    sfx('illusion shimmer spell', 3, 'spells', ['illusion', 'shimmer', 'spell', 'magic', 'dnd', 'trick', 'glamour', 'cast'], 'Illusion spell weaving, glassy shimmering tones phasing in and out, fantasy magic, no music'),
    sfx('polymorph transform spell', 4, 'spells', ['polymorph', 'transform', 'spell', 'magic', 'dnd', 'shapeshift', 'morph', 'cast'], 'Polymorph spell, body warping with a stretching magical squelch and sparkle finish, no music'),
    sfx('haste spell whoosh', 2, 'spells', ['haste', 'spell', 'whoosh', 'magic', 'dnd', 'speed', 'fast', 'buff'], 'Haste spell, quick energizing whoosh with rapid rising flutter, fantasy buff, no music'),
    sfx('slow spell time drone', 4, 'spells', ['slow', 'spell', 'time', 'drone', 'magic', 'dnd', 'debuff', 'warp'], 'Slow spell, sound of time thickening with a descending pitch drone and heavy warble, no music'),
    sfx('misty step blink', 2, 'spells', ['misty', 'step', 'blink', 'teleport', 'spell', 'magic', 'dnd', 'vanish'], 'Misty step teleport, soft puff of silvery mist then an instant blink reappearance, no music'),
    sfx('thunderclap spell', 2, 'spells', ['thunderclap', 'spell', 'magic', 'dnd', 'boom', 'shockwave', 'cast', 'burst'], 'Thunderclap spell, sharp magical boom with a shockwave burst, no music'),
    sfx('fire bolt launch', 2, 'spells', ['fire', 'bolt', 'launch', 'spell', 'magic', 'dnd', 'cantrip', 'flame'], 'Fire bolt cantrip, quick flaming projectile launched with a fiery whoosh, no music'),
    sfx('mage hand spell', 2, 'spells', ['mage', 'hand', 'spell', 'magic', 'dnd', 'spectral', 'cantrip', 'telekinetic'], 'Mage hand cantrip, soft spectral hand materializing with a gentle arcane shimmer, no music'),
    sfx('divination vision chime', 4, 'spells', ['divination', 'vision', 'chime', 'spell', 'magic', 'dnd', 'prophecy', 'oracle'], 'Divination spell, ethereal crystalline chimes and a swelling mystical tone revealing a vision, no music'),
    sfx('bless holy chime', 3, 'spells', ['bless', 'holy', 'chime', 'spell', 'cleric', 'dnd', 'divine', 'buff'], 'Bless spell, warm holy chime with soft choir-like shimmer, cleric divine magic, no words'),
    sfx('fear spell dark scream', 3, 'spells', ['fear', 'spell', 'dark', 'scream', 'magic', 'dnd', 'terror', 'necromancy'], 'Fear spell, dark magical pulse with a distorted ghostly scream, no words, no music'),
    sfx('sleep spell lullaby shimmer', 4, 'spells', ['sleep', 'spell', 'lullaby', 'shimmer', 'magic', 'dnd', 'enchantment', 'drowsy'], 'Sleep spell, soft descending magical shimmer like dust settling, drowsy enchantment, no music'),
    sfx('entangle vines growing', 4, 'spells', ['entangle', 'vines', 'growing', 'spell', 'druid', 'dnd', 'nature', 'roots'], 'Entangle spell, vines and roots rapidly growing and wrapping with creaking plant movement, no music'),
    sfx('stoneskin spell harden', 3, 'spells', ['stoneskin', 'spell', 'harden', 'magic', 'dnd', 'stone', 'protection', 'buff'], 'Stoneskin spell, skin hardening with a grinding rocky crackle and a solid thud finish, no music'),

    // ── SFX: game UI / sports ──
    sfx('level up chime', 2, 'gameui', ['level', 'up', 'chime', 'game', 'ui', 'reward', 'success', 'rpg'], 'Bright video game level up chime, ascending sparkly arpeggio'),
    sfx('achievement unlocked', 2, 'gameui', ['achievement', 'unlocked', 'game', 'ui', 'reward', 'trophy', 'notification', 'win'], 'Achievement unlocked notification, short satisfying two-tone chime with a shimmer'),
    sfx('error buzz negative', 1, 'gameui', ['error', 'buzz', 'negative', 'game', 'ui', 'wrong', 'denied', 'fail'], 'Short harsh negative error buzz, game UI denied sound'),
    sfx('menu select click', 1, 'gameui', ['menu', 'select', 'click', 'game', 'ui', 'confirm', 'button', 'interface'], 'Clean game menu select confirm click, soft digital blip'),
    sfx('menu hover blip', 1, 'gameui', ['menu', 'hover', 'blip', 'game', 'ui', 'cursor', 'move', 'interface'], 'Subtle game menu cursor hover blip, tiny soft tick'),
    sfx('quest complete fanfare', 3, 'gameui', ['quest', 'complete', 'fanfare', 'game', 'rpg', 'victory', 'reward', 'success'], 'Short triumphant quest complete fanfare, brass and chime flourish, rpg reward'),
    sfx('item pickup sparkle', 1, 'gameui', ['item', 'pickup', 'sparkle', 'game', 'loot', 'collect', 'ui', 'rpg'], 'Quick item pickup sparkle, bright short collect sound'),
    sfx('success chime', 2, 'gameui', ['success', 'chime', 'correct', 'game', 'ui', 'positive', 'ding', 'complete'], 'Pleasant success chime, warm ascending two-note ding'),
    sfx('failure sting', 2, 'gameui', ['failure', 'sting', 'game', 'lose', 'defeat', 'wrong', 'ui', 'sad'], 'Short descending failure sting, game over feel, low and deflating'),
    sfx('countdown beep three', 4, 'gameui', ['countdown', 'beep', 'three', 'timer', 'start', 'race', 'go', 'game'], 'Countdown beeps three two one then a higher go tone, race start, no voices'),
    sfx('referee whistle', 2, 'gameui', ['referee', 'whistle', 'sports', 'foul', 'game', 'coach', 'blow', 'stop'], 'Sharp referee whistle blast, single loud blow with a short trill, no music'),
    sfx('game show buzzer wrong', 2, 'gameui', ['game', 'show', 'buzzer', 'wrong', 'quiz', 'incorrect', 'tv', 'loud'], 'Loud game show wrong answer buzzer, harsh honking buzz'),
    sfx('game show ding correct', 1, 'gameui', ['game', 'show', 'ding', 'correct', 'quiz', 'bell', 'right', 'tv'], 'Bright game show correct answer ding, single clear bell'),
    sfx('basketball dribble bounce', 4, 'gameui', ['basketball', 'dribble', 'bounce', 'sports', 'court', 'ball', 'gym', 'squeak'], 'Basketball dribbling on an indoor court, rhythmic bounces and a sneaker squeak, no music'),
    sfx('baseball bat crack', 2, 'gameui', ['baseball', 'bat', 'crack', 'sports', 'hit', 'home', 'run', 'ball'], 'Baseball bat cracking a solid hit, sharp wooden crack with a small crowd swell, no music'),
    sfx('goal air horn', 3, 'gameui', ['goal', 'air', 'horn', 'sports', 'hockey', 'score', 'arena', 'celebration'], 'Arena goal air horn blasting, long loud celebratory honk, no music'),
    sfx('stadium crowd chant', 6, 'gameui', ['stadium', 'crowd', 'chant', 'sports', 'fans', 'clap', 'rhythm', 'arena'], 'Stadium crowd chanting rhythmically with clapping, big energetic fan chorus, no clear words, no music'),
    sfx('starting pistol race', 2, 'gameui', ['starting', 'pistol', 'race', 'sports', 'track', 'gun', 'begin', 'athletics'], 'Starting pistol firing at a track meet, sharp crack with outdoor echo, no music'),
    sfx('boxing bell round', 3, 'gameui', ['boxing', 'bell', 'round', 'ring', 'fight', 'sports', 'start', 'ding'], 'Boxing ring bell ringing to start a round, bright metallic ding ding ding, no music'),
    sfx('slot machine jackpot', 6, 'gameui', ['slot', 'machine', 'jackpot', 'casino', 'coins', 'win', 'gambling', 'bells'], 'Slot machine hitting the jackpot, spinning reels stop, alarm bells ring and coins pour out, no music'),
    sfx('card shuffle deal', 4, 'gameui', ['card', 'shuffle', 'deal', 'poker', 'casino', 'cards', 'deck', 'table'], 'Deck of cards riffle shuffled then several cards dealt onto a felt table, no music'),
    sfx('poker chips stack', 3, 'gameui', ['poker', 'chips', 'stack', 'casino', 'bet', 'gambling', 'clay', 'table'], 'Poker chips stacked and pushed forward across a felt table, clay chip clicks, no music'),
    // ── SFX: everyday foley ──
    sfx('beer pour foam glass', 4, 'foley', ['beer', 'pour', 'foam', 'glass', 'drink', 'bar', 'tap', 'pub'], 'Beer poured from a tap into a pint glass, liquid filling with fizzing foam head, no music'),
    sfx('wine pour bottle', 4, 'foley', ['wine', 'pour', 'bottle', 'glass', 'drink', 'dinner', 'glug', 'restaurant'], 'Wine poured from a bottle into a glass, gentle glugging and liquid filling, no music'),
    sfx('champagne cork pop', 2, 'foley', ['champagne', 'cork', 'pop', 'celebration', 'bottle', 'party', 'fizz', 'toast'], 'Champagne cork popping loudly followed by a short fizz, celebration, no cheering, no music'),
    sfx('cutlery plates clatter', 4, 'foley', ['cutlery', 'plates', 'clatter', 'dishes', 'kitchen', 'dinner', 'silverware', 'table'], 'Plates and cutlery being set and gathered on a table, ceramic and metal clatter, no music, no voices'),
    sfx('blender whir', 5, 'foley', ['blender', 'whir', 'kitchen', 'smoothie', 'appliance', 'motor', 'blend', 'loud'], 'Kitchen blender running at high speed, loud motor whir with ice crunching, no music'),
    sfx('coffee machine brewing', 6, 'foley', ['coffee', 'machine', 'brewing', 'kitchen', 'morning', 'drip', 'gurgle', 'appliance'], 'Coffee machine brewing, gurgling, dripping and a final steam hiss, no music'),
    sfx('ice cubes in glass', 3, 'foley', ['ice', 'cubes', 'glass', 'drink', 'clink', 'bar', 'whiskey', 'pour'], 'Ice cubes dropped into a glass and swirled with clinking, no music'),
    sfx('shovel digging dirt', 5, 'foley', ['shovel', 'digging', 'dirt', 'dig', 'grave', 'garden', 'soil', 'scoop'], 'Shovel digging into dirt, several scoops with soil tossed aside, outdoor Foley, no music'),
    sfx('watering can pour', 4, 'foley', ['watering', 'can', 'pour', 'garden', 'plants', 'water', 'sprinkle', 'outdoor'], 'Watering can pouring onto garden soil and leaves, soft sprinkling stream, no music'),
    sfx('sewing machine', 5, 'foley', ['sewing', 'machine', 'stitch', 'fabric', 'tailor', 'needle', 'craft', 'motor'], 'Sewing machine running in short bursts, rapid needle stitching and motor hum, no music'),
    sfx('scissors cutting paper', 3, 'foley', ['scissors', 'cutting', 'paper', 'snip', 'craft', 'office', 'cut', 'school'], 'Scissors snipping through a sheet of paper, several crisp cuts, no music'),
    sfx('car keys drop', 1, 'foley', ['car', 'keys', 'drop', 'jingle', 'floor', 'table', 'metal', 'fall'], 'Set of keys dropped onto a hard table with a metallic jingle, no music'),
    sfx('suitcase wheels rolling', 5, 'foley', ['suitcase', 'wheels', 'rolling', 'luggage', 'travel', 'airport', 'pavement', 'rattle'], 'Rolling suitcase wheels rattling along pavement and over a crack, travel Foley, no music'),
    sfx('umbrella open', 2, 'foley', ['umbrella', 'open', 'rain', 'snap', 'fabric', 'click', 'weather', 'street'], 'Umbrella snapping open with a fabric whoosh and a click, no rain bed, no music'),
    sfx('bath filling water', 6, 'foley', ['bath', 'filling', 'water', 'tub', 'faucet', 'bathroom', 'running', 'relax'], 'Bathtub filling with water from a faucet, steady rushing stream and echoing bathroom splash, no music'),
    sfx('hair dryer', 5, 'foley', ['hair', 'dryer', 'bathroom', 'blow', 'appliance', 'morning', 'air', 'motor'], 'Hair dryer running on high, steady rushing air and motor whine, no music'),
    sfx('electric razor', 4, 'foley', ['electric', 'razor', 'shaver', 'bathroom', 'buzz', 'morning', 'groom', 'trimmer'], 'Electric razor buzzing while shaving, small motor hum with pitch changes, no music'),
    sfx('shopping cart rattle', 5, 'foley', ['shopping', 'cart', 'rattle', 'store', 'grocery', 'wheels', 'supermarket', 'metal'], 'Shopping cart pushed through a store, rattling metal cage and wobbly wheel, no music, no voices'),
    sfx('vending machine drop', 3, 'foley', ['vending', 'machine', 'drop', 'snack', 'coin', 'thunk', 'office', 'buy'], 'Vending machine coin insert, motor whir and a snack dropping with a thunk, no music'),
    sfx('atm beeps cash', 4, 'foley', ['atm', 'beeps', 'cash', 'bank', 'money', 'withdraw', 'machine', 'card'], 'ATM keypad beeps then cash dispensing with a mechanical whir and bills counting out, no music'),
    sfx('text message send whoosh', 1, 'foley', ['text', 'message', 'send', 'whoosh', 'phone', 'app', 'chat', 'notification'], 'Smartphone text message send whoosh, short soft swipe tone'),
    sfx('baby giggle', 3, 'foley', ['baby', 'giggle', 'laugh', 'infant', 'happy', 'cute', 'child', 'family'], 'Baby giggling happily, cute infant laugh, no music'),

    // ── SFX: vehicles ──
    sfx('bicycle chain pedaling', 5, 'vehicles', ['bicycle', 'chain', 'pedaling', 'bike', 'ride', 'gears', 'wheels', 'street'], 'Bicycle being pedaled past, chain whir, gear clicks and tire hum on pavement, no music'),
    sfx('skateboard rolling trick', 4, 'vehicles', ['skateboard', 'rolling', 'trick', 'skate', 'wheels', 'kickflip', 'pavement', 'street'], 'Skateboard rolling on concrete then popping a trick and landing with a wooden clack, no music'),
    sfx('outboard boat motor', 6, 'vehicles', ['outboard', 'boat', 'motor', 'engine', 'lake', 'fishing', 'water', 'putter'], 'Small outboard boat motor puttering across a lake with water splashing at the hull, no music'),
    sfx('speedboat pass', 5, 'vehicles', ['speedboat', 'pass', 'boat', 'fast', 'engine', 'water', 'wake', 'lake'], 'Speedboat roaring past at full throttle, engine doppler and spraying wake, no music'),
    sfx('jet ski pass', 5, 'vehicles', ['jet', 'ski', 'pass', 'watercraft', 'beach', 'engine', 'summer', 'wave'], 'Jet ski whining past close to shore, bouncing on waves with engine pitch changes, no music'),
    sfx('tram bell ding', 2, 'vehicles', ['tram', 'bell', 'ding', 'streetcar', 'trolley', 'city', 'transit', 'warning'], 'Streetcar tram bell dinging twice as it approaches, city transit, no music'),
    sfx('hot air balloon burner', 4, 'vehicles', ['hot', 'air', 'balloon', 'burner', 'flame', 'blast', 'flight', 'sky'], 'Hot air balloon burner firing a long roaring flame blast then cutting off, no music'),
    sfx('submarine sonar ping', 4, 'vehicles', ['submarine', 'sonar', 'ping', 'navy', 'underwater', 'echo', 'military', 'depth'], 'Submarine sonar ping echoing through deep water, two slow pings with a long reverberant tail, no music'),
    sfx('train brakes squeal', 5, 'vehicles', ['train', 'brakes', 'squeal', 'rail', 'stop', 'metal', 'station', 'screech'], 'Train braking into a station, long metallic brake squeal and hissing air release, no music'),
    sfx('airplane cabin chime', 2, 'vehicles', ['airplane', 'cabin', 'chime', 'seatbelt', 'flight', 'plane', 'ding', 'travel'], 'Airplane cabin seatbelt chime, soft two-tone ding with cabin hum underneath, no voices'),

    // ── SFX: nature one-shots ──
    sfx('tornado roar', 8, 'nature', ['tornado', 'roar', 'storm', 'wind', 'twister', 'disaster', 'debris', 'weather'], 'Tornado approaching, massive roaring wind like a freight train with debris and whipping gusts, no music'),
    sfx('rain first drops starting', 6, 'nature', ['rain', 'first', 'drops', 'starting', 'weather', 'storm', 'begin', 'patter'], 'Rain beginning, a few scattered first drops on leaves and pavement building into a light shower, no music'),
    sfx('geyser erupting', 6, 'nature', ['geyser', 'erupting', 'steam', 'water', 'hot', 'spring', 'burst', 'volcanic'], 'Geyser erupting, rumbling buildup then a towering blast of water and steam, no music'),
    sfx('lake ice crack', 3, 'nature', ['lake', 'ice', 'crack', 'frozen', 'winter', 'danger', 'thin', 'echo'], 'Frozen lake ice cracking with a sharp echoing boom and a laser-like ping resonance, no music'),
    sfx('mud bubble pop', 3, 'nature', ['mud', 'bubble', 'pop', 'swamp', 'bog', 'wet', 'squelch', 'gurgle'], 'Thick mud bubbling and popping in a swamp, slow wet gurgles, no music'),
    sfx('meteor streak impact', 5, 'nature', ['meteor', 'streak', 'impact', 'space', 'fireball', 'crash', 'sky', 'boom'], 'Meteor streaking down with a roaring whistle then a massive ground impact and rumbling aftermath, no music'),
    sfx('river rapids rushing', 8, 'nature', ['river', 'rapids', 'rushing', 'whitewater', 'water', 'fast', 'rocks', 'roar'], 'Powerful whitewater river rapids rushing over rocks, churning and roaring, no music'),
    sfx('dust storm gust', 6, 'nature', ['dust', 'storm', 'gust', 'sand', 'desert', 'wind', 'haboob', 'grit'], 'Desert dust storm gust sweeping through, howling wind with sand hissing against surfaces, no music'),

    // ── SFX: human reactions ──
    sfx('man laughing hearty', 3, 'human', ['man', 'laughing', 'hearty', 'laugh', 'male', 'belly', 'joy', 'voice'], 'Man laughing heartily, warm deep belly laugh, no words, no music'),
    sfx('woman laughing', 3, 'human', ['woman', 'laughing', 'laugh', 'female', 'giggle', 'joy', 'amused', 'voice'], 'Woman laughing warmly and genuinely, no words, no music'),
    sfx('kids cheering', 4, 'human', ['kids', 'cheering', 'children', 'yay', 'excited', 'party', 'group', 'happy'], 'Group of children cheering excitedly with yays and claps, no clear words, no music'),
    sfx('group shush quiet', 2, 'human', ['group', 'shush', 'quiet', 'hush', 'library', 'silence', 'whisper', 'voice'], 'Several people shushing at once, sharp hushing shh sounds, no words, no music'),
    sfx('yawn stretch', 3, 'human', ['yawn', 'stretch', 'tired', 'sleepy', 'morning', 'human', 'wake', 'voice'], 'Long sleepy human yawn with a stretching groan, no words, no music'),
    sfx('slurp drink straw', 3, 'human', ['slurp', 'drink', 'straw', 'cup', 'soda', 'empty', 'funny', 'mouth'], 'Loud slurping through a straw reaching the empty bottom of a cup, no music'),
    sfx('burp loud', 1, 'human', ['burp', 'loud', 'belch', 'funny', 'gross', 'comic', 'mouth', 'body'], 'Single loud human burp, comedic belch, no words, no music'),
    sfx('hiccup single', 1, 'human', ['hiccup', 'single', 'human', 'funny', 'drunk', 'reaction', 'body', 'voice'], 'Single human hiccup, short squeaky reaction, no words, no music'),
    sfx('teeth chattering cold', 3, 'human', ['teeth', 'chattering', 'cold', 'shiver', 'freezing', 'winter', 'human', 'body'], 'Teeth chattering from cold with a shivering breath, no words, no music'),
    sfx('footsteps running concrete', 5, 'human', ['footsteps', 'running', 'concrete', 'chase', 'sprint', 'city', 'shoes', 'pavement'], 'Person sprinting on concrete, fast hard-soled footsteps with echo, no breathing, no music'),

    // ── SFX: fantasy creatures ──
    sfx('griffin screech', 3, 'creatures', ['griffin', 'screech', 'eagle', 'lion', 'fantasy', 'dnd', 'beast', 'flying'], 'Griffin screeching, piercing eagle-like cry with a lion growl undertone, fantasy beast, no music'),
    sfx('hydra multiple hisses', 4, 'creatures', ['hydra', 'multiple', 'hisses', 'heads', 'serpent', 'fantasy', 'dnd', 'monster'], 'Hydra with several heads hissing and snapping at once, overlapping serpent hisses, no music'),
    sfx('basilisk hiss rattle', 3, 'creatures', ['basilisk', 'hiss', 'rattle', 'serpent', 'petrify', 'fantasy', 'dnd', 'monster'], 'Basilisk hissing with a dry stony rattle, reptilian fantasy monster, no music'),
    sfx('owlbear roar', 3, 'creatures', ['owlbear', 'roar', 'bear', 'owl', 'screech', 'fantasy', 'dnd', 'monster'], 'Owlbear roaring, bear roar blended with a shrieking owl screech, no music'),
    sfx('mimic chest snap', 3, 'creatures', ['mimic', 'chest', 'snap', 'teeth', 'trap', 'fantasy', 'dnd', 'monster'], 'Mimic chest revealing itself, wooden lid creak then snapping jaws with teeth clacking and a wet growl, no music'),
    sfx('gelatinous cube squelch', 4, 'creatures', ['gelatinous', 'cube', 'squelch', 'ooze', 'slime', 'fantasy', 'dnd', 'monster'], 'Gelatinous cube sliding forward, thick wet squelching ooze and acidic bubbling, no music'),
    sfx('beholder eye ray hum', 3, 'creatures', ['beholder', 'eye', 'ray', 'hum', 'magic', 'fantasy', 'dnd', 'monster'], 'Beholder charging and firing an eye ray, rising magical hum into a crackling beam zap, no music'),
    sfx('lich whisper spell', 4, 'creatures', ['lich', 'whisper', 'spell', 'undead', 'necromancer', 'fantasy', 'dnd', 'dark'], 'Lich casting, dry sepulchral whispering voice layered with dark magical hum, no clear words, no music'),
    sfx('ghoul snarl', 2, 'creatures', ['ghoul', 'snarl', 'undead', 'horror', 'fantasy', 'dnd', 'monster', 'hungry'], 'Ghoul snarling hungrily, wet raspy undead growl, no music'),
    sfx('banshee wail', 5, 'creatures', ['banshee', 'wail', 'scream', 'ghost', 'horror', 'fantasy', 'dnd', 'undead'], 'Banshee wailing, piercing ghostly scream rising and echoing, no words, no music'),
    sfx('kraken tentacle slam water', 4, 'creatures', ['kraken', 'tentacle', 'slam', 'water', 'sea', 'monster', 'fantasy', 'ship'], 'Giant kraken tentacle rising from the sea and slamming down with a massive splash and wet thud, no music'),
    sfx('giant spider hiss skitter', 3, 'creatures', ['giant', 'spider', 'hiss', 'skitter', 'legs', 'fantasy', 'dnd', 'monster'], 'Giant spider hissing and skittering on stone, many rapid chitinous legs, no music'),
    sfx('dire wolf snarl', 3, 'creatures', ['dire', 'wolf', 'snarl', 'growl', 'beast', 'fantasy', 'dnd', 'predator'], 'Huge dire wolf snarling close with a deep rumbling growl and snapping teeth, no music'),
    sfx('wyvern screech flyby', 4, 'creatures', ['wyvern', 'screech', 'flyby', 'wings', 'dragon', 'fantasy', 'dnd', 'sky'], 'Wyvern screeching while flying past overhead, leathery wing beats and doppler cry, no music'),
    sfx('treant creaking groan', 5, 'creatures', ['treant', 'creaking', 'groan', 'tree', 'ent', 'fantasy', 'dnd', 'wood'], 'Treant awakening and moving, deep creaking wood groans and roots tearing from soil, no music'),
    sfx('fire elemental roar', 4, 'creatures', ['fire', 'elemental', 'roar', 'flame', 'whoosh', 'fantasy', 'dnd', 'monster'], 'Fire elemental roaring, voice made of roaring flames and whooshing fire, no music'),
    sfx('earth elemental rumble', 4, 'creatures', ['earth', 'elemental', 'rumble', 'stone', 'rocks', 'fantasy', 'dnd', 'monster'], 'Earth elemental rising, grinding boulders and deep rocky rumble with gravel falling, no music'),
    sfx('water elemental surge', 4, 'creatures', ['water', 'elemental', 'surge', 'wave', 'splash', 'fantasy', 'dnd', 'monster'], 'Water elemental surging up, churning water forming and crashing with a watery roar, no music'),
    sfx('air elemental gust', 4, 'creatures', ['air', 'elemental', 'gust', 'wind', 'whirl', 'fantasy', 'dnd', 'monster'], 'Air elemental swirling, whipping tornado-like gusts with a howling voice, no music'),
    sfx('imp cackle', 2, 'creatures', ['imp', 'cackle', 'giggle', 'demon', 'small', 'fantasy', 'dnd', 'mischief'], 'Small imp cackling mischievously, high-pitched devilish giggle, no words, no music'),
    sfx('minotaur bellow', 3, 'creatures', ['minotaur', 'bellow', 'bull', 'roar', 'labyrinth', 'fantasy', 'dnd', 'monster'], 'Minotaur bellowing, huge bull roar with a snorting growl, no music'),
    sfx('harpy screech', 3, 'creatures', ['harpy', 'screech', 'bird', 'woman', 'scream', 'fantasy', 'dnd', 'monster'], 'Harpy screeching, shrill bird shriek blended with a wailing cry, no words, no music'),
    sfx('gargoyle stone awaken', 4, 'creatures', ['gargoyle', 'stone', 'awaken', 'crack', 'statue', 'fantasy', 'dnd', 'monster'], 'Stone gargoyle awakening, cracking stone shell falling away and a gravelly growl, no music'),
    sfx('phoenix cry fire', 4, 'creatures', ['phoenix', 'cry', 'fire', 'bird', 'rebirth', 'fantasy', 'flame', 'majestic'], 'Phoenix crying out, majestic bird call wrapped in roaring flames and sparkle, no music'),

    // ── SFX: weapon and combat variants ──
    sfx('greatsword heavy swing', 2, 'combat', ['greatsword', 'heavy', 'swing', 'sword', 'two', 'handed', 'whoosh', 'dnd'], 'Massive two-handed greatsword swung with a deep heavy whoosh, no impact, no music'),
    sfx('sword clash parry series', 4, 'combat', ['sword', 'clash', 'parry', 'series', 'duel', 'steel', 'fight', 'dnd'], 'Fast sword duel exchange, four rapid steel clashes and parries with scraping blades, no voices, no music'),
    sfx('axe throw spin impact', 3, 'combat', ['axe', 'throw', 'spin', 'impact', 'thrown', 'wood', 'weapon', 'dnd'], 'Throwing axe spinning through the air and burying itself in wood with a heavy thunk, no music'),
    sfx('spear thrust whoosh', 2, 'combat', ['spear', 'thrust', 'whoosh', 'polearm', 'jab', 'weapon', 'dnd', 'attack'], 'Spear thrust forward with a quick sharp whoosh and shaft creak, no impact, no music'),
    sfx('halberd swing', 2, 'combat', ['halberd', 'swing', 'polearm', 'heavy', 'whoosh', 'guard', 'weapon', 'dnd'], 'Halberd swung in a wide heavy arc, long weapon whoosh with a slight metal ring, no music'),
    sfx('bow draw release', 3, 'combat', ['bow', 'draw', 'release', 'arrow', 'string', 'creak', 'archer', 'dnd'], 'Longbow drawn back with creaking wood and string tension then released with a twang and arrow whoosh, no music'),
    sfx('armor hit sword glance', 2, 'combat', ['armor', 'hit', 'sword', 'glance', 'plate', 'deflect', 'metal', 'dnd'], 'Sword glancing off plate armor, sharp metallic scrape and clang, no music'),
    sfx('knife throw hit wood', 2, 'combat', ['knife', 'throw', 'hit', 'wood', 'thrown', 'dagger', 'thunk', 'target'], 'Throwing knife whistling briefly and sticking into a wooden board with a sharp thunk, no music'),
    sfx('club wooden smash', 2, 'combat', ['club', 'wooden', 'smash', 'bludgeon', 'hit', 'ogre', 'weapon', 'dnd'], 'Heavy wooden club smashing down with a cracking impact, no music'),
    sfx('chain whip swing rattle', 3, 'combat', ['chain', 'whip', 'swing', 'rattle', 'metal', 'weapon', 'dnd', 'links'], 'Chain weapon swung in a circle, rattling metal links whirring then a snap, no music'),
    sfx('war drum single beat', 2, 'combat', ['war', 'drum', 'single', 'beat', 'battle', 'boom', 'army', 'signal'], 'Single massive war drum hit with a deep booming resonance and decay'),
    sfx('horn signal retreat', 4, 'combat', ['horn', 'signal', 'retreat', 'battle', 'army', 'call', 'medieval', 'fall'], 'Medieval war horn blowing a long descending retreat signal across a battlefield, no music'),
    sfx('catapult impact wall', 3, 'combat', ['catapult', 'impact', 'wall', 'siege', 'stone', 'crash', 'castle', 'rubble'], 'Catapult boulder smashing into a castle wall, massive stone impact with rubble cascading, no music'),
    sfx('siege tower creak advance', 5, 'combat', ['siege', 'tower', 'creak', 'advance', 'wood', 'wheels', 'castle', 'war'], 'Huge wooden siege tower rolling forward, groaning timbers, grinding wheels and straining ropes, no music'),
    sfx('ballista fire bolt', 3, 'combat', ['ballista', 'fire', 'bolt', 'siege', 'weapon', 'twang', 'heavy', 'war'], 'Ballista firing a giant bolt, massive twang and heavy projectile whoosh, no music'),
    sfx('trebuchet release', 4, 'combat', ['trebuchet', 'release', 'siege', 'launch', 'counterweight', 'creak', 'war', 'castle'], 'Trebuchet releasing, counterweight dropping with a wooden groan and sling whooshing a stone skyward, no music'),
    sfx('gauntlet punch metal', 2, 'combat', ['gauntlet', 'punch', 'metal', 'armor', 'fist', 'impact', 'knight', 'dnd'], 'Armored gauntlet punch landing with a metallic thud and clank, no music'),
    sfx('helmet visor clank', 2, 'combat', ['helmet', 'visor', 'clank', 'knight', 'armor', 'metal', 'close', 'dnd'], 'Knight slamming a helmet visor down with a sharp metal clank, no music'),

    // ── SFX: environment one-shots ──
    sfx('castle gate open heavy', 6, 'environment', ['castle', 'gate', 'open', 'heavy', 'wood', 'iron', 'creak', 'fantasy'], 'Massive castle gate swinging open, groaning iron hinges and heavy wood with a final boom, no music'),
    sfx('stone pillar collapse', 5, 'environment', ['stone', 'pillar', 'collapse', 'crash', 'ruins', 'rubble', 'temple', 'fantasy'], 'Ancient stone pillar cracking and toppling, crashing to the floor with rubble scattering, no music'),
    sfx('cave in rocks falling', 6, 'environment', ['cave', 'rocks', 'falling', 'collapse', 'rumble', 'mine', 'danger', 'dust'], 'Cave-in, rumbling ceiling giving way with rocks and boulders crashing down and dust settling, no music'),
    sfx('ice bridge crack collapse', 4, 'environment', ['ice', 'bridge', 'crack', 'collapse', 'frozen', 'shatter', 'fall', 'danger'], 'Ice bridge cracking rapidly then shattering and collapsing into icy water below, no music'),
    sfx('lava splash burst', 3, 'environment', ['lava', 'splash', 'burst', 'volcano', 'magma', 'fire', 'sizzle', 'eruption'], 'Lava bursting and splashing with a heavy molten splat and sizzling hiss, no music'),
    sfx('portal rift tearing', 4, 'environment', ['portal', 'rift', 'tearing', 'dimension', 'magic', 'planar', 'fantasy', 'energy'], 'Dimensional rift tearing open, reality ripping with a crackling energy roar and warping hum, no music'),
    sfx('bell tower midnight toll', 8, 'environment', ['bell', 'tower', 'midnight', 'toll', 'church', 'clock', 'ominous', 'town'], 'Large bell tower tolling slowly several times, deep resonant bronze bell with long decay, no music'),
    sfx('gate chain hoist', 5, 'environment', ['gate', 'chain', 'hoist', 'winch', 'raise', 'castle', 'metal', 'mechanism'], 'Heavy chain winch hoisting a gate, rhythmic clanking links and creaking wooden wheel, no music'),
    sfx('wooden bridge collapse', 5, 'environment', ['wooden', 'bridge', 'collapse', 'snap', 'planks', 'fall', 'river', 'danger'], 'Old wooden bridge snapping and collapsing, planks breaking and falling into a river, no music'),
    sfx('ship hull cracking', 4, 'environment', ['ship', 'hull', 'cracking', 'wood', 'sinking', 'water', 'rush', 'disaster'], 'Ship hull cracking open, splintering timbers and seawater rushing in, no music'),
    sfx('sail tearing wind', 3, 'environment', ['sail', 'tearing', 'wind', 'canvas', 'rip', 'storm', 'ship', 'sea'], 'Ship sail tearing in a storm, canvas ripping violently with flapping and wind, no music'),
    sfx('lightning hits tree crack', 3, 'environment', ['lightning', 'hits', 'tree', 'crack', 'strike', 'storm', 'split', 'wood'], 'Lightning striking a tree, deafening crack with wood splitting and burning hiss, no music'),
    sfx('dam breaking water surge', 6, 'environment', ['dam', 'breaking', 'water', 'surge', 'flood', 'crash', 'disaster', 'rush'], 'Dam breaking, cracking concrete then a thunderous surge of flood water rushing through, no music'),
    sfx('crystal cave resonance', 5, 'environment', ['crystal', 'cave', 'resonance', 'chime', 'magic', 'glow', 'fantasy', 'hum'], 'Crystal cave resonating, glassy harmonic chimes ringing and humming as crystals vibrate, no music'),
    sfx('ancient door rune unlock', 4, 'environment', ['ancient', 'door', 'rune', 'unlock', 'magic', 'stone', 'mechanism', 'fantasy'], 'Ancient stone door unlocking, glowing runes chiming in sequence then heavy mechanisms grinding open, no music'),

    // ── SFX: cinematic stingers ──
    sfx('trailer braam hit', 4, 'stingers', ['trailer', 'braam', 'hit', 'cinematic', 'epic', 'impact', 'drama', 'stinger'], 'Massive cinematic trailer braam, huge brassy impact with a long dark tail'),
    sfx('suspense riser build', 6, 'stingers', ['suspense', 'riser', 'build', 'tension', 'cinematic', 'rising', 'stinger', 'thriller'], 'Cinematic suspense riser, tension building steadily to a sharp cutoff'),
    sfx('dramatic reveal sting', 3, 'stingers', ['dramatic', 'reveal', 'sting', 'cinematic', 'shock', 'twist', 'orchestral', 'stinger'], 'Dramatic orchestral reveal sting, sharp string stab with a shimmering tail'),
    sfx('mystery sting pizzicato', 3, 'stingers', ['mystery', 'sting', 'pizzicato', 'detective', 'clue', 'curious', 'strings', 'stinger'], 'Playful mystery sting, pizzicato strings with a curious questioning ending'),
    sfx('horror riser scream', 5, 'stingers', ['horror', 'riser', 'scream', 'tension', 'stinger', 'dread', 'cinematic', 'scary'], 'Horror riser, scraping dissonant build ending in a distorted shriek'),
    sfx('battle drums intro', 6, 'stingers', ['battle', 'drums', 'intro', 'war', 'percussion', 'epic', 'march', 'stinger'], 'Epic battle drums intro, pounding taiko and snare build with a final hit, percussion only'),
    sfx('heroic brass sting', 3, 'stingers', ['heroic', 'brass', 'sting', 'fanfare', 'triumph', 'epic', 'hero', 'stinger'], 'Short heroic brass sting, bold triumphant chord flourish'),
    sfx('dark choir hit', 4, 'stingers', ['dark', 'choir', 'hit', 'ominous', 'evil', 'cinematic', 'villain', 'stinger'], 'Dark ominous choir hit, deep sustained voices with a thunderous impact, no words'),
    sfx('magical discovery sting', 3, 'stingers', ['magical', 'discovery', 'sting', 'wonder', 'sparkle', 'harp', 'treasure', 'stinger'], 'Magical discovery sting, sparkling harp and chime flourish of wonder'),
    sfx('scene transition whoosh', 2, 'stingers', ['scene', 'transition', 'whoosh', 'cinematic', 'cut', 'swoosh', 'edit', 'stinger'], 'Clean cinematic scene transition whoosh with a soft airy tail'),
    sfx('time passing transition', 4, 'stingers', ['time', 'passing', 'transition', 'clock', 'montage', 'cinematic', 'later', 'stinger'], 'Time passing transition, ticking clock accelerating into a soft shimmering whoosh'),
    sfx('dream sequence harp', 4, 'stingers', ['dream', 'sequence', 'harp', 'glissando', 'flashback', 'fantasy', 'sleep', 'stinger'], 'Dream sequence harp glissando with a dreamy shimmering wash'),
    sfx('flashback reverse whoosh', 3, 'stingers', ['flashback', 'reverse', 'whoosh', 'memory', 'cinematic', 'rewind', 'past', 'stinger'], 'Flashback transition, reversed swelling whoosh snapping into silence'),
    sfx('record scratch stop', 1, 'stingers', ['record', 'scratch', 'stop', 'comedy', 'freeze', 'vinyl', 'halt', 'stinger'], 'Vinyl record scratch stop, abrupt comedic needle rip'),
    sfx('dramatic gong', 5, 'stingers', ['dramatic', 'gong', 'hit', 'asian', 'ceremony', 'cinematic', 'impact', 'stinger'], 'Large dramatic gong struck once with a long shimmering decay'),
    sfx('taiko drum hit', 2, 'stingers', ['taiko', 'drum', 'hit', 'japanese', 'percussion', 'boom', 'impact', 'stinger'], 'Single huge taiko drum hit with deep resonant boom'),
    sfx('church organ dark chord', 5, 'stingers', ['church', 'organ', 'dark', 'chord', 'gothic', 'vampire', 'horror', 'stinger'], 'Gothic pipe organ playing one dark dramatic minor chord with cathedral reverb'),
    sfx('romantic harp glissando', 3, 'stingers', ['romantic', 'harp', 'glissando', 'love', 'tender', 'sweet', 'moment', 'stinger'], 'Romantic harp glissando, soft sweeping sweet flourish'),
    sfx('cliffhanger low boom', 4, 'stingers', ['cliffhanger', 'low', 'boom', 'cinematic', 'end', 'suspense', 'drama', 'stinger'], 'Cliffhanger ending boom, deep sub impact with a tense fading drone'),
    sfx('detective noir sax sting', 4, 'stingers', ['detective', 'noir', 'sax', 'sting', 'jazz', 'mystery', 'city', 'stinger'], 'Film noir saxophone sting, smoky lonely jazz phrase, solo instrument'),
    sfx('western showdown sting', 4, 'stingers', ['western', 'showdown', 'sting', 'standoff', 'cowboy', 'guitar', 'whistle', 'stinger'], 'Spaghetti western showdown sting, twangy guitar note with a lonely whistle and wind'),
    sfx('ticking clock tension', 6, 'stingers', ['ticking', 'clock', 'tension', 'countdown', 'suspense', 'timer', 'bomb', 'stinger'], 'Tense ticking clock with a low suspense drone underneath, steady and unnerving'),

    // ── SFX: fantasy foley extras ──
    sfx('waterskin drink gulp', 3, 'foley', ['waterskin', 'drink', 'gulp', 'travel', 'thirst', 'swallow', 'adventurer', 'dnd'], 'Adventurer drinking from a leather waterskin, cork pop, water sloshing and gulping, no music'),
    sfx('apple bite crunch', 2, 'foley', ['apple', 'bite', 'crunch', 'eating', 'food', 'fruit', 'chew', 'snack'], 'Crisp bite into an apple with juicy crunch and chewing, no music'),
    sfx('bread tearing', 2, 'foley', ['bread', 'tearing', 'loaf', 'food', 'crust', 'tavern', 'meal', 'rip'], 'Crusty bread loaf torn apart by hand, crackling crust and soft tear, no music'),
    sfx('mug slam table', 1, 'foley', ['mug', 'slam', 'table', 'tavern', 'tankard', 'wood', 'drink', 'angry'], 'Heavy wooden tankard slammed down on a tavern table, no music'),
    sfx('tankards clink toast', 2, 'foley', ['tankards', 'clink', 'toast', 'tavern', 'cheers', 'metal', 'drink', 'friends'], 'Two metal tankards clinked together in a toast with ale sloshing, no voices, no music'),
    sfx('chair creak lean back', 2, 'foley', ['chair', 'creak', 'lean', 'back', 'wood', 'sit', 'relax', 'tavern'], 'Wooden chair creaking as someone leans back in it, no music'),
    sfx('bed creak lying down', 3, 'foley', ['bed', 'creak', 'lying', 'down', 'inn', 'rest', 'sleep', 'springs'], 'Old bed creaking as someone lies down on it with blanket rustle, no music'),
    sfx('tent flap canvas', 3, 'foley', ['tent', 'flap', 'canvas', 'camp', 'open', 'outdoor', 'fabric', 'travel'], 'Canvas tent flap pulled open and closed with heavy fabric rustle and tie cords, no music'),
    sfx('compass click open', 1, 'foley', ['compass', 'click', 'open', 'navigate', 'brass', 'explorer', 'lid', 'travel'], 'Brass pocket compass lid clicking open, small metallic click, no music'),
    sfx('lantern creak swing', 4, 'foley', ['lantern', 'creak', 'swing', 'metal', 'handle', 'night', 'oil', 'walk'], 'Metal lantern swinging on its handle with rhythmic creaks and faint glass rattle, no music'),
    sfx('finger snap', 1, 'foley', ['finger', 'snap', 'click', 'hand', 'magic', 'attention', 'gesture', 'quick'], 'Single crisp finger snap, close microphone, no music'),
    sfx('knuckles cracking', 2, 'foley', ['knuckles', 'cracking', 'hands', 'fight', 'ready', 'pop', 'bones', 'threat'], 'Knuckles cracking one after another, sharp pops, no music'),
    sfx('face slap', 1, 'foley', ['face', 'slap', 'hit', 'smack', 'cheek', 'insult', 'hand', 'sharp'], 'Sharp open-hand slap across a face, no voices, no music'),
    sfx('kiss smooch', 1, 'foley', ['kiss', 'smooch', 'romance', 'love', 'lips', 'peck', 'cute', 'affection'], 'Single quick kiss smooch, no words, no music'),
    sfx('hand slap table', 1, 'foley', ['hand', 'slap', 'table', 'anger', 'bang', 'wood', 'demand', 'impact'], 'Palm slammed flat onto a wooden table, sharp impact, no music'),
    sfx('old man cough wheeze', 3, 'foley', ['old', 'man', 'cough', 'wheeze', 'sick', 'elderly', 'voice', 'frail'], 'Elderly man coughing with a wheezing breath, frail and sick, no words, no music'),
    sfx('distant male scream', 3, 'foley', ['distant', 'male', 'scream', 'far', 'help', 'horror', 'echo', 'voice'], 'Man screaming in terror far in the distance with outdoor echo, no words, no music'),
    sfx('short whistle call', 1, 'foley', ['short', 'whistle', 'call', 'human', 'signal', 'attention', 'hey', 'mouth'], 'Short sharp two-note human whistle to get attention, no music'),

    // ── SFX: modern extras ──
    sfx('smoke alarm beeping', 5, 'modern', ['smoke', 'alarm', 'beeping', 'fire', 'detector', 'home', 'warning', 'shrill'], 'Household smoke alarm beeping repeatedly, shrill piercing electronic chirps, no music'),
    sfx('school bell ring', 4, 'modern', ['school', 'bell', 'ring', 'class', 'period', 'hallway', 'loud', 'electric'], 'Electric school bell ringing loudly in a hallway, long metallic ring, no music'),
    sfx('garbage truck lift dump', 6, 'modern', ['garbage', 'truck', 'lift', 'dump', 'hydraulic', 'trash', 'street', 'morning'], 'Garbage truck hydraulic arm lifting and dumping a bin with a crash, engine idling, no music'),
    sfx('lawn mower pass', 6, 'modern', ['lawn', 'mower', 'pass', 'grass', 'engine', 'suburban', 'yard', 'summer'], 'Gas lawn mower running and passing by, buzzing engine with doppler, no music'),
    sfx('leaf blower', 5, 'modern', ['leaf', 'blower', 'yard', 'engine', 'whine', 'suburban', 'autumn', 'loud'], 'Leaf blower running at full speed with a whining engine and rushing air, no music'),
    sfx('ice cream truck jingle', 6, 'modern', ['ice', 'cream', 'truck', 'jingle', 'music', 'box', 'summer', 'neighborhood'], 'Ice cream truck passing with its tinny music box jingle, distant and slightly detuned'),
    sfx('megaphone police unintelligible', 4, 'modern', ['megaphone', 'police', 'unintelligible', 'loudspeaker', 'command', 'standoff', 'distorted', 'siege'], 'Police megaphone barking distorted unintelligible commands outside, no clear words, no music'),
    sfx('subway doors chime close', 3, 'modern', ['subway', 'doors', 'chime', 'close', 'metro', 'train', 'warning', 'transit'], 'Subway door closing chime then doors sliding shut with a thud, no voices, no music'),
    sfx('airplane takeoff roar', 8, 'modern', ['airplane', 'takeoff', 'roar', 'jet', 'runway', 'engines', 'flight', 'airport'], 'Jet airliner taking off, engines spooling to a roar and climbing away, no music'),
    sfx('sports car engine rev', 4, 'modern', ['sports', 'car', 'engine', 'rev', 'exhaust', 'race', 'fast', 'loud'], 'Sports car engine revving aggressively twice then settling to idle, no music'),
    sfx('truck air horn blast', 3, 'modern', ['truck', 'air', 'horn', 'blast', 'semi', 'highway', 'loud', 'warning'], 'Semi truck air horn blasting twice on a highway, no music'),
    sfx('traffic jam honking', 6, 'modern', ['traffic', 'jam', 'honking', 'cars', 'horns', 'city', 'gridlock', 'angry'], 'Traffic jam with multiple cars honking impatiently, engines idling, no music'),
    sfx('doorbell buzzer apartment', 2, 'modern', ['doorbell', 'buzzer', 'apartment', 'intercom', 'buzz', 'door', 'visitor', 'city'], 'Apartment intercom door buzzer, harsh electric buzz, no music'),
    sfx('fire alarm bell', 5, 'modern', ['fire', 'alarm', 'bell', 'evacuate', 'building', 'emergency', 'ring', 'loud'], 'Building fire alarm bell ringing continuously, loud clanging, no music'),
    sfx('snow plow scrape pass', 6, 'modern', ['snow', 'plow', 'scrape', 'pass', 'winter', 'truck', 'street', 'blade'], 'Snow plow truck scraping down a street, blade grinding on asphalt and diesel engine, no music'),

    // ── SFX: animal extras ──
    sfx('horse neigh loud', 3, 'animals', ['horse', 'neigh', 'loud', 'whinny', 'stable', 'ride', 'farm', 'animal'], 'Horse neighing loudly, strong clear whinny, no music'),
    sfx('donkey bray', 3, 'animals', ['donkey', 'bray', 'mule', 'farm', 'hee', 'haw', 'animal', 'funny'], 'Donkey braying loudly, classic hee-haw, no music'),
    sfx('cow bell clank', 3, 'animals', ['cow', 'bell', 'clank', 'alpine', 'farm', 'pasture', 'cattle', 'walk'], 'Cowbell clanking as a cow walks slowly through pasture, no music'),
    sfx('peacock call', 3, 'animals', ['peacock', 'call', 'bird', 'garden', 'estate', 'cry', 'exotic', 'loud'], 'Peacock calling out with its loud piercing cry, no music'),
    sfx('elk bugle', 4, 'animals', ['elk', 'bugle', 'call', 'mountain', 'forest', 'autumn', 'deer', 'wild'], 'Bull elk bugling, eerie rising whistle call echoing in mountains, no music'),
    sfx('wild boar grunt charge', 3, 'animals', ['wild', 'boar', 'grunt', 'charge', 'pig', 'forest', 'hunt', 'dangerous'], 'Wild boar grunting and squealing aggressively then charging through brush, no music'),
    sfx('squirrel chatter', 3, 'animals', ['squirrel', 'chatter', 'scold', 'tree', 'forest', 'park', 'small', 'animal'], 'Squirrel chattering and scolding angrily from a tree, no music'),
    sfx('seals barking', 4, 'animals', ['seals', 'barking', 'sea', 'lions', 'harbor', 'pier', 'ocean', 'coast'], 'Group of sea lions barking loudly on a harbor pier, no music'),
    sfx('penguins squawking', 4, 'animals', ['penguins', 'squawking', 'colony', 'antarctic', 'birds', 'ice', 'cold', 'flock'], 'Penguin colony squawking and trumpeting, no music'),
    sfx('camel groan', 3, 'animals', ['camel', 'groan', 'desert', 'grumble', 'caravan', 'animal', 'arabian', 'bellow'], 'Camel groaning and grumbling loudly, gurgling bellow, no music'),
    sfx('loon call lake', 4, 'animals', ['loon', 'call', 'lake', 'bird', 'haunting', 'night', 'north', 'wilderness'], 'Common loon calling across a still lake, haunting wavering cry with echo, no music'),
    sfx('moose grunt', 3, 'animals', ['moose', 'grunt', 'bull', 'forest', 'swamp', 'north', 'wild', 'large'], 'Bull moose grunting deeply several times in a forest, no music'),

    // ── SFX: top-up (common narration cues) ──
    sfx('footsteps metal grate', 4, 'topup', ['footsteps', 'metal', 'grate', 'catwalk', 'industrial', 'scifi', 'walk', 'clang'], 'Footsteps walking across a metal grate catwalk, ringing clangs with echo, no music'),
    sfx('footsteps marble hall', 5, 'topup', ['footsteps', 'marble', 'hall', 'echo', 'palace', 'museum', 'walk', 'heels'], 'Hard-soled footsteps walking slowly through a large marble hall with long echo, no music'),
    sfx('footsteps wooden dock running', 4, 'topup', ['footsteps', 'wooden', 'dock', 'running', 'pier', 'planks', 'harbor', 'chase'], 'Running footsteps pounding along a wooden dock, hollow planks with water below, no music'),
    sfx('sneaking creaky floorboards', 5, 'topup', ['sneaking', 'creaky', 'floorboards', 'stealth', 'tiptoe', 'house', 'quiet', 'rogue'], 'Someone sneaking slowly across creaky floorboards, careful steps with small creaks, no music'),
    sfx('horse hooves cobblestone walk', 5, 'topup', ['horse', 'hooves', 'cobblestone', 'walk', 'clop', 'town', 'medieval', 'street'], 'Horse walking slowly on cobblestones, steady clip-clop with echo off buildings, no music'),
    sfx('horse gallop away distant', 5, 'topup', ['horse', 'gallop', 'away', 'distant', 'hooves', 'leaving', 'fade', 'road'], 'Horse galloping away into the distance on a dirt road, hooves fading, no music'),
    sfx('sword drop clatter', 2, 'topup', ['sword', 'drop', 'clatter', 'blade', 'surrender', 'stone', 'metal', 'fall'], 'Sword dropped onto a stone floor with a ringing metallic clatter, no music'),
    sfx('shield drop ground', 2, 'topup', ['shield', 'drop', 'ground', 'wood', 'metal', 'fall', 'thud', 'surrender'], 'Heavy shield dropped onto the ground with a wooden and metal thud and wobble, no music'),
    sfx('helmet falls rolls', 3, 'topup', ['helmet', 'falls', 'rolls', 'metal', 'knight', 'floor', 'clang', 'defeat'], 'Metal helmet falling onto stone and rolling in a circle before settling, no music'),
    sfx('armored body fall', 3, 'topup', ['armored', 'body', 'fall', 'knight', 'death', 'thud', 'metal', 'collapse'], 'Armored knight collapsing to the ground, heavy body thud with clanking plate, no music'),
    sfx('sword break shatter', 2, 'topup', ['sword', 'break', 'shatter', 'blade', 'snap', 'metal', 'broken', 'dnd'], 'Sword blade snapping and shattering with a sharp metallic crack and falling shards, no music'),
    sfx('bowstring snap break', 2, 'topup', ['bowstring', 'snap', 'break', 'bow', 'string', 'fail', 'twang', 'archer'], 'Bowstring snapping with a sharp twang and whipping sound, no music'),
    sfx('arrow quiver draw', 2, 'topup', ['arrow', 'quiver', 'draw', 'archer', 'nock', 'wood', 'rattle', 'ready'], 'Arrow drawn from a quiver with a wooden rattle and nocked onto a bowstring, no music'),
    sfx('map unfold paper', 3, 'topup', ['map', 'unfold', 'paper', 'parchment', 'travel', 'navigate', 'crinkle', 'plan'], 'Large paper map unfolded and spread flat with crinkling and smoothing, no music'),
    sfx('wax seal stamp letter', 3, 'topup', ['wax', 'seal', 'stamp', 'letter', 'royal', 'press', 'official', 'parchment'], 'Hot wax dripped onto a letter and pressed with a metal seal stamp, no music'),
    sfx('parchment burning', 4, 'topup', ['parchment', 'burning', 'paper', 'fire', 'letter', 'destroy', 'crackle', 'flame'], 'Parchment catching fire and burning with crackling paper and soft flame, no music'),
    sfx('book slam shut', 1, 'topup', ['book', 'slam', 'shut', 'heavy', 'tome', 'library', 'thud', 'close'], 'Heavy book slammed shut with a deep thud and dust puff, no music'),
    sfx('spellbook glow hum', 4, 'topup', ['spellbook', 'glow', 'hum', 'magic', 'open', 'arcane', 'book', 'dnd'], 'Spellbook opening and glowing with a rising arcane hum and page shimmer, no music'),
    sfx('crystal ball hum', 4, 'topup', ['crystal', 'ball', 'hum', 'scry', 'fortune', 'magic', 'vision', 'glass'], 'Crystal ball activating with a swirling glassy hum and mystical shimmer, no music'),
    sfx('candle blow out puff', 1, 'topup', ['candle', 'blow', 'out', 'puff', 'extinguish', 'breath', 'dark', 'flame'], 'Candle blown out with a short breath puff and tiny wick hiss, no music'),
    sfx('fireplace poke logs', 4, 'topup', ['fireplace', 'poke', 'logs', 'embers', 'crackle', 'iron', 'hearth', 'cozy'], 'Iron poker shifting burning logs in a fireplace, crackling embers flaring, no music'),
    sfx('door bar drop wood', 2, 'topup', ['door', 'bar', 'drop', 'wood', 'barricade', 'lock', 'heavy', 'secure'], 'Heavy wooden bar dropped into brackets to barricade a door, solid wood thunk, no music'),
    sfx('iron key turn lock', 2, 'topup', ['iron', 'key', 'turn', 'lock', 'door', 'old', 'click', 'dungeon'], 'Large iron key inserted and turned in an old lock with a heavy clunk, no music'),
    sfx('chest lock click open', 2, 'topup', ['chest', 'lock', 'click', 'open', 'treasure', 'latch', 'creak', 'loot'], 'Treasure chest lock clicking open and the lid creaking up, no coins, no music'),
    sfx('rope climbing creak', 5, 'topup', ['rope', 'climbing', 'creak', 'climb', 'strain', 'hands', 'wall', 'effort'], 'Someone climbing a rope, straining fiber creaks and hand grips, no voices, no music'),
    sfx('wooden ladder climb', 4, 'topup', ['wooden', 'ladder', 'climb', 'rungs', 'creak', 'barn', 'loft', 'steps'], 'Climbing a wooden ladder, rungs creaking under each step, no music'),
    sfx('wagon wheel creak slow', 5, 'topup', ['wagon', 'wheel', 'creak', 'slow', 'cart', 'travel', 'wood', 'road'], 'Wagon rolling slowly with a rhythmic creaking wooden wheel and gravel crunch, no music'),
    sfx('cart wheel breaks', 3, 'topup', ['cart', 'wheel', 'breaks', 'snap', 'crash', 'wagon', 'accident', 'wood'], 'Cart wheel snapping off, wood cracking and the cart crashing down with cargo spilling, no music'),
    sfx('well bucket drop splash', 4, 'topup', ['well', 'bucket', 'drop', 'splash', 'water', 'village', 'echo', 'deep'], 'Bucket dropped down a deep stone well, rope unspooling then a distant echoing splash, no music'),
    sfx('well crank chain', 4, 'topup', ['well', 'crank', 'chain', 'winch', 'bucket', 'village', 'rattle', 'raise'], 'Hand crank winding a well chain, rattling links and creaking wooden axle, no music'),
    sfx('coin fountain plop', 2, 'topup', ['coin', 'fountain', 'plop', 'wish', 'water', 'toss', 'drop', 'luck'], 'Coin tossed into a fountain, small ring then a soft plop into water, no music'),
    sfx('stone skipping water', 3, 'topup', ['stone', 'skipping', 'water', 'lake', 'skip', 'splash', 'pond', 'calm'], 'Flat stone skipping across a calm lake, several quick skips then a plop, no music'),
    sfx('ring drop floor', 2, 'topup', ['ring', 'drop', 'floor', 'metal', 'gold', 'bounce', 'spin', 'jewelry'], 'Small metal ring dropped onto a stone floor, bouncing and spinning to a stop, no music'),
    sfx('gem clink place', 1, 'topup', ['gem', 'clink', 'place', 'jewel', 'crystal', 'socket', 'puzzle', 'treasure'], 'Gemstone placed into a stone socket with a crisp crystalline clink, no music'),
    sfx('trap door open drop', 3, 'topup', ['trap', 'door', 'open', 'drop', 'floor', 'fall', 'dungeon', 'surprise'], 'Trapdoor swinging open suddenly with a wooden bang and something dropping through, no music'),
    sfx('spike wall grinding', 5, 'topup', ['spike', 'wall', 'grinding', 'trap', 'dungeon', 'closing', 'stone', 'danger'], 'Spiked stone walls grinding slowly closer, heavy grinding stone with metal spikes scraping, no music'),
    sfx('cage lowering chains', 5, 'topup', ['cage', 'lowering', 'chains', 'prison', 'dungeon', 'winch', 'metal', 'descend'], 'Iron cage lowered on rattling chains and settling with a clang, no music'),
    sfx('gallows trapdoor drop', 2, 'topup', ['gallows', 'trapdoor', 'drop', 'execution', 'rope', 'medieval', 'grim', 'bang'], 'Gallows trapdoor dropping open with a wooden bang and a rope snapping taut, no voices, no music'),
    sfx('tavern crowd laughter', 5, 'topup', ['tavern', 'crowd', 'laughter', 'laugh', 'inn', 'patrons', 'joke', 'group'], 'Tavern crowd bursting into hearty laughter together, mugs thumping, no clear words, no music'),
    sfx('baby dragon chirp', 3, 'topup', ['baby', 'dragon', 'chirp', 'hatchling', 'cute', 'fantasy', 'squeak', 'dnd'], 'Baby dragon hatchling chirping and squeaking curiously with a tiny puff of flame, no music'),
    sfx('kitten mew', 2, 'topup', ['kitten', 'mew', 'cat', 'cute', 'small', 'pet', 'meow', 'tiny'], 'Tiny kitten mewing softly twice, no music'),
    sfx('puppy whimper bark', 3, 'topup', ['puppy', 'whimper', 'bark', 'dog', 'cute', 'pet', 'yip', 'small'], 'Puppy whimpering then giving a small excited yip bark, no music'),
    sfx('wolf attack snarl bite', 3, 'topup', ['wolf', 'attack', 'snarl', 'bite', 'lunge', 'beast', 'teeth', 'danger'], 'Wolf lunging and attacking, vicious snarl with snapping bite, no voices, no music'),
    sfx('bear attack roar maul', 4, 'topup', ['bear', 'attack', 'roar', 'maul', 'charge', 'forest', 'danger', 'beast'], 'Bear charging and roaring in attack with heavy swipes, no voices, no music'),
    sfx('snake strike hiss', 2, 'topup', ['snake', 'strike', 'hiss', 'bite', 'lunge', 'venom', 'danger', 'fast'], 'Snake hissing then striking fast with a sharp lunge, no music'),
    sfx('rats scurrying many', 4, 'topup', ['rats', 'scurrying', 'many', 'sewer', 'squeaks', 'swarm', 'dungeon', 'vermin'], 'Many rats scurrying across a stone floor with squeaks and scratching claws, no music'),
    sfx('vulture screech circling', 3, 'topup', ['vulture', 'screech', 'circling', 'desert', 'death', 'bird', 'carrion', 'wasteland'], 'Vulture screeching while circling overhead in a desert, no music'),
    sfx('fish splash jump', 2, 'topup', ['fish', 'splash', 'jump', 'lake', 'river', 'water', 'leap', 'calm'], 'Fish leaping out of calm water and splashing back down, no music'),
    sfx('whale breach splash', 5, 'topup', ['whale', 'breach', 'splash', 'ocean', 'huge', 'sea', 'crash', 'water'], 'Huge whale breaching and crashing back into the ocean with a massive splash, no music'),
    sfx('crowd children playing medieval', 5, 'topup', ['crowd', 'children', 'playing', 'medieval', 'village', 'kids', 'laughter', 'street'], 'Children playing and laughing in a medieval village street, running feet on dirt, no clear words, no music'),
    sfx('wind chimes gentle', 5, 'topup', ['wind', 'chimes', 'gentle', 'porch', 'breeze', 'peaceful', 'metal', 'tinkle'], 'Gentle metal wind chimes tinkling in a soft breeze, no music'),
    sfx('church bell single toll', 4, 'topup', ['church', 'bell', 'single', 'toll', 'funeral', 'solemn', 'village', 'ring'], 'Single solemn church bell toll with a long fading resonance, no music'),
    sfx('thunder distant single', 5, 'topup', ['thunder', 'distant', 'single', 'rumble', 'storm', 'far', 'approaching', 'weather'], 'Single distant thunder rumble rolling slowly across the sky, no rain, no music'),
    sfx('wind gust door rattle', 4, 'topup', ['wind', 'gust', 'door', 'rattle', 'storm', 'house', 'shutter', 'night'], 'Strong wind gust rattling a door and shutters, howling briefly then easing, no music'),
    sfx('owl hoot night close', 3, 'topup', ['owl', 'hoot', 'night', 'close', 'forest', 'bird', 'dark', 'hooting'], 'Owl hooting twice close by on a still night, no music'),
];

function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeKeywords(keywords) {
    const seen = new Set();
    const normalized = [];
    for (const rawKeyword of keywords || []) {
        const keyword = String(rawKeyword).trim().toLowerCase();
        if (!keyword || seen.has(keyword)) continue;
        seen.add(keyword);
        normalized.push(keyword);
    }
    return normalized;
}

function catalogEntry(sound) {
    return {
        type: sound.type,
        name: sound.name,
        file: `${PREFIX}${sound.filename}`,
        keywords: normalizeKeywords(sound.keywords),
        ...(sound.loop ? { loop: true } : {}),
    };
}

function validateSounds() {
    const errors = [];
    const seenNames = new Set();
    const seenFiles = new Set();

    for (const sound of SOUNDS) {
        for (const requiredKey of ['name', 'filename', 'prompt', 'duration', 'type', 'keywords', 'group']) {
            if (sound[requiredKey] === undefined || sound[requiredKey] === null) {
                errors.push(`${sound.name || '(unnamed)'}: missing ${requiredKey}`);
            }
        }
        if (!['music', 'sfx', 'ambience'].includes(sound.type)) errors.push(`${sound.name}: invalid type ${sound.type}`);
        if (!Number.isFinite(sound.duration) || sound.duration < 0.5 || sound.duration > 30) errors.push(`${sound.name}: invalid duration ${sound.duration}`);
        if (!Array.isArray(sound.keywords) || normalizeKeywords(sound.keywords).length < 8) errors.push(`${sound.name}: expected at least 8 keywords`);
        if (sound.type === 'ambience' && !/ambience$/.test(sound.name)) errors.push(`${sound.name}: ambience names must end with "ambience"`);
        if (!/^[a-z0-9-]+\.mp3$/.test(sound.filename)) errors.push(`${sound.name}: filename must be a lowercase slug mp3`);
        if (seenNames.has(sound.name.toLowerCase())) errors.push(`${sound.name}: duplicate name`);
        if (seenFiles.has(sound.filename.toLowerCase())) errors.push(`${sound.filename}: duplicate filename`);
        seenNames.add(sound.name.toLowerCase());
        seenFiles.add(sound.filename.toLowerCase());
    }

    return errors;
}

async function fetchRemainingCredits() {
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: { 'xi-api-key': API_KEY },
    });
    if (!response.ok) throw new Error(`ElevenLabs subscription ${response.status}`);
    const data = await response.json();
    return Number(data.character_limit) - Number(data.character_count);
}

async function r2Exists(key) {
    try {
        await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        return true;
    } catch {
        return false;
    }
}

async function generateSound(sound) {
    const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: sound.prompt,
            duration_seconds: sound.duration,
            prompt_influence: 0.45,
            loop: Boolean(sound.loop),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`ElevenLabs ${response.status}: ${errorText}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

async function uploadToR2(key, body) {
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000, immutable',
    }));
}

async function writeCatalog(catalogPath, catalogJson, catalog) {
    await writeFile(catalogPath, JSON.stringify({ ...catalogJson, files: catalog }, null, 2) + '\n');
}

async function main() {
    const validationErrors = validateSounds();
    if (validationErrors.length) {
        console.error('Schema validation failed:');
        for (const validationError of validationErrors) console.error(`  - ${validationError}`);
        process.exit(1);
    }

    const selected = GROUP ? SOUNDS.filter((sound) => sound.group === GROUP) : SOUNDS;
    if (!selected.length) {
        console.error(`No sounds in group "${GROUP}". Groups: ${[...new Set(SOUNDS.map((sound) => sound.group))].join(', ')}`);
        process.exit(1);
    }

    const catalogPath = join(process.cwd(), 'public', 'saved-sounds.json');
    const catalogJson = JSON.parse(await readFile(catalogPath, 'utf-8'));
    const catalog = Array.isArray(catalogJson.files) ? catalogJson.files : [];
    const existingNames = new Set(catalog.map((sound) => String(sound.name || '').toLowerCase()));
    const existingFiles = new Set(catalog.map((sound) => String(sound.file || '').toLowerCase()));
    const isCataloged = (sound) => {
        const entry = catalogEntry(sound);
        return existingNames.has(entry.name.toLowerCase()) || existingFiles.has(entry.file.toLowerCase());
    };
    const pending = selected.filter((sound) => !isCataloged(sound)).slice(0, LIMIT);

    const byGroup = {};
    const byType = {};
    let pendingSeconds = 0;
    for (const sound of pending) {
        byGroup[sound.group] = (byGroup[sound.group] || 0) + 1;
        byType[sound.type] = (byType[sound.type] || 0) + 1;
        pendingSeconds += sound.duration;
    }

    console.log(`\nCoverage-gap ElevenLabs batch: ${SOUNDS.length} defined, ${selected.length} selected, ${pending.length} pending`);
    for (const [group, count] of Object.entries(byGroup)) console.log(`  ${group.padEnd(12)} ${count}`);
    for (const [type, count] of Object.entries(byType)) console.log(`  ${type.padEnd(12)} ${count}`);
    console.log(`  pending duration: ${pendingSeconds}s (~${Math.ceil(pendingSeconds / 60)} min)`);
    console.log(`  estimated cost:   ${pendingSeconds * CREDITS_PER_SECOND} credits`);
    console.log(`  existing catalog: ${catalog.length}`);

    if (DRY_RUN) {
        console.log('\n(dry-run - no API calls, no R2 uploads, catalog not touched)');
        return;
    }

    const missingEnvironment = REQUIRED_ENV.filter((name) => !process.env[name]);
    if (missingEnvironment.length) {
        console.error(`Missing required environment variables: ${missingEnvironment.join(', ')}`);
        process.exit(1);
    }

    let remainingCredits = await fetchRemainingCredits();
    console.log(`  credits remaining: ${remainingCredits}\n`);

    let generated = 0;
    let skipped = 0;
    let failed = 0;
    let stoppedForCredits = false;

    for (let index = 0; index < pending.length; index++) {
        const sound = pending[index];
        const entry = catalogEntry(sound);
        const r2Key = entry.file;
        const tag = `[${index + 1}/${pending.length}]`;

        if (await r2Exists(r2Key)) {
            console.log(`${tag} SKIP (R2 exists, cataloged): ${sound.name}`);
            catalog.push(entry);
            skipped++;
            continue;
        }

        const cost = sound.duration * CREDITS_PER_SECOND;
        if (remainingCredits < cost) {
            console.log(`${tag} STOP: ${sound.name} needs ${cost} credits, only ${remainingCredits} remain.`);
            stoppedForCredits = true;
            break;
        }

        try {
            process.stdout.write(`${tag} Generating: ${sound.name} (${sound.duration}s${sound.loop ? ', loop' : ''})...`);
            const audio = await generateSound(sound);
            process.stdout.write(` ${(audio.length / 1024).toFixed(0)}KB...`);
            await uploadToR2(r2Key, audio);
            catalog.push(entry);
            generated++;
            remainingCredits -= cost;
            console.log(' OK');

            if (generated % 10 === 0) {
                await writeCatalog(catalogPath, catalogJson, catalog);
                remainingCredits = await fetchRemainingCredits();
                console.log(`  [checkpoint: ${catalog.length} catalog entries, ${remainingCredits} credits remaining]`);
            }

            await sleep(500);
        } catch (error) {
            failed++;
            console.log(` FAIL: ${error.message}`);
            if (String(error.message).includes('429')) {
                console.log('  Rate limited; waiting before continuing...');
                await sleep(30000);
            }
            if (/quota|credit|insufficient/i.test(String(error.message))) {
                remainingCredits = await fetchRemainingCredits().catch(() => remainingCredits);
            }
        }
    }

    await writeCatalog(catalogPath, catalogJson, catalog);
    remainingCredits = await fetchRemainingCredits().catch(() => remainingCredits);
    console.log(`\nDone: ${generated} generated, ${skipped} skipped, ${failed} failed${stoppedForCredits ? ', stopped for credits' : ''}. Catalog now ${catalog.length} entries. Credits remaining: ${remainingCredits}.`);
    if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
