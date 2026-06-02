# 026 · Pipe Stencil OCR Verifier

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: PN Mahida, yard team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Camera at the pipe exit reads the stenciled heat number, grade, and dimension markings using OCR — automatically cross-checking them against the SAP production order. Flags mismatches before the pipe enters the yard, preventing mixed-batch shipments (a costly customer claim scenario).

---

## Implementation Blueprint

### Architecture
```
Stenciling station → Pipe passes trigger sensor → 
Industrial camera captures stencil image → 
OCR engine reads markings → 
n8n cross-checks against SAP production order → 
PASS (pipe to yard) / MISMATCH (hold + alert)
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera | Cognex DataMan or Keyence CV-X industrial vision | High-speed OCR at line speed |
| Alternative | FLIR Blackfly S + Tesseract OCR | Lower cost option |
| OCR Engine | Cognex built-in OCR or Google Vision API / Tesseract | Read stencil text |
| Orchestration | n8n | SAP cross-check logic |
| SAP Query | SAP RFC `BAPI_PRODORD_GET_DETAIL` | Get expected markings |
| Alert | Red/green LED stack light + Teams alert | Immediate operator feedback |

### What Gets Stenciled on Pipes (API 5L)
```
Standard pipe stencil format:
WELSPUN CORP LTD
20" × 0.562" WT × API 5L GR X65 PSL2
HEAT NO: 2024H-45221 PIPE NO: P-042
LOT: L2024-0892 ITEM NO: 6
3LPE COATED THICKNESS: 3.5mm
HYDRO TESTED: 205 BAR
```

### Fields to Extract and Verify
```python
expected_stencil = {  # From SAP production order
    "manufacturer": "WELSPUN CORP LTD",
    "outer_diameter_inches": "20",
    "wall_thickness_inches": "0.562",
    "grade": "X65",
    "standard": "API 5L",
    "psl": "PSL2",
    "heat_number": "2024H-45221",
    "pipe_number": "P-042",
    "coating_type": "3LPE",
    "coating_thickness_mm": "3.5",
    "hydro_test_pressure_bar": "205"
}

actual_stencil = ocr_result  # Extracted from camera image

# Check each field matches
mismatches = [
    field for field in expected_stencil 
    if expected_stencil[field] != actual_stencil.get(field)
]
```

### OCR Challenges for Pipe Stenciling
1. **Curved surface**: Stencil on round pipe surface creates keystoning — use fisheye correction
2. **Paint quality**: Old stencil brushes cause blurry characters — model trained on blurry text
3. **Pipe rotation**: Stencil may not face camera — use 2 cameras at 90° angles
4. **Character confusion**: 0/O, 1/I/l, 5/S common in OCR — apply domain-specific corrections
5. **Reflective surface**: Metallic pipe creates glare — use polarized or oblique lighting

### Domain-Specific OCR Post-Processing
```python
def clean_stencil_ocr(raw_ocr_text):
    # Heat number format: YYYYX-NNNNN
    heat_num = re.search(r'\d{4}[A-Z]-\d{5}', raw_ocr_text)
    
    # Grade: X52 / X60 / X65 / X70 / X80
    grade = re.search(r'X(?:52|56|60|65|70|80)', raw_ocr_text)
    
    # Wall thickness: 0.XXX" or XX.Xmm
    wt = re.search(r'0\.\d{3}"|(?:\d+\.?\d*)mm', raw_ocr_text)
    
    # Fix common OCR errors in this domain
    text = raw_ocr_text.replace('GRX', 'GR X')  # Common stencil spacing issue
    
    return extract_all_fields(text)
```

### Handling Stencil Variations
- Welspun uses multiple stencil templates for different products (LSAW/HSAW/DI, domestic/export)
- Build a "template library" with regex patterns for each template type
- First, classify which template type this is → then apply template-specific extraction

### SAP Cross-Check via n8n
```
OCR extracts: Heat# 2024H-45221, Pipe# P-042, Grade X65
↓
n8n calls SAP BAPI: get production order for this heat/pipe combination
↓
Expected from SAP: Grade X65 PSL-2, OD 508mm, WT 14.3mm
↓
MATCH: ✅ Green light — pipe to yard
MISMATCH: 🔴 Red light — stop pipe — alert PN Mahida
```

### Estimated Build Time
- Hardware: 1 week (mounting, lighting, trigger sensor)
- OCR calibration per stencil template: 2 weeks
- SAP integration: 1 week
- Validation: 2 weeks

### Hardware Cost
- Industrial camera (Cognex DataMan 50): ~$2,000 USD (~₹1.7L)
- Budget option (Raspberry Pi + camera module + Tesseract): ~₹10,000
- Lighting + mounting: ~₹15,000

---

## Related Ideas
- [[014 - Material Certificate Auto-Importer]] — heat number from MTC must match stencil
- [[025 - Bevel Angle Pipe Geometry Vision Auditor]] — same finishing station companion
- [[071 - Drone Pipe Counter Inventory Map]] — OCR on end caps in yard uses similar technology
- [[032 - MTC Auto-Generator]] — stencil data feeds the MTC generation
- [[080 - Pipe Loading Photographic Record]] — stencil image archived with loading photos

---

## Notes
- The single highest-value use case: catching wrong-grade pipes before they enter the yard (an X52 mixed in with X65 shipment is a major customer claim)
- Start with heat number verification only (most critical) before expanding to all stencil fields
- Build a "stencil quality alert" — if OCR confidence is low (blurry stencil), alert stencilling operator to redo before pipe moves
