# 001 · Meeting → Action Item Compiler

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Carlos, all 10 stakeholders | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Automatically extracts action items from Microsoft Teams / Fireflies meeting transcripts and syncs them to Microsoft Planner — with owner, deadline, and priority. No more end-of-meeting manual note-taking or lost commitments.

---

## Implementation Blueprint

### Architecture
```
Teams Meeting → Fireflies.ai (transcription) → n8n webhook trigger 
→ OpenClaw / GPT-4o (LLM extraction) → Microsoft Planner (task creation) 
→ Teams notification to task owners
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Orchestration | n8n (self-hosted or cloud) | Workflow glue |
| Transcription | Fireflies.ai API | Auto-transcribes Teams/Zoom calls |
| LLM | OpenClaw or GPT-4o via API | Extracts structured action items |
| Task Destination | Microsoft Planner API (Graph API) | Creates trackable tasks |
| Notification | Microsoft Teams Webhook | Notifies task owners |

### APIs Required
- **Fireflies.ai API** — `POST /graphql` to retrieve transcripts after meeting ends; webhook trigger available
- **OpenAI/OpenClaw API** — chat completions endpoint with a structured extraction prompt
- **Microsoft Graph API** — `POST /planner/tasks` to create tasks; `GET /groups/{id}/planner/plans` for plan IDs

### n8n Workflow Design
1. **Trigger**: Fireflies webhook fires when a meeting transcript is ready
2. **HTTP Request node**: Pull full transcript via Fireflies GraphQL API
3. **OpenClaw/OpenAI node**: Send transcript with prompt:
   > *"Extract all action items. For each output: assignee name, task description, deadline (if mentioned), priority (high/medium/low). Return JSON array."*
4. **Split In Batches node**: Loop through each action item
5. **HTTP Request node**: POST each item to MS Planner via Graph API
6. **Teams node**: Send summary message to meeting channel with all tasks linked

### Prompt Template
```
You are an action item extractor for a manufacturing company.
Given the following meeting transcript, extract every committed action item.
For each item return JSON: {"assignee": "", "task": "", "deadline": "", "priority": "high|medium|low"}
Only extract explicit commitments, not discussion points.
Transcript: {{transcript}}
```

### Build Steps
1. Create Fireflies.ai account → connect to Microsoft Teams calendar
2. Set up n8n instance (self-hosted on company server or n8n Cloud)
3. Create n8n workflow with Fireflies webhook trigger
4. Configure OpenClaw/OpenAI credentials in n8n
5. Create a dedicated "Action Items" plan in Microsoft Planner
6. Register Azure app for Graph API access (Planner.ReadWrite.All scope)
7. Test with a recorded meeting transcript
8. Deploy and announce to Carlos's team

### Estimated Build Time
- Developer: 1–2 days
- Non-developer with n8n experience: 3–4 days

### Cost
- Fireflies.ai Pro: ~$10/user/month
- n8n Cloud: $20/month (or free self-hosted)
- OpenClaw/OpenAI API: ~$5–15/month depending on meeting volume

---

## Related Ideas
- [[002 - SAP Board Deck Automator]] — same n8n + LLM pattern for document generation
- [[013 - Customer Progress Report Generator]] — similar LLM-drafts-document pattern
- [[041 - WhatsApp Change Management System]] — replaces informal comms with formal workflows
- [[006 - Shift Handover Voice Summarizer]] — similar voice-to-structured-text workflow
- [[016 - SOP Chatbot]] — companion knowledge retrieval tool

---

## Notes
- If Fireflies is not approved, use Microsoft Teams' built-in transcription export via Graph API (`/communications/callRecords`)
- Ensure meeting transcripts are stored compliant with Welspun data policy before sending to external LLM API — consider using OpenClaw on-premise or Azure OpenAI for data sovereignty
