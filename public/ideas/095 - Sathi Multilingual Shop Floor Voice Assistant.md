# 095 · Sathi — Multilingual Shop Floor Voice Assistant

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: ⚡ Efficiency
> **Helps**: All shop floor workers | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Voice-activated Gujarati/Hindi AI assistant on ruggedized tablets at machine stations. Workers ask troubleshooting questions in their language, get SOP-backed answers, and the query is automatically logged to the maintenance system — bridging the language gap between the SAP/English world and the Gujarati-speaking shop floor.

---

## Implementation Blueprint

### Architecture
```
Worker speaks in Gujarati/Hindi → 
Whisper.cpp (local, fast transcription) → 
Text sent to [[091 - PipeGPT Welspun Local LLM]] / [[016 - SOP Chatbot]] → 
Answer retrieved (SOP database, RCA database) → 
gTTS (Google Text-to-Speech) or Coqui TTS → 
Answer spoken back in Gujarati/Hindi → 
Query + answer logged to maintenance/knowledge system
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Voice Capture | Android tablet microphone | Speech input |
| Transcription | Whisper.cpp (local, fast, multilingual) | Speech-to-text |
| Language | Llama 3.1 8B (local, via Ollama) | Multilingual understanding |
| Knowledge Base | [[016 - SOP Chatbot]] + [[054 - Machine Breakdown RCA Knowledge Base]] | Domain knowledge |
| TTS | gTTS (Google) or Coqui TTS (local) | Text-to-voice |
| UI | Android PWA or React Native | Tablet interface |
| Logging | n8n → SharePoint | Query audit log |

### Whisper.cpp Multilingual Capabilities
```bash
# Whisper supports Hindi well, Gujarati is improving
# Run locally — no internet needed
./whisper -m models/ggml-medium.bin -l hi --output-txt

# For Gujarati: use medium or large model
# Whisper processes 3-minute audio in ~15 seconds on Raspberry Pi 4
```

### Wake Word Detection
```python
# Use Porcupine (Picovoice) wake word detection
# Wake word: "Sathi" (साथी / સાથી) — means "companion" in Hindi/Gujarati
# Porcupine runs on device (8MB, low power) — activates Whisper on trigger

import pvporcupine

porcupine = pvporcupine.create(
    keywords=["sathi"],
    sensitivities=[0.7]
)
# When "Sathi" heard → activate recording → send to Whisper
```

### Multilingual Response Generation
```python
def answer_worker_query(transcribed_text, language='hi'):
    """
    transcribed_text: "HSAW मोटर में grinding sound आ रहा है क्या करूं?"
    language: 'hi' (Hindi) or 'gu' (Gujarati)
    """
    
    # Step 1: Translate to English for knowledge base search (Llama 3.1 handles this)
    english_query = translate_to_english(transcribed_text)
    
    # Step 2: Search SOP + RCA knowledge base (ChromaDB vector search)
    relevant_context = knowledge_base.search(english_query, n_results=3)
    
    # Step 3: Generate answer in Hindi/Gujarati
    prompt = f"""
    You are Sathi, a helpful assistant for workers at Welspun pipe factory.
    Answer in {language} (Hindi/Gujarati) using simple, clear language a technician would understand.
    Base your answer ONLY on the context provided.
    If the answer is not in the context, say "मुझे माफ करें, यह जानकारी मेरे पास नहीं है। अपने सुपरवाइज़र से पूछें।"
    
    Context (SOPs and past repair records): {relevant_context}
    Worker's question: {transcribed_text}
    """
    
    answer = local_llm.generate(prompt)
    
    # Step 4: Speak the answer
    tts = gTTS(text=answer, lang='hi')
    tts.save('response.mp3')
    play_audio('response.mp3')
    
    # Step 5: Log the query
    log_query({
        'query': transcribed_text,
        'english_equivalent': english_query,
        'answer': answer,
        'timestamp': datetime.now(),
        'machine_station': get_current_station()
    })
```

### Example Interactions
```
Worker: [presses big green "Sathi" button on tablet]
System: "हाँ? बोलिए।" (Yes? Please speak.)

Worker: "HSAW Line 2 पे strip ग़लत जा रहा है, क्या करूं?"
        (HSAW Line 2 strip is going wrong direction, what to do?)

Sathi: "HSAW स्ट्रिप deviation के लिए यह steps follow करें:
        पहला, strip entry guide check करें — यह loose हो सकता है।
        दूसरा, strip guide roller पर ध्यान दें — अगर worn हो तो maintenance को बुलाएं।
        तीसरा, अगर deviation 2 degree से ज्यादा है तो production रोकें और supervisor को बुलाएं।
        
        पिछली बार यही problem November 2025 में हुई थी, उस time guide roller change करना पड़ा था।
        Spare part: SR-HSAW-044, stock में 2 EA available हैं (Bin S-12-A में)।"

[Answer also displayed as text on screen]
[Log entry created: "HSAW strip deviation query at Station HSAW-2, 14:32"]
```

### Ruggedized Tablet Requirements
- IP65 rating (dustproof, water-resistant) for factory floor
- Large (10"+) screen with large text for easy reading
- Large hardware button for push-to-talk (gloved hands)
- Bright screen (1000+ nits) for outdoor/high-ambient-light areas
- Brands: Panasonic Toughpad FZ-A3, Samsung Tab Active4 Pro
- Cost: ₹30,000–60,000 per tablet

### Deployment Model
- 1 Sathi station per production line (initially 4 stations)
- Each station: 1 tablet + 1 external speaker for group use
- Central server for Whisper + LLM inference (shared across all stations via WiFi)
- Offline backup: pre-indexed top-50 FAQs stored locally on tablet

### Estimated Build Time
- Whisper integration: 2 weeks
- Knowledge base in Hindi: 4 weeks (translation of SOPs)
- PWA/React Native app: 3 weeks
- Wake word detection: 1 week
- Testing with workers: 4 weeks (critical — language quality must be tested with actual users)
- Total: ~3 months

### Cost
- Ruggedized tablets (4×): ~₹1.6–2L
- Central inference server: Shared with [[091 - PipeGPT Welspun Local LLM]] infrastructure
- gTTS: Free (or Coqui TTS for local Gujarati voice: free open source)
- Total hardware: ~₹2L

---

## Related Ideas
- [[091 - PipeGPT Welspun Local LLM]] — knowledge backbone for Sathi
- [[016 - SOP Chatbot]] — text-based precursor to this voice interface
- [[003 - SAP Code Translator]] — same Gujarati/Hindi language focus
- [[054 - Machine Breakdown RCA Knowledge Base]] — primary knowledge source
- [[008 - Maintenance Log Search Agent]] — search layer that Sathi queries

---

## Notes
- The MOST important validation: have actual shop floor workers (not managers) test the product. Technical accuracy is less important than language naturalness — a grammatically correct but "bookish" Hindi will not be trusted by Gujarati workers who speak colloquial Hindi.
- Gujarati TTS (text-to-speech) quality is lower than Hindi — consider starting with Hindi and adding Gujarati later
- Privacy note: queries are logged — communicate to workers what is logged, why, and who can see it. Workers should know Sathi is a help tool, not surveillance.
