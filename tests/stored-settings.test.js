import { describe, expect, it } from 'vitest';
import { coerceStoredNumber, readStoredNumber } from '../lib/modules/stored-settings.js';

describe('coerceStoredNumber', () => {
  it('returns the fallback for missing, empty, and corrupt values', () => {
    const opts = { fallback: 0.5, min: 0, max: 1 };
    expect(coerceStoredNumber(null, opts)).toBe(0.5);
    expect(coerceStoredNumber(undefined, opts)).toBe(0.5);
    expect(coerceStoredNumber('', opts)).toBe(0.5);
    expect(coerceStoredNumber('abc', opts)).toBe(0.5);
    expect(coerceStoredNumber('NaN', opts)).toBe(0.5);
    expect(coerceStoredNumber('Infinity', opts)).toBe(0.5);
    expect(coerceStoredNumber('undefined', opts)).toBe(0.5);
  });

  it('parses valid values and clamps to range', () => {
    const opts = { fallback: 0.5, min: 0, max: 1 };
    expect(coerceStoredNumber('0.25', opts)).toBe(0.25);
    expect(coerceStoredNumber('1.7', opts)).toBe(1);
    expect(coerceStoredNumber('-3', opts)).toBe(0);
    expect(coerceStoredNumber('0', opts)).toBe(0);
  });

  it('supports integer settings', () => {
    const opts = { fallback: 3000, min: 0, max: 60000, integer: true };
    expect(coerceStoredNumber('4500', opts)).toBe(4500);
    expect(coerceStoredNumber('4500.9', opts)).toBe(4500);
    expect(coerceStoredNumber('999999', opts)).toBe(60000);
    expect(coerceStoredNumber('nope', opts)).toBe(3000);
  });
});

describe('readStoredNumber', () => {
  it('reads through a Storage like object and never throws', () => {
    const storage = { getItem: (k) => (k === 'ok' ? '0.9' : k === 'bad' ? '{}' : null) };
    const opts = { fallback: 0.5, min: 0, max: 1 };
    expect(readStoredNumber(storage, 'ok', opts)).toBe(0.9);
    expect(readStoredNumber(storage, 'bad', opts)).toBe(0.5);
    expect(readStoredNumber(storage, 'missing', opts)).toBe(0.5);
    expect(readStoredNumber(null, 'ok', opts)).toBe(0.5);
    expect(readStoredNumber({ getItem() { throw new Error('denied'); } }, 'ok', opts)).toBe(0.5);
  });
});
