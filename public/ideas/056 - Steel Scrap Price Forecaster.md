# 056 · Steel Scrap Price Forecaster

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Pulls live LME non-ferrous, Platts HRC, and Indian scrap index data via API. ML model forecasts next 2–4 week scrap prices — advising Mihir's team when to buy spot vs. defer purchases. Turns a gut-feel procurement decision into a data-supported one.

---

## Implementation Blueprint

### Architecture
```
Daily data collection: LME, Platts, SteelMint, India scrap prices 
→ Feature engineering (price momentum, seasonal patterns, FX rates) 
→ ARIMA/XGBoost forecasting model → 2–4 week price forecast 
→ Buy/defer recommendation with confidence level 
→ Power BI dashboard + Teams notification
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Sources | Multiple APIs + web scrapers | Price data collection |
| Feature Engineering | Python `pandas` | Technical indicators |
| Forecasting Model | Python `statsmodels` (ARIMA) + `xgboost` | Price prediction |
| Orchestration | n8n (daily data pull) | Automation |
| Visualization | Power BI or Plotly | Price trends + forecast |
| Alert | Teams | Buy/defer recommendations |

### Data Sources
```python
data_sources = {
    # Free sources
    "LME_nonferrous": {
        "api": "LME API (free basic tier)",
        "url": "https://www.lme.com/en/metals/non-ferrous/",
        "relevance": "Global scrap indicator — HMS grades"
    },
    "Indian_scrap_SteelMint": {
        "api": "SteelMint subscription or RSS feed",
        "url": "https://www.steelmint.com/price/scrap",
        "relevance": "Direct Indian scrap pricing — most relevant"
    },
    "HRC_platts": {
        "api": "S&P Platts subscription or spot price from web",
        "relevance": "Prime steel alternative cost — limits scrap ceiling"
    },
    "USD_INR": {
        "api": "Alpha Vantage free tier",
        "relevance": "Imported scrap cost translation"
    },
    "China_export_volume": {
        "api": "GDELT / Reuters RSS",
        "relevance": "China steel export changes move Indian prices by 3–6 weeks"
    },
    "freight_Baltic": {
        "api": "Baltic Exchange (paid) or GDELT proxy",
        "relevance": "Imported scrap freight cost"
    }
}
```

### Feature Engineering
```python
def build_features(price_df, date):
    features = {
        # Price momentum
        'price_1w_change_pct': (price - price_7d_ago) / price_7d_ago * 100,
        'price_4w_change_pct': (price - price_28d_ago) / price_28d_ago * 100,
        
        # Technical indicators
        'rsi_14': calculate_rsi(price_df['price'], 14),
        'ma_7_vs_ma_21': price_ma7 / price_ma21 - 1,
        'price_vs_52w_high': price / price_52w_high,
        
        # Macro factors
        'usd_inr_rate': usd_inr,
        'usd_inr_1w_change': (usd_inr - usd_inr_7d_ago) / usd_inr_7d_ago * 100,
        'china_pmi': get_china_manufacturing_pmi(),
        
        # Seasonal patterns
        'month': date.month,
        'quarter': date.quarter,
        
        # Demand indicators
        'india_infra_orders_lag4w': get_india_infra_index(date - timedelta(weeks=4)),
    }
    return features
```

### Forecasting Model (XGBoost)
```python
from xgboost import XGBRegressor
from sklearn.model_selection import TimeSeriesSplit

# Target: 2-week forward price change (%)
X = build_historical_features(price_history)
y = calculate_forward_returns(price_history, horizon_days=14)

model = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8
)

# Time-series cross-validation (do not leak future data)
tscv = TimeSeriesSplit(n_splits=5)
model.fit(X_train, y_train)

# Forecast output: price in 2 weeks, confidence interval
forecast_2w = model.predict([today_features])[0]
lower_bound, upper_bound = calculate_prediction_interval(model, today_features)
```

### Recommendation Engine
```python
def generate_buy_recommendation(forecast_pct_change, confidence, current_inventory_days):
    """
    Generate buy/defer recommendation with rationale
    """
    if forecast_pct_change > 5 and confidence > 0.7:
        return "BUY_NOW", f"Price forecast to rise +{forecast_pct_change:.1f}% in 2 weeks. Buy 4–6 weeks of inventory now."
    elif forecast_pct_change < -5 and confidence > 0.7:
        return "DEFER", f"Price forecast to fall {abs(forecast_pct_change):.1f}% in 2 weeks. Defer to spot market if inventory allows."
    elif current_inventory_days < 14:
        return "BUY_REGARDLESS", "Inventory critically low — buy regardless of price direction."
    else:
        return "NEUTRAL", "Price direction uncertain. Maintain regular procurement schedule."
```

### Weekly Report to Mihir
```
STEEL SCRAP PRICE FORECAST — Week of 2026-06-01

CURRENT PRICES (Indian Market):
HMS 1 Scrap: ₹28,400/ton (+1.2% w/w)
HMS 2 Scrap: ₹27,100/ton (+0.8% w/w)
Pig Iron: ₹32,800/ton (-0.5% w/w)

2-WEEK PRICE FORECAST:
HMS 1: ₹29,200–29,800/ton (+2.8–5.0%) — RISING ↑
Confidence: 72%
Key drivers: China reducing exports post-Olympics → global scrap tightening
           India Monsoon slowdown in construction → local demand dip (offset)

RECOMMENDATION: 🟢 BUY NOW
Buy 3–4 weeks of HMS 1 scrap at current prices. Lock in before China-driven tightening.

Current Welspun inventory: 18 days | Recommended target: 35 days
Buy quantity: ~4,500 tons | Estimated forward saving: ₹18–32L
```

### Estimated Build Time
- Data pipeline: 1 week
- Model training (needs 2+ years of historical data): 1 week
- Dashboard + alert: 1 week
- Total: ~3 weeks

### Cost
- SteelMint subscription: ~₹20,000–50,000/year
- LME API: Free basic tier
- Alpha Vantage: Free tier sufficient
- Total: ~₹20,000–50,000/year

---

## Related Ideas
- [[057 - Commodity Sentiment NLP Monitor]] — news sentiment layer on top of price data
- [[005 - USD INR Oil Price Alert System]] — FX rate that feeds into scrap cost
- [[060 - Monte Carlo Bid Margin Simulator]] — scrap price forecasts feed bid simulations
- [[082 - Commodity Price Impact on Open Orders]] — scrap price changes affect open order margins
- [[062 - Scrap Steel Gate Classifier]] — quality classifier for scrap being purchased

---

## Notes
- Steel scrap forecasting has a median accuracy of ~65–70% for 2-week horizon — this is enough to improve decisions but must not be treated as certain
- Build a "model accuracy tracker": each week, compare the forecast to actual — show Mihir the rolling accuracy so he knows how much to trust it
- The model needs retraining when structural market changes occur (e.g., new government import policy, major mill opening/closing)
