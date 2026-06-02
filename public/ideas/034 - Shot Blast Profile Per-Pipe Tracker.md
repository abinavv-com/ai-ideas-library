# 034 · Shot Blast Profile Per-Pipe Tracker

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Coating line QA | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Installs a rugosity sensor at the blast cabin exit. Automatically records surface roughness profile (Ra/Rz) per pipe and flags any pipe that falls below the minimum requirement for 3LPE adhesion — preventing coating failures in the field caused by inadequate surface preparation.

---

## Implementation Blueprint

### Architecture
```
Blast cabin exit → Pipe passes trigger sensor → 
Elcometer/Mitutoyo rugosity gauge (auto-measure) → 
Data captured via RS232/Bluetooth → 
Python logger + per-pipe record → 
PASS/FAIL vs. coating spec → SAP QM + alert if FAIL
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensor | Elcometer 224 portable or 480 inline surface roughness gauge | Measure Ra/Rz per pipe |
| Alternative | Mitutoyo SJ-210 with RS232 output | Lower cost option |
| Data Capture | Python serial port reader | Read gauge output |
| Logger | Python + SQLite or SAP QM | Store per-pipe records |
| Integration | n8n + SAP QM BAPI | Flag failures, update records |
| Dashboard | Grafana or Power BI | SPC charts per line |

### Surface Roughness Requirements for Pipe Coatings
```python
coating_roughness_requirements = {
    "3LPE": {
        "Ra_min_um": 6.0,   # Roughness average
        "Ra_max_um": 25.0,
        "Rz_min_um": 40.0,  # Mean peak-to-valley height
        "Rz_max_um": 150.0,
        "standard": "ISO 8501-1 SA 2.5 minimum + DIN 55928 Part 4"
    },
    "3LPP": {
        "Ra_min_um": 6.0,
        "Ra_max_um": 25.0,
        "Rz_min_um": 40.0,
        "Rz_max_um": 150.0,
        "standard": "ISO 8501-1 SA 2.5 minimum"
    },
    "FBE": {
        "Ra_min_um": 3.0,   # FBE less sensitive to roughness
        "Ra_max_um": 12.0,
        "standard": "CSA Z245.20 or customer spec"
    }
}
```

### Sensor Setup
The Elcometer 224 can be set up as a semi-automated gauge:
- **Position**: Mount on articulating arm at blast cabin exit, at pipe 12 o'clock position
- **Trigger**: Pipe arrives at measurement station → solenoid drops probe tip onto pipe surface → measurement takes 2 seconds → probe lifts → pipe continues
- **Measurement positions**: 3 positions per pipe (both ends + middle) for short pipes; 5 positions for pipes > 12m

### Python Data Logger
```python
import serial
import json
from datetime import datetime

ser = serial.Serial('COM3', 9600)  # Elcometer RS232 port

def read_roughness_measurement():
    line = ser.readline().decode('utf-8').strip()
    # Parse Elcometer output format: "Ra=8.2 Rz=62.4 Rt=71.1"
    data = parse_elcometer_output(line)
    return {
        'timestamp': datetime.now().isoformat(),
        'Ra_um': data['Ra'],
        'Rz_um': data['Rz'],
        'measurement_position': current_position  # Set by pipe length / conveyor position
    }

def evaluate_pass_fail(measurement, coating_type):
    req = coating_roughness_requirements[coating_type]
    
    ra_pass = req['Ra_min_um'] <= measurement['Ra_um'] <= req['Ra_max_um']
    rz_pass = req['Rz_min_um'] <= measurement['Rz_um'] <= req['Rz_max_um']
    
    return {
        'result': 'PASS' if (ra_pass and rz_pass) else 'FAIL',
        'Ra_result': 'PASS' if ra_pass else 'FAIL',
        'Rz_result': 'PASS' if rz_pass else 'FAIL'
    }
```

### Statistical Process Control (SPC)
Track roughness trends to detect blast media wear (shot becoming too smooth with age):
```python
# Alert when rolling average Ra drops below warning threshold
# Warning: Ra < 8.0 μm (before hitting minimum of 6.0)
# This gives 2–3 hours to add fresh shot before failures start
```

SPC chart shows:
- Individual Ra values per pipe (scatter plot)
- 3-sigma control limits
- Warning zone (approaching minimum)
- Trend line (shot wear visible as gradual decrease over shift)

### Failure Action
```
SURFACE ROUGHNESS FAIL — Pipe HT-2341-P089
Pipe: 20" × 14.3mm | Coating: 3LPE
Position: Measurement Point 2 (6m from end)
Ra: 4.8 μm (min: 6.0 μm) ← FAIL
Rz: 31.2 μm (min: 40.0 μm) ← FAIL

Actions:
1. HOLD pipe — do not proceed to coating
2. Return to blast cabin for additional blast pass
3. Re-measure after second pass

Root cause (likely): Shot media worn — check shot particle size. 
Last shot replenishment: 4 shifts ago.
Recommendation: Add 50kg fresh shot to blast cabin.
```

### Estimated Build Time
- Sensor procurement: 2 weeks lead time
- Mechanical mounting: 2 days
- Python logger + SAP integration: 2–3 days
- Calibration: 1 day
- SPC chart setup: 1 day

### Hardware Cost
- Elcometer 224 gauge: ~£3,000 (~₹3.2L)
- Budget alternative (manual gauge but with digital output): ~₹50,000–80,000
- Mounting hardware: ~₹10,000

---

## Related Ideas
- [[031 - Surface Rust Severity Classifier]] — upstream: surface condition before blast
- [[024 - Visual Coating Defect Camera System]] — downstream: coating quality after application
- [[023 - Coating Holiday False-Positive Filter]] — holiday rate correlates with blast profile
- [[025 - Bevel Angle Pipe Geometry Vision Auditor]] — same per-pipe data capture philosophy
- [[032 - MTC Auto-Generator]] — blast profile data feeds final certificate

---

## Notes
- Elcometer provides an SDK and RS232 protocol documentation — integration is straightforward
- For high-speed production lines (>15 pipes/hour), consider the inline version with automatic contact — the portable gauge version is for lower-speed lines
- Track blast media consumption: correlate roughness profile decline with hours since last shot replenishment to build a predictive shot maintenance schedule
