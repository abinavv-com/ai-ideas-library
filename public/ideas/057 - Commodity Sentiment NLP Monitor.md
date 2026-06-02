# 057 · Commodity Sentiment NLP Monitor

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Reads Reuters, Mysteel.net, S&P Platts newsletters, and Indian Ministry of Steel press releases every hour. Extracts steel market signals (supply shock, demand surge, new tariff) and sends a 3-line summary alert to Mihir's team — replacing the 45-minute daily news scan with a 30-second read.

---

## Implementation Blueprint

### Architecture
```
n8n hourly cron → Fetch RSS/newsletter content from 8–10 sources 
→ Filter: new articles only (last hour) 
→ FinBERT NLP model: classify sentiment + extract market signals 
→ OpenClaw LLM: 3-line summary 
→ Teams digest message
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Sources | RSS feeds + email newsletter parsing | News ingestion |
| Sentiment Model | FinBERT (financial BERT model, free) | Classify bullish/bearish/neutral |
| LLM Summary | OpenClaw / GPT-4o mini | 3-line actionable summary |
| Orchestration | n8n | Scheduling and routing |
| Delivery | Teams webhook | Alert delivery |
| Archive | Google Sheet or Airtable | Historical signal log |

### News Sources to Monitor
```python
news_sources = [
    # Indian steel industry
    {"name": "SteelMint News", "rss": "https://www.steelmint.com/rss.xml", "priority": "HIGH"},
    {"name": "Steel360", "rss": "https://steel360.in/feed/", "priority": "HIGH"},
    {"name": "Ministry of Steel India", "url": "https://steel.gov.in/press-releases", "priority": "HIGH"},
    
    # Global steel
    {"name": "Reuters Metals", "rss": "https://feeds.reuters.com/reuters/companyNews?symbol=metals", "priority": "HIGH"},
    {"name": "World Steel Association", "rss": "https://worldsteel.org/feed/", "priority": "MEDIUM"},
    {"name": "Mysteel Global", "newsletter": "Subscribe free at mysteel.net", "priority": "HIGH"},
    
    # Macro factors affecting steel
    {"name": "China NBS Manufacturing PMI", "source": "China NBS website", "priority": "MEDIUM"},
    {"name": "Indian infrastructure tenders", "source": "Tender portals", "priority": "MEDIUM"},
    
    # Trade and tariffs
    {"name": "DGTR India", "url": "https://www.dgtr.gov.in", "priority": "HIGH"},  # Anti-dumping authority
    {"name": "S&P Platts Weekly", "newsletter": "Free subscription", "priority": "HIGH"}
]
```

### FinBERT Sentiment Analysis
```python
from transformers import pipeline

# FinBERT: pre-trained on financial news text
finbert = pipeline("sentiment-analysis", model="ProsusAI/finbert")

def analyze_article(article_text):
    # Run FinBERT on article headline + first paragraph
    snippet = article_text[:500]  # First 500 chars
    sentiment = finbert(snippet)[0]
    
    return {
        'label': sentiment['label'],  # 'positive', 'negative', 'neutral'
        'confidence': sentiment['score'],
        'text': snippet
    }

# Apply domain-specific interpretation
def interpret_steel_sentiment(sentiment, article_text):
    # "positive" for steel industry = prices likely to RISE
    # "negative" for steel industry = prices likely to FALL
    
    # Extract specific signals with keyword matching
    signals = []
    if re.search(r'anti.dumping|AD duty|import duty', article_text, re.I):
        signals.append("TARIFF_SIGNAL")
    if re.search(r'capacity cut|blast furnace.*shutdown|production cut', article_text, re.I):
        signals.append("SUPPLY_REDUCTION")
    if re.search(r'infrastructure stimulus|budget.*steel|construction.*boost', article_text, re.I):
        signals.append("DEMAND_INCREASE")
    
    return signals
```

### Importance Scoring
```python
def score_article_importance(article):
    score = 0
    
    # Source priority
    source_scores = {'HIGH': 30, 'MEDIUM': 15, 'LOW': 5}
    score += source_scores[article['source_priority']]
    
    # Sentiment strength
    if article['sentiment_confidence'] > 0.85:
        score += 20
    
    # Signal types
    high_value_signals = ['TARIFF_SIGNAL', 'SUPPLY_REDUCTION', 'DEMAND_INCREASE']
    score += len([s for s in article['signals'] if s in high_value_signals]) * 15
    
    # Recency
    minutes_old = (now - article['published']).seconds / 60
    score += max(0, 30 - minutes_old)  # Fresher = higher score
    
    return score
```

### Teams Digest Format
```
📰 STEEL MARKET INTELLIGENCE — 2026-06-01 09:00

🔴 HIGH IMPACT (Act Today):
1. DGTR initiates anti-dumping review on Chinese LSAW pipe imports
   → Potential: 15–25% duty on Chinese competitors within 6 months
   → Welspun impact: Positive — reduces price competition in domestic bids
   Action: Alert Mihir + Sales team immediately

🟡 MEDIUM IMPACT (Watch This Week):
2. Mysteel: China steel exports down 8% YoY in May — capacity utilization falling
   → Global HRC prices may stabilize or rise in July
   → Consider locking in Q3 steel contracts before July price revision

🟢 INFORMATIONAL:
3. Indian infrastructure capex spend: 68% YTD (Ministry of Finance)
   → DI pipe demand for water infra likely strong through Q4

Today's sentiment: 2 BULLISH signals, 0 BEARISH, 4 NEUTRAL articles
[View full digest] [Set alert preferences]
```

### Daily vs. Breaking vs. Weekly
- **Breaking alerts**: High-importance signals (tariff news, major supply disruption) → immediate Teams message
- **Hourly digest**: New articles since last check → only if importance score > threshold
- **Daily summary**: Every morning 09:00 — top 5 market intelligence items of the previous 24 hours
- **Weekly intelligence report**: Friday 16:00 — summary for Mihir + Sarados weekly review

### Estimated Build Time
- RSS ingestion + FinBERT setup: 1 week
- OpenClaw summary generation: 2 days
- n8n workflow + Teams delivery: 2 days
- Total: ~2 weeks

### Cost
- FinBERT: Free (Hugging Face)
- OpenClaw/OpenAI: ~$10–20/month for summaries
- SteelMint subscription: ₹20,000–50,000/year
- RSS feeds: Most free

---

## Related Ideas
- [[056 - Steel Scrap Price Forecaster]] — price forecasting that this sentiment informs
- [[068 - Competitor Intelligence Monitor]] — same NLP approach for competitor news
- [[004 - Port Congestion Alert Bot]] — similar news monitoring infrastructure
- [[005 - USD INR Oil Price Alert System]] — rate monitoring complements this
- [[070 - Supplier ESG Due Diligence Agent]] — ESG news monitoring uses same NLP pipeline

---

## Notes
- FinBERT is trained on English financial text — it handles Reuters and Platts well, but may misclassify regional Indian steel news. Fine-tune on ~500 manually-labelled Indian steel articles if accuracy is poor.
- The most valuable signal is often "what's happening in China" — Chinese steel capacity and export policy are the dominant drivers of Indian steel prices. Make China a primary focus.
- Build a "signal accuracy tracker": when the NLP flags a BULLISH signal, track whether prices actually rose — calibrate the model's reliability over time
