# 045 · Production "What-If" Schedule Simulator

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh, Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
If Line 2 goes down, what happens to all 47 open orders? ML-powered scheduler rebuilds the production plan in 5 minutes across available lines — giving the planning team an immediate response plan instead of spending 2 days manually re-scheduling in Excel.

---

## Implementation Blueprint

### Architecture
```
SAP PP open production orders + delivery dates 
+ Current line availability (from [[040 - Production OEE Live Dashboard]]) 
→ Google OR-Tools constraint-based scheduler 
→ Optimized schedule respecting: line capabilities, changeover times, delivery deadlines 
→ Schedule comparison: current vs. simulated 
→ Summary of impact (delays, cost, overtime required)
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Input Data | SAP PP (open orders, quantities, deadlines) | Order data |
| Line Constraints | Excel/SAP (which lines can make which products) | Capability rules |
| Optimizer | Python `google-or-tools` CP-SAT or `pulp` | Schedule optimization |
| UI | Streamlit web app | Interactive what-if interface |
| SAP Output | n8n + SAP PP BAPI | Update rescheduled production orders |
| Visualization | Gantt chart (Python `plotly` or Power BI) | Schedule visualization |

### Constraint Model
```python
from ortools.sat.python import cp_model

def build_schedule_model(orders, lines, disruption=None):
    model = cp_model.CpModel()
    
    # Decision variables: when and on which line each order runs
    order_starts = {}
    order_lines = {}
    
    for order in orders:
        # When does this order start (in hours from now)?
        order_starts[order.id] = model.NewIntVar(0, 720, f'start_{order.id}')  # 30-day horizon
        
        # Which line runs this order? (binary variable per line)
        order_lines[order.id] = {}
        for line in lines:
            order_lines[order.id][line.id] = model.NewBoolVar(f'line_{order.id}_{line.id}')
    
    # Constraints:
    
    # 1. Each order must run on exactly one line
    for order in orders:
        model.Add(sum(order_lines[order.id][line.id] for line in lines) == 1)
    
    # 2. Line capability: only assign orders to capable lines
    for order in orders:
        for line in lines:
            if not line.can_produce(order.product_type):
                model.Add(order_lines[order.id][line.id] == 0)
    
    # 3. Line capacity: no overlapping orders on same line
    for line in lines:
        line_orders = [o for o in orders if can_run_on(o, line)]
        # Add no-overlap constraint for orders on same line
        add_no_overlap(model, line_orders, line, order_starts)
    
    # 4. Disruption: mark unavailable line
    if disruption:
        for order in orders:
            model.Add(order_lines[order.id][disruption.line_id] == 0)
    
    # Objective: minimize total weighted lateness
    lateness = []
    for order in orders:
        days_late = model.NewIntVar(-100, 100, f'late_{order.id}')
        # days_late = (start + duration) - deadline
        lateness.append(order.customer_priority * days_late)
    
    model.Minimize(sum(lateness))
    return model, order_starts, order_lines
```

### Disruption Scenarios
```python
scenarios = {
    "line_2_down_1_week": {
        "type": "line_outage",
        "line": "HSAW_2",
        "duration_days": 7,
        "reason": "Major breakdown"
    },
    "line_2_down_3_days": {...},
    "steel_supply_delayed_2_weeks": {
        "type": "material_shortage",
        "material": "API 5L X65 plates",
        "delay_days": 14,
        "affects_orders": get_orders_needing_x65()
    },
    "new_urgent_order": {
        "type": "priority_insert",
        "order": new_order_spec,
        "deadline": urgent_date
    }
}
```

### Streamlit UI
```python
import streamlit as st

st.title("📅 Production Schedule Simulator")

# Current schedule visualization (Gantt)
st.subheader("Current Schedule")
show_gantt(current_schedule)

# Scenario selection
scenario = st.selectbox("Select disruption scenario:", [
    "Line 2 down — 1 week",
    "Line 2 down — 3 days", 
    "Steel supply delayed 2 weeks",
    "New urgent order insertion",
    "Custom scenario"
])

if st.button("Run Simulation"):
    with st.spinner("Optimizing schedule... (30 seconds)"):
        new_schedule = run_optimizer(scenario)
    
    st.subheader("Simulated Schedule After Disruption")
    show_gantt(new_schedule)
    
    st.subheader("Impact Summary")
    impact = compare_schedules(current_schedule, new_schedule)
    st.metric("Orders Delayed", impact['delayed_orders'])
    st.metric("Worst Delay", f"{impact['max_delay_days']} days")
    st.metric("Customer: Aramco Impact", impact['aramco_impact'])
    
    if st.button("Apply New Schedule to SAP"):
        apply_to_sap(new_schedule)
```

### Impact Report
```
SIMULATION RESULTS — HSAW Line 2 Down for 7 Days

Scenario: Line 2 offline from 2026-06-01 to 2026-06-08
Affected orders: 12 (from 47 total)

CRITICAL DELAYS (Customer notification required):
1. Aramco SO-4521 — Delayed from Jun 15 to Jun 22 (+7 days)
   → Customer notification required immediately
   → Mitigation: Run overtime on Line 1 (adds ₹8L cost)
   
2. GAIL SO-4589 — Delayed from Jun 20 to Jun 23 (+3 days)
   → Within tolerance (customer's buffer is 5 days)
   → No customer contact required

NO IMPACT (rescheduled within window):
Orders 4–12: Successfully redistributed to LSAW Line 1 and DI without delay

RECOMMENDATION:
Option A: Accept 7-day delay on Aramco + notify customer NOW → ₹0 extra cost
Option B: Run 2 overtime shifts + subcontract 400 pipes to ABC Pipes → ₹15L extra cost → meet deadline
```

### Estimated Build Time
- OR-Tools optimization model: 1–2 weeks
- Streamlit UI: 3–4 days
- SAP data integration: 1 week
- Total: ~3 weeks

---

## Related Ideas
- [[040 - Production OEE Live Dashboard]] — real-time line status feeds scenarios
- [[044 - Daily Production Output Live Counter]] — production rate data used in model
- [[099 - Predictive Project Delay Early Warning]] — early warnings that trigger this simulator
- [[020 - Pipe Cut-Length Optimizer]] — similar OR-Tools optimization approach
- [[075 - Vessel Loading Stowage Planner]] — same optimizer for vessel planning

---

## Notes
- Start with a simple Excel-based version (macro-driven) to prove the concept before investing in OR-Tools
- The schedule optimizer doesn't know everything a planner knows — always present it as "here's the machine recommendation" and let the planner confirm
- Add a "what-if: new customer order" mode — sales team can check production feasibility before committing to a delivery date
