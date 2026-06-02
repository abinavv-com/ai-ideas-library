# 075 · Vessel Loading Stowage Planner

> **Section**: Yard & Logistics | **Complexity**: 🔵 Month 4–6 | **Impact**: ⚡ Efficiency, 💰
> **Helps**: MA Forbush, export team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Given the pipe sizes, weights, and quantities in a shipment, optimization algorithm generates the optimal vessel stowage plan — maximizing cargo weight efficiency while meeting port and charter party requirements. Turns a 3-day planning exercise into a 30-minute review.

---

## Implementation Blueprint

### Architecture
```
Shipment specification (pipe sizes, weights, quantities) + vessel hold dimensions 
→ Python optimization (PuLP bin-packing) 
→ Optimal stowage plan: which pipes in which hold, stacking order 
→ PDF stowage plan (for captain + chief officer) 
→ Weight distribution report (for port authority)
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Input | SAP SD export order / Excel input | Cargo specification |
| Optimization | Python `PuLP` or `google-or-tools` | Stowage optimization |
| Vessel Database | Excel with hold dimensions per vessel | Vessel specifications |
| Visualization | Python `matplotlib` / `reportlab` PDF | Stowage plan diagram |
| Output | PDF report + Excel weight distribution | For captain + port |
| Calculation | Python | Stability + trim calculations |

### Stowage Constraints
```python
stowage_constraints = {
    # Vessel stability
    "max_deck_load_kN_per_m2": 12.0,  # Varies by vessel type
    "trim_limit_m": 0.5,               # Max fore/aft trim difference
    "list_limit_degrees": 2.0,          # Max transverse tilt
    
    # Charter party requirements
    "cargo_securing": "Pipes must be chocked and lashed per IMO CTU Code",
    "deck_cargo": "Deck cargo permitted up to 30% of cargo weight",
    
    # Port/customs
    "hazmat_separation": "Any coated pipes with solvent-based coatings: separate hold",
    
    # Pipe-specific
    "max_stacking_layers": {
        ">600mm_OD": 2,
        "300-600mm": 3,
        "<300mm": 4
    },
    "end_cap_protection": "End caps must be protected from cargo crushing — use spacer bundles",
    
    # Weight distribution
    "heavy_cargo_placement": "Heaviest cargo on bottom and center of hold"
}
```

### Optimization Model
```python
from pulp import *

def optimize_stowage(cargo_items, vessel_holds):
    """
    Assign pipe batches to vessel holds to:
    1. Minimize unused hold space (maximize cargo efficiency)
    2. Meet stability constraints (weight distribution)
    3. Satisfy discharge order (last-to-discharge = deepest stow)
    """
    prob = LpProblem("VesselStowage", LpMinimize)
    
    # Decision variables: x[item][hold] = 1 if item goes in hold
    x = {(i.id, h.id): LpVariable(f"x_{i.id}_{h.id}", cat='Binary')
         for i in cargo_items for h in vessel_holds}
    
    # Each cargo item goes in exactly one hold
    for item in cargo_items:
        prob += lpSum(x[item.id, h.id] for h in vessel_holds) == 1
    
    # Hold weight capacity constraint
    for hold in vessel_holds:
        prob += lpSum(x[item.id, hold.id] * item.weight_tons
                     for item in cargo_items) <= hold.capacity_tons
    
    # Hold volume constraint
    for hold in vessel_holds:
        prob += lpSum(x[item.id, hold.id] * item.volume_m3
                     for item in cargo_items) <= hold.volume_m3
    
    # Stability: balance port-starboard (simplified)
    port_weight = lpSum(x[i.id, h.id] * i.weight_tons
                       for i in cargo_items for h in vessel_holds
                       if h.position == 'port')
    starboard_weight = lpSum(x[i.id, h.id] * i.weight_tons
                            for i in cargo_items for h in vessel_holds
                            if h.position == 'starboard')
    prob += port_weight - starboard_weight <= 50  # Max 50T imbalance
    prob += starboard_weight - port_weight <= 50
    
    # Objective: minimize wasted hold space
    prob += lpSum((1 - lpSum(x[i.id, h.id] for i in cargo_items) / h.capacity_tons) * h.capacity_tons
                 for h in vessel_holds)
    
    prob.solve()
    return extract_stowage_plan(x, cargo_items, vessel_holds)
```

### Stowage Plan PDF Output
```
STOWAGE PLAN — MV OCEAN CARRIER
Voyage: OC-2026-042 | Port: Mundra → Dammam
Shipper: Welspun Corp Ltd | Date: 2026-06-01

CARGO SUMMARY:
Total: 4,200 MT | 847 pipes
14 bundles × 300 pipes (20" × 14.3mm, Grade X65, 3LPE coated)
 8 bundles × 200 pipes (24" × 12.7mm, Grade X70, 3LPE coated)

HOLD ALLOCATION:
Hold 1 (Fore): 2,100 MT — 20" X65 pipes (bundles 1-7)
  Max stow height: 3 layers (7.2m) — within hold clear height (8.5m) ✅
  Weight distribution: uniform ✅

Hold 2 (Aft): 2,100 MT — 20" X65 (3 bundles) + 24" X70 (8 bundles)
  Max stow height: 2 layers for 24" pipes + 3 layers for 20" pipes ✅

STABILITY CALCULATION:
Deadweight: 4,200 MT | Displacement: 11,842 MT
GM (metacentric height): 1.84m (minimum required: 0.15m) ✅
Trim: 0.3m by stern ✅ (limit: 0.5m)
List: 0.8° starboard ✅ (limit: 2.0°)

[Vessel cross-section diagram with hold contents shown]
```

### Discharge Order Optimization
For multi-port voyages, optimize stowage so each port's cargo is accessible without moving other cargo:
```python
# Cargo for Port A must be on TOP of cargo for Port B
# (Port A discharged first, then Port B)
discharge_order_constraint = "Port_A_cargo_higher_stow_than_Port_B_cargo"
```

### Estimated Build Time
- Optimization model: 1 week
- Vessel database (dimensions + constraints): 3 days
- PDF stowage plan template: 3 days
- Stability calculation module: 1 week
- Total: ~3 weeks

### Cost
- Software: Free (PuLP open source)
- ROI: Each optimized voyage improves cargo utilization by 3–8% — on 4,200MT shipment at $41/MT, 5% improvement = $8,610 (~₹7.4L) per voyage

---

## Related Ideas
- [[020 - Pipe Cut-Length Optimizer]] — same bin-packing optimization approach
- [[045 - Production What-If Schedule Simulator]] — production schedule optimization complement
- [[071 - Drone Pipe Counter Inventory Map]] — drone count verifies cargo available for loading
- [[080 - Pipe Loading Photographic Record]] — photographic record of the implemented stowage
- [[067 - Export Document Auto-Preparer]] — stowage plan triggers document generation

---

## Notes
- The stowage plan must be approved by the ship's master — it's a legal document under the Merchant Shipping Act. Present it as a "planning input" not a "final instruction."
- Pipe coatings (3LPE, FBE) are sensitive to cargo damage from rubbing. The optimization should also consider: pipe-to-pipe contact prevention, bundles for grouping, and protective materials
- For multipurpose carriers, coordinate with the vessel superintendent who will oversee loading — they have proprietary knowledge of the vessel's handling characteristics
