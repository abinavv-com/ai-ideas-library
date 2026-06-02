# 032 · MTC Auto-Generator (Pipe Release Document)

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Upon QA test completion, an n8n workflow automatically collects heat treatment records, hydro-test results, MTC from steel mill, X-ray approval, and UT records — generating the final API-compliant pipe MTC PDF in minutes instead of the 3–4 hours it currently takes to compile manually.

---

## Implementation Blueprint

### Architecture
```
SAP QM: all inspections PASSED for a production lot 
→ n8n triggered automatically 
→ Pull all required test data from SAP + QA systems 
→ Python (ReportLab) assembles formatted MTC PDF 
→ QA engineer reviews + digital sign-off 
→ PDF archived to SharePoint + emailed to customer
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Trigger | SAP QM inspection lot status change webhook | Detect all tests passed |
| Data Sources | SAP QM, SAP PP, SAP MM, X-ray system | Gather all test data |
| PDF Generation | Python `ReportLab` or `fpdf2` | Generate formatted certificate |
| Digital Signature | Adobe Sign API or DocuSign API | QA engineer e-sign |
| Archive | SharePoint + SAP attachment | Permanent record |
| Delivery | Outlook via Graph API | Email to customer |

### MTC Components to Auto-Populate

**Section 1 — Product Identification**
- Customer name + PO number → from SAP SD
- Project name → from SAP SD
- Pipe dimensions (OD, WT, length) → from SAP PP production order
- Pipe numbers + heat numbers → from SAP PP
- Applicable standards → from customer specification in SAP

**Section 2 — Chemical Composition**
- All elements (C, Si, Mn, P, S, Cr, Ni, Mo, V, Nb, Ti, B, CE) → from [[014 - Material Certificate Auto-Importer]] data

**Section 3 — Mechanical Properties**
- Yield strength, tensile strength, elongation, Y/T ratio → from SAP QM test records
- CVN (Charpy) impact results (if required) → from SAP QM
- Hardness results → from SAP QM

**Section 4 — Non-Destructive Testing**
- Radiographic (X-ray) results → from X-ray inspection system or SAP QM
- Ultrasonic testing results → from SAP QM
- Holiday test results → from coating line records

**Section 5 — Dimensional Inspection**
- OD, WT, length measurements → from [[025 - Bevel Angle Pipe Geometry Vision Auditor]] or manual SAP entry
- Bevel geometry → from [[025 - Bevel Angle Pipe Geometry Vision Auditor]]

**Section 6 — Hydrostatic Test**
- Test pressure, duration, result → from SAP QM hydro-test records

**Section 7 — Coating Inspection**
- Coating type, thickness measurements, holiday test → from coating line QA records

### ReportLab PDF Template
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet

def generate_mtc(pipe_data, test_results):
    doc = SimpleDocTemplate(f"MTC_{pipe_data['heat_number']}.pdf", pagesize=A4)
    elements = []
    
    # Header with Welspun logo
    elements.append(Image('welspun_logo.png', width=200, height=50))
    elements.append(Paragraph("MATERIAL TEST CERTIFICATE", title_style))
    elements.append(Paragraph(f"Certificate No: {pipe_data['cert_number']}", normal_style))
    
    # Chemical composition table
    chem_data = [
        ['Element', 'Actual', 'Min', 'Max'],
        ['Carbon (%)', pipe_data['carbon'], '-', pipe_data['spec']['c_max']],
        ['Manganese (%)', pipe_data['manganese'], '-', pipe_data['spec']['mn_max']],
        # ... all elements
    ]
    elements.append(Table(chem_data, style=table_style))
    
    # Mechanical properties table
    # NDT results section
    # Signatory block
    
    doc.build(elements)
```

### Compliance with API 5L MTC Requirements
API 5L Section 11 specifies what MUST appear on the certificate. Build a validation check:
```python
def validate_mtc_completeness(mtc_data):
    required_fields = [
        'pipe_manufacturer', 'purchase_order_number', 'quantity',
        'size_od_wt', 'steel_grade_psl', 'heat_numbers',
        'chemical_composition', 'mechanical_properties',
        'hydrostatic_test_pressure', 'applicable_standard'
    ]
    missing = [f for f in required_fields if not mtc_data.get(f)]
    return missing  # Empty list = complete
```

### Digital Sign-Off Workflow
1. Generated MTC PDF sent to PN Mahida via Teams adaptive card: "MTC Ready for Review — Batch HT-2341 (23 pipes)"
2. PN Mahida reviews PDF in browser preview
3. Click "Sign Off" → DocuSign/Adobe Sign API adds certified digital signature
4. Signed MTC auto-emailed to customer + archived in SharePoint

### Estimated Build Time
- SAP data extraction: 3–4 days
- ReportLab template: 2–3 days
- Digital signature integration: 1–2 days
- Validation + testing: 1 week

### Cost
- ReportLab: Free open source
- DocuSign API: $30–50/month for SME tier
- n8n: Free
- ROI: 3–4 hours per MTC saved × 50 MTCs/month = 150–200 hours/month freed

---

## Related Ideas
- [[014 - Material Certificate Auto-Importer]] — feeds incoming steel mill MTC data
- [[009 - API 5L DNV Compliance Checker]] — validates data before including in MTC
- [[025 - Bevel Angle Pipe Geometry Vision Auditor]] — provides dimensional data
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — provides hydro test data
- [[092 - Pipe Digital Passport]] — the blockchain-anchored version of this document

---

## Notes
- Customer-specific MTC formats: some customers (Aramco, GAIL) have their own MTC format templates — build format switching by customer
- Third-party inspection: when TPI is required (BV, TÜV, Lloyds), they need to countersign the MTC — the workflow should generate a "draft pending TPI review" version first
- Language requirements: some Middle East projects require MTC in Arabic; others in English only — handle with locale settings
