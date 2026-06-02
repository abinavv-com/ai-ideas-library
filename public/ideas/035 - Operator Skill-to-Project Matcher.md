# 035 · Operator Skill-to-Project Matcher

> **Section**: Quality & Inspection | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: PN Mahida, HR | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
LLM reads incoming project QA requirements (welding procedure qualification, ASNT certification levels required) and cross-matches them against the digitized skills database — recommending the optimal operator lineup for project mobilization in minutes, not days.

---

## Implementation Blueprint

### Architecture
```
Project QA spec / customer requirement (PDF/Excel) 
→ OpenClaw LLM extracts required certifications/qualifications 
→ Cross-match against operator skills database (SAP HR or Excel) 
→ Ranked list of qualified operators per role 
→ Gap analysis: if insufficient operators → training plan generated
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Spec Input | PDF/Excel + OpenClaw | Extract project qualification requirements |
| Skills Database | SAP HCM or Excel + Python | Operator certification records |
| Matching Engine | Python `pandas` + fuzzy matching | Cross-reference skills to requirements |
| LLM | OpenClaw / GPT-4o | Extract requirements + generate recommendations |
| Output | Excel roster + Teams message | Staffing recommendation |
| Orchestration | n8n | Trigger and route |

### Operator Skills Database Schema
```python
operator_record = {
    "operator_id": "OP-0042",
    "name": "Ramesh Kumar",
    "department": "LSAW_Welding",
    
    # Welding Qualifications (per ASME IX / AWS D1.1 / API 1104)
    "welding_qualifications": [
        {
            "process": "SAW",
            "position": "1G",
            "material_group": "P1",
            "thickness_range_mm": "6-300",
            "standard": "API 1104",
            "cert_number": "WQ-2024-0421",
            "expiry": "2026-12-31"
        }
    ],
    
    # NDT Certifications (ASNT SNT-TC-1A / EN ISO 9712)
    "ndt_certifications": [
        {"method": "RT", "level": 2, "expiry": "2027-03-31"},
        {"method": "UT", "level": 1, "expiry": "2026-08-15"}
    ],
    
    # Special Process Qualifications
    "special_qualifications": ["sour_service", "hydrogen_service", "offshore_pipeline"],
    
    # Project History
    "projects_completed": ["Aramco MSP-2024", "GAIL HVJ-2023"],
    
    # Performance
    "defect_rate_pct": 2.1,  # From [[027 - Welding Operator Defect Correlation Tracker]]
    "availability": "available_from_2026-07-01"
}
```

### Project Requirements Extraction
```python
# From customer specification or RFP
project_requirements = {
    "project_name": "Saudi Aramco MSP Extension",
    "pipe_type": "LSAW",
    "grade": "X65",
    "end_use": "sour_service_oil_pipeline",
    
    "required_qualifications": [
        {"role": "Senior Welder", "count": 4, "requirements": [
            "SAW qualification per API 1104",
            "Sour service (H2S) experience",
            "Position: 1G minimum",
            "NACE MR0175 awareness training"
        ]},
        {"role": "NDT Operator", "count": 2, "requirements": [
            "RT Level 2 ASNT SNT-TC-1A",
            "UT Level 1 minimum",
            "Valid certification (expiry >project end date)"
        ]}
    ],
    
    "project_start": "2026-07-15",
    "project_end": "2026-12-31"
}
```

### Matching Algorithm
```python
def match_operators_to_project(project_req, operators_db):
    matches = []
    
    for role in project_req['required_qualifications']:
        qualified_operators = []
        
        for op in operators_db:
            score = 0
            
            # Check each requirement
            for req in role['requirements']:
                if meets_requirement(op, req, project_req['project_end']):
                    score += 1
            
            fit_pct = score / len(role['requirements']) * 100
            
            if fit_pct == 100:
                qualified_operators.append({
                    'operator': op,
                    'fit': 'FULL_MATCH',
                    'defect_rate': op['defect_rate_pct'],
                    'available': op['availability'] <= project_req['project_start']
                })
            elif fit_pct >= 75:
                qualified_operators.append({
                    'operator': op,
                    'fit': 'PARTIAL_MATCH',
                    'missing': get_missing_qualifications(op, role['requirements'])
                })
        
        # Sort by: full match first, then by defect rate (lower is better)
        qualified_operators.sort(key=lambda x: (x['fit'] != 'FULL_MATCH', x.get('defect_rate', 99)))
        matches.append({'role': role['role'], 'candidates': qualified_operators[:5]})
    
    return matches
```

### Output: Staffing Recommendation
```
OPERATOR STAFFING RECOMMENDATION — Saudi Aramco MSP Extension
Project Start: 2026-07-15 | Requirements: 4 Senior Welders + 2 NDT Operators

SENIOR WELDERS (4 Required):
Rank | Operator          | Fit    | Defect Rate | Notes
1    | Ramesh Kumar      | 100%   | 2.1%        | Sour service exp. on Aramco 2024
2    | Suresh Patel      | 100%   | 2.9%        | Fully qualified
3    | Mahendra Singh    | 75%    | 3.1%        | Missing: NACE awareness (1-day course)
4    | ...               |        |             |

NDT OPERATORS (2 Required):
Rank | Operator          | Fit    | Certifications
1    | Pradeep Nair      | 100%   | RT L2 (exp 2028), UT L2 (exp 2027)
2    | Vijay Shah        | 75%    | RT L2 ✅, UT: only L1 (need L2 upgrade)

GAP ANALYSIS:
- 1 welder (Mahendra) needs NACE awareness training (1 day, ₹5,000)
- 1 NDT operator (Vijay) needs UT L2 upgrade before project start
Training can be completed before 2026-07-15 if actioned this week.
```

### Estimated Build Time
- Skills database digitization: 1–2 weeks (one-time, major effort)
- Matching algorithm: 2 days
- LLM integration: 1 day
- UI/output: 1 day

### Cost
- OpenClaw API: ~$0.05 per matching run
- Software: Free
- Major cost: Staff time to digitize skills database (~40 hours)

---

## Related Ideas
- [[027 - Welding Operator Defect Correlation Tracker]] — defect rates feed operator rankings
- [[055 - Operator Qualification Digital Assessment]] — certification exams → update skills DB
- [[007 - RFP Spec Sheet Reader]] — extracts project QA requirements that this tool matches against
- [[009 - API 5L DNV Compliance Checker]] — standards context for qualification requirements
- [[096 - FloorOS SAP-Free Shop Floor App]] — mobile interface for operators to view their own qualifications

---

## Notes
- The skills database is the hardest part — many certifications are in paper binders or HR systems with poor structure. Digitization is the prerequisite.
- Build an expiry alert: certifications expiring in next 6 months → auto-notify HR + operator to schedule renewal training. Use [[017 - Legal Compliance Calendar Bot]] infrastructure.
- ASNT NDT certification renewal requires recertification exams every 5 years — put these on the compliance calendar too
