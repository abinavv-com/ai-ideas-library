# 030 · QA Sign-Off Queue Prioritizer

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida, QA engineers | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors the list of pipes waiting for QA release. AI agent prioritizes the queue based on project delivery deadline urgency, pipe criticality, and customer tier — ensuring the QA engineer always works the highest-impact hold first, not just the oldest item in the queue.

---

## Implementation Blueprint

### Architecture
```
SAP QM inspection lots (status: "waiting for release") 
→ n8n daily/hourly query 
→ Pull: delivery deadline, customer priority, inspection type required 
→ Priority scoring algorithm 
→ Ranked queue on QA engineer's dashboard 
→ Rebalanced automatically as new lots arrive
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP QM (inspection lots) + SAP SD (delivery dates) | Queue + urgency data |
| Orchestration | n8n | Scheduled queue refresh |
| Scoring | Python rule engine | Priority score calculation |
| Dashboard | Power BI or SharePoint list | PN Mahida's daily queue view |
| Alert | Teams message | Daily priority list + urgent escalations |

### Priority Scoring Formula
```python
def calculate_priority_score(inspection_lot):
    score = 0
    
    # Factor 1: Days until delivery deadline (higher urgency = higher score)
    days_to_deadline = (inspection_lot['delivery_date'] - today).days
    if days_to_deadline <= 3:
        score += 100  # CRITICAL
    elif days_to_deadline <= 7:
        score += 60   # HIGH
    elif days_to_deadline <= 14:
        score += 30   # MEDIUM
    else:
        score += 10   # LOW
    
    # Factor 2: Customer tier
    customer_tier_scores = {
        'ARAMCO': 40,
        'GAIL': 35,
        'JJM': 30,
        'OTHER_EXPORT': 25,
        'DOMESTIC': 15
    }
    score += customer_tier_scores.get(inspection_lot['customer'], 15)
    
    # Factor 3: Inspection type complexity (simpler = can be done faster, prioritize to clear queue)
    if inspection_lot['inspection_type'] in ['VISUAL_ONLY', 'DIM_CHECK']:
        score += 20  # Quick wins
    elif inspection_lot['inspection_type'] == 'FULL_QA_RELEASE':
        score += 10
    
    # Factor 4: Pipe criticality / end use
    if inspection_lot.get('end_use') in ['SOUR_SERVICE', 'OFFSHORE', 'GAS_TRANSMISSION']:
        score += 30
    
    # Factor 5: Aging — pipes waiting >3 days get priority boost
    days_waiting = (today - inspection_lot['hold_date']).days
    score += min(days_waiting * 5, 30)  # Max 30 points for aging
    
    # Factor 6: Block on subsequent operations (e.g., coating line waiting for this release)
    if inspection_lot.get('blocks_production_line'):
        score += 50
    
    return score
```

### Daily Priority Queue (Teams Message)
```
📋 QA RELEASE QUEUE — 2026-06-01 08:00
Total waiting: 34 inspection lots | Estimated backlog: 2.1 days

🔴 CRITICAL (Release today):
1. IL-4521 — Saudi Aramco | 47 pipes, LSAW 20" X65 | Delivery: Tomorrow
   Wait: 2 days | Type: Final release post-repair | Score: 187
   
2. IL-4498 — JJM Punjab | 12 pipes, DI 300mm K9 | Delivery: +2 days
   Wait: 1 day | Type: Dimensional + coating check | Score: 162

🟡 HIGH (Release by EOD tomorrow):
3. IL-4489 — GAIL Compressor Station | 89 pipes, LSAW 24" X70
   Wait: 3 days | Type: Sour service — full QA package | Score: 141
   ⚠️ Note: Sour service spec requires PN Mahida personal sign-off

🟢 MEDIUM (This week):
[Items 4–34 listed...]

[View Full Queue] [Flag Urgent Item] [Request Resource Support]
```

### Escalation Triggers
- Any lot: delivery deadline < 24 hours → auto-escalate to PN Mahida
- Any lot: waiting > 5 days without progress → alert to plant manager
- Any lot: sour service / critical application → require senior QA sign-off, not junior engineer

### Resource Balancing
When queue exceeds 2-day capacity:
- n8n detects: total estimated inspection hours > (available QA engineers × hours per shift)
- Suggests: pull QA engineers from lower-priority incoming inspection to clear high-priority release queue
- Notifies PN Mahida with resource recommendation

### Estimated Build Time
- SAP QM data extraction: 1–2 days
- Scoring algorithm: 1 day
- Teams bot + dashboard: 1 day
- Total: 3–4 days

### Cost
- n8n + Python: Free
- Power BI: If already licensed (free add-on)
- Total: Zero ongoing cost

---

## Related Ideas
- [[032 - MTC Auto-Generator]] — MTC completion is one of the release blockers this tool tracks
- [[013 - Customer Progress Report Generator]] — customer reports reference QA release status
- [[029 - Automated RCA Report Generator]] — RCA completion is a prerequisite for some QA releases
- [[033 - NDT Inspector Fatigue Warning System]] — inspector capacity affects queue clearance rate
- [[051 - Maintenance KPI Live Dashboard]] — same Power BI dashboard infrastructure

---

## Notes
- The scoring weights above are starting values — calibrate them with PN Mahida based on real-world priorities
- Some customers have contractual "inspection hold" requirements (TPI must be present) — these lots need special handling; add a flag for TPI-required lots
- Track "queue velocity" — how many lots are released per day vs. how many are added — to detect when QA capacity is falling behind production rate
