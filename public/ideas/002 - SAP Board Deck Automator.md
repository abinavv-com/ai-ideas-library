# 002 · SAP → Board Deck Automator

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency, 💰 Cost Savings
> **Helps**: Mahesh, Sarados | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Pulls monthly SAP exports, populates Excel templates, generates charts, and drafts a board-ready PowerPoint — reducing Mahesh's 10-day close to 2 days. The deck is 80% done on Day 1 of month-end; Mahesh reviews and adjusts narrative only.

---

## Implementation Blueprint

### Architecture
```
SAP (scheduled export or RFC call) → n8n 
→ Excel template population (openpyxl/xlwings) 
→ Chart generation (matplotlib or embedded Excel charts) 
→ PowerPoint assembly (python-pptx) 
→ OpenClaw LLM (narrative commentary) 
→ SharePoint / email delivery to Mahesh
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Orchestration | n8n | Trigger, data routing |
| SAP Data | SAP RFC / OData API or scheduled CSV export | Source of truth |
| Excel Manipulation | Python `openpyxl` or `xlwings` | Populate financial templates |
| Chart Generation | `matplotlib` + `python-pptx` or Excel charts | Visual slides |
| Deck Assembly | `python-pptx` (Python library) | Build .pptx programmatically |
| Commentary | OpenClaw / GPT-4o | Write "CFO narrative" per slide |
| Delivery | SharePoint API or Outlook via Graph API | Send to Mahesh |

### APIs Required
- **SAP RFC / BAPI** — `BAPI_PROFITCENTER_GETLIST`, custom RFC for CO/FI data extracts, or use SAP OData API if S/4HANA
- **Microsoft Graph API** — `PUT /sites/{id}/drive/items/{id}/content` to upload to SharePoint; `POST /me/sendMail` for email delivery
- **OpenClaw/OpenAI API** — chat completions for slide commentary generation

### n8n Workflow Design
1. **Cron trigger**: 1st of every month at 07:00
2. **HTTP Request node**: Call SAP RFC/OData to pull P&L, volume, working capital, order book data
3. **Execute Command node**: Run Python script → populates Excel template + generates charts
4. **Execute Command node**: Run `python-pptx` script → assembles PowerPoint with charts and tables
5. **HTTP Request (OpenClaw) node**: For each slide section, send the numbers and get a 3-line narrative comment
6. **Microsoft Teams / Email node**: Send draft deck to Mahesh with "Ready for review" message

### PowerPoint Template Design
- Slide 1: Executive Summary (auto-filled KPIs)
- Slide 2: Revenue & Volume by product line (LSAW/HSAW/DI)
- Slide 3: Cost breakdown vs. budget
- Slide 4: Working capital position
- Slide 5: Order book and pipeline
- Slide 6: Key risks and action items (LLM-generated)

### Build Steps
1. Work with Mahesh to capture the current board deck template → create a `pptx` master template
2. Map each data field in the deck to its SAP table/field source
3. Build Python scripts: `sap_extract.py` → `excel_populate.py` → `pptx_assemble.py`
4. Set up n8n workflow with monthly cron trigger
5. Test with last 3 months of data to validate numbers match manual deck
6. Run in parallel with manual process for 1 month before going live

### Estimated Build Time
- Developer: 3–5 days
- With SAP RFC access setup: add 2–3 days

### Cost
- n8n: Free (self-hosted) or $20/month cloud
- Python scripts: Free open-source libraries
- OpenClaw/OpenAI: ~$10/month for narrative generation
- **ROI**: Eliminates ~8 person-days of Mahesh's team time per month

---

## Related Ideas
- [[001 - Meeting Action Item Compiler]] — same n8n orchestration pattern
- [[083 - Project-Level Profitability Tracker]] — feeds data into this deck
- [[081 - Real-Time Working Capital Dashboard]] — live version of the deck's working capital slide
- [[090 - Management Dashboard]] — executive dashboard that complements this deck
- [[086 - Financial Scenario Stress-Tester]] — what-if scenarios that feed into board narrative

---

## Notes
- Start with a semi-automated version: Python pulls data, populates Excel only — Mahesh's team still assembles the deck. Then phase 2 adds full pptx automation.
- Keep a "manual override" section in each slide for Mahesh to add context that no model can know (e.g., a key customer negotiation).
