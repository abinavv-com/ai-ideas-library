# 028 · Flux Moisture Contamination Detector

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Pawan Kathayat, welding supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors flux moisture content with a humidity sensor installed in the flux hopper. Alerts the welding supervisor and creates a SAP hold when moisture exceeds the threshold — preventing the porosity batches that happen when wet flux is used and only discovered at X-ray inspection hours later.

---

## Implementation Blueprint

### Architecture
```
DHT22 humidity + temperature sensor in flux hopper 
→ Raspberry Pi / Arduino (data logger) 
→ MQTT → n8n 
→ Compare against threshold (typically <0.1% moisture for submerged arc flux) 
→ Alert supervisor via Teams/WhatsApp + SAP production hold
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensor | DHT22 or SHT31 (more accurate) | Humidity + temperature in hopper |
| Edge Device | Raspberry Pi 4 or Arduino Mega | Read sensor, publish to MQTT |
| Message Broker | MQTT (Mosquitto broker, local) | Industrial IoT standard |
| Orchestration | n8n (MQTT subscribe node) | Trigger alerts and SAP actions |
| Alert | WhatsApp Business API or Teams | Immediate supervisor notification |
| SAP Integration | n8n + SAP PP BAPI | Create production hold |
| Data Log | InfluxDB + Grafana | Time-series monitoring dashboard |

### Sensor Placement
```
Flux Hopper Cross-Section:
┌──────────────────────────────┐
│     [Flux granules]          │
│              ↑               │
│     [SHT31 sensor]           │  ← Placed 1/3 from bottom, accessible for calibration
│    wired through hopper wall  │
└──────────────────────────────┘
               ↓ sensor cable
         [Raspberry Pi / Arduino]
              (sealed box on hopper exterior)
```

### Threshold Values (Submerged Arc Welding Flux)
```python
flux_thresholds = {
    "relative_humidity_warning_pct": 65,    # First warning
    "relative_humidity_alert_pct": 75,      # Stop welding, investigate
    "temperature_delta_warning_C": 5,       # Hopper temp vs ambient
    
    # Better metric: Equilibrium Moisture Content
    # Different flux types have different moisture sensitivity
    "OP121TT_max_moisture_pct_weight": 0.1,  # Lincoln Electric spec
    "OK10_71_max_moisture_pct_weight": 0.08,  # ESAB spec
}
```

### Why This Matters (Technical Context)
Submerged arc flux absorbs atmospheric moisture. When heated:
- Moisture → steam → hydrogen → dissolved in weld metal → porosity
- More severe: hydrogen-induced cracking (HIC) in high-strength grades (X65, X70, X80)
- Moisture above threshold = mandatory flux pre-drying at 300°C for 1 hour before use
- Current practice: visual check by welding supervisor (unreliable)

### Raspberry Pi Code (Simplified)
```python
import Adafruit_DHT
import paho.mqtt.client as mqtt
import time

SENSOR = Adafruit_DHT.DHT22
PIN = 4  # GPIO pin

def read_and_publish():
    humidity, temperature = Adafruit_DHT.read_retry(SENSOR, PIN)
    
    payload = {
        "hopper_id": "LSAW_FLUX_HOPPER_1",
        "humidity_pct": round(humidity, 1),
        "temperature_c": round(temperature, 1),
        "timestamp": time.time()
    }
    
    client.publish("welspun/flux/lsaw_1/humidity", json.dumps(payload))

# Run every 5 minutes
while True:
    read_and_publish()
    time.sleep(300)
```

### n8n Alert Logic
1. **MQTT trigger node**: Subscribe to `welspun/flux/+/humidity`
2. **Function node**: Parse JSON payload
3. **IF node**: Humidity > 75%?
4. **Teams/WhatsApp node**: Alert welding supervisor on duty
5. **SAP PP node**: Create production order block (reason: "Flux moisture hold")
6. **InfluxDB node**: Write measurement for Grafana dashboard
7. **Wait 30 min node** → Re-check humidity → If resolved → remove SAP hold

### Alert Message
```
⚠️ FLUX MOISTURE ALERT — LSAW Line 1
Hopper: LSAW_FLUX_HOPPER_1
Humidity: 78% (threshold: 75%)
Temperature: 24°C

Action Required:
1. Stop welding immediately on LSAW Line 1
2. Check flux batch: [batch number] from [supplier]
3. Pre-dry flux at 300°C × 1 hour per WPS requirement
4. Re-test with hygrometer before resuming

SAP Production Hold created: Hold# WH-2026-0421
Contact: @Pawan Kathayat | @Welding Supervisor on duty
```

### Grafana Dashboard
- Real-time humidity trend per hopper (last 24 hours)
- Alert history log
- Correlation with defect rates (show if high humidity days correlate with porosity)

### Estimated Build Time
- Hardware assembly: 1 day
- Software + n8n: 1 day
- MQTT + InfluxDB setup: 1 day
- Total: 3 days

### Hardware Cost
- SHT31 sensor: ~₹200
- Raspberry Pi 4: ~₹5,000 (or reuse existing)
- Waterproof enclosure + cable: ~₹500
- Total hardware per hopper: ~₹6,000
- With 5 hoppers: ~₹30,000

---

## Related Ideas
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — similar IoT sensor → alert pattern
- [[027 - Welding Operator Defect Correlation Tracker]] — flux moisture is an equipment-side cause of defects
- [[029 - Automated RCA Report Generator]] — flux moisture events trigger RCA
- [[050 - Thermal Camera Gearbox Monitor]] — same IoT sensor architecture for different machines
- [[046 - Predictive Maintenance Dashboard]] — builds on same MQTT/IoT infrastructure

---

## Notes
- For accuracy, use capacitive humidity sensors (SHT31/SHT40) not resistive (DHT22) — capacitive is more accurate at high humidity levels that matter for flux
- Calibrate sensors quarterly — humidity sensors drift over time and in dusty environments
- Consider installing a small hygrometer display screen on the hopper so operators can see live readings without needing the digital system
