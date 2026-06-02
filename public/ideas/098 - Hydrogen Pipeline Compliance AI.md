# 098 · Hydrogen Pipeline Compliance AI

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive
> **Helps**: Engineering, Sales | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
LLM trained on ASME B31.12, ISO 15649, and DNV hydrogen standards. Validates any proposed pipe design against hydrogen-specific requirements and generates a compliance gap report — positioning Welspun to serve the H2 economy at scale before any Indian competitor has built this capability.

---

## Implementation Blueprint

### Architecture
```
H2 pipeline specification input (from customer or sales team) 
→ Standards database (ASME B31.12, ISO 15649, ASME VIII Div 1, DNV H2 docs) 
→ OpenClaw / Local LLM + RAG on H2 standards 
→ Compliance check: material compatibility, design pressure, testing requirements 
→ Gap report + Welspun capability assessment 
→ Commercial response: "Welspun can supply H2-grade pipe under these modifications..."
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Standards Base | Embedded ASME B31.12 + ISO 15649 PDF text | H2 standards knowledge |
| LLM | OpenClaw / GPT-4o or local fine-tuned model | Compliance reasoning |
| RAG | ChromaDB + question decomposition | Standard retrieval |
| Input | Web form or PDF spec input | Customer requirements |
| Output | Structured PDF compliance report | Engineering response |

### Why Hydrogen is Different from Natural Gas Pipelines
```python
hydrogen_specific_challenges = {
    "hydrogen_embrittlement": {
        "description": "H2 atoms penetrate steel lattice → reduces ductility → cracks",
        "affected_grades": "High-strength steels (X70, X80, X100) more susceptible",
        "mitigation": "Material qualification testing per ASME B31.12 Appendix A",
        "standards": "ASME B31.12 (hydrogen piping and pipelines)"
    },
    
    "higher_leakage_risk": {
        "description": "H2 molecule is smallest — permeates through seals and fittings",
        "requirement": "More stringent leak testing than natural gas pipelines"
    },
    
    "material_selection": {
        "approved_grades": ["X52", "X60", "X65 with restrictions", "X70 with HIC testing"],
        "restricted_grades": "X80 and above require special qualification",
        "hardness_limit": "Max 250 HV10 hardness in base metal and HAZ",
        "carbon_equivalent": "Max CE 0.43 for H2 service per ASME B31.12"
    },
    
    "design_pressure": {
        "safety_factor": "Higher minimum safety factors than natural gas",
        "derating": "Some grades require derating to 72% of SMYS vs. 80% for natural gas"
    },
    
    "weld_requirements": {
        "procedure_qualification": "Full re-qualification of WPS specifically for H2 service",
        "testing": "CTOD fracture toughness testing required",
        "inspection": "100% UT + 100% RT for weld joints in H2 service"
    }
}
```

### Standards Database to Embed
```python
standards_to_embed = {
    "ASME_B31.12": {
        "title": "Hydrogen Piping and Pipelines",
        "key_sections": [
            "Chapter IP: Industrial Piping",
            "Chapter HP: Hydrogen Pipelines",
            "Appendix A: Material Performance Factor",
            "Table A-1: Material qualification data"
        ]
    },
    "ISO_15649": {
        "title": "Petroleum and natural gas industries — Piping (hydrogen)"
    },
    "ASME_VIII_Div1": {
        "title": "ASME Boiler and Pressure Vessel Code",
        "key_sections": ["UG-84: Low temperature operation", "Part UHA: High alloys"]
    },
    "DNV_SE_0078": {
        "title": "DNV Hydrogen Pipelines Design and Materials"
    },
    "ISO_3183": {
        "title": "Petroleum and natural gas industries — Steel pipe",
        "amendment": "PSC-1 supplement for hydrogen service"
    }
}
```

### Compliance Check Workflow
```python
def check_h2_compliance(pipe_spec, customer_project):
    """
    pipe_spec: {
        grade: 'X65',
        od_mm: 508,
        wt_mm: 14.3,
        coating: '3LPE',
        max_operating_pressure_bar: 70,
        operating_temperature_range_C: (-10, 50),
        h2_purity_pct: 99.9,
        design_life_years: 30
    }
    """
    
    compliance_issues = []
    
    # Material qualification check
    if pipe_spec['grade'] in ['X70', 'X80']:
        # Check hardness requirement
        compliance_issues.append({
            'issue': 'High-strength grade X70/X80 requires additional qualification for H2 service',
            'standard_ref': 'ASME B31.12 Appendix A, Table A-1',
            'requirement': 'Conduct HIC testing per NACE TM0284 and SSC testing per NACE TM0177',
            'welspun_can_meet': True,
            'additional_testing_cost_est': '₹2–5L per heat qualification'
        })
    
    # Carbon equivalent check
    # Need actual MTC data — use typical range for grade
    if pipe_spec['grade'] == 'X65':
        typical_ce = 0.40  # Welspun X65 typical
        if typical_ce > 0.43:  # ASME B31.12 limit
            compliance_issues.append({
                'issue': 'CE exceeds ASME B31.12 H2 limit (0.43)',
                'severity': 'HIGH — must order low-CE heat'
            })
    
    # Weld qualification
    compliance_issues.append({
        'requirement': 'New WPS required specifically qualified for H2 service',
        'standard_ref': 'ASME IX QW-200 + ASME B31.12 HP-6',
        'testing': 'CTOD fracture toughness + Charpy at -20°C + hardness survey',
        'welspun_action': 'Submit to ASME IX accredited lab — approximately 4 months',
        'cost_est': '₹8–12L for WPS qualification'
    })
    
    return compliance_issues
```

### Report Output
```
WELSPUN CORP — H2 PIPELINE COMPLIANCE ASSESSMENT
Project: Green Hydrogen Distribution Network — Rajasthan
Customer: NTPC Green Energy Ltd
Date: 2026-06-01

REQUESTED PIPE SPECIFICATION:
20" LSAW × 14.3mm WT | Grade X65 | MAOP: 70 bar | H2 Service 100%

COMPLIANCE ASSESSMENT vs. ASME B31.12:

✅ GEOMETRY: Within ASME B31.12 design pressure allowances
✅ MATERIAL GRADE: X65 acceptable for H2 service with additional testing

⚠️ REQUIRES ADDITIONAL QUALIFICATION (4 items):
1. WPS re-qualification for H2 service (ASME B31.12 HP-6)
   → Welspun does not currently have H2-qualified WPS for 20" X65
   → Can qualify in 3–4 months | Cost: ~₹10L

2. HIC testing per NACE TM0284 for ordered heats
   → Not standard for X65 domestic orders
   → Add to order specification to steel mill | Cost: +₹500/ton

3. 100% UT + 100% RT for all weld joints
   → Currently standard for export: ✅ Welspun can meet

4. Hardness survey: Max 250 HV10 in weld + HAZ
   → Add to QAP | Cost: Minimal

WELSPUN CAPABILITY ASSESSMENT:
✅ LSAW manufacturing capability: Available
✅ QA/NDT capability: Available
⚠️ WPS qualification: Needs 3–4 month qualification program
⚠️ Material certification: Needs pre-ordering of low-CE heats

COMMERCIAL SUMMARY:
Welspun CAN supply this project subject to:
a) 4-month WPS qualification program (can start immediately)
b) Material cost premium: ~₹800–1,200/ton for low-CE + HIC testing

Recommended Response: Submit conditional bid — highlight H2 qualification roadmap.
First-mover advantage: No Indian competitor has H2-qualified LSAW WPS currently.

Next steps: Contact PN Mahida + Welspun's ASME-certified WPS lab
```

### Market Opportunity
India's National Hydrogen Mission targets:
- 5 million tons/year green H2 production by 2030
- Requires ~15,000 km of H2 pipeline (estimated)
- Premium over conventional pipeline: ~15–25% on pipe specs
- First Indian supplier with H2-qualified WPS = 12–18 month head start on competitors

### Estimated Build Time
- Standards database embedding: 3 weeks
- LLM compliance checker: 2 weeks
- Report generator: 1 week
- WPS qualification (actual physical qualification, not AI): 4 months (parallel activity)
- Total AI tool: ~6 weeks

---

## Related Ideas
- [[009 - API 5L DNV Compliance Checker]] — same compliance check approach, different standard
- [[007 - RFP Spec Sheet Reader]] — H2 project specs extracted by this tool first
- [[091 - PipeGPT Welspun Local LLM]] — H2 standards become part of PipeGPT knowledge
- [[092 - Pipe Digital Passport]] — H2 qualification records in digital passport
- [[035 - Operator Skill-to-Project Matcher]] — H2 qualification is a new skills category

---

## Notes
- The AI tool is the FASTER deliverable. The WPS qualification process is the gate that determines when Welspun can actually supply H2 projects. Start both in parallel.
- ASME B31.12 and the H2 qualification standards are evolving rapidly — update the embedded standards database every 6 months as new amendments are issued
- The first H2 qualification order (even a small pilot project) is worth accepting at below-normal margin to get the WPS qualification done at customer expense
