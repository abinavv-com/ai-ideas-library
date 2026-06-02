# 023 · Coating Holiday False-Positive Filter

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Jignesh, coating line operators | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Trains a secondary ML model on the coating line holiday detector's alarm history. Learns which alarm patterns are genuine defects vs. sensor noise — suppressing false positives by 60–80% and dramatically reducing alarm fatigue that causes operators to ignore real defects.

---

## Implementation Blueprint

### Architecture
```
Holiday detector alarm log (historical) 
→ Human-labelled: genuine defect vs. false positive 
→ Train binary classifier (Random Forest / XGBoost) 
→ Deployed inline: all alarms pass through classifier 
→ Genuine alarms → stop line + operator alert 
→ Probable false positives → flagged for end-of-pipe review only
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | Holiday detector alarm log + operator override history | Training data |
| Labelling | Manual review of historical alarms | Ground truth |
| Model | Python `scikit-learn` XGBoost or Random Forest | Binary classifier |
| Deployment | Python service on coating line PC | Real-time inference |
| Interface | Simple HMI display update or LED indicator | Operator feedback |

### Understanding Coating Holiday Detectors
Holiday detectors (e.g., Elcometer 266, CathoGuard) work by passing high-voltage probe over the pipe:
- **Genuine holiday**: Bare metal spot in coating → arc discharge → alarm
- **False positive causes**: 
  - Pipe-to-ground contact variation (pipe lifting/settling on rollers)
  - Moisture on pipe surface (especially after water bath cooling)
  - Conductive dust on pipe exterior
  - Sensor grounding issues
  - Coating thickness variation at pipe ends (bevels)
  - Static electricity on dry days

### Features to Extract from Alarm Log
```python
alarm_features = {
    # Temporal
    'time_since_last_alarm_sec': 0,
    'alarms_in_last_60_sec': 0,
    'alarm_duration_ms': 0,
    
    # Position on pipe
    'distance_from_pipe_end_mm': 0,  # End alarms are often false positives
    'angular_position_degrees': 0,   # 0-360 around pipe circumference
    
    # Environmental
    'ambient_humidity_pct': 0,       # High humidity → more false positives
    'pipe_surface_temp_celsius': 0,   # Thermal gradient affects adhesion
    
    # Detector settings
    'test_voltage_V': 0,
    'pipe_diameter_mm': 0,
    'coating_thickness_measured_mm': 0,
    
    # Alarm characteristics
    'signal_amplitude': 0,           # Strong signal = more likely genuine
    'signal_duration_ms': 0,         # Long signal = more likely genuine
    
    # Label (for training only)
    'is_genuine_defect': None        # 1 = genuine, 0 = false positive
}
```

### Labelling Historical Data
Work with Jignesh to review 6 months of alarm history:
- Pull all alarms that triggered a line stop
- For each: check if the subsequent manual inspection found a real holiday
- Label as 1 (genuine) or 0 (false positive)
- Target: 500+ labelled examples minimum

### Model Training
```python
from xgboost import XGBClassifier
from sklearn.metrics import precision_recall_curve

# Train with class imbalance handling (false positives likely 5-10x more common)
model = XGBClassifier(scale_pos_weight=7, max_depth=6, n_estimators=200)
model.fit(X_train, y_train)

# Tune threshold for high recall (never miss real defects)
# Accept some false positives to maintain operator trust
precision, recall, thresholds = precision_recall_curve(y_val, model.predict_proba(X_val)[:,1])
# Choose threshold where recall >= 99% (never miss a real defect)
```

### Deployment Logic
```
Alarm fires → Run classifier in 50ms → 
  If P(genuine) > 0.8: STOP LINE + INSPECTOR ALERT (red light)
  If P(genuine) 0.3–0.8: MARK POSITION + continue + inspect at pipe end
  If P(genuine) < 0.3: LOG ONLY + continue (probable false positive)
```

### Expected Impact
- Current false positive rate in similar plants: ~70% of all alarms
- Suppressing 60% of false positives → line stops reduce from ~10/pipe to ~4/pipe
- Operator trust in alarms increases → genuine defects are taken more seriously
- Throughput on coating line improves

### Estimated Build Time
- Data labelling: 2–3 weeks (Jignesh + operator team effort)
- Model training: 1 week
- Integration: 2 weeks
- Validation: 4 weeks (run parallel with existing system)

### Cost
- Software: Free open source
- Hardware: Existing PC on coating line
- Total: Staff time for data labelling + 2–3 days developer time

---

## Related Ideas
- [[024 - Visual Coating Defect Camera System]] — companion visual inspection system
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — pre-coating quality that affects holiday rates
- [[031 - Surface Rust Severity Classifier]] — upstream: surface condition before coating
- [[028 - Flux Moisture Contamination Detector]] — similar sensor noise vs. real defect problem
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — same pattern: ML to reduce false alarms

---

## Notes
- Never set the classifier to suppress alarms automatically for the first 6 months — run in "flag only" mode and build operator trust
- Create a weekly dashboard showing: alarms per pipe, false positive rate, real defect rate — make the improvement visible to operators
- The pipe end zones (first/last 300mm) have inherently higher false positive rates — build this as a spatial feature in the model
