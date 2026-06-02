# 015 · Blanket PO Utilization Alert

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Mihir's procurement team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors SAP blanket purchase order utilization. Sends an alert to procurement when a PO reaches 80% utilization — giving 2–3 weeks lead time for renewal before supply gaps and emergency spot purchases at inflated rates.

---

## Implementation Blueprint

### Architecture
```
n8n daily cron → SAP MM BAPI query (all blanket POs) 
→ Calculate utilization % for each → 
IF any > 80% threshold → Teams/email alert to Mihir 
→ Auto-draft renewal Purchase Requisition in SAP
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Orchestration | n8n | Daily scheduling + alert |
| SAP Data | SAP BAPI `BAPI_PO_GETDETAIL` or RFC_READ_TABLE | Query PO values and releases |
| Alert | Microsoft Teams Webhook + Email | Notify procurement team |
| SAP Action | BAPI `BAPI_PR_CREATE` | Auto-draft renewal PR |

### SAP Data to Extract
```python
blanket_po_data = {
    "po_number": "4500012345",
    "vendor_name": "ABC Steel Vendors",
    "material_description": "Welding Flux Type OP-121TT",
    "total_value_INR": 5000000,      # Total blanket PO value
    "released_value_INR": 4100000,    # Amount already released/called off
    "utilization_pct": 82,            # 4.1M / 5.0M = 82%
    "po_expiry_date": "2026-09-30",
    "remaining_value_INR": 900000,
    "avg_monthly_consumption": 600000, # Calculated from release history
    "months_remaining_at_current_rate": 1.5
}
```

### Alert Logic
```python
def should_alert(po):
    # Alert conditions
    if po['utilization_pct'] >= 80:
        return True, "80% utilization threshold crossed"
    
    # Also alert if PO expires within 60 days regardless of utilization
    days_to_expiry = (po['expiry_date'] - today).days
    if days_to_expiry <= 60:
        return True, f"PO expires in {days_to_expiry} days"
    
    # Alert if projected to run out before expiry
    if po['months_remaining_at_current_rate'] < 2:
        return True, "Projected stockout in <2 months at current consumption rate"
    
    return False, None
```

### n8n Workflow Design
1. **Cron trigger**: Daily at 08:00
2. **SAP RFC node**: `RFC_READ_TABLE` on EKKO (PO header) + EKBE (PO history) tables for all blanket POs
3. **Function node**: Calculate utilization % and projected depletion date for each
4. **Filter node**: Keep only POs that meet alert criteria
5. **IF node**: Any alerts? → continue; No alerts → end silently
6. **Teams node**: Post alert card per PO:
   ```
   ⚠️ Blanket PO Alert: [Vendor] — [Material]
   Utilization: 82% (₹4.1Cr of ₹5.0Cr)
   At current rate: runs out in ~6 weeks
   Expiry: 30-Sep-2026
   [Create Renewal PR] [Snooze 1 week]
   ```
7. **Optional auto-PR**: If utilization > 95% → auto-create draft PR in SAP with same vendor/material

### Dashboard View (Power BI)
Create a simple visual with:
- All active blanket POs as horizontal bars showing % consumed
- Color coded: Green (<60%), Yellow (60–80%), Red (>80%)
- Sort by "weeks remaining" ascending

### Estimated Build Time
- Developer: 1–2 days
- SAP RFC setup: 1 additional day

### Cost
- n8n: Free
- SAP: Existing license
- Total: Zero ongoing cost
- ROI: Prevents a single emergency spot purchase (typically 15–25% premium over contracted rates)

---

## Related Ideas
- [[053 - Spares Auto-Purchase Requisition Bot]] — same pattern for maintenance spares
- [[064 - Steel Coil Order Fast-Track Approval]] — fast-tracks the renewal PO approval
- [[047 - Spare Parts Inventory Reality Check]] — inventory monitoring complement
- [[065 - Vendor Reliability Scorecard]] — vendor performance context for renewal decisions
- [[066 - SKU Rationalization Agent]] — identifies which POs are for rarely-used materials

---

## Notes
- Set different alert thresholds by material criticality:
  - Critical raw materials (steel, flux): Alert at 70%
  - Standard consumables: Alert at 80%
  - Non-critical items: Alert at 90%
- Add a "seasonal adjustment" — if usage historically spikes in Q3, alert earlier for those materials
