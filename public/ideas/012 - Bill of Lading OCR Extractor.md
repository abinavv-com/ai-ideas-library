# 012 · Bill of Lading OCR Extractor

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency, 💰 Cost Savings
> **Helps**: Mihir's logistics team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Scans export Bills of Lading and packing lists using Document AI — extracting quantity, weight, pipe schedule, and consignee data directly into SAP-ready format. Eliminates manual data entry (20–30 min per shipment) and associated keying errors.

---

## Implementation Blueprint

### Architecture
```
B/L PDF received (email or scan) → n8n email watch 
→ Google Document AI / AWS Textract (OCR + field extraction) 
→ LLM cleanup and validation 
→ SAP SD / MM data entry via BAPI or file upload 
→ Confirmation email to logistics team
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Trigger | n8n Gmail/Outlook watch | Detect new B/L documents |
| OCR & Extraction | Google Document AI (Form Parser) | Extract structured fields |
| LLM Cleanup | OpenClaw / GPT-4o mini | Fix OCR errors, normalize units |
| SAP Integration | SAP BAPI calls or IDoc file upload | Populate SAP with extracted data |
| Validation | Python rule engine | Catch extraction errors before SAP entry |
| Orchestration | n8n | Full workflow glue |

### APIs Required
- **Google Document AI** — `POST /projects/{project}/locations/{location}/processors/{processor}:process`
  - Use pre-built "Form Parser" processor — no training needed
  - Cost: ~$0.0015 per page
- **AWS Textract** (alternative) — `POST /textract/analyze-document` with `FORMS` feature
  - Cost: ~$0.015 per page (more expensive but slightly better for tables)
- **SAP RFC/BAPI** — `BAPI_GOODSMVT_CREATE` for goods receipt; custom BAPI for shipment data
- **Microsoft Graph API** — for Outlook email watching if using Outlook

### Key Fields to Extract from B/L
```python
bl_fields = {
    "bl_number": "",
    "vessel_name": "",
    "voyage_number": "",
    "port_of_loading": "",
    "port_of_discharge": "",
    "shipper": "",
    "consignee": "",
    "notify_party": "",
    "container_numbers": [],
    "description_of_goods": "",
    "gross_weight_kg": "",
    "net_weight_kg": "",
    "quantity_pieces": "",
    "pipe_schedule": "",  # e.g., "API 5L X65, 20" OD, WT 9.5mm"
    "hs_code": "",
    "invoice_value_usd": "",
    "date_of_shipment": ""
}
```

### Validation Rules (Before SAP Entry)
```python
def validate_bl_data(extracted):
    errors = []
    if not extracted.get('bl_number'):
        errors.append("B/L number missing")
    if extracted.get('gross_weight_kg', 0) < extracted.get('net_weight_kg', 0):
        errors.append("Gross weight less than net weight — extraction error")
    if not re.match(r'\d{8}', extracted.get('hs_code', '')):
        errors.append("HS code format invalid")
    return errors
```

### n8n Workflow Design
1. **Email watch trigger**: New email with attachment in logistics@welspun.com inbox
2. **Filter node**: Check if subject contains "Bill of Lading" or "B/L" or "Packing List"
3. **HTTP Request node**: Send PDF to Google Document AI
4. **Function node**: Parse Document AI JSON response → map to B/L fields
5. **HTTP Request (OpenClaw)**: Clean up extracted text, normalize pipe dimensions to standard format
6. **Function node**: Validate extracted data against rules
7. **IF node**: Validation passed → SAP entry; Failed → flag for manual review
8. **SAP node**: Post via BAPI or write to SAP-ready CSV for batch import
9. **Email node**: Send extraction summary to logistics team

### Estimated Build Time
- Developer: 3–4 days (including SAP integration)
- Google Document AI setup: 1 day
- SAP BAPI setup: 1–2 days (requires SAP BASIS cooperation)

### Cost
- Google Document AI: ~$0.0015/page; typical B/L is 2–3 pages = ~₹0.37 per document
- OpenClaw cleanup: ~$0.01 per B/L
- At 100 shipments/month: ~₹50/month total
- ROI: Eliminates 30–50 hours/month of manual data entry

---

## Related Ideas
- [[014 - Material Certificate Auto-Importer]] — same OCR-to-SAP pattern for MTCs
- [[067 - Export Document Auto-Preparer]] — pre-shipment doc generation that B/L follows
- [[019 - Export Incentive Calculator]] — RoDTEP calculation uses B/L data
- [[080 - Pipe Loading Photographic Record]] — visual record paired with this B/L data
- [[076 - Truck Turnaround Time Tracker]] — same logistics data automation theme

---

## Notes
- B/L formats vary by shipping line — MAERSK, MSC, CMA CGM all have different layouts. Test with at least 10 different B/L formats before going live
- Build a "template library" for the 5 most common shipping lines Welspun uses — these can use pattern matching instead of full AI for higher accuracy
- Always send extracted data to the logistics team for visual review for the first 30 days before any automated SAP posting
