# 008 · Maintenance Log Search Agent (RAG)

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Indexes all scanned maintenance logs, breakdown reports, and machine manuals into a searchable knowledge base. A technician types: "What was the fix for HSAW drive motor fault last year?" — and gets the exact answer in seconds, including which technician fixed it and what parts were used.

---

## Implementation Blueprint

### Architecture
```
Existing documents (PDFs/Word/scanned images) 
→ OCR (for scanned docs) → Text chunking 
→ Embedding model → ChromaDB vector database 
→ RAG query interface (simple chat UI) 
→ Llama 3.1 (local) retrieves and answers
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Document Ingestion | Python `pdfplumber` + `pytesseract` | Extract text from PDFs and scans |
| Embedding Model | `nomic-embed-text` (via Ollama) or `sentence-transformers` | Convert text to vectors |
| Vector Database | ChromaDB (local, file-based) | Store and search embeddings |
| LLM | Llama 3.1 8B via Ollama (local) | Generate answers from retrieved context |
| UI | Streamlit or simple HTML chat | Interface for technicians |
| Hosting | Local server in maintenance office | On-premise, no internet needed |

### What to Index
Priority order of documents to index first:
1. SAP PM work order history (export from SAP as CSV/PDF)
2. Machine breakdown reports (Word/PDF documents)
3. OEM machine manuals (PDF)
4. Maintenance procedure SOPs
5. Spare parts catalogues

### Document Processing Pipeline
```python
# Simplified flow
from chromadb import Client
from sentence_transformers import SentenceTransformer

# 1. Load and chunk documents
chunks = []
for pdf in all_pdfs:
    text = extract_text(pdf)  # pdfplumber or pytesseract
    chunks += split_into_chunks(text, chunk_size=500, overlap=50)

# 2. Embed and store
model = SentenceTransformer('nomic-embed-text')
embeddings = model.encode([c['text'] for c in chunks])
collection.add(documents=[c['text'] for c in chunks], embeddings=embeddings)

# 3. Query
def query(question):
    results = collection.query(query_texts=[question], n_results=5)
    context = "\n".join(results['documents'][0])
    return llm.generate(f"Answer based on context:\n{context}\n\nQuestion: {question}")
```

### n8n Integration (Ingestion Workflow)
1. **Cron trigger**: Weekly — check for new documents in a designated SharePoint/Google Drive folder
2. **Download new files**: Any PDFs added since last run
3. **Execute Python script**: Process → chunk → embed → add to ChromaDB
4. **Teams notification**: "5 new maintenance records indexed this week"

### Query Interface (Streamlit App)
```python
import streamlit as st
st.title("🔧 Maintenance Knowledge Search")
query = st.text_input("Ask a question about machine maintenance:")
if query:
    answer, sources = rag_query(query)
    st.write(answer)
    st.caption(f"Sources: {sources}")
```
Run on local server, open in tablet browser.

### Example Queries It Handles
- "HSAW drive motor fault — last 3 fixes and what parts were replaced"
- "What is the procedure for zinc spray nozzle replacement?"
- "Which bearing model is used in the LSAW forming press gearbox?"
- "How many times has the hydro-test pump failed in the last year?"

### Estimated Build Time
- Developer: 2–3 days for basic version
- Document scanning/digitization: 1–2 weeks (one-time, can be done in parallel)

### Cost
- ChromaDB: Free open source
- Llama 3.1: Free (runs on existing mini PC from [[003 - SAP Code Translator]])
- Sentence-transformers: Free
- Total ongoing: ₹0

---

## Related Ideas
- [[003 - SAP Code Translator]] — shares the same local LLM infrastructure
- [[016 - SOP Chatbot]] — same RAG architecture, different document set (SOPs)
- [[054 - Machine Breakdown RCA Knowledge Base]] — structured version of the same data
- [[046 - Predictive Maintenance Dashboard]] — maintenance history feeds prediction models
- [[091 - PipeGPT Welspun Local LLM]] — this becomes a module of the full PipeGPT system

---

## Notes
- Start with the 50 most recent SAP PM work orders — these are already digital and will give immediate value
- OCR quality on old scanned maintenance logs may be poor; manually fix the top 100 most important documents
- Add a "Was this answer helpful?" rating button — track which queries get poor answers and improve those documents first
- Consider indexing failed repair attempts too — "tried X, didn't work" is valuable knowledge
