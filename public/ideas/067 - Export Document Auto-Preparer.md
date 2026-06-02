# 067 · Export Document Auto-Preparer

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Mihir's logistics team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Given a completed export order, automatically generates: packing list, fumigation certificate request, combined certificate of origin data, and customs declaration draft — cutting 4–6 hours of export admin per shipment into a 15-minute review task.

---

## Implementation Blueprint

### Architecture
```
SAP SD export order (confirmed, ready to ship) 
→ n8n triggers document generation workflow 
→ Python templates → 
  1. Packing list PDF (from SAP SD data)
  2. Certificate of origin data form
  3. Fumigation certificate request (to fumigation agency)
  4. Customs declaration draft (for CHA)
→ All documents in a ZIP package → email to logistics coordinator + CHA
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP SD (delivery/billing documents) | All shipment data |
| Orchestration | n8n | Trigger + coordinate |
| Document Generation | Python `reportlab` + `python-docx` + `openpyxl` | Create PDFs/Word/Excel |
| Packing List | ReportLab PDF | Formatted packing list |
| CO Application | Form template auto-fill | EEPC/chamber application |
| Customs Declaration | Excel template | CHA input format |
| Delivery | Email via Outlook API | Send to all parties |

### Document 1: Packing List (Auto-Generated from SAP)
```python
def generate_packing_list(delivery_number):
    # Pull from SAP SD
    delivery = sap_get_delivery(delivery_number)
    
    packing_data = {
        "exporter": "WELSPUN CORP LTD, ANJAR, GUJARAT",
        "consignee": delivery['ship_to_party_address'],
        "notify_party": delivery['notify_party'],
        "vessel": delivery['vessel_name'],
        "port_of_loading": "Mundra Port, Gujarat, India",
        "port_of_discharge": delivery['discharge_port'],
        "bl_number": "",  # Filled by shipping line
        "date": delivery['actual_gi_date'],
        
        "line_items": [
            {
                "item_no": item['position'],
                "description": f"{item['material_description']} — API 5L Grade {item['grade']}",
                "pipe_size": f"{item['od_mm']}mm OD × {item['wt_mm']}mm WT",
                "no_pieces": item['quantity'],
                "net_weight_kg": item['net_weight'],
                "gross_weight_kg": item['gross_weight'],
                "length_range": f"{item['min_length_m']}–{item['max_length_m']}m",
                "heat_numbers": item['heat_numbers'],
                "hs_code": item['hs_code']
            }
            for item in delivery['line_items']
        ]
    }
    
    return generate_packing_list_pdf(packing_data)
```

### Document 2: Certificate of Origin Application
The CO application for EEPC or Chamber of Commerce requires:
- Exporter details (Welspun's IE Code, GSTIN, address)
- Consignee details
- Description of goods with HS codes
- Country of origin statement

```python
def generate_co_application(delivery):
    co_data = {
        "exporter_name": "WELSPUN CORP LTD",
        "ie_code": "0893021456",  # Import-Export Code
        "gstin": "24AACCW2103Q1Z1",
        "consignee": delivery['consignee'],
        "invoice_number": delivery['invoice_number'],
        "invoice_date": delivery['invoice_date'],
        "invoice_value_usd": delivery['total_value_usd'],
        "goods_description": generate_co_goods_description(delivery['items']),
        "country_of_origin": "INDIA",
        "destination_country": delivery['destination_country'],
        "hs_codes": [item['hs_code'] for item in delivery['items']]
    }
    
    # Generate application for EEPC portal or Chamber application form
    return fill_co_form_template(co_data)
```

### Document 3: Fumigation Certificate Request
For wooden packing material exports — ISPM-15 compliance:
```python
def generate_fumigation_request(delivery):
    if not delivery.get('has_wooden_packing'):
        return None  # No fumigation needed if no wood
    
    request = {
        "to": "FUMIGATION_AGENCY_EMAIL",
        "subject": f"Fumigation Request — {delivery['invoice_number']}",
        "body": f"""
Dear Sir/Madam,

Please arrange fumigation for the below cargo:
Exporter: Welspun Corp Ltd
Shipment: {delivery['invoice_number']}
Cargo: {delivery['total_weight_mt']} MT Pipes
Wooden packing: {delivery['wooden_packing_description']}
Vessel: {delivery['vessel_name']}
ETD: {delivery['etd']}
Port: Mundra

Please confirm appointment at: logistics@welspun.com
        """
    }
    return request
```

### Document 4: Customs Declaration (For CHA)
```python
def generate_customs_declaration(delivery):
    """Generate shipping bill data in CHA/customs format"""
    return {
        "exporter_iec": "0893021456",
        "invoice_number": delivery['invoice_number'],
        "port_code": "INMUN4",  # Mundra port code
        "destination_country": delivery['destination_country'],
        "currency": delivery['currency'],
        "total_fob_value": delivery['fob_value'],
        "shipping_bill_type": determine_sb_type(delivery),  # Free, RODTEP, Bond
        "line_items": [
            {
                "hs_code": item['hs_code'],
                "description": item['export_description'],
                "quantity": item['quantity'],
                "unit": "MTS",  # Metric tons
                "unit_price_usd": item['unit_price'],
                "rodtep_applicable": check_rodtep_eligibility(item['hs_code'])
            }
            for item in delivery['items']
        ]
    }
```

### Final Package Delivery
```
n8n sends email to logistics coordinator:
Subject: Export Documents Ready — Invoice INV-2026-4521

Attached:
1. Packing List — INV-2026-4521.pdf ✅
2. CO Application — INV-2026-4521_CO.xlsx ✅
3. Fumigation Request — INV-2026-4521_Fumigation.docx ✅ (if applicable)
4. Customs Declaration Data — INV-2026-4521_CHA.xlsx ✅

Please review and forward:
• Packing list → shipping line / vessel agent
• CO application → EEPC online portal (https://www.eepcindia.org)
• Fumigation request → [Fumigation agency contact]
• CHA data → [CHA name] at [CHA email]

Auto-generated in 22 seconds. Please verify all details before submission.
```

### Estimated Build Time
- SAP SD data extraction: 2 days
- Document templates: 3 days
- Email automation: 1 day
- Total: ~1 week

---

## Related Ideas
- [[012 - Bill of Lading OCR Extractor]] — B/L data feeds back into this workflow
- [[019 - Export Incentive Calculator]] — RoDTEP claim calculation uses these documents
- [[063 - Tariff Impact CBAM Exposure Calculator]] — CBAM documentation required for EU shipments
- [[080 - Pipe Loading Photographic Record]] — photos accompany these shipping documents
- [[068 - Competitor Intelligence Monitor]] — same logistics team receives competitive intelligence

---

## Notes
- Each country has different CO requirements — Saudi Arabia needs an Arab Chamber CO, EU needs EUR.1, USA needs a specific format. Build a "CO type selector" by destination country.
- Always include a "review before submitting" reminder in the email — auto-generated documents can have data errors from SAP if production orders have incomplete information
- Store all generated documents in a SharePoint folder by shipment number — provides searchable archive for dispute resolution
