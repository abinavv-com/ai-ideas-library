# 093 · Bid Strategy Game Simulator

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive, 💰
> **Helps**: Mihir, Sarados | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Two AI agents simulate Welspun and a named competitor bidding on a real project. 500 rounds of simulation find the price range where Welspun wins at maximum margin — bringing game theory to the bid room and replacing "let's just go 5% below Jindal" with a mathematically optimal strategy.

---

## Implementation Blueprint

### Architecture
```
Historical bid database (won/lost bids + known competitor prices) 
→ Build competitor cost model (Jindal SAW, Ratnamani) 
→ LLM-based agents simulate competitor bidding strategies 
→ Monte Carlo game theory simulation (500 rounds) 
→ Win probability vs. margin curve 
→ Optimal bid price recommendation with confidence level
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Historical Data | Bid database (from [[059 - Bid Data Assembler]] + manual tracking) | Training data |
| Game Theory | Python `nashpy` or custom implementation | Nash equilibrium |
| Monte Carlo | Python `numpy` | Multi-round simulation |
| LLM Agents | OpenClaw / GPT-4o (as competitor strategy modeler) | Simulate competitor reasoning |
| Optimization | SciPy `minimize` | Find optimal bid price |
| UI | Streamlit | Strategy interface |

### Competitor Cost Model
Build an estimated cost model for each competitor:
```python
competitor_profiles = {
    "Jindal_SAW": {
        "estimated_steel_cost_basis": "JSW Steel preferred supplier — typically 2-3% below Welspun",
        "capacity_utilization": 0.82,  # Running near full — less hungry for volume
        "financial_health": "Strong — can afford to walk away from low-margin bids",
        "known_bid_pattern": "Rarely goes below 6% margin — conservative",
        "strengths": ["LSAW X80 capability", "US market presence"],
        "weaknesses": ["Less DI capacity", "Higher labor costs at Kosi Kalan"],
        
        # Cost model (estimated from public data + market intelligence)
        "estimated_cost_per_ton": {
            "steel_input": lambda grade: estimate_steel_cost(grade, discount=-0.02),
            "conversion": 7800,  # INR/ton (their Kosi Kalan plant)
            "overhead": 1100
        }
    },
    
    "Ratnamani_Metals": {
        "capacity_utilization": 0.75,
        "financial_health": "Moderate",
        "known_bid_pattern": "Aggressive on price to fill capacity",
        "estimated_margin_floor_pct": 4.0
    }
}
```

### Game Theory Simulation
```python
import numpy as np

def simulate_bid_auction(project, rounds=500):
    """
    Simulate competitive bidding auction
    Returns: distribution of outcomes (win/lose) at each price point
    """
    results = []
    
    for round in range(rounds):
        # Simulate Welspun's cost (from Monte Carlo [[060 - Monte Carlo Bid Margin Simulator]])
        welspun_cost = monte_carlo_cost_sample(project)
        
        # Simulate Jindal's bid (based on their cost model + behavioral model)
        jindal_cost = monte_carlo_competitor_cost('Jindal_SAW', project)
        jindal_markup = np.random.normal(
            loc=0.065,   # Jindal typically bids at 6.5% margin
            scale=0.015  # ±1.5% variation
        )
        jindal_bid = jindal_cost / (1 - jindal_markup)
        
        # Simulate Ratnamani's bid
        ratnamani_bid = simulate_ratnamani_bid(project)
        
        # For each possible Welspun bid price, calculate win probability
        for welspun_bid_price in np.arange(welspun_cost * 1.02, welspun_cost * 1.20, 100):
            welspun_wins = welspun_bid_price < min(jindal_bid, ratnamani_bid)
            welspun_margin = (welspun_bid_price - welspun_cost) / welspun_bid_price * 100
            
            results.append({
                'round': round,
                'welspun_bid': welspun_bid_price,
                'welspun_margin': welspun_margin,
                'welspun_wins': welspun_wins
            })
    
    return pd.DataFrame(results)

def find_optimal_bid(results):
    """Find the bid price that maximizes expected profit"""
    by_bid_price = results.groupby('welspun_bid').agg(
        win_rate=('welspun_wins', 'mean'),
        avg_margin=('welspun_margin', 'mean')
    )
    
    # Expected profit = win probability × margin × order value
    by_bid_price['expected_profit'] = (
        by_bid_price['win_rate'] * 
        by_bid_price['avg_margin'] * 
        project['order_value']
    )
    
    optimal_bid = by_bid_price['expected_profit'].idxmax()
    return optimal_bid, by_bid_price.loc[optimal_bid]
```

### LLM Competitor Agent
```python
competitor_agent_prompt = """
You are simulating Jindal SAW's bidding strategy for a pipe project.

Jindal SAW's strategic context:
- Running at 82% capacity utilization
- Strong financial position (FY26 revenue ₹6,800 Cr)
- Already have 3 projects in progress in this region
- Their steel procurement advantage: 2-3% below market (JSW captive)
- Historical bid behavior: rarely accepts below 5.5% gross margin

Project details:
- Type: LSAW 20-24" X65 pipe
- Quantity: 4,200 tons
- Duration: 8 months
- Customer: Saudi Aramco
- Delivery: Dammam port

Given Jindal's strategic position and the project characteristics, what bid price (INR/ton) 
would Jindal submit? Provide a range and explain the reasoning.
Return JSON: {"bid_price_inr_per_ton": X, "confidence": "high/medium/low", "reasoning": "..."}
"""
```

### Strategy Recommendation Output
```
BID STRATEGY ANALYSIS — Saudi Aramco MSP Project
Order: 4,200 tons LSAW 20" X65 3LPE | Our Minimum Floor: ₹69,640/ton

SIMULATION RESULTS (500 rounds):

Win Probability vs. Bid Price:
₹70,000/ton → 18% win rate | 0.5% margin | Expected profit: ₹1.5L
₹72,000/ton → 38% win rate | 3.4% margin | Expected profit: ₹9.7L  
₹74,000/ton → 62% win rate | 6.0% margin | Expected profit: ₹26.3L ← OPTIMAL
₹76,000/ton → 81% win rate | 8.6% margin | Expected profit: ₹43.2L  ← WAIT...
₹77,500/ton → 74% win rate | 10.0% margin | Expected profit: ₹44.3L ← HIGHEST EXPECTED PROFIT
₹80,000/ton → 45% win rate | 12.9% margin | Expected profit: ₹32.1L

RECOMMENDATION: Bid at ₹77,500/ton
Win probability: 74% | Margin: 10.0% | Expected profit: ₹44.3L

KEY INSIGHT: Ratnamani is under capacity pressure — likely to bid aggressively (est. ₹72-74K)
           Jindal is capacity-constrained — may bid ₹78-82K or skip this bid
           The ₹77,500 bid wins against Ratnamani when they bid above their floor

SENSITIVITY: If Ratnamani bids at ₹73,000 (not ₹75,000): win rate drops to 42%
Fallback: If ₹77,500 doesn't work, ₹74,000 gives 62% win rate with 6% margin

[Download Full Analysis] [Run Sensitivity Analysis] [Save to Bid History]
```

### Estimated Build Time
- Historical bid database: 2 weeks (data entry from past 3 years)
- Competitor cost model: 2 weeks
- Simulation engine: 2 weeks
- LLM competitor agent: 1 week
- UI: 1 week
- Total: ~2 months

---

## Related Ideas
- [[060 - Monte Carlo Bid Margin Simulator]] — cost uncertainty feeds this game simulation
- [[068 - Competitor Intelligence Monitor]] — competitor intelligence improves this model
- [[059 - Bid Data Assembler]] — cost inputs to this simulator
- [[056 - Steel Scrap Price Forecaster]] — commodity prices affect competitor costs too
- [[091 - PipeGPT Welspun Local LLM]] — industry knowledge improves competitor modeling

---

## Notes
- The model is only as good as the competitor intelligence feeding it. Invest heavily in building the historical bid database — every lost bid should have the known competitor price recorded.
- Game theory in practice: the Nash equilibrium optimal strategy assumes competitors act rationally. When a competitor is in distress (financial or capacity), they often bid irrationally low — the model should flag this scenario.
- Validate the model: for the first 10 bids where it makes a recommendation, track if the recommendation would have won at that price. Use this to calibrate the competitor cost models.
