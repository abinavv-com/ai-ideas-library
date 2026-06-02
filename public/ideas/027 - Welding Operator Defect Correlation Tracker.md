# 027 · Welding Operator Defect Correlation Tracker

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Pawan Kathayat, PN Mahida | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Links individual welder IDs to their daily weld parameters and X-ray/UT outcomes. Identifies which operators have statistically elevated repair call rates — enabling targeted retraining or parameter adjustment before a defect batch ships to a customer.

---

## Implementation Blueprint

### Architecture
```
SAP PP (welder ID + production order) + QA system (X-ray/UT results) 
→ Python data pipeline → Per-welder defect rate calculation 
→ Statistical significance test → 
Anomaly alert when welder's rate > threshold 
→ Weekly dashboard + retraining trigger
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP PP (operator ID per batch) + SAP QM (defect records) | Production + QA linkage |
| Analysis | Python `pandas` + `scipy.stats` | Statistical analysis |
| Visualization | Power BI or Python `matplotlib` | Operator scorecards |
| Alerts | n8n + Teams | Real-time anomaly detection |
| Storage | SQLite or PostgreSQL (local) | Aggregated performance data |

### Data Linkage
The key challenge: linking weld defects back to the specific operator who made the weld.

```python
# From SAP PP: each production order has assigned operator(s)
production_records = {
    "prod_order": "PR-2026-4521",
    "pipe_id": "HT-2341-P042",
    "weld_type": "seam_weld_LSAW",
    "operator_id": "OP-0042",
    "operator_name": "Ramesh Kumar",
    "shift": "morning",
    "date": "2026-06-01",
    "welding_parameters": {
        "current_A": 850,
        "voltage_V": 35,
        "speed_m_min": 2.1,
        "wire_heat_no": "FX-2024-889"
    }
}

# From SAP QM: defect inspection result
qm_records = {
    "pipe_id": "HT-2341-P042",
    "inspection_date": "2026-06-01",
    "xray_result": "REPAIR",
    "defect_type": "porosity",
    "defect_location_mm": 450,
    "repair_weld_required": True
}
```

### Defect Rate Calculation
```python
def calculate_operator_metrics(operator_id, date_range):
    welds = get_welds_by_operator(operator_id, date_range)
    
    metrics = {
        "operator_id": operator_id,
        "total_pipes_welded": len(welds),
        "pipes_with_defects": count_defective(welds),
        "defect_rate_pct": count_defective(welds) / len(welds) * 100,
        "repair_rate_pct": count_repairs(welds) / len(welds) * 100,
        "defect_types": breakdown_by_defect_type(welds),
        "avg_weld_current_A": mean([w['current_A'] for w in welds]),
        "avg_weld_speed_m_min": mean([w['speed_m_min'] for w in welds])
    }
    return metrics
```

### Statistical Significance Check
Don't alert on small sample sizes — wait for statistical significance:
```python
from scipy import stats

def is_significantly_elevated(operator_rate, plant_avg_rate, n_samples):
    """Use binomial test to check if operator's rate is significantly above plant average"""
    if n_samples < 30:
        return False, "Insufficient data"
    
    p_value = stats.binom_test(
        k=int(operator_rate * n_samples),  # observed defects
        n=n_samples,
        p=plant_avg_rate  # expected rate
    )
    
    return p_value < 0.05, f"p={p_value:.3f}"  # 95% confidence threshold
```

### Alert Conditions
1. Welder's defect rate > 2× plant average (sustained over 50+ pipes)
2. Sudden spike: defect rate in last 5 shifts > 3× personal rolling average
3. Specific defect type cluster (e.g., all porosity → suggests moisture in flux or wrong preheat)

### Weekly Operator Scorecard (Power BI)
```
WELDING OPERATOR PERFORMANCE — Week of 2026-06-01
Line: LSAW Production

| Operator        | Pipes | Defect Rate | vs Plant Avg | Trend | Status |
|-----------------|-------|-------------|-------------|-------|--------|
| Ramesh Kumar    | 47    | 2.1%        | -0.8%       | ↓     | 🟢 Good |
| Suresh Patel    | 39    | 8.7%        | +5.8%       | ↑↑    | 🔴 Alert |
| Mahendra Singh  | 52    | 3.2%        | +0.3%       | →     | 🟡 Watch |
Plant Average: 2.9%
```

### Privacy and Fairness Considerations
- Data used for retraining, not punishment — communicate this clearly
- Minimum 50 pipes before any alert is raised — no one punished for small sample noise
- Defect correlation includes equipment variables — exclude periods of known equipment issues
- If operator A always gets assigned the more difficult welding procedures, normalize for job difficulty
- Share individual scorecards with the operator directly, not just management

### Estimated Build Time
- Data pipeline: 2–3 days (with SAP access)
- Statistical model: 1 day
- Power BI dashboard: 1–2 days
- Alert workflow: 1 day

### Cost
- Software: Free (Python) + Power BI (if already licensed)
- SAP data access: Existing license

---

## Related Ideas
- [[021 - X-Ray Weld Defect Detector]] — source of defect records this correlates
- [[029 - Automated RCA Report Generator]] — operator correlation data feeds RCA reports
- [[028 - Flux Moisture Contamination Detector]] — equipment-side cause of defects vs. operator-side
- [[055 - Operator Qualification Digital Assessment]] — retraining triggered by this analysis
- [[035 - Operator Skill-to-Project Matcher]] — skill level data complements defect rate data

---

## Notes
- The most important insight is often not "who has high defect rates" but "when" — defects cluster on Monday mornings, night shifts, or immediately after lunch → points to fatigue/attention factors not operator skill
- Add weld parameter deviation analysis: operators who deviate significantly from qualified WPS parameters tend to have higher defect rates — flag WPS deviations as leading indicator
