# 061 · Ocean Freight Spot Rate Predictor

> **Section**: Supply Chain & Procurement | **Complexity**: 🔵 Month 4–6 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir's logistics team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
ML model trained on historical Baltic Exchange rates, seasonal patterns, and port congestion data. Recommends whether to lock in ocean freight contracts now vs. wait based on the rate forecast for the next 60 days — a decision currently made by gut feel that can swing ₹2–5L per shipment.

---

## Implementation Blueprint

### Architecture
```
Daily: fetch Baltic Exchange rates + port congestion data + seasonal signals 
→ Feature engineering → XGBoost time-series forecasting model 
→ 30/60-day rate forecast for key routes 
→ Contract vs. spot recommendation + confidence level 
→ Weekly briefing to Mihir's logistics team
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Sources | Baltic Exchange, Drewry weekly newsletter, Freightos | Historical + current rates |
| Forecasting | Python `xgboost` + `prophet` | Rate prediction |
| Port Congestion | Marine Traffic API or Vessel Finder | Congestion signals |
| Orchestration | n8n (daily data pull) | Automation |
| Output | Power BI + Teams weekly brief | Recommendation delivery |

### Key Routes for Welspun
```python
routes = {
    "Mundra_to_Dammam_KSA": {"freight_type": "bulk_OOG", "typical_range": "28-65 USD/MT"},
    "Mundra_to_Abu_Dhabi_UAE": {"freight_type": "bulk_OOG", "typical_range": "22-55 USD/MT"},
    "Mundra_to_Rotterdam_NL": {"freight_type": "bulk_project", "typical_range": "35-75 USD/MT"},
    "Mundra_to_Houston_USA": {"freight_type": "bulk_breakbulk", "typical_range": "45-85 USD/MT"},
    "Mundra_to_Lagos_Nigeria": {"freight_type": "bulk_OOG", "typical_range": "40-80 USD/MT"}
}
# OOG = Out of Gauge (pipes are non-containerizable cargo)
```

### Data Sources (Free vs. Paid)
```python
data_sources = {
    # FREE
    "Baltic Dry Index (BDI)": {
        "url": "https://www.balticexchange.com (free daily headlines)",
        "relevance": "General bulk shipping sentiment proxy"
    },
    "Freightos FBX (free dashboard)": {
        "url": "https://www.freightos.com/freight-resources/freightos-baltic-index/",
        "relevance": "Weekly container rates (proxy)"
    },
    "MarineTraffic port congestion (limited free)": {
        "relevance": "Port congestion signals"
    },
    
    # PAID (worth it for large shipment volumes)
    "Drewry Shipping Consultants": {
        "cost": "$2,000–5,000/year",
        "value": "Weekly breakbulk/project cargo rate data by route"
    },
    "Clarksons Shipping Intelligence Network": {
        "cost": "$5,000+/year",
        "value": "Comprehensive shipping rate database"
    }
}
```

### Seasonal Patterns (Key Insight)
Pipeline project cargo (heavy, long pipes) has strong seasonal patterns:
- **Oct–Feb**: Low season for Middle East projects (post-summer, budget approval period) — rates typically 15–25% below peak
- **Mar–Jun**: Peak season as projects mobilize — rates rise
- **Jul–Sep**: Gulf Monsoon season — some delay, moderate rates

```python
def add_seasonal_features(df):
    df['month'] = df['date'].dt.month
    df['quarter'] = df['date'].dt.quarter
    df['is_peak_season'] = df['month'].isin([3, 4, 5, 6]).astype(int)
    df['is_ramadan_period'] = check_ramadan_dates(df['date'])  # Middle East project slowdown
    return df
```

### Model Features
```python
freight_features = {
    # Rate momentum
    'rate_1w_change_pct': ...,
    'rate_4w_change_pct': ...,
    'rate_vs_1yr_avg': ...,
    
    # Capacity/supply signals
    'idle_vessel_pct': ...,           # % of fleet not contracted
    'newbuilding_deliveries_qtr': ..., # New ships entering market
    
    # Demand signals
    'china_iron_ore_imports': ...,    # China drives bulk shipping demand
    'global_oil_project_awards_lag4w': ...,  # Pipeline project awards
    
    # Port congestion
    'middle_east_port_congestion_index': ...,
    
    # Macro
    'brent_crude_price': ...,         # Oil projects correlated
    'usd_dxy_index': ...,
    
    # Seasonal
    'month': ...,
    'is_peak_season': ...
}
```

### Recommendation Output
```
OCEAN FREIGHT FORECAST — Week of 2026-06-01
Route: Mundra → Dammam (Saudi Arabia)

CURRENT SPOT RATE: $41/MT
MARKET TREND: Declining (-8% over last 4 weeks)

30-DAY FORECAST: $37–40/MT (↓ declining, 72% confidence)
60-DAY FORECAST: $38–44/MT (stabilizing, 55% confidence)

RECOMMENDATION: ⏳ WAIT — Do Not Contract Now
Rates forecast to fall 5–10% in next 4 weeks.
For shipment planned >6 weeks out: book at spot closer to departure.
For shipment in <3 weeks: book now at $41 — don't risk supply.

CAVEAT: Port congestion at Dammam elevated (14 ships at anchor).
If congestion worsens, rates could spike. Consider partial hedge:
Book 50% of cargo volume now, 50% spot in 3 weeks.

Model accuracy (last 12 months): 64% directional accuracy on 4-week horizon
```

### Estimated Build Time
- Data pipeline: 2 weeks (getting historical data is the challenge)
- Model training: 1 week
- Dashboard: 1 week
- Total: ~4 weeks

### Cost
- Drewry subscription: $2,000–5,000/year (justified for >₹20Cr/year freight spend)
- Python/model: Free
- ROI: Getting freight 5% lower on ₹20Cr/year spend = ₹1Cr savings

---

## Related Ideas
- [[004 - Port Congestion Alert Bot]] — real-time congestion monitoring that feeds this model
- [[056 - Steel Scrap Price Forecaster]] — same time-series forecasting approach
- [[075 - Vessel Loading Stowage Planner]] — cargo planning that affects freight rates (full load = better rate)
- [[060 - Monte Carlo Bid Margin Simulator]] — freight uncertainty is a key input to bid simulations
- [[067 - Export Document Auto-Preparer]] — shipping document prep when contract is placed

---

## Notes
- Project cargo (pipes) rates are less standardized than container freight — rates vary enormously by vessel type, pipe dimensions, and loading port congestion. The model should be calibrated specifically for Welspun's cargo types.
- For the first 6 months, run the model in "observation mode" — compare predictions to actual rates without acting on them, to measure accuracy before making procurement decisions based on it
