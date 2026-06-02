# 033 · NDT Inspector Fatigue Warning System

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Jignesh, QA supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Tracks X-ray image review speed per inspector per shift. When review pace slows significantly below their personal baseline (indicating fatigue), alerts the supervisor to rotate the inspector — before a missed defect reaches a customer. Addresses one of the leading causes of NDT escape events.

---

## Implementation Blueprint

### Architecture
```
X-ray review workstation → Track: image opened timestamp, decision timestamp, decision made 
→ Python service calculates review pace → 
Compare to personal baseline and shift average → 
Fatigue score exceeds threshold → Supervisor alert
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Collection | Thin client on review workstation (keyboard hook or custom review app) | Track review timestamps |
| Analysis | Python (rolling statistics) | Pace monitoring |
| Baseline Model | Per-inspector rolling average | Personalized threshold |
| Alert | Teams message to QA supervisor | Rotation recommendation |
| Dashboard | Power BI | Shift overview of all inspectors |

### What to Measure
```python
inspector_metrics = {
    'inspector_id': 'JIG-001',
    'shift_date': '2026-06-01',
    'shift_type': 'morning',  # morning/afternoon/night
    'images_reviewed': 142,
    
    # Per-image timing
    'review_events': [
        {'image_id': 'XR-2341-042', 'start': '09:15:03', 'decision': '09:15:47', 
         'duration_sec': 44, 'decision': 'ACCEPT'},
        {'image_id': 'XR-2341-043', 'start': '09:15:50', 'decision': '09:16:28',
         'duration_sec': 38, 'decision': 'REJECT'}
    ],
    
    # Aggregate metrics
    'avg_review_time_sec': 42,
    'personal_baseline_sec': 38,  # this inspector's normal pace over last 30 days
    'pace_ratio': 1.10,  # 10% slower than baseline
    
    # Decision patterns
    'acceptance_rate_last_30': 0.96,  # 96% accept in last 30 images
    'acceptance_rate_shift_avg': 0.94,
    'consecutive_accepts': 22  # last 22 images all accepted — possible attention drift
}
```

### Fatigue Indicators
Research-backed fatigue signatures in visual inspection tasks:
1. **Slowing pace**: review time >25% above personal baseline (sustained for 30+ images)
2. **Acceptance rate increase**: near-100% acceptance rate sustained for 20+ images (not reviewing carefully)
3. **High variance in review times**: very fast + very slow decisions intermixed (distraction)
4. **Time-of-shift effect**: all inspectors tend toward fatigue 4–5 hours into shift
5. **Post-meal dip**: 13:00–14:00 circadian low

### Fatigue Score Calculation
```python
def calculate_fatigue_score(metrics, personal_baseline):
    score = 0
    
    # Pace slowdown
    pace_ratio = metrics['avg_review_time_last_20'] / personal_baseline['avg_review_time']
    if pace_ratio > 1.5:    score += 40
    elif pace_ratio > 1.25: score += 20
    
    # Acceptance rate anomaly
    accept_rate = metrics['acceptance_rate_last_30']
    if accept_rate > 0.99:  score += 30  # Near-100% acceptance is suspicious
    elif accept_rate > 0.98: score += 15
    
    # Consecutive accepts without reject
    if metrics['consecutive_accepts'] > 25: score += 25
    
    # Shift time factor
    hours_into_shift = (now - metrics['shift_start']).hours
    if hours_into_shift > 5: score += 15
    if hours_into_shift > 7: score += 20
    
    return score  # Score > 60: alert supervisor

def recommend_action(score):
    if score >= 80:
        return "ROTATION_REQUIRED", "Inspector showing strong fatigue signs — rotate immediately"
    elif score >= 60:
        return "BREAK_RECOMMENDED", "Inspector showing early fatigue — 15-minute break recommended"
    else:
        return "NORMAL", ""
```

### Alert to Supervisor
```
⚠️ NDT FATIGUE ALERT — QA Supervisor Notification
Inspector: Pradeep Nair (JIG-003) | Shift: Afternoon | Time: 15:47

Fatigue Indicators Detected:
• Review pace: 28% slower than personal baseline (last 45 images)
• Acceptance rate last 30: 99.3% (significantly above shift average of 94.8%)
• Consecutive acceptances without reject: 31 images
• Hours into shift: 5.5 hours

Recommendation: Rotate Pradeep to non-inspection task for 30 minutes.
Replace with: Suresh Mehta (currently on coating inspection)

[Confirm Rotation] [Snooze 30 min] [Override — I've checked in personally]

This alert is ADVISORY ONLY — supervisor judgment required.
```

### Privacy and Labor Relations Considerations
- This is a **safety tool**, not a performance evaluation tool
- Fatigue is not the inspector's fault — it's a physiological reality
- Frame all communications as: "Time for a break" not "you're doing poorly"
- Data is visible to QA supervisors only, not HR
- No disciplinary action can be based on this data — document this policy explicitly

### Estimated Build Time
- Workstation monitoring: 2–3 days
- Analysis service: 1 day
- Alert system: 1 day
- Total: ~1 week

### Cost
- All software: Free
- No hardware needed (uses existing review workstations)

---

## Related Ideas
- [[021 - X-Ray Weld Defect Detector]] — AI does first-pass filtering to reduce inspector load
- [[030 - QA Sign-Off Queue Prioritizer]] — queue management that considers inspector availability
- [[027 - Welding Operator Defect Correlation Tracker]] — operator-side complement to this
- [[055 - Operator Qualification Digital Assessment]] — certification tracking for NDT inspectors
- [[033 - NDT Inspector Fatigue Warning System]] — self

---

## Notes
- The acceptance rate anomaly is the strongest indicator — research shows inspectors in fatigue states tend to "satisfice" (accept items without careful review) rather than slow down
- Night shifts show 2–3× higher false negative rates in NDT research literature — consider mandatory 2-hour checks on night shifts
- Consider also monitoring keystroke/mouse activity patterns on the review workstation as additional fatigue proxy
