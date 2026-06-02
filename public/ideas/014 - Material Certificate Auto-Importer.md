# 014 · Material Certificate (MTC) Auto-Importer

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida, QA team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Monitors the incoming email inbox for MTC PDFs from steel mills. Extracts chemical composition, mechanical test results, and heat numbers. Auto-populates SAP fields — eliminating 30–60 minutes of manual entry per certificate.

---

## Implementation Blueprint

### Architecture
```
Email inbox watch (n8n) → New MTC email detected 
→ PDF attachment download → Google Document AI / AWS Textract (OCR) 
→ LLM field normalization → Validation rules 
→ SAP QM batch input (BAPI or CSV upload) 
→ [[009 - API 5L DNV Compliance Checker]] triggered automatically
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Email Watch | n8n Gmail/Outlook node | Detect new MTC emails |
| OCR | Google Document AI (Form Parser) | Extract text from MTC PDFs |
| LLM Cleanup | OpenClaw / GPT-4o mini | Normalize values, infer missing fields |
| SAP Entry | SAP BAPI `BAPI_INSPLOT_CHARACT_VALC` or batch input | Write to SAP QM |
| Compliance Check | Trigger [[009 - API 5L DNV Compliance Checker]] | Instant compliance check |
| Archive | SharePoint / Google Drive | Permanent MTC document store |

### Standard MTC Fields to Extract
```python
mtc_fields = {
    # Identity
    "heat_number": "",          # e.g., "2024H-45221"
    "coil_number": "",
    "certificate_number": "",
    "mill_name": "",            # e.g., "SAIL Bhilai"
    "test_date": "",
    
    # Chemical Composition (%)
    "carbon": "",
    "silicon": "",
    "manganese": "",
    "phosphorus": "",
    "sulfur": "",
    "chromium": "",
    "nickel": "",
    "molybdenum": "",
    "vanadium": "",
    "niobium": "",
    "titanium": "",
    "boron": "",
    "carbon_equivalent": "",
    
    # Mechanical Properties
    "yield_strength_MPa": "",
    "tensile_strength_MPa": "",
    "elongation_pct": "",
    "yt_ratio": "",
    "cvn_energy_J": "",
    "cvn_temperature_C": "",
    "hardness_HV": "",
    
    # Dimensions
    "plate_thickness_mm": "",
    "plate_width_mm": "",
    "plate_length_mm": "",
    "weight_kg": "",
    
    # Standard
    "applicable_standard": "",  # e.g., "API 5L Grade X65 PSL-2"
}
```

### Handling MTC Format Variations
Steel mills (SAIL, TATA, Essar, JSW, POSCO, NIPPON) all have different MTC formats. Strategy:
1. **Try Document AI Form Parser first** — works for structured forms
2. **Fall back to LLM extraction** for non-standard or handwritten formats
3. **Regex pattern library** for common heat number formats: `[A-Z]{2,4}-\d{4,8}`

### Validation Before SAP Entry
```python
def validate_mtc(data):
    errors = []
    required = ['heat_number', 'carbon', 'manganese', 'yield_strength_MPa', 'tensile_strength_MPa']
    for field in required:
        if not data.get(field):
            errors.append(f"Missing required field: {field}")
    
    # Sanity checks
    if float(data.get('yield_strength_MPa', 0)) > 1000:
        errors.append("Yield strength >1000 MPa — likely OCR error")
    if float(data.get('carbon', 0)) > 1.0:
        errors.append("Carbon >1.0% — likely OCR error (decimal place issue)")
    
    return errors
```

### n8n Workflow Design
1. **Email watch trigger**: New email in `qa.incoming@welspun.com` with PDF attachment
2. **Filter**: Check if subject/body contains "Material Test Certificate" / "MTC" / "Test Report"
3. **HTTP Request**: Send PDF to Google Document AI
4. **Function node**: Parse and map to MTC fields
5. **HTTP Request (OpenClaw)**: Cleanup pass — normalize values, catch OCR errors
6. **Function node**: Validate; if errors → flag for manual review
7. **Webhook to [[009 - API 5L DNV Compliance Checker]]**: Trigger compliance check
8. **SAP BAPI node**: Write validated data to SAP QM inspection lot
9. **SharePoint node**: Archive original PDF + extracted JSON
10. **Teams notification**: "MTC for Heat {heat_number} imported to SAP: ✅ PASS / ⚠️ REVIEW"

### Estimated Build Time
- Developer: 3–4 days
- SAP QM BAPI setup: 2 additional days (needs SAP BASIS + QM module team)

### Cost
- Google Document AI: ~₹0.10 per MTC (2–3 pages)
- OpenClaw cleanup: ~₹0.75 per MTC
- At 200 MTCs/month: ~₹175/month
- ROI: 200 × 45 min = 150 hours/month of QA team time saved

---

## Related Ideas
- [[009 - API 5L DNV Compliance Checker]] — triggered automatically after MTC import
- [[012 - Bill of Lading OCR Extractor]] — same OCR-to-SAP architecture
- [[032 - MTC Auto-Generator]] — generates outgoing MTCs; this handles incoming
- [[026 - Pipe Stencil OCR Verifier]] — verifies pipe markings match imported MTC data
- [[014 - Material Certificate Auto-Importer]] — self

---

## Notes
- Test on the 10 most common steel suppliers first (SAIL, TATA, JSW likely cover 80% of volume)
- Keep a "failed extractions" queue — any MTC that fails validation goes to a QA team member queue for manual correction + model improvement
- After 3 months, review which fields consistently have OCR errors — add manual field-specific rules
