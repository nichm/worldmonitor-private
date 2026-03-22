// api/trca-floods.js
var config = { runtime: "edge" };
var TRCA_RSS_URL = "https://trca.ca/feed/";
var CACHE_TTL = 2 * 60 * 60;
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
function classifyMessageSeverity(title, content) {
  const text = (title + " " + content).toUpperCase();
  if (text.includes("FLOOD WARNING")) {
    return 4;
  }
  if (text.includes("FLOOD WATCH")) {
    return 3;
  }
  if (text.includes("WATER SAFETY STATEMENT")) {
    return 2;
  }
  if (text.includes("WATERSHED CONDITIONS STATEMENT")) {
    return 1;
  }
  return 0;
}
function extractAffectedAreas(title, content) {
  const text = title + " " + content;
  const areas = [];
  const watershedKeywords = [
    "Don River",
    "Humber River",
    "Etobicoke Creek",
    "Rouge River",
    "Highland Creek",
    "Scarborough",
    "Pickering",
    "Ajax",
    "Brampton",
    "Mississauga",
    "Markham",
    "Vaughan",
    "Richmond Hill",
    "Toronto",
    "Lake Ontario",
    "GTA",
    "Credit River",
    "Duffins Creek"
  ];
  for (const keyword of watershedKeywords) {
    if (text.toUpperCase().includes(keyword.toUpperCase())) {
      areas.push(keyword);
    }
  }
  return areas.length > 0 ? areas : null;
}
function parseTrcaRSS(xmlText) {
  const messages = [];
  try {
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    if (!itemMatches) {
      return messages;
    }
    const now = Date.now();
    for (const itemBlock of itemMatches) {
      const titleMatch = itemBlock.match(/<title[^>]*>([^<]+)<\/title>/i);
      const linkMatch = itemBlock.match(/<link[^>]*>([^<]+)<\/link>/i);
      const descriptionMatch = itemBlock.match(
        /<description[^>]*>([^<]+)<\/description>/i
      );
      const pubDateMatch = itemBlock.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
      const contentMatch = itemBlock.match(
        /<content:encoded[^>]*>([^<]*)<\/content:encoded>/i
      );
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
      const link = linkMatch ? decodeHtmlEntities(linkMatch[1].trim()) : "";
      const description = descriptionMatch ? decodeHtmlEntities(descriptionMatch[1].trim()) : "";
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : "";
      const content = contentMatch ? decodeHtmlEntities(contentMatch[1].trim()) : description;
      let pubDate = /* @__PURE__ */ new Date();
      try {
        pubDate = new Date(pubDateStr);
        if (Number.isNaN(pubDate.getTime())) {
          pubDate = /* @__PURE__ */ new Date();
        }
      } catch {
        pubDate = /* @__PURE__ */ new Date();
      }
      const text = (title + " " + content).toLowerCase();
      const floodKeywords = [
        "flood",
        "water level",
        "watershed",
        "stream",
        "river",
        "water safety",
        "normal water",
        "shoreline"
      ];
      const isFloodRelated = floodKeywords.some(
        (keyword) => text.includes(keyword)
      );
      if (!isFloodRelated) {
        continue;
      }
      let messageType = "Message";
      const titleUpper = title.toUpperCase();
      const contentUpper = content.toUpperCase();
      if (titleUpper.includes("NORMAL WATER LEVELS") || contentUpper.includes("NORMAL WATER LEVELS")) {
        messageType = "Normal Water Levels";
      } else if (titleUpper.includes("FLOOD WARNING") || contentUpper.includes("FLOOD WARNING")) {
        messageType = "Flood Warning";
      } else if (titleUpper.includes("FLOOD WATCH") || contentUpper.includes("FLOOD WATCH")) {
        messageType = "Flood Watch";
      } else if (titleUpper.includes("WATER SAFETY STATEMENT") || contentUpper.includes("WATER SAFETY STATEMENT")) {
        messageType = "Water Safety Statement";
      } else if (titleUpper.includes("WATERSHED CONDITIONS STATEMENT") || contentUpper.includes("WATERSHED CONDITIONS STATEMENT")) {
        messageType = "Watershed Conditions Statement";
      }
      const affectedAreas = extractAffectedAreas(title, content);
      const category = messageType === "Normal Water Levels" ? "water_status" : "advisory";
      messages.push({
        id: `trca-${now}-${messages.length}`,
        title,
        description,
        content,
        link,
        messageType,
        severity: classifyMessageSeverity(title, content),
        affectedAreas,
        category,
        pubDate: pubDate.toISOString(),
        timestamp: pubDate.getTime()
      });
    }
    messages.sort((a, b) => {
      if (a.severity !== b.severity) {
        return b.severity - a.severity;
      }
      return b.timestamp - a.timestamp;
    });
  } catch (error) {
    console.error("[TRCA Floods] Parse error:", error);
    throw new Error("Failed to parse RSS feed");
  }
  return messages;
}
function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)).replace(
    /&#x([0-9a-fA-F]+);/g,
    (match, hex) => String.fromCharCode(parseInt(hex, 16))
  );
}
function getSeedFloodMessages() {
  const now = Date.now();
  return [
    {
      id: `trca-seed-1`,
      title: "Normal Water Levels",
      description: "Current water levels across TRCA watersheds are within normal ranges for this time of year.",
      content: "Water levels in all TRCA monitored watercourses are normal. No flood risks are anticipated at this time. Residents are advised to stay informed about changing conditions.",
      link: "https://trca.ca",
      messageType: "Normal Water Levels",
      severity: 0,
      affectedAreas: ["Don River", "Humber River", "Rouge River"],
      category: "water_status",
      pubDate: new Date(now - 2 * 60 * 60 * 1e3).toISOString(),
      timestamp: now - 2 * 60 * 60 * 1e3
    },
    {
      id: `trca-seed-2`,
      title: "Watershed Conditions Statement",
      description: "General watershed conditions statement for the Greater Toronto Area.",
      content: "Current conditions across TRCA watersheds indicate normal flow levels. Residents should be aware that conditions can change rapidly during rainfall events. TRCA continues to monitor water levels closely.",
      link: "https://trca.ca",
      messageType: "Watershed Conditions Statement",
      severity: 1,
      affectedAreas: ["Toronto", "Lake Ontario", "GTA"],
      category: "advisory",
      pubDate: new Date(now - 24 * 60 * 60 * 1e3).toISOString(),
      timestamp: now - 24 * 60 * 60 * 1e3
    }
  ];
}
async function handler(_req) {
  try {
    const response = await fetch(TRCA_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WorldMonitor/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml"
      },
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    let messages = parseTrcaRSS(text);
    if (messages.length === 0) {
      messages = getSeedFloodMessages();
    }
    return jsonResponse(
      {
        messages,
        count: messages.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=300`
      }
    );
  } catch (error) {
    console.error("[TRCA Floods] Fetch failed:", error);
    const messages = getSeedFloodMessages();
    return jsonResponse(
      {
        error: error.message,
        messages,
        count: messages.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      200,
      {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=10"
      }
    );
  }
}
export {
  config,
  handler as default
};
