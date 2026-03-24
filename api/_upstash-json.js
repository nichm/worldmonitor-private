export async function readJsonFromUpstash(key, timeoutMs = 3_000) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const resp = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) return null;

  const data = await resp.json();
  if (!data.result) return null;

  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

/**
 * Get cached data by key — returns parsed JSON or null
 */
export async function getCachedData(key) {
  return readJsonFromUpstash(key);
}

/**
 * Set cached data with TTL — stores as JSON string
 */
export async function setCachedData(key, value, ttlSeconds) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  try {
    const pipeline = [
      ["SET", key, JSON.stringify(value)],
      ["EXPIRE", key, String(ttlSeconds)],
    ];
    const resp = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(5000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch with Upstash Redis caching — get from cache, else fetch from source
 */
export async function fetchUpstashJson(key, sourceUrl, ttlSeconds, fetchOpts = {}) {
  const cached = await getCachedData(key);
  if (cached) return cached;

  const resp = await fetch(sourceUrl, { ...fetchOpts, signal: AbortSignal.timeout(15000) });
  if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);

  const data = await resp.json();
  await setCachedData(key, data, ttlSeconds);
  return data;
}
