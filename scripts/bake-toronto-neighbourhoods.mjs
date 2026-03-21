/**
 * Bake Toronto Neighbourhood Risk GeoJSON
 *
 * Fetches from Toronto CKAN:
 * 1. Neighbourhoods GeoJSON (polygons)
 * 2. Wellbeing Toronto Safety (crime, fire, auto theft stats) - Currently using placeholder data
 *
 * Calculates risk score: crime * 0.4 + fire * 0.3 + auto * 0.3
 * Outputs static GeoJSON to public/data/toronto-neighbourhood-risk.geojson
 *
 * Note: Safety data parsing from XLSX requires additional dependencies.
 * Using temporary placeholder risk scores (10-60 range) until XLSX parser added.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NEIGHBOURHOODS_URL = 'https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/fc443770-ef0a-4025-9c2c-2cb558bfab00/resource/0719053b-28b7-48ea-b863-068823a93aaa/download/neighbourhoods-4326.geojson';

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

function normalizeNeighbourhoodName(name) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function main() {
  console.log('Fetching Toronto Neighbourhoods GeoJSON...');
  const geojson = await fetchJSON(NEIGHBOURHOODS_URL);

  console.log('Processing neighbourhood features...');

  // Create a deterministic pseudo-random risk score based on neighbourhood name
  // This provides consistent results while we work on XLSX parsing
  const pseudoRandom = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash % 100);
  };

  // Process GeoJSON features
  const features = geojson.features.map((feature, index) => {
    const properties = feature.properties || {};
    const name = properties.name || properties.NAME || properties['Neighbourhood Name'] || `Neighbourhood ${index}`;

    // Generate deterministic placeholder risk scores (10-60 range for demo)
    const baseScore = 10 + (pseudoRandom(normalizeNeighbourhoodName(name)) % 50);
    const crimeIndex = baseScore * 0.4;
    const fireIndex = baseScore * 0.3;
    const autoTheftIndex = baseScore * 0.3;

    // Calculate risk score (sum of weighted components, already in 0-100 range)
    const riskScore = (
      (pseudoRandom(normalizeNeighbourhoodName(name)) % 50) + 10
    );

    return {
      ...feature,
      properties: {
        ...properties,
        name: name || 'Unknown Neighbourhood',
        riskScore: Math.round(riskScore * 10) / 10,
        crimeIndex: Math.round(crimeIndex * 10) / 10,
        fireIndex: Math.round(fireIndex * 10) / 10,
        autoTheftIndex: Math.round(autoTheftIndex * 10) / 10,
        _placeholder: true, // Flag indicating placeholder data
      },
    };
  });

  const output = {
    type: 'FeatureCollection',
    features,
  };

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../public/data');
  const outputPath = path.join(outputDir, 'toronto-neighbourhood-risk.geojson');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Baked ${features.length} neighbourhoods to ${outputPath}`);

  // Show stats
  const riskScores = features.map(f => f.properties.riskScore);
  const avgRisk = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  const maxRisk = Math.max(...riskScores);
  const minRisk = Math.min(...riskScores);

  console.log(`   Risk Score Stats (placeholder data):`);
  console.log(`   - Average: ${avgRisk.toFixed(1)}`);
  console.log(`   - Min: ${minRisk.toFixed(1)}`);
  console.log(`   - Max: ${maxRisk.toFixed(1)}`);
  console.log(`   ⚠️  Note: Using placeholder scores. To add real safety data, implement XLSX parsing.`);
}

main().catch(error => {
  console.error('Error baking neighbourhood data:', error);
  process.exit(1);
});
