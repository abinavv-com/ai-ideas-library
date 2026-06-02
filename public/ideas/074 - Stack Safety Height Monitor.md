# 074 · Stack Safety Height Monitor

> **Section**: Yard & Logistics | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: MA Forbush, safety team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Fixed cameras on yard boundary poles run a computer vision model that detects if pipe stacks exceed safe height limits. Triggers an immediate WhatsApp alert to the yard supervisor and logs the event — preventing the slow-build unstable stack that eventually collapses.

---

## Implementation Blueprint

### Architecture
```
Fixed IP cameras on boundary poles (covering yard zones) 
→ Python YOLO-based height estimation model 
→ Compare estimated stack height to safe limit per pipe diameter 
→ Alert fires within 60 seconds of threshold being crossed 
→ WhatsApp alert to yard supervisor + logged in safety system
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Cameras | Hikvision or Axis IP cameras (PTZ or fixed) | Yard coverage |
| Edge Processing | NVIDIA Jetson or PC with GPU | Real-time video analysis |
| Height Detection | YOLOv8 + monocular depth estimation | Estimate stack height |
| Alert | WhatsApp Business API + Siren output | Immediate notification |
| Log | n8n → SharePoint safety log | Compliance record |
| Dashboard | Grafana | Camera status + alert history |

### Safe Stacking Height (Indian Standards + Industry Practice)
```python
safe_stacking_heights = {
    # Per API RP 5L1 and IS guidelines
    "LSAW_diameter_above_600mm": {
        "max_height_m": 2.0,    # Large diameter pipes — max 2 layers
        "notes": "Heavy pipes — check ground bearing capacity"
    },
    "LSAW_diameter_300_600mm": {
        "max_height_m": 3.0,
        "notes": "Wedge or chock every layer"
    },
    "HSAW_large_diameter": {
        "max_height_m": 2.5
    },
    "DI_pipe_small": {
        "max_height_m": 4.0,    # Smaller DI pipes can be stacked higher
        "notes": "Stable if stacked on saddles"
    }
}

# Warning threshold: 80% of maximum
# Alert threshold: 90% of maximum
# Emergency: 100%+ of maximum
```

### Height Estimation Approach

**Method 1: Known Reference Objects (Simpler)**
Use known-size objects in the camera frame as scale references:
- Gate post height (known: 3m)
- Forklift height (known: 2.5m)
- Road marking width (known: 0.3m)

Calibrate: pixels per meter at known distances → estimate stack height in pixels → convert to meters.

**Method 2: Monocular Depth Estimation (More Accurate)**
```python
from ultralytics import YOLO
import cv2
import numpy as np

# MiDaS depth estimation model
depth_model = torch.hub.load('intel-isl/MiDaS', 'MiDaS_small')

def estimate_stack_height(frame, camera_calibration):
    # Step 1: Detect pipe stack with YOLO
    stacks = pipe_stack_detector(frame)
    
    # Step 2: Estimate depth (distance from camera)
    depth_map = depth_model(frame)
    
    # Step 3: For each detected stack bounding box:
    for stack in stacks:
        stack_top_y = stack.bbox[1]     # Top of bounding box (pixels)
        stack_bottom_y = stack.bbox[3]  # Bottom of bounding box (pixels)
        
        # Convert pixel height to real height using camera calibration + depth
        distance_from_camera = depth_map[stack.center_y, stack.center_x]
        pixel_to_meter_scale = camera_calibration.get_scale(distance_from_camera)
        
        height_m = (stack_bottom_y - stack_top_y) * pixel_to_meter_scale
        
        if height_m > safe_height_for_zone:
            trigger_alert(stack.location, height_m, safe_height_for_zone)
```

### Camera Placement Strategy
```
[BOUNDARY POLE 1]  ←→  [BOUNDARY POLE 2]
     Camera (PTZ)            Camera (PTZ)
         ↓                       ↓
    Zone A1-A4              Zone B1-B4
    (coverage 40m)          (coverage 40m)

Each camera covers approximately 40m × 30m yard area
For 200m × 100m yard: need ~15 cameras for full coverage
Start with high-risk zones (active loading/unloading areas)
```

### Alert Chain
```python
alert_levels = {
    "WARNING (80% of max)": {
        "action": "Teams notification to yard supervisor",
        "text": "Stack at Zone B3 approaching safe height limit: {height_m:.1f}m / {limit_m:.1f}m limit"
    },
    "ALERT (90% of max)": {
        "action": "WhatsApp to yard supervisor + safety officer",
        "text": "SAFETY ALERT: Stack at Zone B3 near maximum height: {height_m:.1f}m / {limit_m:.1f}m limit. Reduce height before adding more pipes.",
        "requires_acknowledgement": True
    },
    "EMERGENCY (100%)": {
        "action": "WhatsApp + siren at yard PA system + Teams to MA Forbush + plant safety",
        "text": "🚨 EMERGENCY: Stack exceeded safe height at Zone B3. DO NOT ADD MORE PIPES. Assess stability.",
        "requires_senior_review": True
    }
}
```

### False Positive Reduction
- Stack height changes slowly — only alert if high for 30+ seconds (not a single frame)
- Build a "known-stacking" whitelist: during active loading operations, suppress alerts briefly while pipe is being placed (reduces alarms during normal crane operation)
- Camera auto-calibration: if camera moves in wind, re-calibrate scale factor

### Estimated Build Time
- Camera procurement + installation: 2–3 weeks
- Model training (stack images): 3–4 weeks
- Alert system: 1 week
- Calibration: 1 week

### Hardware Cost
- Hikvision DS-2DE4A425IWG-E PTZ camera: ~₹18,000 each
- 8 cameras for initial deployment: ~₹1.44L
- Edge processing (share with other vision projects): ~₹35,000
- Mounting poles + power: ~₹40,000
- Total: ~₹2.2L

---

## Related Ideas
- [[077 - Yard Safety Camera]] — person detection complement to this tool
- [[049 - Overhead Crane Load Cycle Tracker]] — crane safety monitoring companion
- [[074 - Stack Safety Height Monitor]] — self
- [[072 - Pipe Location Digital Map]] — location reference for stack monitoring
- [[078 - Coating Sling Damage Camera]] — shares camera infrastructure

---

## Notes
- Document every alert and response in a safety log — this is critical for Factory Act compliance and accident investigation
- Brief all crane operators and yard supervisors on what the system does before deployment — they should see it as a safety aid, not surveillance
- Consider adding a secondary alert if a stack hasn't been moved in >30 days AND is in a high-moisture/corrosion zone — combine with [[079 - Corrosion Risk Pipe Storage Mapper]]
