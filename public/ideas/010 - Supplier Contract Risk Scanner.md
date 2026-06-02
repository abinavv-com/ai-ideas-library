# 010 · Supplier Contract Risk Scanner

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 🛡️ Safety, 💰 Cost Savings
> **Helps**: Mihir, procurement team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Feeds vendor contracts into an LLM that identifies unfavorable clauses — high penalty rates, one-sided force majeure language, missing delivery guarantees — and outputs a risk summary for legal review. Turns a 2-day legal review into a 5-minute pre-screening.

---

## Implementation Blueprint

### Architecture
```
Contract PDF upload (web form or email) 
→ PDF text extractor → OpenClaw LLM (risk extraction) 
→ Structured risk report (Red/Amber/Green per clause type) 
→ Teams notification to Mihir + legal team
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| UI | Simple web form or email ingestion | Contract upload |
| PDF Parsing | `pdfplumber` + AWS Textract for scanned docs | Text extraction |
| LLM | OpenClaw / GPT-4o (128k context for long contracts) | Risk clause identification |
| Output | Python `reportlab` or DOCX generation | Formal risk report |
| Orchestration | n8n | Trigger and workflow |

### Risk Categories to Scan For
Build a comprehensive risk framework:

```json
{
  "risk_categories": [
    "penalty_clauses",
    "liability_caps",
    "force_majeure",
    "payment_terms",
    "delivery_guarantees",
    "termination_rights",
    "IP_ownership",
    "dispute_resolution_jurisdiction",
    "price_escalation_clauses",
    "material_substitution_rights",
    "inspection_rights",
    "audit_rights",
    "subcontracting_restrictions"
  ]
}
```

### Risk Prompt Template
```
You are a procurement legal risk analyst for a pipe manufacturer in India.
Review this vendor contract and identify ALL risk clauses.

For each risk found:
1. Identify the clause type from: [penalty, liability, force_majeure, payment, delivery, termination, IP, jurisdiction, price_escalation, other]
2. Quote the exact problematic text
3. Explain why it's risky (in plain English)
4. Rate severity: HIGH / MEDIUM / LOW
5. Suggest what Welspun should negotiate to instead

Contract text: {{contract_text}}

Return JSON array of findings.
```

### Red Flag Examples (Pre-programmed)
Also check with regex/keyword patterns for instant flagging before LLM:
- Penalty > 2% per week → HIGH RISK
- "Sole discretion of supplier" → MEDIUM RISK
- "Governing law: [foreign jurisdiction]" → MEDIUM RISK
- No delivery guarantee clause → HIGH RISK
- Automatic annual price increase without cap → HIGH RISK
- Supplier can substitute materials without notice → HIGH RISK

### n8n Workflow Design
1. **Webhook trigger**: Contract PDF uploaded via web form
2. **Python node**: Extract text (pdfplumber → if fails → Textract)
3. **HTTP Request (OpenClaw)**: Send contract chunks (if >100 pages, process in sections)
4. **Function node**: Merge results, de-duplicate, sort by severity
5. **Function node**: Count RED/AMBER/GREEN findings
6. **ReportLab node**: Generate PDF risk report
7. **Teams / Email node**: Send to Mihir with summary:
   - `🔴 3 HIGH risk clauses found`
   - `🟡 5 MEDIUM risk clauses found`
   - `🟢 Contract covers delivery guarantee, payment terms, IP`

### Output Risk Report Structure
```
SUPPLIER CONTRACT RISK ASSESSMENT
Vendor: ABC Steel Suppliers Ltd | Contract Ref: SCM-2026-047
Reviewed: 2026-06-01 | Overall Risk: HIGH

🔴 HIGH RISK FINDINGS (3):
1. PENALTY CLAUSE — "Purchaser liable for 5% per week delay"
   Clause 7.2, Page 12 | Industry standard: 0.5–1.5%/week
   Negotiate: Cap at 1% per week, max 10% of contract value

2. NO DELIVERY GUARANTEE — Contract has no supplier delivery commitment...
   [etc.]
```

### Estimated Build Time
- Developer: 2–3 days
- Non-developer with n8n + OpenClaw: 4–5 days

### Cost
- OpenClaw/OpenAI: ~$0.10–0.30 per contract (long documents)
- AWS Textract (scanned contracts): ~$0.015 per page
- Value: Prevents a single unfavorable penalty clause from costing ₹50L+

---

## Related Ideas
- [[007 - RFP Spec Sheet Reader]] — same PDF extraction architecture
- [[011 - Investment Assumptions Auditor]] — LLM-reads-document risk pattern
- [[065 - Vendor Reliability Scorecard]] — operational performance complement to contractual risk
- [[070 - Supplier ESG Due Diligence Agent]] — ESG risk layer on top of contractual risk
- [[018 - Freight Invoice Auditor]] — downstream: check if invoices comply with contract terms

---

## Notes
- This is a PRE-SCREENING tool, not a replacement for legal review — always have counsel review HIGH-risk findings
- Build a "known good" clause library: Welspun's preferred contract language for each clause type, for comparison
- Over time, track which vendor types have higher risk profiles — creates a vendor contracting intelligence database
