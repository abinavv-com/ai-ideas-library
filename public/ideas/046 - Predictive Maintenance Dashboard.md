# 046 · Predictive Maintenance Dashboard (Sensor-Ready Machines)

> **Section**: Maintenance & Reliability | **Complexity**: 🔵 Month 4–6 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
For the 10–15 machines that already have vibration sensors, streams data to a central ML model that detects bearing degradation, imbalance, and misalignment 2–4 weeks before failure — auto-raising SAP PM work orders before the machine breaks down.

---

## Implementation Blueprint

### Architecture
```
Existing vibration sensors on machines 
→ OPC-UA / MQTT data collection 
→ Python ML pipeline (feature extraction + anomaly detection) 
→ Severity scoring (Normal / Warning / Critical) 
→ Auto-SAP PM work order creation 
→ Grafana trending dashboard
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensors | Existing vibration sensors (check spec) + add SKF CMSS 2200 if needed | Vibration data |
| Protocol | OPC-UA (preferred) or Modbus/MQTT | Data transport |
| Processing | Python `scipy.fft` + `scikit-learn` | Vibration signal analysis |
| ML Models | Isolation Forest + LSTM Autoencoder | Anomaly detection |
| Time-Series DB | InfluxDB | Store vibration time series |
| Dashboard | Grafana | Visualization |
| SAP Integration | n8n + SAP PM BAPI | Auto-create work orders |

### Vibration Analysis Features
```python
import numpy as np
from scipy.fft import fft, fftfreq
from scipy.signal import welch

def extract_vibration_features(time_series, sample_rate_hz=1000):
    """Extract condition-monitoring features from vibration signal"""
    
    # Time domain features
    rms = np.sqrt(np.mean(time_series**2))          # Overall vibration level
    peak = np.max(np.abs(time_series))               # Peak amplitude
    crest_factor = peak / rms                        # High CF = impulsive defect
    kurtosis = scipy.stats.kurtosis(time_series)    # High kurtosis = bearing defect
    
    # Frequency domain features (FFT)
    freqs, psd = welch(time_series, fs=sample_rate_hz, nperseg=1024)
    
    # ISO 10816 frequency bands
    band_1_10_hz = np.mean(psd[(freqs >= 1) & (freqs <= 10)])
    band_10_100_hz = np.mean(psd[(freqs >= 10) & (freqs <= 100)])
    band_100_1000_hz = np.mean(psd[(freqs >= 100) & (freqs <= 1000)])
    
    # Bearing defect frequencies (calculated from bearing geometry)
    # BPFO (Ball Pass Frequency Outer): 4.94 × shaft RPM / 60
    # BPFI (Ball Pass Frequency Inner): 6.45 × shaft RPM / 60
    bearing_bpfo_energy = get_frequency_band_energy(psd, freqs, bpfo, bandwidth=5)
    bearing_bpfi_energy = get_frequency_band_energy(psd, freqs, bpfi, bandwidth=5)
    
    return {
        'rms_mm_s': rms, 'crest_factor': crest_factor, 'kurtosis': kurtosis,
        'band_1_10': band_1_10_hz, 'band_10_100': band_10_100_hz,
        'band_100_1000': band_100_1000_hz,
        'bearing_bpfo': bearing_bpfo_energy, 'bearing_bpfi': bearing_bpfi_energy
    }
```

### ISO 10816 Severity Zones
| Zone | RMS mm/s | Condition | Action |
|---|---|---|---|
| A | 0–2.3 | New/excellent | None |
| B | 2.3–4.5 | Good/acceptable | Monitor |
| C | 4.5–7.1 | Warning | Schedule maintenance |
| D | >7.1 | Danger | Immediate action |

*Note: These are generic values; specific machinery limits from OEM documentation*

### Machine Priority List
Start with highest-consequence machines:
1. LSAW pipe forming press main drives
2. HSAW strip drive and entry straightener
3. DI casting machine main drives
4. Annealing furnace conveyor belt drive
5. Shot blast turbine motors
6. Coating line main drives

### Anomaly Detection Model
```python
from sklearn.ensemble import IsolationForest

# Train on 3+ months of "normal" operation data
baseline_features = collect_features(months=3)

model = IsolationForest(
    n_estimators=200,
    contamination=0.01,  # Expect ~1% genuine anomalies
    random_state=42
)
model.fit(baseline_features)

# Real-time scoring
def score_current_state(current_features):
    score = model.score_samples([current_features])[0]
    # More negative = more anomalous
    if score < -0.20: return 'CRITICAL'
    if score < -0.10: return 'WARNING'
    return 'NORMAL'
```

### SAP PM Auto-Work Order
When severity → WARNING:
```python
def create_pm_work_order(machine_id, anomaly_details):
    sap_bapi_call('BAPI_ORDER_CREATE', {
        'PM_ORDER_TYPE': 'PM01',
        'FUNCTIONAL_LOC': machine_id,
        'SHORT_TEXT': f"AI Predictive Alert: {anomaly_details['type']} detected",
        'PRIORITY': '2',  # High priority
        'START_DATE': today + timedelta(days=7),  # Schedule within 1 week
        'DESCRIPTION': generate_maintenance_description(anomaly_details)
    })
```

### Grafana Dashboard — Machine Health Scorecard
- Each machine: green/yellow/red health indicator
- RMS trend over 90 days (showing degradation curve)
- Frequency spectrum (waterfall plot)
- Anomaly score over time
- Predicted days to maintenance threshold

### Estimated Build Time
- OPC-UA/MQTT connection for 10 machines: 3–4 weeks
- Feature extraction pipeline: 1 week
- ML model training: 2 weeks (after 3 months of baseline data collection)
- Dashboard: 1 week

### Cost
- InfluxDB: Free (open source)
- Grafana: Free (open source)
- Python ML libraries: Free
- Additional vibration sensors (if needed): ~₹8,000–15,000 each (SKF CMSS 2200)

---

## Related Ideas
- [[050 - Thermal Camera Gearbox Monitor]] — thermal anomaly detection companion
- [[048 - SAP PM Order Auto-Scheduler]] — uses this model's output to schedule PM
- [[054 - Machine Breakdown RCA Knowledge Base]] — when breakdowns occur anyway
- [[028 - Flux Moisture Contamination Detector]] — same IoT/MQTT infrastructure
- [[037 - HSAW Strip Tension Auto-Controller]] — HSAW strip drive monitored here

---

## Notes
- Start with "condition monitoring" (trend visualization) before building ML — the trends themselves are valuable and build confidence in the data
- Document each machine's "normal" vibration fingerprint (baseline) before any model training — this is the most important step
- For machines without existing sensors, cost-justify sensor installation using: (frequency of past failures × repair cost × downtime cost) vs. sensor cost
