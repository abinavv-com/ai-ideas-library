# 084 · CapEx ROI Tracker (Post-Commissioning)

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh, board | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
For every commissioned CapEx project, tracks actual output volume, quality rejection rate, and energy consumption — comparing to the original business case assumptions monthly. Flags underperformers. Closes the loop between the assumptions Mahesh presents to the board and the reality of what was delivered.

---

## Implementation Blueprint

### Architecture
```
CapEx project database (original business case assumptions) 
→ n8n monthly query: SAP PP (actual output) + SAP QM (actual rejection) + energy meters 
→ Compare actual vs. business case KPIs 
→ Traffic light: On-track / Underperforming / Failing 
→ Monthly report to Mahesh + board
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Business Case DB | SharePoint Excel/list | Original CapEx assumptions |
| SAP PP | Production order actuals | Volume output |
| SAP QM | Rejection data | Quality KPI |
| Energy Data | Smart meters from [[043 - Pipe Energy Cost Attribution Model]] | Energy KPI |
| Comparison | Python | KPI tracking |
| Output | Power BI + Monthly PDF report | Board-level reporting |

### CapEx Business Case Database
```python
capex_project = {
    "project_id": "CAPEX-2024-001",
    "name": "HSAW Line 3 Addition — Anjar",
    "approval_date": "2024-03-15",
    "total_investment_inr": 125_00_00_000,  # ₹125 Crore
    "commissioning_date": "2025-06-01",
    
    # Business case KPI assumptions
    "assumed_kpis": {
        "annual_volume_tons": 120000,          # Original BC assumption
        "quality_rejection_rate_pct": 2.5,     # Expected rejection rate
        "energy_kwh_per_ton": 175,             # Energy efficiency target
        "capacity_utilization_pct": 80,        # Year 1 utilization target
        "additional_revenue_crore": 240,       # From new orders enabled
        "payback_years": 3.2,                  # Original NPV analysis
        "irr_pct": 22,                         # Expected IRR
    },
    
    # Tracking fields (updated monthly)
    "actual_kpis_by_month": []
}
```

### Monthly Tracking Queries
```python
def track_capex_performance(project_id, month):
    capex = get_capex_project(project_id)
    
    # Actual production from SAP PP
    actual_volume = sap_query(f"""
        SELECT SUM(confirmed_yield_tons) FROM PP_ORDER_CONFIRMATION
        WHERE production_line = '{capex["equipment_id"]}' AND period = '{month}'
    """)
    
    # Actual rejection rate from SAP QM
    actual_rejection = sap_query(f"""
        SELECT (rejected_qty / total_qty * 100) AS rejection_pct
        FROM QM_INSPECTION_LOTS WHERE equipment = '{capex["equipment_id"]}' AND period = '{month}'
    """)
    
    # Actual energy from smart meters
    actual_energy_kwh = get_energy_meter_reading(capex["equipment_id"], month)
    actual_energy_per_ton = actual_energy_kwh / actual_volume if actual_volume > 0 else None
    
    # Compare to business case
    volume_achievement_pct = actual_volume / (capex["assumed_kpis"]["annual_volume_tons"] / 12) * 100
    
    return {
        "month": month,
        "actual_volume_tons": actual_volume,
        "volume_vs_bc_pct": volume_achievement_pct,
        "actual_rejection_pct": actual_rejection,
        "rejection_vs_bc": actual_rejection - capex["assumed_kpis"]["quality_rejection_rate_pct"],
        "actual_energy_per_ton": actual_energy_per_ton,
        "energy_vs_bc": actual_energy_per_ton - capex["assumed_kpis"]["energy_kwh_per_ton"] if actual_energy_per_ton else None
    }
```

### Monthly CapEx ROI Report
```
CAPEX PERFORMANCE TRACKER — May 2026
Report for: Mahesh (CFO), Sarados (CEO), Board Committee

PROJECT: HSAW Line 3 — Anjar (CAPEX-2024-001)
Investment: ₹125 Cr | Commissioned: June 2025 | Months tracking: 12

CUMULATIVE KPI PERFORMANCE (vs. Business Case):

VOLUME: ✅ On Track
  BC Year 1: 120,000 tons | Actual: 108,000 tons (90% of plan)
  Annualized revenue: ₹214Cr vs. BC ₹240Cr (-11%)
  Note: Short by 12,000 tons — new customer orders needed

QUALITY: ✅ Better than BC
  BC rejection: 2.5% | Actual average: 2.1% | Better by 0.4%
  Quality saving vs. BC: ~₹1.2Cr over 12 months

ENERGY: 🟡 Slightly Below Target
  BC: 175 kWh/ton | Actual: 189 kWh/ton (+8%)
  Cause: Strip straightener running at higher tension than optimal
  Excess energy cost: ~₹42L vs. BC

FINANCIAL:
  Revenue earned: ₹214 Cr | BC assumption: ₹240 Cr
  Actual IRR estimate (at current trajectory): 18% vs. BC 22%
  Payback: 3.8 years vs. BC 3.2 years — 7 months slower

OVERALL STATUS: 🟡 BELOW TARGET — Corrective Action Required
Root cause: Volume 10% below plan. Business development team to address.
Board note: Year 2 ramp-up critical to recover financial case.
```

### Estimated Build Time
- CapEx database setup: 1 day (one-time)
- SAP data queries: 2–3 days
- Report template: 2 days
- Power BI: 2 days
- Total: ~1 week

---

## Related Ideas
- [[011 - Investment Assumptions Auditor]] — reviews assumptions before CapEx approval
- [[043 - Pipe Energy Cost Attribution Model]] — energy data feeds into CapEx energy KPI
- [[040 - Production OEE Live Dashboard]] — OEE is a key CapEx performance metric
- [[083 - Project-Level Profitability Tracker]] — similar attribution methodology
- [[002 - SAP Board Deck Automator]] — CapEx performance section in board deck

---

## Notes
- The single most important use of this tool: showing that proposed CapEx assumptions need to be more conservative. After tracking 5 projects, a pattern emerges of which assumptions are always optimistic — this calibrates future proposals.
- Apply discounted cash flows retrospectively: as actuals come in, recalculate IRR monthly. Showing the board the IRR trend (improving or declining) is more informative than a static CapEx report.
