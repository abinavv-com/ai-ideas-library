# 029 · Automated RCA Report Generator

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Pawan Kathayat | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
When a defect batch is logged in SAP QM, an AI agent automatically queries production parameters, pulls QA records, and drafts a structured Root Cause Analysis report in 10 minutes — what currently takes 2–5 days of manual data gathering by Pawan Kathayat's team.

---

## Implementation Blueprint

### Architecture
```
SAP QM defect lot created (trigger) 
→ n8n automatically queries: 
   - SAP PP (production parameters at time of defect)
   - SAP QM (inspection results, defect types, quantities)
   - Maintenance history (recent work on relevant machines)
   - Flux/material batch records
→ OpenClaw LLM (DoWhy causal reasoning + RCA structure) 
→ Draft 8D / Ishikawa RCA report 
→ Pawan Kathayat reviews + edits + approves
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Trigger | SAP QM defect lot webhook or n8n SAP polling | Detect new defect batches |
| Data Gathering | n8n SAP RFC calls + maintenance DB query | Collect context automatically |
| Causal AI | Python `DoWhy` library or `causalnex` | Causal analysis of parameters |
| LLM | OpenClaw / GPT-4o | Draft structured RCA narrative |
| Output | Python `docx` template | Formatted RCA Word document |
| Review | SharePoint + Teams | Pawan reviews draft |

### 8D Report Structure (Auto-Generated)
```
ROOT CAUSE ANALYSIS — 8D REPORT
Defect Batch: QM-2026-0421 | Date: 2026-06-01
Product: LSAW 20" × 14.3mm, API 5L X65 PSL-2
Defect Type: Porosity (SAW seam weld)
Quantity Affected: 23 pipes | Production Order: PR-2026-4521

D1 — TEAM:
[Auto-populated from current shift assignments]
Lead: Pawan Kathayat | QA: PN Mahida | Production: Line Supervisor

D2 — PROBLEM DESCRIPTION:
23 pipes from Heat 2024H-45221, production batch 2026-06-01 morning shift,
found with porosity indications during radiographic testing at positions 
200–800mm from pipe start. AI-extracted from SAP QM records.

D3 — INTERIM CONTAINMENT:
[Auto-suggested based on defect type:]
- All 23 pipes quarantined to Hold Bay 3
- Downstream QA release halted for remaining pipes from same production run
- X-ray inspection 100% on next 20 pipes produced

D4 — ROOT CAUSE ANALYSIS:
[ML-assisted causal analysis:]

Ishikawa Analysis (AI-generated, requires human validation):

MACHINE:
- SAW wire feed speed: 2.3 m/min (vs. WPS: 2.0±0.1 m/min) ← DEVIATION FOUND
- Flux hopper humidity sensor: 78% recorded at 07:15 (alert threshold: 75%)

MATERIAL:
- Flux batch: FX-2024-889 — received 2026-05-28
- No pre-drying log entry found for this batch ← POSSIBLE CAUSE

METHOD:
- WPS-LSAW-004 Rev 2 specifies flux pre-drying at 300°C × 1hr when ambient humidity >70%
- Ambient humidity on morning of 2026-06-01: 81% (weather data: Anjar, Gujarat)

MANPOWER:
- Operator: OP-0042 (Ramesh Kumar) — defect rate: 2.1% (plant avg: 2.9%) ← NOT A FACTOR

PROBABLE ROOT CAUSE:
High ambient humidity (81%) + flux batch FX-2024-889 not pre-dried per WPS requirement → 
moisture absorbed by flux → hydrogen porosity in weld deposit.

Confidence: HIGH (87%) — based on correlation of humidity spike + no drying log + SAW speed deviation.

D5 — PERMANENT CORRECTIVE ACTION:
1. Mandatory flux pre-drying log before start of welding on all shifts when humidity >70%
2. Automatic SAP production block if humidity sensor >75% (see Idea [[028 - Flux Moisture Contamination Detector]])
3. Revise WPS-LSAW-004 to add humidity check as mandatory pre-production checklist item

D6 — IMPLEMENTATION PLAN:
[Auto-populated with responsible persons + SAP action items]

D7 — EFFECTIVENESS VERIFICATION:
Verify: Re-check 50 pipes produced after corrective action. Target: Zero porosity in next 200 pipes.

D8 — CLOSURE:
[Manual — Pawan Kathayat signs off]
```

### Data Gathering Logic (n8n Agent)
```python
def gather_rca_context(defect_lot_number):
    # Get defect details from SAP QM
    defect_info = sap_get_defect_lot(defect_lot_number)
    
    # Get production parameters at time of defect
    prod_params = sap_get_production_order_params(defect_info['prod_order'])
    
    # Get maintenance history (last 7 days) for relevant machines
    maintenance = sap_get_pm_history(
        equipment=prod_params['line'],
        days_back=7
    )
    
    # Get flux/material batch info
    material_batch = sap_get_material_batch(prod_params['flux_batch'])
    
    # Get weather data (external API for ambient conditions)
    weather = get_weather_historical(date=defect_info['date'], location='Anjar, Gujarat')
    
    # Get operator performance data
    operator_stats = get_operator_defect_rate(prod_params['operator_id'])
    
    return compile_context_package(defect_info, prod_params, maintenance, material_batch, weather, operator_stats)
```

### LLM Prompt for RCA Narrative
```
You are a quality engineer generating an 8D Root Cause Analysis report.

Given the following production and defect data, complete the RCA:
1. Describe the problem clearly
2. Identify all deviations from standard (highlight in the data)
3. Propose the most likely root cause using Ishikawa (5M) framework
4. Suggest corrective actions based on the root cause
5. Flag any items needing manual investigation

Be specific. Use exact numbers from the data. Mark your confidence level for the root cause.

Context Data: {{compiled_context}}
Defect Type: {{defect_type}}
```

### Estimated Build Time
- n8n data gathering workflow: 3–4 days (SAP integration is the hard part)
- LLM + report generation: 2 days
- Template design (8D format): 1 day
- Total: ~1 week

### Cost
- OpenClaw/OpenAI: ~$0.10–0.30 per RCA report (long context)
- n8n: Free
- ROI: Each RCA currently takes 16–40 person-hours; automation saves 90% of that

---

## Related Ideas
- [[027 - Welding Operator Defect Correlation Tracker]] — operator data fed into RCA
- [[028 - Flux Moisture Contamination Detector]] — equipment-side cause identified in RCA
- [[021 - X-Ray Weld Defect Detector]] — defect source that triggers this RCA
- [[054 - Machine Breakdown RCA Knowledge Base]] — similar RCA approach for equipment
- [[030 - QA Sign-Off Queue Prioritizer]] — RCA completion needed before lot release

---

## Notes
- The RCA draft is always a starting point, not a finished document — Pawan's engineering judgment is essential for the causal interpretation
- Build a "closed RCAs" knowledge base — over time, the LLM can reference similar past RCAs to suggest proven corrective actions
- DoWhy library for causal inference works well when you have structured parameter data; for pure narrative generation, OpenClaw alone is sufficient initially
