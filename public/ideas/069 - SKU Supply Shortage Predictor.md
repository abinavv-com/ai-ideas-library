# 069 · SKU Supply Shortage Predictor

> **Section**: Supply Chain & Procurement | **Complexity**: 🔵 Month 4–6 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
ML model analyzes each of the 15,000+ SKUs for: consumption rate, lead time, and supplier concentration risk. Predicts which materials are likely to hit stockout in the next 60–90 days — triggering early procurement action before spot market premiums are needed.

---

## Implementation Blueprint

### Architecture
```
SAP MM (consumption history + inventory + open POs) 
→ Python feature engineering (trend, seasonality, variance) 
→ XGBoost survival model (days until stockout prediction) 
→ Risk ranking: HIGH / MEDIUM / LOW per SKU 
→ Weekly alert report to Mihir + auto-PRs for CRITICAL items
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP MM (MARD inventory, MSEG movements, EKBE receipts) | Historical consumption + stock |
| Model | Python XGBoost + survival analysis | Stockout prediction |
| Supplier Risk | Python (concentration score) | Single-source risk |
| Alert | n8n weekly report + Teams | Notification to Mihir |
| Auto-PR | n8n + SAP BAPI (for CRITICAL items) | Trigger procurement action |

### Feature Engineering
```python
def build_sku_features(material_id, as_of_date):
    # Consumption history
    monthly_consumption = get_monthly_consumption(material_id, months=24)
    
    features = {
        # Current inventory position
        'current_stock': get_current_stock(material_id),
        'open_po_qty': get_open_pos(material_id)['total_qty'],
        'days_of_stock': current_stock / max(avg_daily_consumption, 0.01),
        
        # Consumption trend
        'avg_monthly_consumption': np.mean(monthly_consumption),
        'consumption_trend': calculate_trend(monthly_consumption),   # Slope
        'consumption_volatility': np.std(monthly_consumption) / max(np.mean(monthly_consumption), 0.01),
        'seasonal_factor': get_seasonal_index(material_id, current_month),
        
        # Supply factors
        'supplier_count': count_active_suppliers(material_id),
        'avg_lead_time_days': get_avg_lead_time(material_id),
        'lead_time_variance_days': get_lead_time_std(material_id),
        'last_delivery_delay_days': get_last_delivery_delay(material_id),
        
        # Production demand
        'open_production_orders_consumption': estimate_po_consumption(material_id),
        'upcoming_project_consumption': get_project_forecast(material_id, days=90),
        
        # Supply chain risk
        'supplier_is_single_source': count_active_suppliers(material_id) == 1,
        'supplier_reliability_score': get_vendor_score(material_id),
        'import_dependent': is_import_dependent(material_id)
    }
    
    return features
```

### Shortage Risk Score
```python
def calculate_shortage_risk(features):
    # Days of stock remaining (accounting for trend)
    projected_consumption = features['avg_monthly_consumption'] * (1 + features['consumption_trend'])
    net_supply = features['current_stock'] + features['open_po_qty']
    days_of_supply = net_supply / max(projected_consumption / 30, 0.01)
    
    # Risk score components
    supply_risk = max(0, (features['avg_lead_time_days'] * 1.5) - days_of_supply) / features['avg_lead_time_days']
    
    concentration_risk = 1.5 if features['supplier_is_single_source'] else 1.0
    volatility_risk = 1 + features['consumption_volatility'] * 0.3
    
    combined_risk = supply_risk * concentration_risk * volatility_risk
    
    if combined_risk > 0.8:
        return 'CRITICAL', days_of_supply
    elif combined_risk > 0.5:
        return 'HIGH', days_of_supply
    elif combined_risk > 0.3:
        return 'MEDIUM', days_of_supply
    else:
        return 'LOW', days_of_supply
```

### Weekly Alert Report
```
SKU SUPPLY RISK REPORT — Week of 2026-06-01
Materials monitored: 15,247 | Generated at: Monday 08:00

🔴 CRITICAL — Immediate Action (7 items):

1. BEARING_6316 (1200-4521)
   Current stock: 2 EA | Avg consumption: 3/month | Lead time: 5 days
   Days of supply: 20 days ← CRITICAL (should have 45 days minimum)
   Risk: SINGLE SOURCE supplier + recent delivery delays (+3 days last order)
   Recommendation: ORDER 12 EA IMMEDIATELY → Auto-PR drafted: PR-2026-0421
   
2. PE RESIN (BASF LR6100E) (3100-8821)
   Current stock: 4.2 tons | Monthly consumption: 2.8 tons (rising trend +15%)
   Days of supply: 45 days | Lead time: 35 days (imported)
   Risk: IMPORT DEPENDENT + consumption trend increasing
   Recommendation: ORDER 8.4 tons within 1 week. Price window: current rates stable.

🟡 HIGH — Order within 2 weeks (14 items):
[...]

🟢 MEDIUM — Monitor (89 items):
[...]

GREEN — No action needed (15,137 items)

Total value at risk if all CRITICAL items stock out: ₹42L production downtime
```

### Model Training Data
```python
# Train on historical stockout events
# Target: days_until_stockout (survival analysis) or binary stockout_in_90_days
historical_features = build_features_for_all_skus(as_of_date=historical_date)
actual_stockouts = get_stockout_events(start_date=historical_date, end_date=historical_date + 90_days)

# XGBoost Classifier: did this SKU stock out within 90 days?
model = XGBClassifier(scale_pos_weight=20)  # Stockouts are rare events
model.fit(X_train, y_train)
```

### Estimated Build Time
- SAP data pipeline: 2–3 weeks
- Feature engineering: 1 week
- Model training (need 2+ years of history): 1 week
- Alert system: 3 days

### Cost
- Software: Free (Python + scikit-learn)
- n8n: Free
- SAP: Existing

---

## Related Ideas
- [[053 - Spares Auto-Purchase Requisition Bot]] — auto-reorders for maintenance spares
- [[047 - Spare Parts Inventory Reality Check]] — validates the SAP data this model uses
- [[066 - SKU Rationalization Agent]] — identifies dormant SKUs; this focuses on active ones
- [[056 - Steel Scrap Price Forecaster]] — material price context for procurement timing
- [[015 - Blanket PO Utilization Alert]] — complementary alert for blanket PO usage

---

## Notes
- Start with just the top 200 most critical SKUs (A-class materials) rather than all 15,000 — this proves the model value before scaling
- The single-source concentration risk flag is often more valuable than the quantity calculation — flag any single-source imported critical material and drive dual-sourcing efforts
- Track "model performance": did the HIGH risk items actually stock out within 90 days? Calibrate thresholds monthly for the first 6 months
