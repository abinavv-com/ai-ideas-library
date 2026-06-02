# 049 · Overhead Crane Load & Cycle Tracker

> **Section**: Maintenance & Reliability | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: MA Forbush, Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Installs load cell and cycle counter on gantry cranes. Monitors lift weight, frequency, and deceleration profile — alerting maintenance when brake wear indicators or Safe Working Load (SWL) utilization metrics approach thresholds. Prevents the catastrophic failure of letting a crane operate beyond its design life.

---

## Implementation Blueprint

### Architecture
```
Load cell (in-line with crane hook) + cycle counter (limit switch) 
→ Edge controller (Raspberry Pi / PLC) 
→ MQTT → n8n 
→ Cumulative load spectrum analysis 
→ Alert when approaching SWL exceedance or maintenance threshold 
→ Mandatory inspection trigger in SAP PM
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Load Sensor | Loadcell with shackle (calibrated) — Crosby or Tractel | Measure lift weight |
| Cycle Counter | Magnetic proximity switch on hoist motor | Count lift cycles |
| Motion Sensor | 3-axis accelerometer on crane hook | Detect sudden stops (brake check) |
| Edge Controller | Raspberry Pi 4 + HX711 load cell amplifier | Data logging |
| Protocol | MQTT | Data transport |
| Orchestration | n8n | Alert logic |
| SAP Integration | SAP PM BAPI | Mandatory inspection triggers |

### Why This Matters (Legal and Safety Context)
Under Indian Factory Act + IS 3832 crane standards:
- Overhead cranes must be thoroughly examined by a Competent Person every 12 months
- SWL must be visibly marked and NEVER exceeded
- Brake efficiency must be tested periodically
- Load spectrum (how many lifts at what weights over crane's life) determines fatigue life

Welspun's pipe handling cranes regularly lift full pipe bundles (20–60 tons). A single SWL overload can crack the crane's main girder — a failure mode that is invisible until catastrophic.

### Load Spectrum Monitoring
```python
class CraneLoadSpectrum:
    """
    Track cumulative load spectrum per crane
    ISO 4301 / FEM 1.001 crane duty classification
    """
    def __init__(self, crane_id, swl_tons, duty_class):
        self.crane_id = crane_id
        self.swl_tons = swl_tons
        self.duty_class = duty_class  # M1–M8 per ISO 4301
        self.lift_history = []
    
    def record_lift(self, load_tons, timestamp):
        # Reject if SWL exceeded
        if load_tons > self.swl_tons:
            self.raise_swl_exceedance_alert(load_tons)
        
        self.lift_history.append({
            'load_tons': load_tons,
            'load_ratio': load_tons / self.swl_tons,
            'timestamp': timestamp
        })
        
        # Update damage accumulation (Palmgren-Miner rule)
        self.update_fatigue_life()
    
    def update_fatigue_life(self):
        """Simplified fatigue calculation"""
        total_damage = sum(
            (lift['load_ratio'] ** 3) / self.design_cycles_at_swl
            for lift in self.lift_history
        )
        self.remaining_life_pct = max(0, (1 - total_damage) * 100)
        
        if self.remaining_life_pct < 20:
            trigger_major_inspection()
```

### Alert Types
```python
alert_thresholds = {
    "swl_exceeded": {
        "condition": "load > swl",
        "action": "STOP_CRANE_IMMEDIATELY",
        "notify": ["crane_operator", "safety_officer", "MA_Forbush"],
        "sap_action": "Create PM order for mandatory re-inspection"
    },
    "swl_warning_95pct": {
        "condition": "load > 0.95 * swl",
        "action": "OPERATOR_WARNING",
        "notify": ["crane_operator"]
    },
    "fatigue_life_warning": {
        "condition": "remaining_life < 30%",
        "action": "SCHEDULE_MAJOR_INSPECTION",
        "notify": ["Anurag_Singh", "MA_Forbush"],
        "sap_action": "Create PM order — crane structural inspection"
    },
    "brake_efficiency_check": {
        "condition": "deceleration < minimum_threshold for load",
        "action": "SCHEDULE_BRAKE_INSPECTION"
    }
}
```

### Compliance Dashboard
```
CRANE SAFETY MONITORING — WELSPUN ANJAR PLANT
Date: 2026-06-01

Crane         | SWL  | Max Load (Today) | Cycles (YTD) | Life Remaining | Next Insp Due
LSAW Gantry 1 | 50T  | 38.2T (76%)  ✅  | 4,820        | 78%            | 2026-12-15
LSAW Gantry 2 | 50T  | 42.7T (85%)  🟡  | 6,234        | 52%            | 2026-08-01
Yard Crane 1  | 30T  | 28.1T (94%)  🔴  | 11,420       | 22%            | NOW ← OVERDUE
Yard Crane 2  | 60T  | 31.4T (52%)  ✅  | 3,109        | 91%            | 2027-03-30

⚠️ YARD CRANE 1: Fatigue life at 22%. Mandatory thorough examination required.
   SAP PM Order PM-2026-0821 created. Schedule with Competent Person immediately.
```

### Installation Requirements
- Load cell must be calibrated to 0.5% accuracy
- Installation by certified crane service engineer
- Annual re-calibration required
- Waterproof/dustproof enclosure for Raspberry Pi (IP65 minimum for yard environment)

### Estimated Build Time
- Hardware procurement + installation: 3–4 weeks (crane downtime required for installation)
- Software: 2 weeks
- Calibration + certification: 1 week

### Hardware Cost Per Crane
- In-line load shackle (SWL-rated): ~₹15,000–25,000
- Data logger + MQTT gateway: ~₹8,000
- Mounting hardware + cable routing: ~₹5,000
- Total per crane: ~₹30,000–40,000
- For 5 cranes: ~₹1.5–2L

---

## Related Ideas
- [[050 - Thermal Camera Gearbox Monitor]] — thermal monitoring of crane drive gearboxes
- [[074 - Stack Safety Height Monitor]] — complements crane safety with stack height limits
- [[077 - Yard Safety Camera]] — person detection near crane swing zones
- [[046 - Predictive Maintenance Dashboard]] — crane data feeds the central maintenance dashboard
- [[017 - Legal Compliance Calendar Bot]] — crane inspection due dates tracked there

---

## Notes
- SWL exceedance is a legal issue under the Factory Act — document every exceedance event even if it appeared minor
- Install load display in the crane operator cab (simple digital display showing live load as % of SWL) — immediate operator feedback is the most valuable safety feature
- Cross-reference crane lift data with the yard map ([[072 - Pipe Location Digital Map]]) to calculate average lift weights by pipe type — validates that the right-rated crane is being used for each application
