# 090 · Management Dashboard (Sarados Leadership View)

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Sarados | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Single executive dashboard showing: order book, production throughput, quality rejection rate, maintenance downtime, working capital, and AI initiative ROI — all auto-refreshed daily from SAP and other systems. Sarados sees the full picture in 2 minutes, from anywhere on his phone.

---

## Implementation Blueprint

### Architecture
```
n8n daily (07:00) → Pull data from all underlying systems: 
SAP SD (orders) + SAP PP (production) + SAP QM (quality) + SAP PM (maintenance) 
+ [[081 - Real-Time Working Capital Dashboard]] + AI initiative tracker 
→ Power BI push dataset 
→ Single executive dashboard — mobile + desktop
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Sources | SAP SD/PP/QM/PM + all underlying systems | Real data |
| Orchestration | n8n (daily batch + event-driven updates) | Pull and push |
| Dashboard | Power BI Premium (mobile-optimized) | Sarados' view |
| Delivery | Power BI Mobile app + daily email digest | Multi-channel |
| AI KPIs | Manual tracking spreadsheet initially | AI project progress |

### Dashboard KPIs

**Business Performance (Top Row)**
```
Order Book: ₹842 Cr (47 orders) | Production This Month: 2,847 tons | Revenue Booked: ₹68.2 Cr
YTD Revenue: ₹342 Cr | YTD EBITDA: ₹31.4 Cr (9.2%) | Cash & Equivalents: ₹89 Cr
```

**Operational Metrics (Second Row)**
```
OEE This Week: 76% (target 80%) | Quality Rejection: 2.8% (target <3%) | 
Maintenance Downtime: 18 hrs (target <15 hrs/week)
```

**Key Business Alerts (Third Row)**
```
⚠️ 2 orders below 3% margin — commercial review needed
⚠️ LSAW Line 1 OEE: 62% (below 70% threshold)
✅ On-time delivery: 94% (above 90% target)
```

**AI Initiative ROI Tracker (Bottom Row)**
```
Tools Live: 8 | Tools In Progress: 12 | Total Estimated Monthly Saving: ₹24.8L
Top Performer: Meeting Action Compiler (saves 40 hrs/week) | 
This Month: Freight Invoice Auditor recovered ₹12L
```

### Executive Dashboard Design Principles
- Maximum 12 metrics visible on one screen (no scrolling)
- Traffic light colors only: Green (on-target), Amber (watch), Red (action needed)
- Each metric: current value + vs. target + trend arrow
- Mobile-first design (Sarados likely views on phone during travel)
- Click-through to detail (each metric links to underlying dashboard)

### Drill-Down Structure
```
Sarados sees: "Rejection Rate: 2.8% (target <3%) 🟢"
↓ (clicks)
PN Mahida's QA Dashboard → rejection by product type, by line, by defect type

Sarados sees: "OEE: 76% 🟡"  
↓ (clicks)
[[040 - Production OEE Live Dashboard]] → OEE breakdown by line, by loss category

Sarados sees: "Working Capital: ₹432 Cr (DSO: 72 days) 🟡"
↓ (clicks)
[[081 - Real-Time Working Capital Dashboard]] → AR aging, AP schedule, cash forecast
```

### Daily Morning Email (07:00)
Auto-email to Sarados (and optionally to board members):
```
WELSPUN PIPE DIVISION — Daily Briefing | 2026-06-01

3 THINGS NEEDING YOUR ATTENTION TODAY:
1. ⚠️ JJM Punjab (SO-4587): Project now 12 days behind revised delivery commitment
   Action: Call from Mihir to customer recommended before 10:00 today
   
2. ⚠️ LSAW Line 1 OEE at 62% for 3 days running — no recovery yet
   Anurag Singh is investigating. Update expected by 12:00.
   
3. ⚠️ Order book thin for Q3: Only 4 confirmed orders beyond July 31
   Mihir has 8 bids in progress. 2 decisions expected this week.

YESTERDAY'S HIGHLIGHTS:
✅ Production: 142 pipes (LSAW 89, HSAW 53) — 96% of daily target
✅ Quality: All QA releases cleared — zero holds pending >48 hrs
✅ Freight audit: ₹2.3L recovered from Blue Dart invoice dispute

ORDER BOOK: ₹842 Cr (47 orders) | Last week: ₹836 Cr (+0.7%)

[View Full Dashboard] [Add Note for Board]
```

### Weekly Leadership Summary (Friday 17:00)
Longer format for Sarados's end-of-week review:
- Week's OEE trend by line
- Commercial wins/losses this week
- Top 3 risks and mitigations
- AI initiative updates (weekly velocity)
- Finance: cash position + major payments next week

### Estimated Build Time
- Power BI data model + dashboard: 1 week
- n8n data pipelines (many already built by other projects): 3 days
- Email digest: 2 days
- Mobile optimization: 2 days
- Total: ~2 weeks

### Cost
- Power BI Premium Per User: $20/user/month (or existing M365 Premium)
- n8n: Free (infrastructure already built)

---

## Related Ideas
- [[040 - Production OEE Live Dashboard]] — production metric feeding into this
- [[081 - Real-Time Working Capital Dashboard]] — financial metrics feeding in
- [[051 - Maintenance KPI Live Dashboard]] — maintenance metrics feeding in
- [[083 - Project-Level Profitability Tracker]] — order book profitability
- [[002 - SAP Board Deck Automator]] — monthly board deck that this dashboard feeds

---

## Notes
- Involve Sarados personally in designing the dashboard — the "what 3 metrics would tell you if today is a good day?" question is the most important design input
- Start with 6 metrics, not 12 — add metrics over 3 months as Sarados's usage patterns reveal what he actually looks at
- The morning email is often more valuable than the dashboard itself for a busy CEO — it forces prioritization and delivers insight in the first 2 minutes of the day
