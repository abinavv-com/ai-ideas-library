# 050 · Thermal Camera Gearbox Monitor

> **Section**: Maintenance & Reliability | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Fixed-position thermal cameras on critical gearboxes capture baseline temperature maps. ML model alerts maintenance when a gearbox runs 8°C above its historical baseline — the early signature of bearing failure that appears 3–6 weeks before audible noise or vibration becomes detectable.

---

## Implementation Blueprint

### Architecture
```
Fixed FLIR Lepton thermal camera on each critical gearbox 
→ Raspberry Pi image capture (every 15 min) 
→ Python: extract hotspot temperatures from ROI 
→ Compare to baseline temperature map 
→ Alert when delta-T > threshold 
→ Trend visualization in Grafana
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera | FLIR Lepton 3.5 (80×60 pixels, ~$200) or FLIR A35 (industrial, ~$3,000) | Thermal imaging |
| Processing | Raspberry Pi 4 + Python `PureThermal` library | Image capture + analysis |
| Baseline | Historical temperature maps stored in SQLite | Comparison reference |
| ML Model | Statistical process control (moving average + sigma limits) | Anomaly detection |
| Protocol | MQTT | Alert transmission |
| Orchestration | n8n | Alert routing |
| Visualization | Grafana with image overlay | Temperature trend display |

### Why Thermal for Gearboxes?
- Bearing failure generates heat before generating vibration or noise
- Temperature anomaly can appear 3–8 weeks before failure
- Non-contact measurement — no sensor on rotating parts
- Single camera covers full gearbox exterior
- Works for sealed, oil-immersed gearboxes where accelerometers can't reach internal bearings

### Target Equipment (Priority List)
1. LSAW forming press main gearbox (high load, high consequence)
2. HSAW strip drive gearbox
3. DI casting machine drive
4. Annealing furnace belt drive gearbox
5. Yard crane hoisting gearboxes

### Camera Setup and Field of View
```
[GEARBOX]
     ↑
  [FLIR Lepton 3.5 camera]
  Fixed mount, 50–100cm distance
  FOV adjusted to cover entire gearbox surface
  Protected enclosure (IP65) with clear IR window
```

### Python Thermal Analysis
```python
from pylepton import Lepton
import numpy as np
import cv2

def capture_and_analyze_gearbox(camera_id, gearbox_id):
    # Capture thermal frame
    with Lepton() as l:
        frame, _ = l.capture()
    
    # Convert to temperature (Lepton 3.5: value = temp_K × 100)
    temp_celsius = frame / 100.0 - 273.15
    
    # Region of Interest (bearing housings are hottest points)
    roi_zones = {
        'input_bearing': temp_celsius[20:40, 30:50],   # Pixel coordinates
        'output_bearing': temp_celsius[20:40, 60:80],
        'oil_sump': temp_celsius[50:70, 40:70],
        'gearbox_body': temp_celsius[30:60, 35:75]
    }
    
    readings = {
        zone: float(np.max(temps))  # Take peak temperature in each zone
        for zone, temps in roi_zones.items()
    }
    
    # Compare to baseline
    baseline = get_baseline(gearbox_id, ambient_temp=get_ambient_temp())
    
    for zone, current_temp in readings.items():
        delta = current_temp - baseline[zone]
        if delta > 8:    # 8°C above baseline
            trigger_alert(gearbox_id, zone, current_temp, baseline[zone], delta)
        elif delta > 5:  # 5°C warning
            log_warning(gearbox_id, zone, delta)
    
    # Store reading for trending
    store_reading(gearbox_id, readings, ambient_temp)
    return readings
```

### Baseline Establishment
Critical: temperature baselines must account for ambient temperature variation.
```python
def get_baseline(gearbox_id, ambient_temp):
    """
    Get the expected temperature for each zone given current ambient temperature.
    Trained on 3+ months of normal operation data.
    """
    # Linear regression: expected temp = baseline_temp + K × ambient_temp
    model = load_temperature_regression_model(gearbox_id)
    predicted = model.predict([[ambient_temp]])
    
    return {
        'input_bearing': predicted[0],
        'output_bearing': predicted[1],
        'oil_sump': predicted[2]
    }
```

### Alert Message with Thermal Image
```
🌡️ THERMAL ANOMALY — LSAW Line 1 Main Gearbox
Alert Time: 2026-06-01 14:45
Zone: Input shaft bearing housing
Current: 72°C | Baseline for 28°C ambient: 58°C | Delta: +14°C ⚠️

Interpretation: Possible bearing lubrication failure or early spalling.
Recommended Action:
1. Check oil level and condition immediately
2. Listen for bearing noise during next inspection
3. Schedule vibration measurement within 48 hours
4. Plan bearing replacement within 2 weeks if delta persists

[Thermal image attached showing hotspot]
Related vibration data: Consult [[046 - Predictive Maintenance Dashboard]]
```

### Grafana Temperature Trend Chart
- 90-day rolling temperature trend per zone
- Baseline ± 2σ control bands shown
- Anomaly events flagged on timeline
- Ambient temperature overlay (to explain seasonal variation)

### Estimated Build Time
- Camera procurement: 2 weeks lead time
- Mechanical mounting + enclosures: 1 week
- Python capture code: 3 days
- Baseline establishment: 4–6 weeks of operation
- Alert system: 2 days

### Hardware Cost Per Gearbox
- FLIR Lepton 3.5 + breakout board: ~$200 (~₹17,000)
- Raspberry Pi 4: ~₹5,000
- IP65 enclosure + IR window: ~₹3,000
- Mounting hardware: ~₹2,000
- Total per gearbox: ~₹27,000
- For 5 gearboxes: ~₹1.35L

---

## Related Ideas
- [[046 - Predictive Maintenance Dashboard]] — vibration monitoring companion
- [[042 - Zinc Spray Nozzle Clog Predictor]] — same MQTT/edge device infrastructure
- [[049 - Overhead Crane Load Cycle Tracker]] — crane gearbox thermal monitoring
- [[048 - SAP PM Order Auto-Scheduler]] — thermal alerts trigger PM work order creation
- [[051 - Maintenance KPI Live Dashboard]] — thermal alert history feeds maintenance metrics

---

## Notes
- Emissivity calibration is crucial for accurate temperature readings: painted/coated surfaces (~0.9 emissivity) vs. bare metal (~0.2) give very different readings. Always calibrate against a reference thermometer.
- The FLIR Lepton 3.5 has only 80×60 resolution — sufficient for identifying which zone is hot, but not for precise diagnosis. The FLIR A35 (320×256) provides more detail for complex machinery.
- Start with one camera on one critical gearbox to establish the process before scaling
