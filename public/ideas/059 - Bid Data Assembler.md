# 059 · Bid Data Assembler (SAP → Bid Pack)

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Pulls the latest production cost, open order backlog, current scrap and steel prices, and logistics rates from SAP — assembling them into a single bid preparation summary in under 5 minutes. Replaces the 4-hour spreadsheet compilation exercise before each bid submission.

---

## Implementation Blueprint

### Architecture
```
Trigger: Bid request received (manual or from [[007 - RFP Spec Sheet Reader]]) 
→ n8n queries SAP PP/CO/SD/MM in parallel 
→ Fetches live commodity prices 
→ Fetches logistics rates 
→ Assembles into Excel bid preparation template 
→ OpenClaw LLM generates preliminary cost commentary 
→ Mihir reviews + finalizes bid
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Trigger | Manual Teams button or [[007 - RFP Spec Sheet Reader]] output | Start bid preparation |
| SAP Data | SAP CO (actual costs), PP (capacity), SD (backlog), MM (material prices) | Cost base data |
| Market Data | Alpha Vantage, SteelMint API | Live commodity prices |
| Assembly | Python `openpyxl` | Populate Excel bid template |
| Commentary | OpenClaw LLM | Preliminary risk narrative |
| Delivery | SharePoint + Teams notification | Bid pack to Mihir |

### Data Sources and SAP Queries

**From SAP CO (Controlling) — Cost Center Actuals:**
```python
# Last 3 months actual cost per ton by product type
cost_data = sap_query("SELECT product_type, avg_cost_per_ton FROM co_actual_costs WHERE month >= 3_months_ago")
```

**From SAP PP (Production Planning) — Capacity:**
```python
# Current line loading and available capacity for new order
capacity = sap_query("SELECT line, available_capacity_tons FROM pp_capacity_check WHERE month = next_3_months")
```

**From SAP SD (Sales & Distribution) — Backlog:**
```python
# Current committed deliveries (to identify delivery window for new order)
backlog = sap_query("SELECT customer, quantity, committed_delivery_date FROM sd_open_orders")
```

**From SAP MM (Materials Management) — Current Prices:**
```python
# Steel plate + flux + consumables current purchase price
material_prices = sap_query("SELECT material, last_po_price, last_po_date FROM mm_purchase_info_records")
```

**Live Market Data:**
```python
market_data = {
    "steel_hrc_inr_per_ton": fetch_steelmint_price("HRC"),
    "scrap_hms1_inr_per_ton": fetch_steelmint_price("HMS1"),
    "usd_inr": fetch_forex_rate("USD", "INR"),
    "brent_crude_usd": fetch_alpha_vantage("BRENT"),
    "ocean_freight_mundra_to_rotterdam": fetch_freight_rate("Mundra", "Rotterdam")
}
```

### Bid Pack Excel Template (Auto-Populated Sections)
```
BID PREPARATION PACK — [Project Name] — [Date]
Prepared by: AI Bid Assembler | Review: Mihir [signature]

SECTION 1: MATERIAL COST
Plate/Coil spec: [from RFP extracted spec]
Estimated steel input/ton of pipe: 1.08 tons (yield assumption: 92.6%)
Current steel price (SAP last PO): ₹54,200/MT
Live HRC market: ₹53,800/MT (deviation: -0.7%)
→ COST BASIS RECOMMENDED: ₹54,000/MT (conservative)

SECTION 2: CONVERSION COST
Actual cost/ton (LSAW 20" X65, last 3 months avg): ₹8,240/ton
Labor + overhead: ₹4,120/ton
Energy: ₹2,140/ton
Maintenance: ₹980/ton
→ TOTAL CONVERSION: ₹8,240/ton

SECTION 3: COATING COST
3LPE coating (PE + FBE + adhesive) — last quarter actual: ₹2,860/ton

SECTION 4: LOGISTICS
Ocean freight Mundra → [destination]: $38/MT (live rate)
Insurance: 0.35% of CIF
→ TOTAL LOGISTICS: ₹3,340/ton

SECTION 5: OVERHEAD + PROFIT
G&A allocation: ₹1,200/ton
Target margin: [Enter %] → Markup: ₹X/ton

SECTION 6: CAPACITY CHECK
Order quantity: [from RFP]
Available slot: [from SAP PP capacity]
Earliest delivery: [calculated from SAP + lead times]

SECTION 7: COMPETITIVE CONTEXT
[From [[068 - Competitor Intelligence Monitor]] if available]
Last Jindal SAW win rate on similar projects: known from bid database

TOTAL COST FLOOR: ₹XX,XXX/ton
MINIMUM BID PRICE (at X% margin): ₹XX,XXX/ton
```

### OpenClaw Commentary
```
After populating the template, call OpenClaw:
"Generate a 5-bullet executive summary of this bid opportunity:
 - Key cost risks (what could go wrong)
 - Competitive dynamics
 - Margin at risk if steel rises 5%
 - Capacity risk (can we deliver on time?)
 - Special commercial requirements to flag for legal review"
```

### Estimated Build Time
- SAP query development: 3–4 days
- Excel template automation: 2 days
- Live market data integration: 1 day
- LLM commentary: 1 day
- Total: ~1 week

### Cost
- OpenClaw/OpenAI: ~$0.10 per bid pack
- n8n: Free
- Total: Near zero

---

## Related Ideas
- [[007 - RFP Spec Sheet Reader]] — feeds extracted specs into this bid assembler
- [[060 - Monte Carlo Bid Margin Simulator]] — next step after assembling the bid pack
- [[058 - Landing Cost Calculator]] — material landed cost feeds into this
- [[065 - Vendor Reliability Scorecard]] — supplier quality context for bid assumptions
- [[083 - Project-Level Profitability Tracker]] — actual P&L of past projects informs current bid

---

## Notes
- The biggest value is consistency — every bid uses the same cost base methodology, no more "we used different steel prices for the Aramco bid vs. the GAIL bid this week"
- Build a "bid history database" — save every submitted bid pack + outcome (won/lost/price competitor won at) — this builds the data for [[093 - Bid Strategy Game Simulator]]
- Add a "bid sensitivity table" auto-generated: what happens to margin if steel +5%, +10%? If freight +$10/MT? This is standard for any serious bid review.
