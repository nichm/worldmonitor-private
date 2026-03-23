#!/usr/bin/env node

/**
 * Build script to fetch Toronto Fire Active Incidents from the XML data source
 * Direct XML parsing approach - no headless browser needed
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

const TORONTO_FIRE_XML_URL = 'https://www.toronto.ca/data/fire/livecad.xml?fmyj49';
const OUTPUT_FILE = join(process.cwd(), 'api/data/toronto-fire-live.json');

async function fetchLiveFireIncidents() {
  console.log('🔥 Fetching LIVE Toronto Fire incidents from XML data source...');

  try {
    // Fetch the XML data directly
    const response = await fetch(TORONTO_FIRE_XML_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse the XML
    const incidents = [];

    // Match event elements in the XML
    const incidentRegex = /<event>([\s\S]*?)<\/event>/g;
    let match;

    while ((match = incidentRegex.exec(xmlText)) !== null) {
      const incidentData = match[1];

      // Extract individual fields using the actual XML tag names
      const primeStreet = extractField(incidentData, 'prime_street');
      const crossStreet = extractField(incidentData, 'cross_streets');
      const dispatchTime = extractField(incidentData, 'dispatch_time');
      const incidentNumber = extractField(incidentData, 'event_num');
      const incidentType = extractField(incidentData, 'event_type');
      const alarmLevel = extractField(incidentData, 'alarm_lev');
      const area = extractField(incidentData, 'beat');
      const dispatchedUnits = extractField(incidentData, 'units_disp');

      if (incidentNumber) {
        incidents.push({
          prime_street: primeStreet || '',
          cross_street: crossStreet || '',
          dispatch_time: dispatchTime || '',
          incident_number: incidentNumber,
          incident_type: incidentType || '',
          alarm_level: alarmLevel || '0',
          area: area || '',
          dispatched_units: dispatchedUnits || '',
          units: dispatchedUnits ? dispatchedUnits.split(/,\s*/).filter(u => u) : [],
          timestamp: dispatchTime ? new Date(dispatchTime).getTime() : Date.now()
        });
      }
    }

    console.log(`✅ Loaded ${incidents.length} active fire incidents from XML`);

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
        console.log(`  ${i + 1}. ${inc.incident_type} @ ${inc.prime_street} (${inc.incident_number})`);
      });
    } else {
      console.log('  No active incidents (system is clear)');
    }

    return output;
  } catch (error) {
    console.error('❌ Error fetching fire data:', error);
    throw error;
  }
}

function extractField(xmlData, fieldName) {
  // Try different patterns: <FieldName>value</FieldName> or <fieldName>value</fieldName>
  const patterns = [
    new RegExp(`<${fieldName}>([^<]+)</${fieldName}>`, 'i'),
    new RegExp(`<${fieldName.toLowerCase()}>([^<]+)</${fieldName.toLowerCase()}>`, 'i'),
    new RegExp(`<${fieldName.toUpperCase()}>([^<]+)</${fieldName.toUpperCase()}>`, 'i')
  ];

  for (const pattern of patterns) {
    const match = xmlData.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return '';
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