# 058 · Landing Cost Calculator (Automated)

> **Section**: Supply Chain & Procurement | **Complexity**: 🟢 Week 1–4 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Digital form where the buyer enters supplier quote, port of origin, and HS code. System automatically calculates customs duty, IGST, port handling, inland freight, and insurance — outputting the exact landed cost in 2 minutes instead of the 2-hour manual calculation that involves 4 different spreadsheets.

---

## Implementation Blueprint

### Architecture
```
Web form input (quote + origin + HS code) 
→ Python calculation engine 
→ Fetch: current customs duty rates (ICEGATE API) 
→ Fetch: current FX rates (Alpha Vantage) 
→ Fetch: freight rates (internal rate master) 
→ Output: itemized landed cost breakdown
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| UI | Streamlit web app or React form | Input interface |
| Customs Duty | ICEGATE India customs tariff database | HS code → duty rate |
| FX Rates | Alpha Vantage or Frankfurter API | Live USD/EUR/CNY to INR |
| Freight Rates | Internal rate master (Excel/Google Sheet) | Ocean + inland freight |
| Calculation | Python | Component-wise cost computation |
| Output | Downloadable Excel + screen display | Quotation comparison |

### Cost Components
```python
def calculate_landed_cost(input_data):
    """
    input_data = {
        'supplier_name': 'POSCO Korea',
        'hs_code': '72081000',  # 8-digit HS code
        'origin_country': 'Korea',
        'origin_port': 'Busan',
        'destination_port': 'Mundra',
        'quantity_mt': 500,
        'fob_price_usd_per_mt': 620,
        'incoterm': 'FOB',  # FOB, CIF, CFR, EXW
        'currency': 'USD'
    }
    """
    
    # 1. Base cost in INR
    fob_usd = input_data['fob_price_usd_per_mt'] * input_data['quantity_mt']
    usd_inr = get_live_fx_rate('USD', 'INR')
    fob_inr = fob_usd * usd_inr
    
    # 2. Ocean freight (if FOB — we arrange freight)
    if input_data['incoterm'] == 'FOB':
        freight_usd = get_ocean_freight_rate(
            origin=input_data['origin_port'],
            destination=input_data['destination_port'],
            weight_mt=input_data['quantity_mt']
        )
    
    # 3. Marine insurance (typically 0.35% of CIF value)
    cif_usd = fob_usd + freight_usd
    insurance_usd = cif_usd * 0.0035
    
    # 4. CIF in INR
    cif_inr = (cif_usd + insurance_usd) * usd_inr
    
    # 5. Customs duty (basic customs duty from ICEGATE)
    bcd_rate = get_customs_duty(input_data['hs_code'], input_data['origin_country'])
    bcd_inr = cif_inr * (bcd_rate / 100)
    
    # 6. Social Welfare Surcharge (10% on BCD)
    sws_inr = bcd_inr * 0.10
    
    # 7. IGST (18% on CIF + BCD + SWS)
    igst_base = cif_inr + bcd_inr + sws_inr
    igst_rate = get_igst_rate(input_data['hs_code'])
    igst_inr = igst_base * (igst_rate / 100)
    
    # 8. Port handling charges
    port_charges_inr = get_port_handling(input_data['destination_port'], input_data['quantity_mt'])
    
    # 9. Custom clearance + CHA charges (typically 0.3% of CIF + ₹15,000 fixed)
    cha_charges_inr = cif_inr * 0.003 + 15000
    
    # 10. Inland freight to plant
    inland_freight_inr = get_inland_freight(
        from_port=input_data['destination_port'],
        to_plant='Anjar',
        weight_mt=input_data['quantity_mt']
    )
    
    # Total landed cost
    total_inr = (fob_inr + freight_usd * usd_inr + insurance_usd * usd_inr +
                 bcd_inr + sws_inr + igst_inr + port_charges_inr +
                 cha_charges_inr + inland_freight_inr)
    
    per_mt_inr = total_inr / input_data['quantity_mt']
    
    return {
        'fob_inr_per_mt': fob_inr / input_data['quantity_mt'],
        'ocean_freight_inr_per_mt': freight_usd * usd_inr / input_data['quantity_mt'],
        'insurance_inr_per_mt': insurance_usd * usd_inr / input_data['quantity_mt'],
        'bcd_inr_per_mt': bcd_inr / input_data['quantity_mt'],
        'sws_inr_per_mt': sws_inr / input_data['quantity_mt'],
        'igst_inr_per_mt': igst_inr / input_data['quantity_mt'],
        'port_handling_inr_per_mt': port_charges_inr / input_data['quantity_mt'],
        'cha_inr_per_mt': cha_charges_inr / input_data['quantity_mt'],
        'inland_freight_inr_per_mt': inland_freight_inr / input_data['quantity_mt'],
        'total_landed_cost_inr_per_mt': per_mt_inr,
        'usd_inr_rate_used': usd_inr,
        'calculated_at': datetime.now().isoformat()
    }
```

### HS Code → Duty Rate Lookup
```python
# Maintain a local copy of the customs tariff for steel HS codes
customs_tariff = {
    "72081000": {"description": "HR coil in coils, not further worked", "bcd": 7.5, "igst": 18},
    "72081010": {"description": "HR coil, pickled", "bcd": 7.5, "igst": 18},
    "73053100": {"description": "Longitudinally welded steel pipes", "bcd": 7.5, "igst": 18},
    # Anti-dumping duty varies by supplier country and changes frequently
    "72081000_china": {"additional_anti_dumping_duty": 12.0}
}

# Also query ICEGATE live: https://www.icegate.gov.in/Webappl/TariffSearch
# Automate with headless browser (Playwright) for real-time rates
```

### Multi-Quote Comparison Output
```
LANDED COST COMPARISON — 500 MT Hot Rolled Coil (HS: 72081000)
Calculated: 2026-06-01 11:45 | USD/INR: 85.72

                        POSCO Korea    JSW India     SAIL Bhilai
                        (FOB Busan)    (Ex-Works)    (Ex-Works)
FOB Price:              ₹45,890/MT     ₹46,200/MT    ₹45,100/MT
Ocean Freight:           ₹2,140/MT         —              —
Insurance:                ₹165/MT          —              —
Basic Customs Duty (7.5%):₹3,615/MT        —              —
SWS (10% on BCD):          ₹361/MT         —              —
IGST (18%):              ₹9,399/MT     ₹8,316/MT     ₹8,118/MT
Port Handling:             ₹480/MT         ₹0            ₹0
CHA Charges:               ₹280/MT         ₹0            ₹0
Inland Freight:          ₹1,200/MT      ₹800/MT      ₹1,400/MT

TOTAL LANDED COST:      ₹63,530/MT    ₹55,316/MT    ₹54,618/MT

RECOMMENDATION: SAIL Bhilai — lowest landed cost at ₹54,618/MT
Note: SAIL delivery lead time 6 weeks vs. POSCO 10 weeks — consider buffer.
```

### Estimated Build Time
- Python calculation engine: 2 days
- Streamlit UI: 1 day
- Customs tariff database: 1 day
- Rate master (ocean + inland freight): 1 day
- Total: 4–5 days

### Cost
- All software: Free (Streamlit + Python)
- FX API: Free tier (Alpha Vantage)

---

## Related Ideas
- [[059 - Bid Data Assembler]] — landed cost feeds directly into bid preparation
- [[063 - Tariff Impact CBAM Exposure Calculator]] — export-side tariff calculation companion
- [[019 - Export Incentive Calculator]] — export incentive offset to import cost
- [[005 - USD INR Oil Price Alert System]] — FX rate changes affect landed cost
- [[060 - Monte Carlo Bid Margin Simulator]] — landed cost uncertainty modeled in bid simulations

---

## Notes
- Anti-dumping duties change frequently (DGTR reviews) — mark the effective dates clearly and build a reminder to update the tariff table quarterly
- For import parity pricing (comparing imported vs. domestic), this tool gives a consistent, auditable calculation rather than a back-of-envelope figure
- IGST on imports is fully recoverable as input credit — show both "cash outflow" and "net cost after ITC recovery" in the output
