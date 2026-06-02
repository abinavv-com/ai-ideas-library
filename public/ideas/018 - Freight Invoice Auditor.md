# 018 · Freight Invoice Auditor

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir's logistics team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Compares every logistics vendor invoice against the contracted rate schedule. Automatically flags overbilling, wrong distance calculations, or unauthorized surcharges — with a one-click dispute email draft. Recovers money that currently goes unnoticed in high-volume shipment months.

---

## Implementation Blueprint

### Architecture
```
Invoice received (email/scan) → OCR extraction 
→ Compare against rate master (contracted rates Excel/SAP) 
→ OpenClaw calculates correct amount → Flag discrepancies 
→ Auto-draft dispute email → Approval for sending
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Invoice Input | n8n email watch + PDF attachment | Capture incoming invoices |
| OCR | AWS Textract or Google Document AI | Extract invoice line items |
| Rate Master | Excel / SAP MM pricing conditions | Source of contracted rates |
| Comparison | Python calculation engine | Flag discrepancies |
| Dispute Draft | OpenClaw LLM | Draft professional dispute email |
| Approval | Teams adaptive card | One-click send or modify |

### Invoice Fields to Extract
```python
invoice_data = {
    "invoice_number": "FRT-2026-4521",
    "vendor_name": "Blue Dart Logistics",
    "invoice_date": "2026-06-01",
    "line_items": [
        {
            "description": "Road freight Anjar to Mundra Port",
            "origin": "Anjar, Gujarat",
            "destination": "Mundra Port",
            "weight_tons": 47.5,
            "distance_km": 85,
            "rate_per_ton_per_km": 4.50,
            "billed_amount": 18169,
            "fuel_surcharge_pct": 8,
            "toll_charges": 1200,
            "total_line_amount": 20800
        }
    ],
    "total_invoice_amount": 20800
}
```

### Rate Master (Contract Reference)
Maintain as a structured Excel/Google Sheet:
```
| Vendor | Origin | Destination | Per_Ton_Per_Km | Max_Fuel_Surcharge_Pct | Toll_Included | Valid_From | Valid_Until |
|---|---|---|---|---|---|---|---|
| Blue Dart | Anjar | Mundra | 4.20 | 6% | No | 2026-01-01 | 2026-12-31 |
```

### Audit Logic
```python
def audit_line_item(billed, contracted_rates):
    errors = []
    
    # Distance check
    actual_distance = get_road_distance(billed['origin'], billed['destination'])  # Google Maps API
    if abs(actual_distance - billed['distance_km']) > 5:  # >5km discrepancy
        errors.append(f"Distance: billed {billed['distance_km']}km vs actual {actual_distance}km")
    
    # Rate check
    contracted_rate = contracted_rates.get(billed['vendor'], {}).get('rate')
    if billed['rate_per_ton_per_km'] > contracted_rate * 1.01:  # >1% tolerance
        errors.append(f"Rate: billed ₹{billed['rate_per_ton_per_km']} vs contracted ₹{contracted_rate}")
    
    # Surcharge check
    max_surcharge = contracted_rates.get(billed['vendor'], {}).get('max_fuel_surcharge_pct', 0)
    if billed['fuel_surcharge_pct'] > max_surcharge:
        errors.append(f"Fuel surcharge: billed {billed['fuel_surcharge_pct']}% vs max contracted {max_surcharge}%")
    
    return errors
```

### Dispute Email Generator Prompt
```
You are a logistics manager at Welspun Corp disputing an incorrect freight invoice.
Write a professional, firm, but not aggressive dispute email.

Invoice details: {{invoice_data}}
Errors found: {{discrepancies}}
Correct calculated amount: {{correct_amount}}
Overbilled amount: {{difference}}

The email should:
- Reference invoice number and date
- List each discrepancy specifically with the contracted rate vs. billed rate
- State the correct amount payable
- Request a revised credit note within 7 working days
- Maintain the professional relationship
```

### APIs Required
- **Google Maps Distance Matrix API** — validate distances: `$5 per 1,000 requests`
- **Google Document AI / AWS Textract** — invoice OCR
- **Microsoft Graph API** — create Outlook draft email

### n8n Workflow Design
1. **Email watch**: New invoice email with PDF attachment
2. **Document AI node**: Extract invoice fields
3. **Google Sheets node**: Look up contracted rates for vendor
4. **Function node**: Run audit logic for each line item
5. **IF node**: Discrepancies found? → continue; Clean? → auto-approve and notify
6. **OpenClaw node**: Generate dispute email draft
7. **Teams card**: Show discrepancy summary + "Send Dispute" / "Approve Invoice" buttons
8. **Graph API node**: Create draft in Mihir's Outlook ready to send

### Expected Recovery
- Freight invoicing errors typically run 2–5% of invoice value
- At ₹2Cr/month logistics spend, recovering 3% = ₹60L/year

### Estimated Build Time
- Developer: 3–4 days
- Rate master data entry: 1 day (one-time)

---

## Related Ideas
- [[012 - Bill of Lading OCR Extractor]] — OCR infrastructure is shared
- [[065 - Vendor Reliability Scorecard]] — freight audit data feeds vendor scoring
- [[052 - Vendor SLA Adherence Tracker]] — SLA tracking for logistics vendors
- [[010 - Supplier Contract Risk Scanner]] — upstream: check if contract terms are favorable
- [[019 - Export Incentive Calculator]] — freight data used in RoDTEP calculations

---

## Notes
- Run the first month in "audit only" mode — generate reports but don't send dispute emails — to calibrate the rate master and catch false positives
- Some freight rate components (tolls, congestion charges) genuinely vary — build tolerance ranges, not exact match rules
- Build a "dispute win rate" tracker — which dispute types consistently succeed, which don't
