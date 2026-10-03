import { describe, expect, it } from 'vitest';
import {
  nextRecognitionRestartDelay,
  wasHealthyRecognitionSession,
  RECOGNITION_RESTART_BASE_MS,
  RECOGNITION_RESTART_MAX_MS,
  RECOGNITION_HEALTHY_SESSION_MS,
} from '../lib/modules/recognition-restart.js';

describe('nextRecognitionRestartDelay', () => {
  it('restarts quickly after a healthy session', () => {
    expect(nextRecognitionRestartDelay(0)).toBe(RECOGNITION_RESTART_BASE_MS);
  });

  it('doubles per consecutive failure and caps', () => {
    expect(nextRecognitionRestartDelay(1)).toBe(1000);
    expect(nextRecognitionRestartDelay(2)).toBe(2000);
    expect(nextRecognitionRestartDelay(3)).toBe(4000);
    expect(nextRecognitionRestartDelay(4)).toBe(8000);
    expect(nextRecognitionRestartDelay(5)).toBe(RECOGNITION_RESTART_MAX_MS);
    expect(nextRecognitionRestartDelay(50)).toBe(RECOGNITION_RESTART_MAX_MS);
  });

  it('tolerates garbage input', () => {
    expect(nextRecognitionRestartDelay(-4)).toBe(RECOGNITION_RESTART_BASE_MS);
    expect(nextRecognitionRestartDelay(NaN)).toBe(RECOGNITION_RESTART_BASE_MS);
    expect(nextRecognitionRestartDelay(undefined)).toBe(RECOGNITION_RESTART_BASE_MS);
  });
});

describe('wasHealthyRecognitionSession', () => {
  it('counts any session that produced results as healthy', () => {
    expect(wasHealthyRecognitionSession(1000, 1100, true)).toBe(true);
    expect(wasHealthyRecognitionSession(0, 1100, true)).toBe(true);
  });

  it('counts a long lived silent session as healthy, a short one as a failure', () => {
    const start = 10_000;
    expect(wasHealthyRecognitionSession(start, start + RECOGNITION_HEALTHY_SESSION_MS, false)).toBe(true);
    expect(wasHealthyRecognitionSession(start, start + RECOGNITION_HEALTHY_SESSION_MS - 1, false)).toBe(false);
  });

  it('treats a session that never started as a failure', () => {
    expect(wasHealthyRecognitionSession(0, 99_999, false)).toBe(false);
  });
});
