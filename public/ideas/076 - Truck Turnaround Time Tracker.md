# 076 · Truck Turnaround Time Tracker

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: MA Forbush | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Vehicle registration plate recognition at the gate logs truck entry and exit timestamps. Generates daily TAT (turnaround time) reports by truck, driver, and loading bay — making yard congestion patterns visible and actionable.

---

## Implementation Blueprint

### Architecture
```
Camera at entry gate + exit gate 
→ OpenALPR (Automatic License Plate Recognition) 
→ Entry/exit timestamp logged in database 
→ TAT = exit time - entry time 
→ Daily report: average TAT by loading bay, driver, time of day 
→ Alert if truck in yard >4 hours (stuck?)
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Entry Camera | IP camera (Hikvision 2MP, fixed) | Capture plate at gate |
| Exit Camera | IP camera at exit gate | Capture plate leaving |
| ALPR Engine | OpenALPR (open source) or PlateRecognizer.com API | Read plate number |
| Database | PostgreSQL or SQLite | Store entry/exit logs |
| Analytics | Python + pandas | TAT calculations |
| Dashboard | Grafana or Power BI | Reports and trends |
| Alert | n8n + Teams/WhatsApp | Long-stay truck alerts |
| Integration | SAP WM (optional) | Link to loading orders |

### OpenALPR vs. PlateRecognizer
```
OpenALPR (Free, open source):
+ Free to run locally
+ Works offline
- Less accurate for Indian plates
- Requires training for Indian regional format variations

PlateRecognizer.com (Paid):
+ Excellent Indian license plate support
+ API-based: $0.001/recognition
+ Works in poor lighting, bad angles
- Requires internet connection
+ Recommended for production use
```

### License Plate Reading (Python)
```python
import requests

def recognize_plate(image_path):
    # PlateRecognizer API
    response = requests.post(
        'https://api.platerecognizer.com/v1/plate-reader/',
        files=dict(upload=open(image_path, 'rb')),
        headers={'Authorization': 'Token YOUR_API_KEY'}
    )
    result = response.json()
    
    if result['results']:
        return {
            'plate': result['results'][0]['plate'].upper(),
            'confidence': result['results'][0]['score'],
            'region': result['results'][0].get('region', {}).get('code', 'IN-GJ')
        }
    return None

def log_gate_event(plate, gate_type, timestamp):
    """gate_type: 'ENTRY' or 'EXIT'"""
    db.insert('gate_events', {
        'plate': plate,
        'gate': gate_type,
        'timestamp': timestamp,
        'date': timestamp.date(),
        'time': timestamp.time()
    })
```

### TAT Calculation
```python
def calculate_tat_report(date):
    # Match ENTRY events to EXIT events by plate number
    entries = db.query("SELECT * FROM gate_events WHERE gate='ENTRY' AND date=?", date)
    exits = db.query("SELECT * FROM gate_events WHERE gate='EXIT' AND date=?", date)
    
    tat_records = []
    for entry in entries:
        matching_exit = find_next_exit(entry.plate, entry.timestamp, exits)
        if matching_exit:
            tat_minutes = (matching_exit.timestamp - entry.timestamp).seconds / 60
            tat_records.append({
                'plate': entry.plate,
                'entry': entry.timestamp,
                'exit': matching_exit.timestamp,
                'tat_minutes': tat_minutes,
                'loading_bay': get_assigned_bay(entry.plate, entry.timestamp),
                'driver': get_driver(entry.plate, entry.timestamp),
                'cargo_type': get_cargo_type(entry.plate, entry.timestamp)
            })
    
    return tat_records

# Average TAT by loading bay (identifies which bays are bottlenecks)
bay_avg_tat = {bay: mean(r.tat_minutes for r in tat_records if r.loading_bay == bay)
               for bay in all_bays}
```

### Daily TAT Report
```
TRUCK TURNAROUND TIME REPORT — 2026-06-01
Total trucks: 47 | Average TAT: 2.8 hours | Target: <2.5 hours

LOADING BAY PERFORMANCE:
Bay 1 (LSAW Dispatch): Avg 2.1 hrs ✅ | 12 trucks today
Bay 2 (DI Pipe Dispatch): Avg 2.3 hrs ✅ | 8 trucks today
Bay 3 (General Cargo): Avg 3.8 hrs ⚠️ | 15 trucks today — BOTTLENECK
Bay 4 (Export Yard): Avg 2.9 hrs | 12 trucks today

OUTLIERS (TAT >4 hours):
GJ18 AB 5421: 5.8 hours ← Investigation required (documentation issue?)
GJ12 CD 8892: 4.3 hours (3LPE coating repair delayed loading)

TIME-OF-DAY PATTERN:
Morning (08:00-12:00): Avg 2.1 hrs (best performance — morning shift)
Afternoon (12:00-16:00): Avg 3.2 hrs (post-lunch dip + shift changeover)
Evening (16:00-20:00): Avg 3.8 hrs (documentation processing delays)

RECOMMENDATION: 
Bay 3 bottleneck — investigate staffing during afternoon shift.
Evening documentation delays: implement pre-processing of shipping documents before trucks arrive.
```

### Alert for Stuck Trucks
```python
# Alert if truck in yard >4 hours
def check_overstay():
    current_entries = db.query("SELECT * FROM gate_events WHERE gate='ENTRY' AND no_exit_yet=TRUE")
    for entry in current_entries:
        hours_in_yard = (now - entry.timestamp).seconds / 3600
        if hours_in_yard > 4:
            send_alert(
                to="MA Forbush + Gate Security",
                message=f"Truck {entry.plate} in yard for {hours_in_yard:.1f} hours. Investigate."
            )
```

### Estimated Build Time
- Camera + ALPR setup: 1 week
- Database + logging: 2 days
- TAT calculations: 1 day
- Dashboard: 2 days
- Total: ~2 weeks

### Hardware Cost
- 2× IP cameras (entry + exit): ~₹10,000–20,000
- Mounting hardware + cables: ~₹5,000
- PlateRecognizer API: ~$30/month for typical volume
- Total: ~₹20,000 hardware + ₹2,500/month running

---

## Related Ideas
- [[072 - Pipe Location Digital Map]] — truck destination in yard tracked here
- [[071 - Drone Pipe Counter Inventory Map]] — inventory check before truck loading
- [[044 - Daily Production Output Live Counter]] — production drives truck loading requirements
- [[067 - Export Document Auto-Preparer]] — document readiness affects truck TAT
- [[080 - Pipe Loading Photographic Record]] — triggered at same gate camera system

---

## Notes
- Indian license plates have significant format variations (old yellow BH format, new white format, transport vehicle formats) — test OpenALPR accuracy with actual Anjar area plate samples before committing
- Build a "truck driver whitelist" with regular contractors' plates registered — enables personalized service (their loading bay assignment can be automatically communicated when they enter)
- TAT data is gold for vendor/contractor negotiations: if a specific transport company consistently has >4-hour TATs due to their own documentation failures, this is objective evidence for SLA enforcement
