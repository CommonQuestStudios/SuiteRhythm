import { describe, expect, it } from 'vitest';
import { getStaticSoundFiles } from '../lib/server-catalog.js';
import { tfidfMatch } from '../lib/modules/trigger-system.js';
import { MODE_PRELOAD_SETS, MODE_STINGERS } from '../lib/modules/ai-director.js';
import {
  normalizeSavedSoundForSearch,
  normalizeSoundForApi,
  normalizeSoundRecord,
  normalizeSoundType,
} from '../lib/sound-catalog.js';

describe('sound catalog normalization', () => {
  it('preserves ambience as its own sound type', () => {
    expect(normalizeSoundType('ambience')).toBe('ambience');
    expect(normalizeSoundType('ambient')).toBe('ambience');
  });

  describe('curated sound metadata', () => {
    const biteFile = 'sounds/wolf-attack-snarl-bite.mp3';

    it('excludes the silent wasteland ambience recording', () => {
      const files = getStaticSoundFiles();
      expect(files.some((sound) =>
        sound.name === 'wasteland wind ruins ambience'
        || sound.file === 'sounds/wasteland-wind-ruins-ambience.mp3'
      )).toBe(false);
    });

    it('excludes the rejected tornado recording', () => {
      const files = getStaticSoundFiles();
      expect(files.some((sound) =>
        sound.name === 'tornado roar'
        || sound.file === 'sounds/tornado-roar.mp3'
      )).toBe(false);
    });

    it('excludes both rejected air raid siren recordings', () => {
      const files = getStaticSoundFiles();
      for (const slug of ['air-raid-siren-single-wail', 'air-raid-siren-warning']) {
        expect(files.some((sound) =>
          sound.name === slug.replaceAll('-', ' ')
          || sound.file === `sounds/${slug}.mp3`
        )).toBe(false);
      }
    });

    it('excludes the rejected bow draw release recording', () => {
      const files = getStaticSoundFiles();
      expect(files.some((sound) =>
        sound.name === 'bow draw release'
        || sound.file === 'sounds/bow-draw-release.mp3'
      )).toBe(false);
    });

    it('labels the torch recording as a whoosh rather than crackling', () => {
      const files = getStaticSoundFiles();
      const torchFile = 'sounds/torch-crackle.mp3';
      const torch = files.find((sound) => sound.file === torchFile);

      expect(torch).toMatchObject({
        type: 'sfx',
        name: 'torch whoosh',
        keywords: expect.arrayContaining(['torch', 'whoosh', 'flame', 'fire']),
      });
      for (const tag of ['crackle', 'crackling', 'flickering', 'magical', 'arcane', 'magic']) {
        expect(torch.keywords).not.toContain(tag);
      }
      expect(files.some((sound) => sound.name === 'torch crackle')).toBe(false);
      for (const query of ['torch whoosh', 'torch woosh']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).toBe(torchFile);
      }
      for (const query of ['torch crackle', 'torch crackling', 'fire crackling']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).not.toBe(torchFile);
      }
    });

    it('preloads the renamed torch effect without using it as periodic fire ambience', () => {
      expect(MODE_PRELOAD_SETS.dnd).toContain('torch whoosh');
      expect(MODE_PRELOAD_SETS.dnd).not.toContain('torch crackle');
      expect(MODE_STINGERS.dnd).toContain('fire crackling professional');
      expect(MODE_STINGERS.dnd).not.toContain('torch crackle');
      expect(MODE_STINGERS.dnd).not.toContain('torch whoosh');
    });

    it('labels the shop alarm without tornado or siren tags', () => {
      const files = getStaticSoundFiles();
      const alarmFile = 'sounds/tornado-civil-defense-siren.mp3';
      const alarm = files.find((sound) => sound.file === alarmFile);

      expect(alarm).toMatchObject({
        type: 'sfx',
        name: 'shop security alarm',
        keywords: expect.arrayContaining(['shop', 'store', 'alarm', 'security']),
      });
      for (const tag of ['tornado', 'twister', 'cyclone', 'siren', 'sirens', 'storm', 'weather', 'civil', 'defense']) {
        expect(alarm.keywords).not.toContain(tag);
      }
      expect(files.some((sound) => sound.name === 'tornado civil defense siren')).toBe(false);
      for (const query of ['shop alarm', 'store alarm', 'burglar alarm']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).toBe(alarmFile);
      }
    });

    it('selects the supplied non-looping recording for tornado siren searches', () => {
      const files = getStaticSoundFiles();
      const sirenFile = 'sounds/tornado-sirens.mp3';
      expect(files.filter((sound) => sound.file === sirenFile)).toHaveLength(1);
      expect(files.find((sound) => sound.file === sirenFile)).toMatchObject({
        type: 'sfx',
        name: 'tornado siren warning',
        keywords: expect.arrayContaining(['tornado', 'siren', 'warning', 'civil', 'defense']),
        loop: false,
      });
      for (const query of ['tornado siren', 'tornado sirens', 'tornado civil defense siren', 'twister siren']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).toBe(sirenFile);
      }
    });

    it('labels the human bite recording as food foley while preserving its audio key', () => {
      const files = getStaticSoundFiles();
      const bite = files.find((sound) => sound.file === biteFile);

      expect(bite).toMatchObject({
        type: 'sfx',
        name: 'human taking a bite',
        keywords: expect.arrayContaining(['human', 'bite', 'eating', 'food', 'foley']),
      });
      for (const tag of ['wolf', 'attack', 'snarl', 'lunge', 'beast', 'danger', 'canine', 'combat']) {
        expect(bite.keywords).not.toContain(tag);
      }
      expect(files.some((sound) => sound.name === 'wolf attack snarl bite')).toBe(false);
      for (const query of ['human bite', 'chomp']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).toBe(biteFile);
      }
    });

    it('does not select the human bite recording for wolf attacks or snarls', () => {
      const files = getStaticSoundFiles();
      for (const query of ['wolf attack', 'wolf snarl', 'wolf attack snarl bite']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).not.toBe(biteFile);
      }
    });

    it('labels the foliage recording as rustling rather than water pouring', () => {
      const files = getStaticSoundFiles();
      const foliageFile = 'sounds/watering-can-pour.mp3';
      const foliage = files.find((sound) => sound.file === foliageFile);

      expect(foliage).toMatchObject({
        type: 'sfx',
        name: 'foliage rustling',
        keywords: expect.arrayContaining(['foliage', 'rustling', 'leaves', 'weeds']),
      });
      for (const tag of ['watering', 'can', 'pour', 'water', 'sprinkle']) {
        expect(foliage.keywords).not.toContain(tag);
      }
      expect(files.some((sound) => sound.name === 'watering can pour')).toBe(false);
      for (const query of ['foliage rustling', 'weeds rustling']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).toBe(foliageFile);
      }
      expect(tfidfMatch('leaves rustle', 'sfx', files)).toMatchObject({
        keywords: expect.arrayContaining(['leaves', 'rustle']),
      });
      for (const query of ['watering can pour', 'water pour']) {
        expect(tfidfMatch(query, 'sfx', files)?.file).not.toBe(foliageFile);
      }
    });
  });

  it('falls back unknown sound types to sfx', () => {
    expect(normalizeSoundType('music')).toBe('music');
    expect(normalizeSoundType('')).toBe('sfx');
    expect(normalizeSoundType('voice')).toBe('sfx');
  });

  it('normalizes static, API, and studio sound records into the client catalog shape', () => {
    expect(normalizeSoundRecord({ type: 'ambience', name: 'Rain Room', file: 'rain.mp3', keywords: ['rain'] })).toEqual({
      id: 'rain.mp3',
      type: 'ambience',
      name: 'Rain Room',
      src: 'rain.mp3',
      tags: ['rain'],
      loop: true,
    });

    expect(normalizeSoundRecord({ type: 'sfx', src: 'hit.wav', tags: ['impact'] })).toMatchObject({
      id: 'hit.wav',
      type: 'sfx',
      name: 'hit.wav',
      src: 'hit.wav',
      tags: ['impact'],
      loop: false,
    });
  });

  it('normalizes API and local-search catalog shapes from the same source rules', () => {
    const source = { type: 'ambient', name: 'Forest Night', src: 'forest.mp3', tags: ['Forest', 'Night'] };

    expect(normalizeSoundForApi(source)).toEqual({
      type: 'ambience',
      name: 'Forest Night',
      file: 'forest.mp3',
      keywords: ['Forest', 'Night'],
      loop: true,
    });

    expect(normalizeSavedSoundForSearch(source)).toEqual({
      type: 'ambience',
      name: 'forest night',
      file: 'forest.mp3',
      keywords: ['forest', 'night'],
    });
  });
});
