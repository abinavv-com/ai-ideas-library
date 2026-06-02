# 078 · Coating Sling Damage Camera

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety, 💰
> **Helps**: MA Forbush, QA | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Camera positioned to view crane sling contact points on pipe exterior. Vision model detects coating scuff or gouge marks caused by slings — automatically flagging that pipe for a post-lift coating repair check before it goes to a customer shipment.

---

## Implementation Blueprint

### Architecture
```
Fixed camera at crane laydown zone (focused on pipe sling contact area) 
→ Motion trigger: pipe laid down → camera captures 
→ YOLOv8 defect detector: check sling contact zones for coating damage 
→ DEFECT FOUND → hold pipe + alert QA team 
→ CLEAR → pipe can proceed to shipping
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera | Industrial IP camera (2–5MP) with good low-light | Sling contact zone imaging |
| Trigger | Motion sensor or crane cycle counter | Capture after each lift |
| Model | YOLOv8 fine-tuned for coating damage | Detect sling damage |
| Integration | n8n → SAP QM | Create inspection hold if damage found |
| Alert | Teams + visual light indicator | Immediate notification |
| Archive | SharePoint with pipe ID + timestamp | Audit trail |

### Camera Placement
```
[Pipe being laid down on yard ground]
          ↑
    [CAMERA POSITION]
    
Camera FOV covers: The 3m zone on either side of where slings typically contact pipe
Camera angle: 45° looking down at sling contact points (typically at 10 o'clock and 2 o'clock positions around pipe circumference)
Lighting: LED floodlights triggered with camera (consistent illumination)
```

### Types of Sling Damage to Detect
```python
sling_damage_types = {
    "SCUFF_MARK": {
        "description": "Surface scuff from sling friction — removes PE/PP surface gloss",
        "severity": "LOW",
        "visual": "Dull/matte area on glossy 3LPE coating",
        "action": "Mark for holiday test + visual inspection at dispatch"
    },
    "COATING_GOUGE": {
        "description": "Deep gouge penetrating coating — may expose steel",
        "severity": "HIGH",
        "visual": "Linear groove with material removal",
        "action": "HOLD pipe — repair coating before dispatch"
    },
    "COATING_DISBONDMENT": {
        "description": "Coating lifted from substrate — visible bump or loose flap",
        "severity": "HIGH",
        "visual": "Raised area or visible edge lift",
        "action": "HOLD pipe — repair coating before dispatch"
    },
    "SLING_IMPRESSION": {
        "description": "Permanent deformation of coating from sling pressure",
        "severity": "MEDIUM",
        "visual": "Indented line matching sling width",
        "action": "Holiday test required — may or may not penetrate to steel"
    }
}
```

### Training Data
- Collect 2–3 weeks of images from the camera position, capturing sling contact areas
- Get QA team to label: no damage / scuff / gouge / disbondment
- Augment with: different lighting conditions, different sling types, different pipe coatings (3LPE vs FBE)
- Target: 200+ examples per defect type

### Model Configuration
```python
from ultralytics import YOLO

# Use YOLOv8s (small) for balance of speed and accuracy
model = YOLO('yolov8s.pt')

# Fine-tune on sling damage dataset
results = model.train(
    data='sling_damage.yaml',
    epochs=100,
    imgsz=1280,  # High resolution to detect subtle scuff marks
    conf=0.5     # Confidence threshold
)

def inspect_sling_zones(image_path, pipe_id):
    results = model(image_path)
    
    damage_found = [
        {'type': model.names[int(box.cls)], 'confidence': float(box.conf), 
         'location': box.xyxy[0].tolist()}
        for box in results[0].boxes
        if float(box.conf) > 0.5
    ]
    
    if damage_found:
        # Create SAP QM hold
        create_inspection_hold(pipe_id, damage_found)
        # Alert QA team
        notify_qa_team(pipe_id, damage_found)
    
    return damage_found
```

### Integration Flow
```
Crane lifts pipe → moves to yard → lays down →
Motion sensor triggers → Camera captures 4 images (360° if multi-camera) →
YOLOv8 analysis (2-3 seconds) →

CLEAR: Green light → pipe can move to dispatch area
DAMAGE: Red light + hold tag printed → "Pipe HT-2341-P042 SLING DAMAGE — QA INSPECTION REQUIRED"
       + QA team notified via Teams → inspection within 2 hours
```

### Coating Repair Economics
- 3LPE coating repair (field applied patch): ₹5,000–15,000 per repair
- If damage reaches customer: transit damage claim = ₹50,000–5,00,000 (coating replacement + inspection + rework)
- Even catching 5 pipes/month = ₹2.5–25L in claim prevention

### Multi-Camera Option (Full Circumference Coverage)
For complete coverage:
- Camera 1: 12 o'clock (top of pipe)
- Camera 2: 3 o'clock (right side)
- Camera 3: 9 o'clock (left side)
- Camera 4: 6 o'clock (bottom — less accessible)

3 cameras can achieve 270° coverage (bottom rarely touched by slings)

### Estimated Build Time
- Camera installation: 2 days
- Training data collection: 2 weeks
- Model training: 1 week
- Integration: 1 week
- Total: ~4 weeks

### Hardware Cost
- 3× industrial cameras: ~₹45,000
- LED floodlights + motion sensor: ~₹8,000
- Edge processing (shared with [[077 - Yard Safety Camera]]): ₹0 (shared hardware)
- Total: ~₹55,000

---

## Related Ideas
- [[024 - Visual Coating Defect Camera System]] — same vision technology for production-line coating inspection
- [[023 - Coating Holiday False-Positive Filter]] — holiday testing that catches what this camera misses
- [[077 - Yard Safety Camera]] — shares camera infrastructure and edge GPU
- [[080 - Pipe Loading Photographic Record]] — loading photos document pre-dispatch condition
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — upstream coating quality that affects damage sensitivity

---

## Notes
- The most common false positive: dust or dirt on coating surface looks like a scuff mark. Include a "dust vs. damage" classifier or clean pipes before inspection.
- Consider the camera also for VENDOR SLING QUALITY monitoring: if damage correlates with specific sling types (wire rope vs. polyester webbing), this provides evidence to require webbing slings for coated pipes
- Archive all images with pipe ID — if a customer later reports coating damage and claims it was shipping damage, the pre-dispatch photo proves the pipe left the factory in good condition
