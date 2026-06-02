# 019 · Export Incentive Calculator (RoDTEP)

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 💰 Cost Savings
> **Helps**: Finance, Mahesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Reads completed export shipping bills and automatically calculates the eligible RoDTEP (Remission of Duties and Taxes on Exported Products) and any applicable MEIS/RoSCTL claim amount per HS code and pipe type — preventing under-claiming of government export incentives that are legally entitled to Welspun.

---

## Implementation Blueprint

### Architecture
```
SAP SD export billing data (or shipping bill PDFs) 
→ n8n extraction → HS code lookup 
→ RoDTEP rate table (customs notification) 
→ Calculate eligible claim per shipment 
→ Summary report for Finance/DGFT filing
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP SD export billing + shipping bills | Shipment details |
| Rate Table | DGFT RoDTEP rate schedule (Excel) | Current incentive rates by HS code |
| Calculation | Python | Claim amount computation |
| Orchestration | n8n | Periodic batch processing |
| Output | Excel report + PDF summary | For DGFT portal filing |

### RoDTEP Rate Table (Key Pipe HS Codes)
```python
rodtep_rates = {
    "73041100": {"description": "LSAW steel pipe, seamless", "rate_pct": 1.6},
    "73042900": {"description": "Steel tubes and pipes, other", "rate_pct": 1.4},
    "73053100": {"description": "Longitudinally welded steel pipes", "rate_pct": 1.8},
    "73059000": {"description": "Other tubes/pipes of iron or steel", "rate_pct": 1.5},
    "73069090": {"description": "DI pipes and fittings", "rate_pct": 2.1}
}
# Rates updated from CBIC Notification 76/2021-Customs (NT) and subsequent amendments
# Must be updated whenever DGFT revises rates — currently reviewed annually
```

### Calculation Logic
```python
def calculate_rodtep(shipping_bill):
    eligible_claim = 0
    claim_breakdown = []
    
    for line in shipping_bill.line_items:
        hs_code = line.hs_code[:8]  # 8-digit HS code
        fob_value_inr = line.fob_value_usd * usd_inr_rate
        
        rate = rodtep_rates.get(hs_code, {}).get('rate_pct', 0)
        line_claim = fob_value_inr * (rate / 100)
        
        claim_breakdown.append({
            "line": line.description,
            "hs_code": hs_code,
            "fob_inr": fob_value_inr,
            "rodtep_rate": f"{rate}%",
            "eligible_claim_inr": line_claim
        })
        eligible_claim += line_claim
    
    return eligible_claim, claim_breakdown
```

### Monthly Report Structure
```
WELSPUN CORP — RODTEP CLAIM SUMMARY
Month: May 2026

Shipment-wise Claims:
SB Number    | Date      | Destination | FOB (USD) | HS Code  | Rate | Claim (₹)
SB-2026-4521 | 2026-05-05| Saudi Arabia| $485,000  | 73053100 | 1.8% | ₹7,47,240
SB-2026-4587 | 2026-05-12| UAE         | $312,000  | 73041100 | 1.6% | ₹4,27,776
...

TOTAL ELIGIBLE CLAIM: ₹38,45,200
DGFT PORTAL FILING DEADLINE: 2026-08-31

Action: File on DGFT portal under RoDTEP Scroll before deadline.
Supporting documents required: Shipping bills (SAP printout), bank realisation certificates.
```

### n8n Workflow Design
1. **Cron trigger**: 1st of every month
2. **SAP SD node**: Pull all export billing documents from previous month
3. **Function node**: Extract HS codes, FOB values, shipment dates
4. **Function node**: Look up RoDTEP rates from rate table (Excel in SharePoint)
5. **Python node**: Calculate claims per line, per shipment, monthly total
6. **Excel node**: Generate claim summary workbook
7. **Email node**: Send to Finance team with summary + Excel attachment
8. **Teams notification**: Alert Mahesh — "May RoDTEP claim: ₹38.5L — file by Aug 31"

### Additional Incentives to Track
- **Duty Drawback** — on imported components used in exported pipes
- **Advance Authorization** — for duty-free import of raw materials for export
- **EPCG** — Export Promotion Capital Goods scheme for machinery imports
- All can be added as additional calculation modules

### Estimated Build Time
- Developer: 2–3 days
- Rate table setup and validation: 1 additional day

### Cost
- Zero tools cost (Excel + Python + n8n)
- ROI: At ₹30–50L claimed per month (industry typical for a mid-size pipe exporter), even 10% under-claiming recovered = ₹3–5L/month

---

## Related Ideas
- [[012 - Bill of Lading OCR Extractor]] — shipping bill data feeds this calculator
- [[063 - Tariff Impact CBAM Exposure Calculator]] — partner tool for import duty + export levy analysis
- [[085 - EU CBAM Carbon Certificate Generator]] — EU-specific export compliance
- [[067 - Export Document Auto-Preparer]] — upstream document generation
- [[081 - Real-Time Working Capital Dashboard]] — export incentive receivables tracked here

---

## Notes
- RoDTEP rates change — set a calendar reminder (use [[017 - Legal Compliance Calendar Bot]]) to review CBIC notifications annually in March/April when budget changes take effect
- Some HS codes are excluded from RoDTEP entirely — build an exclusion list
- Coordinate with the customs broker who files the shipping bills to ensure HS code accuracy, as incorrect HS codes are the #1 reason for claim rejection
