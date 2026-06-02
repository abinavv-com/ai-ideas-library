# 073 · Crane Lift GPS Tracker

> **Section**: Yard & Logistics | **Complexity**: 🔵 Month 4–6 | **Impact**: ⚡ Efficiency
> **Helps**: MA Forbush | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
GPS/RTK beacons on yard gantry cranes log lift start coordinates, load, and laydown coordinates. Every pipe movement is automatically recorded — updating the [[072 - Pipe Location Digital Map]] without manual entry by the yard supervisor.

---

## Implementation Blueprint

### Architecture
```
RTK GPS beacon on crane hook (or crane body) 
→ Load cell reading (from [[049 - Overhead Crane Load Cycle Tracker]]) 
→ Edge controller: detect lift start/end from load cell + GPS movement 
→ MQTT → backend → update pipe location map 
→ Automatic yard map update when pipes are moved
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| GPS | u-blox ZED-F9P RTK GPS module | ±2cm accuracy positioning |
| RTK Base Station | Fixed RTK base station in yard | Centimeter-level accuracy |
| Load Cell | From [[049 - Overhead Crane Load Cycle Tracker]] | Detect lift start/end |
| Controller | Raspberry Pi 4 (weatherproof enclosure) | Process + transmit |
| Protocol | MQTT over WiFi/4G | Data transmission |
| Backend | Node.js or Python REST API | Process lift events |
| Map Update | WebSocket → [[072 - Pipe Location Digital Map]] | Real-time position update |

### Why RTK (Real-Time Kinematic) GPS?
Standard GPS accuracy: ±5–10 meters — useless for a 10×20m yard zone
RTK GPS accuracy: ±2–3 centimeters — knows exactly which stack the crane is at

RTK works by having a fixed "base station" with known coordinates at the plant, which corrects the mobile GPS beacon errors in real-time over a local radio/WiFi link.

### Lift Event Detection
```python
class CraneLiftDetector:
    def __init__(self, crane_id, load_threshold_kg=500):
        self.crane_id = crane_id
        self.load_threshold = load_threshold_kg
        self.lift_start = None
        self.lift_start_gps = None
    
    def process_sensor_data(self, timestamp, load_kg, gps_lat, gps_lon, gps_alt):
        # Detect lift start (load increases above threshold)
        if load_kg > self.load_threshold and self.lift_start is None:
            self.lift_start = timestamp
            self.lift_start_gps = (gps_lat, gps_lon)
            print(f"LIFT STARTED at {gps_lat:.6f}, {gps_lon:.6f}")
        
        # Detect lift end (load drops, crane has moved to new location)
        elif self.lift_start and load_kg < self.load_threshold * 0.1:
            lift_end_gps = (gps_lat, gps_lon)
            
            # Check if crane moved (pickup ≠ laydown location)
            distance_moved_m = haversine_distance(
                self.lift_start_gps, lift_end_gps
            )
            
            if distance_moved_m > 3:  # Moved more than 3m = pipe moved to new location
                self.record_pipe_movement(
                    from_location=self.lift_start_gps,
                    to_location=lift_end_gps,
                    lift_duration=(timestamp - self.lift_start),
                    load_kg=self.peak_load_this_lift
                )
            
            self.lift_start = None
```

### Pipe Batch Identification Challenge
The GPS tracker knows WHERE the crane picked up and laid down — but doesn't automatically know WHICH pipe batch it moved. Solutions:

**Option A: Zone-Based (Simple)**
- If crane picks up from Zone B3 and puts in Zone C7: look up which batch is in B3, mark it as now in C7
- Works if zones have only one batch at a time

**Option B: Load + Location Matching**
- Load cell records pickup weight → compare to known pipe batch weights → match
- Add weight tolerance for sling weight variation

**Option C: QR Scan Confirmation (Backup)**
- When GPS shows a move to a new location, app prompts: "Confirm which batch was moved"
- Used for exception cases when automatic matching fails

### Integration with Pipe Location Map
```python
def handle_lift_event(lift_event):
    """Called when crane moves a load from A to B"""
    
    # Look up what's at the pickup location
    batch_at_pickup = pipe_location_map.get_batch_at(
        lat=lift_event.pickup_lat,
        lng=lift_event.pickup_lng,
        radius_m=5  # Within 5m of pickup point
    )
    
    if batch_at_pickup:
        # Update batch location
        pipe_location_map.move_batch(
            batch_id=batch_at_pickup.batch_id,
            new_lat=lift_event.laydown_lat,
            new_lng=lift_event.laydown_lng,
            moved_at=lift_event.timestamp,
            moved_by=f"Crane {lift_event.crane_id}"
        )
        
        # Log movement for audit trail
        log_pipe_movement(batch_at_pickup, lift_event)
    else:
        # Unknown pickup location — flag for manual review
        flag_unknown_movement(lift_event)
```

### Estimated Build Time
- RTK GPS hardware: 3 weeks lead time
- Installation on cranes: 1 week (crane downtime during shift)
- Software: 2 weeks
- Calibration + validation: 1 week

### Hardware Cost
- u-blox ZED-F9P module per crane: ~$200 (~₹17,000)
- RTK base station (one per yard): ~$500 (~₹42,000)
- Weatherproof enclosure + power: ~₹5,000 per crane
- Total for 5 cranes: ~₹1.3L

---

## Related Ideas
- [[072 - Pipe Location Digital Map]] — this tool auto-updates the map
- [[049 - Overhead Crane Load Cycle Tracker]] — load cell from this project is reused
- [[071 - Drone Pipe Counter Inventory Map]] — aerial view validates GPS-logged positions
- [[074 - Stack Safety Height Monitor]] — safety complement
- [[077 - Yard Safety Camera]] — person detection when crane is operating

---

## Notes
- RTK GPS requires clear sky view — yard structures, pipe stacks, and warehouses can block GPS signals. Assess sky visibility at the crane operating height before committing to RTK.
- 4G backup: if yard WiFi is unreliable, use a 4G SIM in the Raspberry Pi for MQTT transmission — Airtel/Jio M2M SIM cards are inexpensive (~₹100/month)
- Crane movement data is also valuable for operational analytics: how many lifts per hour, which cranes are underutilized, what time of day has peak crane demand
