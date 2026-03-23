#!/usr/bin/env node

/**
 * Debug script to find the actual API endpoint for Toronto Fire CAD data
 */

import puppeteer from 'puppeteer';

const TORONTO_FIRE_URL = 'https://www.toronto.ca/community-people/public-safety-alerts/alerts-notifications/toronto-fire-active-incidents/';

async function findFireDataEndpoint() {
  console.log('🔍 Searching for Toronto Fire data endpoint...');

  let browser = null;

  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Enable request interception
    const requests = [];
    await page.setRequestInterception(false);

    // Log all requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes(' Toronto.ca') || url.includes('fire') || url.includes('cad') || url.includes('.json') || url.includes('.js')) {
        console.log(`📡 Request: ${url}`);
        requests.push({ type: 'request', url, method: request.method() });
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (url.includes(' Toronto.ca') || url.includes('fire') || url.includes('cad') || url.includes('.json')) {
        console.log(`📥 Response: ${url} (${contentType})`);

        // Try to see if it's JSON data
        if (contentType.includes('application/json') || url.endsWith('.json')) {
          try {
            const text = await response.text();
            console.log(`📦 JSON Data: ${text.substring(0, 200)}...`);
            requests.push({ type: 'response', url, data: text.substring(0, 500) });
          } catch (e) {
            console.log(`⚠️ Could not read response body`);
          }
        }
      }
    });

    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(TORONTO_FIRE_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for table to appear
    await page.waitForSelector('tbody', { timeout: 15000 });

    // Get page content to see what loaded
    const content = await page.content();
    if (content.includes('QUEENSDALE') || content.includes('F26042275')) {
      console.log('✅ Found fire incident data in page content!');
    } else {
      console.log('❌ No fire incident data found in page content');
    }

    console.log('\n📋 All captured requests:');
    requests.forEach((req, i) => {
      console.log(`  ${i + 1}. [${req.type}] ${req.url}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

findFireDataEndpoint();