# 070 · Supplier ESG Due Diligence Agent

> **Section**: Supply Chain & Procurement | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety, 🏆
> **Helps**: Mihir, ESG team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
For each key supplier, the agent cross-references their ESG self-assessment claims against news databases (labor disputes, environmental violations), public company filings, and government databases — flagging inconsistencies that could create reputational or supply chain risk for Welspun.

---

## Implementation Blueprint

### Architecture
```
Supplier list (top 50 key suppliers) 
→ For each supplier: 
  1. News search: labor disputes, environmental violations, regulatory actions
  2. Government databases: MCA filings, pollution board orders
  3. Glassdoor/labor feedback (optional)
  4. Supplier's own ESG claims (from their website/reports)
→ OpenClaw: flag inconsistencies + risk summary 
→ Annual ESG due diligence report per supplier
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| News Search | NewsAPI, GDELT, Google News API | ESG incident news |
| Government Data | MCA21 portal, CPCB database, MoEF GreenWatch | Regulatory violations |
| Supplier Filings | Annual reports (if listed company) | Self-reported data |
| LLM Analysis | OpenClaw / GPT-4o | Cross-reference + flag inconsistencies |
| Orchestration | n8n (quarterly review run) | Automate the research process |
| Report | Python `docx` / PDF | Formal due diligence report |

### ESG Dimensions to Check

**Environmental:**
- Environmental violations or notices from CPCB/GPCB/SPCBs
- History of non-compliance with water/air discharge limits
- ISO 14001 certification (verify on ISO website — don't just trust the supplier's claim)
- Reported emissions intensity (cross-check with energy consumption data)

**Social/Labor:**
- Labor disputes, strikes, court cases (MCA filings, news)
- Child labor allegations or violations
- Workplace accident history (DGFASLI database)
- Wages/compliance with Minimum Wages Act (news, labor court cases)

**Governance:**
- Company financial health (risk of supply disruption)
- Related-party transaction issues
- Criminal cases involving directors (MCA director KYC)
- Anti-corruption violations

### Data Sources
```python
esg_data_sources = {
    "news_labor_disputes": {
        "api": "NewsAPI or GDELT",
        "query": f'"{supplier_name}" (strike OR "labor dispute" OR "worker protest" OR "factory closure")',
        "lookback_years": 3
    },
    "news_environmental": {
        "query": f'"{supplier_name}" (pollution OR "environmental violation" OR "fine" OR "CPCB order")',
    },
    "mca_filings": {
        "source": "MCA21 V3 portal (public access)",
        "check": "Annual returns, charges, legal cases",
        "api": "Screener.in API or manual extraction"
    },
    "cpcb_violations": {
        "source": "CPCB GreenWatch database",
        "url": "https://enviscpis.nic.in/NCED_GreenWatch/",
        "check": "Environmental closure notices"
    },
    "iso_certification": {
        "source": "ISO CASCO certification database",
        "url": "https://www.iso.org/certification.html",
        "check": "Verify ISO 9001, 14001, 45001 validity"
    }
}
```

### OpenClaw Analysis Prompt
```
You are an ESG risk analyst reviewing supplier due diligence data.

Given the following information about supplier [Supplier Name]:
- Their ESG self-assessment claims: {{esg_claims}}
- News incidents found: {{news_incidents}}
- Government regulatory actions: {{gov_actions}}
- Financial health indicators: {{financial_data}}

Provide:
1. Overall ESG risk rating: LOW / MEDIUM / HIGH / CRITICAL
2. Key inconsistencies between claims and evidence
3. Specific red flags that require immediate attention
4. Recommended actions for Welspun's procurement team
5. Verification questions to ask the supplier

Be specific. Cite specific incidents or documents where available.
```

### Risk Classification Output
```
ESG DUE DILIGENCE REPORT
Supplier: XYZ Chemicals (PE Resin supplier)
Review Date: 2026-06-01 | Review Type: Annual | Reviewed by: AI Agent

OVERALL RISK: 🟡 MEDIUM

INCONSISTENCIES FOUND (3):
1. Supplier claims ISO 14001 certification, but ISO database shows certification EXPIRED on 2025-09-15
   Evidence: ISO.org certification lookup
   Risk: Environmental management system may not be maintained
   Action: Request updated certificate or confirm renewal timeline

2. Labor dispute news: A workers' union strike reported at supplier's Pune facility (Nov 2025)
   Source: Maharashtra news portal, 3-day strike, resolved
   Evidence link: [URL]
   Risk: LOW — resolved, but monitor for repeat incidents

3. CPCB GreenWatch: Air emissions notice issued to supplier (May 2024)
   Status: Compliance achieved as of Sep 2024 (subsequent filing found)
   Risk: LOW — resolved, but shows history of environmental issues

NO RED FLAGS FOUND FOR:
- Child labor (no news incidents)
- Financial distress (listed company, healthy balance sheet)
- Criminal cases involving directors

RECOMMENDATIONS:
1. Request renewed ISO 14001 certificate before next contract renewal
2. Add ESG performance clause to next supply contract
3. Annual review maintained

Next review due: 2027-06-01
```

### Quarterly vs. Annual Review
- **Top 10 critical/sole-source suppliers**: Quarterly automated check
- **Top 50 key suppliers**: Annual full review
- **All others**: Triggered review if news incident detected

### Estimated Build Time
- Data sources integration: 3 weeks
- LLM analysis pipeline: 1 week
- Report generation: 1 week
- Total: ~5 weeks

### Cost
- NewsAPI: $449/year
- OpenClaw/OpenAI: ~$5–10 per supplier review
- 50 suppliers × $10 = $500/year

---

## Related Ideas
- [[065 - Vendor Reliability Scorecard]] — operational performance companion
- [[010 - Supplier Contract Risk Scanner]] — contractual risk complement
- [[057 - Commodity Sentiment NLP Monitor]] — same NLP pipeline for news analysis
- [[085 - EU CBAM Carbon Certificate Generator]] — Scope 3 emissions reporting for EU customers
- [[100 - Pipe Lifecycle Carbon Tracking]] — supplier emissions feed into full lifecycle carbon

---

## Notes
- ESG due diligence is increasingly required for export customers (EU CSDD Directive, US supply chain transparency laws) — this positions Welspun ahead of future regulatory requirements
- Do not publish ESG risk ratings externally — they are internal working documents for procurement decisions
- For the highest-risk findings, consider engaging a professional ESG due diligence firm (Verisk, EcoVadis) to validate the AI findings before taking contract action
