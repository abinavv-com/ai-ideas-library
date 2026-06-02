# 088 · Tax Audit Readiness Agent

> **Section**: Finance & Reporting | **Complexity**: 🔵 Month 4–6 | **Impact**: 🛡️ Compliance
> **Helps**: Mahesh, CFO | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Continuously monitors SAP FI data for common audit risk triggers (unreconciled intercompany transactions, missing supporting documents, misclassified expenses) — creating a rolling audit-readiness dashboard instead of a panic scramble when the auditor walks in.

---

## Implementation Blueprint

### Architecture
```
n8n weekly run → SAP FI queries → 
Run rule engine: check 50+ audit risk patterns → 
Flag: HIGH / MEDIUM / LOW risk items → 
Create tasks in SharePoint for finance team to resolve → 
Monthly audit readiness score → Report to Mahesh
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| SAP FI Data | RFC queries on FI tables (BKPF, BSEG, BSID) | Financial transactions |
| Rule Engine | Python rules library | Audit risk pattern detection |
| Task Management | SharePoint list or Jira | Resolution tracking |
| Dashboard | Power BI | Audit readiness score |
| Alerts | Teams | Urgent risk notifications |

### Audit Risk Rules (50+ Checks)
```python
audit_rules = {
    # INTERCOMPANY
    "ICO_unreconciled": {
        "check": "Intercompany payables ≠ corresponding receivables (after netting)",
        "sap_query": "SELECT...FROM BSID WHERE account_type='IC' AND cleared=False AND days_open>30",
        "severity": "HIGH",
        "reason": "Tax authorities look for income shifting through ICO mismatches"
    },
    
    # REVENUE
    "revenue_recognition_early": {
        "check": "Revenue booked before delivery confirmed in SAP SD",
        "sap_query": "JOIN FI_billing WITH SD_delivery WHERE billing_date < GR_date",
        "severity": "HIGH",
        "reason": "Ind AS 115 — revenue only on transfer of control"
    },
    
    # EXPENSES
    "capital_vs_revenue_misclassification": {
        "check": "Expenses >₹50L posted to P&L that might be capital in nature",
        "keywords": ["renovation", "installation", "major overhaul"],
        "severity": "MEDIUM",
        "reason": "Common trigger in IT assessments"
    },
    
    "related_party_disclosure": {
        "check": "Transactions with entities in {{related_party_list}} > ₹1Cr not disclosed in notes",
        "severity": "HIGH",
        "reason": "Mandatory RPT disclosure under Companies Act + SEBI"
    },
    
    # GST
    "gst_input_credit_mismatch": {
        "check": "GST input credit claimed vs. GSTR-2B purchase register mismatch",
        "threshold_inr": 100000,  # Flag if >₹1L mismatch
        "severity": "HIGH",
        "reason": "GST department scrutiny — Input Credit Reversal + penalty"
    },
    
    "export_gst_refund_pending": {
        "check": "Export invoices >90 days with no IGST refund application",
        "severity": "MEDIUM",
        "reason": "Refund claims have limitation period; missed refunds = lost cash"
    },
    
    # DOCUMENTATION
    "missing_invoice_for_large_payment": {
        "check": "Payment >₹5L to vendor without corresponding vendor invoice in SAP",
        "severity": "HIGH",
        "reason": "Disallowance risk under Income Tax Act"
    },
    
    "section_40A_3_cash_payments": {
        "check": "Cash payments to any person >₹10,000 in a day (IT Act Section 40A(3))",
        "severity": "HIGH",
        "reason": "Mandatory disallowance"
    }
}
```

### Audit Readiness Score
```python
def calculate_audit_readiness_score(rule_results):
    """
    Score out of 100:
    - Start with 100
    - Deduct points for each open risk item
    """
    score = 100
    
    for result in rule_results:
        if result['severity'] == 'HIGH':
            score -= min(result['count'] * 5, 20)  # Max 20 points deduction per category
        elif result['severity'] == 'MEDIUM':
            score -= min(result['count'] * 2, 10)
        elif result['severity'] == 'LOW':
            score -= min(result['count'] * 0.5, 5)
    
    return max(0, score)

# Audit readiness grades:
# 90-100: EXCELLENT — ready for audit
# 75-89: GOOD — minor items to resolve
# 60-74: NEEDS ATTENTION — resolve within 30 days
# <60: CRITICAL — immediate finance team review required
```

### Monthly Audit Readiness Report
```
AUDIT READINESS REPORT — May 2026
Generated: 2026-06-01 | For: Mahesh (CFO) | Overall Score: 78/100 (GOOD)

🔴 HIGH RISK ITEMS (5 items — Action Required):
1. Intercompany balance mismatch with Welspun Corp Ltd (parent) — ₹3.2Cr unreconciled
   Open for 67 days | Treasury/Finance: Investigate WCL-WPL ICO entries
   
2. GST input credit discrepancy — Claimed ₹47L vs. GSTR-2B ₹41L
   6 vendors not filed their GSTR-1 → ITC reversal risk
   Action: Follow up with vendors ABC, XYZ to file GSTR-1

3. 3 vendor payments >₹10L without invoices in SAP (total ₹34.2L)
   Action: Obtain invoices or reverse payments

🟡 MEDIUM RISK ITEMS (8 items):
[...listed...]

🟢 LOW RISK ITEMS (14 items — Log only):
[...listed...]

TREND: Score improved from 71 (April) to 78 (May) — ₹8.2Cr of ICO resolved ✅

NEXT STATUTORY AUDIT: Q3 2026 (est.) — 3 months to resolve remaining issues
```

### Estimated Build Time
- SAP FI query development: 2 weeks
- Rule engine: 1 week
- Dashboard + scoring: 1 week
- Total: ~4 weeks

---

## Related Ideas
- [[081 - Real-Time Working Capital Dashboard]] — working capital data that underpins audit
- [[089 - Budget vs Actual Variance Alert]] — budget variances are an audit trigger
- [[017 - Legal Compliance Calendar Bot]] — compliance dates for tax filings
- [[019 - Export Incentive Calculator]] — export incentive claims are an audit area
- [[085 - EU CBAM Carbon Certificate Generator]] — another compliance documentation need

---

## Notes
- Build the rule list with Welspun's statutory auditors in the first month — they know which specific risk areas are most relevant for the pipe division
- Run the system in "report only" mode for the first 6 months — don't create SAP work items automatically until the rules are calibrated for Welspun's context
- The greatest value is the intercompany reconciliation check — unreconciled ICO balances are a source of IT assessment additions that typically result in tax demands
