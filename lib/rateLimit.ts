type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const STALE_GRACE_MS = 60_000;

function cleanupStaleEntries(): void {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (now > bucket.resetAt + STALE_GRACE_MS) {
      store.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(cleanupStaleEntries, CLEANUP_INTERVAL_MS);
}

/**
 * Fixed-window rate limiter. Returns true if the request is allowed, false if limited.
 */
export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): boolean {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now >= bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}
