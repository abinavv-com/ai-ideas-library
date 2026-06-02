# 005 · USD/INR & Oil Price Alert System

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Mahesh, Finance team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors live FX and Brent crude rates. Sends an instant Gmail alert when rates cross user-defined thresholds (e.g., USD/INR > 86, Brent > $90). Finance team gets alerted in real-time instead of checking manually — critical for hedging decisions and bid margin protection.

---

## Implementation Blueprint

### Architecture
```
n8n Cron (every 15 min during market hours) 
→ Alpha Vantage / Yahoo Finance API (USD/INR + Brent crude) 
→ Compare against threshold table 
→ Gmail alert on breach + contextual commentary
→ n8n Data Table rows for run history
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Orchestration | n8n | Scheduling and alerting |
| FX Data | Alpha Vantage API or Yahoo Finance API | Live USD/INR rates |
| Commodity Data | Alpha Vantage (commodity endpoint) or Quandl | Brent crude prices |
| Threshold Config | Google Sheet or n8n environment variables | Editable by Mahesh without code |
| Alert | n8n Gmail node | Email notification to Mahesh / finance team |
| History | n8n Data Table rows | Track every poll, alert history, and email queue state |

### APIs Required
- **Alpha Vantage** — Free tier: 25 API calls/day; premium ~$50/month for intraday
  - FX: `GET /query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=INR`
  - Commodity: `GET /query?function=BRENT&interval=daily`
- **Yahoo Finance (unofficial)** — `GET /v8/finance/chart/INR=X` — Free, no auth, but unofficial/unstable
- **Frankfurter API** — Free, reliable FX API: `GET /latest?from=USD&to=INR`
- **EIA (US Energy Information)** — Free official Brent crude data: `GET /series/PET.RBRTE.D`

### Threshold Configuration (Google Sheet)
```
| Metric    | Alert_High | Alert_Low | Last_Alerted |
|-----------|-----------|----------|--------------|
| USD/INR   | 86.00     | 82.00    | 2026-05-15   |
| Brent_USD | 90.00     | 70.00    | 2026-05-10   |
| HRC_INR   | 65000     | 52000    | —            |
```
Mahesh can update thresholds in the sheet; n8n reads it each cycle.

### n8n Workflow Design
1. **Cron trigger**: Every 15 minutes, Monday–Friday 09:00–17:30 IST
2. **HTTP Request nodes** (parallel): Fetch USD/INR + Brent rates
3. **Google Sheets node**: Read current threshold table
4. **IF nodes**: Compare each rate against high/low thresholds
5. **IF node**: Check `Last_Alerted` — don't re-alert within 2 hours of same breach
6. **OpenClaw node (optional)**: Generate 2-line commentary — "Brent hit $91. Impact: steel coking coal imports up ~₹800/ton. Recommend reviewing open bids with steel price assumptions below ₹54,000/ton."
7. **Data Table node**: Create/reuse `005_market_monitor_rows`
8. **Data Table node**: Insert one row per run with `run_id`, `captured_at`, `usd_inr`, `brent_usd`, `status`, `alert_count`, `alert_payload`, and `email_queued`
9. **Gmail node**: Send HTML alert email with current rate, threshold crossed, and LLM commentary
10. **Google Sheets or Data Table node**: Update `Last_Alerted` timestamp if cooldown logic is enabled

### Alert Message Format
```
⚠️ RATE ALERT — USD/INR
Current: 86.42 | Threshold: 86.00 | Crossed at: 14:32 IST

Impact estimate: Open bids with USD cost components — margin erodes ~0.4% per rupee move.
Action: Review 3 open RFPs with USD-denominated material costs.

[View live rates dashboard]
```

### Estimated Build Time
- Developer: Half a day
- Non-developer with n8n: 1–2 days

### Cost
- Alpha Vantage free tier: Sufficient for daily monitoring
- Alpha Vantage Premium: $50/month if intraday needed
- n8n: Free self-hosted
- Total ongoing: ₹0–4,000/month

---

## Related Ideas
- [[004 - Port Congestion Alert Bot]] — same alert architecture, different data source
- [[011 - Investment Assumptions Auditor]] — uses live rates to audit CapEx assumptions
- [[060 - Monte Carlo Bid Margin Simulator]] — uses these live rates as inputs
- [[082 - Commodity Price Impact on Open Orders]] — downstream analysis of rate impacts
- [[056 - Steel Scrap Price Forecaster]] — related commodity monitoring

---

## Notes
- Add HRC (Hot Rolled Coil) steel price monitoring from Platts/SteelMint RSS feed as a third alert — this is more directly margin-relevant than Brent for pipe manufacturing
- Consider a daily 09:00 morning briefing message even when no threshold is breached — "USD/INR: 85.3 (stable). Brent: $87.2 (+1.2%). No alerts today."
- SteelMint India provides free RSS feeds for Indian HRC prices
