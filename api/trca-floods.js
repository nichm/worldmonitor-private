// api/trca-floods.js
export const config = { runtime: "edge" };

const TRCA_RSS_URL = "https://trca.ca/feed/";
const CACHE_TTL = 2 * 60 * 60; // 2 hours in seconds

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
      ...headers,
    },
  });
}

/**
 * Classifies a TRCA flood message by severity
 */
function classifyMessageSeverity(title, content) {
  const text = (title + " " + content).toUpperCase();

  if (text.includes("FLOOD WARNING")) {
    return 4; // Critical
  }
  if (text.includes("FLOOD WATCH")) {
    return 3; // High
  }
  if (text.includes("WATER SAFETY STATEMENT")) {
    return 2; // Medium
  }
  if (text.includes("WATERSHED CONDITIONS STATEMENT")) {
    return 1; // Low
  }

  return 0; // Normal/Info
}

/**
 * Extracts affected areas from message content
 */
function extractAffectedAreas(title, content) {
  const text = title + " " + content;
  const areas = [];

  // Common watershed/area names in TRCA region
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
    "Duffins Creek",
  ];

  for (const keyword of watershedKeywords) {
    if (text.toUpperCase().includes(keyword.toUpperCase())) {
      areas.push(keyword);
    }
  }

  return areas.length > 0 ? areas : null;
}

/**
 * Parses TRCA RSS feed and extracts flood-related messages
 * Uses regex-based parsing for Edge runtime compatibility (DOMParser not available)
 */
function parseTrcaRSS(xmlText) {
  const messages = [];

  try {
    // Extract all <item> blocks using regex
    const itemMatches = xmlText.match(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    if (!itemMatches) {
      return messages;
    }

    const now = Date.now();

    for (const itemBlock of itemMatches) {
      // Extract XML fields using regex
      const titleMatch = itemBlock.match(/<title[^>]*>([^<]+)<\/title>/i);
      const linkMatch = itemBlock.match(/<link[^>]*>([^<]+)<\/link>/i);
      const descriptionMatch = itemBlock.match(
        /<description[^>]*>([^<]+)<\/description>/i,
      );
      const pubDateMatch = itemBlock.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i);
      const contentMatch = itemBlock.match(
        /<content:encoded[^>]*>([^<]*)<\/content:encoded>/i,
      );

      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";
      const link = linkMatch ? decodeHtmlEntities(linkMatch[1].trim()) : "";
      const description = descriptionMatch
        ? decodeHtmlEntities(descriptionMatch[1].trim())
        : "";
      const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : "";
      const content = contentMatch
        ? decodeHtmlEntities(contentMatch[1].trim())
        : description;

      // Try to parse publication date
      let pubDate = new Date();
      try {
        pubDate = new Date(pubDateStr);
        if (Number.isNaN(pubDate.getTime())) {
          pubDate = new Date();
        }
      } catch {
        pubDate = new Date();
      }

      // Skip if not flood-related
      const text = (title + " " + content).toLowerCase();
      const floodKeywords = [
        "flood",
        "water level",
        "watershed",
        "stream",
        "river",
        "water safety",
        "normal water",
        "shoreline",
      ];

      const isFloodRelated = floodKeywords.some((keyword) =>
        text.includes(keyword),
      );

      if (!isFloodRelated) {
        continue;
      }

      // Determine message type
      let messageType = "Message";
      const titleUpper = title.toUpperCase();
      const contentUpper = content.toUpperCase();

      if (
        titleUpper.includes("NORMAL WATER LEVELS") ||
        contentUpper.includes("NORMAL WATER LEVELS")
      ) {
        messageType = "Normal Water Levels";
      } else if (
        titleUpper.includes("FLOOD WARNING") ||
        contentUpper.includes("FLOOD WARNING")
      ) {
        messageType = "Flood Warning";
      } else if (
        titleUpper.includes("FLOOD WATCH") ||
        contentUpper.includes("FLOOD WATCH")
      ) {
        messageType = "Flood Watch";
      } else if (
        titleUpper.includes("WATER SAFETY STATEMENT") ||
        contentUpper.includes("WATER SAFETY STATEMENT")
      ) {
        messageType = "Water Safety Statement";
      } else if (
        titleUpper.includes("WATERSHED CONDITIONS STATEMENT") ||
        contentUpper.includes("WATERSHED CONDITIONS STATEMENT")
      ) {
        messageType = "Watershed Conditions Statement";
      }

      // Extract affected areas
      const affectedAreas = extractAffectedAreas(title, content);

      // Determine category (water status vs advisory)
      const category =
        messageType === "Normal Water Levels" ? "water_status" : "advisory";

      messages.push({
        id: `trca-${now}-${messages.length}`,
        title: title,
        description: description,
        content: content,
        link: link,
        messageType: messageType,
        severity: classifyMessageSeverity(title, content),
        affectedAreas: affectedAreas,
        category: category,
        pubDate: pubDate.toISOString(),
        timestamp: pubDate.getTime(),
      });
    }

    // Sort by severity (highest first), then by date (most recent first)
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

/**
 * Decodes HTML entities in text (e.g., &amp; → &)
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
}

export default async function handler(_req) {
  try {
    const response = await fetch(TRCA_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WorldMonitor/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const messages = parseTrcaRSS(text);

    return jsonResponse(
      {
        messages,
        count: messages.length,
        timestamp: new Date().toISOString(),
      },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=300`,
      },
    );
  } catch (error) {
    console.error("[TRCA Floods] Fetch failed:", error);

    return jsonResponse(
      {
        error: error.message,
        messages: [],
        count: 0,
        timestamp: new Date().toISOString(),
      },
      200,
      {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=10",
      },
    );
  }
}
