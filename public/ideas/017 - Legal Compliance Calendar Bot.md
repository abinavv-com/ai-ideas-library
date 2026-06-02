# 017 · Legal Compliance Calendar Bot

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: 🛡️ Safety/Compliance
> **Helps**: Roshan, plant compliance teams | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Reads Factory Act, PCB (Pollution Control Board), PESO, and other regulatory certificate expiry dates and auto-creates Teams/Outlook calendar reminders 60 and 30 days before deadlines. Escalates to plant head if not acknowledged within 5 days — so no compliance certificate ever lapses unnoticed.

---

## Implementation Blueprint

### Architecture
```
Compliance certificate database (Excel/SharePoint) 
→ n8n daily check → Find upcoming expirations 
→ Create calendar reminders (Outlook/Teams) 
→ Track acknowledgment → Escalate if ignored 
→ Dashboard of all compliance statuses
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | Excel / SharePoint list | Certificate database |
| Orchestration | n8n | Daily checks and alerts |
| Calendar | Microsoft Graph API (Outlook calendar) | Create calendar events |
| Alerts | Teams + Email | Multi-channel notifications |
| Escalation | n8n wait node + escalation logic | Ensure no alert falls through |
| Dashboard | Power BI / SharePoint list view | Compliance overview |

### Certificate Database Schema
Create a SharePoint list or Excel with these columns:
```
| Certificate_Name | Issuing_Authority | Applicable_Locations | Issue_Date | Expiry_Date | Responsible_Person | Renewal_Lead_Days | Status | Last_Renewed | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Factory License | State Labour Dept | All plants | 2025-01-01 | 2026-12-31 | Roshan | 60 | Active | | |
| PCB Consent to Operate | GPCB | Anjar plant | 2024-06-15 | 2026-06-14 | Roshan | 90 | Active | | |
| PESO License | PESO | All plants | 2025-03-01 | 2026-02-28 | Roshan | 30 | Active | | |
| Fire NOC | Fire Dept | Anjar plant | 2025-11-01 | 2026-10-31 | Plant Safety Officer | 45 | Active | | |
```

### Compliance Regulations to Track
- Factory Act licenses (state-specific)
- PESO (Petroleum and Explosives Safety Organisation) approvals
- PCB Consent to Operate / Consent to Establish
- CGWA groundwater permits
- Hazardous waste authorization
- Environmental Impact Assessment compliance
- ISO certifications (9001, 14001, 45001) — audit dates
- API monogram licenses — audit dates
- Fire NOC and building occupancy certificates
- Boiler inspection certificates

### n8n Workflow Design
1. **Cron trigger**: Daily at 07:00
2. **Google Sheets / SharePoint node**: Read all certificates with `status = Active`
3. **Function node**: For each certificate, calculate:
   - Days until expiry
   - Whether 60-day alert already sent
   - Whether 30-day alert already sent
   - Whether acknowledgment received
4. **Filter**: Find certificates needing alerts today
5. **Teams node**: Post alert card with:
   - Certificate name + issuing authority
   - Expiry date + days remaining
   - Responsible person tagged
   - `[Mark as In-Progress]` button
6. **Graph API node**: Create calendar event for responsible person
7. **Wait node (5 days)**: Check if person acknowledged
8. **IF node**: Not acknowledged → escalate to Roshan + plant head

### Alert Message Template
```
⚠️ COMPLIANCE ALERT — 60 Days to Expiry
Certificate: PCB Consent to Operate (Anjar Plant)
Issued by: Gujarat Pollution Control Board
Expiry: 2026-08-14 (60 days)
Responsible: @Roshan Kumar

Actions Required:
☐ Compile compliance documents for renewal application
☐ Schedule PCB inspection (if required)
☐ Submit renewal application by 2026-07-01

[Mark as In-Progress] [View Certificate] [Contact Compliance Team]

This alert will escalate to plant head on 2026-06-06 if not acknowledged.
```

### Estimated Build Time
- Developer: 1–2 days
- Data entry (building the certificate database): 1–2 days (one-time)

### Cost
- n8n: Free
- Graph API: Free (M365 license already)
- Total: Zero ongoing cost

---

## Related Ideas
- [[085 - EU CBAM Carbon Certificate Generator]] — compliance documentation for exports
- [[088 - Tax Audit Readiness Agent]] — broader compliance monitoring for finance
- [[001 - Meeting Action Item Compiler]] — action items from compliance meetings tracked here
- [[041 - WhatsApp Change Management System]] — formal workflow complement

---

## Notes
- The hardest part is building the initial certificate database — dedicate 1 day with Roshan to catalog ALL current certificates and their expiry dates
- Add a "certificate document" column with a link to the scanned certificate — useful when renewing
- Some certificates require physical inspection visits which need 4–8 weeks lead time — adjust `Renewal_Lead_Days` accordingly
- Build a quarterly report for the board showing overall compliance status (Green/Amber/Red per plant)
