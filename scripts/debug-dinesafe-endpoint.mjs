#!/usr/bin/env node

/**
 * Debug script to find DineSafe API endpoint
 */

import puppeteer from 'puppeteer';

const DINSAFE_URL = 'https://www.toronto.ca/community-people/health-wellness-care/health-programs-advice/food-safety/dinesafe/';

async function findDineSafeEndpoint() {
  console.log('🔍 Searching for DineSafe data endpoint...');

  let browser = null;

  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();

    // Log network requests
    const requests = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('dinesafe') || url.includes('api') || url.includes('.json') || url.includes('.xml')) {
        console.log(`📡 Request: ${url}`);
        requests.push({ type: 'request', url });
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';

      if (url.includes('dinesafe') || url.includes('api') || url.includes('.json') || url.includes('.xml')) {
        console.log(`📥 Response: ${url} (${contentType})`);

        // Try to read JSON responses
        if (contentType.includes('application/json') || url.includes('.json')) {
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
    await page.goto(DINSAFE_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Get page content to see if there's data embedded
    const content = await page.content();
    if (content.includes('Pass') || content.includes('Closed') || content.includes('Conditional')) {
      console.log('✅ Found DineSafe data in page content!');
    } else {
      console.log('❌ No DineSafe data found in page content');
    }

    // Check for any JSON data embedded in scripts
    const embeddedData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const text = script.textContent || '';
        if (text.includes('establishment') || text.includes('inspection') && text.length > 100 && text.length < 10000) {
          return { source: 'script', content: text.substring(0, 500) };
        }
      }

      // Look for any data in window or global scope
      if (window.__DATA__ || window.dinesafeData || window.appData) {
        return { source: 'window', data: JSON.stringify(window.__DATA__ || window.dinesafeData || window.appData).substring(0, 500) };
      }

      return null;
    });

    if (embeddedData) {
      console.log('✅ Found embedded data:', embeddedData);
    } else {
      console.log('❌ No embedded data found');
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

findDineSafeEndpoint();