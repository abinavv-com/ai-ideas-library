# 037 · HSAW Strip Tension Auto-Controller

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: ⚡ Efficiency
> **Helps**: HSAW production team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Laser line profiler on HSAW strip entry feeds lateral position data at 100Hz to a PID controller — predicting and preventing seam angle drift before it's visually detectable. Stops 10–20m of suboptimal weld being produced before the operator notices the deviation.

---

## Implementation Blueprint

### Architecture
```
Laser line profiler at HSAW strip entry 
→ Lateral position data at 100Hz 
→ Python PID controller 
→ Tension control signal to strip straightener or forming rolls 
→ Seam angle maintained within ±0.5° continuously
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensor | Keyence LJ-X8000 2D laser profilometer | Strip edge position tracking |
| Controller | Python PID (`simple-pid` library) or Siemens PLC | Closed-loop control |
| Communication | OPC-UA or Modbus TCP | Read sensor, write to actuator |
| Data Logging | InfluxDB + Grafana | Process parameter trending |
| Alerting | n8n | Drift alerts to operators |

### HSAW Process Background
In helical submerged arc welding:
- Steel strip is continuously fed at a helical angle to form the pipe spiral
- The seam angle determines the pipe's wall thickness uniformity and weld geometry
- Lateral drift in strip position as little as 3–5mm causes the seam angle to change
- This results in: weld overlap/gap variations, inconsistent wall thickness, potential weld defects
- Current detection: operator watches the forming zone visually — by the time it's visible, 10–20m of pipe has been produced at wrong angle

### Sensor Placement
```
[Coil → Strip entry] → [Straightener rolls] → 
[LASER PROFILER — measures strip edge position] → 
[Forming rolls → HSAW pipe formation] → [Welding head]

Laser position: ~2m before forming rolls, fixed position
Measures: lateral (left-right) position of strip edge
Sample rate: 100Hz (10ms intervals)
```

### PID Controller Logic
```python
from simple_pid import PID

# PID tuned for strip tension control response
pid = PID(Kp=2.0, Ki=0.5, Kd=0.1, setpoint=TARGET_POSITION_MM)
pid.output_limits = (-50, 50)  # Control signal limits for tension roll adjustment

def control_loop():
    while production_running:
        # Read current strip position from laser sensor
        current_position = laser_profiler.read_position()
        
        # Calculate control output
        control_output = pid(current_position)
        
        # Apply to tension/guide roll (via Modbus or OPC-UA write)
        tension_roll_actuator.set_position_adjustment(control_output)
        
        # Log at 100Hz
        influxdb.write('strip_position', current_position, control_output)
        
        time.sleep(0.01)  # 100Hz loop

# Alert if correction exceeds ±15mm (structural drift, not just noise)
if abs(control_output) > 15 and sustained_for_seconds > 5:
    alert_operator("Strip drift detected — adjusting automatically. Check coil straightener.")
```

### Key Parameters to Monitor
```python
hsaw_parameters = {
    "strip_lateral_position_mm": "target: ±2mm from nominal",
    "strip_entry_tension_kN": "target: customer spec dependent",
    "seam_angle_degrees": "target: spec dependent (typically 55–82°)",
    "weld_current_A": "from welding head data logger",
    "weld_speed_m_min": "from drive encoder",
    "strip_temperature_C": "optional — preheating zone"
}
```

### Grafana Dashboard
- Real-time strip position trace (100Hz → downsample to 1Hz for display)
- PID control output trend
- Alert log: number of corrections per hour
- Coil-to-coil consistency comparison

### Integration Requirements
- Check if HSAW line already has OPC-UA server on Siemens/Allen Bradley PLC
- If yes: data access is straightforward
- If no: install edge gateway (e.g., Hilscher netFIELD or Kepware) to expose PLC data via OPC-UA

### Estimated Build Time
- Sensor procurement + installation: 3–4 weeks (Keyence delivery + mechanical mounting)
- PLC/OPC-UA integration: 2–3 weeks (controls engineer required)
- PID tuning: 1 week (iterative, done during production)
- Validation: 2 weeks

### Hardware Cost
- Keyence LJ-X8000 laser profiler: ~$10,000–15,000 USD (~₹8.5–13L)
- Edge gateway (if needed): ~₹50,000
- Cables + mounting hardware: ~₹20,000
- Total: ~₹9–14L

---

## Related Ideas
- [[036 - LSAW Forming Press Spring-Back Predictor]] — similar ML-driven process optimization for LSAW
- [[040 - Production OEE Live Dashboard]] — OEE improvement tracked here
- [[028 - Flux Moisture Contamination Detector]] — same IoT/MQTT infrastructure
- [[046 - Predictive Maintenance Dashboard]] — strip guide bearing health monitored similarly
- [[027 - Welding Operator Defect Correlation Tracker]] — HSAW seam quality tracked alongside operator data

---

## Notes
- PID tuning is the most time-consuming part — auto-tuning algorithms (Ziegler-Nichols) can be used but manual tuning with a controls engineer is recommended
- The Keyence LJ-X8000 outputs data in its own protocol first — use Keyence's free LJ-Navigator2 software to configure and export via Ethernet
- If buying new: request OPC-UA output from Keyence directly — saves integration work
