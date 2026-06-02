# 047 · Spare Parts Inventory Reality Check

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Weekly n8n job compares SAP spare parts inventory records against a physical count log (entered by warehouse staff via tablet). Flags discrepancies >10% and highlights ghost-inventory items — preventing the "SAP says we have it, shelf is empty" breakdown surprise.

---

## Implementation Blueprint

### Architecture
```
Physical count (tablet entry by warehouse staff weekly) 
→ n8n comparison with SAP MM inventory 
→ Flag discrepancies >10% 
→ Identify ghost inventory (SAP shows stock, physical = zero) 
→ Prioritize investigation by item criticality 
→ Report to Anurag Singh
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Physical Count | React Native tablet app or simple web form | Warehouse staff enters counts |
| SAP Data | SAP MM BAPI `BAPI_MATERIAL_STOCK_REQ_LIST` | Pull SAP inventory quantities |
| Comparison | Python + n8n function node | Calculate discrepancies |
| Criticality Scoring | Python (classify by machine importance) | Prioritize discrepancies |
| Reporting | Power BI or Excel + Teams notification | Report to Anurag Singh |

### Tablet Counting App (Simple Web Form)
```html
<!-- Mobile-friendly counting form -->
<h2>Spare Parts Count — Week of [Date]</h2>
<input type="text" id="bin_location" placeholder="Bin location (e.g., S-12-A)">
<input type="text" id="sap_material_no" placeholder="SAP Material Number">
<input type="number" id="physical_count" placeholder="Physical count quantity">
<input type="text" id="unit" placeholder="Unit (EA/KG/MTR)">
<select id="condition">
  <option>Good</option>
  <option>Damaged</option>
  <option>Obsolete</option>
  <option>Wrong part</option>
</select>
<textarea placeholder="Notes (optional)"></textarea>
<button>Submit Count</button>
```
Counts submitted to n8n webhook → stored in database.

### Criticality Classification
```python
item_criticality = {
    # CRITICAL: Failure causes production line stop
    "HSAW_DRIVE_MOTOR_BEARINGS": "CRITICAL",
    "LSAW_PRESS_HYDRAULIC_SEAL_KIT": "CRITICAL",
    "HYDRO_TEST_PUMP_SEAL": "CRITICAL",
    
    # HIGH: Failure causes significant production impact (but workaround exists)
    "SHOT_BLAST_TURBINE_BLADES": "HIGH",
    "ANNEALING_FURNACE_BELT_LINK": "HIGH",
    
    # MEDIUM: Failure causes minor delays
    # LOW: Consumables, easy to source
}

def get_criticality(material_id):
    return item_criticality.get(material_id, "MEDIUM")
```

### Discrepancy Report
```
SPARE PARTS INVENTORY RECONCILIATION — Week of 2026-06-01
Warehouse: Anjar Plant | Counted by: Warehouse Team

CRITICAL DISCREPANCIES (Action Required):
| Material | Description | SAP Qty | Physical | Discrepancy | Criticality |
|---|---|---|---|---|---|
| 1200-4521 | HSAW Drive Motor Bearing 6316 | 4 EA | 0 EA | -4 (100%) | 🔴 CRITICAL |
| 1200-4889 | Hydro-test Pump Seal Kit | 2 SET | 1 SET | -1 (50%) | 🔴 CRITICAL |
| 2100-0421 | 3LPE Extruder Heater Band | 6 EA | 3 EA | -3 (50%) | 🟡 HIGH |

⚠️ GHOST INVENTORY (SAP says stock exists, shelf is empty):
• 1200-4521: Motor bearing — SAP shows 4, physical = 0
  → Emergency procurement required. Lead time: 3 days (local supplier)
  → Current machine runtime since last bearing change: 14,000 hrs (spec: 20,000 hrs)
  → Risk: LOW for next 4 weeks

MINOR DISCREPANCIES (>10% but non-critical): [12 items listed]
PHYSICAL SURPLUS (more on shelf than SAP): [3 items — likely unbooked receipts]

Total items counted: 234 | Discrepancies: 18 (7.7%) | Value of discrepancies: ₹2,34,000
```

### Priority Alert Logic
```python
def should_emergency_alert(discrepancy):
    if discrepancy['criticality'] == 'CRITICAL' and discrepancy['physical_qty'] == 0:
        return True  # Ghost inventory on critical item = immediate alert
    if discrepancy['pct'] > 50 and discrepancy['criticality'] in ['CRITICAL', 'HIGH']:
        return True
    return False
```

### Weekly Counting Schedule
Don't count everything weekly — tier the count frequency:
- CRITICAL items: Weekly count (subset of warehouse)
- HIGH items: Bi-weekly count
- MEDIUM/LOW: Monthly or quarterly

This makes the weekly count manageable (30–45 min for critical items only).

### Estimated Build Time
- Tablet app: 1–2 days
- n8n SAP comparison workflow: 2 days
- Report template: 1 day
- Total: 3–5 days

### Cost
- Software: Free
- Tablet (if not available): ₹8,000–15,000

---

## Related Ideas
- [[053 - Spares Auto-Purchase Requisition Bot]] — auto-creates PRs when stockout found
- [[015 - Blanket PO Utilization Alert]] — same early warning philosophy for procurement
- [[048 - SAP PM Order Auto-Scheduler]] — PM scheduling depends on spare availability
- [[054 - Machine Breakdown RCA Knowledge Base]] — spares shortages often appear in RCAs
- [[046 - Predictive Maintenance Dashboard]] — predictive alerts need spares to be available

---

## Notes
- The biggest value is the "ghost inventory" discovery — SAP showing stock that doesn't exist because of missed goods issues, theft, or damage without write-off
- First count often reveals 10–20% discrepancy — this is normal; address systematically over 3 months
- Consider incentivizing accurate physical counts by warehouse staff — public recognition, not punishment
