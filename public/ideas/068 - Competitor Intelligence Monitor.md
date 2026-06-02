# 068 · Competitor Intelligence Monitor

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 🏆 Competitive
> **Helps**: Sarados, Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Weekly web scraper monitors Jindal SAW, Ratnamani, and Man Industries' press releases, tender wins, capacity expansions, and pricing indications across public sources — delivering a structured competitor briefing to the leadership team every Monday morning.

---

## Implementation Blueprint

### Architecture
```
n8n weekly (Saturday night) → 
Playwright web scraper: Jindal SAW, Ratnamani, Man Industries, JSW Steel 
+ RSS feeds: business news, tender portals, industry publications 
→ OpenClaw LLM: classify + summarize findings 
→ Structured weekly briefing → Teams + email to Sarados/Mihir
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Web Scraping | Playwright (headless browser) | Scrape company investor pages + news |
| RSS Sources | Multiple industry RSS feeds | Automated news collection |
| LLM Processing | OpenClaw / GPT-4o | Classify + summarize findings |
| Orchestration | n8n (weekly cron) | Schedule + coordinate |
| Output | Teams message + formatted email | Weekly competitive brief |
| Archive | Google Sheet | Historical intel database |

### Sources to Monitor

**Competitor Annual Reports + IR Pages:**
- Jindal SAW: `https://www.jindalsaw.com/investor-relations`
- Ratnamani Metals: `https://www.ratnamani.com/investors`
- Man Industries: `https://www.manindustries.com/investors`
- ISMT: `https://www.ismtltd.com`

**Government Tender Portals:**
- GeM portal: `https://gem.gov.in`
- CPPP (Central Public Procurement): `https://eprocure.gov.in`
- Jal Jeevan Mission tenders: `https://jjm.gov.in`
- Oil India, ONGC, GAIL tenders

**News Sources:**
- Business Standard, Economic Times (steel section RSS)
- Steel360, SteelMint
- Petroleum sector news (pipelines)

### Playwright Scraper (Selective)
```python
from playwright.async_api import async_playwright

async def scrape_competitor_news(company_url, days_back=7):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(company_url)
        
        # Extract press releases from last 7 days
        press_releases = await page.evaluate("""() => {
            const items = document.querySelectorAll('.press-release-item, .news-item');
            return Array.from(items).map(item => ({
                title: item.querySelector('h3, h4')?.textContent?.trim(),
                date: item.querySelector('.date')?.textContent?.trim(),
                link: item.querySelector('a')?.href,
                excerpt: item.querySelector('p')?.textContent?.trim()
            }));
        }""")
        
        await browser.close()
        return filter_by_date(press_releases, days_back=7)
```

### Intelligence Categories to Track
```python
intelligence_categories = {
    "capacity_expansion": {
        "keywords": ["capacity", "expansion", "new plant", "brownfield", "capex"],
        "significance": "HIGH",
        "action": "Assess impact on market capacity and pricing"
    },
    "tender_wins": {
        "keywords": ["awarded", "contract win", "L1 bidder", "selected"],
        "significance": "HIGH",
        "action": "Analyze winning price if disclosed; identify market positioning"
    },
    "new_product": {
        "keywords": ["new product", "certification", "API", "hydrogen", "new grade"],
        "significance": "MEDIUM",
        "action": "Assess capability gap vs. Welspun"
    },
    "financial_distress": {
        "keywords": ["loss", "write-down", "debt", "NCLT", "restructuring"],
        "significance": "MEDIUM",
        "action": "Potential pricing desperation or market exit"
    },
    "management_change": {
        "keywords": ["MD appointed", "CEO", "CFO", "board change"],
        "significance": "LOW",
        "action": "Monitor for strategic direction change"
    },
    "pricing_signal": {
        "keywords": ["price hike", "price reduction", "discount", "rate revision"],
        "significance": "HIGH",
        "action": "Immediate review of open bids and pricing strategy"
    }
}
```

### OpenClaw Classification Prompt
```
You are a competitive intelligence analyst for Welspun Corp, an Indian pipe manufacturer.
Classify this news item about a competitor:

1. Category: [capacity_expansion / tender_win / new_product / financial_distress / pricing_signal / management / other]
2. Significance: [HIGH / MEDIUM / LOW]
3. Competitor: [Jindal SAW / Ratnamani / Man Industries / Other]
4. 2-sentence summary of what happened
5. 1-sentence implication for Welspun
6. Recommended action (if any)

News item: {{text}}
```

### Weekly Competitive Briefing
```
📊 COMPETITIVE INTELLIGENCE BRIEF — Week of 2026-06-02
Prepared for: Sarados, Mihir | Compiled: 200+ sources monitored

🔴 HIGH PRIORITY:
1. JINDAL SAW — CAPACITY EXPANSION
   Announced ₹850Cr capex for 500,000 ton/year capacity addition at Kosi Kalan
   ETA: 24 months
   Welspun implication: Competitive pressure increases in X65–X70 segment from H2 2027
   Action: Accelerate HSAW Line 3 decision before Jindal comes online

2. RATNAMANI — TENDER WIN
   Awarded ₹1,800Cr GPCL pipeline project (50cm diameter, 400km, Gujarat)
   Winning price reportedly ₹87,000/ton (market expected ₹92,000)
   Welspun implication: Ratnamani is pricing aggressively — review our Gujarat bids
   Action: Mihir to check margin assumptions on pending GPCL-2 bid

🟡 MEDIUM PRIORITY:
3. MAN INDUSTRIES — FINANCIAL UPDATE
   Q4 FY26 reported 12% revenue decline; management change (new CFO appointed)
   Implication: Watch for pricing desperation on upcoming bids

🟢 INFORMATIONAL:
4. Industry tender new: JJM Phase-2 tenders worth ₹4,200Cr expected July-August 2026
   All major players likely to bid. Capacity check needed.

[Full detail view] [Archive to competitive database] [Forward to Sarados]
```

### Estimated Build Time
- Playwright scrapers: 3–4 days
- RSS collection + OpenClaw classification: 2 days
- Teams briefing format: 1 day
- Total: ~1 week

### Cost
- OpenClaw/OpenAI: ~$15–30/week for processing
- Playwright: Free
- n8n: Free

---

## Related Ideas
- [[057 - Commodity Sentiment NLP Monitor]] — same NLP pipeline, different focus (market vs. competitor)
- [[093 - Bid Strategy Game Simulator]] — competitor intelligence feeds the game theory model
- [[059 - Bid Data Assembler]] — competitive context feeds bid pricing decisions
- [[004 - Port Congestion Alert Bot]] — same n8n + news scraping architecture
- [[091 - PipeGPT Welspun Local LLM]] — competitor intelligence database becomes PipeGPT knowledge

---

## Notes
- Focus on public sources only — do not attempt to access private competitor information
- Build a "signal quality" tracker: which sources consistently produce useful intelligence? Prioritize those and reduce low-signal sources over time
- The most valuable intelligence is often "price at which competitors won recent contracts" — build a database of this over time from tender announcements and industry contacts
