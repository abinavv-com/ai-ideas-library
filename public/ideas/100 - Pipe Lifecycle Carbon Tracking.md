# 100 · Pipe Lifecycle Carbon Tracking (Scope 3)

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive, 🛡️
> **Helps**: All — ESG & commercial | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Extends the [[092 - Pipe Digital Passport]] to include a full carbon lifecycle model per pipe: from raw steel extraction → forming → coating → shipping → field installation. Oil & gas customers get verified Scope 3 supply chain carbon data automatically — making Welspun a preferred sustainable supplier in a world where Scope 3 reporting is becoming mandatory.

---

## Implementation Blueprint

### Architecture
```
Pipe Digital Passport + Energy Attribution Model + Supply Chain data 
→ Python LCA (Life Cycle Assessment) model (ISO 14040/14044) 
→ Full cradle-to-gate carbon calculation per ton of pipe 
→ CBAM compliance data for EU shipments 
→ Customer-facing carbon certificate per shipment
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| LCA Framework | Python `brightway2` (open-source LCA) or custom | Life cycle assessment |
| Background DB | Ecoinvent database (licensed) or SimaPro | Upstream emission factors |
| Energy Data | [[043 - Pipe Energy Cost Attribution Model]] | Scope 1+2 emissions |
| Steel Supplier Data | Supplier-provided EPDs or IPCC defaults | Upstream Scope 3 |
| Verification | ISO 14064 certified verifier | Third-party validation |
| Reporting | [[092 - Pipe Digital Passport]] integration | Publish to passport |
| Customer Reports | Python reportlab PDF | Per-shipment carbon certificate |

### Life Cycle Assessment Scope

**Cradle-to-Gate (What Welspun Controls)**
```python
lca_scope = {
    "A1_raw_material_extraction": {
        "description": "Iron ore mining → steelmaking → hot rolled coil",
        "emission_factor": 1.85,  # tons CO2/ton HRC (world average; TATA Steel reports ~1.6-1.9)
        "data_source": "Supplier EPD or Worldsteel average",
        "scope": "Scope 3 upstream"
    },
    
    "A1_alloying_elements": {
        "description": "Niobium, vanadium, titanium microalloying additions",
        "emission_factor_kg_CO2_per_kg": {"Nb": 8.4, "V": 12.1, "Ti": 3.5},
        "data_source": "Ecoinvent database"
    },
    
    "A2_transport_steel_to_plant": {
        "description": "Rail/road transport from TATA/JSW/SAIL to Anjar",
        "emission_factor": 0.062,  # kg CO2/ton-km (rail, India)
        "typical_distance_km": 1200,
        "data_source": "Indian Railway emission factor"
    },
    
    "A3_manufacturing": {
        "description": "LSAW/HSAW/DI pipe manufacturing + coating",
        "scope1": "Natural gas combustion, diesel forklifts",
        "scope2": "Grid electricity (India average: 0.82 kg CO2/kWh)",
        "data_source": "[[085 - EU CBAM Carbon Certificate Generator]] calculation"
    }
}
```

### Full Carbon Calculation Per Ton of Pipe
```python
def calculate_full_lifecycle_carbon(pipe_batch, product_type='LSAW_X65_3LPE'):
    """
    Returns CO2e per ton of pipe (cradle-to-gate)
    """
    
    # A1: Raw material extraction
    steel_input_per_ton = 1.08  # Yield factor
    steel_supplier = pipe_batch['steel_supplier']
    
    # Get supplier-specific or default emission factor
    steel_ef = supplier_emission_factors.get(steel_supplier, WORLD_AVERAGE_STEEL_EF)
    a1_steel = steel_input_per_ton * steel_ef
    
    # A1: Alloying elements (small but worth tracking for X70/X80)
    a1_alloys = calculate_alloy_emissions(pipe_batch['mtc_composition'])
    
    # A1: Coating materials (PE resin, FBE powder, adhesive)
    if '3LPE' in product_type:
        # PE resin: ~2.5 kg CO2/kg PE
        pe_kg_per_ton_pipe = 32  # Typical for 3.5mm 3LPE on 20" pipe
        a1_coating = pe_kg_per_ton_pipe * 2.5 + FBE_emissions + adhesive_emissions
    
    # A2: Transport
    distance_km = get_transport_distance(steel_supplier, 'Anjar')
    transport_mode = get_transport_mode(steel_supplier)
    a2 = steel_input_per_ton * distance_km * transport_emission_factors[transport_mode]
    
    # A3: Manufacturing (from [[085 - EU CBAM Carbon Certificate Generator]])
    a3_scope1, a3_scope2 = calculate_manufacturing_emissions(pipe_batch)
    
    # A4: Transport to port/customer
    a4 = calculate_outbound_transport(pipe_batch['destination'])
    
    total_GHG = a1_steel + a1_alloys + a1_coating + a2 + a3_scope1 + a3_scope2 + a4
    
    return {
        'scope3_upstream': a1_steel + a1_alloys + a1_coating + a2,
        'scope1_manufacturing': a3_scope1,
        'scope2_electricity': a3_scope2,
        'scope3_downstream': a4,
        'total_CO2e_per_ton': total_GHG,
        
        # Breakdown percentages
        'steel_making_share_pct': a1_steel / total_GHG * 100,
        'manufacturing_share_pct': (a3_scope1 + a3_scope2) / total_GHG * 100
    }
```

### Carbon Certificate (Customer-Facing)
```
WELSPUN CORP — CARBON DECLARATION
Shipment: SO-2026-4521 | Customer: Saudi Aramco | Date: 2026-06-01
Product: LSAW 20" × 14.3mm, API 5L X65 PSL-2, 3LPE Coated | Quantity: 4,200 tons

EMBEDDED CARBON CONTENT:
                              per ton pipe    Total (4,200T)
Steel production (TATA Steel): 1.91 t CO2      8,022 t CO2
Steel transport to Anjar:       0.07 t CO2        294 t CO2
Manufacturing (Scope 1):        0.12 t CO2        504 t CO2
Manufacturing (Scope 2):        0.19 t CO2        798 t CO2
Coating materials (3LPE):       0.09 t CO2        378 t CO2
Export transport (Mundra-Dammam):0.06 t CO2       252 t CO2
─────────────────────────────────────────────────────────────
TOTAL CRADLE-TO-GATE:          2.44 t CO2     10,248 t CO2

Carbon intensity comparison:
  This shipment: 2.44 t CO2/t pipe
  World industry average: 2.85 t CO2/t pipe (Worldsteel 2024)
  Welspun is 14.4% below global average carbon intensity

Methodology: ISO 14040/14044 LCA | Verification: Bureau Veritas (ISO 14064)
Digital Passport: QR code below | Blockchain reference: 0x1a2b3c...

[Download full LCA report] [Verify on blockchain]
```

### Why This Becomes Mandatory by 2030
- **EU Corporate Sustainability Reporting Directive (CSRD)**: Scope 3 mandatory for large companies from 2024
- **Science Based Targets (SBTi)**: Major oil companies setting Scope 3 targets — they need Welspun's data
- **Supplier Code requirements**: Shell, BP, TotalEnergies are starting to demand carbon data from tier-1 suppliers
- **CBAM Extension**: EU CBAM likely to extend to Scope 3 of steel products

### Implementation Priority
This is the top-of-the-pyramid project that requires many others to be in place first:
1. [[043 - Pipe Energy Cost Attribution Model]] — energy data ✓ needed
2. [[014 - Material Certificate Auto-Importer]] — steel supplier data ✓ needed
3. [[085 - EU CBAM Carbon Certificate Generator]] — Scope 1+2 already calculated ✓
4. [[092 - Pipe Digital Passport]] — data platform ✓ needed

### Estimated Build Time
- LCA methodology development: 6 weeks
- Integration with all data sources: 4 weeks
- Third-party verification (ISO 14064): 3 months
- Reporting portal: 4 weeks
- Total: 4–6 months (assuming prerequisite systems live)

### Cost
- Ecoinvent database license: ~CHF 10,000/year
- ISO 14064 verification: ~€10,000–20,000/year
- Development: 2–3 months developer time
- Total: ~₹15–20L/year ongoing

---

## Related Ideas
- [[092 - Pipe Digital Passport]] — the data platform this carbon data lives in
- [[085 - EU CBAM Carbon Certificate Generator]] — Scope 1+2 carbon that feeds into this
- [[043 - Pipe Energy Cost Attribution Model]] — energy attribution foundation
- [[100 - Pipe Lifecycle Carbon Tracking]] — self
- [[070 - Supplier ESG Due Diligence Agent]] — supplier carbon intensity data needed here

---

## Notes
- This project is 2–3 years ahead of where most Indian manufacturers are. Being early = competitive advantage. Waiting until it's mandatory = just compliance cost.
- Partner with a steel supplier (TATA Steel has excellent carbon reporting capabilities) to get verified upstream emission factors — the credibility of the full LCA depends heavily on A1 data quality.
- The "carbon certificate" can be a commercial differentiator today — not just for compliance. Market it as "the only Indian pipe with verified carbon data" — it opens doors with ESG-conscious European and US customers.
