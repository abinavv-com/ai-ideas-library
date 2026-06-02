# 081 · Real-Time Working Capital Dashboard

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Live dashboard combining: SAP AR aging, AP payment schedule, inventory valuation, open LC amounts, and FX exposure — giving Mahesh's team the full working capital picture on demand instead of waiting for month-end close.

---

## Implementation Blueprint

### Architecture
```
n8n daily query (SAP FI/CO/MM + bank portal) 
→ AR aging + AP schedule + inventory value + LC register 
→ Power BI live push dataset 
→ Real-time working capital dashboard 
→ Daily cash flow projection + alert if cash drops below threshold
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| SAP FI | RFC calls (AR/AP transactions) | Receivables and payables |
| SAP MM | Material valuation queries | Inventory value |
| LC Register | Excel/SharePoint (maintained by finance) | Open letters of credit |
| FX Rates | Alpha Vantage or Frankfurter API | Live exchange rates |
| Aggregation | n8n + Python | Combine all sources |
| Dashboard | Power BI with push dataset | Real-time display |
| Alerts | Teams | Cash threshold breach alerts |

### SAP Data Queries

**Accounts Receivable (AR) Aging:**
```python
ar_aging = sap_query("""
    SELECT customer, invoice_number, amount_inr, due_date, days_overdue,
           CASE WHEN days_overdue = 0 THEN 'Current'
                WHEN days_overdue <= 30 THEN '0-30'
                WHEN days_overdue <= 60 THEN '31-60'
                WHEN days_overdue <= 90 THEN '61-90'
                ELSE '>90 days' END as aging_bucket
    FROM FI_AR_OPEN_ITEMS WHERE company_code = 'WCL' AND open = True
""")
```

**Accounts Payable (AP) Schedule:**
```python
# Payment obligations due in next 30 days
ap_schedule = sap_query("""
    SELECT vendor, amount_inr, due_date, payment_method, cash_discount_deadline
    FROM FI_AP_OPEN_ITEMS WHERE due_date <= CURRENT_DATE + 30
    ORDER BY due_date
""")
```

**Inventory Valuation:**
```python
inventory = sap_query("""
    SELECT material_type, valuation_class, quantity, valuation_price, total_value
    FROM MM_VALUATED_STOCK WHERE plant = 'AN01'
""")
```

### Working Capital Dashboard Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  WORKING CAPITAL DASHBOARD — WELSPUN PIPE DIVISION                  │
│  Live as of: 2026-06-01 16:45 | Data lag: <30 min                  │
├─────────────────┬───────────────┬─────────────────┬───────────────┤
│ RECEIVABLES     │ PAYABLES      │ INVENTORY       │ CASH POSITION │
│ ₹847 Cr         │ ₹312 Cr       │ ₹428 Cr         │ ₹89 Cr        │
│ DSO: 67 days    │ DPO: 42 days  │ DIO: 51 days    │ ↓ -₹12Cr      │
│                 │               │                 │ vs last week  │
├─────────────────┴───────────────┴─────────────────┴───────────────┤
│ AR AGING (₹Cr)                                                      │
│ Current: 420  |  0-30: 185  |  31-60: 142  |  61-90: 67  |  >90: 33 │
│ At-Risk (>90): JJM Punjab ₹18Cr, NTPC ₹15Cr — both contacted      │
├─────────────────────────────────────────────────────────────────────┤
│ CASH FLOW FORECAST — Next 30 Days                                    │
│ Opening Cash: ₹89Cr                                                 │
│ + Expected Receipts: ₹124Cr (invoices due + expected JJM payment)  │
│ - Scheduled Payments: ₹98Cr (vendor payments + steel purchases)     │
│ = Projected Closing: ₹115Cr                                         │
│                                                                      │
│ ⚠️ Cash dip on 2026-06-10: ₹23Cr (large AP payment cluster)        │
│    Ensure ₹100Cr LC line available                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Alert Conditions
```python
working_capital_alerts = {
    "cash_below_threshold": {
        "condition": "cash_balance < 75_crore",
        "alert": "Cash position below ₹75Cr threshold — review CC/LC line"
    },
    "ar_overdue_spike": {
        "condition": "overdue_above_90_days > previous_week * 1.2",
        "alert": "AR overdue >90 days increased 20%+ this week — review collections"
    },
    "ap_cluster": {
        "condition": "payments_due_tomorrow > 30_crore",
        "alert": "Large AP payment cluster tomorrow: ₹{amount}Cr — ensure fund availability"
    },
    "inventory_spike": {
        "condition": "inventory_value > 500_crore",
        "alert": "Inventory above target — check production plan vs. confirmed orders"
    }
}
```

### Estimated Build Time
- SAP FI data queries: 3–4 days
- Cash flow calculation logic: 2 days
- Power BI dashboard: 2 days
- Alert system: 1 day
- Total: ~2 weeks

### Cost
- Power BI: Existing M365 license
- n8n: Free
- Alpha Vantage FX: Free tier

---

## Related Ideas
- [[082 - Commodity Price Impact on Open Orders]] — how steel prices affect receivables
- [[083 - Project-Level Profitability Tracker]] — project P&L feeds into working capital
- [[086 - Financial Scenario Stress-Tester]] — stress tests this working capital position
- [[089 - Budget vs Actual Variance Alert]] — variance alerts fed from this dashboard
- [[090 - Management Dashboard]] — working capital summary in executive view

---

## Notes
- The single most valuable number in this dashboard is often "DSO by customer" — GAIL at 90 days vs. Aramco at 45 days tells the treasury team exactly where to focus collection efforts
- Build a "collection effectiveness index" — what % of invoices are being paid on the original due date, not just eventually — this measures the collections team's effectiveness
