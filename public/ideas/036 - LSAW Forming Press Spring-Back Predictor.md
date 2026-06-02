# 036 · LSAW Forming Press Spring-Back Predictor

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: 💰 Cost Savings
> **Helps**: LSAW line supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Reads incoming plate thickness, yield strength (from MTC), and temperature — predicts the optimal JCOE press forming radius to minimize spring-back. Reduces rounding rework and forming cycle time on the LSAW line by getting the first-pass radius right.

---

## Implementation Blueprint

### Architecture
```
Plate MTC data (yield strength, thickness) 
+ Press sensor data (temperature, press force) 
→ XGBoost regression model (trained on historical forming data) 
→ Predicted optimal forming radius 
→ Displayed on press operator HMI + logged to SAP
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Input Data | SAP MM (MTC data) + press PLC sensors | Plate properties + conditions |
| Model | Python XGBoost regression | Spring-back prediction |
| Deployment | Python service on press control room PC | Real-time prediction |
| HMI Integration | OPC-UA write or manual display | Show recommended radius to operator |
| Training | Historical press forming records + outcome measurements | Model training |

### The Physics (Why Spring-Back Happens)
When a steel plate is pressed to a radius R, after releasing the press:
- The plate springs back to a larger radius R' > R
- Spring-back magnitude depends on: yield strength (σy), plate thickness (t), elastic modulus (E)
- Simplified formula: ΔR/R = σy / (3E × t) [varies with actual geometry]
- Higher strength steel (X70, X80) springs back more than lower strength (X52, X60)
- Temperature affects yield strength: hot plate springs back less

### Training Data Required
```python
training_data = {
    # Inputs (features)
    "plate_yield_strength_MPa": [...],  # From MTC via SAP
    "plate_actual_thickness_mm": [...], # From MTC
    "plate_width_mm": [...],           # From SAP production order
    "ambient_temperature_C": [...],    # Weather/shop sensor
    "press_stroke_mm": [...],          # From press encoder
    "forming_stage": [...],            # J, C, O, or E in JCOE sequence
    
    # Target (what we want to predict)
    "spring_back_mm": [...],           # Measured after each press stroke
    "final_radius_achieved_mm": [...]  # End-of-sequence measurement
}
```
Minimum 500 data points per pipe size group (20", 24", 30", 36") needed.

### Collecting Training Data
If spring-back is not currently measured per plate:
1. Add a laser profilometer measurement after each press sequence (5-minute measurement)
2. Log for 2–3 months across different steel heats
3. Also record: number of rework passes required, final OD achieved vs. target

### XGBoost Model
```python
from xgboost import XGBRegressor
from sklearn.model_selection import cross_val_score

features = ['yield_strength', 'thickness', 'plate_width', 'temperature', 'forming_stage']
target = 'spring_back_mm'

model = XGBRegressor(n_estimators=200, max_depth=6, learning_rate=0.05)
model.fit(X_train, y_train)

# Cross-validation RMSE target: < 2mm
scores = cross_val_score(model, X_val, y_val, cv=5, scoring='neg_root_mean_squared_error')
```

### HMI Output to Press Operator
```
JCOE FORMING ASSISTANT
Pipe: 20" × 14.3mm | Grade: X65 | Heat: 2024H-45221

Plate Properties:
  Yield Strength: 486 MPa | Thickness: 14.3mm | Temp: 28°C

Recommended Press Settings:
  J-pass radius: 312mm (instead of standard 320mm)
  C-pass radius: 308mm
  Predicted spring-back: +8.2mm ± 1.5mm

[Predicted to achieve target OD of 508.0mm ± 0.4mm in standard sequence]
[Apply recommended settings] [Use standard settings] [Override manually]

Note: This is a recommendation. Operator judgment takes precedence.
```

### Rework Reduction Expected
- Current: ~15% of plates require 1 additional press pass due to spring-back
- Target: Reduce additional passes by 60–70% → save 2–3 production hours/day on LSAW line

### Estimated Build Time
- Data collection: 2–3 months (concurrent with production)
- Model training + validation: 2 weeks
- HMI integration: 2 weeks
- Operator training: 1 day

### Cost
- Software: Free
- Data collection (laser profilometer if not existing): ~₹2L
- ROI: Each saved press cycle = ~15 min machine time + operator time

---

## Related Ideas
- [[037 - HSAW Strip Tension Auto-Controller]] — similar ML-driven process optimization
- [[039 - Annealing Furnace Belt Speed Optimizer]] — ML optimization for different process
- [[020 - Pipe Cut-Length Optimizer]] — cutting optimization upstream of forming
- [[040 - Production OEE Live Dashboard]] — tracks OEE improvement from this tool
- [[027 - Welding Operator Defect Correlation Tracker]] — forming quality affects weld quality

---

## Notes
- Start with a single pipe size group (e.g., 20") to prove the model, then expand
- The JCOE press controller may have proprietary PLC — check if OPC-UA or Modbus read/write is available before planning HMI integration
- Model must be retrained when switching to a new steel grade group (e.g., adding X80 supply from a new mill)
