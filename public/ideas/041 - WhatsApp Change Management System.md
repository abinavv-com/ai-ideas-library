# 041 · WhatsApp → Formal Change Management System

> **Section**: Manufacturing & Process | **Complexity**: 🟢 Week 1–4 | **Impact**: 🛡️ Safety
> **Helps**: All production supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Replaces production schedule change communication via WhatsApp with a formal n8n workflow: change request submitted → supervisor approves → auto-notified to all affected line stations. Creates an audit trail, prevents miscommunication, and eliminates the "I sent it in WhatsApp" defense when something goes wrong.

---

## Implementation Blueprint

### Architecture
```
Supervisor submits change via simple web form (or WhatsApp Bot) 
→ n8n routes to approver 
→ Approver approves/rejects (Teams or email) 
→ All affected parties auto-notified 
→ Change logged with timestamp + approver name 
→ SAP production order updated
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Submission Form | Microsoft Forms or simple HTML form | Structured change request |
| Orchestration | n8n | Approval workflow engine |
| Approval | Microsoft Teams Adaptive Card or email with approve/reject buttons | One-click approval |
| Notification | Teams + WhatsApp Business API | Notify affected parties |
| Audit Log | SharePoint list or Google Sheet | Permanent record |
| SAP Update | n8n SAP RFC | Update production order if needed |

### Change Types to Handle
```python
change_types = {
    "production_sequence_change": {
        "approver": "production_supervisor",
        "notify": ["line_operators", "qc_team", "logistics"],
        "sap_update": True
    },
    "material_substitution": {
        "approver": "production_manager + qa_manager",  # Dual approval
        "notify": ["qc_team", "procurement"],
        "sap_update": True,
        "documentation_required": True  # QA deviation record
    },
    "schedule_delay": {
        "approver": "production_supervisor",
        "notify": ["logistics", "customer_service", "management"],
        "customer_notification_required": True
    },
    "quality_hold": {
        "approver": "qa_manager",
        "notify": ["production", "dispatch", "management"],
        "sap_hold_required": True
    }
}
```

### Microsoft Forms Change Request Template
Fields:
1. Change type (dropdown: sequence change / material sub / schedule delay / quality hold / other)
2. Production order / batch affected
3. Current plan (what is planned now)
4. Proposed change (what you want to change to)
5. Reason for change (text box)
6. Urgency (routine / urgent / emergency)
7. Submitted by (auto-populated from login)

### n8n Workflow Design
1. **Webhook trigger**: Form submitted
2. **Function node**: Route based on change type → identify approver(s)
3. **Teams node**: Send approval request card to approver:
   ```
   📋 PRODUCTION CHANGE REQUEST #CR-2026-0421
   Requested by: Ramesh (Shift Supervisor)
   Type: Production Sequence Change | Urgency: ROUTINE
   
   Current: HSAW Line 2 producing Order #4521 (X65 20")
   Proposed: Switch to Order #4589 (X70 24") at 15:00 today
   Reason: Delivery deadline for #4589 moved up by customer
   
   [✅ APPROVE] [❌ REJECT] [💬 Query]
   Response required by: 14:30 (90 min SLA)
   ```
4. **Wait node (90 min)**: Wait for approval
5. **IF node**: Approved → continue; Rejected → notify requester; Timeout → escalate to next level
6. **Teams nodes** (parallel broadcast): Notify all affected parties
7. **SharePoint node**: Archive change record with full audit trail
8. **SAP node**: Update production orders if required

### Audit Log (SharePoint/Google Sheet)
| CR# | Date | Type | Requested By | Change | Approver | Decision | Decision Time | SAP Updated |
|---|---|---|---|---|---|---|---|---|
| CR-0421 | 2026-06-01 14:22 | Sequence | Ramesh | Line 2 switch | Anurag Singh | APPROVED | 14:38 | Yes |

### Replacing WhatsApp
Key to adoption:
- Make the form accessible from the same WhatsApp group (pin the form link)
- Or: build a WhatsApp Bot using Twilio that captures structured change requests via a guided dialogue
- First week: run in parallel (people can still WhatsApp, but must also submit the form)
- After 30 days: announce that un-logged changes have no official status

### Estimated Build Time
- Developer: 2–3 days
- Non-developer with n8n + Teams experience: 3–4 days
- Microsoft Forms setup: Half a day

### Cost
- n8n: Free self-hosted
- Microsoft Forms + Teams: Existing M365 license
- Total: Zero ongoing cost

---

## Related Ideas
- [[001 - Meeting Action Item Compiler]] — action items from change review meetings
- [[006 - Shift Handover Voice Summarizer]] — changes logged in shift handover feed this system
- [[017 - Legal Compliance Calendar Bot]] — material substitution changes link to compliance calendar
- [[040 - Production OEE Live Dashboard]] — downtime caused by unplanned changes tracked here
- [[096 - FloorOS SAP-Free Shop Floor App]] — mobile app that integrates this change workflow

---

## Notes
- The emotional hurdle is adoption — everyone is used to WhatsApp. Frame this as "WhatsApp with a memory and an approver", not as bureaucracy.
- Keep the approval SLA aggressive: 90 minutes for routine, 15 minutes for urgent, 5 minutes for emergency — slow approvals will drive people back to WhatsApp
- Build a "WhatsApp to formal system bridge" first if needed: supervisor pastes WhatsApp message into a form → system does the rest
