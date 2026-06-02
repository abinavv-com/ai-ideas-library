# 042 · Zinc Spray Nozzle Clog Predictor

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: DI coating line | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors zinc spray gun flow rate and pressure sensor data. ML model detects the signature pattern (pressure rise + flow drop) that precedes a full nozzle clog — alerting maintenance 15–30 minutes before coating weight failure, allowing a scheduled nozzle change instead of a line shutdown and batch rejection.

---

## Implementation Blueprint

### Architecture
```
Zinc spray system: pressure transducer + flow meter (existing or added) 
→ Raspberry Pi / edge PLC → MQTT → 
Python anomaly detection model (real-time time-series) → 
Alert 15–30 min before predicted clog 
→ Maintenance schedules nozzle change at next pipe gap
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensors | Pressure transducer (0–10 bar) + Coriolis/magnetic flow meter | Monitor spray system |
| Edge Device | Raspberry Pi 4 or Arduino with Ethernet | Read sensors, publish MQTT |
| Message Broker | MQTT (Mosquitto) | IoT data pipeline |
| ML Model | Python `scikit-learn` (Isolation Forest + trend analysis) | Clog prediction |
| Alert | n8n → Teams/WhatsApp | Maintenance team notification |
| Data Log | InfluxDB + Grafana | Trend visualization |

### The Zinc Spray Clog Mechanism
In DI pipe production, molten zinc is sprayed onto the pipe exterior for corrosion protection:
- **Clog signature**: Zinc solidifies in nozzle orifice over time
  - Phase 1 (normal): Stable pressure ~3.5 bar, flow ~12 L/min
  - Phase 2 (partial clog, 15–30 min before failure): Pressure rises to 4.2 bar, flow drops to 10 L/min
  - Phase 3 (full clog): Pressure spike >6 bar, flow drops to near zero → coating weight failure → batch rejection
- **Current practice**: Operators notice visually when spray pattern changes → already in Phase 3 or late Phase 2

### Sensor Requirements
If not already installed:
- **Pressure transducer**: 0–10 bar range, 4-20mA output, ≤0.5% accuracy. Cost: ~₹3,000
- **Flow meter**: Micro-gear flow meter for molten zinc (high temperature rated). Cost: ~₹8,000–15,000
- **Temperature sensor**: Thermocouple at nozzle exit. Cost: ~₹500

### Clog Detection Model
```python
import numpy as np
from sklearn.ensemble import IsolationForest

# Features extracted from 60-second rolling window
def extract_clog_features(pressure_series, flow_series):
    return {
        'pressure_mean': np.mean(pressure_series[-60:]),      # Last 60 seconds
        'pressure_slope': np.polyfit(range(60), pressure_series[-60:], 1)[0],  # Trend
        'flow_mean': np.mean(flow_series[-60:]),
        'flow_slope': np.polyfit(range(60), flow_series[-60:], 1)[0],
        'pressure_variance': np.var(pressure_series[-60:]),
        'pressure_flow_ratio': np.mean(pressure_series[-60:]) / max(np.mean(flow_series[-60:]), 0.001),
        'flow_reduction_pct': (nominal_flow - np.mean(flow_series[-60:])) / nominal_flow * 100
    }

# Rule-based fast detector (catches obvious Phase 3 clog immediately)
def rule_based_alert(pressure, flow):
    if pressure > 5.5 or flow < 8.0:
        return 'IMMEDIATE_CLOG'
    if pressure > 4.2 and flow < 10.5:
        return 'CLOG_DEVELOPING'
    return 'NORMAL'

# ML detector (catches subtle Phase 2 precursors)
anomaly_score = isolation_forest_model.score_samples([current_features])[0]
if anomaly_score < -0.15:  # Anomaly threshold
    return 'PREDICTIVE_ALERT'
```

### Alert Message
```
⚠️ ZINC NOZZLE CLOG PREDICTED — DI Coating Line
Gun: Zinc Spray Gun #2 | Time: 14:32

Trend Detection:
• Pressure: 4.1 bar (normal: 3.4 bar) ↑ Rising trend: +0.05 bar/min
• Flow: 10.8 L/min (normal: 12.2 L/min) ↓ Declining trend
• Pressure/Flow ratio: 2.3× above baseline

Predicted full clog in: ~20–25 minutes

Recommended Action:
Schedule nozzle change at next pipe gap (estimated: Pipe P-089 in 8 minutes)
Current nozzle runtime: 6.2 hours (typical clog interval: 6–8 hours)

[Acknowledge] [Schedule Change] [Override — Monitoring]
```

### Grafana Real-Time Dashboard
- Live pressure trace + flow trace (last 2 hours)
- Anomaly score trend line
- Alert events overlay
- Nozzle change history (track runtime per nozzle)

### Maintenance Scheduling Integration
When alert fires:
- n8n checks production schedule: next pipe arrival time (from SAP PP)
- Schedules nozzle change in the gap between pipes (typically 90 seconds between pipes)
- Maintenance team arrives with replacement nozzle ready
- Total changeover: <5 minutes vs. full line stop if clog occurs unexpectedly

### Estimated Build Time
- Sensor installation: 1–2 days
- ML model: 3–4 weeks (need 1–2 months of operational data first)
- Alert system: 2 days

### Hardware Cost
- Sensors: ~₹20,000–25,000 per spray gun
- Raspberry Pi + enclosure: ~₹6,000
- Total per gun: ~₹30,000

---

## Related Ideas
- [[028 - Flux Moisture Contamination Detector]] — same IoT sensor architecture
- [[046 - Predictive Maintenance Dashboard]] — sister predictive maintenance tool
- [[042 - Zinc Spray Nozzle Clog Predictor]] — self
- [[050 - Thermal Camera Gearbox Monitor]] — similar predictive approach for mechanical equipment
- [[053 - Spares Auto-Purchase Requisition Bot]] — zinc nozzle replacements auto-ordered when stock low

---

## Notes
- Collect 4–6 weeks of normal operation + 5+ actual clog events before building the ML model
- Mark each actual clog event in the data with a timestamp — this is the "ground truth" for training
- Nozzle wear pattern changes with zinc temperature and composition — retrain model seasonally
