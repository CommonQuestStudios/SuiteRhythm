import { describe, expect, it } from 'vitest';
import {
  buildTriggerMap,
  findTriggerMatches,
  inflectionCandidates,
  resolveTriggerKeyword,
  shouldTriggerKeyword,
} from '../lib/modules/trigger-system.js';

const triggerMap = buildTriggerMap({ files: [] });
const queries = (text, opts) => findTriggerMatches(text, triggerMap, opts).map((m) => m.config.query);

describe('inflection aware keyword lookup', () => {
  it('maps common past tense and plural forms back to trigger keys', () => {
    expect(resolveTriggerKeyword('slammed', triggerMap)).toBe('slam');
    expect(resolveTriggerKeyword('shattered', triggerMap)).toBe('shatter');
    expect(resolveTriggerKeyword('creaked', triggerMap)).toBe('creak');
    expect(resolveTriggerKeyword('galloped', triggerMap)).toBe('gallop');
    expect(resolveTriggerKeyword('crashes', triggerMap)).toBe('crash');
    expect(resolveTriggerKeyword('guns', triggerMap)).toBe('gun');
    expect(resolveTriggerKeyword('cried', triggerMap)).toBe('cry');
    expect(resolveTriggerKeyword('hissed', triggerMap)).toBe('hiss');
  });

  it('prefers an exact key over a stem', () => {
    expect(resolveTriggerKeyword('fired', triggerMap)).toBe('fired');
    expect(resolveTriggerKeyword('barking', triggerMap)).toBe('barking');
  });

  it('does not invent stems for short closed syllables or unrelated words', () => {
    expect(inflectionCandidates('cared')).not.toContain('car');
    expect(resolveTriggerKeyword('cared', triggerMap)).toBeNull();
    expect(resolveTriggerKeyword('ward', triggerMap)).toBeNull();
    expect(resolveTriggerKeyword('string', triggerMap)).toBeNull();
    expect(resolveTriggerKeyword('this', triggerMap)).toBeNull();
    expect(resolveTriggerKeyword('was', triggerMap)).toBeNull();
  });
});

describe('findTriggerMatches', () => {
  it('fires past tense events the old exact word scan missed', () => {
    expect(queries('The door slammed shut behind them.')).toEqual(['door slam']);
    expect(queries('Glass shattered across the floor.')).toEqual(['glass shatter']);
    expect(queries('The old floorboards creaked.')).toEqual(['door creak']);
  });

  it('never fires the same file twice in one sentence and keeps sentence order', () => {
    const matches = findTriggerMatches('The dog barked as the bomb exploded nearby.', triggerMap, { max: 2 });
    const files = matches.map((m) => m.config.file);
    expect(new Set(files).size).toBe(files.length);
    // "bomb" and "exploded" share big_explosion.mp3, so only the first fires.
    expect(matches.map((m) => m.config.query)).toEqual(['dog bark', 'explosion']);
  });

  it('lets a cooldown on one keyword block sibling keywords for the same file', () => {
    const skip = (keyword) => keyword === 'dog';
    expect(queries('The dog barked.', { skip })).toEqual([]);
  });

  it('honors the synonym map', () => {
    const synonyms = new Map([['hound', 'dog']]);
    expect(queries('The hound barked at the gate.', { synonyms })).toEqual(['dog bark']);
  });
});

describe('negation and ceased phrasing', () => {
  it('blocks negated sound mentions', () => {
    expect(shouldTriggerKeyword('gunshot', 'There was no gunshot, only silence.', triggerMap.gunshot)).toBe(false);
    expect(shouldTriggerKeyword('thunder', 'She never heard the thunder.', triggerMap.thunder)).toBe(false);
    expect(shouldTriggerKeyword('bark', 'Not a single bark came from the dog.', triggerMap.bark)).toBe(false);
    expect(shouldTriggerKeyword('scream', 'Without a scream he fell.', triggerMap.scream)).toBe(false);
    expect(shouldTriggerKeyword('rain', 'It was no longer raining.', triggerMap.rain)).toBe(false);
  });

  it('blocks sounds that the narration says have stopped', () => {
    expect(shouldTriggerKeyword('rain', 'The rain had finally stopped.', triggerMap.rain)).toBe(false);
    expect(shouldTriggerKeyword('thunder', 'The thunder faded into the distance.', triggerMap.thunder)).toBe(false);
    expect(shouldTriggerKeyword('siren', 'The sirens died down at last.', triggerMap.siren)).toBe(false);
  });

  it('does not over apply negation across unrelated words', () => {
    expect(shouldTriggerKeyword('gunshot', 'Not long after the gunshot rang out they ran.', triggerMap.gunshot)).toBe(true);
    expect(shouldTriggerKeyword('train', 'The train passed with a long whistle.', triggerMap.train)).toBe(true);
  });

  it('treats "the dog was barking" as a live sound, not a static mention', () => {
    expect(shouldTriggerKeyword('dog', 'The dog was barking at the mailman.', triggerMap.dog)).toBe(true);
    expect(shouldTriggerKeyword('dog', 'The dog was asleep by the fire.', triggerMap.dog)).toBe(false);
  });
});

describe('context exclusions and refined gates', () => {
  it('keeps glass crash out of water and figurative crashes', () => {
    expect(queries('Waves crashed against the hull.')).toEqual(['waves shore']);
    expect(queries('The stock market crashed that morning.')).toEqual([]);
    expect(queries('The glass crashed to the floor.')).toEqual(['glass crash']);
  });

  it('only plays a shield block for a combat block', () => {
    expect(queries('He blocked the road with his cart.')).toEqual([]);
    expect(queries('He blocked the blow with his shield.')).toEqual(['shield block']);
  });

  it('does not stack a sword clash on top of a sword draw', () => {
    expect(queries('He drew his sword and stepped forward.')).toEqual(['draw sword']);
    expect(queries('Their swords clashed in the dark.')).toEqual(['swords fighting']);
  });

  it('needs an audible car action for the car keyword', () => {
    expect(queries('The car sat in the driveway.')).toEqual([]);
    expect(queries('The car sped away down the street.')).toEqual(['car engine']);
  });

  it('recognises common narrated evidence for rain, heart, clock and bells', () => {
    expect(queries('Rain hammered the roof all night long.')).toEqual(['rain']);
    expect(queries('Her heart was pounding in her chest.')).toEqual(['heartbeat']);
    expect(queries('The old clock ticked away in the corner.')).toEqual(['tick tock']);
    expect(queries('The bells of the chapel rang out across the valley.')).toEqual(['bell chime']);
  });
});
