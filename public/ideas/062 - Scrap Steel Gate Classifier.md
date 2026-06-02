# 062 · Scrap Steel Gate Classifier (Vision)

> **Section**: Supply Chain & Procurement | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: DI pipe procurement | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Camera at the scrap delivery gate uses a vision model to classify scrap steel type (HMS 1, HMS 2, bundled turnings) from overhead photos — creating an objective grade record before material enters the yard. Prevents scrap vendors from delivering lower-grade material while charging for premium grades.

---

## Implementation Blueprint

### Architecture
```
Truck enters gate → Overhead camera triggered by gate barrier 
→ Captures top-down photo of scrap load on truck bed 
→ YOLOv8 classifier: HMS1 / HMS2 / mixed / turnings / non-conforming 
→ Classification + confidence → Weigh-bridge integration → 
PASS (matches invoice grade) / FLAG (grade discrepancy) 
→ Photo + classification archived to vendor record
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Camera | Fixed overhead industrial IP camera (PTZ or fixed) | Capture truck load image |
| Trigger | Gate barrier controller → camera API | Automated capture |
| Model | YOLOv8 classification (or segmentation for mixed loads) | Scrap grade detection |
| Inference | Edge server at gate (NVIDIA Jetson or ruggedized PC) | Local processing |
| Integration | n8n → weight bridge system → SAP MM | Grade + weight → goods receipt |
| Archive | SharePoint with vendor ID and date | Evidence record |

### Scrap Grades to Classify
```python
scrap_classes = {
    "HMS1": {
        "description": "Heavy Melting Scrap Grade 1 — clean, 6mm+ thick, no coatings",
        "visual_features": "Large, heavy pieces, dark/rusted, uniform appearance",
        "typical_price_premium": "baseline"
    },
    "HMS2": {
        "description": "Heavy Melting Scrap Grade 2 — 3–6mm thick, some small pieces",
        "visual_features": "Mixed sizes, lighter pieces included, may have coatings",
        "typical_price_premium": "-5 to -10% vs HMS1"
    },
    "TURNINGS": {
        "description": "Machine turnings/swarf — low density, coiled chips",
        "visual_features": "Curly metal chips, high void space in load",
        "typical_price_premium": "-20 to -30% vs HMS1"
    },
    "MIXED_LOW": {
        "description": "Mixed scrap with non-conforming material",
        "visual_features": "Variety of materials, potential non-ferrous contamination",
        "typical_price_premium": "-15 to -25%"
    },
    "NON_CONFORMING": {
        "description": "Unacceptable: non-ferrous, painted, galvanized, contains concrete",
        "visual_features": "Colored materials, concrete chunks, aluminum, copper",
        "action": "REJECT"
    }
}
```

### Training Data Challenges
Scrap classification is challenging:
- Variable lighting (day/night, weather)
- Variable camera angle (truck height varies)
- Partially concealed layers (top layer may differ from bottom)
- High intra-class variability (HMS1 looks different depending on source)

Strategy:
1. Install camera first, capture 2–3 weeks of truck images
2. Get Welspun's scrap yard supervisor to label 300+ images per class
3. Augment: rotate, brightness adjust, crop to 5,000+ images
4. Train YOLOv8 classifier
5. Validate: compare AI classification with yard supervisor's independent assessment on 100 trucks

### Uncertainty Handling
```python
def classify_scrap_load(image, confidence_threshold=0.75):
    result = model(image)
    predicted_class = result['class']
    confidence = result['confidence']
    
    if confidence >= confidence_threshold:
        return predicted_class, 'AUTO_CLASSIFY', confidence
    elif confidence >= 0.50:
        # Borderline — flag for manual review but don't reject
        return predicted_class, 'MANUAL_REVIEW_REQUIRED', confidence
    else:
        # Very uncertain — always manual
        return 'UNCERTAIN', 'MANDATORY_MANUAL_INSPECTION', confidence
```

### Gate Integration Workflow
```
Truck arrives at gate → 
1. Driver presents delivery note (vendor + grade invoiced)
2. Camera captures overhead image of scrap load
3. AI classifies: "HMS1 — 87% confidence"
4. Compare to delivery note: "HMS1" → MATCH
5. Gate opens → truck proceeds to weigh-bridge → goods receipt in SAP
6. Photo archived with: truck number, driver, vendor, AI classification, weight

If AI says "HMS2" but delivery note says "HMS1" → MISMATCH:
1. Gate does NOT open automatically
2. Alert to yard supervisor (WhatsApp/Teams)
3. Supervisor views live camera + AI result on phone
4. Decides: accept with grade adjustment, reject, or override
```

### Commercial Impact
Every 100 tons of HMS2 billed as HMS1:
- Price difference: ~₹1,400/ton
- Total mischarging: ₹1,40,000 per 100-ton load
- At 50 trucks/month: potential ₹7,00,000/month in undetected mis-grading

### Estimated Build Time
- Camera installation: 1 week
- Data collection + labelling: 4–6 weeks
- Model training: 1 week
- Gate integration: 2 weeks

### Hardware Cost
- Industrial overhead camera (IP camera, weatherproof): ~₹15,000–30,000
- Edge server (Jetson Nano or ruggedized mini PC): ~₹20,000–35,000
- Mounting hardware + weatherproofing: ~₹10,000
- Total: ~₹45,000–75,000

---

## Related Ideas
- [[031 - Surface Rust Severity Classifier]] — same YOLOv8 classification approach for plate rust
- [[056 - Steel Scrap Price Forecaster]] — scrap price context for gate-level decisions
- [[038 - DI Furnace Melt Composition Estimator]] — scrap quality affects melt composition
- [[065 - Vendor Reliability Scorecard]] — scrap grade compliance feeds vendor scoring
- [[026 - Pipe Stencil OCR Verifier]] — shares vision system infrastructure philosophy

---

## Notes
- The camera should capture the ENTIRE truck bed from above — partial images miss the material quality variation between surface and bottom layers
- Building a "vendor grade history" database is a key long-term asset: which vendors consistently deliver correct grades (good vendors) vs. which have a pattern of mis-grading (watch list)
- Supplement with: XRF spot test for suspected non-ferrous contamination (< 5 min manual test that the AI can prompt when detecting color anomalies)
