# 016 · SOP Chatbot

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: All shop floor teams | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Indexes all Standard Operating Procedures into a searchable chatbot. Workers type or speak: "What is the acceptance criterion for 3LPE coating holiday testing?" — get the exact SOP section instantly, instead of hunting through binders or calling the QA office.

---

## Implementation Blueprint

### Architecture
```
All SOP PDFs/Word docs → Text extraction → Chunking 
→ Embedding model → ChromaDB (local vector DB) 
→ Chat interface (Streamlit or simple HTML) 
→ Llama 3.1 8B (local) generates answer with source citation
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Document Store | SharePoint / Google Drive folder | Central SOP repository |
| Text Extraction | `pdfplumber` + `python-docx` | Extract from PDF/Word |
| Embedding | `nomic-embed-text` via Ollama | Vectorize SOP content |
| Vector DB | ChromaDB (local, persistent) | Store and search |
| LLM | Llama 3.1 8B via Ollama | Answer generation |
| UI | Streamlit (Python) | Chat interface on tablets |
| Hosting | Local server (same PC as [[008 - Maintenance Log Search Agent]]) | On-premise |

### SOP Categories to Index
Priority order:
1. Quality SOPs (inspection criteria, test methods, acceptance standards)
2. Production SOPs (machine setup, operating procedures)
3. Safety SOPs (lockout/tagout, PPE requirements, emergency procedures)
4. Maintenance SOPs (PM procedures, lubrication schedules)
5. Environmental SOPs (waste disposal, spill response)

### Chunking Strategy
SOPs have a natural structure (sections, sub-sections). Chunk by section:
```python
def chunk_sop(text, sop_name):
    # Split on section headers (e.g., "3.1", "Section 4", "STEP 1")
    sections = re.split(r'\n(?=\d+\.\d+|\bSection\b|\bSTEP\b)', text)
    return [
        {
            "text": section,
            "metadata": {
                "sop_name": sop_name,
                "section": extract_section_number(section),
                "doc_type": "SOP"
            }
        }
        for section in sections if len(section.strip()) > 50
    ]
```

### Answer Prompt Template
```
You are a quality and safety assistant for Welspun pipe manufacturing plant.
Answer the worker's question using ONLY the SOP excerpts provided.
Always cite which SOP and section number the answer comes from.
If the answer is not in the provided excerpts, say "This is not covered in the indexed SOPs. Please contact QA/Safety department."
Keep the answer simple and actionable.

SOP Excerpts:
{{retrieved_chunks}}

Worker's Question: {{question}}
```

### Chat UI Features
- Large text (readable in factory environment)
- Voice input button (uses device microphone → Whisper transcription)
- Answer shown with: full text + "Source: SOP-QA-003, Section 4.2"
- "Print this" button → sends to nearby printer
- "Was this helpful?" rating

### Auto-Update Workflow (n8n)
When a new SOP is uploaded to SharePoint:
1. n8n detects new/modified file in the SOP folder
2. Extracts text, chunks, re-embeds
3. Adds to ChromaDB (old version replaced by doc_id)
4. Posts Teams message: "SOP chatbot updated: SOP-QA-007 Rev 3 now live"

### Estimated Build Time
- Developer: 2–3 days
- Document digitization (if SOPs are on paper): 1–2 weeks (can be done in parallel)

### Cost
- All components: Free open source
- Hardware: Reuses same local server as [[008 - Maintenance Log Search Agent]] and [[003 - SAP Code Translator]]
- Total ongoing: ₹0

---

## Related Ideas
- [[008 - Maintenance Log Search Agent]] — same RAG infrastructure, different document set
- [[003 - SAP Code Translator]] — shares local LLM infrastructure
- [[091 - PipeGPT Welspun Local LLM]] — SOP knowledge is a key module of PipeGPT
- [[095 - Sathi Multilingual Shop Floor Voice Assistant]] — voice-enabled version of this
- [[055 - Operator Qualification Digital Assessment]] — assessments test SOP knowledge indexed here

---

## Notes
- Start with 20–30 most-queried SOPs (ask QA team "what do you get called about most?") rather than indexing all 500 SOPs at once
- Add a "flag wrong answer" button — when workers flag incorrect answers, create a task to review and fix the underlying SOP chunk
- Consider adding the API 5L and DNV standards text (public domain sections) to the index so workers can look up standards requirements directly
- Update embeddings whenever SOPs are revised — stale SOP answers are worse than no answer
