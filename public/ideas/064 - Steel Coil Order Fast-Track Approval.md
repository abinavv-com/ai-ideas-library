# 064 · Steel Coil Order Fast-Track Approval

> **Section**: Supply Chain & Procurement | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Mihir | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Replaces the current 4–6 day approval chain for steel orders with a digital approval workflow with a 4-hour SLA. Approvers are notified instantly; reminders fire automatically; urgent spot-market windows (where prices are valid for 24 hours) are not missed due to internal process delay.

---

## Implementation Blueprint

### Architecture
```
Mihir raises steel order request (web form or SAP) 
→ n8n routes to appropriate approvers based on order value 
→ Teams adaptive card with approve/reject buttons 
→ Automatic escalation if not actioned within SLA 
→ SAP PO auto-created upon full approval 
→ Vendor notified with order confirmation
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Request Form | SAP MM requisition or Microsoft Forms | Order request submission |
| Orchestration | n8n | Approval routing + escalation |
| Approval | Teams Adaptive Card | One-click approval |
| SLA Tracking | n8n timer nodes | Countdown + escalation |
| SAP PO Creation | BAPI `BAPI_PO_CREATE1` | Auto-create PO when approved |
| Vendor Notification | Email via n8n | Order confirmation to supplier |

### Approval Matrix (By Order Value)
```python
approval_matrix = {
    "below_10L": {
        "approvers": ["procurement_manager"],
        "sla_hours": 2,
        "type": "single_approval"
    },
    "10L_to_50L": {
        "approvers": ["procurement_manager", "plant_head"],
        "sla_hours": 4,
        "type": "sequential_approval"  # Procurement → Plant Head
    },
    "50L_to_2Cr": {
        "approvers": ["procurement_manager", "plant_head", "CFO"],
        "sla_hours": 8,
        "type": "sequential_approval"
    },
    "above_2Cr": {
        "approvers": ["procurement_manager", "CFO", "MD"],
        "sla_hours": 24,
        "type": "sequential_approval"
    },
    
    # URGENT spot market override
    "urgent_spot_market": {
        "flag": "URGENT — Price valid 24 hours",
        "approvers": ["procurement_manager", "plant_head"],
        "sla_hours": 2,  # Compressed SLA for urgent cases
        "type": "parallel_approval"  # Both approve simultaneously
    }
}
```

### Teams Approval Card
```json
{
  "type": "AdaptiveCard",
  "body": [
    {"type": "TextBlock", "text": "🔔 STEEL ORDER APPROVAL REQUIRED", "size": "large"},
    {"type": "FactSet", "facts": [
      {"title": "Vendor:", "value": "TATA Steel Ltd"},
      {"title": "Material:", "value": "API 5L X65 HR Plates, 20mm WT"},
      {"title": "Quantity:", "value": "500 MT"},
      {"title": "Price:", "value": "₹54,200/MT | Total: ₹2.71 Cr"},
      {"title": "Delivery Required:", "value": "2026-06-20 (15 days)"},
      {"title": "Urgency:", "value": "⚠️ SPOT MARKET — Price valid until 2026-06-02 17:00"},
      {"title": "Requested by:", "value": "Mihir Desai (Procurement)"},
      {"title": "Reason:", "value": "Urgent restock for Aramco order SO-4521 — current stock covers 8 days only"}
    ]},
    {"type": "TextBlock", "text": "Market benchmark: ₹53,800/MT (SteelMint today). Price is 0.7% above market."},
    {"type": "TextBlock", "text": "⏰ Please respond by 14:00 today (4-hour SLA). Auto-escalates to plant head at 14:00."}
  ],
  "actions": [
    {"type": "Action.Submit", "title": "✅ APPROVE", "data": {"action": "approve"}},
    {"type": "Action.Submit", "title": "❌ REJECT", "data": {"action": "reject"}},
    {"type": "Action.Submit", "title": "💬 Query / Modify", "data": {"action": "query"}}
  ]
}
```

### SLA Escalation Logic
```python
def handle_approval_timeout(order_id, approver_id, sla_hours):
    # Wait for SLA
    time.sleep(sla_hours * 3600)
    
    if not is_approved(order_id):
        # Escalate to next level
        next_approver = get_escalation_path(order_id, approver_id)
        send_escalation_alert(
            to=next_approver,
            message=f"ESCALATED: Order {order_id} not actioned by {approver_id} within {sla_hours}h SLA",
            original_request=get_order_details(order_id)
        )
        
        # Also notify the non-responsive approver's manager
        notify_manager(approver_id, f"Your order approval was escalated due to no response")
```

### Dashboard: Approval Queue Status
```
PROCUREMENT APPROVAL QUEUE — Live
Date: 2026-06-01 | Updated: 14:32

Active Requests:
ID      | Vendor      | Value   | Stage             | Pending   | SLA Remaining
PO-4521 | TATA Steel  | ₹2.71Cr | Plant Head        | Anurag S. | 2h 15min
PO-4498 | JSW Steel   | ₹85L    | Procurement Mgr   | Mihir D.  | 45min ⚠️
PO-4489 | SAIL        | ₹42L    | Approved          | Done ✅   | —

Average approval time this month: 3.2 hours (target: <4 hours)
Escalations this month: 4 (of 28 orders) → 14% escalation rate
```

### Estimated Build Time
- Teams adaptive card + n8n workflow: 2–3 days
- SAP PO BAPI creation: 1 day
- Approval matrix setup: Half a day
- Total: 3–4 days

### Cost
- n8n: Free
- Teams + Microsoft Graph: Existing M365
- SAP: Existing license
- Total: Zero

---

## Related Ideas
- [[053 - Spares Auto-Purchase Requisition Bot]] — same approval workflow for maintenance spares
- [[015 - Blanket PO Utilization Alert]] — prevents the need for urgent orders by planning ahead
- [[010 - Supplier Contract Risk Scanner]] — contract review feeds into vendor selection for orders
- [[065 - Vendor Reliability Scorecard]] — vendor performance context in approval card
- [[056 - Steel Scrap Price Forecaster]] — price benchmark shown in approval card

---

## Notes
- The "market benchmark" line in the approval card is the highest-value addition — it instantly tells the approver whether the price is reasonable without any research
- Track "approval decision time" per approver — if one person consistently takes 6+ hours, that's a process/engagement issue to address
- Build a "vacation coverage" rule: when a primary approver is on leave, automatically route to their deputy without any manual configuration
