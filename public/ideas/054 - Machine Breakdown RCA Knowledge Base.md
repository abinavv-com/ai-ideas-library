# 054 · Machine Breakdown RCA Knowledge Base

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Every breakdown RCA is entered into a structured form (machine, symptom, root cause, fix, time to repair). Over time this becomes a searchable knowledge base — enabling night-shift mechanics to find and apply proven fixes without calling the senior engineer at 02:00.

---

## Implementation Blueprint

### Architecture
```
Breakdown occurs → SAP PM work order created 
→ After repair: technician enters structured RCA via tablet form 
→ Data stored in ChromaDB (vector DB) 
→ RAG chatbot: "HSAW drive motor vibration at 50Hz — what's the fix?" 
→ Retrieves similar past cases + solutions
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| RCA Entry | Simple web form (tablet-friendly) | Capture structured breakdown data |
| Vector Storage | ChromaDB (same as [[008 - Maintenance Log Search Agent]]) | Semantic search |
| Embedding | `nomic-embed-text` via Ollama | Vectorize RCA descriptions |
| LLM | Llama 3.1 8B local | Answer queries, suggest fixes |
| UI | Streamlit chatbot | Query interface for technicians |
| SAP Link | n8n + SAP PM work order number | Link RCA to SAP work order |

### RCA Entry Form Fields
```python
rca_record = {
    # Machine identification
    "machine_id": "EQ-HSAW-002",
    "machine_name": "HSAW Strip Drive Motor #2",
    "line": "HSAW_Line_2",
    
    # Incident
    "date": "2026-06-01",
    "shift": "morning",
    "reported_by": "Shift Supervisor",
    "discovery_method": "Operator noticed vibration",  # or: alarm, inspection, smell, sound
    
    # Symptoms (what the machine was doing wrong)
    "symptoms": [
        "Excessive vibration at 50Hz",
        "Bearing temperature 78°C (normal: 55°C)",
        "Intermittent speed fluctuation"
    ],
    
    # Root cause
    "root_cause_category": "Bearing failure",  # dropdown
    "root_cause_detail": "Outer race spalling on drive-end bearing (SKF 6316)",
    "contributing_factors": ["Lubrication interval extended by 3 weeks", "Elevated ambient temperature"],
    
    # Repair
    "actions_taken": [
        "Replaced drive-end bearing (SKF 6316 → NSK 6316 equivalent)",
        "Flushed and refilled gearbox oil",
        "Verified belt tension"
    ],
    "parts_replaced": [{"part": "Bearing 6316", "quantity": 1, "brand": "NSK", "cost_inr": 3200}],
    "time_to_repair_hours": 3.5,
    "downtime_hours": 5.2,  # Including diagnosis time
    
    # Verification
    "verified_by": "Anurag Singh",
    "recurrence_risk": "MEDIUM",
    "preventive_action": "Reduce lubrication interval to 300 hours (from 500)",
    
    # SAP link
    "sap_pm_order": "PM-2026-0821"
}
```

### Symptom Taxonomy (Dropdown Standardization)
```python
symptom_categories = {
    "VIBRATION": ["excessive vibration", "resonance", "imbalance", "misalignment"],
    "TEMPERATURE": ["overheating motor", "overheating bearing", "gearbox oil temperature"],
    "NOISE": ["grinding noise", "clicking", "squealing", "impact sounds"],
    "ELECTRICAL": ["tripped circuit breaker", "motor fault", "encoder error", "power fluctuation"],
    "HYDRAULIC": ["pressure drop", "leak", "sluggish response", "contaminated oil"],
    "MECHANICAL": ["shaft breakage", "coupling failure", "gear tooth damage", "belt slip"],
    "SENSOR/CONTROL": ["false alarm", "sensor drift", "PLC fault", "communication error"]
}
```

### ChromaDB Indexing
```python
def index_rca(rca_record):
    # Create searchable text from RCA data
    search_text = f"""
    Machine: {rca_record['machine_name']}
    Symptoms: {', '.join(rca_record['symptoms'])}
    Root Cause: {rca_record['root_cause_detail']}
    Fix: {', '.join(rca_record['actions_taken'])}
    Parts: {[p['part'] for p in rca_record['parts_replaced']]}
    """
    
    collection.add(
        documents=[search_text],
        metadatas=[rca_record],
        ids=[f"rca_{rca_record['sap_pm_order']}"]
    )
```

### Query Interface (Night Shift Use Case)
```
Technician at 02:00: "HSAW drive motor making grinding noise, bearing temperature 74°C"

KNOWLEDGE BASE RESPONSE:
Found 3 similar past cases:

CASE 1 (Match: 94%) — 2025-11-14
Machine: HSAW Strip Drive Motor #1
Symptoms: Grinding noise, bearing temp 71°C, slight vibration
Root Cause: SKF 6316 drive-end bearing — outer race spalling
Fix: Replace bearing + flush gearbox oil | Repair time: 3.5 hours
Parts needed: Bearing 6316 (check bin S-12-A, SAP stock: 3 EA) ✅

CASE 2 (Match: 78%) — 2025-08-22
[...]

RECOMMENDED FIRST ACTION: 
Check bearing temperature at drive end vs. free end.
If drive-end > free-end by >10°C: confirms bearing failure → proceed with Case 1 fix.
Check spare availability: Bearing 6316 → Bin S-12-A | Gearbox oil → Bin L-04-B

If unsure, contact: Anurag Singh (+91 9XXX XXXXXX)
```

### Gamification for Adoption
The hardest part is getting technicians to enter RCAs consistently:
- Points per RCA entered → monthly recognition for highest contributor
- "RCA of the Month" — best-documented case gets highlighted in team meeting
- Completion tracking: Anurag Singh can see which PMs have closed RCAs and which don't

### Estimated Build Time
- Web form: 2 days
- ChromaDB indexing: 1 day
- RAG chatbot UI: 1 day (reuse from [[016 - SOP Chatbot]])
- Seed data entry (50 historical RCAs): 2–3 days

### Cost
- All software: Free open source
- Hardware: Reuse existing server

---

## Related Ideas
- [[008 - Maintenance Log Search Agent]] — companion search across all maintenance documents
- [[016 - SOP Chatbot]] — same RAG architecture, shares infrastructure
- [[029 - Automated RCA Report Generator]] — quality RCA version of same concept
- [[046 - Predictive Maintenance Dashboard]] — when predictions fail and breakdown happens anyway
- [[091 - PipeGPT Welspun Local LLM]] — this RCA database becomes part of PipeGPT

---

## Notes
- Start by entering the 50 most common breakdowns from the last 2 years — even without the chatbot, the structured database is valuable
- The symptom standardization (dropdown categories) is what makes the search work well — free-text symptoms are hard to match semantically
- Make the form available from the same tablet as the SAP PM work order — one-stop for the technician
