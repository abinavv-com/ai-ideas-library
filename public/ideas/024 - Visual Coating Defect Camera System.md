# 024 · Visual Coating Defect Camera System

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Jignesh, QA team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Installs a ring of LED-illuminated cameras at the coating line exit. Vision model detects bubbles, scratches, bare spots, and uneven PE/PP coating thickness before end-cap is applied — creating a 100% visual inspection record for every pipe at throughput speed.

---

## Implementation Blueprint

### Architecture
```
Ring of 4–6 industrial cameras at coating line exit 
→ High-throughput image capture (triggered by pipe presence sensor) 
→ YOLOv8 / DeepLabV3 segmentation model (edge GPU) 
→ Defect detected → Line stop signal + annotated image record 
→ Per-pipe inspection record in SAP QM
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Cameras | Basler ace2 or Cognex IS2000 industrial cameras (4–6 units) | Full circumference coverage |
| Lighting | LED ring lights or line lights (strobed) | Consistent illumination |
| Trigger | Photoelectric sensor (pipe presence) | Capture at right moment |
| Edge GPU | NVIDIA Jetson AGX Orin or RTX workstation | Real-time inference |
| Vision Model | YOLOv8 (detection) + optional DeepLabV3 (segmentation) | Defect identification |
| HMI | Industrial monitor at station | Operator view |
| SAP Integration | n8n + SAP QM | Log inspection results |

### Camera Ring Configuration
For a 24" (610mm) pipe:
```
              Camera 1 (top)
         ┌──────────────────┐
Camera 4 │  [PIPE CROSS      │ Camera 2
(left)   │   SECTION]       │ (right)
         └──────────────────┘
              Camera 3 (bottom)

Optional Camera 5,6: 45° diagonal for weld zone coverage
```
Each camera covers a ~110° arc with overlap — full 360° coverage.

### Defect Classes to Train
| Defect | Visual Signature | Acceptance Criterion (API) |
|---|---|---|
| Bubble/blister | Raised dome in PE/PP | Reject if >4mm diameter |
| Scratch | Linear groove | Reject if depth > 50% of coating |
| Bare spot / holiday | Shiny metallic area | Reject any bare spot |
| Peel/delamination | Coating edge lifting | Reject |
| Color variation | Discoloration | Warning — check thickness |
| Drip/sag | Thick coating drip | Warning — thickness check |
| Pipe end bare zone | Expected bare area for field welding | Normal — pre-defined exclude zone |

### Training Data Strategy
1. **Install cameras first** — capture 2–3 weeks of production images before labelling
2. **Defect simulation**: introduce controlled defects on test pipes (scratches with different tools, simulated bare spots)
3. **Label with Roboflow** (free tier supports up to 10,000 images): bounding box each defect
4. **Target**: 200+ examples per defect class; augment to 2,000+

### Model Pipeline
```python
# Real-time inference
from ultralytics import YOLO
import cv2

model = YOLO('welspun_coating_v1.pt')

def inspect_pipe(camera_frames):
    """camera_frames: list of 4-6 images from ring cameras"""
    all_detections = []
    for i, frame in enumerate(camera_frames):
        results = model(frame, conf=0.6)
        for det in results[0].boxes:
            all_detections.append({
                'camera': i,
                'defect_type': model.names[int(det.cls)],
                'confidence': float(det.conf),
                'bbox': det.xyxy[0].tolist(),
                'area_mm2': calculate_area_mm2(det, camera_calibration[i])
            })
    return all_detections
```

### Per-Pipe Inspection Record
```json
{
  "pipe_id": "HT-2341-P042",
  "inspection_timestamp": "2026-06-01T14:32:15",
  "inspection_result": "PASS_WITH_WARNINGS",
  "defects_found": [
    {
      "type": "color_variation",
      "location": "camera_2, position 420mm from pipe end",
      "confidence": 0.73,
      "severity": "WARNING",
      "action": "Manual thickness measurement required"
    }
  ],
  "images_archived": "SharePoint/CoatingQA/2026-06/HT-2341-P042/",
  "inspector_override": null
}
```

### Calibration Requirements
- Camera calibration (intrinsic/extrinsic parameters) using calibration board
- Pixel-to-mm mapping for each camera (for area calculations)
- Lighting uniformity check weekly — LED aging affects consistency
- Model performance check monthly against manual inspection

### Estimated Build Time
- Hardware installation: 1 week (camera mounting, lighting, trigger sensor)
- Data collection: 2–3 weeks (production images)
- Labelling: 2–3 weeks
- Model training: 1 week
- Integration + validation: 3–4 weeks

### Hardware Cost
- 4× Basler ace2 cameras: ~$1,200 USD (~₹1L)
- LED ring lights: ~₹30,000
- Edge GPU (Jetson AGX Orin): ~₹55,000
- Mounting hardware + cabling: ~₹20,000
- Total: ~₹2L–2.5L

---

## Related Ideas
- [[023 - Coating Holiday False-Positive Filter]] — electrical holiday detection companion
- [[024 - Visual Coating Defect Camera System]] — self
- [[031 - Surface Rust Severity Classifier]] — upstream: surface condition before coating
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — blast profile impacts coating adhesion
- [[078 - Coating Sling Damage Camera]] — detects post-coating sling damage in yard

---

## Notes
- Specular reflection from shiny PE/PP coatings is a major challenge — use polarized lighting or line lights at oblique angles to reduce glare
- The pipe end bare zones (200–400mm for field welding) must be excluded from defect detection — program camera FOV masks accordingly
- Validation challenge: visual defects that look concerning but don't affect performance need to be handled carefully to avoid over-rejection
