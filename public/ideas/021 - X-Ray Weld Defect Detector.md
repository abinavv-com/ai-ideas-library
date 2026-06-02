# 021 · X-Ray Weld Defect Detector (Edge AI)

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety, 💰 Cost Savings
> **Helps**: Jignesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
A computer vision model (YOLOv8) processes pipe X-ray images in real-time on a local edge GPU. Flags porosity, cracks, slag inclusions, and lack-of-fusion with bounding boxes and probability scores — human inspector confirms flagged images only. Speeds up inspection and catches subtle defects human reviewers miss under fatigue.

---

## Implementation Blueprint

### Architecture
```
X-ray machine digital output (DICOM/TIFF files) 
→ Edge GPU server (NVIDIA Jetson or workstation GPU) 
→ YOLOv8 defect detection model (real-time inference) 
→ Annotated image with bounding boxes 
→ Inspector confirmation interface 
→ SAP QM defect log
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Edge Hardware | NVIDIA Jetson AGX Orin (or RTX 3060 workstation) | Local GPU inference |
| Model | YOLOv8 (Ultralytics) | Object detection for defects |
| Training Data | Welspun's historical X-ray defect archive | Domain-specific training |
| Inference API | Python FastAPI + YOLOv8 | Real-time image processing |
| Inspector UI | React/Flask web app on local network | Review flagged images |
| SAP Integration | n8n + SAP QM BAPI | Log defect findings |
| Image Format | DICOM → PNG/TIFF conversion | Standard X-ray format |

### Defect Classes to Detect
Train the model to identify these API 1104 / EN ISO 10675 defect types:
1. **Porosity** (gas pores — round dark spots)
2. **Slag inclusions** (elongated dark streaks)
3. **Lack of fusion** (linear dark lines at weld edges)
4. **Cracks** (fine linear indications)
5. **Undercut** (dark band along weld toe)
6. **Burn-through** (large dark circular area)
7. **Overlap** (lighter, irregular area)

### Training Data Requirements
- Minimum 500–1,000 labelled X-ray images per defect class for acceptable performance
- Welspun likely has years of archived X-ray films — digitize these first
- Use **Label Studio** (free, self-hosted) for annotation team to label historical images
- Augment dataset with synthetic variations (rotation, brightness, noise) to expand to 5,000+ images

### Model Training Pipeline
```bash
# Install Ultralytics YOLOv8
pip install ultralytics

# Train on Welspun X-ray dataset
yolo detect train \
  data=welspun_xray.yaml \
  model=yolov8m.pt \  # medium model, good accuracy/speed balance
  epochs=100 \
  imgsz=1280 \  # high resolution for small defects
  batch=8 \
  device=0  # GPU
```

### Model Performance Targets (Before Production Deployment)
- **Sensitivity (Recall)**: >95% — must not miss real defects
- **Precision**: >80% — acceptable false positive rate (inspector reviews flags)
- **Inference time**: <500ms per image
- **Validate against API 1104 acceptance criteria**: model flags must align with human-rejectable indications

### Inspector Review UI
```
[X-RAY INSPECTION STATION]
Image: pipe_XR_2026-06-01_HT2341_weld_001.tiff

AI Detection Results:
┌──────────────────────────────────────┐
│ [Annotated X-ray image with boxes]   │
│ 🔴 POROSITY — 94% confidence         │
│    Location: 45-47mm from start      │
│    Size: 2.3mm cluster               │
│                                      │
│ 🟡 POSSIBLE SLAG — 61% confidence    │
│    Location: 82mm                    │
└──────────────────────────────────────┘

Inspector Decision: [REJECT] [ACCEPT] [BORDERLINE → SENIOR REVIEW]
Inspector ID: [badge scan]
```

### Phased Deployment
**Phase 1** (Month 2–3): Run model in "shadow mode" — AI flags images but inspector makes ALL decisions. Compare AI vs. inspector to calibrate.
**Phase 2** (Month 4–6): AI pre-sorts: clear passes auto-released, flagged images reviewed by inspector.
**Phase 3** (Month 6+): AI handles routine inspection; complex or borderline cases escalated.

### Estimated Build Time
- Data labelling: 3–4 weeks (if archival X-rays available)
- Model training: 1 week (with GPU)
- UI + integration: 1–2 weeks
- Shadow mode validation: 4–6 weeks

### Hardware Cost
- NVIDIA Jetson AGX Orin: ~$650 USD
- Alternative: RTX 3060 workstation card in existing PC: ~₹35,000
- X-ray digitizer (if still using film): ~$5,000–15,000 (or rent)

---

## Related Ideas
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — pairs with this for full QA automation
- [[097 - GAN Synthetic X-Ray Training Dataset]] — generates synthetic training data for this model
- [[033 - NDT Inspector Fatigue Warning System]] — monitors the inspectors who review AI flags
- [[029 - Automated RCA Report Generator]] — when defects are found, RCA is auto-triggered
- [[027 - Welding Operator Defect Correlation Tracker]] — links defects back to operators

---

## Notes
- X-ray images contain sensitive quality data — keep all processing on-premise; do not upload to cloud
- Regulatory note: in some jurisdictions, AI-assisted NDT requires documented validation before it can replace human review — check API 1104 Annex C requirements
- Consider partnering with an NDT technology provider (Olympus, GE Inspection) who may have pre-trained models for pipe X-rays
