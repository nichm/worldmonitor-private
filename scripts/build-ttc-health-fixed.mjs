#!/usr/bin/env node

/**
 * Build script to fetch comprehensive TTC health data (FIXED PARSER)
 * Includes alerts, accessibility issues (elevators/escalators), and trip updates
 */

import { writeFile } from 'fs/promises';
import { join } from 'path';

const TTC_ALERTS_URL = 'https://gtfsrt.ttc.ca/alerts/all?format=text';
const TTC_ACCESSIBILITY_URL = 'https://gtfsrt.ttc.ca/alerts/accessibility?format=text';
const TTC_VEHICLES_URL = 'https://gtfsrt.ttc.ca/vehicles/position?format=text';
const OUTPUT_FILE = join(process.cwd(), 'api/data/ttc-health-comprehensive.json');

function parseGTFSRTAlertsSimple(text) {
  const alerts = [];
  const lines = text.split('\n');

  let currentAlert = {};
  let inAlertBlock = false;
  let inHeaderText = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start of an entity
    if (trimmed.startsWith('id:')) {
      if (Object.keys(currentAlert).length > 0 && (currentAlert.header || currentAlert.description)) {
        alerts.push({...currentAlert});
      }
      currentAlert = { id: trimmed.split('"')[1] || '' };
      inAlertBlock = false;
      inHeaderText = false;
    }

    // Start of alert block
    if (trimmed.includes('alert {')) {
      inAlertBlock = true;
    }

    // Extract header text
    if (inAlertBlock && trimmed.includes('text:') && trimmed.includes('"')) {
      // Extract text between quotes
      const textMatch = trimmed.match(/text:\s*"([^"]+)"/);
      if (textMatch && textMatch[1]) {
        let text = textMatch[1].trim();
        // Clean up escaped characters
        text = text.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
        if (!currentAlert.header && text.length > 10) {
          currentAlert.header = text;
        }
        inHeaderText = true;
      }
    }

    // Extract description
    if (inAlertBlock && trimmed.includes('description_text:')) {
      inHeaderText = false;
    }

    // Extract effect
    if (trimmed.includes('effect:') && trimmed.includes('ACCESSIBILITY_ISSUE')) {
      currentAlert.effect = 'ACCESSIBILITY_ISSUE';
    }

    // Extract time ranges
    if (trimmed.includes('start:')) {
      const startMatch = trimmed.match(/start:\s*(\d+)/);
      if (startMatch) {
        currentAlert.active_start = new Date(parseInt(startMatch[1]) * 1000).toISOString();
      }
    }
    if (trimmed.includes('end:')) {
      const endMatch = trimmed.match(/end:\s*(\d+)/);
      if (endMatch) {
        currentAlert.active_end = new Date(parseInt(endMatch[1]) * 1000).toISOString();
      }
    }
  }

  // Add last alert
  if (Object.keys(currentAlert).length > 0 && (currentAlert.header || currentAlert.description)) {
    alerts.push(currentAlert);
  }

  return alerts;
}

function determineSeverityFromAlert(alert) {
  const text = (alert.header || '' + alert.description || '').toLowerCase();

  if (text.includes('elevator out of service') || text.includes('escalator out of service')) {
    return 'accessibility';
  } else if (text.includes('closed') || text.includes('suspended')) {
    return 'critical';
  } else if (text.includes('delay') || text.includes('detour')) {
    return 'moderate';
  } else {
    return 'informational';
  }
}

function determineAlertTypeFromText(alert) {
  const text = (alert.header || '' + alert.description || '').toLowerCase();

  if (text.includes('elevator') || text.includes('escalator')) {
    return 'accessibility';
  } else if (text.includes('subway') || text.includes('line ')) {
    return 'subway';
  } else if (text.includes('bus') || /^\d+$/.test(text)) {
    return 'bus';
  } else if (text.includes('streetcar') || text.includes('tram')) {
    return 'streetcar';
  } else {
    return 'general';
  }
}

function parseVehicleCount(text) {
  const matches = text.match(/id:\s*"\d+"/g) || [];
  return matches.length;
}

async function fetchTTCHealthComprehensive() {
  console.log('🔍 Fetching comprehensive TTC health data...');

  try {
    // Fetch all three feeds
    const [alertsResponse, accessibilityResponse, vehiclesResponse] = await Promise.all([
      fetch(TTC_ALERTS_URL),
      fetch(TTC_ACCESSIBILITY_URL),
      fetch(TTC_VEHICLES_URL)
    ]);

    const alertsText = await alertsResponse.text();
    const accessibilityText = await accessibilityResponse.text();
    const vehiclesText = await vehiclesResponse.text();

    const allAlerts = parseGTFSRTAlertsSimple(alertsText);
    const accessibilityAlerts = parseGTFSRTAlertsSimple(accessibilityText);
    const activeVehicles = parseVehicleCount(vehiclesText);

    console.log(`✅ Parsed ${allAlerts.length} general alerts`);
    console.log(`✅ Parsed ${accessibilityAlerts.length} accessibility alerts`);

    // Categorize by type
    const elevatorIssues = accessibilityAlerts.filter(a => {
      const text = (a.header || '').toLowerCase();
      return text.includes('elevator') && text.includes('out of service');
    });
    const escalatorIssues = accessibilityAlerts.filter(a => {
      const text = (a.header || '').toLowerCase();
      return text.includes('escalator') && text.includes('out of service');
    });

    // Calculate health score
    const accessibilityCount = accessibilityAlerts.length;
    const criticalCount = allAlerts.filter(a => determineSeverityFromAlert(a) === 'critical').length;
    const moderateCount = allAlerts.filter(a => determineSeverityFromAlert(a) === 'moderate').length;

    let healthColor = 'green';
    let healthStatus = 'Normal Operations';

    if (criticalCount > 0) {
      healthColor = 'red';
      healthStatus = 'Service Disruptions';
    } else if (moderateCount > 5 || accessibilityCount > 3) {
      healthColor = 'yellow';
      healthStatus = 'Some Issues';
    } else if (accessibilityCount > 0) {
      healthColor = 'yellow';
      healthStatus = 'Minor Accessibility Issues';
    }

    const healthScore = {
      overall_color: healthColor,
      status: healthStatus,
      total_incidents: criticalCount + moderateCount,
      critical_incidents: criticalCount,
      moderate_incidents: moderateCount,
      accessibility_issues: accessibilityCount,
      elevator_issues: elevatorIssues.length,
      escalator_issues: escalatorIssues.length,
      active_vehicles: activeVehicles
    };

    const output = {
      data_source: 'TTC GTFS-Realtime API',
      data_source_url: 'https://gtfsrt.ttc.ca/',
      fetched_at: new Date().toISOString(),
      health_score: healthScore,
      alerts: {
        all: allAlerts,
        accessibility: accessibilityAlerts,
        disruptions: allAlerts.filter(a => {
          const severity = determineSeverityFromAlert(a);
          return severity === 'critical' || severity === 'moderate';
        }),
        elevators: elevatorIssues,
        escalators: escalatorIssues
      },
      summary: {
        total_alerts: allAlerts.length,
        accessibility_alerts: accessibilityAlerts.length,
        service_disruptions: allAlerts.filter(a => {
          const severity = determineSeverityFromAlert(a);
          return severity === 'critical' || severity === 'moderate';
        }).length,
        active_vehicles: activeVehicles
      }
    };

    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✅ Saved comprehensive TTC health data to ${OUTPUT_FILE}`);

    // Show summary
    console.log('\n📋 Health Summary:');
    console.log(`  Status: ${healthStatus}`);
    console.log(`  Color: ${healthColor}`);
    console.log(`  Accessibility Issues: ${accessibilityCount}`);
    console.log(`  Service Disruptions: ${healthScore.total_incidents}`);
    console.log(`  Active Vehicles: ${activeVehicles}`);

    if (elevatorIssues.length > 0) {
      console.log('\n📋 Elevator Issues:');
      elevatorIssues.slice(0, 3).forEach((alert, i) => {
        console.log(`  ${i + 1}. ${alert.header.substring(0, 80)}...`);
      });
    }

    return output;
  } catch (error) {
    console.error('❌ Error fetching TTC health data:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fetchTTCHealthComprehensive()
    .then(() => console.log('\n✨ Build complete!'))
    .catch((error) => {
      console.error('Build failed:', error);
      process.exit(1);
    });
}

export { fetchTTCHealthComprehensive };