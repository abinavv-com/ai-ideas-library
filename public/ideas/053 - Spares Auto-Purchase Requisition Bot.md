# 053 · Spares Auto-Purchase Requisition Bot

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
When SAP inventory of a critical spare falls below safety stock level, n8n agent auto-drafts a Purchase Requisition in SAP and alerts the maintenance manager for approval — before the stockout causes a breakdown. Eliminates the reactive "we needed that bearing yesterday" emergency.

---

## Implementation Blueprint

### Architecture
```
n8n daily check → SAP MM inventory levels for critical spares 
→ Compare against safety stock levels (per item) 
→ Below threshold: auto-draft PR in SAP with recommended quantity + preferred vendor 
→ Alert Anurag Singh for approval → PR submitted to procurement
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| SAP MM Query | BAPI `BAPI_MATERIAL_STOCK_REQ_LIST` | Get current inventory levels |
| Safety Stock Reference | SAP MM material master or Excel | Min/max stock levels |
| PR Creation | BAPI `BAPI_PR_CREATE` | Create Purchase Requisition |
| Approval | Teams adaptive card | One-click Anurag Singh approval |
| Orchestration | n8n | Daily check + alert |

### Safety Stock Calculation
```python
def calculate_safety_stock(spare_id):
    """
    Safety stock = max daily usage × supplier lead time + buffer
    Reorder point = average daily usage × lead time + safety stock
    """
    historical_usage = get_usage_history(spare_id, months=12)
    avg_daily_usage = statistics.mean(historical_usage)
    max_daily_usage = max(historical_usage)
    
    lead_time_days = get_supplier_lead_time(spare_id)
    
    safety_stock = (max_daily_usage - avg_daily_usage) * lead_time_days
    reorder_point = avg_daily_usage * lead_time_days + safety_stock
    economic_order_qty = calculate_eoq(spare_id)
    
    return {
        'safety_stock': round(safety_stock),
        'reorder_point': round(reorder_point),
        'reorder_quantity': max(economic_order_qty, minimum_order_qty)
    }
```

### Critical Spares Master List
Build with Anurag Singh: the 100 most critical spares, with:
```python
critical_spares = {
    "BEARING_6316": {
        "description": "Deep groove ball bearing 6316",
        "machines_using": ["LSAW_PRESS_1", "HSAW_DRIVE", "DI_FURNACE_FAN"],
        "current_stock": 3,
        "safety_stock": 4,
        "lead_time_days": 3,
        "preferred_vendor": "V-SKF-001",
        "price_inr": 3200,
        "criticality": "CRITICAL"
    },
    "HYDRO_PUMP_SEAL_KIT": {
        "current_stock": 1,
        "safety_stock": 2,
        "lead_time_days": 7,
        "criticality": "CRITICAL"
    }
}
```

### n8n Workflow Design
1. **Cron trigger**: Daily 07:00
2. **SAP RFC node**: Query inventory levels for all 100 critical spares
3. **Function node**: Compare actual stock vs. reorder point
4. **Filter node**: Spares below reorder point (and no PR already open for them)
5. **Loop node**: For each triggering spare:
   a. **SAP BAPI node**: Create draft PR (`BAPI_PR_CREATE`) with:
      - Material number
      - Recommended quantity (reorder quantity)
      - Preferred vendor (from master list)
      - Delivery date: today + lead time
      - Priority: based on current stock vs. safety stock gap
   b. **Teams node**: Send approval card to Anurag Singh
6. **Teams summary**: Daily digest — "3 spares below reorder point, 3 PRs drafted for your approval"

### Approval Card
```
📦 SPARE PARTS REORDER REQUEST
Item: Deep Groove Ball Bearing 6316 (SKF or equivalent)
Material #: 1200-4521

Current Stock: 2 EA (below safety stock of 4)
Recommended Order: 8 EA (3-month supply)
Unit Price: ₹3,200 | Total: ₹25,600

Preferred Vendor: SKF India Ltd (lead time: 3 days)
Alternative: NSK Bearings India (lead time: 5 days)

Machines at risk if not restocked: 
LSAW Press 1, HSAW Drive Motor (both using this bearing)

[✅ Approve PR] [📊 Review & Modify] [❌ Cancel]
```

### Tiered Urgency
```python
def get_urgency(current_stock, safety_stock, lead_time_days):
    # Days of stock remaining at average consumption rate
    days_remaining = current_stock / max(avg_daily_consumption, 0.01)
    
    if current_stock == 0:
        return "STOCKOUT", "🔴 IMMEDIATE — Machine at risk NOW"
    elif days_remaining < lead_time_days:
        return "CRITICAL", "🔴 URGENT — Will stockout before replenishment arrives"
    elif current_stock < safety_stock:
        return "WARNING", "🟡 REORDER — Below safety stock"
    else:
        return "ADVISORY", "🟢 APPROACHING — Monitor"
```

### Estimated Build Time
- SAP MM inventory query: 1 day
- PR creation BAPI: 1 day
- Approval workflow: 1 day
- Critical spares master list: 1 day (with Anurag Singh)
- Total: 4–5 days

### Cost
- n8n: Free
- SAP: Existing license
- Total: Zero ongoing cost
- ROI: Prevents one emergency spot purchase (30–50% premium) per month = ₹20,000–50,000/month

---

## Related Ideas
- [[047 - Spare Parts Inventory Reality Check]] — physical count that validates what SAP shows
- [[015 - Blanket PO Utilization Alert]] — same pattern for bulk purchase orders
- [[064 - Steel Coil Order Fast-Track Approval]] — fast-track approval for urgent PRs
- [[048 - SAP PM Order Auto-Scheduler]] — PM schedule drives spares consumption forecast
- [[046 - Predictive Maintenance Dashboard]] — predictive alerts anticipate which spares will be needed

---

## Notes
- The critical spares list is the most important input — spend time with Anurag Singh to build the top 100 (start with the 20 spares that caused breakdowns in the last year)
- Some spares are "insurance" items (never used but catastrophic if unavailable) — these have very long lead times; set high safety stock regardless of usage rate
- Track "false trigger" rate: if the bot triggers PRs for items that aren't actually needed, reduce sensitivity gradually
