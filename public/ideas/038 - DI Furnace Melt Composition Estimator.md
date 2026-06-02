# 038 · DI Furnace Melt Composition Real-Time Estimator

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: DI pipe hot zone team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Trains an ML model on the relationship between furnace settings, scrap input mix, and final chemical composition — predicting composition at tapping before the 20-minute spectrometer result arrives. Allows early adjustment, reducing out-of-spec heats and the scrap-and-remelt cost (typically ₹20–30L per off-spec heat).

---

## Implementation Blueprint

### Architecture
```
Furnace operating data (charge mix, power input, temperature, time) 
→ Historical melt records (final OES spectrometer results) 
→ Random Forest / XGBoost regression model 
→ Real-time prediction at tapping 
→ Corrective action recommendation (add alloy additions)
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Input Data | PLC/SCADA furnace data + manual charge records | Process parameters |
| Model | Python scikit-learn (Random Forest) | Composition prediction |
| Deployment | Python service on control room PC | Real-time prediction |
| Integration | OPC-UA read from furnace SCADA | Live furnace data |
| Output | Control room display + Teams alert | Operator guidance |

### DI Pipe Composition Requirements (Typical)
```python
di_pipe_spec = {
    # ISO 2531 Ductile Iron K9/K12
    "carbon_range": (3.5, 3.8),    # % — crucial for graphite morphology
    "silicon_range": (1.8, 2.6),   # % — controls graphite size and matrix
    "manganese_range": (0.15, 0.5),
    "phosphorus_max": 0.06,
    "sulfur_max": 0.02,
    "magnesium_range": (0.03, 0.06), # Key for ductility — spheroidization
    "carbon_equivalent": (4.2, 4.6)  # CE = C + Si/4 + P/2
}
```

### Key Challenge: Mg Treatment
The critical variable in DI production is magnesium (Mg) treatment to convert graphite from flake (grey iron) to spheroidal (ductile iron). Mg is volatile, burns off rapidly — predicting the residual Mg after treatment is the core ML problem.

### Training Data Schema
```python
heat_record = {
    # Charge inputs
    "scrap_grade_mix": {"HMS1": 60, "cast_returns": 30, "pig_iron": 10},  # % by weight
    "scrap_total_kg": 8500,
    "pig_iron_kg": 850,
    "charge_si_wt_pct": 1.4,   # Pre-charge silicon content
    "charge_mn_wt_pct": 0.3,
    "coke_charge_kg": 120,      # For cupola; electric furnace differs
    
    # Furnace parameters
    "power_input_kWh": 4200,
    "furnace_temperature_tap_C": 1480,
    "tap_weight_kg": 8800,
    "holding_time_min": 45,
    
    # Mg treatment
    "mg_alloy_type": "FeSiMg6",
    "mg_alloy_kg": 32,
    "mg_treatment_temperature_C": 1460,
    "treatment_duration_sec": 180,
    
    # Target (what we want to predict)
    "final_composition_OES": {
        "C": 3.65, "Si": 2.1, "Mn": 0.25, "P": 0.04, "S": 0.01, "Mg": 0.045
    },
    "graphite_morphology": "V" # Type V (spheroidal) = target; Type I-III = off-spec
}
```

### Model Predictions
```python
# Multi-output regression: predict all elements simultaneously
from sklearn.multioutput import MultiOutputRegressor
from sklearn.ensemble import RandomForestRegressor

# Features: charge mix + furnace params + Mg treatment
X = build_feature_matrix(heat_records)

# Targets: final composition of each element
y = extract_composition_targets(heat_records)

model = MultiOutputRegressor(RandomForestRegressor(n_estimators=200))
model.fit(X_train, y_train)

# At tapping time:
current_heat_features = get_current_heat_features()
predicted_composition = model.predict([current_heat_features])[0]
```

### Control Room Display
```
DI FURNACE — HEAT PREDICTION (Real-Time)
Heat #: EF-2026-0421 | Predicted tap time: 14:35

PREDICTED COMPOSITION (±0.05% accuracy):
Element | Predicted | Spec Min | Spec Max | Status
C       | 3.68%     | 3.50%    | 3.80%    | ✅ OK
Si      | 2.14%     | 1.80%    | 2.60%    | ✅ OK
Mn      | 0.28%     | 0.15%    | 0.50%    | ✅ OK
Mg      | 0.038%    | 0.030%   | 0.060%   | ⚠️ LOW — consider +2kg FeSiMg6

Recommended Action: Add 2.5kg FeSiMg6 before tapping.
CE: 4.41% (target 4.2–4.6%) ✅

Confidence: 87% | OES result due in ~18 min
```

### Estimated Build Time
- Historical data extraction and cleaning: 2–3 weeks
- Model training: 1 week
- Control room integration: 2 weeks
- Validation against 50 live heats: 4–6 weeks

### Cost
- Software: Free open source
- Hardware: Existing furnace instrumentation
- ROI: Preventing one off-spec heat per month × ₹25L rework cost = ₹300L/year potential

---

## Related Ideas
- [[039 - Annealing Furnace Belt Speed Optimizer]] — downstream process optimization
- [[062 - Scrap Steel Gate Classifier]] — scrap quality classification at intake
- [[036 - LSAW Forming Press Spring-Back Predictor]] — ML process optimization sister project
- [[046 - Predictive Maintenance Dashboard]] — furnace equipment health monitoring
- [[028 - Flux Moisture Contamination Detector]] — similar IoT sensor + alert pattern

---

## Notes
- Data quality is the key challenge: charge records need to be accurate and digitized — many foundries still record these by hand. Fix data capture first.
- The Mg treatment prediction is especially sensitive to scrap sulfur content (S burns off Mg). Track S content of each scrap batch carefully.
- Model accuracy degrades when switching to new scrap suppliers — retrain quarterly or when major scrap source changes
