# 082 · Commodity Price Impact on Open Orders

> **Section**: Finance & Reporting | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh, Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
When HRC or scrap prices move >3%, an agent recalculates the mark-to-market margin on all open customer orders — showing which projects are now below target margin and need commercial action (price renegotiation, acceleration, or hedging).

---

## Implementation Blueprint

### Architecture
```
Price trigger: HRC/scrap moves >3% (from [[005 - USD INR Oil Price Alert System]] or daily) 
→ n8n queries SAP SD: all open orders with future delivery dates 
→ Recalculate margin using updated material cost 
→ Flag orders where margin drops below threshold 
→ Ranked report: which orders need commercial action
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Price Trigger | [[005 - USD INR Oil Price Alert System]] webhook | Steel price change signal |
| SAP SD | RFC queries on open sales orders | Order details |
| Cost Model | Python (recalculate cost at new price) | Margin recalculation |
| Output | Power BI / Teams card | Impact report |
| Orchestration | n8n | Event-driven workflow |

### Open Order Data Structure
```python
open_order = {
    "sales_order": "SO-2026-4521",
    "customer": "Saudi Aramco",
    "product": "LSAW 20\" X65 3LPE",
    "quantity_tons": 4200,
    "contracted_price_inr_per_ton": 74000,
    "contracted_delivery": "2026-09-30",
    
    # Cost assumptions at time of bid (locked in bid database)
    "bid_steel_price": 54000,     # INR/ton steel plate
    "bid_conversion_cost": 8240,  # INR/ton
    "bid_coating_cost": 2860,     # INR/ton
    "bid_logistics": 3340,        # INR/ton
    "bid_overhead": 1200,         # INR/ton
    "bid_total_cost": 69640,
    "bid_margin_pct": 5.9,
    
    # Steel requirement ratio
    "steel_input_per_ton_pipe": 1.08  # Yield factor
}
```

### Recalculation Logic
```python
def recalculate_order_margin(order, current_steel_price_inr):
    # Recalculate steel cost at current market price
    current_steel_cost = current_steel_price_inr * order['steel_input_per_ton_pipe']
    
    # Other costs assumed fixed (or also updated if changed)
    current_total_cost = (
        current_steel_cost +
        order['bid_conversion_cost'] +  # Relatively fixed
        order['bid_coating_cost'] +      # May vary with PE resin price
        order['bid_logistics'] +          # Fixed for contracted freight
        order['bid_overhead']
    )
    
    # Check if fixed-price or with price escalation clause
    if order.get('price_escalation_clause'):
        adjusted_price = apply_escalation_formula(order, current_steel_price_inr)
    else:
        adjusted_price = order['contracted_price_inr_per_ton']
    
    current_margin_pct = (adjusted_price - current_total_cost) / adjusted_price * 100
    margin_change = current_margin_pct - order['bid_margin_pct']
    
    return {
        'current_margin_pct': current_margin_pct,
        'margin_change': margin_change,
        'current_steel_cost': current_steel_cost,
        'bid_steel_cost': order['bid_steel_price'] * order['steel_input_per_ton_pipe'],
        'cost_increase': current_steel_cost - order['bid_steel_price'] * order['steel_input_per_ton_pipe'],
        'total_margin_impact_inr': (current_margin_pct - order['bid_margin_pct']) / 100 * order['contracted_price_inr_per_ton'] * order['quantity_tons']
    }
```

### Impact Report
```
STEEL PRICE IMPACT ANALYSIS
Trigger: HRC price +5.2% (₹54,200 → ₹57,000/ton) | Date: 2026-06-01 14:30

IMPACT ON OPEN ORDERS:
Total open order book: 47 orders | ₹842 Cr value

🔴 CRITICAL MARGIN IMPACT (Margin now <3%):
1. SO-4521: Saudi Aramco — 4,200T LSAW 20" X65
   Bid margin: 5.9% | Current margin: 1.8% | Change: -4.1%
   Total margin erosion: ₹4.2L
   Has price escalation clause: NO
   Action: Request commercial review meeting with Aramco

2. SO-4587: JJM Punjab — 8,500T DI DN300 K9  
   Bid margin: 4.2% | Current margin: -0.3% | Change: -4.5%  
   LOSS-MAKING at current steel price
   Total exposure: ₹12.8L
   Has price escalation: PARTIAL (covers 60% of steel movement)
   Action: Invoke escalation clause + negotiate balance

🟡 MODERATE IMPACT (Margin compressed 1-4%):
[8 orders listed with similar format]

🟢 LOW IMPACT (<1% margin change): [21 orders — no action needed]

HEDGING RECOMMENDATION:
Buy 12,000 tons of steel forward contracts at ₹57,000/ton for August delivery
Matches steel requirement for critical orders
If steel rises further to ₹60,000: saves ₹3Cr on these orders
Risk: Steel falls — opportunity cost of ~₹1.5Cr
```

### Estimated Build Time
- SAP SD open order queries: 2 days
- Recalculation logic: 2 days
- Report template: 1 day
- Total: ~5 days

---

## Related Ideas
- [[005 - USD INR Oil Price Alert System]] — triggers this analysis
- [[056 - Steel Scrap Price Forecaster]] — predicts the price moves that trigger this
- [[060 - Monte Carlo Bid Margin Simulator]] — margin sensitivity modeled at bid time
- [[086 - Financial Scenario Stress-Tester]] — company-level scenario version
- [[081 - Real-Time Working Capital Dashboard]] — affected margins feed into working capital

---

## Notes
- A "price escalation clause" is the single most important contract term for this problem — build a standard clause into all bids when steel market is volatile
- Track which orders have escalation vs. fixed-price — and use this analysis to prove to Sarados why escalation clauses are worth fighting for in negotiations
