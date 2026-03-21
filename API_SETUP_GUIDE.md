# API Key Setup Guide for World Monitor
## Focus: Toronto, Canada + Iran + Europe/Denmark + Russia/Ukraine

---

## 🚀 CRITICAL APIs (Get These First)

### 1. EIA API (U.S. Energy Information Administration)
**What it provides:** Oil prices, energy production, inventory data
**Why important:** Energy security monitoring for Russia/Ukraine sanctions
**Cost:** FREE
**Setup Time:** 5 minutes

**How to get it:**
1. Go to: https://www.eia.gov/opendata/
2. Click "Register" in the top right
3. Fill out the form:
   - Email address
   - Name
   - Organization (can use "Personal" or "Independent Research")
   - Purpose: "Energy market research and monitoring"
4. Check your email for verification link
5. Login and navigate to: Account → My API Keys
6. Copy your API key (starts with a letter like "A" or "B")

**Add to .env:**
```
EIA_API_KEY=your_key_here
```

---

### 2. NASA FIRMS API (Fire Information for Resource Management System)
**What it provides:** Satellite wildfire detection globally
**Why important:** Canadian wildfires + European climate security
**Cost:** FREE
**Setup Time:** 10 minutes

**How to get it:**
1. Go to: https://firms.modaps.eosdis.nasa.gov/api/
2. Click "Create Account" or "Sign Up"
3. Fill out registration:
   - Email address
   - First/Last name
   - Organization: "Personal research" or "Independent monitoring"
   - Country: Canada
   - Intended use: "Disaster monitoring and research"
   - Data products: Select "Active Fire Data" (MODIS/VIIRS)
4. Submit and wait for approval (usually 1-2 business days, often faster)
5. Once approved, login and go to: My Account → API Key
6. Copy your API key

**Add to .env:**
```
NASA_FIRMS_API_KEY=your_key_here
```

---

### 3. ICAO API (International Civil Aviation Organization)
**What it provides:** NOTAM airport closures, aviation notices
**Why important:** Iran/MENA airport monitoring, flight disruptions
**Cost:** FREE
**Setup Time:** 15 minutes

**How to get it:**
1. Go to: https://applications.icao.int/
2. Create an account (look for "Register" or "Sign Up")
3. Fill out registration:
   - Professional/Personal use
   - Your location: Toronto, Canada
   - Purpose: "Aviation safety monitoring"
4. Verify your email
5. Login and navigate to API section or Developer Portal
6. Generate your API key/token

**Add to .env:**
```
ICAO_API_KEY=your_key_here
```

---

## 📊 NEXT 5 BEST APIs (In Priority Order)

### 4. ACLED (Armed Conflict Location & Event Data)
**What it provides:** Real-time conflict events, protests, violence globally
**Why important:** CORE API for Iran + Russia/Ukraine + Europe monitoring
**Cost:** FREE for researchers
**Setup Time:** 10 minutes

**How to get it:**
1. Go to: https://acleddata.com/
2. Click "Login/Register" in top right
3. Choose "Academic/Research" account type (FREE)
4. Fill out registration:
   - Email: use your preferred email
   - Name: Your name
   - Organization: "Independent Research" or leave blank
   - Purpose: "Conflict monitoring and research"
   - Region: Select "Global" or specific regions you care about
5. Agree to terms and submit
6. Check email for verification
7. Login to ACLED → Go to "My Account" → "API Access"
8. **CRITICAL:** Set up email + password for automatic token refresh:
   - Add your ACLED email to .env
   - Add your ACLED password to .env
   - This auto-refreshes tokens that expire every 24 hours

**Add to .env:**
```
ACLED_EMAIL=your_email@example.com
ACLED_PASSWORD=your_password
```

---

### 5. Finnhub API
**What it provides:** Stock market data, company financials, economic indicators
**Why important:** Canadian markets, sanctions impact, energy sector monitoring
**Cost:** FREE tier available (60 calls/minute)
**Setup Time:** 5 minutes

**How to get it:**
1. Go to: https://finnhub.io/
2. Click "Get API Key" (top right)
3. Sign up with:
   - Google/GitHub OR email/password
   - Confirm email if needed
4. Choose "Free" plan (60 calls/minute is plenty)
5. Go to Dashboard → API Key
6. Copy your API key

**Add to .env:**
```
FINNHUB_API_KEY=your_key_here
```

---

### 6. AviationStack API
**What it provides:** Live flight data, airport operations, airline information
**Why important:** Iran flight disruptions, Ukraine airspace restrictions
**Cost:** Limited free tier (100 requests/month)
**Setup Time:** 5 minutes

**How to get it:**
1. Go to: https://aviationstack.com/
2. Click "Get Free API Key"
3. Register with:
   - Name, Email, Password
   - Confirm email
4. Select "Free Plan"
5. Go to Dashboard → Your API Key
6. Copy the key

**Add to .env:**
```
AVIATIONSTACK_API=your_key_here
```

---

### 7. FRED API (Federal Reserve Economic Data)
**What it provides:** US economic indicators, interest rates, employment data
**Why important:** Economic stability monitoring, recession indicators
**Cost:** FREE
**Setup Time:** 5 minutes

**How to get it:**
1. Go to: https://fred.stlouisfed.org/docs/api/api_key.html
2. Click "Request API Key" (middle of page)
3. Fill out form:
   - Email address
   - Description: "Economic research and monitoring"
   - Organization: "Personal research" (or leave blank)
4. Submit
5. Check email for API key (usually instant)
6. Copy the 32-character key

**Add to .env:**
```
FRED_API_KEY=your_key_here
```

---

### 8. Cloudflare Radar API
**What it provides:** Internet outages, connectivity monitoring, cyber threats
**Why important:** European infrastructure monitoring, Canadian digital security
**Cost:** FREE (requires Cloudflare account)
**Setup Time:** 15 minutes

**How to get it:**
1. Go to: https://dash.cloudflare.com/
2. Sign up for free account (email + password)
3. Verify email address
4. Navigate to: Dashboard → Traffic → Radar (or look for "Radar" in sidebar)
5. Generate API Token:
   - Go to: My Profile → API Tokens
   - Create custom token with "Read" permissions for "Radar" service
   - Token format:Bearer token
6. Copy your API token

**Add to .env:**
```
CLOUDFLARE_API_TOKEN=your_token_here
```

---

## 🚀 Quick Start Checklist

**TODAY (Get These First):**
- [ ] EIA API (5 min) - https://www.eia.gov/opendata/
- [ ] NASA FIRMS (10 min, approval time) - https://firms.modaps.eosdis.nasa.gov/api/
- [ ] ICAO API (15 min) - https://applications.icao.int/

**THIS WEEK:**
- [ ] ACLED (10 min) - https://acleddata.com/ - **CRITICAL for your regions**
- [ ] Finnhub (5 min) - https://finnhub.io/
- [ ] AviationStack (5 min) - https://aviationstack.com/
- [ ] FRED API (5 min) - https://fred.stlouisfed.org/docs/api/api_key.html
- [ ] Cloudflare Radar (15 min) - https://dash.cloudflare.com/

---

## 🛠️ Once You Have the Keys

1. Add them to your `.env` file (I can help you do this)
2. Restart your World Monitor containers:
   ```bash
   docker-compose restart worldmonitor
   ```
3. Check the health endpoint to see which data sources are now active

Want me to help you configure these keys as you get them? Just paste each API key here and I'll add it to your configuration!