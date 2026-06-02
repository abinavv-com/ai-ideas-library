# 085 · EU CBAM Carbon Certificate Generator

> **Section**: Finance & Reporting | **Complexity**: 🟢 Week 1–4 | **Impact**: 🛡️ Compliance, 🏆
> **Helps**: Mahesh, compliance, export team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Calculates embedded carbon content per ton of pipe (Scope 1+2) using energy consumption data, grid carbon intensity, and process emission factors. Generates CBAM-formatted certificates per export shipment to Europe — meeting the EU's mandatory carbon reporting requirement from 2024 and levy payment from 2026.

---

## Implementation Blueprint

### Architecture
```
Energy consumption data (from [[043 - Pipe Energy Cost Attribution Model]]) 
+ Process emissions factors (steel + welding + coating) 
+ Grid carbon intensity (India CEA data) 
→ Python LCA model → Scope 1+2 embedded carbon per ton of pipe 
→ CBAM XML report format (EU-specified format) 
→ Submit to EU CBAM registry
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Energy Data | Smart meters + SAP | Consumption per product type |
| Emission Factors | IPCC + Indian grid data (CEA) | Convert energy to CO2 |
| LCA Model | Python | Scope 1 + 2 calculation |
| Report Format | Python XML/JSON generator | CBAM-specified format |
| Submission | EU CBAM Portal API | Filing |
| Verification | Third-party accreditation (ISO 14064) | Required for claims |

### CBAM Scope and Coverage
EU CBAM (Regulation 2023/956) covers steel products (HS 72-73) exported to EU:
- **Reporting Phase**: Oct 2023 – Dec 2025 (quarterly reports, no payment yet)
- **Payment Phase**: 2026 onwards — CBAM certificates required
- **Scope**: Scope 1 + Scope 2 embedded emissions per ton of exported goods

### Carbon Calculation Methodology
```python
def calculate_embedded_carbon_per_ton(product_type, production_data):
    """
    Calculate Scope 1 + Scope 2 CO2e embedded in 1 ton of pipe
    Following CBAM Implementing Regulation Annex IV methodology
    """
    
    # SCOPE 1: Direct emissions from Welspun's production
    
    # 1a. Natural gas combustion (annealing furnace, preheating)
    natural_gas_m3_per_ton = production_data['gas_consumption_m3'] / production_data['tons_produced']
    scope1_gas = natural_gas_m3_per_ton * GAS_EMISSION_FACTOR  # 2.04 kg CO2/m3

    # 1b. Welding consumables (electrodes, flux)
    flux_consumption_kg = production_data['flux_kg'] / production_data['tons_produced']
    scope1_welding = flux_consumption_kg * FLUX_EMISSION_FACTOR
    
    # 1c. Zinc coating (DI pipes only) — zinc production emissions
    if product_type == 'DI':
        zinc_consumption_kg = production_data['zinc_kg'] / production_data['tons_produced']
        scope1_zinc = zinc_consumption_kg * ZINC_PRODUCTION_EMISSION_FACTOR  # 3.86 kg CO2/kg Zn
    else:
        scope1_zinc = 0
    
    # SCOPE 2: Indirect emissions from purchased electricity
    electricity_kwh_per_ton = production_data['electricity_kwh'] / production_data['tons_produced']
    india_grid_emission_factor = 0.82  # kg CO2/kWh (CEA India grid average 2024)
    scope2 = electricity_kwh_per_ton * india_grid_emission_factor
    
    # UPSTREAM EMISSIONS (Scope 3 — embedded in steel input)
    # CBAM requires the embedded emissions of the steel input too
    steel_input_per_ton = 1.08  # Yield factor
    steel_embedded_emissions = steel_input_per_ton * 1.85  # ~1.85 tons CO2/ton Indian HRC
    
    total_embedded_carbon = scope1_gas + scope1_welding + scope1_zinc + scope2 + steel_embedded_emissions
    
    return {
        'scope1_direct': scope1_gas + scope1_welding + scope1_zinc,
        'scope2_electricity': scope2,
        'upstream_steel': steel_embedded_emissions,
        'total_CO2_per_ton_pipe': total_embedded_carbon
    }
```

### Typical Carbon Intensity (Estimated)
```
LSAW 20" X65 3LPE pipe:
- Scope 1 (direct): 0.12 tons CO2/ton pipe
- Scope 2 (electricity): 0.21 tons CO2/ton pipe
- Upstream (steel): 1.85 tons CO2/ton pipe
- Total embedded: ~2.18 tons CO2/ton pipe

At EU ETS carbon price of €60/ton CO2:
CBAM levy = 2.18 × €60 = €130.8/ton pipe = ~₹11,700/ton pipe
(This must be included in export bid price for EU destinations)
```

### CBAM Quarterly Report (XML Format)
EU mandates a specific XML format for CBAM reports:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CBReport xmlns="urn:EC:CBAM:2023">
  <ReporterInfo>
    <EORINumber>IN0893021456</EORINumber>
    <CompanyName>Welspun Corp Limited</CompanyName>
  </ReporterInfo>
  <Quarter year="2026" quarter="1"/>
  
  <ImportedGoods>
    <GoodsItem>
      <HSCode>73053100</HSCode>
      <Quantity unit="T">500.00</Quantity>
      <CountryOfOrigin>IN</CountryOfOrigin>
      <EmbeddedEmissions>
        <DirectEmissions unit="tCO2e">1090.00</DirectEmissions>  <!-- 2.18 × 500 -->
        <IndirectEmissions unit="tCO2e">105.00</IndirectEmissions>
        <Source>VerifiedReport_ISO14064_WCL_2026Q1.pdf</Source>
      </EmbeddedEmissions>
    </GoodsItem>
  </ImportedGoods>
</CBReport>
```

### ISO 14064 Verification Requirement
CBAM requires emissions data to be VERIFIED by an accredited verifier:
- Cost: ~€5,000–15,000 per year for ISO 14064 verification
- Verifiers: Bureau Veritas, SGS, TÜV SÜD (all operate in India)
- Timeline: Annual verification; quarterly reports based on verified methodology

### Estimated Build Time
- Carbon calculation model: 2 weeks (requires energy data)
- CBAM XML generator: 1 week
- ISO 14064 verification: 2–3 months (external process)
- Total: ~1 month for first version; 3 months for verified version

### Cost
- Python development: Internal
- ISO 14064 verification: €8,000–15,000/year (~₹7–13L)
- ROI: Avoiding CBAM compliance penalty (€50–100/ton CO2 for non-compliance) = potentially ₹5–10Cr/year for large EU shipments

---

## Related Ideas
- [[043 - Pipe Energy Cost Attribution Model]] — provides energy data for this calculation
- [[063 - Tariff Impact CBAM Exposure Calculator]] — calculates the CBAM levy impact on bid price
- [[100 - Pipe Lifecycle Carbon Tracking]] — full lifecycle version of this Scope 1+2 calculation
- [[092 - Pipe Digital Passport]] — CBAM data embedded in the digital passport
- [[019 - Export Incentive Calculator]] — export incentives that partially offset CBAM cost

---

## Notes
- The default values methodology (if you cannot measure directly): CBAM allows using EU default values, which are typically 30-50% higher than actual values for efficient producers. Welspun's actual emissions are likely below defaults — worth measuring precisely.
- The biggest risk: reporting incorrect (too low) embedded emissions to EU authorities constitutes misrepresentation — get ISO 14064 verification before submitting
- Track EU ETS carbon price monthly — CBAM levy rate changes with ETS price
