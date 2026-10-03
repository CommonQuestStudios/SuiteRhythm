import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, isTimeoutError } from '../lib/fetch-with-timeout.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function hangingFetch() {
  return vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      reject(err);
    });
  }));
}

describe('fetchWithTimeout', () => {
  it('resolves normally and clears its timer when the upstream responds in time', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })));
    const res = await fetchWithTimeout('https://upstream.test/', {}, 1000);
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts a hung upstream and surfaces a TimeoutError', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', hangingFetch());
    const pending = fetchWithTimeout('https://upstream.test/', {}, 50);
    const assertion = expect(pending).rejects.toMatchObject({ name: 'TimeoutError' });
    await vi.advanceTimersByTimeAsync(60);
    await assertion;
  });

  it('propagates a caller abort as a plain AbortError, not a timeout', async () => {
    vi.stubGlobal('fetch', hangingFetch());
    const controller = new AbortController();
    const pending = fetchWithTimeout('https://upstream.test/', { signal: controller.signal }, 10_000);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('classifies both timeout and abort errors', () => {
    expect(isTimeoutError({ name: 'TimeoutError' })).toBe(true);
    expect(isTimeoutError({ name: 'AbortError' })).toBe(true);
    expect(isTimeoutError(new Error('boom'))).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
  });
});
