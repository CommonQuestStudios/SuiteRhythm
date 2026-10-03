import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, getClientIp, resetRateLimitsForTests } from '../lib/rate-limit.js';

function requestFor(ip) {
    return new Request('https://example.test/api', {
        headers: { 'x-forwarded-for': ip },
    });
}

function requestWith(headers) {
    return new Request('https://example.test/api', { headers });
}

describe('getClientIp', () => {
    it('prefers proxy set headers over the client controlled x-forwarded-for chain', () => {
        expect(getClientIp(requestWith({
            'x-forwarded-for': 'spoofed.attacker, 203.0.113.9',
            'x-vercel-forwarded-for': '203.0.113.9',
        }))).toBe('203.0.113.9');
        expect(getClientIp(requestWith({
            'x-forwarded-for': 'spoofed.attacker',
            'x-real-ip': '198.51.100.4',
        }))).toBe('198.51.100.4');
        expect(getClientIp(requestWith({ 'cf-connecting-ip': '192.0.2.7' }))).toBe('192.0.2.7');
    });

    it('falls back to the first x-forwarded-for hop and then null', () => {
        expect(getClientIp(requestWith({ 'x-forwarded-for': '10.0.0.1, 10.0.0.2' }))).toBe('10.0.0.1');
        expect(getClientIp(requestWith({}))).toBeNull();
    });
});

describe('rate-limit', () => {
    beforeEach(() => resetRateLimitsForTests());

    it('cannot be bypassed by rotating a spoofed x-forwarded-for when the proxy supplies the real IP', () => {
        const options = { namespace: 'spoof', limit: 1, windowMs: 60_000 };
        const real = { 'x-vercel-forwarded-for': '203.0.113.9' };
        expect(checkRateLimit(requestWith({ ...real, 'x-forwarded-for': '1.1.1.1' }), options).allowed).toBe(true);
        expect(checkRateLimit(requestWith({ ...real, 'x-forwarded-for': '2.2.2.2' }), options).allowed).toBe(false);
    });

    it('allows requests up to the configured limit', () => {
        const options = { namespace: 'test', limit: 2, windowMs: 60_000 };

        expect(checkRateLimit(requestFor('1.2.3.4'), options).allowed).toBe(true);
        expect(checkRateLimit(requestFor('1.2.3.4'), options).allowed).toBe(true);
        expect(checkRateLimit(requestFor('1.2.3.4'), options).allowed).toBe(false);
    });

    it('isolates buckets by namespace and IP', () => {
        const options = { namespace: 'a', limit: 1, windowMs: 60_000 };

        expect(checkRateLimit(requestFor('1.2.3.4'), options).allowed).toBe(true);
        expect(checkRateLimit(requestFor('5.6.7.8'), options).allowed).toBe(true);
        expect(checkRateLimit(requestFor('1.2.3.4'), { ...options, namespace: 'b' }).allowed).toBe(true);
    });
});
