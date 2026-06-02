# 060 · Monte Carlo Bid Margin Simulator

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Pawan Kathayat, Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Runs 10,000 simulations of a bid scenario — varying steel price, reject rate, and freight cost within realistic ranges. Outputs a margin probability distribution: "70% probability of >8% margin at this bid price." Turns bidding from a single-point guess into a risk-quantified decision.

---

## Implementation Blueprint

### Architecture
```
Bid parameters (from [[059 - Bid Data Assembler]]) 
→ Define uncertainty ranges for each variable 
→ Python Monte Carlo simulation (10,000 runs) 
→ Output: margin distribution histogram + P10/P50/P90 values 
→ Streamlit interactive UI → Mihir adjusts bid price + sees risk profile change
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Simulation | Python `numpy` Monte Carlo | 10,000 random scenario runs |
| Distributions | `scipy.stats` | Statistical distribution fitting |
| Visualization | `plotly` or `matplotlib` + Streamlit | Interactive histogram |
| Input | Streamlit sliders | Mihir adjusts variables interactively |
| Historical Data | SAP cost history + commodity price history | Calibrate uncertainty ranges |

### Monte Carlo Model
```python
import numpy as np
from scipy import stats

def run_bid_simulation(bid_price_inr_per_ton, n_simulations=10000):
    """
    Run Monte Carlo simulation for bid margin
    Returns distribution of margin outcomes
    """
    
    # Define uncertainty distributions for each cost variable
    # Based on historical volatility from SAP data
    
    steel_price = np.random.normal(
        loc=54000,      # Current expected price ₹/ton
        scale=2500,     # Standard deviation (±1σ = ±4.6% based on 2-year history)
        size=n_simulations
    )
    
    freight_cost = np.random.normal(
        loc=38,         # $/MT ocean freight
        scale=8,        # Volatile: Baltic Exchange history
        size=n_simulations
    ) * usd_inr_rate_sample  # Also varies with FX
    
    reject_rate = np.random.beta(
        a=2, b=50,      # Beta distribution (bounded 0–1)
        size=n_simulations
    )  # Mean ≈ 3.8%, fits historical reject rate distribution
    
    conversion_cost = np.random.normal(
        loc=8240,       # ₹/ton from SAP actuals
        scale=400,      # ±400 for energy price + labor variability
        size=n_simulations
    )
    
    coating_cost = np.random.normal(
        loc=2860,       # Based on PE resin + FBE powder prices
        scale=200,      # Moderate variability
        size=n_simulations
    )
    
    # Additional cost due to rejects (repair or replace)
    reject_cost_impact = reject_rate * steel_price * 0.5  # Scrap/repair ~50% of plate value
    
    # Total cost per ton
    total_cost = (
        steel_price * 1.08 +   # 1.08 tons steel input per ton pipe (8% yield loss)
        conversion_cost +
        coating_cost +
        freight_cost +
        reject_cost_impact +
        1200  # G&A overhead (fixed)
    )
    
    # Margin calculation
    margin_pct = (bid_price_inr_per_ton - total_cost) / bid_price_inr_per_ton * 100
    
    return margin_pct

# Run simulation
margins = run_bid_simulation(bid_price=72000)

# Results
p10 = np.percentile(margins, 10)    # 10th percentile (pessimistic)
p50 = np.percentile(margins, 50)    # Median
p90 = np.percentile(margins, 90)    # 90th percentile (optimistic)
prob_above_8pct = np.mean(margins > 8) * 100
prob_below_zero = np.mean(margins < 0) * 100
```

### Streamlit Interactive UI
```python
import streamlit as st
import plotly.express as px

st.title("🎯 Bid Margin Simulator — Monte Carlo")
st.subheader("Project: Saudi Aramco Pipeline MSP")

col1, col2 = st.columns(2)
with col1:
    bid_price = st.slider("Bid Price (₹/ton)", 60000, 85000, 72000, 500)
    
with col2:
    st.metric("Expected Margin", f"{np.mean(margins):.1f}%")
    st.metric("Probability > 8%", f"{prob_above_8pct:.0f}%")
    st.metric("Probability Loss", f"{prob_below_zero:.1f}%", delta_color="inverse")

# Histogram
fig = px.histogram(
    margins, nbins=50,
    title=f"Margin Distribution at ₹{bid_price:,}/ton (10,000 simulations)",
    labels={'value': 'Margin %', 'count': 'Frequency'}
)
fig.add_vline(x=0, line_dash="dash", line_color="red", annotation_text="Break-even")
fig.add_vline(x=8, line_dash="dash", line_color="green", annotation_text="Target 8%")
st.plotly_chart(fig)

# Sensitivity analysis
st.subheader("Key Risk Drivers")
st.write("What hurts most? (Tornado chart)")
```

### Tornado Chart (Sensitivity Analysis)
Show which variables have the most impact on margin:
```
MARGIN SENSITIVITY ANALYSIS (Impact of ±1σ move in each variable):

Steel Price (+₹2,500/ton):    -4.8% margin impact    ████████████████████
Reject Rate (+2.5%):          -1.9% margin impact    ████████
Freight Cost (+$8/MT):        -1.1% margin impact    ████
Coating Cost (+₹200/ton):     -0.3% margin impact    █
Conversion Cost (+₹400/ton):  -0.5% margin impact    ██
```

This shows Mihir that **steel price is by far the biggest risk** → consider a steel price escalation clause in the contract.

### Decision Matrix Output
```
BID PRICE ANALYSIS — Saudi Aramco MSP

Bid Price    | P10 Margin | P50 Margin | P90 Margin | P(loss) | P(>8%)
₹68,000/ton  |   -2.1%    |    3.2%    |    8.4%    |  18%    |  32%
₹70,000/ton  |    0.4%    |    5.7%    |   10.9%    |   6%    |  52%
₹72,000/ton  |    2.8%    |    8.1%    |   13.4%    |   2%    |  71%  ← Recommended
₹74,000/ton  |    5.1%    |   10.5%    |   15.8%    |  <1%    |  87%
₹76,000/ton  |    7.4%    |   12.8%    |   18.1%    |  <0.1%  |  96%
```

### Estimated Build Time
- Core Monte Carlo model: 2 days
- Streamlit UI: 2 days
- Historical data for calibration: 1 day
- Total: ~5 days

### Cost
- All software: Free (Python + Streamlit + Plotly)
- Total: Zero

---

## Related Ideas
- [[059 - Bid Data Assembler]] — provides the cost inputs this tool simulates
- [[011 - Investment Assumptions Auditor]] — same Monte Carlo logic for CapEx
- [[056 - Steel Scrap Price Forecaster]] — steel price forecast informs the distribution used
- [[086 - Financial Scenario Stress-Tester]] — company-level version of the same simulation
- [[093 - Bid Strategy Game Simulator]] — strategic layer on top of this cost-focused tool

---

## Notes
- Calibrate the distribution parameters from SAP historical data — don't use theoretical ranges; use actual observed volatility from the last 2–3 years
- The tornado chart is often more useful than the histogram for decision-making — it tells Mihir where to focus risk mitigation effort
- For contracts with price escalation clauses, model the escalation mechanism explicitly — it changes the risk profile significantly
