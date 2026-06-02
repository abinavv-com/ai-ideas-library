# 066 · SKU Rationalization Agent

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: 💰 Cost Savings
> **Helps**: Mihir, Roshan (IT) | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Analyzes 15,000+ SAP SKUs for: last transaction date, frequency of use, and open order relevance. Flags candidates for archiving — reducing the master data noise that slows procurement and planning decisions, and eliminating storage costs for truly dead inventory.

---

## Implementation Blueprint

### Architecture
```
SAP MM: Extract all 15,000+ material master records with transaction history 
→ Python clustering + ABC/XYZ analysis 
→ Classify each SKU: Active / Slow-moving / Dormant / Candidate for archival 
→ Cross-check against open production orders (don't archive needed materials) 
→ Rationalization report + flagging list for Mihir/Roshan review
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Source | SAP MM material master + transaction history | All SKU data |
| Analysis | Python `pandas` | ABC/XYZ classification |
| Safety Check | SAP PP + SD open order check | Don't archive needed materials |
| Clustering | Python `scikit-learn` K-Means (optional) | Group similar SKUs |
| Output | Excel report + SharePoint | Rationalization list |
| SAP Action | SAP MM archiving flag (MMAM) | Mark for archival |

### ABC/XYZ Classification
```python
def classify_sku(material_id, transaction_data):
    """
    ABC = Value analysis (A = high value, B = medium, C = low)
    XYZ = Usage frequency (X = regular, Y = irregular, Z = rare/dormant)
    """
    
    # Usage data
    last_12m_transactions = get_transactions(material_id, months=12)
    last_24m_transactions = get_transactions(material_id, months=24)
    last_transaction_date = get_last_transaction_date(material_id)
    
    # ABC classification (by annual spend)
    annual_spend = sum(t.quantity * t.unit_price for t in last_12m_transactions)
    # A: Top 20% of materials = 80% of spend
    # B: Next 30% of materials = 15% of spend  
    # C: Bottom 50% of materials = 5% of spend
    abc_class = classify_abc(annual_spend, all_material_spends)
    
    # XYZ classification (by frequency regularity)
    monthly_usage = [count_transactions(material_id, month) for month in last_12_months]
    variation_coefficient = np.std(monthly_usage) / max(np.mean(monthly_usage), 0.01)
    
    if variation_coefficient < 0.5:
        xyz_class = 'X'  # Regular, predictable usage
    elif variation_coefficient < 1.0:
        xyz_class = 'Y'  # Irregular usage
    else:
        xyz_class = 'Z'  # Highly sporadic or zero usage
    
    # Dormancy check
    days_since_last_use = (today - last_transaction_date).days
    
    return {
        'abc': abc_class,
        'xyz': xyz_class,
        'days_dormant': days_since_last_use,
        'annual_spend': annual_spend,
        'combined_class': f"{abc_class}{xyz_class}"
    }
```

### Rationalization Categories
```python
rationalization_rules = {
    "IMMEDIATE_ARCHIVE": {
        "criteria": "CZ or BZ class AND no transaction in 24 months AND zero open orders",
        "description": "Low value, sporadic use, completely inactive",
        "recommended_action": "Archive in SAP — move physical stock to liquidation"
    },
    "REVIEW_FOR_ARCHIVE": {
        "criteria": "CZ or BZ class AND no transaction in 12 months",
        "description": "Possibly obsolete — but verify with maintenance team",
        "recommended_action": "Confirm with Anurag Singh before archiving"
    },
    "CONSOLIDATION_CANDIDATE": {
        "criteria": "Two or more SKUs with identical specifications (different vendor codes)",
        "description": "Duplicate materials in master data",
        "recommended_action": "Merge to single SKU, update open orders to new code"
    },
    "SAFETY_STOCK_ZERO": {
        "criteria": "AX or BX class but safety stock = 0 in SAP",
        "description": "Critical, regular-use item with no inventory protection",
        "recommended_action": "Urgent: set safety stock level immediately"
    },
    "KEEP_ACTIVE": {
        "criteria": "Any open production order OR last 6 months usage > 0",
        "description": "Currently needed — do not archive"
    }
}
```

### Duplicate SKU Detection
```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def find_duplicate_skus(materials):
    """Find materials with similar descriptions that may be duplicates"""
    descriptions = [m['description'] for m in materials]
    
    # TF-IDF vectorize descriptions
    tfidf = TfidfVectorizer(ngram_range=(1, 2))
    vectors = tfidf.fit_transform(descriptions)
    
    # Find pairs with high similarity (>85%)
    similarity_matrix = cosine_similarity(vectors)
    
    duplicates = []
    for i, j in combinations(range(len(materials)), 2):
        if similarity_matrix[i][j] > 0.85:
            duplicates.append({
                'material_1': materials[i]['id'],
                'material_2': materials[j]['id'],
                'description_1': materials[i]['description'],
                'description_2': materials[j]['description'],
                'similarity': similarity_matrix[i][j]
            })
    
    return duplicates
```

### Rationalization Report Output
```
SAP SKU RATIONALIZATION ANALYSIS — June 2026
Total SKUs analyzed: 15,247 | Scope: Anjar plant

SUMMARY:
IMMEDIATE ARCHIVE (no business risk): 1,847 SKUs (₹12.3L tied inventory)
REVIEW FOR ARCHIVE (check with users): 3,124 SKUs
CONSOLIDATION CANDIDATES: 412 potential duplicate pairs
SAFETY STOCK GAPS: 87 active materials with no safety stock set

TOP RECOMMENDATIONS:
1. Archive 1,847 CZ dormant SKUs → Reduces system clutter by 12%
2. Investigate 412 potential duplicates → Merge reduces ordering complexity
3. Set safety stock on 87 active-but-unprotected materials → Reduces stockout risk

INVENTORY TO LIQUIDATE (IMMEDIATE_ARCHIVE category):
Value: ₹12.3L in obsolete stock
Recommended: Return to suppliers (where possible), sell to scrap

TOP 10 HIGH-VALUE DORMANT SKUs:
| Material | Description | Value | Last Used |
|---|---|---|---|
| 4521-882 | Zinc spray gun nozzle assembly | ₹1.4L | 3.2 years ago |
| [...]
```

### Estimated Build Time
- SAP data extraction: 1 day
- ABC/XYZ analysis: 1 day
- Duplicate detection: 1 day
- Report generation: 1 day
- Total: 4–5 days

---

## Related Ideas
- [[069 - SKU Supply Shortage Predictor]] — the active SKUs this tool identifies need predictive stocking
- [[053 - Spares Auto-Purchase Requisition Bot]] — only runs on active, non-archived SKUs
- [[047 - Spare Parts Inventory Reality Check]] — physical count confirms dormancy
- [[015 - Blanket PO Utilization Alert]] — fewer SKUs = cleaner blanket PO management
- [[066 - SKU Rationalization Agent]] — self

---

## Notes
- Never archive without a final check against open production/sales orders — SAP should block this but manual verification avoids errors
- Get sign-off from both Anurag Singh (maintenance spares) and Mihir (raw materials) before archiving — the same material number can serve both procurement and maintenance
- Run the rationalization annually — new SKUs accumulate quickly and the problem recurs if not maintained
