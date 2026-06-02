# 006 · Shift Handover Voice Summarizer

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency, 🛡️ Safety
> **Helps**: Anurag Singh, all shift supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Outgoing shift supervisor speaks a 3-minute handover into a tablet. AI transcribes it, structures it into four categories (machine faults / quality holds / pending work / safety issues), and sends a formatted summary to the incoming supervisor's phone — so critical information never slips through shift transitions.

---

## Implementation Blueprint

### Architecture
```
Tablet (record audio) → OpenAI Whisper (local transcription) 
→ n8n → OpenClaw LLM (structure into categories) 
→ Formatted PDF/message → WhatsApp/Teams to incoming supervisor
→ Archive to SharePoint/Google Drive
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Audio Recording | Android tablet built-in mic + PWA | Capture 3-min voice note |
| Transcription | OpenAI Whisper (local `whisper.cpp`) | Speech-to-text, works offline |
| Orchestration | n8n | Process and route |
| LLM Structuring | OpenClaw / GPT-4o | Categorize handover content |
| Delivery | WhatsApp Business API or Teams | Send to incoming supervisor |
| Archive | SharePoint or Google Drive | Audit trail |

### Why Local Whisper
- Works without internet (critical for shop floor)
- No data leaves the plant (sensitive production info stays local)
- `whisper.cpp` runs on CPU — no GPU needed for 3-min audio
- Supports Hindi/Gujarati reasonably well

### Handover Structure Template
The LLM is prompted to always extract into these four sections:
```json
{
  "machine_faults": ["HSAW Line 2: drive motor vibration, reduced speed to 70%, mechanic informed"],
  "quality_holds": ["Batch HT-2341: 14 pipes on hold pending re-UT, location Bay 3"],
  "pending_work": ["NDT crew arrives at 06:00, needs escort to LSAW bay"],
  "safety_issues": ["Oil spill near crane bay cleaned, re-check at 08:00"],
  "shift_summary": "Production: 47 pipes LSAW, 23 pipes HSAW. 2 downtime events totaling 1.5 hrs."
}
```

### n8n Workflow Design
1. **Webhook trigger**: Tablet app calls n8n webhook with audio file (base64 or multipart)
2. **Execute Command node**: Call `whisper.cpp` CLI on local server → get transcript text
3. **HTTP Request (OpenClaw)**: Send transcript + structured extraction prompt
4. **Format node**: Build WhatsApp/Teams message from JSON output
5. **WhatsApp/Teams node**: Send to incoming supervisor's number (looked up from a supervisor schedule sheet)
6. **Google Drive / SharePoint node**: Archive audio + transcript + structured summary

### Tablet App (Simple PWA)
```html
<!-- Single HTML file, runs in Chrome on Android tablet -->
<button onclick="startRecording()">🎙️ Start Handover</button>
<button onclick="stopAndSend()">✅ Submit Handover</button>
<!-- Shows: Line (dropdown), Incoming Supervisor (dropdown), then record -->
```
No app store installation needed — bookmark the URL on the tablet home screen.

### Supervisor Schedule Sheet
Google Sheet columns: `Date | Shift | Line | Outgoing_Supervisor | Incoming_Supervisor | Phone`
n8n reads this to know who to notify each shift.

### Estimated Build Time
- Developer: 2–3 days (including Whisper setup)
- Non-developer: 4–5 days

### Cost
- Whisper.cpp: Free and open source
- OpenClaw API: ~$5/month
- WhatsApp via Twilio: ~$0.005/message × 3 shifts × 365 days ≈ ₹1,300/year
- Hardware: Existing tablets + 1 mini PC for Whisper processing

---

## Related Ideas
- [[001 - Meeting Action Item Compiler]] — same voice-to-structured-text pattern
- [[003 - SAP Code Translator]] — same local AI tablet infrastructure
- [[041 - WhatsApp Change Management System]] — formal comms workflow complement
- [[051 - Maintenance KPI Live Dashboard]] — shift handover data feeds into maintenance metrics
- [[054 - Machine Breakdown RCA Knowledge Base]] — shift faults become RCA knowledge base entries

---

## Notes
- The most critical feature is reliability — it must work during the 06:00 shift change. Test extensively before rollout.
- Add a fallback: if the system is down, a simple WhatsApp text format is shown on screen for the supervisor to copy-paste manually
- Consider printing the structured handover report on a small receipt printer at the shift room — some supervisors will prefer paper
