# Toronto Variant Access Guide

## Current Issue: No "Tabs" in World Monitor UI

World Monitor **does not have variant tabs** in the user interface. The variant system works through:

1. **Subdomains** (Production)
   - `worldmonitor.app` → Full variant
   - `tech.worldmonitor.app` → Tech variant
   - `finance.worldmonitor.app` → Finance variant
   - `commodity.worldmonitor.app` → Commodity variant
   - `toronto.worldmonitor.app` → Toronto variant

2. **localStorage** (Development/Localhost)
   - Manually set variant for testing

## How to Access Toronto Variant

### Method 1: Browser Console (Development)

1. Open World Monitor in browser
2. Press `F12` to open Developer Tools
3. Go to Console tab
4. Run this command:
```javascript
localStorage.setItem('worldmonitor-variant', 'toronto');
location.reload();
```

5. The page will reload with Toronto variant

### Method 2: Add Development Variant Switcher

I can add a small development-only switcher dropdown to the UI for easy variant switching during development.

**To add this, run:**
```
/skill create-new-variant-tab
```

Then add this code to create a switcher component.

### Method 3: URL Parameter (If Implemented)

Check if URL parameters work:
```
http://localhost:3000/?variant=toronto
```

## Why No Tabs?

The variant architecture is designed for **separate deployments**:
- Each variant has its own subdomain
- Different branding, SEO, and analytics
- Different audiences (global vs Toronto users)
- Can be deployed to different servers if needed

Tabs would confuse this architecture.

## Development Workflow

During development on `localhost`:

```javascript
// Switch to Toronto
localStorage.setItem('worldmonitor-variant', 'toronto');
location.reload();

// Switch to Finance
localStorage.setItem('worldmonitor-variant', 'finance');
location.reload();

// Reset to Full
localStorage.setItem('worldmonitor-variant', 'full');
location.reload();
```

## Verify Toronto Variant is Loaded

After switching, verify in console:
```javascript
console.log('Current variant:', import.meta.env.VITE_VARIANT);
// Or check window.location.hostname
```

**Expected result:**
- Map centers on Toronto (lat: 43.6532, lon: -79.3832)
- Toronto panels appear (Fire CAD, 511, etc.)
- Toronto map layers available

## Quick Switch Bookmark

Create a bookmark with this JavaScript for quick variant switching:
```javascript
javascript:(function(){localStorage.setItem('worldmonitor-variant','toronto');location.reload();})();
```

---

**Note:** If you want a UI switcher for development convenience, let me know and I can implement a small development-only dropdown component.