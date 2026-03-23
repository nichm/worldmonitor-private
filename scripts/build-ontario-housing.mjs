#!/usr/bin/env node

/**
 * Build script to fetch real Ontario Housing Progress data
 * Converts CSV to JSON for serving by the API
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const HOUSING_CSV_URL = 'https://data.ontario.ca/dataset/77ac513f-a65a-4cf0-b889-31be6ddb6f46/resource/3bb04ba5-2445-44e0-9d2c-8a25dd1b18e6/download/ontarios_housing_supply_-_january_december_2024_-_en.csv';
const OUTPUT_FILE = join(process.cwd(), 'api/data/ontario-housing.json');

async function fetchHousingData() {
  console.log('🔍 Fetching Ontario Housing data...');

  try {
    const response = await fetch(HOUSING_CSV_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const municipalities = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const data = {
        municipality: values[0] || '',
        ten_year_target: parseInt(values[1]?.replace(/,/g, '')) || 0,
        total_progress_since_2022: parseInt(values[2]?.replace(/,/g, '')) || 0,
        target_2024: parseInt(values[3]?.replace(/,/g, '')) || 0,
        total_2024_progress: parseInt(values[4]?.replace(/,/g, '')) || 0,
        progress_percentage_2024: parseFloat(values[5]?.replace(/%/g, '')) || 0,
        status: values[6] || 'Unknown'
      };

      if (data.municipality) {
        municipalities.push(data);
      }
    }

    console.log(`✅ Loaded ${municipalities.length} municipalities`);

    const output = {
      data_source: 'Ontario Data Catalogue',
      data_source_url: 'https://data.ontario.ca/dataset/ontario-s-housing-supply-progress',
      fetched_at: new Date().toISOString(),
      year: 2024,
      total_municipalities: municipalities.length,
      municipalities
    };

    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✅ Saved housing data to ${OUTPUT_FILE}`);

    // Show sample
    console.log('\n📋 Sample data (top municipalities with highest progress):');
    municipalities
      .sort((a, b) => b.progress_percentage_2024 - a.progress_percentage_2024)
      .slice(0, 5)
      .forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.municipality}: ${m.progress_percentage_2024}% (${m.total_2024_progress}/${m.target_2024})`);
      });

    return municipalities;
  } catch (error) {
    console.error('❌ Error fetching housing data:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchHousingData()
    .then(() => console.log('\n✨ Build complete!'))
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

export { fetchHousingData };