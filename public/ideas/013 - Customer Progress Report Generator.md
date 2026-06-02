# 013 · Customer Progress Report Generator

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Project managers, Carlos | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Queries SAP for production order status, QA milestones, and shipping dates for a specific customer project. LLM drafts a professional customer-facing email update — project manager reviews and sends. Turns a 2-hour reporting task into a 5-minute review.

---

## Implementation Blueprint

### Architecture
```
Trigger (schedule or manual) → SAP RFC/OData query (by project/customer) 
→ Aggregate: production %, QA status, delivery schedule 
→ OpenClaw LLM (draft professional email) 
→ Draft posted to Teams or Outlook for PM review → PM sends
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP SD/PP/QM via RFC or OData | Production + QA + delivery data |
| Orchestration | n8n | Query, aggregate, route |
| LLM | OpenClaw / GPT-4o | Draft professional email narrative |
| Review UI | Microsoft Teams adaptive card or Outlook draft | PM reviews before sending |
| Delivery | Outlook via Graph API | Final customer email |

### SAP Data Points to Pull
```python
project_data = {
    # From SAP SD
    "customer_name": "Saudi Aramco",
    "project_order_number": "SO-2026-4521",
    "contracted_quantity_tons": 12500,
    "contracted_delivery_date": "2026-09-30",
    
    # From SAP PP (Production Orders)
    "pipes_produced": 1847,
    "pipes_in_production": 312,
    "production_pct": 72,
    
    # From SAP QM (Quality)
    "pipes_qc_passed": 1823,
    "pipes_on_hold": 24,
    "pipes_rejected": 12,
    
    # From SAP SD (Shipping)
    "shipments_dispatched": 2,
    "shipments_planned": 3,
    "next_shipment_date": "2026-07-15",
    "next_shipment_quantity": 4200
}
```

### Email Generation Prompt
```
You are a professional project manager at Welspun Corp, a premium pipe manufacturer in India.
Write a concise, professional customer progress report email based on the following project data.

Tone: Professional, confident, specific. Not too formal. Address the customer by name.
Length: 3–4 short paragraphs.
Include: production progress, quality highlights, next shipment date, any issues proactively disclosed with mitigation plan.
Do NOT include: internal SAP references, reject quantities (mention QA process instead), internal cost data.

Customer: {{customer_name}}
Project Data: {{project_data_json}}
Last report sent: {{last_report_date}}
```

### n8n Workflow Design
1. **Cron trigger**: Weekly Monday 09:00 for all active projects; OR manual trigger via Teams button
2. **SAP RFC node**: Query active projects + customer list
3. **Loop node**: For each active project:
   a. Pull SAP production/QA/shipping data
   b. Call OpenClaw to draft email
   c. Create Outlook draft in PM's mailbox (Graph API: `POST /me/messages`)
4. **Teams message**: Notify PM — "3 customer report drafts ready in your Outlook Drafts folder"
5. **PM reviews**: Opens Outlook, reads draft, edits if needed, clicks Send

### Report Template (What LLM Produces)
```
Subject: Welspun Project Update — [Project Name] — Week of [Date]

Dear [Customer Name],

I'm pleased to share our weekly progress update on your [pipe type] project.

Production Progress: We have completed manufacturing of [X] tons ([Y]% of contract quantity), 
with the remaining [Z] tons progressing through our LSAW/HSAW production lines on schedule.

Quality & Inspection: All pipes have undergone our full API 5L PSL-2 inspection protocol, 
including hydrotest, UT, and coating inspection. Third-party inspection by [TPI name] is 
proceeding in parallel.

Next Shipment: We are planning the next shipment of approximately [quantity] tons from [port] 
on or around [date]. Shipping documents will be circulated to you one week in advance.

Please feel free to reach out if you'd like to schedule a project review call.

Best regards,
[PM Name]
```

### Estimated Build Time
- Developer: 2–3 days (most time is SAP query setup)
- Non-developer: 4–5 days

### Cost
- OpenClaw/OpenAI: ~$0.05 per report
- SAP connectivity: Existing infrastructure (no new cost)

---

## Related Ideas
- [[002 - SAP Board Deck Automator]] — same SAP data → LLM drafts document pattern
- [[001 - Meeting Action Item Compiler]] — pairs for post-customer-call follow-up
- [[099 - Predictive Project Delay Early Warning]] — feeds "delay risk" context into these reports
- [[030 - QA Sign-Off Queue Prioritizer]] — QA velocity affects what reports can say
- [[083 - Project-Level Profitability Tracker]] — internal view of the same projects

---

## Notes
- Always keep a "human in the loop" — PM must review before sending. Never auto-send to customers.
- Build a version history: keep all generated and sent reports in SharePoint by project, so there's an audit trail
- Add a "sensitive topics" flag — if `pipes_on_hold > 5%`, force PM review with a red banner rather than a routine draft
