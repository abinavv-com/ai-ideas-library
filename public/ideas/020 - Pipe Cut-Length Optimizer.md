# 020 · Pipe Cut-Length Optimizer

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 💰 Cost Savings
> **Helps**: Anurag Singh, production planning | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Inputs the list of pipe lengths required for a mixed order set. Optimization algorithm (bin-packing variant) calculates the cut plan that minimizes steel crop end scrap. Outputs a cut schedule for the operator — replacing gut-feel planning with mathematically optimal cuts.

---

## Implementation Blueprint

### Architecture
```
SAP production orders (required lengths + quantities) 
→ Python optimization engine (Google OR-Tools / PuLP) 
→ Optimal cut plan (which lengths to cut from each mother pipe) 
→ Print-ready cut schedule for shop floor operator
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Input Data | SAP PP production orders + Excel input | Required pipe lengths |
| Optimization | Python `google-or-tools` (CP-SAT solver) | Cutting stock problem |
| UI | Streamlit web app or Excel macro | Input + output interface |
| Output | Printable HTML/Excel cut schedule | Shop floor use |
| Orchestration | n8n (optional, for SAP integration) | Pull data automatically |

### The Problem (Cutting Stock Problem)
```
Given:
- Mother pipe (raw stock) length: typically 12m or 18m
- Required pieces: 4 × 6.4m, 8 × 4.2m, 12 × 2.8m, 6 × 1.5m

Find:
- Which lengths to cut from each mother pipe
- To minimize total number of mother pipes used (= minimize crop end scrap)
```

### Python Optimization (OR-Tools CP-SAT)
```python
from ortools.sat.python import cp_model

def optimize_cuts(mother_pipe_length: float, required_lengths: dict, kerf: float = 0.005):
    """
    mother_pipe_length: e.g., 12.0 meters
    required_lengths: {4.2: 8, 2.8: 12, 1.5: 6}  # {length: quantity}
    kerf: saw blade width loss (default 5mm)
    """
    model = cp_model.CpModel()
    
    # Generate all feasible cutting patterns for one mother pipe
    patterns = generate_patterns(mother_pipe_length, required_lengths, kerf)
    
    # Decision variables: how many times to use each pattern
    x = [model.NewIntVar(0, 100, f'x_{i}') for i in range(len(patterns))]
    
    # Constraint: meet all demand
    for length, qty in required_lengths.items():
        model.Add(sum(x[i] * patterns[i].get(length, 0) for i in range(len(patterns))) >= qty)
    
    # Objective: minimize mother pipes used
    model.Minimize(sum(x))
    
    solver = cp_model.CpSolver()
    status = solver.Solve(model)
    
    return build_cut_schedule(solver, x, patterns)
```

### Output: Cut Schedule
```
PIPE CUT PLAN — Order Set: SO-2026-4521
Generated: 2026-06-01 | Approved by: [Planner name]
Mother Pipe: 12,000mm | Blade Kerf: 5mm

Mother Pipe #1: Cut → 4,200 + 4,200 + 3,595 (SCRAP: 5mm kerf × 2)
Mother Pipe #2: Cut → 4,200 + 2,800 + 2,800 + 2,195 (SCRAP: 5mm kerf × 3)  
Mother Pipe #3: Cut → 2,800 + 2,800 + 2,800 + 1,500 + 2,095 (SCRAP: 5mm kerf × 4)
[... 18 more pipes ...]

SUMMARY:
Mother pipes required: 21 (vs. 24 without optimization)
Material saved: 3 mother pipes × 0.8 tons = 2.4 tons
Cost saving: 2.4 × ₹54,000 = ₹1,29,600 this order

Scrap crop ends:
- 4 × ~2.1m lengths → send to scrap yard
- 8 × <0.5m offcuts → waste
```

### Alternative Inputs (If SAP Integration Not Yet Ready)
Build a simple Excel template that planners fill in manually:
```
| Required Length (mm) | Quantity |
|---|---|
| 4200 | 8 |
| 2800 | 12 |
| 1500 | 6 |
```
Paste into Streamlit app → get optimized cut plan instantly.

### Streamlit Web App UI
```python
import streamlit as st
st.title("🔩 Pipe Cut Optimizer — Welspun")

mother_length = st.number_input("Mother Pipe Length (mm)", value=12000)
kerf = st.number_input("Blade Kerf (mm)", value=5)

st.subheader("Required Pieces")
# Dynamic table for user to enter lengths + quantities

if st.button("Optimize"):
    plan, savings = optimize_cuts(mother_length, required_pieces, kerf)
    st.success(f"Optimized! Save {savings['pipes']} pipes = ₹{savings['value']:,.0f}")
    st.table(plan)
    st.download_button("Download Cut Schedule PDF", generate_pdf(plan))
```

### Estimated Build Time
- Developer: 2–3 days
- Non-developer with Python basics: 4–5 days
- Excel-only version (no optimizer): 1 day (but less optimal)

### Cost
- OR-Tools: Free open source (Google)
- Streamlit: Free (run locally or on Streamlit Cloud)
- Total ongoing: ₹0
- ROI: Saving 2–4 mother pipes per production run × 3–5 runs/week = ₹15–50L/year in material savings

---

## Related Ideas
- [[045 - Production What-If Schedule Simulator]] — schedule disruption planning uses similar optimization
- [[075 - Vessel Loading Stowage Planner]] — bin-packing optimization in a different domain
- [[040 - Production OEE Live Dashboard]] — OEE tracks the production efficiency this tool improves
- [[036 - LSAW Forming Press Spring-Back Predictor]] — another LSAW production optimization
- [[043 - Pipe Energy Cost Attribution Model]] — energy cost per pipe batch improves with fewer cuts

---

## Notes
- OR-Tools CP-SAT solver handles problems with hundreds of required lengths in under 1 second
- Consider also optimizing for "usable offcuts" — lengths that can be used in future orders rather than scrapped
- For DI pipe (different cutting constraints due to casting process), the algorithm needs modification — start with LSAW/HSAW only
- Build in "minimum usable offcut" setting — planners may want to save 1m+ lengths for small follow-on orders
