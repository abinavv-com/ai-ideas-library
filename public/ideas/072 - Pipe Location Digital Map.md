# 072 · Pipe Location Digital Map (Live)

> **Section**: Yard & Logistics | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: MA Forbush | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Yard supervisors log pipe movements via a mobile app (QR scan + GPS coordinate). Real-time yard map shows every pipe batch's exact location — replacing the tribal knowledge model where only one person (MA Forbush or his senior team) knows where everything is in the yard.

---

## Implementation Blueprint

### Architecture
```
QR code on each pipe batch (applied during production) 
→ Supervisor scans QR + app captures GPS coordinate 
→ Backend database updated in real-time 
→ Web-based yard map (Google Maps API + custom overlay) 
→ Anyone can search: "Where is heat 2024H-45221?" → gets map location
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Mobile App | React Native (iOS/Android) or PWA | Supervisor interface |
| QR Scanner | Device camera via ZXing library | Scan pipe batch QR code |
| GPS | Device GPS | Capture lay-down location |
| Backend | Firebase Realtime DB or PostgreSQL + REST API | Store pipe locations |
| Map | Google Maps JavaScript API + custom markers | Visual yard map |
| QR Generation | Python `qrcode` library | Generate pipe batch QR codes |
| Integration | n8n + SAP MM | Sync with SAP yard inventory |

### QR Code System
Each pipe batch gets a QR code label at the end of production:
```python
import qrcode

def generate_pipe_qr(pipe_batch):
    # QR encodes: heat number, grade, dimensions, production date
    qr_data = {
        "heat": pipe_batch['heat_number'],
        "grade": pipe_batch['grade'],
        "od_mm": pipe_batch['od_mm'],
        "wt_mm": pipe_batch['wt_mm'],
        "qty": pipe_batch['quantity'],
        "prod_order": pipe_batch['sap_order'],
        "batch_id": pipe_batch['batch_id']
    }
    
    qr = qrcode.make(json.dumps(qr_data))
    qr.save(f"qr_{pipe_batch['batch_id']}.png")
    
    # Print on weatherproof label → attach to end cap of lead pipe in stack
    return qr
```

### Mobile App Flow
```
1. Supervisor opens app → "Log Pipe Movement"
2. Scan QR code on pipe batch → Batch details shown
3. App shows: "Where is this batch going?"
4. Options:
   - Use GPS (tap "Mark Current Location") → GPS coordinates captured
   - Select yard zone (dropdown grid reference)
   - Scan destination zone marker (fixed QR at each yard zone post)
5. Confirm → Location logged → Pipe batch location updated on map
6. Optional: take a photo of the stack
```

### Yard Zone System
Divide the yard into a grid (like a car park reference system):
```
Yard Grid:
     A    B    C    D    E
1  [A1] [B1] [C1] [D1] [E1]
2  [A2] [B2] [C2] [D2] [E2]
3  [A3] [B3] [C3] [D3] [E3]
4  [A4] [B4] [C4] [D4] [E4]

Each zone: 10m × 20m = 200 sqm
Install a numbered post in each zone with a fixed QR code
```

### Web Yard Map
```javascript
// Google Maps with custom overlay showing pipe locations
function updateYardMap(pipeLocations) {
    pipeLocations.forEach(batch => {
        const marker = new google.maps.Marker({
            position: {lat: batch.lat, lng: batch.lng},
            map: map,
            title: `${batch.grade} ${batch.od_mm}mm OD — ${batch.qty} pipes`,
            icon: getIconByGrade(batch.grade)  // Color-coded by grade
        });
        
        // Click for details
        marker.addListener('click', () => {
            infoWindow.setContent(`
                <b>Heat: ${batch.heat_number}</b><br>
                Grade: ${batch.grade} | OD: ${batch.od_mm}mm<br>
                Qty: ${batch.qty} pipes<br>
                Located here since: ${batch.moved_at}<br>
                Customer: ${batch.customer_order}
            `);
            infoWindow.open(map, marker);
        });
    });
}
```

### Search Functionality
```
Search bar on yard map:
- Search by heat number → highlights location on map
- Search by SAP order → shows all batches for that order
- Search by grade (X65) → highlights all X65 pipes on map
- Search by customer → shows all pipes allocated to that customer
- "Pipes ready to ship?" → shows all PASS QA status pipes
```

### Integration with SAP
When a pipe batch is scanned and moved:
1. n8n receives location update from app
2. Queries SAP for the production order status
3. If batch status = "QA Released" + location = "Dispatch Bay" → auto-trigger shipping documents workflow ([[067 - Export Document Auto-Preparer]])

### Estimated Build Time
- React Native app: 1 week
- Backend + database: 3 days
- Google Maps integration: 2 days
- QR generation + labels: 1 day
- Total: ~2 weeks

### Cost
- React Native: Free framework
- Firebase: Free tier (up to 1GB data)
- Google Maps API: $7/1000 map loads (typically free for internal use within limits)
- QR label printing: ₹1–2 per label, weatherproof labels ~₹5 each
- Total: <₹5,000/month

---

## Related Ideas
- [[071 - Drone Pipe Counter Inventory Map]] — drone view complements this ground-level map
- [[073 - Crane Lift GPS Tracker]] — crane movements auto-update this map
- [[079 - Corrosion Risk Pipe Storage Mapper]] — uses location + duration data for risk analysis
- [[026 - Pipe Stencil OCR Verifier]] — stencil verification at production links to this map
- [[080 - Pipe Loading Photographic Record]] — loading photos tagged with map location

---

## Notes
- The biggest adoption challenge: supervisors are used to keeping location knowledge in their heads (it's a source of job security). Frame this as "making your knowledge visible to help the team when you're off shift" — not as replacement.
- GPS accuracy in an industrial yard with large steel structures can be poor (±10–15m). Consider using fixed Bluetooth beacons (BLE) at zone posts instead — more accurate and works indoors.
- Implement "movement history" — see where a pipe batch has been since production. Useful for investigating claims of damage during storage.
