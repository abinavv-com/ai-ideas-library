# 077 · Yard Safety Camera (People in Danger Zones)

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: MA Forbush, safety team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Existing CCTV cameras run a person-detection model. When a worker is detected inside an active crane swing zone, a siren alert fires at the crane operator cabin — preventing crush injuries before they happen. Augments, not replaces, physical barriers and worker training.

---

## Implementation Blueprint

### Architecture
```
Existing CCTV cameras (RTSP stream) 
→ Edge server: YOLOv8 person detection model (real-time) 
→ Compare person position to defined danger zones (polygons on camera image) 
→ Person in active danger zone → Relay output fires siren at crane cabin 
→ Alert to supervisor's phone + log event
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera Source | Existing CCTV (RTSP stream) | Live video feed |
| Edge Processing | NVIDIA Jetson Orin or RTX workstation | Real-time inference |
| Person Detection | YOLOv8n (nano — optimized for speed) | Human detection |
| Zone Management | Python polygon definition | Define danger areas |
| Siren Output | Digital relay output from Raspberry Pi | Activate siren |
| Alert | WhatsApp Business API | Notify supervisor |
| Event Log | n8n → SharePoint safety log | Compliance record |

### Danger Zone Definition
```python
# Define danger zones as polygons in image coordinates
# These are the areas that should be clear when crane is operating

danger_zones = {
    "LSAW_crane_swing_zone": {
        "polygon_points": [(100, 200), (450, 200), (450, 600), (100, 600)],
        "camera_id": "CAM_LSAW_1",
        "active_when": "crane_moving",  # Only alert when crane is in motion
        "severity": "HIGH"
    },
    "HSAW_crane_travel_path": {
        "polygon_points": [(0, 300), (640, 300), (640, 500), (0, 500)],
        "camera_id": "CAM_HSAW_YARD",
        "active_when": "always",
        "severity": "CRITICAL"
    },
    "DI_ladle_pour_zone": {
        "polygon_points": [...],
        "camera_id": "CAM_DI_HOT",
        "active_when": "always",
        "severity": "CRITICAL",
        "siren_immediate": True  # No delay — immediate alarm
    }
}
```

### Person Detection Pipeline
```python
from ultralytics import YOLO
import cv2
import numpy as np

model = YOLO('yolov8n.pt')  # Nano version: fastest, 12ms per frame

def process_frame(frame, camera_id):
    results = model(frame, classes=[0])  # class 0 = person
    
    persons_detected = []
    for box in results[0].boxes:
        if float(box.conf) > 0.6:  # 60% confidence threshold
            bbox = box.xyxy[0].tolist()
            person_center = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
            persons_detected.append(person_center)
    
    # Check each person against danger zones for this camera
    alerts = []
    for zone in get_zones_for_camera(camera_id):
        zone_polygon = np.array(zone['polygon_points'])
        
        for person in persons_detected:
            if cv2.pointPolygonTest(zone_polygon, person, False) >= 0:
                alerts.append({
                    'zone': zone['name'],
                    'severity': zone['severity'],
                    'timestamp': datetime.now()
                })
    
    return alerts

# Continuous frame processing (targeting 15 FPS per camera)
# With Jetson AGX Orin: can handle 8-10 cameras simultaneously at 15 FPS each
```

### Siren Activation
```python
import RPi.GPIO as GPIO

SIREN_PIN = 17  # GPIO pin connected to relay

def activate_siren(duration_seconds=3, crane_cabin='LSAW_1'):
    # Activate relay → siren at crane cabin
    GPIO.output(SIREN_PIN, GPIO.HIGH)
    time.sleep(duration_seconds)
    GPIO.output(SIREN_PIN, GPIO.LOW)
    
    # Also illuminate warning light in crane cabin (different GPIO)
    GPIO.output(WARNING_LIGHT_PIN, GPIO.HIGH)
    time.sleep(5)  # Light stays on for 5 seconds
    GPIO.output(WARNING_LIGHT_PIN, GPIO.LOW)
```

### False Positive Management
Person detection in an industrial yard has challenges:
- Forklift operators (detect forklift, not just person)
- Permit-to-work zones (some workers are ALLOWED in some zones)
- PPE-wearing workers look different (hard hats, safety vests)

```python
# Solutions:
# 1. Confidence threshold: only alert if person detected in zone for 2+ consecutive seconds
# 2. Permit-to-work integration: maintenance work in crane zone? Temporarily disable alert
# 3. Zone override switch: physical key switch at crane cabin to disable zone during planned maintenance
# 4. Hard hat / safety vest model: if person without PPE → higher alert priority

def should_alert(person_in_zone_duration_sec, zone_override_active, permit_to_work_active):
    if zone_override_active or permit_to_work_active:
        return False  # Manual override active
    if person_in_zone_duration_sec > 2.0:
        return True
    return False
```

### Live Safety Monitor Dashboard (Control Room)
```
[16-way split screen camera view]
Each camera: live video with zone overlays drawn in red (inactive) or flashing (alarm)

SAFETY STATUS BOARD (sidebar):
Crane 1 Zone: ⚠️ PERSON DETECTED 14:32:15 — Photo: [thumbnail]
Crane 2 Zone: ✅ CLEAR
DI Pour Zone: ✅ CLEAR
All other zones: ✅ CLEAR
```

### Estimated Build Time
- Camera integration (RTSP feeds): 2 days
- Zone definition + testing: 1 week
- Siren relay hardware: 2 days
- Alert system: 2 days
- Total: ~2 weeks

### Hardware Cost
- Siren (industrial piezo, IP65): ~₹2,000 per crane
- Relay board + wiring: ~₹1,000
- Jetson AGX Orin: ~₹55,000 (shared with other vision projects)
- Total new hardware: ~₹10,000 (cameras reused)

---

## Related Ideas
- [[074 - Stack Safety Height Monitor]] — shares edge GPU infrastructure
- [[049 - Overhead Crane Load Cycle Tracker]] — crane operation data triggers zone active status
- [[073 - Crane Lift GPS Tracker]] — crane movement triggers zone alert activation
- [[078 - Coating Sling Damage Camera]] — uses same camera infrastructure
- [[024 - Visual Coating Defect Camera System]] — shares Jetson GPU resources

---

## Notes
- This is a SUPPLEMENT to physical controls (barriers, LOTO, permit-to-work), not a replacement. Never remove physical barriers because "the camera will catch it."
- Test the siren: is it audible inside the crane cabin with the crane running and wearing hearing protection? Test before deployment.
- Maintain an incident log: every alert → did the supervisor confirm a genuine intrusion or false positive? Track false positive rate and tune the confidence threshold accordingly.
