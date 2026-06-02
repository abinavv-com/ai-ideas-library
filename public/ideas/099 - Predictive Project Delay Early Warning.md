# 099 · Predictive Project Delay Early Warning

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 💰, 🛡️
> **Helps**: Project managers, Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
ML model (XGBoost) trained on historical project delivery data — predicts on-time delivery probability at 30/60/90-day horizons. Fires an automated alert to project manager and customer when delay risk crosses 40%, allowing proactive communication instead of a last-minute surprise.

---

## Implementation Blueprint

### Architecture
```
SAP PS/PP/SD project data (daily refresh) 
→ Feature engineering: production progress vs. plan, QA hold rates, material availability 
→ XGBoost classification model: P(on-time delivery) at 30/60/90 days 
→ Alert: P < 60% → internal warning | P < 40% → customer pre-notification 
→ Teams alert to PM + suggested customer communication
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP PP (production progress), SD (committed dates), QM (QA status) | Project health data |
| Model | Python XGBoost classifier | Delay probability |
| Feature Engineering | Python `pandas` | Predictor variables |
| Alert | n8n + Teams | PM and customer notification |
| Dashboard | Power BI | Portfolio-level delay risk view |
| Customer Comms | [[013 - Customer Progress Report Generator]] | Draft proactive update |

### Feature Engineering — What Predicts Delays
```python
def build_project_features(project_id, as_of_date):
    
    # PRODUCTION PROGRESS
    planned_pct = get_planned_completion_pct(project_id, as_of_date)
    actual_pct = get_actual_completion_pct(project_id, as_of_date)
    progress_gap = planned_pct - actual_pct  # Positive = behind plan
    
    # OEE AND LINE PERFORMANCE
    line_oee_last_2_weeks = get_line_oee(project_id['line'], days=14)
    
    # QUALITY ISSUES
    qa_hold_rate_pct = get_qa_hold_rate(project_id, days=14)
    open_ncr_count = count_open_nonconformances(project_id)
    
    # MATERIAL AVAILABILITY
    days_steel_stock_remaining = get_material_stock_days(project_id)
    open_po_delivery_risk = get_po_delivery_risk(project_id)
    
    # SCHEDULE PRESSURE
    days_to_delivery = (project['committed_delivery'] - as_of_date).days
    
    # HISTORICAL PROJECT PATTERNS
    same_customer_past_delay_rate = get_customer_delay_history(project['customer'])
    same_product_type_delay_rate = get_product_delay_history(project['product_type'])
    project_complexity_score = calculate_complexity_score(project)  # Special reqs?
    
    # EXTERNAL FACTORS
    port_congestion_risk = get_port_risk(project['destination_port'])
    
    return {
        'progress_gap_pct': progress_gap,
        'actual_completion_pct': actual_pct,
        'days_to_delivery': days_to_delivery,
        'qa_hold_rate_pct': qa_hold_rate_pct,
        'open_ncr_count': open_ncr_count,
        'line_oee_14d': line_oee_last_2_weeks,
        'steel_days_remaining': days_steel_stock_remaining,
        'customer_delay_history': same_customer_past_delay_rate,
        'port_congestion_risk': port_congestion_risk
    }
```

### XGBoost Model
```python
from xgboost import XGBClassifier

# Target: Did project deliver on time? (1 = yes, 0 = delayed)
# Features: everything in build_project_features()

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    scale_pos_weight=3,  # 3× weight for delays (positive class) — penalize missing delays
    use_label_encoder=False
)

model.fit(X_train, y_train)

# For each active project, predict probability of on-time delivery
def predict_delivery_risk(project_id, as_of_date):
    features = build_project_features(project_id, as_of_date)
    p_on_time = model.predict_proba([features.values()])[0][1]  # P(on time)
    
    if p_on_time > 0.75:
        return 'LOW_RISK', p_on_time
    elif p_on_time > 0.50:
        return 'MEDIUM_RISK', p_on_time
    elif p_on_time > 0.40:
        return 'HIGH_RISK', p_on_time
    else:
        return 'CRITICAL_RISK', p_on_time
```

### Alert Logic by Risk Level
```
LOW_RISK (>75%): 
→ No alert. Monitor daily.

MEDIUM_RISK (50-75%): 
→ Weekly internal alert to PM.
→ "Project {name} delivery probability has dropped to {pct}%. Review and confirm contingency."

HIGH_RISK (40-50%): 
→ Immediate Teams alert to PM + Mihir.
→ "DELAY RISK: {project} — 40-50% on-time probability. Initiate contingency plan."
→ Trigger [[013 - Customer Progress Report Generator]] for proactive customer update.

CRITICAL_RISK (<40%): 
→ Immediate alert to PM + Mihir + Sarados.
→ Auto-draft customer notification email (via [[013 - Customer Progress Report Generator]]).
→ "Recommend proactive customer call within 24 hours."
→ Escalation if PM doesn't acknowledge within 2 hours.
```

### Portfolio Risk Dashboard
```
PROJECT DELIVERY RISK DASHBOARD — 2026-06-01

Portfolio: 47 active orders | On-time probability average: 81%

🔴 CRITICAL RISK (<40%):
SO-4587 JJM Punjab — 34% on-time probability
  Key drivers: -15% production behind plan | 8 open NCRs | Port congestion risk
  Days to delivery: 23 | Action: PM + customer call today

🟡 HIGH RISK (40-50%):
SO-4521 Aramco — 44% on-time probability  
  Key drivers: -8% behind plan | Steel stock only 8 days left
  Days to delivery: 41 | Action: Fast-track steel order + customer heads-up

🟡 MEDIUM RISK (50-75%): [12 orders]
🟢 LOW RISK (>75%): [33 orders — on track]
```

### Learning from Each Project
After each project completes, feed actual outcome back:
```python
# Was the model right?
model_accuracy_tracker.log({
    'project': project_id,
    'prediction_30d_out': prediction_history[project_id][30_days_before],
    'prediction_60d_out': prediction_history[project_id][60_days_before],
    'actual_on_time': project_was_delivered_on_time
})

# Retrain quarterly with new data
```

### Estimated Build Time
- SAP data pipeline: 1 week
- Feature engineering: 1 week
- Model training (needs 2+ years of historical projects): 1 week
- Alert system: 1 week
- Dashboard: 1 week
- Total: ~5 weeks (plus 2 years of historical data requirement)

---

## Related Ideas
- [[013 - Customer Progress Report Generator]] — proactive customer update triggered here
- [[045 - Production What-If Schedule Simulator]] — recovery options when delay detected
- [[087 - JJM Payment Delay Predictor]] — payment timing follows delivery timing
- [[040 - Production OEE Live Dashboard]] — OEE is a key leading indicator
- [[083 - Project-Level Profitability Tracker]] — delays often cause margin erosion

---

## Notes
- The most valuable feature is "progress gap" — if a project is 10% behind plan 60 days before delivery and production is running at current rate, it's mathematically impossible to catch up without overtime or extra capacity. The model should flag this explicitly.
- Avoid telling customers about delays before your own team has a mitigation plan — the alert should give the PM 24-48 hours to develop a response before triggering the customer draft
- Track false positive rate carefully — if the model fires too many "high risk" alerts that turn out to be fine, teams will stop paying attention (the "boy who cried wolf" effect)
