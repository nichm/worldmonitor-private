export type TemplateCategory = 'markets' | 'geopolitics' | 'aviation' | 'security' | 'environment' | 'research';

export interface WidgetTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  tier: 'basic' | 'pro';
  emoji: string;
  prompt: string;
  html: string;
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'tpl-oil-gold',
    title: 'Oil vs Gold',
    description: 'Live spot prices for WTI crude oil and gold with daily change.',
    category: 'markets',
    tier: 'basic',
    emoji: '📊',
    prompt: 'Show me today\'s crude oil price versus gold with daily change percentages',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">COMMODITIES</div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:13px;color:var(--text)">🛢 Crude Oil (WTI)</span>
    <div style="text-align:right">
      <div style="font-size:14px;font-weight:700;color:var(--accent)">$82.40</div>
      <div style="font-size:11px;color:#4ade80">+1.2%</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:13px;color:var(--text)">🥇 Gold (XAU/USD)</span>
    <div style="text-align:right">
      <div style="font-size:14px;font-weight:700;color:var(--accent)">$2,314</div>
      <div style="font-size:11px;color:#f87171">-0.4%</div>
    </div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-crypto-movers',
    title: 'Crypto Top Movers',
    description: 'Top gaining and losing cryptocurrencies over the last 24 hours.',
    category: 'markets',
    tier: 'basic',
    emoji: '🚀',
    prompt: 'Create a widget for the top crypto movers in the last 24 hours with price and percent change',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">TOP MOVERS · 24H</div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <div><span style="font-size:13px;font-weight:600;color:var(--text)">BTC</span> <span style="font-size:11px;color:var(--text-dim)">Bitcoin</span></div>
    <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--accent)">$67,210</div><div style="font-size:11px;color:#4ade80">+3.8%</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <div><span style="font-size:13px;font-weight:600;color:var(--text)">SOL</span> <span style="font-size:11px;color:var(--text-dim)">Solana</span></div>
    <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--accent)">$172.50</div><div style="font-size:11px;color:#4ade80">+6.1%</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <div><span style="font-size:13px;font-weight:600;color:var(--text)">ETH</span> <span style="font-size:11px;color:var(--text-dim)">Ethereum</span></div>
    <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--accent)">$3,540</div><div style="font-size:11px;color:#f87171">-1.2%</div></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0">
    <div><span style="font-size:13px;font-weight:600;color:var(--text)">AVAX</span> <span style="font-size:11px;color:var(--text-dim)">Avalanche</span></div>
    <div style="text-align:right"><div style="font-size:13px;font-weight:700;color:var(--accent)">$38.20</div><div style="font-size:11px;color:#f87171">-4.5%</div></div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-gulf-quotes',
    title: 'Gulf Market Quotes',
    description: 'Key stock indices and equities from Gulf Cooperation Council markets.',
    category: 'markets',
    tier: 'basic',
    emoji: '🏦',
    prompt: 'Show me live Gulf market quotes including Tadawul, ADX and DFM indices with change',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">GULF MARKETS</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="color:var(--text-dim);font-size:11px">
        <th style="text-align:left;padding-bottom:6px;font-weight:600">Index</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Price</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Chg%</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">Tadawul (TASI)</td>
        <td style="text-align:right;color:var(--accent);font-weight:700">11,842</td>
        <td style="text-align:right;color:#4ade80">+0.8%</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">ADX (UAE)</td>
        <td style="text-align:right;color:var(--accent);font-weight:700">9,480</td>
        <td style="text-align:right;color:#4ade80">+0.3%</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">DFM</td>
        <td style="text-align:right;color:var(--accent);font-weight:700">4,210</td>
        <td style="text-align:right;color:#f87171">-0.5%</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-stablecoins',
    title: 'Stablecoin Monitor',
    description: 'Track stablecoin pegs and deviations to spot de-peg risk early.',
    category: 'markets',
    tier: 'basic',
    emoji: '💵',
    prompt: 'Monitor stablecoin prices and peg deviations for USDT, USDC, DAI and FRAX',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">STABLECOIN PEG MONITOR</div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:13px;color:var(--text)">USDT <small style="color:var(--text-dim)">Tether</small></span>
    <div style="text-align:right"><span style="font-size:14px;font-weight:700;color:#4ade80">$1.0001</span> <span style="font-size:11px;color:var(--text-dim)">✓ Pegged</span></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:13px;color:var(--text)">USDC <small style="color:var(--text-dim)">Circle</small></span>
    <div style="text-align:right"><span style="font-size:14px;font-weight:700;color:#4ade80">$0.9998</span> <span style="font-size:11px;color:var(--text-dim)">✓ Pegged</span></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">
    <span style="font-size:13px;color:var(--text)">DAI <small style="color:var(--text-dim)">MakerDAO</small></span>
    <div style="text-align:right"><span style="font-size:14px;font-weight:700;color:#4ade80">$1.0003</span> <span style="font-size:11px;color:var(--text-dim)">✓ Pegged</span></div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0">
    <span style="font-size:13px;color:var(--text)">FRAX <small style="color:var(--text-dim)">Frax</small></span>
    <div style="text-align:right"><span style="font-size:14px;font-weight:700;color:#fbbf24">$0.9971</span> <span style="font-size:11px;color:#fbbf24">⚠ Watch</span></div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-conflict-zones',
    title: 'Active Conflict Zones',
    description: 'Summary of ongoing armed conflicts with intensity levels and recent developments.',
    category: 'geopolitics',
    tier: 'basic',
    emoji: '⚔️',
    prompt: 'Show active conflict zones with intensity levels and latest UCDP data',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">ACTIVE CONFLICTS</div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--text)">Ukraine — Russia</span>
      <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(239,68,68,.18);color:#f87171">HIGH</span>
    </div>
    <p style="margin:4px 0 0;font-size:12px;color:var(--text-dim);line-height:1.4">Continued front-line activity in eastern oblasts. Artillery exchanges reported.</p>
  </div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--text)">Sudan Civil War</span>
      <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(239,68,68,.18);color:#f87171">HIGH</span>
    </div>
    <p style="margin:4px 0 0;font-size:12px;color:var(--text-dim);line-height:1.4">Clashes reported in Khartoum and Darfur regions. Humanitarian situation deteriorating.</p>
  </div>
  <div style="padding:8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600;color:var(--text)">Myanmar</span>
      <span style="font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;background:rgba(251,191,36,.18);color:#fbbf24">MED</span>
    </div>
    <p style="margin:4px 0 0;font-size:12px;color:var(--text-dim);line-height:1.4">Resistance forces advancing in Shan and Sagaing states. Junta controls major cities.</p>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-sanctions',
    title: 'Sanctions Pressure',
    description: 'Overview of top sanctioned countries and active sanctions regimes by issuing body.',
    category: 'geopolitics',
    tier: 'basic',
    emoji: '🚫',
    prompt: 'Show me the top countries under sanctions pressure with issuing bodies and pressure scores',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">SANCTIONS PRESSURE INDEX</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="color:var(--text-dim);font-size:11px">
        <th style="text-align:left;padding-bottom:6px;font-weight:600">Country</th>
        <th style="text-align:center;padding-bottom:6px;font-weight:600">Regimes</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Score</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇷🇺 Russia</td>
        <td style="text-align:center;color:var(--text-dim)">US, EU, UK, CA</td>
        <td style="text-align:right;color:#f87171;font-weight:700">98</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇮🇷 Iran</td>
        <td style="text-align:center;color:var(--text-dim)">US, EU, UN</td>
        <td style="text-align:right;color:#f87171;font-weight:700">95</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇰🇵 North Korea</td>
        <td style="text-align:center;color:var(--text-dim)">US, EU, UN</td>
        <td style="text-align:right;color:#f87171;font-weight:700">92</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇧🇾 Belarus</td>
        <td style="text-align:center;color:var(--text-dim)">US, EU, UK</td>
        <td style="text-align:right;color:#fbbf24;font-weight:700">61</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-risk-scores',
    title: 'Country Instability Index',
    description: 'Composite instability scores for countries ranked by political, economic and security risk.',
    category: 'geopolitics',
    tier: 'basic',
    emoji: '🛡️',
    prompt: 'Show a country instability index with composite risk scores ranked from highest to lowest',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">INSTABILITY INDEX · TOP 5</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:12px;color:var(--text);width:120px">🇸🇴 Somalia</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:92%;height:100%;background:#f87171;border-radius:3px"></div></div>
      <span style="font-size:12px;font-weight:700;color:#f87171;width:32px;text-align:right">92</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:12px;color:var(--text);width:120px">🇾🇪 Yemen</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:88%;height:100%;background:#f87171;border-radius:3px"></div></div>
      <span style="font-size:12px;font-weight:700;color:#f87171;width:32px;text-align:right">88</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:12px;color:var(--text);width:120px">🇸🇩 Sudan</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:84%;height:100%;background:#f87171;border-radius:3px"></div></div>
      <span style="font-size:12px;font-weight:700;color:#f87171;width:32px;text-align:right">84</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:12px;color:var(--text);width:120px">🇭🇹 Haiti</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:79%;height:100%;background:#fbbf24;border-radius:3px"></div></div>
      <span style="font-size:12px;font-weight:700;color:#fbbf24;width:32px;text-align:right">79</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:12px;color:var(--text);width:120px">🇲🇲 Myanmar</span>
      <div style="flex:1;height:6px;background:var(--border);border-radius:3px"><div style="width:75%;height:100%;background:#fbbf24;border-radius:3px"></div></div>
      <span style="font-size:12px;font-weight:700;color:#fbbf24;width:32px;text-align:right">75</span>
    </div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-flight-delays',
    title: 'International Flight Delays',
    description: 'Worst-performing airports ranked by average departure delay right now.',
    category: 'aviation',
    tier: 'basic',
    emoji: '✈️',
    prompt: 'Summarize the worst international flight delays right now by airport with average delay minutes',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">FLIGHT DELAYS · LIVE</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="color:var(--text-dim);font-size:11px">
        <th style="text-align:left;padding-bottom:6px;font-weight:600">Airport</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Avg Delay</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">LHR London</td>
        <td style="text-align:right;color:#f87171;font-weight:700">+48 min</td>
        <td style="text-align:right"><span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(239,68,68,.15);color:#f87171">Severe</span></td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">JFK New York</td>
        <td style="text-align:right;color:#fbbf24;font-weight:700">+29 min</td>
        <td style="text-align:right"><span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(251,191,36,.15);color:#fbbf24">Moderate</span></td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">CDG Paris</td>
        <td style="text-align:right;color:#fbbf24;font-weight:700">+21 min</td>
        <td style="text-align:right"><span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(251,191,36,.15);color:#fbbf24">Moderate</span></td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">DXB Dubai</td>
        <td style="text-align:right;color:#4ade80;font-weight:700">+4 min</td>
        <td style="text-align:right"><span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(74,222,128,.15);color:#4ade80">Normal</span></td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-military-flights',
    title: 'Military Flight Tracker',
    description: 'Active military aircraft by type and country with recent activity summary.',
    category: 'aviation',
    tier: 'basic',
    emoji: '🛩️',
    prompt: 'Show active military flights grouped by country with aircraft type and squawk codes',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">MILITARY FLIGHTS · ACTIVE</div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">🇺🇸 United States</span>
      <span style="font-size:13px;font-weight:700;color:var(--accent)">142 active</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">B-52, F-35, KC-135 tankers over Pacific. AWACS on patrol.</p>
  </div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">🇷🇺 Russia</span>
      <span style="font-size:13px;font-weight:700;color:var(--accent)">87 active</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Su-35, Tu-95 strategic bombers, Il-76 transports. Black Sea activity elevated.</p>
  </div>
  <div style="padding:8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">🇬🇧 United Kingdom</span>
      <span style="font-size:13px;font-weight:700;color:var(--accent)">34 active</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Typhoons, Sentinel R1 ISR aircraft over North Sea.</p>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-cyber-threats',
    title: 'Cyber Threat Feed',
    description: 'Recent high-severity cyber incidents, threat actors and targeted sectors.',
    category: 'security',
    tier: 'basic',
    emoji: '🔐',
    prompt: 'Show recent high-severity cyber threats and incidents with targeted sectors and threat actors',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">CYBER THREAT FEED</div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-size:12px;font-weight:600;color:var(--text)">Critical Infrastructure DDoS</span>
      <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(239,68,68,.15);color:#f87171">CRITICAL</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Energy sector targeted across EU. Attributed to Sandworm group.</p>
  </div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-size:12px;font-weight:600;color:var(--text)">Supply Chain Compromise</span>
      <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(251,191,36,.15);color:#fbbf24">HIGH</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Open-source package backdoor detected. Finance sector patching in progress.</p>
  </div>
  <div style="padding:8px 0">
    <div style="display:flex;justify-content:space-between;margin-bottom:3px">
      <span style="font-size:12px;font-weight:600;color:var(--text)">Ransomware Campaign</span>
      <span style="font-size:11px;padding:2px 6px;border-radius:3px;background:rgba(251,191,36,.15);color:#fbbf24">HIGH</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">LockBit variant targeting healthcare systems in North America.</p>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-gdelt-intel',
    title: 'GDELT Intelligence Feed',
    description: 'High-relevance geopolitical events extracted from GDELT global news monitoring.',
    category: 'security',
    tier: 'basic',
    emoji: '🔍',
    prompt: 'Show the latest high-relevance GDELT intelligence events with tone scores and actors',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">GDELT INTELLIGENCE · LIVE</div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Diplomatic Tension Spike — South China Sea</div>
    <p style="margin:0 0 4px;font-size:12px;color:var(--text-dim)">Naval standoff reported near Spratly Islands. Multiple state actors involved.</p>
    <div style="font-size:11px;color:var(--text-dim)">Tone: <span style="color:#f87171">-8.4</span> · Sources: 142</div>
  </div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Protest Activity — Sub-Saharan Africa</div>
    <p style="margin:0 0 4px;font-size:12px;color:var(--text-dim)">Large-scale demonstrations in 3 capitals. Police response reported in 2 cities.</p>
    <div style="font-size:11px;color:var(--text-dim)">Tone: <span style="color:#f87171">-5.1</span> · Sources: 89</div>
  </div>
  <div style="padding:8px 0">
    <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Trade Agreement Announcement — ASEAN</div>
    <p style="margin:0 0 4px;font-size:12px;color:var(--text-dim)">New multilateral trade framework signed. Covers 7 member states.</p>
    <div style="font-size:11px;color:var(--text-dim)">Tone: <span style="color:#4ade80">+3.8</span> · Sources: 201</div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-wildfires',
    title: 'Active Wildfire Monitor',
    description: 'Current active wildfire events by region with satellite-detected fire counts.',
    category: 'environment',
    tier: 'basic',
    emoji: '🔥',
    prompt: 'Show active wildfires by region with satellite fire detection counts and containment status',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">ACTIVE WILDFIRES · SATELLITE</div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">California, USA</span>
      <span style="font-size:12px;font-weight:700;color:#f87171">🔥 847 detections</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Ongoing fire activity in northern counties. Red flag conditions persist.</p>
  </div>
  <div style="padding:8px 0;border-bottom:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">Amazon Basin, Brazil</span>
      <span style="font-size:12px;font-weight:700;color:#f87171">🔥 2,340 detections</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Dry season burning elevated above 5-year average. Deforestation hotspots flagged.</p>
  </div>
  <div style="padding:8px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
      <span style="font-size:13px;font-weight:600;color:var(--text)">Siberia, Russia</span>
      <span style="font-size:12px;font-weight:700;color:#fbbf24">🔥 521 detections</span>
    </div>
    <p style="margin:0;font-size:12px;color:var(--text-dim)">Taiga fires below seasonal average. Smoke plume affecting air quality.</p>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-earthquakes',
    title: 'Recent Earthquakes',
    description: 'Latest significant seismic events globally with magnitude, depth and affected region.',
    category: 'environment',
    tier: 'basic',
    emoji: '🌍',
    prompt: 'Show recent significant earthquakes worldwide with magnitude, depth and location',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">RECENT EARTHQUAKES</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead>
      <tr style="color:var(--text-dim);font-size:11px">
        <th style="text-align:left;padding-bottom:6px;font-weight:600">Location</th>
        <th style="text-align:center;padding-bottom:6px;font-weight:600">Mag</th>
        <th style="text-align:right;padding-bottom:6px;font-weight:600">Depth</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇹🇷 Izmir, Turkey</td>
        <td style="text-align:center;color:#f87171;font-weight:700">M 5.8</td>
        <td style="text-align:right;color:var(--text-dim)">12 km</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇯🇵 Hokkaido, Japan</td>
        <td style="text-align:center;color:#fbbf24;font-weight:700">M 4.9</td>
        <td style="text-align:right;color:var(--text-dim)">35 km</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇨🇱 Antofagasta, Chile</td>
        <td style="text-align:center;color:#fbbf24;font-weight:700">M 4.6</td>
        <td style="text-align:right;color:var(--text-dim)">72 km</td>
      </tr>
      <tr style="border-top:1px solid var(--border)">
        <td style="padding:7px 0;color:var(--text)">🇮🇩 Sumatra, Indonesia</td>
        <td style="text-align:center;color:#4ade80;font-weight:700">M 3.9</td>
        <td style="text-align:right;color:var(--text-dim)">18 km</td>
      </tr>
    </tbody>
  </table>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-macro-signals',
    title: 'Macro Economic Signals',
    description: 'Key macroeconomic indicators — yield curves, DXY, VIX and PMI composites.',
    category: 'research',
    tier: 'basic',
    emoji: '📈',
    prompt: 'Show key macro economic signals including yield curve, VIX, DXY and global PMI data',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">MACRO SIGNALS</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">VIX</div>
      <div style="font-size:18px;font-weight:700;color:#fbbf24">18.4</div>
      <div style="font-size:11px;color:#fbbf24">Elevated</div>
    </div>
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">DXY</div>
      <div style="font-size:18px;font-weight:700;color:var(--accent)">104.2</div>
      <div style="font-size:11px;color:#f87171">+0.3%</div>
    </div>
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">US 10Y Yield</div>
      <div style="font-size:18px;font-weight:700;color:var(--accent)">4.42%</div>
      <div style="font-size:11px;color:#4ade80">-2bp</div>
    </div>
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="font-size:11px;color:var(--text-dim);margin-bottom:3px">Global PMI</div>
      <div style="font-size:18px;font-weight:700;color:#4ade80">51.2</div>
      <div style="font-size:11px;color:#4ade80">Expanding</div>
    </div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
  {
    id: 'tpl-prediction-markets',
    title: 'Prediction Markets',
    description: 'Live Polymarket and Metaculus probabilities on geopolitical and macro events.',
    category: 'research',
    tier: 'basic',
    emoji: '🎯',
    prompt: 'Show live prediction market probabilities for major geopolitical and macro events from Polymarket',
    html: `<div style="font-family:system-ui,sans-serif;padding:2px 0">
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);margin-bottom:8px">PREDICTION MARKETS · LIVE</div>
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;color:var(--text);font-weight:600">Fed rate cut by June 2025?</span>
        <span style="font-size:14px;font-weight:700;color:#4ade80">72%</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:2px"><div style="width:72%;height:100%;background:#4ade80;border-radius:2px"></div></div>
    </div>
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;color:var(--text);font-weight:600">Ukraine ceasefire 2025?</span>
        <span style="font-size:14px;font-weight:700;color:#fbbf24">34%</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:2px"><div style="width:34%;height:100%;background:#fbbf24;border-radius:2px"></div></div>
    </div>
    <div style="padding:8px;border:1px solid var(--border);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:12px;color:var(--text);font-weight:600">Bitcoin above $100K in 2025?</span>
        <span style="font-size:14px;font-weight:700;color:#4ade80">61%</span>
      </div>
      <div style="height:5px;background:var(--border);border-radius:2px"><div style="width:61%;height:100%;background:#4ade80;border-radius:2px"></div></div>
    </div>
  </div>
  <div style="margin-top:10px;font-size:11px;color:var(--text-dim);text-align:right">Placeholder — AI fetches live data</div>
</div>`,
  },
];

export function getTemplatesByCategory(cat: TemplateCategory): WidgetTemplate[] {
  return WIDGET_TEMPLATES.filter(t => t.category === cat);
}

export function getAllCategories(): TemplateCategory[] {
  return ['markets', 'geopolitics', 'aviation', 'security', 'environment', 'research'];
}
