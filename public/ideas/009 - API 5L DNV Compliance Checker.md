# 009 · API 5L / DNV Compliance Checker

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 🛡️ Safety/Compliance
> **Helps**: PN Mahida | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
LLM reads a Mill Test Certificate (MTC) and cross-checks it against the relevant API 5L grade requirements. Flags non-conformances and outputs a structured compliance pass/fail report in under 60 seconds — what currently takes a QA engineer 20–45 minutes of manual table lookups.

---

## Implementation Blueprint

### Architecture
```
MTC PDF upload → PDF text extractor → 
OpenClaw LLM with embedded API 5L standard requirements → 
Structured pass/fail report → SAP QM update + Teams notification
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| PDF Parsing | `pdfplumber` or AWS Textract | Extract MTC data |
| LLM | OpenClaw / GPT-4o (with large context) | Run compliance check logic |
| Standards Database | PDF embeddings (ChromaDB) or hardcoded tables | API 5L PSL1/PSL2 requirement tables |
| Output | Python `reportlab` PDF | Formal compliance report |
| Orchestration | n8n | Trigger and route |

### Standards to Embed
Build a structured requirements table for each API 5L grade:
```json
{
  "API_5L_X65_PSL2": {
    "yield_strength_min_MPa": 448,
    "yield_strength_max_MPa": 600,
    "tensile_strength_min_MPa": 531,
    "YT_ratio_max": 0.93,
    "elongation_min_pct": 21,
    "carbon_max_pct": 0.18,
    "manganese_max_pct": 1.70,
    "phosphorus_max_pct": 0.025,
    "sulfur_max_pct": 0.015,
    "carbon_equivalent_max": 0.43,
    "CVN_test_required": true,
    "CVN_energy_min_J": 40,
    "CVN_temperature_C": -20
  }
}
```
Also include DNV-OS-F101 supplement requirements for offshore grades.

### Compliance Prompt Template
```
You are an API 5L / DNV compliance QA engineer for a pipe manufacturer.

Given the following Mill Test Certificate data and the applicable standard requirements, 
perform a complete compliance check.

For EACH test result:
1. Extract the actual value from the MTC
2. Compare against the standard requirement  
3. Return PASS or FAIL with the margin (e.g., "PASS — 486 MPa vs 448 MPa min, margin: +38 MPa")

Standard Requirements: {{requirements_json}}
MTC Data: {{mtc_text}}

Return structured JSON:
{
  "overall_result": "PASS/FAIL",
  "pipe_grade": "",
  "heat_number": "",
  "checks": [
    {"parameter": "Yield Strength", "actual": "486 MPa", "required": "≥448 MPa", "result": "PASS", "margin": "+38 MPa"},
    ...
  ],
  "non_conformances": [],
  "warnings": []
}
```

### n8n Workflow Design
1. **Trigger**: Email watch — new MTC email arrives in QA inbox
2. **Extract attachment**: Download PDF attachment
3. **Python node**: `pdfplumber` extracts MTC text
4. **HTTP Request (OpenClaw)**: Run compliance check with embedded standard
5. **IF node**: PASS → proceed; FAIL → escalate
6. **ReportLab node**: Generate formal PDF compliance report with Welspun letterhead
7. **SAP node**: Update QM inspection lot with PASS/FAIL status
8. **Teams node**: Notify PN Mahida — PASS (green card) or FAIL (red card with issues listed)

### Output Report Format
```
WELSPUN CORP — QA COMPLIANCE REPORT
MTC Reference: ST-SAIL-2024-4521
Standard: API 5L Grade X65 PSL-2
Overall Result: ✅ PASS

Chemical Composition:
  Carbon:      0.14% ✅ (max 0.18%)
  Manganese:   1.52% ✅ (max 1.70%)
  Phosphorus:  0.018% ✅ (max 0.025%)
  Sulfur:      0.008% ✅ (max 0.015%)
  CE (IIW):    0.38% ✅ (max 0.43%)

Mechanical Properties:
  Yield Strength:    486 MPa ✅ (min 448 MPa, max 600 MPa)
  Tensile Strength:  568 MPa ✅ (min 531 MPa)
  Y/T Ratio:         0.856 ✅ (max 0.93)
  Elongation:        24.5% ✅ (min 21%)

Checked by AI at 14:23 IST. Manual review required for: None.
```

### Estimated Build Time
- Developer: 2–3 days
- Creating the standards requirements database: 1 additional day

### Cost
- OpenClaw/OpenAI: ~$0.05–0.10 per MTC check
- At 200 MTCs/month: ~$10–20/month
- ROI: Frees ~100+ hours/month of QA engineer time

---

## Related Ideas
- [[014 - Material Certificate Auto-Importer]] — MTC import that feeds this checker
- [[032 - MTC Auto-Generator]] — generates outgoing MTCs; this checks incoming ones
- [[007 - RFP Spec Sheet Reader]] — extracts required specs that this tool checks against
- [[029 - Automated RCA Report Generator]] — if MTC fails, RCA is triggered
- [[098 - Hydrogen Pipeline Compliance AI]] — advanced version for H2 pipeline standards

---

## Notes
- Do NOT rely solely on LLM for safety-critical compliance — always have a QA engineer review FAIL results before rejecting material
- Build in a "borderline" category: values within 5% of limits get a WARN status for human review
- Keep the standards database updated — API 5L and DNV issue new editions; the LLM doesn't auto-update
- Consider embedding the full PDF text of API 5L in a ChromaDB for more nuanced queries
