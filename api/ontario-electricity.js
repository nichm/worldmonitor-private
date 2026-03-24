// api/ontario-electricity.js
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
const IESO_PRICE_URL = "https://reports-public.ieso.ca/public/RealtimeOntarioZonalPrice/PUB_RealtimeOntarioZonalPrice.xml";
const IESO_DEMAND_URL = "https://reports-public.ieso.ca/public/RealtimeConstTotals/PUB_RealtimeConstTotals.xml";
const CACHE_TTL = 5 * 60;
async function handler(_req) {
  try {
    const [priceResponse, demandResponse] = await Promise.all([
      fetch(IESO_PRICE_URL, {
        headers: {
          "User-Agent": "worldmonitor.app"
        }
      }),
      fetch(IESO_DEMAND_URL, {
        headers: {
          "User-Agent": "worldmonitor.app"
        }
      })
    ]);
    if (!priceResponse.ok || !demandResponse.ok) {
      throw new Error(`IESO API returned ${priceResponse.status}/${demandResponse.status}`);
    }
    const [priceXml, demandXml] = await Promise.all([
      priceResponse.text(),
      demandResponse.text()
    ]);
    const priceDoc = new DOMParser().parseFromString(priceXml, "text/xml");
    const priceElements = priceDoc.getElementsByTagName("Body")?.[0]?.getElementsByTagName("ROW");
    let currentPrice = 0;
    let priceTimestamp = null;
    if (priceElements && priceElements.length > 0) {
      const latestPrice = priceElements[priceElements.length - 1];
      const priceValue = latestPrice.getElementsByTagName("HOEP")?.[0]?.textContent;
      const hourEnding = latestPrice.getElementsByTagName("HourEnding")?.[0]?.textContent;
      const priceDate = latestPrice.getElementsByTagName("Date")?.[0]?.textContent;
      if (priceValue) {
        currentPrice = parseFloat(priceValue);
      }
      if (priceDate && hourEnding) {
        priceTimestamp = `${priceDate} ${hourEnding}`;
      }
    }
    const demandDoc = new DOMParser().parseFromString(demandXml, "text/xml");
    const demandElements = demandDoc.getElementsByTagName("Body")?.[0]?.getElementsByTagName("ROW");
    let totalDemand = 0;
    let demandTimestamp = null;
    if (demandElements && demandElements.length > 0) {
      const latestDemand = demandElements[demandElements.length - 1];
      const demandValue = latestDemand.getElementsByTagName("TotalDemand")?.[0]?.textContent;
      const demandHour = latestDemand.getElementsByTagName("Hour")?.[0]?.textContent;
      const demandDate = latestDemand.getElementsByTagName("Date")?.[0]?.textContent;
      if (demandValue) {
        totalDemand = parseFloat(demandValue);
      }
      if (demandDate && demandHour) {
        demandTimestamp = `${demandDate} ${demandHour}`;
      }
    }
    let signal = "normal";
    if (currentPrice < 20) {
      signal = "surplus";
    } else if (currentPrice >= 150) {
      signal = "high";
    } else if (currentPrice >= 300) {
      signal = "crisis";
    } else if (currentPrice >= 80) {
      signal = "elevated";
    }
    return jsonResponse(
      {
        price: {
          current: currentPrice,
          unit: "$/MWh",
          timestamp: priceTimestamp,
          signal
        },
        demand: {
          total: totalDemand,
          unit: "MW",
          timestamp: demandTimestamp
        },
        signals: {
          surplus: currentPrice < 20,
          normal: currentPrice >= 20 && currentPrice < 80,
          elevated: currentPrice >= 80 && currentPrice < 150,
          high: currentPrice >= 150 && currentPrice < 300,
          crisis: currentPrice >= 300
        }
      },
      200,
      {
        "Cache-Control": `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-if-error=300`,
        "Access-Control-Allow-Origin": "*"
      }
    );
  } catch (error) {
    console.error("[Ontario Electricity] Fetch failed:", error);
    return jsonResponse(
      {
        error: "Failed to fetch electricity data",
        message: error.message,
        price: { current: 0, unit: "$/MWh", timestamp: null, signal: "normal" },
        demand: { total: 0, unit: "MW", timestamp: null },
        signals: { surplus: false, normal: true, elevated: false, high: false, crisis: false }
      },
      200,
      // Return 200 with default data to avoid breaking the app
      {
        "Cache-Control": "public, max-age=60, stale-if-error=120",
        "Access-Control-Allow-Origin": "*"
      }
    );
  }
}
export {
  config,
  handler as default
};
