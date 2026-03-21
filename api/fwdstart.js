// api/fwdstart.js
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(.*\.)?worldmonitor\.app$/,
  /^https:\/\/worldmonitor-[a-z0-9-]+-elie-[a-z0-9]+\.vercel\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/tauri\.localhost(:\d+)?$/,
  /^https?:\/\/[a-z0-9-]+\.tauri\.localhost(:\d+)?$/i,
  /^tauri:\/\/localhost$/,
  /^asset:\/\/localhost$/
];
function isAllowedOrigin(origin) {
  return Boolean(origin) && ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}
function getCorsHeaders(req, methods = "GET, OPTIONS") {
  const origin = req.headers.get("origin") || "";
  const allowOrigin = isAllowedOrigin(origin) ? origin : "https://worldmonitor.app";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WorldMonitor-Key",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}
function isDisallowedOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return !isAllowedOrigin(origin);
}
function sanitizeJsonValue(value, depth = 0) {
  if (depth > 20) return "[truncated]";
  if (value instanceof Error) {
    return { error: value.message };
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (value && typeof value === "object") {
    const clone = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key === "stack" || key === "stackTrace" || key === "cause") continue;
      clone[key] = sanitizeJsonValue(nested, depth + 1);
    }
    return clone;
  }
  return value;
}
function jsonResponse(body, status, headers = {}) {
  return new Response(JSON.stringify(sanitizeJsonValue(body)), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}
const config = { runtime: "edge" };
async function handler(req) {
  const cors = getCorsHeaders(req);
  if (isDisallowedOrigin(req)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, cors);
  }
  try {
    const response = await fetch("https://www.fwdstart.me/archive", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const items = [];
    const seenUrls = /* @__PURE__ */ new Set();
    const slideBlocks = html.split("embla__slide");
    for (const block of slideBlocks) {
      const urlMatch = block.match(/href="(\/p\/[^"]+)"/);
      if (!urlMatch) continue;
      const url = `https://www.fwdstart.me${urlMatch[1]}`;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      const altMatch = block.match(/alt="([^"]+)"/);
      const title = altMatch ? altMatch[1] : "";
      if (!title || title.length < 5) continue;
      const dateMatch = block.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{4})/i);
      let pubDate = /* @__PURE__ */ new Date();
      if (dateMatch) {
        const dateStr = `${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`;
        const parsed = new Date(dateStr);
        if (!Number.isNaN(parsed.getTime())) {
          pubDate = parsed;
        }
      }
      let description = "";
      const subtitleMatch = block.match(/line-clamp-3[^>]*>.*?<span[^>]*>([^<]{20,})<\/span>/s);
      if (subtitleMatch) {
        description = subtitleMatch[1].trim();
      }
      items.push({ title, link: url, date: pubDate.toISOString(), description });
    }
    const rssItems = items.slice(0, 30).map((item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <guid>${item.link}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description><![CDATA[${item.description}]]></description>
      <source url="https://www.fwdstart.me">FwdStart Newsletter</source>
    </item>`).join("");
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FwdStart Newsletter</title>
    <link>https://www.fwdstart.me</link>
    <description>Forward-thinking startup and VC news from MENA and beyond</description>
    <language>en-us</language>
    <lastBuildDate>${(/* @__PURE__ */ new Date()).toUTCString()}</lastBuildDate>
    <atom:link href="https://worldmonitor.app/api/fwdstart" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;
    return new Response(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        ...cors,
        "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    console.error("FwdStart scraper error:", error);
    return jsonResponse({
      error: "Failed to fetch FwdStart archive",
      details: error.message
    }, 502, cors);
  }
}
export {
  config,
  handler as default
};
