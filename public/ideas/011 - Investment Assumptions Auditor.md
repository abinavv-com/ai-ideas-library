# 011 · Investment Assumptions Auditor

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh, board members | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Reads a CapEx proposal and automatically cross-checks stated assumptions (steel price, energy cost, capacity utilization) against current live market data. Flags where assumptions are more optimistic than market reality — preventing board approval of investments built on stale numbers.

---

## Implementation Blueprint

### Architecture
```
CapEx proposal PDF/Excel upload 
→ LLM extracts stated assumptions 
→ Live market data APIs (steel, energy, FX) 
→ Comparison engine 
→ Risk-flagged assumption report
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Document Parsing | `pdfplumber` / `openpyxl` | Extract assumptions from proposal |
| LLM | OpenClaw / GPT-4o | Extract structured assumption list |
| Market Data | Alpha Vantage, SteelMint API, POSOCO energy data | Live benchmarks |
| Comparison | Python | Flag optimistic vs. conservative assumptions |
| Output | `python-pptx` / `reportlab` | Annotated assumption audit report |

### Assumption Categories to Extract
The LLM extracts these from the CapEx proposal:
- Steel/material cost assumptions (₹/ton)
- Energy cost (₹/kWh, gas price)
- Capacity utilization (%)
- Labor productivity assumptions
- Selling price / revenue assumptions
- FX rate (USD/INR) for imported equipment
- Project completion timeline
- Market demand growth rate

### Market Data Sources
```python
assumptions = {
    "steel_HRC_INR_per_ton": {
        "source": "SteelMint India RSS feed or manual input",
        "api": "https://www.steelmint.com/rss_feed.xml",
        "current": fetch_current_price()
    },
    "electricity_INR_per_kWh": {
        "source": "RERC (Rajasthan Energy Regulatory Commission) published tariffs",
        "current": 7.20  # Updated manually monthly
    },
    "USD_INR": {
        "source": "Alpha Vantage API",
        "api": "CURRENCY_EXCHANGE_RATE endpoint",
        "current": fetch_fx_rate()
    }
}
```

### Comparison Logic
```python
def flag_assumption(stated, current, tolerance_pct=5):
    deviation = (stated - current) / current * 100
    if deviation > 10:
        return "HIGH_RISK", f"Stated {stated} vs market {current} (+{deviation:.1f}% optimistic)"
    elif deviation > 5:
        return "MEDIUM_RISK", f"Slightly optimistic vs current market"
    else:
        return "PASS", "Within acceptable range"
```

### Prompt for Assumption Extraction
```
Extract all financial and operational assumptions from this CapEx proposal.
For each assumption find: the stated value, the unit, and the page/section reference.
Return as JSON array: [{"assumption": "Steel price", "stated_value": 52000, "unit": "INR/ton", "source_section": "Page 4, Section 2.1"}]
Proposal: {{document_text}}
```

### Output Report
```
CAPEX ASSUMPTION AUDIT — DI Pipe Capacity Expansion ₹250Cr
Audited: 2026-06-01

🔴 HIGH RISK ASSUMPTIONS (2):
1. Steel Price: Stated ₹48,000/ton vs Current ₹54,200/ton (+12.9% underestimated)
   → NPV impact: ₹18Cr negative over 5-year plan

2. USD/INR: Stated 82.0 vs Current 85.7 (+4.5% — imported equipment cost underestimated)
   → Equipment cost impact: +₹3.2Cr

🟡 MEDIUM RISK (1):
3. Capacity Utilization Year 1: Stated 80% vs Industry average 65% for new lines
   → Revenue timing risk; consider phased ramp-up

🟢 CONSERVATIVE/REASONABLE (4):
4-7: Energy cost, labor, maintenance, contingency — all within market range
```

### Estimated Build Time
- Developer: 2–3 days
- Market data setup: 1 additional day for sourcing and validating data feeds

### Cost
- OpenClaw/OpenAI: ~$0.10 per proposal
- Alpha Vantage: Free tier or $50/month premium
- Total: Near zero ongoing cost

---

## Related Ideas
- [[005 - USD INR Oil Price Alert System]] — real-time rates feed into this tool
- [[002 - SAP Board Deck Automator]] — CapEx ROI appears in board deck
- [[084 - CapEx ROI Tracker]] — post-commissioning tracking of same assumptions
- [[086 - Financial Scenario Stress-Tester]] — stress-tests the CapEx financials
- [[060 - Monte Carlo Bid Margin Simulator]] — same Monte Carlo logic for bid margins

---

## Notes
- Build a "historical accuracy" tracker: compare stated assumptions from past CapEx proposals to actual outcomes — shows board whether Welspun systematically over- or under-estimates
- Add an "economic sensitivity table": shows what happens to NPV if steel price is +10%, +20%, -10%
