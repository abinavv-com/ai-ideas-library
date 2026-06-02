# 040 · Production OEE Live Dashboard

> **Section**: Manufacturing & Process | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh, Sarados | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Aggregates machine running time, cycle counts, and product output from available PLC signals and manual tablet entries — displaying live OEE (Availability × Performance × Quality) for each production line. Gives Anurag and Sarados a real-time production health score visible from anywhere.

---

## Implementation Blueprint

### Architecture
```
PLC signals (machine running/stopped) + manual tablet entries (downtime reasons) 
+ SAP production data (target output, actual output) 
+ QA reject rates (from SAP QM) 
→ n8n aggregation → Power BI / Grafana live dashboard 
→ Accessible on phones, tablets, and control room TV
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Machine Data | OPC-UA / Modbus from PLC (where available) + manual tablet | Running time, cycle counts |
| Production Data | SAP PP (planned vs. actual output) | Performance component |
| Quality Data | SAP QM (reject rates) | Quality component |
| Aggregation | n8n | Data collection and transformation |
| Dashboard | Power BI Embedded or Grafana | Real-time visualization |
| Mobile View | Power BI Mobile app | Sarados can check from phone |

### OEE Formula
```
OEE = Availability × Performance × Quality

Availability = (Planned Production Time - Downtime) / Planned Production Time
Performance = (Actual Output / Theoretical Max Output at ideal speed)
Quality = (Good Units / Total Units Produced)
```

### Data Sources by Component

**Availability**
- Signal 1: Machine running/stopped (from PLC digital output, if accessible)
- Signal 2: Downtime reason (from operator tablet entry when machine stops)
- Downtime categories: breakdown, planned maintenance, changeover, material shortage, quality hold, operator absence

**Performance**
- Ideal cycle time per pipe (by product type) → stored in reference table
- Actual pipes produced per hour → from SAP PP production confirmations
- Performance = actual output / theoretical output at ideal cycle time

**Quality**
- Total pipes produced → from SAP PP
- Rejected pipes → from SAP QM
- Quality % = (total - rejects) / total

### Manual Tablet Entry (Where PLC Signal Not Available)
```html
<!-- Simple web form on shop floor tablet -->
<h2>Line 1 — LSAW — Downtime Entry</h2>
<select name="reason">
  <option>Breakdown</option>
  <option>Planned Maintenance</option>
  <option>Changeover</option>
  <option>Waiting Material</option>
  <option>Quality Hold</option>
  <option>Other</option>
</select>
<textarea name="details" placeholder="Brief description"></textarea>
<button>Submit Downtime Start</button>
<button>Downtime Ended</button>
```
Form posts to n8n webhook → logged with timestamp, reason, line.

### n8n Data Pipeline (Runs Every 5 Minutes)
1. **HTTP Request nodes** (parallel): 
   - OPC-UA/Modbus: read running state from PLC
   - SAP PP: get production confirmations (pipes produced last hour)
   - SAP QM: get reject counts
   - Tablet form DB: get manual downtime entries
2. **Function node**: Calculate OEE components for each line
3. **HTTP POST node**: Push to Power BI Push Dataset API or Grafana InfluxDB
4. **IF node**: OEE < 60%? → Teams alert to Anurag Singh

### Power BI Dashboard Layout
```
┌──────────────────────────────────────────────┐
│  WELSPUN PRODUCTION OEE — LIVE               │
│  Last updated: 14:35 | Status: 3/4 Lines Running │
├──────────────┬──────────────┬────────────────┤
│ LSAW LINE 1  │ HSAW LINE 2  │ DI FURNACE     │
│ OEE: 78% 🟢 │ OEE: 61% 🟡 │ OEE: 84% 🟢   │
│ Avail: 92%  │ Avail: 74%   │ Avail: 91%     │
│ Perf: 88%   │ Perf: 88%    │ Perf: 95%      │
│ Qual: 97%   │ Qual: 94%    │ Qual: 97%       │
│             │ ⚠️ Seam drift │                 │
│             │ since 13:45  │                 │
├─────────────┴──────────────┴────────────────┤
│ TODAY'S PRODUCTION: 124 pipes (target: 148)  │
│ Downtime: 47 min — Breakdown: 35 min, Chgover: 12min │
└──────────────────────────────────────────────┘
```

### OEE Alert Thresholds
- OEE < 65% for 30+ minutes → alert Anurag Singh
- Availability < 70% → alert maintenance supervisor
- Performance < 75% → alert production supervisor
- Quality < 90% → alert QA supervisor (PN Mahida)

### World-Class OEE Benchmarks (for Context)
- World class manufacturing: OEE > 85%
- Typical for heavy industry: OEE 60–75%
- Set initial target: 70% → improve to 80% in 12 months

### Estimated Build Time
- PLC/OPC-UA integration: 3–4 weeks (controls engineer required)
- Tablet entry system: 3 days
- SAP data integration: 1 week
- Power BI dashboard: 1 week

### Cost
- Power BI Pro: $10/user/month (or existing M365 license)
- Grafana: Free open source alternative
- n8n: Free self-hosted

---

## Related Ideas
- [[044 - Daily Production Output Live Counter]] — feeds the production count into this dashboard
- [[051 - Maintenance KPI Live Dashboard]] — maintenance KPIs on same dashboard infrastructure
- [[090 - Management Dashboard]] — Sarados-level view that includes OEE
- [[041 - WhatsApp Change Management System]] — downtime events documented here, communicated there
- [[045 - Production What-If Schedule Simulator]] — uses OEE data to model line disruptions

---

## Notes
- Start with just "running/not running" data from one line — add complexity gradually
- If no PLC connectivity, use a simple button (green = running, red = stopped) on a tablet — even manual data is better than no data
- The most valuable insight is often not the OEE number itself but the "downtime Pareto chart" — which reasons account for 80% of lost time
