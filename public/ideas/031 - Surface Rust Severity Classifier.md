# 031 · Surface Rust Severity Classifier

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Coating line supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Camera-based AI classifies incoming steel plates by surface rust severity grade (A, B, C, D per ISO 8501-1) before shot blasting — routing plates needing extra blasting cycles and preventing coating adhesion failures caused by insufficient surface preparation.

---

## Implementation Blueprint

### Architecture
```
Steel plate/pipe entering blast cabin 
→ Industrial camera captures steel surface image 
→ YOLOv8 classification model (ISO 8501-1 grades A/B/C/D) 
→ Route to: standard blast / extra blast cycle / hold for engineering review 
→ Log surface condition per plate/pipe record
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera | Industrial area scan camera (Basler ace2 or Cognex) | Capture surface images |
| Lighting | Diffuse LED panel lighting (avoid shadows) | Even illumination |
| Model | YOLOv8 or EfficientNet-B4 image classifier | ISO 8501-1 grade classification |
| Edge Processing | Jetson AGX Orin (reuse from [[021 - X-Ray Weld Defect Detector]]) | Local inference |
| Integration | n8n + blast cabin PLC | Route blast cycle |

### ISO 8501-1 Rust Grades
| Grade | Description | Visual |
|---|---|---|
| A | Steel covered entirely with mill scale, little or no rust | Black/dark blue surface |
| B | Steel beginning to rust; mill scale beginning to flake | Mixed scale + rust spots |
| C | Steel with rust; mill scale rusted through and some pitting | Orange-brown, no scale |
| D | Steel with general pitting from rust | Heavy rust, visible pitting |

**For 3LPE/3LPP coating (SA 2.5 minimum blast standard)**:
- Grade A: Standard blast (one pass) may achieve SA 2.5
- Grade B: Standard blast — check profile after
- Grade C: Two blast passes recommended
- Grade D: Three passes + engineering review before coating

### Training Data
ISO 8501-1 is a well-established standard with published reference photographs. Use these as training data:
1. Download the official ISO 8501-1 reference photos (available commercially)
2. Collect 200+ real photos from Welspun's incoming steel under controlled lighting
3. Label with the ISO grade that was assigned by the quality inspector
4. Augment: brightness variation, camera angle, different lighting conditions

### Model Architecture
```python
from ultralytics import YOLO

# For classification (not detection), use EfficientNet variant
# YOLOv8 also has a classify mode
model = YOLO('yolov8m-cls.pt')  # Classification mode

# Or use torchvision EfficientNet for higher accuracy
from torchvision.models import efficientnet_b4
model = efficientnet_b4(weights='DEFAULT')
model.classifier[-1] = nn.Linear(1792, 4)  # 4 classes: A, B, C, D
```

### Output + Blast Cabin Integration
```python
blast_cycles = {
    'A': 1,  # Single pass
    'B': 1,  # Single pass + check
    'C': 2,  # Double pass
    'D': 3   # Triple pass + engineering hold
}

def route_blast(classification):
    grade = classification['predicted_grade']
    confidence = classification['confidence']
    
    if confidence < 0.70:
        return 'MANUAL_REVIEW'  # Low confidence → inspector decides
    
    cycles = blast_cycles[grade]
    
    if grade == 'D':
        # Create SAP engineering hold
        sap_create_hold(reason=f"Heavy pitting (Grade D rust) — engineering review required")
    
    # Signal to blast cabin PLC (via Modbus or digital output relay)
    set_blast_cycles(cycles)
    return f"Grade {grade}: {cycles} blast cycle(s)"
```

### Correlation with Coating Adhesion Results
Track: `surface_grade_pre_blast` → `roughness_profile_post_blast` → `coating_adhesion_test_result`
This builds evidence for whether the routing thresholds are correctly set.

### Estimated Build Time
- Camera + lighting installation: 2–3 days
- Training data collection + labelling: 2 weeks
- Model training: 3–5 days
- PLC integration for blast cycle routing: 1 week (requires controls engineer)

### Hardware Cost
- Industrial camera: ₹80,000–1.5L depending on model
- LED panel lighting: ₹15,000
- Mounting hardware: ₹10,000
- Reuse existing Jetson GPU from [[021 - X-Ray Weld Defect Detector]]
- Total: ~₹1–1.8L

---

## Related Ideas
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — measures the OUTPUT of blasting; this classifies the INPUT
- [[024 - Visual Coating Defect Camera System]] — downstream quality check after coating
- [[023 - Coating Holiday False-Positive Filter]] — holiday rates correlated with blast quality
- [[021 - X-Ray Weld Defect Detector]] — shares GPU infrastructure
- [[025 - Bevel Angle Pipe Geometry Vision Auditor]] — part of the same vision system rollout

---

## Notes
- The ISO 8501-1 rust grades are visual standards that even experienced inspectors find difficult to agree on — the model's advantage is consistency, not perfection
- Seasonal variation matters: steel stored outdoors for long periods (monsoon) shows rapid grade C/D progression — track storage duration as an additional routing factor
- For DI pipes (different material, different corrosion behavior), ISO 8501-1 may need adaptation — validate separately
