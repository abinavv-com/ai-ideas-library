# 022 · Hydrostatic Test Pressure Anomaly Detector

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Jignesh, QA team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Applies a time-series anomaly detection model to hydrostatic pressure curves. Automatically flags subtle pressure drops that are within human visual tolerance but indicate micro-leaks — before the pipe is released. Catches the marginal failures that pass visual inspection but fail in the field.

---

## Implementation Blueprint

### Architecture
```
Hydro-test pressure logger (existing) 
→ Real-time data stream via serial/OPC-UA 
→ Python anomaly detection model (Isolation Forest / LSTM) 
→ PASS / FAIL / BORDERLINE decision 
→ SAP QM update + operator alert
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | Existing hydro-test pressure transducer + data logger | Pressure curve data |
| Data Interface | Serial port / Modbus TCP / OPC-UA | Read pressure logger |
| Anomaly Detection | Python `scikit-learn` Isolation Forest or `PyTorch` LSTM | Detect subtle leaks |
| Real-time Processing | Python service (runs on local PC) | Continuous analysis |
| Decision UI | Simple web dashboard or operator HMI update | Show result |
| SAP Integration | n8n + SAP QM BAPI | Log test result |

### The Problem in Detail
A standard API 5L hydrostatic test holds pressure for a fixed duration (e.g., 10 seconds at test pressure). The human operator looks for visible pressure drop. But:
- Micro-leaks produce <0.1 bar drop in 10 seconds — invisible on analog gauge
- Temperature fluctuations create false "drops" that are not leaks
- Pressure sensor drift causes gradual baseline shift

The ML model learns to distinguish between:
- **Normal** pressure curves (slight thermal drift, machine vibration)
- **Leak signatures** (characteristic exponential decay pattern)
- **Sensor noise** (random fluctuations without trend)

### Data Requirements
- Collect 2,000+ pressure curves from known-good pipes (baseline)
- Collect all historical curves from pipes that were subsequently found leaking (rare — may need to simulate)
- Each curve: time series at ~10Hz sampling, typically 30–60 seconds duration

### Model Approach 1: Isolation Forest (Simpler, Start Here)
```python
from sklearn.ensemble import IsolationForest
import numpy as np

def extract_features(pressure_curve):
    """Extract statistical features from pressure curve"""
    return {
        'mean_rate_of_change': np.mean(np.diff(pressure_curve)),
        'max_drop_in_2s': max_sliding_window_drop(pressure_curve, window=20),  # 20 samples = 2s at 10Hz
        'pressure_variance': np.var(pressure_curve),
        'end_vs_start_ratio': pressure_curve[-1] / pressure_curve[0],
        'anomaly_score': isolation_forest.score_samples([features])
    }

# Train on known-good curves
model = IsolationForest(contamination=0.02)  # Expect ~2% genuine anomalies
model.fit(good_curve_features)
```

### Model Approach 2: LSTM Autoencoder (More Accurate, Phase 2)
Train LSTM to reconstruct normal pressure curves. High reconstruction error = anomaly.
```python
# LSTM Autoencoder detects when a curve deviates from learned "normal" shape
# Threshold reconstruction error above 99th percentile of training set = ANOMALY
```

### Alert Thresholds
| Decision | Condition | Action |
|---|---|---|
| AUTO-PASS | Anomaly score < threshold AND no pressure drop > 0.05 bar | Auto-release in SAP |
| BORDERLINE | Anomaly score between thresholds | Require QA engineer review |
| AUTO-FAIL | Clear pressure drop signature OR score above high threshold | Hold pipe, notify QA |

### Integration with Hydro-Test Machine
Most modern hydro-test benches have:
- RS232/RS485 serial output for data logging
- Some have OPC-UA (if modern)
- Older machines: add a $50 Arduino or Raspberry Pi with pressure transducer to log data

### Real-Time Dashboard (per pipe)
```
HYDRO-TEST LIVE — Pipe HT-2341 [API 5L X65, 20" × 14.3mm]
Test Pressure: 205 bar | Start: 14:32:15

[Real-time pressure graph]
Current: 204.8 bar ↓0.02 bar (normal thermal drift)

AI Assessment: ✅ NORMAL CURVE — No anomaly detected
Estimated result: PASS

[Full Hold duration: 8/10 seconds]
```

### Estimated Build Time
- Data collection from logger: 1 week (need historical data)
- Model training: 1–2 weeks
- Integration and testing: 2 weeks
- Validation against known reject pipes: 2 weeks

### Hardware Cost
- If data logger already exists: Software only (~₹0 hardware)
- If adding new pressure transducer + logger: ~₹15,000–25,000

---

## Related Ideas
- [[021 - X-Ray Weld Defect Detector]] — pairs with this for comprehensive QA automation
- [[029 - Automated RCA Report Generator]] — triggered when FAIL detected
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — self
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — same per-pipe tracking concept
- [[028 - Flux Moisture Contamination Detector]] — prevents defects that this tool detects

---

## Notes
- Begin with 6 months of data collection before building the model — the richer the "normal" dataset, the fewer false positives
- Temperature compensation is critical: ambient temperature changes affect pressure readings significantly; add a temperature sensor alongside the pressure sensor
- Regulatory note: For critical pipelines (sour service, offshore), the AI model decision should augment, not replace, a witnessed test per API 1104
