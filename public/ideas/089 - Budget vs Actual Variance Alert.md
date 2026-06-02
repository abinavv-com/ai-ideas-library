# 089 · Budget vs. Actual Variance Alert

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
n8n agent queries SAP CO actuals vs. budget weekly. When a cost center exceeds budget by >5%, it sends an automated alert with the variance breakdown to the cost center owner and finance team — catching overspend while there's still time to act, not at month-end.

---

## Implementation Blueprint

### Architecture
```
n8n weekly Monday 08:00 → SAP CO: actual costs vs. budget for all cost centers 
→ Calculate variance (actual vs. budget, vs. prior year) 
→ Flag: >5% overspend → alert to cost center owner + Mahesh 
→ Power BI variance dashboard with drill-down
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| SAP CO | BAPI `BAPI_COSTCENTER_GETACTUALS` | Actual cost data |
| SAP CO Budget | BAPI or RFC_READ_TABLE on COSP/COSS | Budget data |
| Calculation | Python | Variance analysis |
| Alert | Teams adaptive card | Cost center owner notification |
| Dashboard | Power BI | Management variance view |
| Reporting | PDF monthly report | Board-level summary |

### SAP CO Data Structure
```python
cost_center_actuals = {
    "cost_center": "2100",
    "cost_center_name": "LSAW Production — Anjar",
    "cost_center_owner": "Anurag Singh",
    "period": "2026-06",
    
    "budget_ytd_inr": 18_50_00_000,   # ₹18.5 Cr YTD budget
    "actual_ytd_inr": 19_80_00_000,   # ₹19.8 Cr YTD actual
    "variance_inr": 1_30_00_000,      # ₹1.3 Cr overspend
    "variance_pct": 7.0,               # 7% over budget
    
    # This period (monthly)
    "budget_period_inr": 3_20_00_000,
    "actual_period_inr": 3_42_00_000,
    "period_variance_pct": 6.9,
    
    # Cost type breakdown
    "variance_by_cost_type": {
        "direct_material": -0.5,   # Under budget (positive = savings)
        "direct_labor": +3.2,      # Over budget
        "energy": +2.1,            # Over budget  
        "maintenance": +1.2,       # Over budget
        "overhead": +0.0           # On budget
    }
}
```

### Alert Logic
```python
alert_thresholds = {
    "cost_center_variance_pct": 5,    # Alert if >5% variance
    "cost_center_variance_inr": 5000000,  # Also alert if >₹50L absolute
    "escalation_to_mahesh_pct": 10   # Escalate to CFO if >10%
}

def should_alert(cost_center):
    variance_pct = (cost_center['actual_ytd'] - cost_center['budget_ytd']) / cost_center['budget_ytd'] * 100
    variance_inr = cost_center['actual_ytd'] - cost_center['budget_ytd']
    
    if variance_pct > 10:
        return "CRITICAL", f"Cost center {variance_pct:.1f}% over budget — escalating to CFO"
    elif variance_pct > 5 or variance_inr > 5000000:
        return "WARNING", f"Cost center {variance_pct:.1f}% over budget"
    else:
        return None, None
```

### Teams Alert Card
```
⚠️ BUDGET VARIANCE ALERT — Week of 2026-06-01
Cost Center: LSAW Production — Anjar (CC 2100)
Owner: Anurag Singh

YTD Variance: +7.0% OVER BUDGET (₹1.3 Crore)
Budget YTD: ₹18.5 Cr | Actual YTD: ₹19.8 Cr | Overspend: ₹1.3 Cr

Variance Breakdown:
• Direct Labor: +₹60L (breakdown repairs, overtime)
• Energy: +₹39L (higher electricity rates from April tariff revision)
• Maintenance: +₹22L (LSAW gearbox replacement in May)
• Direct Material: -₹9L (yield improvement — positive variance)

June Budget Remaining: ₹3.2 Cr | June Actual Forecast: ~₹3.6 Cr

Recommended Actions:
1. Review overtime authorization process
2. Verify electricity tariff revision — notify Finance for budget reforecast
3. LSAW gearbox: one-off event — should not recur next month

[View Full Variance Report] [Add Explanation] [Request Budget Revision]
```

### Response Management
The alert card has an "Add Explanation" button — Anurag Singh can provide context:
- "Maintenance overspend: LSAW gearbox replacement — one-off event"
- Finance team sees explanation alongside variance
- Builds narrative for board reporting

### Monthly Variance Report for Board
```
BUDGET PERFORMANCE SUMMARY — May 2026

OVERALL BUSINESS:
Revenue: 96% of budget | Operating Cost: 104% of budget | EBITDA Margin: 8.7% (vs. 9.2% budget)

COST CENTER HIGHLIGHTS:
On/Under Budget: HSAW Production (98%), DI Production (97%), QA (100%), Finance (99%)
Over Budget: LSAW Production (+7%), Yard Operations (+5.2%)

KEY VARIANCES EXPLAINED:
1. LSAW +7%: April-May breakdown of main gearbox (one-off ₹72L). Will normalize June onwards.
2. Yard +5.2%: Higher crane hire charges due to equipment outsourcing during maintenance.

FULL-YEAR REFORECAST:
Revenue: ₹842 Cr (vs. budget ₹875 Cr) — ₹33 Cr shortfall (project delay — see management letter)
EBITDA: ₹72 Cr (vs. budget ₹81 Cr) — addressed by commercial recovery plan
```

### Estimated Build Time
- SAP CO query: 2 days
- Variance calculation: 1 day
- Alert + Teams card: 1 day
- Power BI dashboard: 2 days
- Total: ~1 week

---

## Related Ideas
- [[081 - Real-Time Working Capital Dashboard]] — cost overruns affect working capital
- [[083 - Project-Level Profitability Tracker]] — project-level drill-down into these cost centers
- [[051 - Maintenance KPI Live Dashboard]] — maintenance overspend explained here
- [[090 - Management Dashboard]] — budget variance is a key executive metric
- [[043 - Pipe Energy Cost Attribution Model]] — energy overspend explained by this

---

## Notes
- The explanations feature is crucial — without it, the alert system creates anxiety without insight. The system becomes much more valuable when cost center owners add context.
- Build "rolling reforecast" as the next feature: when multiple weeks show >5% variance trend, automatically update the full-year forecast to show Mahesh the likely year-end position
