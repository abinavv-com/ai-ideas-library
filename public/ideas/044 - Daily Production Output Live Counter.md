# 044 · Daily Production Output Live Counter

> **Section**: Manufacturing & Process | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh, production supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Counts finished pipes in real-time using a photoelectric or vision-based counter at the line exit — displaying a live running total on a control room TV screen. Eliminates the end-of-shift manual count and gives supervisors a live "are we on target?" answer at any moment.

---

## Implementation Blueprint

### Architecture
```
Photoelectric gate sensor at each line exit 
→ Raspberry Pi / PLC counter 
→ MQTT → n8n → 
Real-time count displayed on TV dashboard (Grafana or simple web page) 
→ Compare to daily target from SAP
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensor | Pepperl+Fuchs or SICK photoelectric sensor (through-beam) | Detect pipe passing |
| Counter | Raspberry Pi or Arduino (interrupt-driven counter) | Count pulses |
| Protocol | MQTT | Publish count data |
| Dashboard | Grafana (open source) or simple Node.js app | Display on TV |
| Target Data | SAP PP daily production order | Compare actual vs. plan |
| Orchestration | n8n | Aggregate + SAP comparison |

### Sensor Setup
Through-beam photoelectric sensor:
```
[EMITTER] ————————— PIPE PASSES HERE ————————— [RECEIVER]
                    ↓ Beam interrupted once per pipe
                    ↓ Raspberry Pi GPIO counts interrupt
```

For large pipes (>12m long): use two sensors spaced apart to count pipe entry AND exit — validate count (if only one sensor triggers = sensor error)

```python
import RPi.GPIO as GPIO
from datetime import datetime

SENSOR_PIN = 17
pipe_count = 0
last_trigger_time = 0
MIN_PIPE_LENGTH_SECONDS = 5  # Debounce: ignore triggers within 5 seconds

GPIO.setmode(GPIO.BCM)
GPIO.setup(SENSOR_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def pipe_detected(channel):
    global pipe_count, last_trigger_time
    now = time.time()
    
    if now - last_trigger_time > MIN_PIPE_LENGTH_SECONDS:
        pipe_count += 1
        last_trigger_time = now
        
        # Publish to MQTT immediately
        mqtt_client.publish(f"welspun/production/lsaw_1/count", json.dumps({
            "pipe_number": pipe_count,
            "timestamp": datetime.now().isoformat(),
            "shift": get_current_shift()
        }))

GPIO.add_event_detect(SENSOR_PIN, GPIO.FALLING, callback=pipe_detected)
```

### Grafana Dashboard (Control Room TV)
A large-screen dashboard showing:
```
┌─────────────────────────────────────────────────────────┐
│        WELSPUN PRODUCTION — LIVE COUNT                   │
│            Date: 2026-06-01 | Morning Shift              │
├─────────────────┬────────────────┬──────────────────────┤
│    LSAW LINE 1  │  HSAW LINE 2   │   DI PRODUCTION      │
│    ┌──────────┐ │  ┌──────────┐  │   ┌──────────┐       │
│    │    47    │ │  │    23    │  │   │   112    │       │
│    │  pipes   │ │  │  pipes   │  │   │  pipes   │       │
│    └──────────┘ │  └──────────┘  │   └──────────┘       │
│    Target: 55   │  Target: 28    │   Target: 130         │
│    🟡 85%       │  🟢 82%        │   🟡 86%              │
├─────────────────┴────────────────┴──────────────────────┤
│    TOTAL TODAY: 182 pipes | TARGET: 213 | PACE: 86%     │
│    Estimated end-of-shift: 201 pipes (short by 12)       │
└─────────────────────────────────────────────────────────┘
```
Updated every 30 seconds. Displayed on 55" TV in control room + accessible on mobile.

### Pace Calculation
```python
def calculate_pace(pipes_produced, shift_elapsed_min, shift_total_min, daily_target):
    current_rate = pipes_produced / shift_elapsed_min  # pipes per minute
    projected_total = current_rate * shift_total_min
    pace_pct = projected_total / daily_target * 100
    deficit = daily_target - projected_total
    return pace_pct, deficit
```

### Alert Logic
- Pace < 80% sustained for 30+ minutes → alert Anurag Singh
- No pipe counted for 20+ minutes (line down?) → immediate alert
- Pace > 100% (ahead of target) → positive notification to supervisor

### SAP Integration
At end of shift, n8n auto-reconciles:
- Physical count (from sensor) vs. SAP production confirmations
- Discrepancy > 5% → alert for investigation
- This is the golden record comparison that validates both systems

### Estimated Build Time
- Sensor installation: 1 day per line (simple mounting + wiring)
- Raspberry Pi counter code: Half a day
- MQTT + Grafana dashboard: 1 day
- Total: 2–3 days per line

### Hardware Cost
- SICK WL100 through-beam sensor: ~₹4,000–8,000 per set
- Raspberry Pi 4: ~₹5,000 (shared with other projects)
- Cable + mounting: ~₹2,000
- Total per line: ~₹10,000–15,000

---

## Related Ideas
- [[040 - Production OEE Live Dashboard]] — this pipe count feeds the OEE performance metric
- [[090 - Management Dashboard]] — daily production count is a key metric in executive view
- [[045 - Production What-If Schedule Simulator]] — actual count feeds into schedule re-planning
- [[044 - Daily Production Output Live Counter]] — self
- [[076 - Truck Turnaround Time Tracker]] — similar edge sensor + counter architecture

---

## Notes
- The single biggest value is the "end-of-day reconciliation shock" — when a manual count has been wrong all day, the live counter eliminates this
- For pipes that are moved (returned for repair, scrapped) — ensure the counter captures "net completed" by having a separate count for rework exits
- Consider also adding a weight scale at line exit — weight × piece count gives real-time tons produced
