# 063 · Tariff Impact & CBAM Exposure Calculator

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety, 💰
> **Helps**: Mihir, Mahesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
When a new export order is entered, automatically calculates: anti-dumping duty exposure, CBAM carbon levy for EU destinations, and country-of-origin documentation requirements — flagging margin-impacting compliance costs that are currently discovered too late (after the bid is won).

---

## Implementation Blueprint

### Architecture
```
New export order (SAP SD or bid specification) 
→ Identify: destination country + HS code + pipe grade 
→ Look up: current AD duty database + CBAM rates + country-specific requirements 
→ Calculate total compliance cost impact on margin 
→ Alert Mihir/Mahesh if compliance cost >2% of order value
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP SD export order or RFP data | Order details |
| AD Duty Database | Internal Excel (from DGTR notifications) + web scraper | Current duty rates |
| CBAM Rates | European Commission CBAM database | EU carbon levy rates |
| Carbon Intensity | Internal LCA model or industry defaults | Embedded carbon calculation |
| Calculation | Python | Duty + levy amounts |
| Alert | n8n + Teams | Flag to Mihir/Mahesh |

### Anti-Dumping Duty Coverage (Indian Pipes)
```python
# Indian pipe exporters face AD duties in multiple markets
# Updated from respective trade authority notifications

anti_dumping_duties = {
    "USA": {
        "73053100": {  # LSAW large diameter pipes
            "applicable": True,
            "duty_type": "CVD + AD",
            "rate_pct": 8.62,  # Welspun-specific rate (varies by company)
            "authority": "US Department of Commerce",
            "effective_date": "2024-03-15",
            "review_date": "2026-12-31",
            "notes": "Check Welspun's company-specific rate from last COMPAS filing"
        }
    },
    "EU": {
        "73053100": {
            "applicable": True,
            "duty_type": "Anti-dumping",
            "rate_pct": 14.4,  # Check current rate — subject to sunset review
            "authority": "EU Commission"
        }
    },
    "Canada": {
        "73041100": {"applicable": True, "rate_pct": 6.8}
    }
}
```

### EU CBAM (Carbon Border Adjustment Mechanism)
The EU CBAM applies to steel products exported to EU from Oct 2023 (reporting phase), with payments starting 2026:

```python
def calculate_cbam_levy(order):
    """
    Calculate CBAM carbon certificate cost for EU export
    """
    
    # Step 1: Embedded carbon in pipe (tons CO2 per ton pipe)
    embedded_carbon_intensity = calculate_embedded_carbon(order['pipe_type'])
    # Typical for LSAW pipe: 1.8–2.2 tons CO2 per ton pipe
    
    # Step 2: EU ETS carbon price (current + forecast)
    eu_ets_price_eur = get_eu_ets_price()  # €50–80/ton CO2 (2024-2026 range)
    
    # Step 3: CBAM levy = embedded carbon × EU ETS price
    # (Reduced by any carbon price already paid in India — currently zero for Indian steel)
    cbam_levy_eur_per_ton = embedded_carbon_intensity * eu_ets_price_eur
    
    # Step 4: Convert to INR
    cbam_levy_inr_per_ton = cbam_levy_eur_per_ton * eur_inr_rate
    
    # Step 5: Documentation requirement
    # Welspun must provide: verified emissions data per ton of pipe
    # (requires ISO 14064 / CBAM-approved verification)
    
    return {
        "embedded_carbon_tons_CO2_per_ton_pipe": embedded_carbon_intensity,
        "eu_ets_price_eur_per_ton_CO2": eu_ets_price_eur,
        "cbam_levy_eur_per_ton_pipe": cbam_levy_eur_per_ton,
        "cbam_levy_inr_per_ton_pipe": cbam_levy_inr_per_ton,
        "documentation_required": "ISO 14064 verified emissions report",
        "filing_deadline": "Q1 following export year"
    }
```

### Country-Specific Documentation Requirements
```python
country_requirements = {
    "USA": {
        "country_of_origin": "Mandatory — Certificate of Origin (CO) from EEPC",
        "mill_certificate": "Mandatory — API certified mill documentation",
        "customs_bond": "Required for AD duty orders",
        "lead_time_add": "3–5 business days for CO and bond arrangement"
    },
    "EU": {
        "country_of_origin": "EUR.1 Movement Certificate or Registered Exporter (REX)",
        "cbam_report": "Quarterly emissions report to EU authority",
        "ce_marking": "May be required depending on end-use"
    },
    "Saudi_Arabia": {
        "saso_certificate": "SASO product conformity certificate required",
        "aramco_approval": "If for Saudi Aramco — vendor pre-approval required",
        "lead_time_add": "4–6 weeks for SASO approval if not pre-certified"
    }
}
```

### Alert Format
```
⚠️ COMPLIANCE COST ALERT — New Export Order
Order: SO-2026-4521 | Customer: Rotterdam Energy BV | Destination: Netherlands
Pipe: LSAW 20" X65 | Quantity: 500 tons | Bid Price: ₹73,000/ton

COMPLIANCE COST ANALYSIS:
1. Anti-Dumping Duty (EU): 14.4% on pipe value
   Impact: ₹10,512/ton (reduces your effective margin from quoted price)
   Note: Is this duty included in your bid? If not, MARGIN IMPACT: -14.4%

2. CBAM Carbon Levy (EU): €55/ton CO2 × 2.0 tons CO2/ton pipe = €110/ton
   At EUR/INR 89.5: ₹9,845/ton ADDITIONAL COST
   Documentation: ISO 14064 verified emissions report required

3. EUR.1 Origin Certificate: ₹500/ton (administrative cost)

TOTAL COMPLIANCE ADD-BACK NEEDED: ₹20,857/ton
If not priced into bid: Margin Impact: -28.6% on ₹73,000/ton bid

ACTION REQUIRED:
⚠️ Confirm with Mihir: Is AD duty + CBAM included in bid price?
If not: This order is LOSS-MAKING. Revise bid price to ₹93,857/ton minimum.
```

### Estimated Build Time
- AD duty database: 2 days (research + build)
- CBAM calculation: 2 days
- Carbon intensity model: 1 week (or use industry defaults initially)
- n8n integration: 1 day
- Total: ~2 weeks

### Cost
- Software: Free
- EU ETS price feed: Free from ECX or via web scraping
- Total: Near zero

---

## Related Ideas
- [[085 - EU CBAM Carbon Certificate Generator]] — generates the CBAM compliance certificates
- [[019 - Export Incentive Calculator]] — export incentives that offset some compliance costs
- [[063 - Tariff Impact CBAM Exposure Calculator]] — self
- [[058 - Landing Cost Calculator]] — import-side tariff complement
- [[100 - Pipe Lifecycle Carbon Tracking]] — full carbon tracking for CBAM compliance

---

## Notes
- CBAM rates change quarterly with EU ETS carbon price — build an alert to update the rate table when EU ETS moves >10%
- AD duty rates are COMPANY-SPECIFIC for Indian exporters (based on prior COMPAS filings) — verify Welspun's exact current rates, not the generic "all others" rate
- The most common mistake: bidding EU projects without including AD duty — this can turn a 10% margin bid into a 4% loss
