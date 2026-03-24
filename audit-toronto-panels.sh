#!/bin/bash

# Audit all Toronto panel components

PANELS=(
  "CommunityHousingPanel"
  "ParksRecreationPanel"
  "SchoolsPanel"
  "GreenPParkingPanel"
  "EVChargingPanel"
  "CyclingNetworkPanel"
  "RavineProtectionPanel"
  "ChildcarePanel"
  "FluClinicsPanel"
  "AGCOLicencesPanel"
  "GreenRoofPermitsPanel"
  "LibraryBranchesPanel"
  "CrimeIncidentsPanel"
  "PoliceDivisionsPanel"
  "AQHIPanel"
  "TreeCanopyPanel"
  "LakeOntarioLevelPanel"
  "BikeSharePanel"
  "FederalRidingsPanel"
  "MLSInvestigationsPanel"
  "TrafficSignalsPanel"
  "TorontoHydroPanel"
  "CourtFacilitiesPanel"
  "RoadConstructionPanel"
  "OntarioWildfiresPanel"
  "FloodingCompositePanel"
  "ElectionDataPanel"
  "UrbanHeatPanel"
  "TTCVehiclesPanel"
  "ProtestEventsPanel"
  "TorontoCrimePanel"
  "TorontoFirePanel"
  "TorontoHydroOutagesPanel"
)

echo "=== TORONTO PANEL COMPONENT AUDIT ==="
echo ""

PASS=0
FAIL=0

for panel in "${PANELS[@]}"; do
  file="src/components/${panel}.ts"

  echo "Checking: $panel ($file)"

  # Check 1: File exists
  if [ ! -f "$file" ]; then
    echo "  ❌ FAIL: File does not exist"
    echo ""
    ((FAIL++))
    continue
  fi

  # Check 2: Valid TypeScript syntax
  if ! npx tsc --noEmit "$file" 2>&1 | grep -q "error TS"; then
    echo "  ✅ TypeScript syntax valid"
  else
    echo "  ❌ FAIL: TypeScript syntax error"
    echo ""
    ((FAIL++))
    continue
  fi

  # Check 3: Class extends Panel
  if grep -q "class ${panel} extends Panel" "$file"; then
    echo "  ✅ Extends Panel"
  else
    echo "  ❌ FAIL: Does not extend Panel"
    echo ""
    ((FAIL++))
    continue
  fi

  # Check 4: Has setData method
  if grep -q "public.*setData" "$file" || grep -q "setData.*:" "$file"; then
    echo "  ✅ Has setData method"
  else
    echo "  ❌ FAIL: Missing setData method"
    echo ""
    ((FAIL++))
    continue
  fi

  # Check 5: Has render/renderContent method
  if grep -q "render\|renderContent" "$file"; then
    echo "  ✅ Has render/renderContent method"
  else
    echo "  ❌ FAIL: Missing render/renderContent method"
    echo ""
    ((FAIL++))
    continue
  fi

  # Check 6: setData stores data or calls render
  if grep -A 5 "setData" "$file" | grep -q "this.data = " || grep -A 5 "setData" "$file" | grep -q "render"; then
    echo "  ✅ setData stores data or calls render"
  else
    echo "  ⚠️  WARNING: setData may not store data or call render"
  fi

  echo "  ✅ PASS"
  echo ""
  ((PASS++))
done

echo "=== SUMMARY ==="
echo "✅ PASS: $PASS"
echo "❌ FAIL: $FAIL"
echo "Total: $((PASS + FAIL))"