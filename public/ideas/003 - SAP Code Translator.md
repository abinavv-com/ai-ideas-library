# 003 · SAP Code Translator (Gujarati / Hindi)

> **Section**: Quick Wins | **Complexity**: 🟢 Week 1–4 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh's maintenance team | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Translates cryptic SAP PM order codes and error messages into plain Gujarati or Hindi instructions on a shop floor tablet — so mechanics can act without calling the office. Eliminates the language barrier between SAP and the people who actually fix machines.

---

## Implementation Blueprint

### Architecture
```
Android Tablet (shop floor) → Simple Web App / PWA 
→ Worker types/pastes SAP code or error → 
→ Ollama (local LLM: Llama 3.1 8B) → Plain language translation (Hindi/Gujarati) 
→ Displayed on tablet screen
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Runtime | Ollama (local, no internet) | Serve LLM on-premise |
| LLM Model | Llama 3.1 8B (8-bit quantized) | Multilingual translation |
| Frontend | Simple HTML/PWA or React Native | Tablet UI |
| Hosting | Local PC/server in maintenance office | Keep data on-site |
| Hardware | Android tablet (₹8,000–15,000) | Shop floor access point |

### Why Local (Ollama) Not Cloud
- Shop floor may have limited internet
- SAP PM data is sensitive — keep on-premise
- Llama 3.1 8B handles Hindi/Gujarati well enough for technical instructions
- No per-query API cost

### Prompt Template
```
You are a maintenance assistant for a pipe manufacturing plant in India.
Translate the following SAP PM order code / error message into simple, 
clear Hindi (Devanagari script) that a machine operator can understand.
Include: what the problem is, what action to take first, and who to call if unsure.
SAP Input: {{sap_code_or_message}}
```

### Build Steps
1. Set up a low-cost PC or mini PC (Intel NUC or similar) in the maintenance office
2. Install Ollama: `curl -fsSL https://ollama.ai/install.sh | sh`
3. Pull model: `ollama pull llama3.1:8b`
4. Build a simple HTML page (single file, no framework) with:
   - Text input field ("Enter SAP code or paste error message")
   - Language toggle: Hindi / Gujarati
   - "Translate" button → calls Ollama local API (`http://localhost:11434/api/generate`)
   - Output displayed in large readable font (minimum 18pt for shop floor)
5. Host the HTML file on the local PC's web server (Python `http.server` or NGINX)
6. Open the URL on Android tablets via Chrome (bookmark as home screen shortcut = PWA feel)
7. Pre-load a lookup table of the 50 most common SAP PM codes with pre-translated descriptions (faster than LLM for known codes)

### Hardware Requirement
- 1× Mini PC or laptop (8GB RAM minimum for Llama 3.1 8B quantized)
- 2–4× Android tablets with Chrome browser
- Local WiFi in maintenance area

### Estimated Build Time
- Developer: 1 day
- Non-developer with basic HTML knowledge: 2–3 days

### Cost
- Ollama: Free and open source
- Llama 3.1 8B: Free (Meta open weights)
- Hardware: ₹25,000–40,000 for mini PC if not available
- Tablets: ₹8,000–15,000 each if not available
- Ongoing cost: ₹0 (fully local)

---

## Related Ideas
- [[008 - Maintenance Log Search Agent]] — companion tool for finding historical fixes
- [[016 - SOP Chatbot]] — same local LLM infrastructure can serve both
- [[054 - Machine Breakdown RCA Knowledge Base]] — pairs with this for diagnosis
- [[095 - Sathi Multilingual Shop Floor Voice Assistant]] — voice-enabled version of this concept
- [[091 - PipeGPT Welspun Local LLM]] — the enterprise-grade version of this local LLM setup

---

## Notes
- Gujarati support in Llama 3.1 8B is decent but not perfect; validate key SAP codes manually before rollout
- Create a whitelist of the 100 most-used SAP PM codes with manually verified translations — use LLM only for unknown codes
- Consider adding a "Was this helpful? Yes/No" button to collect feedback and improve over time
