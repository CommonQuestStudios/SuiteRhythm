/**
 * fetch() with a hard deadline. Serverless routes that call third party
 * providers must never wait on a hung upstream until the platform kills
 * the function, so every outbound provider call goes through here.
 */
export async function fetchWithTimeout(url, init = {}, timeoutMs = 20_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const upstreamSignal = init.signal;
  const onUpstreamAbort = () => controller.abort();
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener('abort', onUpstreamAbort, { once: true });
  }
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted && !upstreamSignal?.aborted) {
      const timeoutError = new Error(`Upstream request timed out after ${timeoutMs}ms`);
      timeoutError.name = 'TimeoutError';
      timeoutError.cause = err;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    upstreamSignal?.removeEventListener?.('abort', onUpstreamAbort);
  }
}

export function isTimeoutError(err) {
  return err?.name === 'TimeoutError' || err?.name === 'AbortError';
}
