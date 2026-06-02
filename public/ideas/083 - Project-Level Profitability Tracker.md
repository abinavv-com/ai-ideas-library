# 083 · Project-Level Profitability Tracker

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
SAP data pipeline that attributes actual material cost, labour hours, and overhead to each individual project order — producing a live P&L per project without the manual Excel exercise. Tells Mahesh which projects are printing money and which are quietly bleeding.

---

## Implementation Blueprint

### Architecture
```
SAP CO cost center actuals → Attribute to production orders → Attribute to sales orders 
→ Compare actual costs to standard cost + contracted revenue 
→ Live project P&L: Revenue vs. Cost vs. Margin 
→ Power BI with project drill-down
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| SAP CO | Actual costs per cost center + order | Cost data |
| SAP PP | Production order → material consumption | Actual material used |
| SAP SD | Revenue per sales order | Revenue data |
| SAP PS | Project system (if used) | Project structure |
| Attribution | Python cost allocation rules | Assign overhead |
| Dashboard | Power BI | Live P&L |

### Cost Attribution Model
```python
def calculate_project_actual_costs(sales_order_id):
    """
    Actual costs = Direct material + Direct labor + Manufacturing overhead
    """
    
    # Direct material: what SAP consumed from MM to make the pipes
    direct_material = sap_query(f"""
        SELECT material, quantity, valuation_price, quantity * valuation_price as cost_inr
        FROM MSEG WHERE order_number IN (
            SELECT prod_order FROM PP_ROUTING WHERE sales_order = '{sales_order_id}'
        ) AND movement_type = '261'  -- GI to production order
    """)
    
    # Direct labor: time confirmations from production orders
    direct_labor = sap_query(f"""
        SELECT operation, actual_work_hours, work_center_cost_rate,
               actual_work_hours * work_center_cost_rate as cost_inr
        FROM PP_CONF WHERE order_number IN (
            SELECT prod_order FROM PP_ROUTING WHERE sales_order = '{sales_order_id}'
        )
    """)
    
    # Manufacturing overhead: allocated based on machine hours / labor hours
    prod_order_hours = sum(d['actual_work_hours'] for d in direct_labor)
    plant_avg_overhead_rate = get_plant_overhead_rate()  # ₹/labor-hour
    overhead_allocated = prod_order_hours * plant_avg_overhead_rate
    
    # Revenue from SAP SD billing document
    revenue = sap_query(f"""
        SELECT SUM(net_value) FROM VBRP WHERE sales_order = '{sales_order_id}'
    """)
    
    total_cost = (
        sum(d['cost_inr'] for d in direct_material) +
        sum(d['cost_inr'] for d in direct_labor) +
        overhead_allocated
    )
    
    return {
        'revenue': revenue,
        'material_cost': sum(d['cost_inr'] for d in direct_material),
        'labor_cost': sum(d['cost_inr'] for d in direct_labor),
        'overhead': overhead_allocated,
        'total_cost': total_cost,
        'gross_margin': revenue - total_cost,
        'margin_pct': (revenue - total_cost) / revenue * 100
    }
```

### Power BI Project P&L Dashboard
```
PROJECT PROFITABILITY — Live
Updated: 2026-06-01 17:00

Project        | Customer    | Rev (₹Cr) | Cost (₹Cr) | Margin | Status
SO-4521        | Aramco      | 31.1      | 29.6       | 4.8%   | 🟡 Below target
SO-4587        | JJM Punjab  | 12.4      | 13.1       | -5.6%  | 🔴 LOSS-MAKING
SO-4499        | GAIL        | 18.7      | 15.8       | 15.5%  | 🟢 Excellent
SO-4312        | HPCL        | 8.9       | 8.1        | 9.0%   | 🟢 On target
[...42 more orders]

PORTFOLIO SUMMARY:
Total Revenue: ₹842 Cr | Total Cost: ₹769 Cr | Blended Margin: 8.7%
Best performer: SO-4499 (GAIL, 15.5%)
Worst performer: SO-4587 (JJM Punjab, -5.6%) ← IMMEDIATE ACTION NEEDED
```

### Milestone-Based P&L
Track profitability as the project progresses:
- **Bid stage**: Expected margin (from [[059 - Bid Data Assembler]])
- **Production complete**: Actual cost confirmed, before shipping
- **Delivered**: Final invoice vs. all costs

This shows if margins are trending correctly through the project lifecycle.

### Budget vs. Actual Cost Analysis
For each project, compare:
```python
cost_variance = {
    "material": {
        "budgeted": bid_steel_cost * bid_tonnage,
        "actual": actual_material_consumption,
        "variance_inr": actual - budgeted,
        "variance_pct": (actual - budgeted) / budgeted * 100
    },
    "labor": {...},
    "overhead": {...},
    "logistics": {...}
}
```

### Estimated Build Time
- SAP CO/PP/SD data queries: 1 week
- Attribution model: 1 week
- Power BI dashboard: 3 days
- Total: ~3 weeks

---

## Related Ideas
- [[002 - SAP Board Deck Automator]] — project P&L feeds board deck
- [[084 - CapEx ROI Tracker]] — CapEx projects tracked with same methodology
- [[082 - Commodity Price Impact on Open Orders]] — real-time price impact on project margins
- [[059 - Bid Data Assembler]] — bid assumptions compared to actuals here
- [[090 - Management Dashboard]] — project portfolio view for Sarados

---

## Notes
- SAP CO-PA (Profitability Analysis module) can provide project-level P&L natively — check with Roshan if CO-PA is active and configured for the pipe division. If yes, much of this is already available in SAP.
- The most actionable insight is the JJM payment-timing distortion: JJM projects appear loss-making before government payment arrives. Track "cash margin" (received) separately from "accrual margin" (earned) for government projects.
