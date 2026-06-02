# 080 · Pipe Loading Photographic Record

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: MA Forbush, export team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Auto-triggered camera captures photos of every pipe batch at the moment of truck or vessel loading. Stored with timestamp and shipment reference — providing indisputable photographic evidence of pipe condition at the time of dispatch, eliminating transit damage disputes worth ₹10–50L per incident.

---

## Implementation Blueprint

### Architecture
```
Loading bay cameras (fixed, IP cameras) 
→ Truck/vessel loading event trigger (weight sensor or manual trigger) 
→ Multi-angle photos captured automatically 
→ Stamped with: timestamp, shipment number, pipe batch ID (OCR from stencil) 
→ Auto-uploaded to SharePoint with structured naming 
→ Linked to SAP delivery document
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Cameras | 2–3 IP cameras at each loading bay | Multi-angle photo capture |
| Trigger | Weight sensor at loading bay OR manual button | Capture moment |
| Photo Stamp | Python + `Pillow` | Add metadata overlay on photo |
| OCR | [[026 - Pipe Stencil OCR Verifier]] output | Get pipe ID from stencil |
| Storage | SharePoint with structured folder | Permanent archive |
| Integration | n8n + SAP SD | Link photo to delivery document |
| Retrieval | SharePoint search | Find photos by shipment |

### Camera Coverage at Loading Bay
```
[TRUCK BED / VESSEL HATCH]

Camera 1 (overhead, wide angle):
  - Captures full truck bed / hold opening from above
  - Shows: all pipes in load, coating condition overall
  - Best for: documenting that load matches packing list

Camera 2 (side angle, 30°):
  - Shows pipe stack cross-section
  - Captures: stacking arrangement, securing arrangements
  - Best for: verifying lashing/chocking

Camera 3 (close-up, automatic crop):
  - Focuses on pipe end stencils
  - OCR-readable: confirms pipe heat numbers match documents
  - Best for: load verification
```

### Photo Metadata Overlay
```python
from PIL import Image, ImageDraw, ImageFont
from datetime import datetime

def stamp_loading_photo(image_path, shipment_data):
    img = Image.open(image_path)
    draw = ImageDraw.Draw(img)
    
    # Add timestamp + shipment info banner at bottom of image
    banner_text = (
        f"WELSPUN CORP LTD | Anjar Plant\n"
        f"Delivery: {shipment_data['delivery_number']} | Customer: {shipment_data['customer']}\n"
        f"Heat#: {shipment_data['heat_number']} | Grade: {shipment_data['grade']}\n"
        f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S IST')}\n"
        f"Photo #{shipment_data['photo_sequence']} of {shipment_data['total_photos']}"
    )
    
    # White banner with black text at bottom
    draw.rectangle([(0, img.height-120), (img.width, img.height)], fill='white')
    draw.text((10, img.height-115), banner_text, fill='black', font=large_font)
    
    # Add Welspun logo (small, top right corner)
    logo = Image.open('welspun_logo.png').resize((80, 30))
    img.paste(logo, (img.width-90, 5))
    
    output_path = f"loading_{shipment_data['delivery_number']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
    img.save(output_path, quality=95)
    return output_path
```

### Automated Capture Trigger Options

**Option A: Manual Push Button (Simplest)**
- Large, weatherproof button at loading bay
- Loader presses button → all 3 cameras capture simultaneously
- App confirmation: "3 photos captured — Shipment X"

**Option B: Weight-Based Trigger**
- Weigh-bridge reading changes by >5 tons (pipe batch placed on truck) → trigger cameras
- Automatic, no manual action needed
- Some false positives (truck repositioning) — add 10-second delay

**Option C: QR/OCR Trigger (Most Sophisticated)**
- Camera detects pipe stencil/end-cap QR → auto-captures and auto-links to SAP delivery

### SharePoint Archive Structure
```
SharePoint/Welspun/LoadingPhotos/
├── 2026/
│   ├── 06/  (June 2026)
│   │   ├── DEL-2026-004521/  (Delivery number)
│   │   │   ├── 004521_001_overview.jpg
│   │   │   ├── 004521_002_stencil_close.jpg
│   │   │   ├── 004521_003_securing.jpg
│   │   │   └── 004521_metadata.json
│   │   └── DEL-2026-004522/
```

### SAP Integration
When photos are captured:
```
n8n → SAP SD: Attach photos to delivery document DL-2026-004521
(SAP's GOS - Generic Object Services allows document attachment)
```

### Dispute Resolution Use Case
```
Customer Claims: "Pipes arrived with coating damage — claims ₹25L compensation"

Welspun Response: 
1. Retrieve loading photos from SharePoint: "DEL-2026-004521"
2. Photos show: all pipes in excellent condition at time of loading
   Timestamp: 2026-06-01 14:32 IST
3. Compare to customer's damage photos: damage pattern inconsistent with factory damage
4. Forward timestamped photos to customer + insurance company

Result: Transit damage claim — carrier's liability, not Welspun's
Dispute resolved in Welspun's favor, ₹25L claim dismissed
```

### Estimated Build Time
- Camera installation: 1 week
- Python photo stamping: 1 day
- Trigger mechanism: 2 days
- SharePoint + SAP integration: 2 days
- Total: ~2 weeks

### Hardware Cost
- 3× IP cameras per bay (×3 bays = 9 cameras): ~₹1.5L
- Weatherproof cabling + mounting: ~₹30,000
- Push buttons (if manual trigger): ~₹2,000
- Total: ~₹1.8L

---

## Related Ideas
- [[078 - Coating Sling Damage Camera]] — pre-loading damage check this system builds on
- [[026 - Pipe Stencil OCR Verifier]] — OCR reads stencils in loading photos
- [[075 - Vessel Loading Stowage Planner]] — stowage plan documented alongside photos
- [[071 - Drone Pipe Counter Inventory Map]] — drone counts match photo-documented loads
- [[012 - Bill of Lading OCR Extractor]] — B/L generated after this documentation

---

## Notes
- Store photos for a minimum of 5 years — warranty and liability claims can surface years after delivery
- For export shipments to USA/EU: loading photos with timestamps are accepted as documentary evidence in commercial arbitration — their legal value is significant
- Consider also capturing photos at the PORT (not just the factory): vessel loading photos at Mundra capture the condition at the point where cargo transfers to the carrier
