/**
 * Restart scheduling for the Web Speech API session.
 *
 * Chrome ends a continuous recognition session on its own every few minutes
 * and on any `network` error. Restarting immediately is right when the last
 * session was healthy, but a persistent failure (speech service unreachable,
 * captive portal, mic revoked by the OS) must not become a tight loop that
 * burns CPU and battery while spamming the console. Delay grows per
 * consecutive failed attempt and resets once a session actually produces
 * audio or results.
 */

export const RECOGNITION_RESTART_BASE_MS = 500;
export const RECOGNITION_RESTART_MAX_MS = 15_000;
// A session that lived at least this long counts as healthy.
export const RECOGNITION_HEALTHY_SESSION_MS = 5_000;

/**
 * @param {number} consecutiveFailures  0 for the first restart after a healthy session
 * @returns {number} milliseconds to wait before calling recognition.start()
 */
export function nextRecognitionRestartDelay(consecutiveFailures) {
    const n = Math.max(0, Math.floor(Number(consecutiveFailures) || 0));
    const delay = RECOGNITION_RESTART_BASE_MS * (2 ** n);
    return Math.min(RECOGNITION_RESTART_MAX_MS, delay);
}

/**
 * Decide whether the session that just ended should reset the failure count.
 * @param {number} startedAt  timestamp from onstart, 0 if it never started
 * @param {number} endedAt
 * @param {boolean} producedResults  true if any onresult fired this session
 */
export function wasHealthyRecognitionSession(startedAt, endedAt, producedResults) {
    if (producedResults) return true;
    if (!startedAt) return false;
    return (endedAt - startedAt) >= RECOGNITION_HEALTHY_SESSION_MS;
}
