// ===== SuiteRhythm TRIGGER SYSTEM =====
// Expanded instant keyword triggers mapped to actual sound catalog files
// 300+ trigger words covering all 176 SFX in the library

import { WOLF_NOUNS, DOG_NOUNS, CAT_NOUNS, SNAKE_NOUNS, CREATURE_NOUNS, buildNounVerbGate } from './creature-taxonomy.js';

/**
 * Build the full keyword→sound mapping from the saved-sounds catalog.
 * Returns { keyword: { query, file, volume, category } }
 * Called once after savedSounds loads.
 */
export function buildTriggerMap(savedSounds) {
    const map = {};
    
    // Helper: register a keyword with its sound file and search query
    function add(keyword, query, file, volume = 0.7, category = 'sfx') {
        if (!map[keyword]) {
            map[keyword] = { query, file, volume, category };
        }
    }

    // ===== ANIMALS =====
    // Dogs
    add('bark', 'dog bark', 'sounds/large_dog_barking.mp3', 0.7, 'animal');
    add('barking', 'dog bark', 'sounds/large_dog_barking.mp3', 0.7, 'animal');
    add('woof', 'dog bark', 'sounds/large_dog_barking.mp3', 0.7, 'animal');
    add('dog', 'dog bark', 'sounds/large_dog_barking.mp3', 0.6, 'animal');
    add('puppy', 'dog bark', 'sounds/small_dog_barking.mp3', 0.6, 'animal');
    add('whimper', 'dog whimper', 'sounds/instant/ES_Golden Retriever, Barks, Whimper - Epidemic Sound-instant.mp3', 0.5, 'animal');
    add('whimpering', 'dog whimper', 'sounds/ES_Whimpering, Indoor - Epidemic Sound.mp3', 0.5, 'animal');
    add('howl', 'wolf howl', 'sounds/wolf-howl.mp3', 0.7, 'animal');
    add('howling', 'wolf howl', 'sounds/wolf-howl-moon.mp3', 0.7, 'animal');
    // Cats
    add('meow', 'cat meow', 'sounds/cat-meow.mp3', 0.6, 'animal');
    add('cat', 'cat meow', 'sounds/cat-meow.mp3', 0.5, 'animal');
    add('hiss', 'cat hiss', 'sounds/cat-screech.mp3', 0.6, 'animal');
    add('screech', 'cat screech', 'sounds/cat-screech.mp3', 0.7, 'animal');
    // Wolves
    add('wolf', 'wolf howl', 'sounds/wolf-howl.mp3', 0.7, 'animal');
    add('wolves', 'wolf howl', 'sounds/wolf-howl-moon.mp3', 0.7, 'animal');
    add('growl', 'wolf growl', 'sounds/wolf-growl.mp3', 0.7, 'animal');
    add('growling', 'wolf growl', 'sounds/wolf-growl.mp3', 0.7, 'animal');
    add('snarl', 'wolf growl', 'sounds/wolf-growl.mp3', 0.7, 'animal');
    add('snarling', 'snarling growl', 'sounds/ES_Snarling, Growling 01 - Epidemic Sound.mp3', 0.7, 'creature');
    // Birds
    add('bird', 'bird chirp', 'sounds/instant/bird_whistling_chirping-instant.mp3', 0.5, 'animal');
    add('chirp', 'bird chirp', 'sounds/instant/bird_whistling_chirping-instant.mp3', 0.5, 'animal');
    add('chirping', 'bird chirp', 'sounds/instant/bird_whistling_chirping-instant.mp3', 0.5, 'animal');
    add('tweet', 'bird chirp', 'sounds/instant/bird_whistling_chirping-instant.mp3', 0.5, 'animal');
    add('crow', 'crow caw', 'sounds/crow-call.mp3', 0.6, 'animal');
    add('crows', 'crow caw', 'sounds/crow-call.mp3', 0.6, 'animal');
    add('raven', 'crow caw', 'sounds/crow-call.mp3', 0.6, 'animal');
    add('caw', 'crow caw', 'sounds/crow-call.mp3', 0.6, 'animal');
    add('owl', 'owl hoot', 'sounds/owl-hoot.mp3', 0.6, 'animal');
    add('owls', 'owl hoot', 'sounds/owl-hoot.mp3', 0.6, 'animal');
    add('hoot', 'owl hoot', 'sounds/owl-hoot.mp3', 0.6, 'animal');
    add('rooster', 'rooster crow', 'sounds/rooster-calling-close.mp3', 0.6, 'animal');
    add('cockerel', 'rooster crow', 'sounds/rooster-calling-close.mp3', 0.6, 'animal');
    add('cock-a-doodle', 'rooster crow', 'sounds/rooster-calling-close.mp3', 0.7, 'animal');
    add('chicken', 'chicken cluck', 'sounds/chicken-bawking.mp3', 0.5, 'animal');
    add('cluck', 'chicken cluck', 'sounds/chicken-bawking.mp3', 0.5, 'animal');
    // Farm
    add('cow', 'cow moo', 'sounds/cows-mooing.mp3', 0.5, 'animal');
    add('moo', 'cow moo', 'sounds/cows-mooing.mp3', 0.6, 'animal');
    // Horses
    add('horse', 'horse gallop', 'sounds/horse_galloping.mp3', 0.7, 'animal');
    add('gallop', 'horse gallop', 'sounds/horse_galloping.mp3', 0.7, 'animal');
    add('galloping', 'horse gallop', 'sounds/horse_galloping.mp3', 0.7, 'animal');
    add('trot', 'horse trot', 'sounds/instant/trotting-horse-in-rural-road-instant.mp3', 0.6, 'animal');
    add('trotting', 'horse trot', 'sounds/instant/trotting-horse-in-rural-road-instant.mp3', 0.6, 'animal');
    add('hooves', 'horse gallop', 'sounds/horse_galloping.mp3', 0.6, 'animal');
    add('neigh', 'horse whinny', 'sounds/horse-whinny.mp3', 0.6, 'animal');
    add('whinny', 'horse whinny', 'sounds/horse-whinny.mp3', 0.6, 'animal');
    add('cavalry', 'cavalry gallop', 'sounds/instant/horses_army_calvery_galloping-Jennas-Laptop-instant.mp3', 0.8, 'animal');
    add('charging', 'cavalry gallop', 'sounds/instant/horses_army_calvery_galloping-Jennas-Laptop-instant.mp3', 0.8, 'animal');
    add('charged', 'cavalry gallop', 'sounds/instant/horses_army_calvery_galloping-Jennas-Laptop-instant.mp3', 0.7, 'animal');
    // Big cats / exotic
    add('lion', 'lion roar', 'sounds/ES_Lion Roar LIke, Gugrling - Epidemic Sound.mp3', 0.8, 'animal');
    add('tiger', 'tiger growl', 'sounds/instant/ES_Tiger, Growls, Roars, Several, Intimidated - Epidemic Sound-instant.mp3', 0.8, 'animal');
    add('roar', 'creature roar', 'sounds/ES_Roar - Epidemic Sound v1.mp3', 0.8, 'creature');
    add('roared', 'creature roar', 'sounds/ES_Roar - Epidemic Sound v1.mp3', 0.7, 'creature');

    // ===== CREATURES & MONSTERS =====
    add('monster', 'monster growl', 'sounds/monster-growl.flac', 0.8, 'creature');
    add('beast', 'evil beast', 'sounds/ES_Evil Beast, Growl, Snarl - Epidemic Sound.mp3', 0.8, 'creature');
    add('creature', 'creature roar', 'sounds/instant/ES_Giant Creature, Roaring - Epidemic Sound-instant.mp3', 0.8, 'creature');
    add('dragon', 'dragon growl', 'sounds/dragon_growl.ogg', 0.8, 'creature');
    add('ogre', 'troll growl', 'sounds/ES_Troll, Mad, Growling, Pitchdown -12st 04 - Epidemic Sound.mp3', 0.8, 'creature');
    add('troll', 'troll growl', 'sounds/ES_Troll, Mad, Growling, Pitchdown -12st 04 - Epidemic Sound.mp3', 0.8, 'creature');
    add('orc', 'monster growl', 'sounds/ES_Snarling, Growling 01 - Epidemic Sound.mp3', 0.8, 'creature');
    add('goblin', 'monster growl', 'sounds/monster_breath_growl.mp3', 0.7, 'creature');
    add('demon', 'monster growl', 'sounds/ES_Evil Beast, Growl, Snarl - Epidemic Sound.mp3', 0.8, 'creature');
    add('zombie', 'zombie growl', 'sounds/zombie_growl.mp3', 0.7, 'creature');
    add('zombies', 'zombie group', 'sounds/ES_Creatures, Humanoid, Zombie, Group, Ext Roar, Scream, Shriek - Epidemic Sound.mp3', 0.8, 'creature');
    add('undead', 'zombie growl', 'sounds/monster_zombie_growl.mp3', 0.7, 'creature');
    add('ghost', 'ghost eerie', 'sounds/instant/ES_Something in the Basement - Lennon Hutton-instant.mp3', 0.6, 'creature');
    add('wraith', 'monster vocal', 'sounds/ES_Monster Vocal, Screams 03 - Epidemic Sound.mp3', 0.7, 'creature');
    add('vampire', 'monster breath', 'sounds/monster_breath_growl.mp3', 0.7, 'creature');
    add('werewolf', 'wolf howl', 'sounds/wolf-howl-moon.mp3', 0.8, 'creature');
    add('slurp', 'creature eating', 'sounds/ES_Creature Slurps and eating  02 - Epidemic Sound.mp3', 0.6, 'creature');
    add('devour', 'creature eating', 'sounds/ES_Creature Slurps and eating  02 - Epidemic Sound.mp3', 0.7, 'creature');

    // ===== COMBAT & WEAPONS =====
    add('sword', 'sword clash', 'sounds/instant/swords-fighting-instant.mp3', 0.8, 'combat');
    add('swords', 'swords fighting', 'sounds/instant/swords-fighting-instant.mp3', 0.8, 'combat');
    add('blade', 'sword swing', 'sounds/large-sword-swing.mp3', 0.7, 'combat');
    add('slash', 'sword swing', 'sounds/sword-swing.mp3', 0.7, 'combat');
    add('slashed', 'sword swing', 'sounds/sword-swing.mp3', 0.7, 'combat');
    add('slashing', 'sword swing', 'sounds/sword-swing.mp3', 0.7, 'combat');
    add('swing', 'sword swing', 'sounds/sword-swing.mp3', 0.7, 'combat');
    add('stab', 'sword stab', 'sounds/sword-stab-body-hit.mp3', 0.8, 'combat');
    add('stabbed', 'sword stab', 'sounds/sword-stab-body-hit.mp3', 0.8, 'combat');
    add('stabbing', 'sword stab', 'sounds/sword-stab-body-hit.mp3', 0.8, 'combat');
    add('pierce', 'sword stab', 'sounds/sword-stab-body-hit.mp3', 0.7, 'combat');
    add('unsheath', 'sword unsheath', 'sounds/sword-unsheath.mp3', 0.6, 'combat');
    add('drew', 'draw sword', 'sounds/draw-sword.mp3', 0.6, 'combat');
    add('drawn', 'draw sword', 'sounds/draw-sword.mp3', 0.6, 'combat');
    add('sheath', 'sword sheath', 'sounds/sword-sheath.mp3', 0.5, 'combat');
    add('sharpen', 'sword sharpen', 'sounds/sword-sharpen.m4a', 0.5, 'combat');
    add('parry', 'sword block', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.7, 'combat');
    add('block', 'shield block', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.6, 'combat');
    add('clang', 'metal impact', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.7, 'combat');
    add('clash', 'swords clash', 'sounds/instant/swords-fighting-instant.mp3', 0.8, 'combat');
    add('duel', 'sword fight', 'sounds/instant/ES_Sword Fight, 1v1, Longsword, Medieval Warriors, Knights, In Armor, Schoeps (MS) - Epidemic Sound-instant.mp3', 0.8, 'combat');
    add('fight', 'sword fight', 'sounds/instant/ES_Sword Fight, 1v1, Longsword, Medieval Warriors, Knights, In Armor, Schoeps (MS) - Epidemic Sound-instant.mp3', 0.7, 'combat');
    add('battle', 'battle', 'sounds/instant/ES_Medieval Battlefield, Medium Group, Sword Impacts, Screams, Grunts - Epidemic Sound-instant.mp3', 0.8, 'combat');
    add('war', 'medieval war', 'sounds/instant/ES_Medieval, War, Battle, Armors, Shields, Arrows, Swords Layer - Epidemic Sound-instant.mp3', 0.8, 'combat');
    add('army', 'medieval battle', 'sounds/instant/ES_Medieval, War, Battle, Many Swords, Layer - Epidemic Sound-instant.mp3', 0.8, 'combat');
    // Ranged
    add('arrow', 'arrow shot', 'sounds/bow_shot.mp3', 0.7, 'combat');
    add('bow', 'bow shot', 'sounds/bow_shot.mp3', 0.7, 'combat');
    add('twang', 'bow twang', 'sounds/bow_shot.mp3', 0.6, 'combat');
    add('shoot', 'bow shot', 'sounds/bow_shot.mp3', 0.7, 'combat');
    add('crossbow', 'crossbow shot', 'sounds/bow_shot.mp3', 0.7, 'combat');
    add('musket', 'musket shot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    // Gunfire
    add('gunshot', 'gunshot', 'sounds/gun-shot.mp3', 0.9, 'combat');
    add('gun', 'gunshot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    add('pistol', 'gunshot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    add('rifle', 'gunshot distant', 'sounds/gunshot-distant.mp3', 0.8, 'combat');
    add('shot', 'gunshot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    add('fired', 'gunshot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    add('shooting', 'gunshot', 'sounds/gun-shot.mp3', 0.8, 'combat');
    add('bullet', 'bullet whiz', 'sounds/bullet-or-arrow-nearmiss.mp3', 0.7, 'combat');
    // Impacts
    add('struck', 'sword clash', 'sounds/instant/swords-fighting-instant.mp3', 0.7, 'combat');
    add('punch', 'punch impact', 'sounds/punch_2.mp3', 0.7, 'combat');
    add('hit', 'punch', 'sounds/punch.mp3', 0.7, 'combat');
    add('smack', 'punch', 'sounds/punch.mp3', 0.7, 'combat');

    // ===== EXPLOSIONS & IMPACTS =====
    add('bang', 'gunshot explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('explosion', 'big explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('explode', 'big explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('exploded', 'big explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('exploding', 'big explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('boom', 'explosion boom', 'sounds/ES_Boom, Distant Explosion 01 - Epidemic Sound v3.mp3', 0.9, 'explosion');
    add('blast', 'cannon blast', 'sounds/ES_Explosion, Real, Cannon Blast, Airy - Epidemic Sound v1.mp3', 0.9, 'explosion');
    add('cannon', 'cannon blast', 'sounds/ES_Explosion, Real, Cannon Blast, Airy - Epidemic Sound v1.mp3', 0.9, 'explosion');
    add('dynamite', 'explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('bomb', 'explosion', 'sounds/big_explosion.mp3', 0.9, 'explosion');
    add('fireball', 'magic fireball', 'sounds/magic_fireball.mp3', 0.8, 'explosion');
    add('crash', 'glass crash', 'sounds/glass-shatter.mp3', 0.8, 'impact');
    add('shatter', 'glass shatter', 'sounds/glass-shatter.mp3', 0.8, 'impact');
    add('smash', 'glass shatter', 'sounds/glass-shatter.mp3', 0.8, 'impact');
    add('thud', 'heavy thud', 'sounds/thud.mp3', 0.7, 'impact');
    add('thump', 'heavy thud', 'sounds/thud.mp3', 0.7, 'impact');
    add('slam', 'door slam', 'sounds/thud.mp3', 0.7, 'impact');
    add('impact', 'dark impact', 'sounds/ES_Impact, Dark, Cinematic, Low, Explosive - Epidemic Sound.mp3', 0.8, 'impact');
    add('cinematic', 'cinematic impact', 'sounds/ES_Impact, Dark, Cinematic, Low, Explosive - Epidemic Sound.mp3', 0.7, 'impact');
    add('timber', 'tree falling', 'sounds/tree-falling-down.mp3', 0.8, 'impact');
    add('collapse', 'tree falling', 'sounds/tree-falling-down.mp3', 0.8, 'impact');

    // ===== MAGIC & SPELLS =====
    add('spell', 'magic spell', 'sounds/magic-spell.mp3', 0.7, 'magic');
    add('magic', 'magic spell', 'sounds/magic-spell.mp3', 0.7, 'magic');
    add('cast', 'magic spell', 'sounds/magic-spell.mp3', 0.7, 'magic');
    add('casting', 'magic spell', 'sounds/magic-spell.mp3', 0.7, 'magic');
    add('enchant', 'magic spell', 'sounds/magic-spell.mp3', 0.6, 'magic');
    add('heal', 'magic heal', 'sounds/magic-heal.mp3', 0.6, 'magic');
    add('healing', 'magic heal', 'sounds/magic-heal.mp3', 0.6, 'magic');
    add('missile', 'magic missile', 'sounds/magic-missiles.mp3', 0.7, 'magic');
    add('poof', 'poof magic', 'sounds/poof.mp3', 0.6, 'magic');
    add('vanish', 'poof', 'sounds/poof.mp3', 0.6, 'magic');
    add('vanished', 'poof', 'sounds/poof.mp3', 0.6, 'magic');
    add('vanishing', 'poof', 'sounds/poof.mp3', 0.6, 'magic');
    add('disappear', 'poof', 'sounds/poof.mp3', 0.6, 'magic');
    add('wizard', 'magic spell', 'sounds/magic-spell.mp3', 0.6, 'magic');

    // ===== WEATHER =====
    add('thunder', 'thunder storm', 'sounds/instant/thunder_storm-instant.mp3', 0.8, 'weather');
    add('thunderstorm', 'thunder storm', 'sounds/instant/thunder_storm-instant.mp3', 0.8, 'weather');
    add('lightning', 'lightning strike', 'sounds/instant/freesound_community-quick-lightning-strike-29683-instant.mp3', 0.8, 'weather');
    add('rain', 'rain', 'sounds/instant/light_rain_shower-instant.mp3', 0.5, 'weather');
    add('raining', 'rain', 'sounds/instant/rain-on-windows-interior-instant.mp3', 0.5, 'weather');
    add('drizzle', 'light rain', 'sounds/instant/light_rain_shower-instant.mp3', 0.4, 'weather');
    add('storm', 'thunder storm', 'sounds/instant/thunder_storm-instant.mp3', 0.7, 'weather');
    add('wind', 'wind', 'sounds/instant/wind_windy-instant.mp3', 0.5, 'weather');
    add('windy', 'wind', 'sounds/instant/wind_windy-instant.mp3', 0.5, 'weather');
    add('breeze', 'wind', 'sounds/instant/wind_windy-instant.mp3', 0.4, 'weather');
    add('gust', 'wind howl', 'sounds/instant/wind_howl-instant.mp3', 0.6, 'weather');
    add('blizzard', 'wind howl', 'sounds/instant/wind_howl-instant.mp3', 0.7, 'weather');
    add('whoosh', 'wind whoosh', 'sounds/whoosh.flac', 0.6, 'weather');

    // ===== FIRE =====
    add('fire', 'fire crackling', 'sounds/campfire_ambient.mp3', 0.5, 'fire');
    add('fireplace', 'fireplace', 'sounds/campfire_ambient.mp3', 0.5, 'fire');
    add('campfire', 'campfire', 'sounds/campfire_ambient.mp3', 0.5, 'fire');
    add('crackling', 'fire crackling', 'sounds/campfire_ambient.mp3', 0.5, 'fire');
    add('ember', 'fire ember', 'sounds/campfire_ambient.mp3', 0.4, 'fire');
    add('flame', 'flames', 'sounds/ES_Flame, Fireball, Fast x4 - Epidemic Sound.mp3', 0.7, 'fire');
    add('flames', 'large fire', 'sounds/instant/ES_Flames, Large, Movement 01 - Epidemic Sound-instant.mp3', 0.7, 'fire');
    add('inferno', 'large fire', 'sounds/ES_Textures, Large Fire, Inferno, Winds, Continuously On Fire - Epidemic Sound.mp3', 0.8, 'fire');
    add('blaze', 'large fire', 'sounds/ES_Textures, Large Fire, Inferno, Winds, Continuously On Fire - Epidemic Sound.mp3', 0.7, 'fire');
    add('burning', 'fire crackling', 'sounds/campfire_ambient.mp3', 0.6, 'fire');
    add('burned', 'fire crackling', 'sounds/campfire_ambient.mp3', 0.5, 'fire');
    add('torch', 'fire', 'sounds/instant/fireplace-instant.mp3', 0.5, 'fire');
    add('fireworks', 'fireworks', 'sounds/instant/fireworks_display-instant.mp3', 0.7, 'fire');

    // ===== WATER =====
    add('splash', 'water splash', 'sounds/instant/footsteps_water-instant.mp3', 0.6, 'water');
    add('water', 'water flowing', 'sounds/instant/ES_Water Flowing, Small Stream 01 - Epidemic Sound-instant.mp3', 0.4, 'water');
    add('stream', 'stream water', 'sounds/instant/stream-water-instant.mp3', 0.4, 'water');
    add('river', 'river flowing', 'sounds/instant/ES_River, Small, Distant Waterfall 02 - Epidemic Sound-instant.mp3', 0.4, 'water');
    add('waterfall', 'waterfall', 'sounds/instant/ES_River, Small, Distant Waterfall 02 - Epidemic Sound-instant.mp3', 0.5, 'water');
    add('waves', 'waves shore', 'sounds/instant/waves-sea-shore-instant.mp3', 0.5, 'water');
    add('ocean', 'waves shore', 'sounds/instant/waves-sea-shore-instant.mp3', 0.5, 'water');
    add('sea', 'waves shore', 'sounds/instant/waves-sea-shore-instant.mp3', 0.5, 'water');
    add('drip', 'water drip', 'sounds/instant/dragon-studio-water-dripping-364450-instant.mp3', 0.5, 'water');

    // ===== FOOTSTEPS & MOVEMENT =====
    add('footstep', 'footsteps', 'sounds/instant/footsteps_daytime_hike-instant.mp3', 0.6, 'movement');
    add('footsteps', 'footsteps', 'sounds/instant/footsteps_daytime_hike-instant.mp3', 0.6, 'movement');
    add('walking', 'footsteps', 'sounds/ES_Hardwood, Boots, Walking By 02 - Epidemic Sound.mp3', 0.5, 'movement');
    add('walked', 'footsteps', 'sounds/instant/footsteps_daytime_hike-instant.mp3', 0.5, 'movement');
    add('steps', 'footsteps', 'sounds/instant/footsteps_daytime_hike-instant.mp3', 0.5, 'movement');
    add('crept', 'footsteps slow', 'sounds/footsteps_grass.mp3', 0.4, 'movement');
    add('sneak', 'sneaking footsteps', 'sounds/footsteps_grass.mp3', 0.4, 'movement');
    add('sneaking', 'sneaking footsteps', 'sounds/footsteps_grass.mp3', 0.4, 'movement');
    add('running', 'running', 'sounds/ES_Gravel, Sneaker, Running 01 - Epidemic Sound.mp3', 0.6, 'movement');
    add('ran', 'running', 'sounds/ES_Gravel, Sneaker, Running 01 - Epidemic Sound.mp3', 0.6, 'movement');
    add('run', 'running', 'sounds/ES_Running, Panting, Outdoors - Epidemic Sound.mp3', 0.6, 'movement');
    add('chase', 'running', 'sounds/ES_Running, Panting, Outdoors - Epidemic Sound.mp3', 0.7, 'movement');
    add('chased', 'running', 'sounds/ES_Running, Panting, Outdoors - Epidemic Sound.mp3', 0.7, 'movement');
    add('heels', 'heels walking', 'sounds/instant/ES_Hardwood, Female, Heels, Walk 03 - Epidemic Sound-instant.mp3', 0.5, 'movement');
    add('boots', 'boots walking', 'sounds/ES_Hardwood, Boots, Walking By 02 - Epidemic Sound.mp3', 0.5, 'movement');
    add('stairs', 'footsteps stairs', 'sounds/instant/footsteps_wood_stairs-instant.mp3', 0.5, 'movement');
    add('gravel', 'footsteps gravel', 'sounds/instant/ES_Walk On Gravel - Epidemic Sound-instant.mp3', 0.5, 'movement');
    add('leaves', 'footsteps leaves', 'sounds/instant/footsteps_leaves-instant.mp3', 0.5, 'movement');
    add('snow', 'footsteps snow', 'sounds/footsteps_snow.mp3', 0.5, 'movement');
    add('sand', 'footsteps sand', 'sounds/footsteps_sand.mp3', 0.5, 'movement');
    add('grass', 'footsteps grass', 'sounds/footsteps_grass.mp3', 0.5, 'movement');

    // ===== DOORS & BUILDINGS =====
    add('knock', 'door knock', 'sounds/ES_Thick Wood Front Door, Knock Variations 07 - Epidemic Sound.mp3', 0.7, 'door');
    add('knocked', 'door knock', 'sounds/ES_Thick Wood Front Door, Knock Variations 07 - Epidemic Sound.mp3', 0.7, 'door');
    add('knocking', 'door knock', 'sounds/ES_Thick Wood Front Door, Knock Variations 07 - Epidemic Sound.mp3', 0.7, 'door');
    add('knocks', 'door knock', 'sounds/ES_Thick Wood Front Door, Knock Variations 07 - Epidemic Sound.mp3', 0.7, 'door');
    add('door', 'door creak', 'sounds/instant/ES_Wood, 50\'s Gallery Open, Shut - Epidemic Sound-instant.mp3', 0.6, 'door');
    add('creak', 'door creak', 'sounds/instant/ES_Wood, 50\'s Gallery Open, Shut - Epidemic Sound-instant.mp3', 0.6, 'door');
    add('creaking', 'door creak', 'sounds/instant/ES_Wood, 50\'s Gallery Open, Shut - Epidemic Sound-instant.mp3', 0.6, 'door');
    add('gate', 'door creak', 'sounds/instant/ES_Wood, 50\'s Gallery Open, Shut - Epidemic Sound-instant.mp3', 0.6, 'door');
    // Bell
    add('bell', 'bell chime', 'sounds/ding_shop-bell.mp3', 0.6, 'door');
    add('ding', 'bell ding', 'sounds/ding_shop-bell-v2.mp3', 0.6, 'door');
    add('doorbell', 'bell ding', 'sounds/ding_shop-bell.mp3', 0.6, 'door');
    add('elevator', 'elevator chime', 'sounds/elevator-chime.mp3', 0.5, 'door');

    // ===== HUMAN SOUNDS =====
    add('scream', 'scream', 'sounds/woman_scream.mp3', 0.7, 'human');
    add('screamed', 'scream', 'sounds/woman_scream.mp3', 0.7, 'human');
    add('screaming', 'scream', 'sounds/woman_scream.mp3', 0.7, 'human');
    add('shriek', 'scream', 'sounds/woman_scream.mp3', 0.7, 'human');
    add('yell', 'scream', 'sounds/woman_scream.mp3', 0.7, 'human');
    add('wail', 'wail scream', 'sounds/woman_scream.mp3', 0.6, 'human');
    add('moan', 'creature moan', 'sounds/monster_breath_growl.mp3', 0.5, 'human');
    add('groan', 'creature groan', 'sounds/monster_breath_growl.mp3', 0.5, 'human');
    add('laugh', 'laugh', 'sounds/ES_Toddler, Male, 15 Months, Laugh - Epidemic Sound.mp3', 0.7, 'human');
    add('laughing', 'laugh', 'sounds/ES_Toddler, Male, 15 Months, Laugh - Epidemic Sound.mp3', 0.7, 'human');
    add('giggle', 'laugh', 'sounds/ES_Toddler, Male, 15 Months, Laugh - Epidemic Sound.mp3', 0.6, 'human');
    add('baby', 'baby crying', 'sounds/instant/ES_Newborn, Maternity Ward, Baby Crying - Epidemic Sound-instant.mp3', 0.6, 'human');
    add('crying', 'baby crying', 'sounds/instant/ES_Newborn, Maternity Ward, Baby Crying - Epidemic Sound-instant.mp3', 0.6, 'human');
    add('cry', 'baby crying', 'sounds/instant/ES_Newborn, Maternity Ward, Baby Crying - Epidemic Sound-instant.mp3', 0.5, 'human');
    add('breathing', 'heavy breathing', 'sounds/heavy-breathing.mp3', 0.5, 'human');
    add('breath', 'heavy breathing', 'sounds/heavy-breathing.mp3', 0.5, 'human');
    add('panting', 'heavy breathing', 'sounds/heavy-breathing.mp3', 0.5, 'human');
    add('heartbeat', 'heartbeat', 'sounds/instant/heart_beat-instant.mp3', 0.6, 'human');
    add('heart', 'heartbeat', 'sounds/instant/heart_beat-instant.mp3', 0.5, 'human');
    add('whisper', 'whisper breath', 'sounds/instant/ES_Static Breath - Lennon Hutton-instant.mp3', 0.5, 'human');
    add('writing', 'pencil writing', 'sounds/pencil_writing.mp3', 0.4, 'human');
    add('pencil', 'pencil writing', 'sounds/pencil_writing.mp3', 0.4, 'human');

    // ===== CROWDS & CELEBRATIONS =====
    add('applause', 'applause', 'sounds/instant/modern_crowd_cheering-instant.mp3', 0.7, 'crowd');
    add('clap', 'applause', 'sounds/instant/modern_crowd_cheering-instant.mp3', 0.7, 'crowd');
    add('clapping', 'applause', 'sounds/instant/modern_crowd_cheering-instant.mp3', 0.7, 'crowd');
    add('cheer', 'crowd cheering', 'sounds/instant/modern_crowd_cheering-instant.mp3', 0.7, 'crowd');
    add('cheering', 'crowd cheering', 'sounds/instant/modern_crowd_cheering-instant.mp3', 0.7, 'crowd');
    add('hooray', 'crowd cheering', 'sounds/instant/ES_Wohoo, Yay, 7 People 02 - Epidemic Sound-instant.mp3', 0.7, 'crowd');
    add('yay', 'crowd yay', 'sounds/instant/ES_Wohoo, Yay, 7 People 02 - Epidemic Sound-instant.mp3', 0.7, 'crowd');
    add('crowd', 'crowd', 'sounds/instant/ES_Concert Crowd, Stadium, Large, Interior, Long Swell, Call To Encore, The Forum Stadium, Applause - Epidemic Sound-instant.mp3', 0.6, 'crowd');
    add('audience', 'crowd', 'sounds/instant/ES_Concert Crowd, Stadium, Large, Interior, Long Swell, Call To Encore, The Forum Stadium, Applause - Epidemic Sound-instant.mp3', 0.6, 'crowd');
    add('stadium', 'crowd stadium', 'sounds/instant/ES_Concert Crowd, Stadium, Large, Interior, Long Swell, Call To Encore, The Forum Stadium, Applause - Epidemic Sound-instant.mp3', 0.7, 'crowd');
    add('concert', 'concert', 'sounds/instant/ES_Concert, Girls, Teenagers, Squealing, Artist Enters, Bell Centre, Montreal, Canada - Epidemic Sound-instant.mp3', 0.6, 'crowd');
    add('children', 'children', 'sounds/instant/ES_Suburban Kids - Marc Torch-instant.mp3', 0.5, 'crowd');
    add('kids', 'kids', 'sounds/instant/ES_Suburban Kids - Marc Torch-instant.mp3', 0.5, 'crowd');

    // ===== VEHICLES & TRANSPORT =====
    add('car', 'car engine', 'sounds/car-engine-start.mp3', 0.6, 'vehicle');
    add('engine', 'car engine', 'sounds/car-engine-start.mp3', 0.6, 'vehicle');
    add('train', 'train passing', 'sounds/train-passing-by.mp3', 0.6, 'vehicle');
    add('ship', 'ship horn', 'sounds/ES_Ships Whistle -horn- Three Blasts - Epidemic Sound.mp3', 0.7, 'vehicle');
    add('boat', 'boat floating', 'sounds/wood-ship-boat-floating-sounds.mp3', 0.5, 'vehicle');
    add('pirate', 'pirate ship', 'sounds/pirate-ship-floating-noise.mp3', 0.5, 'vehicle');
    add('horn', 'ship horn', 'sounds/ES_Ships Whistle -horn- Three Blasts - Epidemic Sound.mp3', 0.7, 'vehicle');
    add('sailing', 'ship floating', 'sounds/pirate-ship-floating-noise.mp3', 0.5, 'vehicle');

    // ===== EMERGENCY VEHICLES & SIRENS =====
    // Only files present in the shipped catalog; tests/trigger-map-files.test.js
    // enforces this so a keyword can never point at a missing file again.
    add('siren', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('sirens', 'police siren', 'sounds/police-siren-pass.mp3', 0.6, 'vehicle');
    add('police', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('cop', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('cops', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('cruiser', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('patrol', 'police siren', 'sounds/police-siren-pass.mp3', 0.7, 'vehicle');
    add('ambulance', 'ambulance siren', 'sounds/ambulance-siren-pass.mp3', 0.75, 'vehicle');
    add('paramedic', 'ambulance siren', 'sounds/ambulance-siren-pass.mp3', 0.75, 'vehicle');
    add('medic', 'ambulance siren', 'sounds/ambulance-siren-pass.mp3', 0.7, 'vehicle');
    add('ems', 'ambulance siren', 'sounds/ambulance-siren-pass.mp3', 0.75, 'vehicle');
    add('firetruck', 'police siren', 'sounds/police-siren-pass.mp3', 0.75, 'vehicle');
    add('firefighter', 'police siren', 'sounds/police-siren-pass.mp3', 0.7, 'vehicle');
    add('klaxon', 'alarm siren', 'sounds/sci-fi-alarm-siren.mp3', 0.75, 'vehicle');
    add('evacuation', 'alarm siren', 'sounds/sci-fi-alarm-siren.mp3', 0.7, 'vehicle');
    add('tornado', 'wind howl', 'sounds/wind_howl.mp3', 0.8, 'weather');
    add('twister', 'wind howl', 'sounds/wind_howl.mp3', 0.75, 'weather');
    add('cyclone', 'wind howl', 'sounds/wind_howl.mp3', 0.75, 'weather');
    add('dispatch', 'radio static', 'sounds/radio-static.mp3', 0.6, 'vehicle');
    add('dispatcher', 'radio static', 'sounds/radio-static.mp3', 0.6, 'vehicle');
    add('squelch', 'radio static', 'sounds/radio-static.mp3', 0.6, 'vehicle');
    add('scanner', 'radio static', 'sounds/radio-static.mp3', 0.55, 'vehicle');
    add('honk', 'car horn', 'sounds/car-horn-double-honk.mp3', 0.7, 'vehicle');
    add('honking', 'car horn', 'sounds/car-horn-double-honk.mp3', 0.7, 'vehicle');
    add('beep', 'car horn', 'sounds/car-horn-double-honk.mp3', 0.6, 'vehicle');
    add('doppler', 'police siren', 'sounds/police-siren-pass.mp3', 0.7, 'vehicle');

    // ===== HOUSEHOLD & MISC =====
    add('clock', 'tick tock', 'sounds/tick-tock.mp3', 0.5, 'misc');
    add('tick', 'tick tock', 'sounds/tick-tock.mp3', 0.5, 'misc');
    add('ticking', 'tick tock', 'sounds/tick-tock.mp3', 0.5, 'misc');
    add('alarm', 'alarm clock', 'sounds/alarm-clock.mp3', 0.7, 'misc');
    add('phone', 'phone ring', 'sounds/instant/phone-ring-instant.mp3', 0.6, 'misc');
    add('ringing', 'phone ring', 'sounds/instant/phone-ring-instant.mp3', 0.6, 'misc');
    add('telephone', 'phone ring', 'sounds/instant/phone-ring-instant.mp3', 0.6, 'misc');
    add('anvil', 'anvil strike', 'sounds/anvil-being-struck.mp3', 0.7, 'misc');
    add('hammer', 'anvil strike', 'sounds/anvil-being-struck.mp3', 0.7, 'misc');
    add('forge', 'anvil strike', 'sounds/anvil-being-struck.mp3', 0.6, 'misc');
    add('coin', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.5, 'misc');
    add('coins', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.5, 'misc');
    add('gold', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.5, 'misc');
    add('treasure', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.5, 'misc');
    add('money', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.5, 'misc');
    add('chain', 'chain rattle', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.6, 'misc');
    add('chains', 'chain rattle', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.6, 'misc');
    add('static', 'radio static', 'sounds/instant/radio-static-instant.mp3', 0.5, 'misc');
    add('radio', 'radio static', 'sounds/instant/radio-static-instant.mp3', 0.5, 'misc');
    add('rewind', 'tape rewind', 'sounds/rewind.mp3', 0.5, 'misc');
    add('flatline', 'heart monitor', 'sounds/instant/heart-beep-monitor_dieing-long-beep-instant.mp3', 0.6, 'misc');
    add('monitor', 'heart monitor', 'sounds/instant/heart-beep-monitor_dieing-long-beep-instant.mp3', 0.5, 'misc');
    add('hospital', 'heart monitor', 'sounds/instant/heart-beep-monitor_dieing-long-beep-instant.mp3', 0.5, 'misc');

    // ===== NATURE & AMBIENCE =====
    add('cricket', 'crickets', 'sounds/instant/ES_Campfire, Night, Wood Burning Medium, Crickets In Background - Epidemic Sound-instant.mp3', 0.4, 'nature');
    add('crickets', 'crickets', 'sounds/instant/ES_Campfire, Night, Wood Burning Medium, Crickets In Background - Epidemic Sound-instant.mp3', 0.4, 'nature');
    add('chimes', 'wind chimes', 'sounds/instant/wind-chimes-instant.mp3', 0.4, 'nature');
    add('tree', 'tree falling', 'sounds/tree-falling-down.mp3', 0.6, 'nature');

    // ===== HORROR =====
    add('scratch', 'scratching window', 'sounds/scratching-window.mp3', 0.6, 'horror');
    add('scratching', 'scratching window', 'sounds/scratching-window.mp3', 0.6, 'horror');
    add('rattle', 'chain rattle', 'sounds/ES_Metal Impact, Block, Parry, Sword Fight, Ring Out 01 - Epidemic Sound.mp3', 0.5, 'horror');
    add('basement', 'something basement', 'sounds/instant/ES_Something in the Basement - Lennon Hutton-instant.mp3', 0.6, 'horror');
    add('cellar', 'something basement', 'sounds/instant/ES_Something in the Basement - Lennon Hutton-instant.mp3', 0.6, 'horror');
    add('sewer', 'sewer', 'sounds/instant/ES_Trapped in the Sewers - Experia-instant.mp3', 0.6, 'horror');
    add('sewers', 'sewer', 'sounds/instant/ES_Trapped in the Sewers - Experia-instant.mp3', 0.6, 'horror');
    add('eerie', 'ringing ears', 'sounds/ringing-in-the-ears.mp3', 0.5, 'horror');
    add('tinnitus', 'ringing ears', 'sounds/ringing-in-the-ears.mp3', 0.5, 'horror');
    add('scuba', 'scuba breathing', 'sounds/instant/ES_Scuba Mask, Breathing, Oxygen Tank - Epidemic Sound-instant.mp3', 0.5, 'horror');

    // ===== CHRISTMAS =====
    add('jingle', 'sleigh bells', 'sounds/humordome-sleigh-bell-chime-451411.mp3', 0.7, 'christmas');
    add('sleigh', 'sleigh bells', 'sounds/humordome-sleigh-bell-chime-451411.mp3', 0.7, 'christmas');
    add('reindeer', 'sleigh bells', 'sounds/humordome-sleigh-bell-chime-451411.mp3', 0.6, 'christmas');
    add('present', 'bell chime', 'sounds/ding_shop-bell.mp3', 0.5, 'christmas');

    // ===== HALLOWEEN =====
    add('cackle', 'witch cackle', 'sounds/richardmultimedia-spooky-wizard-laugh-01-253266.mp3', 0.75, 'halloween');
    add('cackling', 'witch cackle', 'sounds/richardmultimedia-spooky-wizard-laugh-01-253266.mp3', 0.75, 'halloween');
    add('witch', 'witch cackle', 'sounds/richardmultimedia-spooky-wizard-laugh-01-253266.mp3', 0.7, 'halloween');
    add('maniacal', 'evil laugh', 'sounds/evil-villain-laugh.mp3', 0.75, 'halloween');
    add('villain', 'evil laugh', 'sounds/evil-villain-laugh.mp3', 0.7, 'halloween');
    add('boo', 'ghost whisper', 'sounds/instant/ES_Static Breath - Lennon Hutton-instant.mp3', 0.5, 'halloween');
    add('spooky', 'eerie', 'sounds/instant/ES_Something in the Basement - Lennon Hutton-instant.mp3', 0.5, 'halloween');
    add('skeleton', 'bone crack', 'sounds/bone-crack.mp3', 0.65, 'halloween');
    add('bone', 'bone crack', 'sounds/bone-crack.mp3', 0.7, 'halloween');
    add('bones', 'bone crack', 'sounds/bone-crack.mp3', 0.7, 'halloween');
    add('bat', 'bat flutter', 'sounds/whoosh.flac', 0.5, 'halloween');

    // ===== NAUTICAL =====
    add('anchor', 'anchor chain drop', 'sounds/pirate-ship-floating-noise.mp3', 0.6, 'nautical');
    add('captain', 'ship horn', 'sounds/ES_Ships Whistle -horn- Three Blasts - Epidemic Sound.mp3', 0.5, 'nautical');
    add('ahoy', 'ship horn', 'sounds/ES_Ships Whistle -horn- Three Blasts - Epidemic Sound.mp3', 0.6, 'nautical');

    // ===== D&D FLAVOR =====
    add('tavern', 'tavern crowd chatter', 'sounds/instant/pirate-tavern-croud-instant.mp3', 0.5, 'dnd');
    add('dungeon', 'cave dungeon drip', 'sounds/dragon-studio-droplets-in-a-cave-482871.mp3', 0.5, 'dnd');
    add('cave', 'cave ambience', 'sounds/dragon-studio-droplets-in-a-cave-482871.mp3', 0.5, 'dnd');
    add('potion', 'magic heal', 'sounds/magic-heal.mp3', 0.5, 'dnd');
    add('scroll', 'magic spell', 'sounds/magic-spell.mp3', 0.5, 'dnd');
    add('dice', 'coin clink', 'sounds/coin-clink_drop_gold_collect.mp3', 0.4, 'dnd');

    return map;
}

const CONTEXT_REQUIRED = {
    dog: buildNounVerbGate(DOG_NOUNS, 'bark(?:s|ed|ing)?|woof|growl(?:s|ed|ing)?|howl(?:s|ed|ing)?|whimper(?:ing)?'),
    // "bark"/"howl"/"growl"/"snarl"/"hiss"/"screech"/"roar" are otherwise
    // self-defeating gates: their category rule (CATEGORY_CONTEXT_RULES.animal
    // /.creature) lists the same word, so the "evidence" check was trivially
    // satisfied by the keyword's own presence — e.g. "tree bark" or "the
    // chainsaw roared" would fire a dog-bark/creature-roar sound with zero
    // actual animal/creature context. Require a real noun pairing instead,
    // drawn from the shared canonical noun groups in creature-taxonomy.js.
    bark: buildNounVerbGate(DOG_NOUNS, 'bark(?:s|ed|ing)?'),
    barking: buildNounVerbGate(DOG_NOUNS, 'bark(?:s|ed|ing)?'),
    howl: buildNounVerbGate(WOLF_NOUNS, 'howl(?:s|ed|ing)?'),
    howling: buildNounVerbGate(WOLF_NOUNS, 'howl(?:s|ed|ing)?'),
    growl: buildNounVerbGate([...WOLF_NOUNS, ...CREATURE_NOUNS], 'growl(?:s|ed|ing)?'),
    growling: buildNounVerbGate([...WOLF_NOUNS, ...CREATURE_NOUNS], 'growl(?:s|ed|ing)?'),
    snarl: buildNounVerbGate([...WOLF_NOUNS, ...CREATURE_NOUNS], 'snarl(?:s|ed|ing)?'),
    snarling: buildNounVerbGate([...WOLF_NOUNS, ...CREATURE_NOUNS], 'snarl(?:s|ed|ing)?'),
    hiss: buildNounVerbGate([...CAT_NOUNS, ...SNAKE_NOUNS], 'hiss(?:es|ed|ing)?'),
    hissing: buildNounVerbGate([...CAT_NOUNS, ...SNAKE_NOUNS], 'hiss(?:es|ed|ing)?'),
    screech: buildNounVerbGate(CAT_NOUNS, 'screech(?:es|ed|ing)?'),
    roar: buildNounVerbGate(CREATURE_NOUNS, 'roar(?:s|ed|ing)?'),
    roared: buildNounVerbGate(CREATURE_NOUNS, 'roar(?:s|ed|ing)?'),
    puppy: buildNounVerbGate(DOG_NOUNS, 'bark(?:s|ed|ing)?|woof|whimper(?:ing)?'),
    cat: buildNounVerbGate(CAT_NOUNS, 'meow(?:s|ed|ing)?|hiss(?:es|ed|ing)?|purr(?:ing)?|screech(?:es|ed|ing)?'),
    bird: /\b(bird|birds)\b.{0,40}\b(chirp|chirps|chirped|chirping|tweet|tweets|whistle|whistling|sing|singing|caw|caws)\b|\b(chirp|chirps|chirped|chirping|tweet|tweets|whistle|whistling|sing|singing|caw|caws)\b.{0,40}\b(bird|birds)\b/,
    crow: /\b(crow|crows|raven|ravens)\b.{0,40}\b(caw|caws|cawed|cawing|call|called)\b|\b(caw|caws|cawed|cawing|call|called)\b.{0,40}\b(crow|crows|raven|ravens)\b/,
    crows: /\b(crow|crows|raven|ravens)\b.{0,40}\b(caw|caws|cawed|cawing|call|called)\b|\b(caw|caws|cawed|cawing|call|called)\b.{0,40}\b(crow|crows|raven|ravens)\b/,
    raven: /\b(crow|crows|raven|ravens)\b.{0,40}\b(caw|caws|cawed|cawing|call|called)\b|\b(caw|caws|cawed|cawing|call|called)\b.{0,40}\b(crow|crows|raven|ravens)\b/,
    owl: /\b(owl|owls)\b.{0,40}\b(hoot|hoots|hooted|hooting|screech|screeched)\b|\b(hoot|hoots|hooted|hooting|screech|screeched)\b.{0,40}\b(owl|owls)\b/,
    owls: /\b(owl|owls)\b.{0,40}\b(hoot|hoots|hooted|hooting|screech|screeched)\b|\b(hoot|hoots|hooted|hooting|screech|screeched)\b.{0,40}\b(owl|owls)\b/,
    cow: /\b(cow|cows)\b.{0,40}\b(moo|moos|mooed|mooing|low|lowed)\b|\b(moo|moos|mooed|mooing|low|lowed)\b.{0,40}\b(cow|cows)\b/,
    horse: /\b(horse|horses)\b.{0,40}\b(gallop|gallops|galloped|galloping|trot|trots|trotted|trotting|neigh|neighs|neighed|whinny|whinnied|hooves|hoofbeats?)\b|\b(gallop|gallops|galloped|galloping|trot|trots|trotted|trotting|neigh|neighs|neighed|whinny|whinnied|hooves|hoofbeats?)\b.{0,40}\b(horse|horses)\b/,
    wolf: buildNounVerbGate(WOLF_NOUNS, 'howl(?:s|ed|ing)?|growl(?:s|ed|ing)?|snarl(?:s|ed|ing)?|roar(?:s|ed|ing)?'),
    wolves: buildNounVerbGate(WOLF_NOUNS, 'howl(?:s|ed|ing)?|growl(?:s|ed|ing)?|snarl(?:s|ed|ing)?|roar(?:s|ed|ing)?'),
    // Drawing/unsheathing has its own keywords (drew, drawn, unsheath); the
    // generic sword/blade keyword plays a clash and must see a strike verb.
    sword: /\b(sword|blade)\b.{0,40}\b(slash|slashes|slashed|slashing|swing|swings|swung|swinging|clash|clashes|clashed|clashing|stab|stabs|stabbed|stabbing|parry|parries|parried|strike|strikes|struck|cut|cuts|clang|clanged|rang|met)\b|\b(slash|slashes|slashed|slashing|swing|swings|swung|swinging|clash|clashes|clashed|clashing|stab|stabs|stabbed|stabbing|parry|parries|parried|strike|strikes|struck|clang|clanged)\b.{0,40}\b(sword|blade)\b/,
    swords: /\b(sword|swords|blade|blades)\b.{0,40}\b(clash|clashes|clashed|swing|swung|slash|slashed|fight|fighting|met|rang|clang|clanged)\b|\b(clash|clashes|clashed|swing|swung|slash|slashed|fight|fighting|clang|clanged)\b.{0,40}\b(sword|swords|blade|blades)\b/,
    blade: /\b(sword|blade)\b.{0,40}\b(slash|slashes|slashed|slashing|swing|swings|swung|swinging|clash|clashes|clashed|clashing|stab|stabs|stabbed|stabbing|parry|parries|parried|strike|strikes|struck|cut|cuts|clang|clanged|rang|met)\b|\b(slash|slashes|slashed|slashing|swing|swings|swung|swinging|clash|clashes|clashed|clashing|stab|stabs|stabbed|stabbing|parry|parries|parried|strike|strikes|struck|clang|clanged)\b.{0,40}\b(sword|blade)\b/,
    drew: /\b(drew|draws?|drawn)\b.{0,30}\b(sword|blade|dagger|weapon|bow)\b/,
    drawn: /\b(drew|draws?|drawn)\b.{0,30}\b(sword|blade|dagger|weapon|bow)\b/,
    bow: /\b(bow|arrow)\b.{0,40}\b(draw|draws|drew|drawn|nock|nocked|loose|loosed|release|released|shoot|shot|fired)\b|\b(draw|draws|drew|drawn|nock|nocked|loose|loosed|release|released|shoot|shot|fired)\b.{0,40}\b(bow|arrow)\b/,
    arrow: /\b(bow|arrow)\b.{0,40}\b(draw|draws|drew|drawn|nock|nocked|loose|loosed|release|released|shoot|shot|fired|fly|flies)\b|\b(draw|draws|drew|drawn|nock|nocked|loose|loosed|release|released|shoot|shot|fired|fly|flies)\b.{0,40}\b(bow|arrow)\b/,
    gun: /\b(gun|pistol|rifle|musket|cannon|bullet)\b.{0,40}\b(shot|shoot|shoots|shooting|fired|fires|bang|blast)\b|\b(shot|shoot|shoots|shooting|fired|fires|bang|blast)\b.{0,40}\b(gun|pistol|rifle|musket|cannon|bullet)\b/,
    shot: /\b(gun|pistol|rifle|musket|cannon|bullet|arrow|bow)\b.{0,40}\b(shot|shoot|shooting|fired|fires|release|released)\b|\b(shot|shoot|shooting|fired|fires|release|released)\b.{0,40}\b(gun|pistol|rifle|musket|cannon|bullet|arrow|bow)\b/,
    fired: /\b(gun|pistol|rifle|musket|cannon|bullet|arrow|bow)\b.{0,40}\b(shot|shoot|shooting|fired|fires|release|released)\b|\b(shot|shoot|shooting|fired|fires|release|released)\b.{0,40}\b(gun|pistol|rifle|musket|cannon|bullet|arrow|bow)\b/,
    magic: /\b(magic|spell|wand|incantation|rune)\b.{0,40}\b(cast|casts|casting|spark|sparks|glow|erupts|fires?)\b|\b(cast|casts|casting|spark|sparks|glow|erupts|fires?)\b.{0,40}\b(magic|spell|wand|incantation|rune)\b/,
    spell: /\b(spell|magic|wand|incantation|rune)\b.{0,40}\b(cast|casts|casting|spark|sparks|glow|erupts|fires?)\b|\b(cast|casts|casting|spark|sparks|glow|erupts|fires?)\b.{0,40}\b(spell|magic|wand|incantation|rune)\b/,
    cast: /\b(cast|casts|casting)\b.{0,30}\b(spell|magic|wand|incantation|rune)\b/,
    fire: /\b(fire|flame|flames|campfire|fireplace|torch)\b.{0,40}\b(crackle|crackles|crackled|crackling|burn|burns|burned|burning|roar|roars|blaze|erupts|catches)\b|\b(crackle|crackles|crackled|crackling|burn|burns|burned|burning|roar|roars|blaze|erupts|catches)\b.{0,40}\b(fire|flame|flames|campfire|fireplace|torch)\b/,
    water: /\b(water|river|stream|waves|ocean|sea)\b.{0,40}\b(splash|splashes|splashed|splashing|flow|flows|flowing|rush|rushing|drip|drips|dripping|crash|crashing)\b|\b(splash|splashes|splashed|splashing|flow|flows|flowing|rush|rushing|drip|drips|dripping|crash|crashing)\b.{0,40}\b(water|river|stream|waves|ocean|sea)\b/,
    wind: /\b(wind|breeze|gale|gust)\b.{0,40}\b(blow|blows|blew|blowing|howl|howls|howled|howling|roar|roars|roared|rush|rushing|whip|whips)\b|\b(blow|blows|blew|blowing|howl|howls|howled|howling|roar|roars|roared|rush|rushing|whip|whips)\b.{0,40}\b(wind|breeze|gale|gust)\b/,
    // Slams, bursts and kicks are phrase triggers; the door keyword is the creak.
    door: /\b(door|gate|doors|gates)\b.{0,40}\b(creak|creaks|creaked|creaking|squeak|squeaks|squeaked|squeaking|groan|groans|groaned|open|opens|opened|opening|swung|swings|swinging)\b|\b(creak|creaks|creaked|creaking|squeak|squeaks|squeaked|squeaking|open|opens|opened|swung)\b.{0,40}\b(door|gate|doors|gates)\b/,
    crowd: /\b(crowd|audience|stadium)\b.{0,40}\b(cheer|cheers|cheered|cheering|applaud|applauds|applauded|applause|roar|roars|roared|roaring|erupt|erupts|erupted|clap|claps|clapping|clapped|chant|chants|chanted|chanting|went wild|goes wild)\b|\b(cheer|cheers|cheered|cheering|applaud|applauds|applauded|applause|roar|roars|roared|roaring|clap|claps|clapping|clapped)\b.{0,40}\b(crowd|audience|stadium)\b/,
    audience: /\b(crowd|audience|stadium)\b.{0,40}\b(cheer|cheers|cheered|cheering|applaud|applauds|applauded|applause|roar|roars|roared|roaring|erupt|erupts|erupted|clap|claps|clapping|clapped|chant|chants|chanted|chanting|went wild|goes wild)\b|\b(cheer|cheers|cheered|cheering|applaud|applauds|applauded|applause|roar|roars|roared|roaring|clap|claps|clapping|clapped)\b.{0,40}\b(crowd|audience|stadium)\b/,
    train: /\b(train)\b.{0,40}\b(whistle|whistles|whistled|rumble|rumbles|rumbled|arrives|arrived|passes|passed|roars)\b|\b(whistle|whistles|whistled|rumble|rumbles|rumbled|arrives|arrived|passes|passed|roars)\b.{0,40}\b(train)\b/,
    // "blocked the road" is not a shield parry.
    block: /\b(block|blocks|blocked|blocking)\b.{0,40}\b(blow|blows|strike|strikes|attack|attacks|sword|blade|axe|club|mace|spear|shield|swing|thrust|slash|arrow|bolt|punch|fist|kick|parry)\b|\b(blow|blows|strike|strikes|attack|attacks|sword|blade|axe|club|mace|spear|shield|swing|thrust|slash|arrow|bolt|punch|fist|kick)\b.{0,40}\b(block|blocks|blocked|blocking)\b/,
    // A car is only a sound when it is doing something audible.
    car: /\b(car|cars)\b.{0,40}\b(engine|starts|started|starting|revs|revved|revving|roars|roared|sped|speeds|speeding|raced|races|racing|screeched|screeches|screeching|skidded|skids|honks|honked|honking|horn|pulled up|pulls up|pulled away|pulls away|drove off|drives off|accelerated|accelerates|idling|idled|backfired)\b|\b(engine|revs|revved|revving|honk|honked|honking|horn)\b.{0,40}\b(car|cars)\b/,
    // The rattle file is a chain/metal clank; mugs and teeth do not qualify.
    rattle: /\b(chain|chains|shackle|shackles|manacles|bones|skeleton|cage|bars|window|windows|shutters|door handle|doorknob|gate|portcullis|armor|armour|sabre|saber)\b.{0,40}\brattl(?:e|es|ed|ing)\b|\brattl(?:e|es|ed|ing)\b.{0,40}\b(chain|chains|shackle|shackles|manacles|bones|skeleton|cage|bars|window|windows|shutters|door handle|doorknob|gate|portcullis|armor|armour)\b/,
    // Heavy breathing is a loop; "drew a long breath" is a single quiet beat.
    breath: /\b(heavy|ragged|labored|laboured|shallow|rapid|wheezing|gasping|panting|strained|hoarse)\b.{0,20}\bbreath(?:s|ing)?\b|\bbreath(?:s|ing)?\b.{0,20}\b(heavy|heavily|hard|ragged|labored|laboured|fast|rapid|wheez\w*|gasp\w*)\b/,
    breathing: /\b(heavy|ragged|labored|laboured|shallow|rapid|wheezing|gasping|panting|strained|hoarse)\b.{0,20}\bbreath(?:s|ing)?\b|\bbreath(?:s|ing)?\b.{0,20}\b(heavy|heavily|hard|ragged|labored|laboured|fast|rapid|wheez\w*|gasp\w*)\b/,
};

// Things that scream, wail or shriek without being a person. When one is in
// the sentence, the human scream keywords stand down.
const NON_HUMAN_VOICE_RE = new RegExp(`\\b(?:${[...new Set([...CREATURE_NOUNS, ...WOLF_NOUNS, 'goblin', 'goblins', 'orc', 'orcs', 'zombie', 'zombies', 'ghoul', 'ghouls', 'wraith', 'wraiths', 'banshee', 'harpy', 'harpies', 'spider', 'spiders', 'bat', 'bats', 'eagle', 'hawk', 'owl', 'owls', 'cat', 'cats', 'kettle', 'siren', 'sirens', 'wind', 'guitar', 'brakes', 'tires', 'tyres', 'metal', 'engine', 'alarm'])].map(escapeRegExp).join('|')})\\b`);

// Keywords that read as a different sound family in some contexts. When the
// exclusion matches, the keyword stays silent and the phrase table (which
// knows "waves crashed" is water, not glass) gets to answer instead.
const CONTEXT_EXCLUDED = {
    crash: /\b(wave|waves|surf|sea|ocean|tide|breakers?|water|river|market|markets|stock|stocks|economy|server|servers|computer|system|website|site|app|crash course)\b/,
    smash: /\b(record|records|hit|song|single|success)\b/,
    boom: /\b(economic|economy|business|baby|boom town|boomtown|boom years|housing)\b/,
    // The human scream files must not answer for a goblin, a siren or the wind;
    // those have their own keywords.
    scream: NON_HUMAN_VOICE_RE,
    screamed: NON_HUMAN_VOICE_RE,
    screaming: NON_HUMAN_VOICE_RE,
    shriek: NON_HUMAN_VOICE_RE,
    yell: NON_HUMAN_VOICE_RE,
    wail: NON_HUMAN_VOICE_RE,
    // Blocking a road or a doorway is not a shield parry.
    block: /\bblock(?:s|ed|ing)?\s+(?:the|their|his|her|our|my|a|an|every|all|any)?\s*(?:road|roads|path|paths|way|doorway|door|doors|entrance|exit|passage|view|sun|light|street|bridge|tunnel|hall|hallway|corridor|stairs|stairway|alley|gate|number|call|user|account|site|website|access|traffic|signal|shot|goal)\b/,
    // A kicked, slammed or knocked door is its own cue; do not layer the creak.
    door: /\b(kick|kicks|kicked|kicking|slam|slams|slammed|slamming|burst|bursts|flung|smash|smashed|smashes|broke|break|breaks|knock|knocks|knocked|knocking|pound|pounded|pounding|bang|banged|banging|shut|shuts|closed|locked|bolted)\b/,
    gate: /\b(slam|slams|slammed|slamming|crash|crashed|shut|shuts|closed|locked|bolted)\b/,
};

const CATEGORY_CONTEXT_RULES = {
    animal: /\b(bark|barks|barked|barking|woof|meow|meows|meowed|meowing|hiss|hissed|hissing|purr|purring|chirp|chirps|chirped|chirping|tweet|caw|caws|cawed|cawing|hoot|hoots|hooting|moo|mooed|mooing|cluck|clucks|clucking|gallop|gallops|galloped|galloping|trot|trots|trotted|trotting|neigh|neighs|neighed|whinny|whinnied|hoofbeats?|howl|howls|howled|howling|growl|growls|growled|growling|snarl|snarls|snarled|snarling|roar|roars|roared|roaring|screech|screeched|screeching|call|called|calling)\b/,
    creature: /\b(growl|growls|growled|growling|snarl|snarls|snarled|snarling|roar|roars|roared|roaring|scream|screams|screamed|screaming|shriek|shrieked|shriek|howl|howls|howled|howling|slurp|slurps|slurped|slurping|devour|devours|devoured|devouring|moan|moans|moaned|moaning)\b/,
    combat: /\b(draw|draws|drew|drawn|unsheath|unsheathed|slash|slashes|slashed|slashing|stab|stabs|stabbed|stabbing|clash|clashes|clashed|clashing|parry|parried|block|blocked|blocking|shoot|shoots|shooting|shot|fired|fires|gunshot|twang|loose|loosed|release|released|punch|punches|punched|hit|hits|smack|smacked|battle\s+(begins|erupts|rages)|fight|fights|fighting|duel|dueling|war\s+(breaks|erupts|rages))\b/,
    explosion: /\b(bang|boom|blast|explosion|explode|explodes|exploded|exploding|detonate|detonates|detonated|cannon\s+(fires|blasts|booms)|bomb\s+(explodes|detonates|goes off)|fireball\s+(erupts|explodes|detonates|fires))\b/,
    impact: /\b(crash|crashes|crashed|crashing|shatter|shatters|shattered|shattering|smash|smashes|smashed|smashing|thud|thuds|thudded|thump|thumps|thumped|slam|slams|slammed|slamming|impact|impacts|collapse|collapses|collapsed|timber)\b/,
    magic: /\b(cast|casts|casting|spell\s+(fires|erupts|crackles|explodes|casts)|magic\s+(surges|crackles|erupts|fires)|heal|heals|healed|healing|poof|vanish|vanishes|vanished|vanishing|missile\s+(fires|streaks|launches))\b/,
    weather: /\b(raining|rained|rain\s+(began|begins|started|starts|falls|fell|falling|pours|poured|pouring|pounding|pounded|pounds|hammered|hammers|hammering|lashed|lashes|lashing|pelted|pelts|pelting|drummed|drums|drumming|beat|beats|beating|came down|comes down|outside|heavy)|downpour|drizzle|storm|thunder|thunderclap|thundered|lightning|blizzard|tornado|twister|cyclone|hurricane|wind\s+(blows|blew|blowing|howls|howled|howling|whips|whipped|roars|roared)|gust|gale)\b/,
    fire: /\b((fire|campfire|fireplace|torch|flame|flames|ember|embers).{0,40}(crackle|crackles|crackled|crackling|burn|burns|burned|burning|roar|roars|roared|blaze|blazes|erupts|catches|sparks?)|(crackle|crackles|crackled|crackling|burn|burns|burned|burning|roar|roars|roared|blaze|blazes|erupts|sparks?).{0,40}(fire|campfire|fireplace|torch|flame|flames|ember|embers))\b/,
    water: /\b(splash|splashes|splashed|splashing|drip|drips|dripped|dripping|water\s+(flows|flowing|flowed|rushes|rushing|rushed|splashes|splashed|drips|dripped|lapped|laps|lapping)|river\s+(flows|flowed|rushes|rushed|roars|roared)|stream\s+(flows|flowed|trickles|trickled|burbles|burbled|babbled|babbles)|waves?\s+(crash|crashes|crashed|crashing|lap|laps|lapped|lapping|broke|break|breaks|breaking|roll|rolled|rolling|pound|pounded|pounding|slap|slapped|slapping)|ocean\s+(waves|roars|roared)|surf\s+(crash|crashed|crashes|pounded|pounds))\b/,
    movement: /\b(footsteps?|walks?|walked|walking|steps?|stepped|crept|sneak|sneaks|sneaking|running|ran|run|chase|chases|chased|boots?\s+(walk|walking|stomp|stomps|stomping)|hooves?|gravel\s+(crunch|crunches|crunched)|leaves\s+(crunch|rustle|rustled)|stairs?\s+(creak|creaks|creaked))\b/,
    door: /\b(knock|knocks|knocked|knocking|doorbell|bells?\b.{0,30}\b(rings|rang|ringing|chimes|chimed|chiming|tolls|tolled|tolling|peals|pealed|pealing|dings)|ding|dings|dinging|creak|creaks|creaked|creaking|squeak|squeaks|squeaked|squeaking|elevator\s+chime)\b/,
    human: /\b(scream|screams|screamed|screaming|shriek|shrieked|shriek|yell|yells|yelled|yelling|wail|wails|wailed|wailing|laugh|laughs|laughed|laughing|giggle|giggles|giggled|cry|cries|cried|crying|breath|breaths|breathing|gasp|gasps|gasped|pant|pants|panting|heartbeat|heart\s+beat|heart\s+(?:was\s+|is\s+)?(?:pounding|pounded|pounds|racing|raced|races|hammering|hammered|hammers|thudding|thudded|thuds|beating|beats)|whisper|whispers|whispered|whispering|writing|scribble|scribbles|scribbling)\b/,
    crowd: /\b(applause|applaud|applauds|applauded|clap|claps|clapped|clapping|cheer|cheers|cheered|cheering|crowd\s+(roars|cheers|applauds|erupts)|audience\s+(cheers|applauds|claps)|hooray|yay)\b/,
    vehicle: /\b(siren|sirens|wail|wails|wailing|honk|honks|honked|honking|horn\s+(blasts|blares|sounds)|engine\s+(starts|started|revs|roars|turns over)|train\s+(passes|passing|passed|whistles|whistled|rumbles|rumbled|arrives|arrived)|ship\s+(horn|whistle)|radio\s+(chatter|static|crackles)|dispatch|dispatcher|scanner|squelch|doppler|passing\s+by|ambulance.{0,30}siren|police.{0,30}siren|fire\s*truck.{0,30}siren)\b/,
    misc: /\b(clock\s+(ticks|ticked|ticking|tocked|tocks|chimed|chimes|struck|strikes)|tick|ticks|ticked|ticking|alarm\s+(rings|rang|sounds|sounded|goes off|went off|blared|blares)|phone\s+(rings|ringing|rang|buzzed|buzzes)|coin(s)?\s+(clink|clinks|clinked|jingle|jingles|jingled|drop|drops|dropped|rattle|rattles|rattled)|chains?\s+(rattle|rattles|rattled|rattling|clank|clanks|clanked)|anvil\s+(rings|rang|strike|strikes|struck)|hammer\s+(strikes|struck|hits|hit|rings|rang)|static|radio\s+static|flatline|heart\s+monitor\s+(beeps?|flatlines?))\b/,
    dnd: /\b(dice\s+(roll|rolls|rolled|rolling|clatter|clatters)|scroll\s+(unfurls?|unfurled|opens?|tears?)|potion\s+(bubbles|brews|drinks?)|tavern\s+(crowd|chatter|murmur)|cave\s+(drips?|echoes?|rumbles)|dungeon\s+(drips?|chains?|echoes?)|torch\s+(crackle|crackles|burns|burning)|spell\s+(casts?|fires?|erupts))\b/,
    horror: /\b(scratch|scratches|scratched|scratching|rattle|rattles|rattled|rattling|cellar\s+(creaks|rumbles)|basement\s+(creaks|rumbles)|sewer\s+(drips|echoes)|eerie\s+(ringing|tone|drone)|scuba\s+breathing)\b/,
    halloween: /\b(cackle|cackles|cackled|cackling|witch\s+(laughs|cackles)|bones?\s+(crack|cracks|cracked)|skeleton\s+(rattles|cracks)|bat\s+(flutters|screeches)|boo\b|ghost\s+(whispers|moans))\b/,
    christmas: /\b(jingle|jingles|jingling|sleigh\s+bells?|bells?\s+(jingle|ring|chime)|reindeer\s+bells?|present\s+(opens|unwraps))\b/,
    nautical: /\b(ship\s+(horn|whistle|creaks)|anchor\s+(drops|rattles|clanks)|ahoy\b|captain\s+(shouts|calls))\b/,
    nature: /\b(cricket|crickets|chimes?\s+(ring|chime)|tree\s+(falls|crashes)|wind\s+chimes?)\b/,
};

const SFX_QUERY_ACTION_RE = /\b(scrape|scrapes|scraped|scraping|drag|drags|dragged|slide|slides|slid|unfold|unfolds|unfolded|unfolding|unfurl|unfurls|unfurled|page\s+turn|shuffle|writing|scribble|tear|tears|torn|pull|pulls|pulled|knock|knocks|knocked|knocking|slam|slams|slammed|slamming|creak|creaks|creaked|creaking|squeak|squeaks|squeaked|squeaking|ring|rings|rang|ringing|ding|dings|chime|chimes|tick|ticks|ticking|clink|clinks|jingle|jingles|rattle|rattles|rattled|rattling|crackle|crackles|crackled|crackling|burn|burns|burning|splash|splashes|splashed|splashing|drip|drips|dripping|flow|flows|flowing|pour|pours|pouring|rain\s+(began|begins|starts|falls|pours)|raining|downpour|storm|thunder|lightning|wind\s+(howls|blows|whips)|howl|howls|howled|howling|bark|barks|barked|barking|woof|meow|hiss|purr|chirp|chirps|chirping|caw|hoot|moo|cluck|gallop|gallops|galloping|neigh|whinny|growl|growls|growling|snarl|roar|roars|roaring|scream|screams|screaming|shriek|yell|laugh|laughs|laughing|cry|cries|crying|breath|breathing|panting|heartbeat|whisper|whispers|whispering|applause|clap|claps|clapping|cheer|cheers|cheering|siren|sirens|honk|honks|honking|engine\s+(starts|revs|roars)|train\s+(passes|whistles|rumbles)|radio\s+(chatter|static)|dispatch|scanner|squelch|shoot|shoots|shooting|shot|fired|fires|slash|slashes|slashed|stab|stabs|stabbed|clash|clashes|clashed|parry|block|blocked|punch|punches|punched|hit|hits|crash|crashes|crashed|shatter|shatters|shattered|smash|smashes|smashed|thud|thump|boom|bang|blast|explosion|explode|explodes|detonate|cast|casts|casting|spell\s+(fires|erupts)|magic\s+(surges|crackles)|heal|healing|poof|vanish|vanished|dice\s+(roll|rolling|clatter)|potion\s+(bubbles|brews)|scroll\s+(unfurls|opens)|crowd\s+(cheers|roars|murmurs)|chatter|murmur|ambience|ambient)\b/i;

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Negation and "it stopped" phrasing around a keyword. Narrators say "there
// was no gunshot", "the rain had finally stopped", "she never heard a bark";
// each of those used to fire the sound it names.
const NEGATION_LEAD = "(?:no|not|never|without|nor|neither|hardly|barely|didn't|did not|doesn't|does not|don't|do not|wasn't|was not|weren't|were not|isn't|is not|couldn't|could not|can't|cannot|wouldn't|would not|instead of|in place of|rather than|no longer|no sign of|no sound of|not a single|not even a|no one|nobody|none of)";
// Words allowed between the negation and the keyword. Deliberately narrow:
// speech transcripts carry no punctuation, so "not long after the gunshot"
// must not read as a negated gunshot.
const NEGATION_WINDOW_WORD = '(?:a|an|the|any|some|single|more|even|much|many|of|to|that|this|those|these|such|sound|sounds|sign|signs|hint|trace|faintest|slightest|distant|loud|sudden|further|other|another|hear|heard|hearing|see|saw|seen|notice|noticed|expect|expected|want|wanted|need|needed|[a-z]+ly)';
const CEASED_TAIL = '(?:had |has |have |finally |at last |slowly |suddenly |gradually )*(?:stopped|stops|ceased|ceases|ended|ends|faded|fades|died (?:down|away|out)|dies (?:down|away|out)|subsided|subsides|quieted|quiets|fell silent|falls silent|went quiet|goes quiet|was over|is over|was gone|is gone|no more)';

function hasNegatedMention(keyword, transcript) {
    const escaped = escapeRegExp(keyword);
    const forms = `${escaped}(?:s|es|ed|ing)?`;
    return isMentionNegated(forms, transcript);
}

/**
 * True when a word or phrase (given as a regex fragment, already escaped) is
 * negated before it or reported as stopped/faded after it. Shared by the
 * instant keyword gate and the phrase trigger matcher.
 */
export function isMentionNegated(fragment, transcript) {
    const negatedBefore = new RegExp(`\\b${NEGATION_LEAD}\\b(?:\\s+${NEGATION_WINDOW_WORD}){0,4}\\s+${fragment}\\b`, 'i');
    const ceasedAfter = new RegExp(`\\b${fragment}\\b(?:\\s+[a-z'-]+){0,2}?\\s+${CEASED_TAIL}\\b`, 'i');
    const silenceOf = new RegExp(`\\b(?:silence|absence|lack)\\s+of\\s+(?:the\\s+|any\\s+)?${fragment}\\b`, 'i');
    return negatedBefore.test(transcript) || ceasedAfter.test(transcript) || silenceOf.test(transcript);
}

function hasStaticStateMention(keyword, transcript) {
    const escaped = escapeRegExp(keyword);
    // "the dog was asleep" is static; "the dog was barking" is a live sound, so a
    // progressive verb right after the copula is not treated as static.
    const staticRe = new RegExp(`\\b(?:the|a|an|this|that)\\s+${escaped}\\s+(?:was|were|is|are|sat|sits|stood|stands|lay|lies|laid|hung|rested|rests|slept|sleeps)\\b(?!\\s+(?:still\\s+|now\\s+|loudly\\s+|already\\s+)?[a-z]+ing\\b)`, 'i');
    const mentionRe = new RegExp(`\\b(?:mentioned|saw|noticed|described|looked at|pointed at)\\s+(?:the\\s+)?${escaped}\\b`, 'i');
    return staticRe.test(transcript) || mentionRe.test(transcript);
}

function hasExactQueryMention(query, transcript) {
    const normalizedQuery = String(query || '').toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalizedQuery || normalizedQuery.split(' ').length < 2) return false;
    return transcript.includes(normalizedQuery);
}

// Lightweight, dependency-free debug logger (this module runs both client
// and server side, so it can't rely on the engine's window/CONFIG-based
// debugLog). Gated the same way regardless of environment: never logs in
// production. Lets a gate's allow/block decision be inspected in dev
// without needing to reproduce a bug in production first — every
// self-referential-gate bug fixed today would have been visible instantly
// as "allowed via category rule" for an obviously-wrong keyword.
function isTriggerDebugEnabled() {
    try {
        if (typeof window !== 'undefined') return !!(window.CONFIG && window.CONFIG.DEBUG_MODE);
        return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
    } catch {
        return false;
    }
}

function debugTrigger(...args) {
    if (isTriggerDebugEnabled()) console.debug('[trigger-gate]', ...args);
}

export function shouldTriggerKeyword(keyword, transcript = '', config = null) {
    const normalizedKeyword = String(keyword || '').toLowerCase().trim();
    const normalizedTranscript = String(transcript || '').toLowerCase();
    if (!normalizedKeyword || !normalizedTranscript) return false;

    if (hasStaticStateMention(normalizedKeyword, normalizedTranscript)) {
        debugTrigger(`"${normalizedKeyword}" blocked: static/mentioned-only phrasing`);
        return false;
    }

    if (hasNegatedMention(normalizedKeyword, normalizedTranscript)) {
        debugTrigger(`"${normalizedKeyword}" blocked: negated or ceased phrasing`);
        return false;
    }

    const exclusion = CONTEXT_EXCLUDED[normalizedKeyword];
    if (exclusion && exclusion.test(normalizedTranscript)) {
        debugTrigger(`"${normalizedKeyword}" blocked: excluded context`);
        return false;
    }

    const rule = CONTEXT_REQUIRED[normalizedKeyword];
    if (rule) {
        const allowed = rule.test(normalizedTranscript);
        debugTrigger(`"${normalizedKeyword}" ${allowed ? 'allowed' : 'blocked'} via context-required rule`);
        return allowed;
    }

    if (!config) {
        debugTrigger(`"${normalizedKeyword}" blocked: no config and no context-required rule`);
        return false;
    }
    if (hasExactQueryMention(config.query, normalizedTranscript)) {
        debugTrigger(`"${normalizedKeyword}" allowed: exact query phrase match ("${config.query}")`);
        return true;
    }

    const categoryRule = CATEGORY_CONTEXT_RULES[config.category];
    const allowed = !!categoryRule?.test(normalizedTranscript);
    debugTrigger(`"${normalizedKeyword}" ${allowed ? 'allowed' : 'blocked'} via category rule (${config.category})`);
    return allowed;
}

/**
 * Candidate base forms for an inflected token, most specific first.
 * Narration is mostly past tense ("slammed", "shattered", "creaked") while the
 * trigger map is keyed on base forms, so lookups must try the stem too.
 * Only produces stems; never guesses suffixes.
 */
export function inflectionCandidates(token) {
    const word = String(token || '').toLowerCase();
    const out = [];
    const push = (w) => { if (w && w.length >= 3 && !out.includes(w)) out.push(w); };
    push(word);
    if (word.length < 4) return out;

    const shortClosed = /^[^aeiou]*[aeiou][^aeiouwxy]$/; // car, cop, bat: would double the consonant
    if (word.endsWith('ing')) {
        const base = word.slice(0, -3);
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) push(base.slice(0, -1)); // slamming -> slam
        push(base);                 // barking -> bark
        push(`${base}e`);           // raging -> rage
    } else if (word.endsWith('ied')) {
        push(`${word.slice(0, -3)}y`); // cried -> cry
    } else if (word.endsWith('ed')) {
        const base = word.slice(0, -2);
        if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) push(base.slice(0, -1)); // slammed -> slam
        if (!shortClosed.test(base)) push(base); // roared -> roar, but cared !-> car
        push(word.slice(0, -1));    // fired -> fire
    } else if (word.endsWith('ies')) {
        push(`${word.slice(0, -3)}y`); // cries -> cry
    } else if (word.endsWith('es')) {
        push(word.slice(0, -2));    // crashes -> crash
        push(word.slice(0, -1));    // waves -> wave
    } else if (word.endsWith('s') && !word.endsWith('ss')) {
        push(word.slice(0, -1));    // guns -> gun
    }
    return out;
}

/**
 * Find the trigger map key a transcript token refers to, allowing simple
 * inflection ("slammed" -> "slam"). Exact keys always win.
 * @returns {string|null}
 */
export function resolveTriggerKeyword(token, triggerMap) {
    if (!token || !triggerMap) return null;
    for (const candidate of inflectionCandidates(token)) {
        if (Object.prototype.hasOwnProperty.call(triggerMap, candidate)) return candidate;
    }
    return null;
}

export function tokenizeTranscript(transcript) {
    return String(transcript || '')
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9'-]/g, ''))
        .filter(Boolean);
}

// Animal/creature keywords that name the noise rather than the creature.
const VOCALIZATION_KEYWORDS = new Set([
    'bark', 'barking', 'woof', 'howl', 'howling', 'meow', 'hiss', 'hissing', 'screech',
    'growl', 'growling', 'snarl', 'snarling', 'roar', 'roared', 'chirp', 'chirping', 'tweet',
    'caw', 'hoot', 'moo', 'cluck', 'neigh', 'whinny', 'whimper', 'whimpering',
    'gallop', 'galloping', 'trot', 'trotting', 'hooves',
]);
const CREATURE_CATEGORIES = new Set(['animal', 'creature']);
// Layering two of these in one sentence never sounds like one event.
const ONE_PER_CATEGORY = new Set(['crowd', 'explosion']);

/**
 * "The dragon roared" matches both `dragon` (dragon growl) and `roar` (generic
 * creature roar); that is one event, not two. Keep the verb when its sound is
 * specific to the named creature ("cat" + "hiss" -> cat hiss), otherwise keep
 * the creature's own sound.
 */
function resolveCreaturePairs(matches) {
    const creature = matches.filter((m) => CREATURE_CATEGORIES.has(m.config.category));
    if (creature.length < 2) return matches;
    const nouns = creature.filter((m) => !VOCALIZATION_KEYWORDS.has(m.keyword));
    const verbs = creature.filter((m) => VOCALIZATION_KEYWORDS.has(m.keyword));
    if (!nouns.length || !verbs.length) return matches;
    const drop = new Set();
    for (const verb of verbs) {
        const queryWords = String(verb.config.query || '').toLowerCase().split(/\s+/);
        const owner = nouns.find((n) => queryWords.includes(n.keyword) || queryWords.includes(String(n.config.query || '').split(' ')[0]));
        if (owner) drop.add(owner); else drop.add(verb);
    }
    return matches.filter((m) => !drop.has(m));
}

/**
 * Gated instant keyword matches for one transcript, in sentence order and
 * deduplicated by sound file, so a sentence never fires the same file twice
 * ("the dog barked" used to hit both `bark` and `dog`) and the earliest
 * narrated event is never starved by map order.
 *
 * @param {string} transcript
 * @param {Object} triggerMap keyword -> { query, file, volume, category }
 * @param {{ synonyms?: Map<string,string>, skip?: (keyword:string, config:Object)=>boolean, max?: number }} [opts]
 * @returns {Array<{ keyword: string, config: Object, position: number }>}
 */
export function findTriggerMatches(transcript, triggerMap, opts = {}) {
    const lower = String(transcript || '').toLowerCase();
    if (!lower || !triggerMap) return [];
    const tokens = tokenizeTranscript(lower);
    const seenKeywords = new Set();
    const seenFiles = new Set();
    const seenCategories = new Set();
    const matches = [];
    const max = Number.isFinite(opts.max) ? opts.max : Infinity;

    tokens.forEach((token, position) => {
        let keyword = resolveTriggerKeyword(token, triggerMap);
        if (!keyword && opts.synonyms) {
            const canonical = opts.synonyms.get(token);
            if (canonical && Object.prototype.hasOwnProperty.call(triggerMap, canonical)) keyword = canonical;
        }
        if (!keyword || seenKeywords.has(keyword)) return;
        seenKeywords.add(keyword);
        const config = triggerMap[keyword];
        if (!config) return;
        const fileKey = config.file || config.query || keyword;
        if (seenFiles.has(fileKey)) return;
        // A sibling keyword on cooldown or already consumed also blocks its file.
        if (typeof opts.skip === 'function' && opts.skip(keyword, config)) {
            seenFiles.add(fileKey);
            return;
        }
        if (!shouldTriggerKeyword(keyword, lower, config)) return;
        if (ONE_PER_CATEGORY.has(config.category)) {
            if (seenCategories.has(config.category)) return;
            seenCategories.add(config.category);
        }
        seenFiles.add(fileKey);
        matches.push({ keyword, config, position });
    });

    return resolveCreaturePairs(matches).slice(0, max);
}

/**
 * Rank distinct trigger files for instant-keyword preloading.
 * Ordered by how many keywords each file can answer so preload bandwidth buys
 * the most trigger coverage; category priority is only a tiebreak.
 * @param {Object} instantKeywords - keyword -> { file, category, volume }
 * @returns {Array<{ file: string, keywordCount: number, category: string }>}
 */
export const PRELOAD_PRIORITY_CATEGORIES = ['combat', 'creature', 'explosion', 'animal', 'weather', 'door'];

function estimateAudioFileBytes(file, config = {}) {
    const raw = Number(config.estimatedBytes ?? config.fileSize ?? config.size ?? 0);
    if (Number.isFinite(raw) && raw > 0) return raw;

    const lower = String(file || '').toLowerCase();
    const ext = lower.includes('.') ? lower.split('.').pop() : '';

    const defaults = {
        flac: 3_200_000,
        wav: 2_400_000,
        ogg: 1_200_000,
        m4a: 600_000,
        mp3: 240_000,
    };

    return defaults[ext] || 240_000;
}

export function rankInstantPreloadFiles(instantKeywords) {
    const byFile = new Map();
    for (const [keyword, config] of Object.entries(instantKeywords || {})) {
        if (!config?.file) continue;
        if (!byFile.has(config.file)) {
            byFile.set(config.file, {
                file: config.file,
                keywordCount: 0,
                category: config.category || '',
                estimatedBytes: estimateAudioFileBytes(config.file, config),
                keyword,
            });
        }
        byFile.get(config.file).keywordCount += 1;

        const current = byFile.get(config.file);
        current.estimatedBytes = Math.max(current.estimatedBytes, estimateAudioFileBytes(config.file, config));
    }

    const categoryRank = (category) => {
        const idx = PRELOAD_PRIORITY_CATEGORIES.indexOf(category || '');
        return idx === -1 ? 99 : idx;
    };

    const score = ({ keywordCount, estimatedBytes }) => {
        const kb = Math.max(estimatedBytes, 1);
        return keywordCount / Math.sqrt(kb / 1024);
    };

    return [...byFile.values()].sort((a, b) => {
        const impact = score(b) - score(a);
        if (impact !== 0) return impact > 0 ? 1 : -1;
        return categoryRank(a.category) - categoryRank(b.category);
    });
}

/**
 * Rule-based fallback engine: decides sounds without AI.
 * Uses mode + keywords to make instant decisions.
 * @param {string} transcript - spoken text
 * @param {string} mode - current mode (bedtime, dnd, horror, etc.)
 * @param {Object} triggerMap - the keyword->sound map
 * @param {Array} savedSounds - the saved sounds catalog
 * @returns {Object|null} - { music: {file, volume}, sfx: [{file, volume}] } or null
 */
export function ruleBasedDecision(transcript, mode, triggerMap, savedSounds) {
    if (!transcript || !mode) return null;

    const words = transcript.toLowerCase().replace(/[^a-z0-9\s'-]/g, '').split(/\s+/).filter(Boolean);
    const result = { music: null, sfx: [] };

    // Collect SFX from trigger map (max 3), in sentence order, one per file
    for (const match of findTriggerMatches(transcript, triggerMap, { max: 3 })) {
        result.sfx.push({ file: match.config.file, volume: match.config.volume, query: match.config.query });
    }

    // Music decisions based on mode + detected atmosphere
    const musicFiles = savedSounds?.files?.filter(f => f.type === 'music') || [];

    if (musicFiles.length > 0) {
        const modeMusic = {
            bedtime: ['calm', 'gentle', 'lullaby', 'peaceful', 'piano', 'soft', 'ambient'],
            dnd: ['medieval', 'fantasy', 'epic', 'battle', 'tavern', 'adventure', 'rpg'],
            horror: ['horror', 'dark', 'eerie', 'creepy', 'suspense', 'tense', 'scary'],
            christmas: ['christmas', 'holiday', 'festive', 'jingle', 'winter', 'carol'],
            halloween: ['halloween', 'spooky', 'eerie', 'witch', 'pumpkin', 'dark'],
            sing: ['pop', 'rock', 'jazz', 'blues', 'country', 'folk'],
            auto: ['ambient', 'calm', 'dramatic']
        };
        const moodKeywords = modeMusic[mode] || modeMusic.auto;

        // Score music tracks by mode + transcript evidence. In auto mode,
        // never start generic ambience/music without transcript evidence.
        let bestTrack = null, bestScore = 0, bestTranscriptScore = 0;
        for (const track of musicFiles) {
            let score = 0, transcriptScore = 0;
            const hay = [track.name, ...track.keywords].join(' ').toLowerCase();
            for (const kw of moodKeywords) {
                if (hay.includes(kw)) score += 2;
            }
            // Boost if transcript words appear in track keywords
            for (const w of words) {
                if (w.length > 3 && hay.includes(w)) {
                    score += 1;
                    transcriptScore += 1;
                }
            }
            if (score > bestScore) { bestScore = score; bestTranscriptScore = transcriptScore; bestTrack = track; }
        }

        const allowModeOnlyMusic = mode && !['auto', 'creator'].includes(mode);
        const hasTranscriptMusicEvidence = bestTranscriptScore >= (mode === 'auto' ? 2 : 1);
        if (bestTrack && bestScore >= 2 && (hasTranscriptMusicEvidence || allowModeOnlyMusic)) {
            result.music = { file: bestTrack.file, volume: 0.4, name: bestTrack.name };
        }
    }

    // Return null if nothing triggered
    if (!result.music && result.sfx.length === 0) return null;
    return result;
}

// Query side synonyms. Synonym hits add a little score but never count toward
// coverage, so a query can't match a sound purely through synonyms.
const QUERY_SYNONYMS = {
    'bark': ['dog', 'woof'], 'woof': ['dog', 'bark'],
    'howl': ['wolf', 'wind'], 'meow': ['cat'],
    'creak': ['door', 'wood'], 'boom': ['explosion', 'blast'],
    'bang': ['explosion', 'gunshot'], 'slash': ['sword', 'swing'],
    'roar': ['monster', 'creature'], 'growl': ['snarl'],
    'scream': ['horror', 'shriek'], 'female': ['woman', 'girl'], 'male': ['man'],
    'child': ['kid', 'young'], 'woman': ['female', 'girl'], 'man': ['male'],
    'campfire': ['fire', 'logs'], 'candle': ['wax', 'wick'], 'torch': ['flame'],
    'fireplace': ['hearth'], 'bonfire': ['fire', 'roaring'],
    'crash': ['shatter', 'impact'],
    'thunder': ['lightning', 'storm'], 'lightning': ['thunder', 'strike'],
    'footstep': ['footsteps', 'walking', 'steps'], 'footsteps': ['footstep', 'walking', 'steps'],
    'gallop': ['horse', 'hooves', 'galloping'], 'trot': ['horse', 'trotting'],
    'knock': ['door'], 'splash': ['water'],
    'fire': ['flame', 'flames', 'crackling'], 'rain': ['drizzle', 'downpour'],
    'spell': ['magic', 'cast'], 'heal': ['healing', 'magic'],
    'sword': ['blade'], 'arrow': ['bow'], 'bow': ['arrow', 'bowstring'],
    'gun': ['gunshot', 'shot'], 'gunshot': ['gun', 'shot'], 'punch': ['hit', 'impact'],
    'bell': ['bells', 'chime', 'toll'], 'clock': ['tick', 'tock'],
    'zombie': ['undead'], 'dragon': ['creature'],
    'wolf': ['wolves', 'howl'], 'cat': ['meow'],
    'dog': ['bark', 'barking'], 'horse': ['gallop', 'galloping', 'hooves', 'whinny'],
    'bird': ['birds', 'chirp', 'chirping'], 'owl': ['hoot'],
    'crow': ['caw', 'raven'], 'cow': ['moo'],
    'ocean': ['sea', 'waves'], 'sea': ['ocean', 'waves'], 'waves': ['wave', 'ocean', 'sea'],
    'explosion': ['blast', 'boom'], 'wind': ['windy', 'gust', 'breeze'],
    'large': ['big', 'huge', 'heavy'], 'big': ['large', 'huge'], 'small': ['little', 'tiny'],
};

const TFIDF_STOP = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'in', 'on', 'at', 'to', 'with', 'sound', 'sounds', 'sfx', 'effect', 'noise']);
// Modifiers describe a sound; they should never decide which sound it is.
const TFIDF_MODIFIERS = new Set(['large', 'big', 'huge', 'massive', 'giant', 'small', 'little', 'tiny', 'heavy', 'light', 'loud', 'quiet', 'soft', 'gentle', 'distant', 'close', 'near', 'far', 'slow', 'fast', 'quick', 'deep', 'low', 'high', 'long', 'short', 'old', 'dark', 'bright', 'single', 'double', 'multiple', 'several']);

function tokenWordSet(text) {
    const out = new Set();
    for (const w of String(text || '').toLowerCase().split(/[^a-z0-9']+/)) {
        if (!w) continue;
        out.add(w);
        // Store stems too so "crashing" in a query meets "crash" in a name.
        for (const stem of inflectionCandidates(w)) out.add(stem);
    }
    return out;
}

/**
 * Catalog search for a short descriptive query ("heavy rain", "sword draw").
 *
 * Precision rules, in order of importance:
 *  1. At least one ORIGINAL query word must appear in the sound's name or
 *     keywords; synonyms alone never qualify a sound.
 *  2. Queries of three or more words must cover at least half of their words,
 *     so transcript fragments like "police officer entered room" do not land
 *     on a siren just because "police" matched.
 *  3. Rare words (IDF) and name hits outrank common words and keyword hits;
 *     among equals the shorter, more specific name wins.
 *
 * @param {string} query
 * @param {string} type 'music' | 'ambience' | 'sfx'
 * @param {Array} files savedSounds.files array
 * @returns {Object|null} best matching file object or null
 */
export function tfidfMatch(query, type, files) {
    if (!query || !files?.length) return null;

    const base = String(query).toLowerCase().replace(/[-_]/g, ' ').replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!base) return null;
    const rawTokens = base.split(' ').filter(Boolean);
    const tokens = rawTokens.filter((t) => !TFIDF_STOP.has(t));
    if (!tokens.length) return null;
    // Long queries with no sound/action word read like transcript fragments.
    if (type === 'sfx' && tokens.length >= 3) {
        const hasAction = SFX_QUERY_ACTION_RE.test(base)
            || tokens.some((t) => inflectionCandidates(t).some((stem) => SFX_QUERY_ACTION_RE.test(stem)));
        if (!hasAction) return null;
    }

    const candidates = files.filter((f) => {
        if (type === 'music') return f.type === 'music';
        if (type === 'ambience') return f.type === 'ambience';
        return f.type === 'sfx';
    });
    if (!candidates.length) return null;

    // Query terms: original words (and their stems) at full weight, synonyms at half.
    // Originals are registered first so a later query word ("toll" in
    // "bell toll") is never demoted to a synonym of an earlier one.
    const terms = new Map(); // term -> { weight, original, group }
    tokens.forEach((t, group) => {
        const weight = TFIDF_MODIFIERS.has(t) ? 0.4 : 1;
        for (const stem of inflectionCandidates(t)) {
            if (!terms.has(stem)) terms.set(stem, { weight, original: true, group });
        }
    });
    tokens.forEach((t, group) => {
        for (const syn of QUERY_SYNONYMS[t] || []) {
            if (!terms.has(syn)) terms.set(syn, { weight: 0.5, original: false, group });
        }
    });

    const docs = candidates.map((f) => ({
        file: f,
        nameWords: tokenWordSet(f.name),
        keywordWords: tokenWordSet((Array.isArray(f.keywords) ? f.keywords : []).join(' ')),
        nameLength: String(f.name || '').split(/\s+/).filter(Boolean).length,
    }));

    const df = new Map();
    for (const doc of docs) {
        for (const term of terms.keys()) {
            if (doc.nameWords.has(term) || doc.keywordWords.has(term)) df.set(term, (df.get(term) || 0) + 1);
        }
    }
    const N = docs.length;
    const idf = (term) => Math.log((N + 1) / ((df.get(term) || 0) + 1)) + 0.1;

    const groupsNeeded = tokens.length >= 3 ? Math.ceil(tokens.length / 2) : 1;
    let best = null;
    let bestScore = 0;
    let bestCovered = 0;

    for (const doc of docs) {
        // One contribution per query word (its best stem or synonym), so a name
        // containing "howling" is not scored twice for both "howling" and "howl".
        const originalBest = new Map();
        const synonymBest = new Map();
        for (const [term, meta] of terms) {
            const inName = doc.nameWords.has(term);
            const inKeywords = !inName && doc.keywordWords.has(term);
            if (!inName && !inKeywords) continue;
            // Synonyms are hints: cap their rarity bonus so an unusual synonym
            // cannot outweigh a real query word.
            const termIdf = meta.original ? idf(term) : Math.min(idf(term), 1);
            const contribution = meta.weight * termIdf * (inName ? 1.5 : 1);
            const bucket = meta.original ? originalBest : synonymBest;
            if (contribution > (bucket.get(meta.group) || 0)) bucket.set(meta.group, contribution);
        }
        const coveredGroups = new Set(originalBest.keys());
        if (coveredGroups.size < groupsNeeded) continue;

        let score = 0;
        for (const v of originalBest.values()) score += v;
        for (const [group, v] of synonymBest) if (!originalBest.has(group)) score += v;

        const coverage = coveredGroups.size / tokens.length;
        score *= 0.5 + 0.5 * coverage;
        const name = String(doc.file.name || '').toLowerCase();
        if (name === base) score += 3;
        else if (base.length > 3 && name.includes(base)) score += 1;
        // Prefer concise names: "big explosion" over a twenty word library title.
        score /= 1 + 0.08 * Math.max(0, doc.nameLength - tokens.length);

        // A sound that matches more of the query's own words always wins;
        // score only orders sounds with equal coverage.
        const better = coveredGroups.size > bestCovered
            || (coveredGroups.size === bestCovered && score > bestScore);
        if (better) {
            bestScore = score;
            bestCovered = coveredGroups.size;
            best = doc.file;
        }
    }

    // Coverage already guarantees at least one real query word matched, so no
    // absolute score floor is needed (it would reject tiny catalogs where IDF
    // collapses toward zero).
    return best;
}
