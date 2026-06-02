# 091 · PipeGPT — Welspun-Specific Local LLM

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive
> **Helps**: All technical teams | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Fine-tune Llama 3.1 8B on Welspun's SOPs, QA standards, API 5L documents, maintenance logs, and SAP code library. Deploy locally — no internet. Engineers ask complex technical questions and get answers from Welspun's own institutional knowledge, not generic web content.

---

## Implementation Blueprint

### Architecture
```
Knowledge base: All Welspun documents (SOPs, API standards, maintenance logs, RCA database) 
→ Phase 1: RAG (Retrieval Augmented Generation) — quick to deploy, high accuracy 
→ Phase 2: Fine-tune Llama 3.1 8B on Welspun-specific Q&A pairs 
→ Deploy on local server (Ollama) — fully offline, data secure 
→ Chat interface accessible company-wide on browser
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Base Model | Llama 3.1 8B (Meta, open weights) | Foundation LLM |
| Fine-tuning | LoRA fine-tuning with `axolotl` framework | Welspun-specific adaptation |
| Vector DB | ChromaDB (persistent) | Document retrieval |
| Embedding | `nomic-embed-text` via Ollama | Semantic search |
| Serving | Ollama (local inference server) | API endpoint |
| Training Hardware | NVIDIA A10 or RTX 4090 (rent from cloud) | Fine-tuning only |
| Inference Hardware | Local server with NVIDIA RTX 4090 (24GB VRAM) | Daily use |
| UI | Streamlit or Open WebUI | Chat interface |

### Why Local + Why Not Cloud GPT-4
- Welspun's SOPs, MTC data, customer data, and project data are CONFIDENTIAL
- Sending to OpenAI/Google cloud creates data leakage risk
- Local model = zero data sovereignty risk
- Llama 3.1 8B with good RAG answers 95% of questions as well as GPT-4o on domain-specific technical content

### Phase 1: RAG System (3 months — Quick Win)
Build a comprehensive RAG system first. This requires NO fine-tuning:
```python
# Document categories to index
knowledge_sources = {
    "SOPs": "All Standard Operating Procedures (300+ documents)",
    "API_5L": "API 5L 46th Edition + all addenda",
    "DNV_standards": "DNV-OS-F101 (key sections)",
    "ISO_standards": "ISO 2531 (DI pipe), ISO 8501 (surface prep)",
    "maintenance_logs": "5 years of SAP PM work orders",
    "rca_database": "All Root Cause Analysis reports (from [[029 - Automated RCA Report Generator]])",
    "mtc_database": "Heat chemistry + test results database",
    "wps_library": "All Welding Procedure Specifications",
    "qap_documents": "Quality Assurance Plans per customer/project",
    "breakdown_rca": "Machine breakdown RCA knowledge base (from [[054 - Machine Breakdown RCA Knowledge Base]])"
}
```

### Phase 2: Fine-Tuning (6–12 months)
Create training data from expert Q&A pairs:
```python
# Training dataset structure
training_pairs = [
    {
        "instruction": "What is the minimum hydrostatic test pressure for API 5L Grade X65 PSL-2 pipe with 20\" OD and 0.562\" wall thickness?",
        "output": "Per API 5L Section 10.2, the minimum hydrostatic test pressure for X65 PSL-2 is calculated as: P = 2 × T × (SMYS × 0.6) / D = 2 × 14.28 × (448 × 0.6) / 508 = 151.7 bar. However, Welspun standard is to test at 1.1× minimum, so actual test pressure is 167 bar. Reference: WCL-HYDRO-P-001."
    },
    {
        "instruction": "Our HSAW line is showing seam angle deviation of 1.5 degrees. What are the likely causes and corrective actions?",
        "output": "Based on Welspun maintenance records, HSAW seam angle deviation of 1.5° typically has three causes: (1) Strip guide roller wear — last documented case 2024-11-14, resolved by replacing guide rollers (part # SR-HSAW-044); (2) Strip coil eccentricity — check coil runout; (3) Lateral guide misalignment — re-check entry guide alignment per MAINT-HSAW-003. Recommended sequence: check guides first (30 min), then roller wear (2 hrs). Call Anurag Singh for authorization on roller replacement."
    }
]
```

### Fine-Tuning Process
```bash
# Using axolotl (LoRA fine-tuning, efficient for constrained hardware)
# Rent A10G on AWS for 2-3 days: ~$2-4/hour

axolotl train \
  --config config/pipegpt_lora.yaml \
  --dataset data/welspun_qa_pairs.jsonl \
  --base-model meta-llama/Meta-Llama-3.1-8B-Instruct \
  --output-dir models/pipegpt-v1

# Result: ~4GB LoRA adapter merged with base model
# Deploy with Ollama: ollama create pipegpt -f Modelfile
```

### Knowledge Base Curation Process
This is the most important and most effort-intensive step:
1. Assign a "Knowledge Champion" per domain (QA champion, Maintenance champion)
2. Each champion reviews 50 most-common questions their team gets asked
3. Creates structured Q&A pairs with authoritative answers
4. Validates against SOPs and standards
5. Creates the training dataset

### Deployment Architecture
```
[Local Server — NVIDIA RTX 4090, 24GB VRAM]
├── Ollama serving PipeGPT (fine-tuned Llama 3.1 8B)
├── ChromaDB vector database (all knowledge)
├── Open WebUI (browser-based chat interface)
└── API endpoint for integration with other tools

Access: Any device on Welspun intranet
Response time: <5 seconds per query
```

### PipeGPT Chat Interface
```
USER: "Our 20" X65 pipes are showing porosity on external seam weld X-ray. 
       What is the maximum acceptable pore size per API 1104?"

PIPEGPT: Based on API 1104 Section 9.3.2 (Radiographic Examination — Acceptability):
For external seam weld porosity:
• Individual pore: Maximum 25% of nominal wall thickness or 4.8mm, whichever is smaller
• For 14.3mm WT: Maximum individual pore = 3.6mm (25% of 14.3mm)
• Cluster porosity: Total area must not exceed 1 sq-inch in any 12-inch weld length

Based on Welspun's QAP-ARAMCO-2024, the acceptance criterion is stricter:
Maximum individual pore = 2.5mm (more conservative than API 1104 default)
This is per Aramco's SAES-L-350 supplementary requirement.

Reference: API 1104 Ed.21, Section 9.3.2 | WCL-QAP-ARAMCO-2024 Rev.3
Similar defect history: see RCA-2025-044 (HSAW-2 porosity batch — root cause flux moisture)
```

### Estimated Build Time
- Phase 1 (RAG): 3 months (indexing + interface)
- Phase 2 (Fine-tuning): 6–9 months (data creation is the bottleneck)

### Cost
- GPU server (RTX 4090): ~₹3.5L hardware
- Fine-tuning compute (AWS A10G, 2 days): ~$200 per training run
- Staff time for Q&A data creation: 200+ hours across teams
- Total: ~₹5L hardware + significant knowledge engineering effort

---

## Related Ideas
- [[008 - Maintenance Log Search Agent]] — Phase 1 version of this for maintenance
- [[016 - SOP Chatbot]] — Phase 1 version for SOPs
- [[054 - Machine Breakdown RCA Knowledge Base]] — knowledge source for PipeGPT
- [[095 - Sathi Multilingual Shop Floor Voice Assistant]] — voice interface to PipeGPT
- [[003 - SAP Code Translator]] — early prototype of local LLM at Welspun

---

## Notes
- The single most important investment in this project is NOT the technology — it's the knowledge engineering process. Getting subject matter experts to create high-quality Q&A training pairs takes sustained effort.
- Start with RAG + Llama 3.1 (no fine-tuning) for the first 6 months. Measure which questions it answers well and which it doesn't — this identifies where fine-tuning will add most value.
- PipeGPT becomes the platform that all other tools eventually connect to: the maintenance RCA tool, the SOP chatbot, the bid assistant — they all query PipeGPT for domain-specific reasoning.
