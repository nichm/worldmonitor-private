#!/usr/bin/env node

/**
 * Build script to fetch Toronto Fire Active Incidents using headless browser
 * The live CAD page loads data via JavaScript, so we use Puppeteer to render it
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';
import puppeteer from 'puppeteer';

const TORONTO_FIRE_URL = 'https://www.toronto.ca/community-people/public-safety-alerts/alerts-notifications/toronto-fire-active-incidents/';
const OUTPUT_FILE = join(process.cwd(), 'api/data/toronto-fire-live.json');

async function fetchLiveFireIncidents() {
  console.log('🔥 Fetching LIVE Toronto Fire incidents using headless browser...');

  let browser = null;

  try {
    // Launch headless browser
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ]
    });

    const page = await browser.newPage();

    // Set viewport and wait for network to be idle
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(TORONTO_FIRE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for the table to populate
    await page.waitForSelector('tbody', { timeout: 10000 });

    // Extract data from the table
    const result = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) {
        return { incidents: [], error: 'No table found' };
      }

      const tbody = table.querySelector('tbody');
      if (!tbody) {
        return { incidents: [], error: 'No tbody found' };
      }

      const rows = Array.from(tbody.querySelectorAll('tr'));

      if (rows.length === 0) {
        return { incidents: [], debug: 'No rows found in tbody' };
      }

      const data = [];

      rows.forEach((row, index) => {
        const cells = Array.from(row.querySelectorAll('td'));

        if (cells.length >= 6) {
          const primeStreet = cells[0]?.textContent?.trim() || '';
          const crossStreet = cells[1]?.textContent?.trim() || '';
          const dispatchTime = cells[2]?.textContent?.trim() || '';
          const incidentNumber = cells[3]?.textContent?.trim() || '';
          const incidentType = cells[4]?.textContent?.trim() || '';
          const alarmLevel = parseInt(cells[5]?.textContent?.trim()) || 0;

          let area = '';
          let dispatchedUnits = '';

          if (cells.length >= 7) {
            area = cells[6]?.textContent?.trim() || '';
          }
          if (cells.length >= 8) {
            dispatchedUnits = cells[7]?.textContent?.trim() || '';
          }

          const units = dispatchedUnits.split(/,\s*/).filter(u => u);

          if (primeStreet && incidentNumber) {
            data.push({
              prime_street: primeStreet,
              cross_street: crossStreet,
              dispatch_time: dispatchTime,
              incident_number: incidentNumber,
              incident_type: incidentType,
              alarm_level: alarmLevel.toString(),
              area: area,
              dispatched_units: dispatchedUnits,
              units: units,
              timestamp: new Date(dispatchTime).getTime() || Date.now()
            });
          }
        }
      });

      return { incidents: data, debug: `Found ${rows.length} rows, parsed ${data.length} incidents` };
    }, { timeout: 30000 });

    if (result.error) {
      console.log(`⚠️ ${result.error}`);
    } else if (result.debug) {
      console.log(`📊 ${result.debug}`);
    }

    const incidents = result.incidents;

    console.log(`✅ Loaded ${incidents.length} active fire incidents`);

    const output = {
      incidents: incidents,
      total: incidents.length,
      fetched_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      data_source: 'Toronto Fire Services CAD (Live - updates every 5 minutes)'
    };

    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✅ Saved live fire data to ${OUTPUT_FILE}`);

    // Show summary
    console.log('\n📋 Active Incidents Summary:');
    if (incidents.length > 0) {
      incidents.slice(0, 5).forEach((inc, i) => {
        console.log(`  ${i + 1}. ${inc.incident_type} @ ${inc.prime_street}`);
      });
    } else {
      console.log('  No active incidents (system is clear)');
    }

    return output;
  } catch (error) {
    console.error('❌ Error fetching fire data:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchLiveFireIncidents()
    .then(() => console.log('\n✨ Build complete!'))
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

export { fetchLiveFireIncidents };