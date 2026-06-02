# 079 · Corrosion Risk Pipe Storage Mapper

> **Section**: Yard & Logistics | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Safety
> **Helps**: MA Forbush, QA | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Combines pipe storage duration, yard GPS zone (proximity to sea/humidity sensor data), and coating type — generating a risk heat map of which pipe batches are at highest corrosion risk and need priority shipment or supplementary protection before their coating warranty period expires.

---

## Implementation Blueprint

### Architecture
```
[[072 - Pipe Location Digital Map]] → storage duration per batch 
+ Weather API → historical rainfall + humidity per zone 
+ Yard humidity sensors → zone-level moisture tracking 
+ Pipe spec (coating type + thickness) → protection duration estimate 
→ Python risk model → Heatmap visualization 
→ Monthly priority shipment recommendations to MA Forbush + Mihir
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Pipe Location | [[072 - Pipe Location Digital Map]] | Storage duration + zone |
| Weather Data | Weather API (OpenMetaeo — free) | Rainfall, humidity, salt air |
| Humidity Sensors | DHT22 sensors per yard zone (from [[028 - Flux Moisture Contamination Detector]] infrastructure) | Local humidity readings |
| Risk Model | Python scoring model | Corrosion risk per batch |
| Visualization | Python `folium` or Power BI | Geographic heatmap |
| Alert | n8n + Teams | Priority shipment recommendations |

### Corrosion Factors for Pipe Yard Storage
```python
corrosion_risk_factors = {
    # Location factors (0-10 score each)
    "proximity_to_sea_km": {
        "<2km": 8,
        "2-10km": 5,
        ">10km": 2
    },
    # Anjar, Gujarat is ~25km from coast — moderate salt air exposure
    
    "zone_drainage": {
        "low_lying_waterlogging": 7,
        "flat_normal_drainage": 4,
        "elevated_good_drainage": 2
    },
    
    "shade_exposure": {
        "direct_sun_all_day": 6,  # Thermal cycling damages coatings
        "partial_shade": 3,
        "shade": 1
    },
    
    # Environmental factors
    "avg_daily_humidity_pct": {
        ">80%": 8,
        "60-80%": 5,
        "<60%": 2
    },
    
    "rainfall_mm_per_month": {
        ">200mm": 7,  # Monsoon season in Gujarat
        "50-200mm": 4,
        "<50mm": 2
    }
}

# Coating protection factors
coating_protection = {
    "3LPE_3.5mm": {"max_storage_months": 24, "base_risk_reduction": 0.9},
    "3LPE_2.5mm": {"max_storage_months": 18, "base_risk_reduction": 0.85},
    "FBE_400um": {"max_storage_months": 12, "base_risk_reduction": 0.7},
    "Bare_steel": {"max_storage_months": 3, "base_risk_reduction": 0.1},
    "3LPP_3.5mm": {"max_storage_months": 36, "base_risk_reduction": 0.95}
}
```

### Risk Score Calculation
```python
def calculate_corrosion_risk(pipe_batch):
    storage_days = (today - pipe_batch.yard_entry_date).days
    coating = pipe_batch.coating_type
    zone = pipe_batch.yard_zone
    
    # Base time risk
    max_days = coating_protection[coating]['max_storage_months'] * 30
    time_risk = storage_days / max_days  # 0-1 scale, 1 = at storage limit
    
    # Environmental risk score (0-10)
    env_score = (
        corrosion_risk_factors['proximity_to_sea_km'][get_zone_sea_distance(zone)] +
        get_zone_humidity_score(zone) +  # From humidity sensors
        get_seasonal_factor(today.month)  # Monsoon = high risk
    ) / 3  # Normalize to 0-10
    
    # Combined risk
    combined_risk = (time_risk * 0.5) + (env_score/10 * 0.3) + (0.2 * is_customer_behind_schedule(pipe_batch))
    
    if combined_risk > 0.8:
        return 'CRITICAL', combined_risk
    elif combined_risk > 0.6:
        return 'HIGH', combined_risk
    elif combined_risk > 0.4:
        return 'MEDIUM', combined_risk
    else:
        return 'LOW', combined_risk
```

### Risk Heatmap
```python
import folium

def generate_yard_heatmap(pipe_batches):
    m = folium.Map(location=[23.079, 70.035], zoom_start=17)
    
    color_map = {
        'CRITICAL': '#FF0000',  # Red
        'HIGH': '#FF6600',      # Orange
        'MEDIUM': '#FFAA00',    # Yellow
        'LOW': '#00AA00'        # Green
    }
    
    for batch in pipe_batches:
        risk_level, risk_score = calculate_corrosion_risk(batch)
        
        folium.CircleMarker(
            location=[batch.lat, batch.lng],
            radius=15,
            color=color_map[risk_level],
            fill=True,
            popup=f"""
            Heat: {batch.heat_number}
            Grade: {batch.grade}
            Coating: {batch.coating_type}
            In yard: {batch.storage_days} days
            Risk: {risk_level} ({risk_score:.2f})
            Customer: {batch.customer}
            Planned ship date: {batch.ship_date}
            """
        ).add_to(m)
    
    m.save('yard_risk_map.html')
```

### Monthly Priority Shipment Report
```
CORROSION RISK REPORT — June 2026
Prepared for: MA Forbush (Yard) + Mihir (Logistics)

CRITICAL RISK (Ship within 2 weeks):
1. Batch HT-45221 — 89 pipes, 20" X65 FBE coating
   Storage: 18 months (FBE max storage: 12 months) ← OVERDUE
   Zone B4: High humidity (avg 78% last 30 days)
   Customer: JJM Punjab (not yet confirmed ship date) 
   Action: Contact customer to accelerate LC + booking

2. Batch HT-45098 — 142 pipes, 24" X70 Bare Steel
   Storage: 2.8 months (bare steel max: 3 months)
   Light surface rust forming — visible in drone imagery
   Action: EITHER ship immediately OR apply temporary coating

HIGH RISK (Ship within 4 weeks): 4 batches [listed...]

MEDIUM RISK (Monitor): 12 batches [listed...]
LOW RISK: 89 batches — no action needed

SEASONAL NOTE: Gujarat monsoon starts June 15. ALL yard-stored pipes 
will shift to higher risk category. Recommend prioritizing shipments before June 15.
```

### Estimated Build Time
- Risk model: 1 week (after location + sensor data available)
- Heatmap visualization: 2 days
- Report automation: 2 days
- Total: ~2 weeks (depends on [[072 - Pipe Location Digital Map]] being live)

---

## Related Ideas
- [[072 - Pipe Location Digital Map]] — foundation this tool builds on
- [[071 - Drone Pipe Counter Inventory Map]] — drone imagery shows visible rust
- [[028 - Flux Moisture Contamination Detector]] — same humidity sensor infrastructure
- [[074 - Stack Safety Height Monitor]] — shares yard monitoring theme
- [[004 - Port Congestion Alert Bot]] — port delays extend storage duration

---

## Notes
- This tool is most valuable in advance of monsoon season (April-May in Gujarat) — give MA Forbush a seasonal warning each year before the rains
- Calibrate the model with actual coating inspection data: which batches that the model flagged as HIGH risk actually showed corrosion? Use this to improve risk score accuracy
- For export pipes, check the destination country's acceptance criteria for surface condition — some projects (especially sour service) have strict limitations on rust staining even on external coating
