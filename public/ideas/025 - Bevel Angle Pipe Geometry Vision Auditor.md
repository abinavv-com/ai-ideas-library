# 025 · Bevel Angle & Pipe Geometry Vision Auditor

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida, QA | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Laser profilometer or structured-light camera measures bevel angle, ovality, and squareness of cut at the pipe finishing station — replacing slow manual caliper measurements with a fully automated, per-pipe digital record. Eliminates the bottleneck where QA must measure every 5th pipe manually.

---

## Implementation Blueprint

### Architecture
```
Pipe enters finishing station → 
Keyence LJ-X laser profilometer scans bevel face → 
Python geometry calculation engine → 
Compare vs. API 5L bevel specifications → 
PASS/FAIL + dimension record → SAP QM
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Sensor | Keyence LJ-X8060 2D laser profilometer | High-speed bevel profile measurement |
| Alternative | Cognex 3D-A Series laser displacement sensor | Lower cost option |
| Data Processing | Python + `numpy` + `scipy` | Geometry calculations |
| Communication | Ethernet or RS232 from sensor | Data transfer |
| SAP Integration | n8n + BAPI | Record measurements |
| HMI | Industrial monitor at finishing station | Real-time pass/fail display |

### What to Measure

**API 5L Bevel Requirements (Typical)**
| Parameter | Nominal | Tolerance |
|---|---|---|
| Bevel angle | 30° | ±2.5° |
| Root face (land) | 1.6mm | +1.6/-0.8mm |
| Pipe end squareness (perpendicularity) | — | ≤1.6mm |
| Pipe end ovality | — | ≤1% of OD |

**Pipe Body Geometry**
| Parameter | Tolerance |
|---|---|
| Outer diameter | ±0.4% OD |
| Wall thickness | API 5L Table 10 |
| Straightness | ≤0.15% of pipe length |

### Laser Profilometer Setup
The Keyence LJ-X8060 scans at 64,000 profiles/second:
1. Mounted at fixed position at pipe end
2. Pipe rotated slowly (or sensor moved around pipe)
3. Full bevel profile captured in 2–3 seconds
4. Python extracts: bevel angle, root face dimension, perpendicularity, OD at bevel

```python
def analyze_bevel_profile(profile_data):
    """Process raw laser profile to extract bevel geometry"""
    # Fit a line to the bevel face points
    bevel_face_points = extract_bevel_region(profile_data)
    slope, intercept = np.polyfit(bevel_face_points[:,0], bevel_face_points[:,1], 1)
    bevel_angle = np.degrees(np.arctan(slope))
    
    # Extract root face from transition point
    transition_point = find_bevel_root_transition(profile_data)
    root_face_mm = calculate_root_face(transition_point, bevel_face_points)
    
    # Squareness from pipe face perpendicularity
    squareness_mm = calculate_squareness(profile_data)
    
    return {
        'bevel_angle_degrees': round(bevel_angle, 1),
        'root_face_mm': round(root_face_mm, 2),
        'squareness_mm': round(squareness_mm, 2),
        'od_at_bevel_mm': calculate_od(profile_data)
    }
```

### Compliance Check
```python
def check_bevel_compliance(measurements, pipe_spec):
    results = []
    
    # Bevel angle
    angle = measurements['bevel_angle_degrees']
    if abs(angle - 30.0) <= 2.5:
        results.append(('Bevel Angle', angle, '30±2.5°', 'PASS'))
    else:
        results.append(('Bevel Angle', angle, '30±2.5°', 'FAIL'))
    
    # Root face
    rf = measurements['root_face_mm']
    if 0.8 <= rf <= 3.2:  # API 5L: 1.6 +1.6/-0.8
        results.append(('Root Face', rf, '0.8–3.2mm', 'PASS'))
    else:
        results.append(('Root Face', rf, '0.8–3.2mm', 'FAIL'))
    
    return results
```

### Integration with Pipe Finishing Line
Position sensor after the facing/beveling machine:
```
[Beveling machine] → [Pipe moves 2m on conveyor] → 
[Laser profilometer station — 3 second measurement] → 
[PASS: green light, pipe continues] / [FAIL: red light, hold for manual check]
```

### Digital Record Per Pipe
```
BEVEL MEASUREMENT RECORD
Pipe: HT-2341-P042 | Date: 2026-06-01 14:32 | Standard: API 5L PSL-2

Bevel End 1:
  Bevel Angle: 30.3° ✅ (spec: 30±2.5°)
  Root Face: 1.8mm ✅ (spec: 0.8–3.2mm)
  Squareness: 0.6mm ✅ (spec: <1.6mm)
  OD at Bevel: 609.2mm ✅ (spec: 608.4–611.5mm)

Bevel End 2:
  Bevel Angle: 29.7° ✅
  Root Face: 2.1mm ✅
  Squareness: 0.4mm ✅
  OD at Bevel: 609.8mm ✅

OVERALL: ✅ PASS | Auto-released for coating
```

### Estimated Build Time
- Hardware installation: 3–5 days
- Software calibration: 1 week
- Integration + validation: 2 weeks

### Hardware Cost
- Keyence LJ-X8060: ~$8,000–12,000 USD (₹7–10L)
- Lower cost option (custom laser + OpenCV): ~₹1–2L but less accurate
- Mounting hardware + integration: ~₹30,000

---

## Related Ideas
- [[026 - Pipe Stencil OCR Verifier]] — companion at same finishing station
- [[032 - MTC Auto-Generator]] — this data feeds into the final pipe MTC
- [[025 - Bevel Angle Pipe Geometry Vision Auditor]] — self
- [[034 - Shot Blast Profile Per-Pipe Tracker]] — similar per-pipe measurement approach
- [[021 - X-Ray Weld Defect Detector]] — comprehensive QA suite this joins

---

## Notes
- Keyence provides free integration support and demo units — request a 2-week trial before purchase
- Temperature compensation needed: hot pipes (from welding heat) expand; allow cooling before measurement or apply thermal correction factor
- Build a statistical process control (SPC) chart for each dimension — detecting when the beveling machine is drifting toward out-of-spec
