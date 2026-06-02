# 039 · Annealing Furnace Belt Speed Optimizer

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: 💰 Cost Savings
> **Helps**: DI pipe production team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Connects to furnace thermocouple data and pipe dimensional input from SAP. Calculates the optimal belt speed per pipe batch to ensure uniform through-thickness mechanical properties — replacing the printed chart lookup that leads to either over-treatment (wasted energy) or under-treatment (soft matrix, failed mechanical tests).

---

## Implementation Blueprint

### Architecture
```
SAP production order (pipe dimensions, grade, batch) 
+ Furnace thermocouple real-time data (OPC-UA/Modbus) 
→ Python thermal model (heat transfer calculation) 
→ Optimal belt speed recommendation 
→ HMI display + optional auto-set via PLC write
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Furnace Data | OPC-UA or Modbus TCP from furnace PLC | Real-time temperature zones |
| Pipe Data | SAP PP production order | Wall thickness, OD, grade |
| Thermal Model | Python `scipy.integrate` / custom FEM | Heat transfer through pipe wall |
| ML Refinement | XGBoost (trained on outcomes) | Correct theoretical model for real-world conditions |
| HMI | Industrial display or existing SCADA | Show belt speed recommendation |
| Integration | Modbus write or OPC-UA client | Auto-set belt speed (Phase 2) |

### The Metallurgical Goal (DI Pipe Annealing)
After casting and initial cooling, DI pipe contains:
- **As-cast structure**: partially ferritic/pearlitic matrix with spheroidal graphite
- **Target after annealing**: fully ferritic matrix (soft, ductile) — ISO 2531 requirement

Key parameter: **soaking temperature × soaking time at temperature**
- Temperature: typically 900–1000°C (ferritizing anneal)
- Time: depends on wall thickness — heat must penetrate to pipe center
- Too fast (high belt speed): center not fully annealed → hard spots → failed Brinell hardness test
- Too slow (low belt speed): wastes 8–15% energy on every pipe + reduces throughput

### Heat Transfer Model (Simplified)
```python
import numpy as np
from scipy.optimize import minimize

def time_to_soak(wall_thickness_mm, furnace_temp_C, target_core_temp_C=880):
    """
    Calculate minimum time at temperature for heat to penetrate to pipe center.
    Based on 1D transient heat conduction in a cylinder.
    """
    # Material properties (Ductile Iron)
    thermal_diffusivity_m2_s = 5.5e-6  # α for DI at ~800°C
    radius_m = wall_thickness_mm / 2 / 1000  # Half-thickness (symmetric heating)
    
    # Biot number (for convective heating in furnace)
    h_convection = 50  # W/m²K (typical furnace)
    k_conductivity = 35  # W/mK for DI
    L = radius_m
    Bi = h_convection * L / k_conductivity
    
    # Fourier number required for core to reach target temperature
    # Simplified: using lumped capacitance approximation for thin walls
    temp_ratio = (target_core_temp_C - furnace_temp_C) / (25 - furnace_temp_C)  # 25°C = ambient
    Fo = -np.log(abs(temp_ratio)) / ((np.pi/2)**2 + Bi)
    
    time_required_sec = Fo * (radius_m**2) / thermal_diffusivity_m2_s
    return time_required_sec

def optimal_belt_speed(pipe_spec, furnace_zones):
    """
    Given pipe dimensions and furnace zone temperatures, 
    calculate the maximum belt speed that still achieves full annealing.
    """
    wall_thickness_mm = pipe_spec['wall_thickness_mm']
    furnace_length_m = 15.0  # Furnace soaking zone length
    
    soaking_time_sec = time_to_soak(wall_thickness_mm, furnace_zones['soaking_temp_C'])
    
    # Belt speed = furnace length / required soaking time
    max_belt_speed_m_min = furnace_length_m / soaking_time_sec * 60
    
    # Apply safety factor of 0.85 for temperature non-uniformity
    safe_belt_speed = max_belt_speed_m_min * 0.85
    
    return round(safe_belt_speed, 1)
```

### ML Refinement Layer
The theoretical model is a starting point. Train XGBoost on:
- Inputs: pipe dimensions + calculated belt speed from model
- Output: actual Brinell hardness result (target: ≤230 HB per ISO 2531)
- The ML model learns the gap between theoretical and actual (e.g., furnace cold spots, pipe crowding effects)

```python
# If theoretical model says belt speed = 1.8 m/min but actual outcomes
# show failures at 1.8 m/min for 18mm WT pipes → ML learns to recommend 1.5 m/min
```

### HMI Output
```
ANNEALING FURNACE OPTIMIZER
Batch: HT-DI-2026-0421 | Grade: ISO 2531 K9
Pipe: DN300 (329mm OD) × 7.2mm WT

Furnace Status:
Zone 1 (heating): 850°C ✅
Zone 2 (soaking): 940°C ✅
Zone 3 (cooling): 720°C ✅

Recommended Belt Speed: 1.6 m/min
  (Current: 1.4 m/min — could increase by 0.2 m/min to save time/energy)
  Estimated energy saving at 1.6 m/min: 9% vs. current speed

Previous batch outcome: 147 HB (target <230 HB) ✅

[Apply Recommended Speed] [Keep Current] [Override]
```

### Expected Benefits
- Throughput increase: 5–15% (running belt faster when pipe allows)
- Energy saving: 8–12% gas consumption reduction
- Reduced failures: mechanical test failures from under-annealing

### Estimated Build Time
- Furnace data access (OPC-UA): 2–3 weeks
- Thermal model: 1 week
- ML training (need 6+ months of outcome data): concurrent with deployment
- HMI: 1 week

---

## Related Ideas
- [[038 - DI Furnace Melt Composition Estimator]] — upstream DI process optimization
- [[043 - Pipe Energy Cost Attribution Model]] — energy savings from this tool quantified here
- [[040 - Production OEE Live Dashboard]] — OEE improvement tracked here
- [[036 - LSAW Forming Press Spring-Back Predictor]] — similar ML process optimization
- [[046 - Predictive Maintenance Dashboard]] — furnace belt drive maintenance monitoring

---

## Notes
- The theoretical model is only an approximation — radiation heat transfer in the furnace is significant and harder to model. Start with empirical ML on historical data first.
- Temperature uniformity across the furnace cross-section matters a lot — install thermocouples at different positions if not already present
- When loading density changes (few large pipes vs. many small pipes), the effective heat transfer changes significantly — add "pipes on belt per meter" as a feature
