interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

const PRUNE_INTERVAL_MS = 5 * 60 * 1000;
let lastPrunedAt = Date.now();

const pruneExpiredRecords = (now: number) => {
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS && rateLimitMap.size < 2000) {
    return;
  }
  lastPrunedAt = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
};

export interface RateLimitResult {
  remaining: number;
  resetAt: number;
  success: boolean;
}

export const checkRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult => {
  const now = Date.now();
  pruneExpiredRecords(now);

  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return {
      remaining: maxRequests - 1,
      resetAt,
      success: true,
    };
  }

  if (record.count >= maxRequests) {
    return {
      remaining: 0,
      resetAt: record.resetAt,
      success: false,
    };
  }

  record.count += 1;
  return {
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
    success: true,
  };
};
