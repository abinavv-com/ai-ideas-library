# 086 · Financial Scenario Stress-Tester

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh, Sarados | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Inputs user-defined scenarios (e.g., steel +15%, USD/INR 90, project delayed 3 months) and models the financial P&L and cash flow impact across the business in minutes — replacing the 2-day ad-hoc manual scenario analysis exercise.

---

## Implementation Blueprint

### Architecture
```
Streamlit UI: User selects scenario parameters (sliders) 
→ Python financial model: P&L + cash flow + balance sheet simulation 
→ SAP data as base (actual cost structure, current order book) 
→ Real-time output: Revenue / EBITDA / Cash flow / Working capital under scenario 
→ Comparison: Base case vs. scenario vs. downside
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| UI | Streamlit interactive web app | Scenario input |
| Financial Model | Python `pandas` + custom P&L/CF model | Simulation engine |
| Base Data | SAP CO/SD/MM + [[083 - Project-Level Profitability Tracker]] | Actual starting point |
| Visualization | `plotly` + Streamlit | Interactive charts |
| Output | PDF report generator | Formal scenario analysis |

### Scenario Parameters (User-Configurable)
```python
scenario_parameters = {
    # Revenue scenarios
    "volume_change_pct": {"default": 0, "range": (-30, +30)},
    "selling_price_change_pct": {"default": 0, "range": (-15, +15)},
    "project_delay_months": {"default": 0, "range": (0, 6)},
    
    # Cost scenarios
    "steel_price_change_pct": {"default": 0, "range": (-20, +30)},
    "energy_price_change_pct": {"default": 0, "range": (-10, +50)},
    "freight_cost_change_pct": {"default": 0, "range": (-20, +50)},
    "labor_cost_change_pct": {"default": 0, "range": (0, +20)},
    
    # Financial scenarios
    "usd_inr_rate": {"default": 85.5, "range": (78, 95)},
    "working_capital_days_change": {"default": 0, "range": (-15, +30)},
    "interest_rate_change_bps": {"default": 0, "range": (-100, +200)},
    
    # One-off events
    "one_off_costs_crore": {"default": 0, "range": (0, 50)},
    "customer_default_amount_crore": {"default": 0, "range": (0, 30)}
}
```

### Pre-Built Scenario Library
```python
saved_scenarios = {
    "Base Case": {description: "Current actuals + no change"},
    
    "Steel Shock": {
        "steel_price_change_pct": +15,
        "description": "Steel rises 15% — recent historical move"
    },
    
    "INR Depreciation": {
        "usd_inr_rate": 90,
        "description": "USD/INR reaches 90 — extreme but possible"
    },
    
    "Q3 Volume Shortfall": {
        "volume_change_pct": -20,
        "project_delay_months": 3,
        "description": "Major customer delays project by 3 months"
    },
    
    "Perfect Storm": {
        "steel_price_change_pct": +10,
        "volume_change_pct": -15,
        "usd_inr_rate": 88,
        "working_capital_days_change": +20,
        "description": "Multiple adverse scenarios simultaneously"
    },
    
    "China Entry": {
        "selling_price_change_pct": -8,
        "volume_change_pct": -10,
        "description": "Chinese competitor enters Indian market at -8% below current prices"
    }
}
```

### Financial Model Core
```python
def run_scenario(base_financials, scenario_params):
    """
    base_financials: Current SAP actuals for last 12 months
    scenario_params: User's adjustments
    Returns: P&L + cash flow under scenario
    """
    
    # Adjusted Revenue
    base_revenue = base_financials['revenue']
    price_impact = base_revenue * (scenario_params['selling_price_change_pct'] / 100)
    volume_impact = base_revenue * (scenario_params['volume_change_pct'] / 100)
    delay_impact = -base_revenue * 0.3 * (scenario_params['project_delay_months'] / 12)  # 30% revenue in last quarter
    adjusted_revenue = base_revenue + price_impact + volume_impact + delay_impact
    
    # Adjusted Costs
    steel_cost = base_financials['steel_cost'] * (1 + scenario_params['steel_price_change_pct'] / 100)
    # Steel cost partially offsets with lower volume
    steel_cost *= (1 + scenario_params['volume_change_pct'] / 100 * 0.9)  # 90% variable
    
    energy_cost = base_financials['energy_cost'] * (1 + scenario_params['energy_price_change_pct'] / 100)
    
    # FX impact on imported materials
    fx_impact = base_financials['imported_material_cost'] * \
                ((scenario_params['usd_inr_rate'] / base_financials['base_usd_inr']) - 1)
    
    adjusted_total_cost = steel_cost + energy_cost + fx_impact + base_financials['other_costs']
    
    # EBITDA
    adjusted_ebitda = adjusted_revenue - adjusted_total_cost
    adjusted_ebitda_margin = adjusted_ebitda / adjusted_revenue * 100
    
    # Cash flow impact
    wc_change = base_financials['working_capital'] * \
                (scenario_params['working_capital_days_change'] / base_financials['current_wc_days'])
    free_cash_flow = adjusted_ebitda - wc_change - base_financials['capex_maintenance']
    
    return {
        'revenue': adjusted_revenue,
        'ebitda': adjusted_ebitda,
        'ebitda_margin_pct': adjusted_ebitda_margin,
        'free_cash_flow': free_cash_flow,
        'vs_base_revenue': adjusted_revenue - base_revenue,
        'vs_base_ebitda': adjusted_ebitda - base_financials['ebitda']
    }
```

### Streamlit UI Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  FINANCIAL SCENARIO ANALYSIS                                     │
│  [Select Preset Scenario ▼]  or  [Build Custom Scenario]        │
├─────────────────────────────────────────────────────────────────┤
│  PARAMETERS                    RESULTS                           │
│  Steel Price:  [+15%  ────●────]   Revenue: ₹812Cr (-3.6%)    │
│  FX Rate:      [85.5  ─────●──]    EBITDA: ₹68Cr (-24%)       │
│  Volume:       [-10%  ────●────]   EBITDA Margin: 8.4% (-2.8%) │
│  Project Delay:[3mo   ────●────]   Free CF: ₹42Cr (-35%)       │
│                                                                   │
│  [Base Case] [Scenario A] [Scenario B] — Compare 3 scenarios   │
│  [───────────────────BAR CHART───────────────────]              │
│  [Download Scenario PDF] [Save Scenario]                        │
└─────────────────────────────────────────────────────────────────┘
```

### Estimated Build Time
- Financial model: 1 week
- Streamlit UI: 3 days
- SAP data integration: 3 days
- Pre-built scenarios: 1 day
- Total: ~2 weeks

---

## Related Ideas
- [[011 - Investment Assumptions Auditor]] — reviews assumptions before they're used in this model
- [[081 - Real-Time Working Capital Dashboard]] — provides the base working capital data
- [[060 - Monte Carlo Bid Margin Simulator]] — same simulation concept at order level
- [[082 - Commodity Price Impact on Open Orders]] — order-level version of this scenario analysis
- [[090 - Management Dashboard]] — scenario outputs feed executive reporting

---

## Notes
- The "Perfect Storm" scenario should be run before every board meeting — asking "what's our worst plausible case" is the most valuable use of this tool
- Build in a "management actions" layer: the user can also input "hedged 50% of steel requirement" or "secured ₹50Cr additional credit line" to see how interventions improve the scenario outcome
