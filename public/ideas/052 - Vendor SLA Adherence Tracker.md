# 052 · Vendor SLA Adherence Tracker

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Logs every maintenance vendor visit: arrival time, departure time, and repair outcome from the SAP PM work order. Generates a monthly vendor scorecard — flagging SLA breaches for contract renegotiation or vendor replacement.

---

## Implementation Blueprint

### Architecture
```
Vendor arrives → Security gate entry log / tablet check-in 
→ SAP PM work order: record arrival, work done, departure 
→ n8n monthly aggregation 
→ Vendor scorecard (response time, fix rate, repeat failures) 
→ Report to Anurag Singh + procurement
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Vendor Check-In | Tablet form at gate / QR code scan | Log arrival time |
| Work Record | SAP PM (PM orders) | Repair completion + outcome |
| Aggregation | n8n monthly job | Aggregate SLA metrics |
| Scorecard | Power BI or Excel | Monthly vendor rating |
| Alert | Teams | Real-time SLA breach alerts |

### Vendor Tracking Fields
```python
vendor_visit = {
    "vendor_name": "ABC Electrical Services",
    "vendor_id": "V-0421",
    "pm_order_number": "PM-2026-0821",
    "equipment_description": "LSAW forming press motor rewinding",
    "breakdown_reported_time": "2026-06-01 08:30",
    "vendor_contacted_time": "2026-06-01 08:45",
    "vendor_arrival_time": "2026-06-01 11:30",  # Security gate log
    "work_start_time": "2026-06-01 11:45",
    "work_completion_time": "2026-06-01 16:20",
    "equipment_restarted_time": "2026-06-01 16:35",
    "repair_outcome": "COMPLETED",
    "repeat_failure_within_30_days": False,
    "parts_used": ["Motor winding", "Bearing 6316"],
    "cost_inr": 85000
}
```

### SLA Terms (Typical for Welspun's Maintenance Contracts)
```python
sla_terms_by_category = {
    "CRITICAL": {
        "response_time_hours": 2,    # Vendor must arrive within 2 hours
        "resolution_time_hours": 8,  # Equipment running within 8 hours
        "repeat_failure_window_days": 30  # If failure recurs in 30 days = vendor liability
    },
    "HIGH": {
        "response_time_hours": 4,
        "resolution_time_hours": 24,
        "repeat_failure_window_days": 14
    },
    "ROUTINE": {
        "response_time_hours": 24,
        "resolution_time_hours": 72,
        "repeat_failure_window_days": 7
    }
}
```

### KPI Calculations
```python
def calculate_vendor_scorecard(vendor_id, month):
    visits = get_vendor_visits(vendor_id, month)
    
    # Response Time SLA
    response_times = [(v.arrival_time - v.contacted_time).hours for v in visits]
    sla_breaches_response = sum(
        1 for v, t in zip(visits, response_times)
        if t > sla_terms_by_category[v.priority]['response_time_hours']
    )
    
    # Resolution Time SLA
    resolution_times = [(v.completion_time - v.breakdown_time).hours for v in visits]
    sla_breaches_resolution = sum(
        1 for v, t in zip(visits, resolution_times)
        if t > sla_terms_by_category[v.priority]['resolution_time_hours']
    )
    
    # First-Time Fix Rate
    repeat_failures = sum(1 for v in visits if v.repeat_failure_within_30_days)
    first_time_fix_rate = (len(visits) - repeat_failures) / max(len(visits), 1) * 100
    
    return {
        'vendor': vendor_id,
        'visits': len(visits),
        'response_sla_pct': (len(visits) - sla_breaches_response) / max(len(visits), 1) * 100,
        'resolution_sla_pct': (len(visits) - sla_breaches_resolution) / max(len(visits), 1) * 100,
        'first_time_fix_rate': first_time_fix_rate,
        'avg_response_hours': statistics.mean(response_times),
        'total_cost_inr': sum(v.cost_inr for v in visits),
        'overall_score': calculate_composite_score(...)
    }
```

### Monthly Vendor Scorecard
```
VENDOR PERFORMANCE SCORECARD — May 2026
Prepared for: Anurag Singh | Maintenance Manager

VENDOR: ABC Electrical Services
Visits: 8 | Priority breakdown: 2 Critical, 4 High, 2 Routine

Response SLA Adherence: 87.5% (SLA target: 95%) ⚠️ BELOW TARGET
  — 1 critical breach: arrived 3.5 hours for 2-hour SLA (Jun 1, motor failure)
  
Resolution SLA Adherence: 100% ✅

First-Time Fix Rate: 87.5% (1 repeat failure) 🟡
  — Motor bearing (PM-2026-0819): Failed again within 14 days
  — Potential warranty claim: ₹12,000

Total Cost: ₹3,42,000 | vs. Budget: ₹2,80,000 (+22% over budget)

RECOMMENDATION: Issue formal SLA breach notice. Discuss at next quarterly review.
[Generate Breach Notice] [Schedule Review Meeting] [Compare with Alternative Vendors]
```

### Real-Time SLA Breach Alert
When a vendor is called and response time SLA is about to expire:
- n8n timer: starts when vendor is contacted
- Alert fires 30 min before SLA expiry: "ABC Electrical must arrive by 10:30 (in 30 min). If they haven't left, call now."
- If SLA breached: auto-log breach in scorecard

### Estimated Build Time
- Check-in app: 1 day
- SAP PM integration: 2 days
- Scorecard calculations: 2 days
- Power BI report: 1 day
- Total: ~1 week

---

## Related Ideas
- [[048 - SAP PM Order Auto-Scheduler]] — PM orders this tool tracks for vendor response
- [[065 - Vendor Reliability Scorecard]] — material vendor version of the same concept
- [[051 - Maintenance KPI Live Dashboard]] — vendor MTTR feeds plant maintenance KPIs
- [[053 - Spares Auto-Purchase Requisition Bot]] — spares vendors tracked here too
- [[010 - Supplier Contract Risk Scanner]] — contract terms against which SLAs are measured

---

## Notes
- Gate visitor log is often the most accurate arrival time record — connect with security team to get this data automatically rather than relying on the vendor to self-report
- Track "vendor-supplied parts failure rate" separately from "repair quality" — some vendors use non-OEM parts that fail faster
- Build a "blacklist trigger": if any vendor has >3 critical SLA breaches in 6 months → auto-flag for contract termination review
