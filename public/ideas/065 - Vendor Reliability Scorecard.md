# 065 · Vendor Reliability Scorecard

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monthly AI-compiled scorecard for each supplier: on-time delivery %, quality rejection %, price consistency vs. market index, and MTC documentation completeness. Automates what the procurement team currently tracks manually on spreadsheets — and feeds into annual vendor negotiation.

---

## Implementation Blueprint

### Architecture
```
Monthly n8n job: 
→ SAP MM (PO delivery history) + SAP QM (rejection rates) 
→ SAP FI (invoice pricing history) 
→ Market price APIs (benchmark comparison) 
→ MTC completeness check (from [[014 - Material Certificate Auto-Importer]]) 
→ Python score calculation 
→ Power BI scorecard + annual negotiation report
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Delivery Data | SAP MM (GR documents vs. PO delivery dates) | On-time delivery |
| Quality Data | SAP QM (inspection rejection records) | Quality rejection rate |
| Price Data | SAP MM (PO price history) + market APIs | Price consistency |
| Documentation | MTC auto-importer database | Certificate completeness |
| Scoring | Python weighted average | Overall vendor score |
| Visualization | Power BI | Scorecard dashboard |

### Scorecard KPIs and Weights
```python
vendor_kpis = {
    "on_time_delivery": {
        "weight": 0.30,    # 30% of total score
        "measurement": "% of deliveries within agreed delivery window",
        "target": 95,       # 95% on-time
        "source": "SAP MM GR date vs. PO delivery date"
    },
    "quality_acceptance_rate": {
        "weight": 0.30,
        "measurement": "% of delivered material accepted without rejection",
        "target": 99,
        "source": "SAP QM rejection records"
    },
    "price_competitiveness": {
        "weight": 0.20,
        "measurement": "Vendor price vs. market index average (lower is better)",
        "target": 100,  # At or below market index
        "source": "SAP PO prices vs. SteelMint/LME market benchmark"
    },
    "documentation_completeness": {
        "weight": 0.10,
        "measurement": "% of deliveries with complete, accurate MTC documentation",
        "target": 100,
        "source": "MTC auto-importer extraction quality log"
    },
    "responsiveness": {
        "weight": 0.10,
        "measurement": "Average time to respond to inquiries/issues",
        "target": 24,  # Within 24 hours
        "source": "Email/Teams response time tracking (manual if needed)"
    }
}
```

### Scoring Formula
```python
def calculate_vendor_score(vendor_id, month):
    data = get_vendor_data(vendor_id, month)
    
    scores = {}
    
    # On-time delivery
    scores['delivery'] = min(data['on_time_pct'] / 95 * 100, 100)  # Normalized to 100
    
    # Quality
    scores['quality'] = min(data['acceptance_rate_pct'] / 99 * 100, 100)
    
    # Price competitiveness
    # 100% if at market, >100% if below market, <100% if above market
    scores['price'] = min(100 / data['premium_vs_market_pct'] * 100, 100)
    
    # Documentation
    scores['documentation'] = data['mtc_completeness_pct']
    
    # Responsiveness
    scores['responsiveness'] = max(0, 100 - (data['avg_response_hours'] - 24) * 2)
    
    # Weighted total
    total_score = (
        scores['delivery'] * 0.30 +
        scores['quality'] * 0.30 +
        scores['price'] * 0.20 +
        scores['documentation'] * 0.10 +
        scores['responsiveness'] * 0.10
    )
    
    # Grade
    if total_score >= 90: grade = 'A'
    elif total_score >= 75: grade = 'B'
    elif total_score >= 60: grade = 'C'
    else: grade = 'D'  # Performance improvement required
    
    return total_score, grade, scores
```

### Monthly Scorecard (Power BI)
```
VENDOR PERFORMANCE SCORECARD — May 2026

VENDOR: TATA Steel Ltd (VS-001)
Score: 88/100 | Grade: A | Trend: ↑ +3pts from last month

On-Time Delivery:  96% ✅  (target: 95%)      Weight: 30 pts → 30.3
Quality Acceptance: 99.2% ✅ (target: 99%)     Weight: 30 pts → 30.1
Price vs. Market:   +2.1% above index 🟡        Weight: 20 pts → 18.5
MTC Completeness:  100% ✅                      Weight: 10 pts → 10.0
Responsiveness:    18 hr avg ✅                 Weight: 10 pts → 9.1

COMMENTS:
• Price slightly above market — raise in Q3 contract negotiation
• MTC documentation has improved after our feedback in Q1 2026
• Zero quality rejections in May ← excellent

VENDOR: ABC Flux Suppliers (VS-089)
Score: 61/100 | Grade: C | Trend: ↓ -8pts | ⚠️ AT RISK
[...]
```

### Action Triggers
```python
def determine_vendor_action(grade, trend_3_months):
    if grade == 'A':
        return "PREFERRED_VENDOR — Consider extending contract + asking for volume discount"
    elif grade == 'B':
        return "APPROVED — No action required. Monitor."
    elif grade == 'C':
        return "PERFORMANCE_IMPROVEMENT_REQUIRED — Issue formal notice. 3 months to improve."
    elif grade == 'D':
        return "CRITICAL — Escalate to Mihir. Consider suspension pending review."
    
    if trend_3_months == 'declining' and grade == 'B':
        return "WARNING — B grade but declining trend. Start qualifying alternative vendor."
```

### Estimated Build Time
- SAP data queries: 2–3 days
- Scoring algorithm: 1 day
- Power BI dashboard: 1–2 days
- Total: ~1 week

### Cost
- Power BI: Existing license
- n8n: Free
- SAP: Existing license

---

## Related Ideas
- [[052 - Vendor SLA Adherence Tracker]] — maintenance vendor version of this
- [[010 - Supplier Contract Risk Scanner]] — contract terms being honored tracked here
- [[014 - Material Certificate Auto-Importer]] — MTC quality feeds this scorecard
- [[070 - Supplier ESG Due Diligence Agent]] — ESG dimension added to this scorecard
- [[056 - Steel Scrap Price Forecaster]] — price competitiveness context

---

## Notes
- Share each vendor's scorecard WITH the vendor directly during quarterly reviews — this creates incentive for improvement and opens the conversation about performance gaps
- Weight the scorecard differently for critical vs. non-critical suppliers: for a sole-source critical supplier, prioritize reliability over price; for commodity suppliers, weight price more heavily
- Track "scorecard trend over 2 years" for renewal decisions — a consistently improving C vendor is better than a declining A vendor
