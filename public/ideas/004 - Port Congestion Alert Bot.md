# 004 · Port Congestion Alert Bot

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency, 💰 Cost Savings
> **Helps**: Mihir, MA Forbush | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors Kandla, Mundra, and international port news every 30 minutes via RSS/news API. Sends a Teams/WhatsApp alert when congestion, strikes, or delays are detected for ports where Welspun has active shipments — giving logistics 24–72 hours to reroute or pre-warn customers.

---

## Implementation Blueprint

### Architecture
```
n8n Cron (every 30 min) → News/RSS Sources 
→ OpenClaw LLM (relevance filter + summary) 
→ Check against active shipment ports (SAP/spreadsheet) 
→ Teams/WhatsApp alert if match found
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Orchestration | n8n | Scheduling and workflow |
| News Sources | RSS feeds + NewsAPI / GDELT | Port news ingestion |
| LLM Filter | OpenClaw / GPT-4o mini | Relevance check and summary |
| Shipment Reference | Google Sheet or SAP export | Active port list |
| Alert | Microsoft Teams Webhook + WhatsApp Business API | Notification delivery |

### APIs & Data Sources
- **NewsAPI.org** — `GET /v2/everything?q=Kandla+port+congestion` — Free tier: 100 req/day; paid: unlimited
- **GDELT Project** — Free global news event database, query via BigQuery
- **RSS Feeds** to monitor:
  - `https://www.portcalls.com/feed/` — Port industry news
  - `https://splash247.com/feed/` — Shipping news
  - Indian Port Trust websites (Kandla, Mundra have news sections)
  - Lloyd's List RSS (paid but authoritative)
- **Microsoft Teams Webhook** — Incoming webhook URL from Teams channel settings
- **WhatsApp Business API** — via Twilio or 360dialog for WhatsApp alerts

### n8n Workflow Design
1. **Cron trigger**: Every 30 minutes
2. **HTTP Request nodes** (parallel): Fetch RSS feeds from 5–8 port news sources
3. **Merge node**: Combine all articles into one list
4. **Filter node**: Keep only articles from last 60 minutes (deduplicate)
5. **OpenClaw node**: For each article, prompt: *"Does this article describe congestion, delay, strike, or operational disruption at any of these ports: Kandla, Mundra, Dubai, Rotterdam, Houston? Answer YES/port_name or NO."*
6. **IF node**: If YES, continue; if NO, discard
7. **Google Sheets / HTTP node**: Cross-reference port name against Welspun's active shipment ports list
8. **IF node**: If Welspun has active shipment at that port → alert
9. **OpenClaw node**: Generate 3-line summary: port, issue, estimated impact, recommended action
10. **Teams + WhatsApp nodes**: Send alert to Mihir and MA Forbush

### Active Shipment Reference
Keep a simple Google Sheet with columns: `Shipment_Ref | Customer | Port_Loading | Port_Discharge | ETA | Status`
n8n reads this sheet every cycle to know which ports to care about.

### Estimated Build Time
- Developer: 1 day
- Non-developer with n8n: 2–3 days

### Cost
- NewsAPI: Free tier sufficient to start; $449/year for unlimited
- n8n: Free self-hosted
- OpenClaw API: ~$5/month (short prompts, low volume)
- Teams webhook: Free
- WhatsApp via Twilio: ~$0.005/message

---

## Related Ideas
- [[005 - USD INR Oil Price Alert System]] — same alert pattern for market prices
- [[061 - Ocean Freight Spot Rate Predictor]] — forecasting complement to this monitoring tool
- [[067 - Export Document Auto-Preparer]] — downstream workflow when shipment is delayed
- [[075 - Vessel Loading Stowage Planner]] — pre-loading planning that pairs with port intelligence
- [[012 - Bill of Lading OCR Extractor]] — part of the same logistics automation stack

---

## Notes
- Start with just Kandla and Mundra — the two ports most relevant to Welspun's domestic shipments
- Add a "snooze" button in Teams so Mihir can silence an alert for a known issue without rebuilding the workflow
- Consider also monitoring: Indian Navy exercise notices (blocks shipping lanes), cyclone alerts via IMD RSS
