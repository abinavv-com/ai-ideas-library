# 071 · Drone Pipe Counter & Inventory Map

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency, 💰
> **Helps**: MA Forbush | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Weekly autonomous drone flight over the yard. Computer vision (YOLO) counts pipes by stack and reads end-cap stencils via OCR. Produces an inventory reconciliation report vs. SAP within 2 hours of landing — eliminating the 2-day manual yard count that currently blocks month-end.

---

## Implementation Blueprint

### Architecture
```
DJI Dock 2 (autonomous drone launch) → Pre-programmed flight path over yard 
→ Downward-facing camera captures pipe stacks 
→ Land → Images uploaded to processing server 
→ YOLOv8 counts pipes per stack + OCR reads stencils 
→ Compare to SAP yard inventory → Reconciliation report to MA Forbush
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Drone Hardware | DJI Matrice 350 RTK + DJI Dock 2 | Autonomous flight + docking |
| Alternative | DJI Mini 4 Pro (manual, lower cost) | Lower cost option |
| Camera | DJI Zenmuse L2 (LiDAR) or H20T (zoom) | High-resolution imagery |
| Processing | Python on edge server or cloud | Image analysis |
| Pipe Detection | YOLOv8 instance segmentation | Count pipes per image |
| OCR | Google Vision API or Tesseract | Read end-cap stencils |
| Reconciliation | Python + SAP MM query | Compare counts to SAP |
| Output | Excel report + annotated aerial photos | For MA Forbush |

### DJI Dock 2 — The Key Enabler
DJI Dock 2 allows fully autonomous operation:
- Drone launches, flies pre-programmed mission, returns, docks, charges
- No pilot required for routine missions
- Mission triggered by: schedule (weekly), button (manual), or n8n API call
- Weather check built-in: auto-cancels flight in rain/high wind

### Flight Path Planning
```python
# Plan waypoints over the pipe yard (coordinates in GPS)
flight_mission = {
    "name": "Weekly Yard Inventory Count",
    "altitude_m": 40,  # 40m above ground — balances coverage vs. resolution
    "overlap_pct": 80,  # 80% image overlap for complete coverage
    "speed_m_s": 5,
    "camera": "Nadir (straight down)",
    
    "waypoints": [
        {"lat": 23.076, "lon": 70.033, "action": "start_capture"},
        {"lat": 23.076, "lon": 70.038, "action": "continue"},
        # ... Grid pattern covering full yard area
        {"lat": 23.082, "lon": 70.038, "action": "end_mission"}
    ],
    
    "estimated_flight_time_min": 25,
    "images_captured": ~800
}
```

### Pipe Detection Model (YOLOv8)
```python
from ultralytics import YOLO

# Train model to detect individual pipe ends in aerial images
# Each pipe appears as a circular end-cap when viewed from above
model = YOLO('yolov8x-seg.pt')  # Segmentation for counting

def count_pipes_in_image(image_path):
    results = model(image_path)
    
    # Each detected circle = one pipe end
    pipe_count = len(results[0].boxes)
    
    # Extract end-cap position in image for mapping
    pipe_positions = [(box.xyxy[0].tolist()) for box in results[0].boxes]
    
    return pipe_count, pipe_positions
```

### OCR on End-Cap Stencils
```python
def read_endcap_stencils(image_path, pipe_bbox):
    # Crop end-cap region from aerial image
    endcap_crop = crop_image(image_path, pipe_bbox, expand_px=20)
    
    # Apply Google Vision OCR
    text = google_vision_ocr(endcap_crop)
    
    # Extract key fields using regex
    heat_number = re.search(r'\d{4}[A-Z]-\d{5}', text)
    grade = re.search(r'X(?:52|60|65|70|80)', text)
    dimension = re.search(r'\d{2,3}"|\d{3,4}mm', text)
    
    return {
        'heat_number': heat_number.group(0) if heat_number else None,
        'grade': grade.group(0) if grade else None,
        'dimension': dimension.group(0) if dimension else None
    }
```

### Yard Map Generation
```python
# Build an annotated aerial photo showing:
# - Each stack location (GPS coordinates)
# - Count per stack
# - Grade/dimension per stack (from OCR)
# - Compare to SAP records

def generate_yard_map(flight_images, ocr_results, sap_inventory):
    yard_map = stitch_images(flight_images)  # Create orthomap from drone photos
    
    for stack in detected_stacks:
        drone_count = stack['pipe_count']
        sap_count = sap_inventory.get(stack['location_id'], 0)
        discrepancy = drone_count - sap_count
        
        # Annotate on map
        overlay_annotation(yard_map, stack['location'],
            text=f"Drone: {drone_count} | SAP: {sap_count} | Δ: {discrepancy}",
            color='red' if abs(discrepancy) > 2 else 'green'
        )
    
    return yard_map
```

### Reconciliation Report
```
YARD INVENTORY RECONCILIATION — 2026-06-01
Flight duration: 22 minutes | Images: 847 | Processing time: 1.5 hours

SUMMARY: 
Total pipes counted (drone): 1,847
Total pipes in SAP (yard zone): 1,839
Discrepancy: +8 pipes (0.4%)

DISCREPANCY DETAILS:
Zone B3 (LSAW 20" X65):    Drone: 142 | SAP: 138 | +4 → Unbooked production output?
Zone C7 (DI DN300 K9):      Drone: 67  | SAP: 71  | -4 → Possible dispatch without GI?
Zone A2 (HSAW 48" X60):     Drone: 89  | SAP: 89  | ✅ Match

[Annotated aerial map attached — zones colored by discrepancy status]
```

### Estimated Build Time
- DJI Dock 2 installation: 1–2 weeks
- Model training (aerial pipe images): 3–4 weeks
- OCR pipeline: 1 week
- Reconciliation report: 1 week
- Total: ~6–8 weeks

### Hardware Cost
- DJI Matrice 350 RTK: ~$6,500 USD
- DJI Dock 2: ~$8,000 USD
- Total hardware: ~₹12–14L
- ROI: Eliminates 2-day manual count each week = 100+ staff-days/year

---

## Related Ideas
- [[072 - Pipe Location Digital Map]] — ground-level complement to drone aerial view
- [[026 - Pipe Stencil OCR Verifier]] — same OCR technology, different application
- [[073 - Crane Lift GPS Tracker]] — crane movements update the digital map
- [[079 - Corrosion Risk Pipe Storage Mapper]] — uses drone GPS data for risk mapping
- [[080 - Pipe Loading Photographic Record]] — drone photos provide loading documentation

---

## Notes
- DJI Dock 2 requires permanent installation with power supply and WiFi — assess yard layout for optimal placement (needs clear line of sight to most of the yard)
- DGCA (India's aviation regulator) requires drone operator certification and registration — consult a DGCA-approved drone operator for initial setup and regulatory compliance
- Night flights are possible with thermal/IR cameras — could run after each production shift
