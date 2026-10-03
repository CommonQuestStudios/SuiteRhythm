export function normalizeSoundType(type) {
  const value = String(type || '').trim().toLowerCase();
  if (value === 'music') return 'music';
  if (value === 'ambience' || value === 'ambient') return 'ambience';
  return 'sfx';
}

export function normalizeSoundTags(sound) {
  if (Array.isArray(sound?.keywords)) return sound.keywords;
  if (Array.isArray(sound?.tags)) return sound.tags;
  return [];
}

export function normalizeSoundSource(sound) {
  return String(sound?.file || sound?.src || sound?.dataUrl || '').trim();
}

/**
 * Loose comparison key for catalog names. The AI and phrase tables refer to
 * sounds by name, and small drift (casing, commas, a library prefix such as
 * "ES_", doubled spaces) must still resolve to the same catalog entry.
 */
export function normalizeSoundName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.(mp3|wav|ogg|flac|m4a|aac|webm)$/i, '')
    .replace(/^es_/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeSoundRecord(sound) {
  const type = normalizeSoundType(sound?.type);
  const src = normalizeSoundSource(sound);
  const name = String(sound?.name || src || 'Untitled sound').trim();

  return {
    id: String(sound?.id || src || name).trim(),
    type,
    name,
    src,
    tags: normalizeSoundTags(sound),
    loop: type === 'music' || type === 'ambience' || !!sound?.loop,
  };
}

export function normalizeSoundForApi(sound) {
  const normalized = normalizeSoundRecord(sound);
  return {
    type: normalized.type,
    name: normalized.name,
    file: normalized.src,
    keywords: normalizeSoundTags(sound),
    loop: normalized.loop,
  };
}

export function normalizeSavedSoundForSearch(sound) {
  const normalized = normalizeSoundRecord(sound);
  return {
    type: normalized.type,
    name: normalized.name.toLowerCase(),
    file: normalized.src,
    keywords: normalized.tags.map((keyword) => String(keyword || '').toLowerCase()),
  };
}
