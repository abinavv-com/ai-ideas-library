# 007 · RFP / Spec Sheet Reader

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida, Mihir's bid team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Uploads a client's PDF Request for Proposal. LLM extracts pipe diameter, wall thickness, steel grade, coating type, delivery schedule, and inspection requirements into a structured summary in 30 seconds — replacing 2–3 hours of manual reading and highlighting by the bid team.

---

## Implementation Blueprint

### Architecture
```
PDF upload (web form or email) → PDF text extractor (pdfplumber/PyPDF2) 
→ OpenClaw / GPT-4o (structured extraction) 
→ JSON output → Excel summary + Teams notification
→ Optional: flag non-standard requirements for QA review
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| UI | Simple web form (HTML + n8n webhook) or email ingestion | Upload RFP PDF |
| PDF Parsing | Python `pdfplumber` or `pypdf` | Extract raw text from PDF |
| OCR Fallback | AWS Textract or Google Document AI | For scanned/image-based PDFs |
| LLM Extraction | OpenClaw / GPT-4o (128k context) | Structured data extraction |
| Output | Excel template + Teams message | Usable summary for bid team |
| Orchestration | n8n | Glue it all together |

### APIs Required
- **OpenAI/OpenClaw API** — `POST /chat/completions` with PDF text in prompt
- **AWS Textract** (if scanned PDFs) — `POST /document-text-detection` — ~$0.0015/page
- **Google Document AI** (alternative to Textract) — ~$0.0015/page
- **Microsoft Graph API** — optional, to post summary to Teams channel

### Extraction Prompt Template
```
You are a pipe procurement specialist. Extract the following from this RFP/specification document.
Return a structured JSON with these exact fields:

{
  "pipe_type": "LSAW/HSAW/DI/ERW/Seamless",
  "outer_diameter_mm": [],
  "wall_thickness_mm": [],
  "steel_grade": [],
  "total_quantity_tons": "",
  "coating_type": "3LPE/3LPP/FBE/None/Bare",
  "coating_thickness_mm": "",
  "inspection_requirements": [],
  "standards_referenced": ["API 5L", "DNV", "ISO..."],
  "delivery_schedule": "",
  "delivery_location": "",
  "end_use": "oil/gas/water/structural",
  "special_requirements": [],
  "submission_deadline": ""
}

If a field is not mentioned, use null.
Document: {{pdf_text}}
```

### n8n Workflow Design
1. **Webhook trigger**: Form submission with PDF file upload
2. **Execute Command node**: Run `pdfplumber` Python script → extract text
3. **IF node**: Check if text extraction worked (>100 chars); if not → route to Textract
4. **HTTP Request (OpenClaw)**: Send text + extraction prompt
5. **Function node**: Parse JSON response, validate required fields present
6. **Spreadsheet node**: Write to Excel template (`RFP_Summary.xlsx`)
7. **Teams node**: Post structured summary + attach Excel to bid team channel
8. **IF node**: If `special_requirements` array is not empty → tag PN Mahida for QA review

### Output Format (Teams Card)
```
📋 NEW RFP PROCESSED: Saudi Aramco Pipeline Project

Pipe: LSAW | OD: 914mm (36") | WT: 14.3mm | Grade: X65
Quantity: 12,500 tons | Coating: 3LPE (3.5mm min)
Delivery: Dammam Port | Schedule: 6 months from PO date
Standards: API 5L PSL-2, DNV-OS-F101, ARAMCO-SAES-L-068

⚠️ Special Requirements:
- Sour service (H2S) — requires HIC/SSC testing per NACE MR0175
- Third-party inspection: Bureau Veritas (BV) mandatory

Submitted by: [uploader name] | Processing time: 28 seconds
```

### Estimated Build Time
- Developer: 2–3 days
- Non-developer with n8n + OpenClaw account: 3–5 days

### Cost
- OpenClaw/OpenAI: ~$0.02–0.05 per RFP (long context)
- AWS Textract (if needed): ~$0.15 per 100 pages
- n8n: Free

---

## Related Ideas
- [[009 - API 5L DNV Compliance Checker]] — next step after extraction: check if Welspun can meet specs
- [[059 - Bid Data Assembler]] — feeds extracted specs into bid preparation
- [[010 - Supplier Contract Risk Scanner]] — same PDF extraction pattern, different document type
- [[007 - RFP Spec Sheet Reader]] — self
- [[035 - Operator Skill-to-Project Matcher]] — feeds extracted requirements to skills matching

---

## Notes
- Many RFPs are 100–300 pages. Send text in chunks if exceeding 128k context limit — extract chapter by chapter and merge JSON results
- Build a "spec deviation flag" — if extracted specs are outside Welspun's standard manufacturing range (e.g., OD > 1422mm), auto-flag as requiring engineering review before bidding
- Store all processed RFPs in a searchable database for historical reference
