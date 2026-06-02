# 055 · Operator Qualification Digital Assessment

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: 🛡️ Safety
> **Helps**: Anurag Singh, HR | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Digital multiple-choice and scenario-based test (served on tablet) for operator qualification on each machine type. Results are logged automatically, certificates auto-issued, and a skills matrix updated in the HR system — replacing paper tests and manual certificate tracking.

---

## Implementation Blueprint

### Architecture
```
Question bank (per machine type) → Tablet quiz app 
→ Operator takes test → Auto-grade → Pass/Fail 
→ Pass: auto-generate digital certificate (PDF) 
→ SAP HR / skills database updated 
→ Links to [[035 - Operator Skill-to-Project Matcher]]
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Quiz Platform | React Native app or Google Forms + Python | Test delivery on tablets |
| Question Bank | JSON database (versioned per machine type) | Question storage |
| Grading | Python (auto-grade MCQ + scenario) | Instant results |
| Certificate | Python `reportlab` | Generate PDF certificate |
| Skills Update | n8n → SAP HR BAPI or Excel | Update qualifications |
| Proctoring | Camera on tablet (photo every 5 min) | Basic anti-cheating |

### Question Bank Structure
```python
question_bank = {
    "LSAW_OPERATOR_LEVEL_1": {
        "title": "LSAW Production Operator — Level 1 Qualification",
        "passing_score_pct": 80,
        "time_limit_min": 60,
        "questions": [
            {
                "id": "LSAW-001",
                "type": "MCQ",
                "text": "What is the maximum pipe forming temperature for API 5L Grade X70 during JCOE pressing?",
                "options": ["Room temperature", "150°C", "300°C", "500°C"],
                "correct": 0,
                "explanation": "LSAW forming is a cold forming process — pipe is formed at ambient temperature. Hot forming requires different qualification."
            },
            {
                "id": "LSAW-002",
                "type": "SCENARIO",
                "text": "During JCOE forming, you notice the pipe end has a 15mm OD deviation from nominal 508mm. What do you do?",
                "options": [
                    "Continue forming — it will correct itself",
                    "Stop forming, measure again, report to supervisor if out of tolerance",
                    "Increase press force to correct the deviation",
                    "Mark the pipe and move to next"
                ],
                "correct": 1,
                "explanation": "Dimensional deviations must be reported and investigated before continuing production per SOP-PROD-007."
            }
        ]
    },
    
    "SAFETY_LOCKOUT_TAGOUT": {
        # LOTO procedure questions — mandatory for all operators
    },
    
    "HYDRO_TEST_OPERATOR": {
        # Hydro test operation + safety questions
    }
}
```

### Assessment Types
1. **Initial Qualification**: First time on a new machine — full assessment (60 min)
2. **Annual Refresher**: Shorter version (30 min) — focus on safety updates + standard changes
3. **Incident Requalification**: After a safety incident or quality failure — targeted assessment
4. **Supervisory Level**: More complex scenario questions + management responsibilities

### Certificate Auto-Generation
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Image, Table
import qrcode

def generate_certificate(operator, assessment, result):
    cert_number = f"CERT-{assessment.code}-{operator.id}-{date.today().strftime('%Y%m%d')}"
    
    # QR code links to verification page (prevents forgery)
    qr = qrcode.make(f"https://welspun.intranet/cert/verify/{cert_number}")
    
    pdf = SimpleDocTemplate(f"{cert_number}.pdf", pagesize=A4)
    elements = [
        Image('welspun_logo.png', 200, 50),
        Paragraph(f"CERTIFICATE OF COMPETENCE", title_style),
        Paragraph(f"This certifies that {operator.name} (ID: {operator.id})", body_style),
        Paragraph(f"has successfully completed: {assessment.title}", body_style),
        Paragraph(f"Score: {result.score}% | Date: {date.today()} | Valid until: {expiry_date}", body_style),
        Image(qr, 60, 60),
        Paragraph(f"Certificate #: {cert_number}", small_style),
        Paragraph(f"Authorized by: Anurag Singh, Maintenance Manager", sig_style)
    ]
    pdf.build(elements)
    return cert_number
```

### Skills Matrix Update
After passing assessment:
```
n8n → Update skills database (Excel / SAP HR)
Row: Operator_ID | Machine_Type | Level | Cert_Number | Issued | Expiry
OP-0042 | LSAW_OPERATOR | LEVEL_1 | CERT-LSAW1-0042-20260601 | 2026-06-01 | 2027-06-01
```

### Integration with [[035 - Operator Skill-to-Project Matcher]]
Certificates auto-feed the skills database that the project matcher queries. As operators pass new qualifications, they immediately become eligible for projects requiring those skills.

### Integration with [[017 - Legal Compliance Calendar Bot]]
Certification expiry dates added to compliance calendar — reminder fires 60 and 30 days before expiry.

### Tablet UI (Test Taking)
```
LSAW OPERATOR LEVEL 1 — ASSESSMENT
Operator: Ramesh Kumar (OP-0042)
Time Remaining: 42:15 | Question 12 of 25

[Question text displayed prominently]
[ ] Option A
[ ] Option B  
[●] Option C  ← selected
[ ] Option D

[PREVIOUS]  [NEXT]  [SAVE & CONTINUE LATER]
```

### Estimated Build Time
- Question bank creation (with Anurag Singh): 1 week (biggest effort)
- App development: 3–4 days
- Certificate generation: 1 day
- SAP HR integration: 1–2 days
- Total: ~2 weeks

### Cost
- Google Forms (simplest start): Free
- Custom React Native app: 1 week development
- Certificate generation: Free (ReportLab)

---

## Related Ideas
- [[035 - Operator Skill-to-Project Matcher]] — certification data feeds project staffing
- [[027 - Welding Operator Defect Correlation Tracker]] — performance data triggers requalification
- [[016 - SOP Chatbot]] — SOPs that operators are tested on
- [[017 - Legal Compliance Calendar Bot]] — certification expiry tracking
- [[033 - NDT Inspector Fatigue Warning System]] — ASNT certification tracked here

---

## Notes
- Use scenario-based questions (not just factual recall) — they test actual judgment, which is what matters on the shop floor
- For safety-critical qualifications (LOTO, crane operation, hot work), add a practical demonstration component that a supervisor must witness and sign off — written test alone is insufficient
- Consider requiring re-qualification every 1–2 years AND after any safety incident — build this trigger into the workflow
