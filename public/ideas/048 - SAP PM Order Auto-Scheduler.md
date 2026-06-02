# 048 · SAP PM Order Smart Auto-Scheduler

> **Section**: Maintenance & Reliability | **Complexity**: 🟡 Month 2–3 | **Impact**: ⚡ Efficiency
> **Helps**: Anurag Singh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Instead of fixed-interval PM triggers (every 30 days regardless of usage), reads equipment run-hour meters and auto-generates SAP PM orders when actual hours hit the threshold — ensuring maintenance is based on actual equipment usage, not calendar.

---

## Implementation Blueprint

### Architecture
```
Run-hour meter data (PLC encoder or manual entry) 
→ n8n daily query 
→ Compare actual hours against PM threshold per machine 
→ When threshold crossed: auto-create SAP PM work order 
→ Notify maintenance planner for scheduling + spares preparation
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Run-Hours Source | PLC encoder pulse counter OR manual tablet entry | Actual hours |
| SAP PM | BAPI `BAPI_ORDER_CREATE` or `PM_MAINTENANCE_ORDER_CREATE` | Create PM work orders |
| Orchestration | n8n | Daily checking logic |
| Alert | Teams message to Anurag Singh | Advance notification |
| Spares Check | Query [[047 - Spare Parts Inventory Reality Check]] data | Validate spares available |

### PM Threshold Database
```python
pm_thresholds = {
    "LSAW_FORMING_PRESS_MAIN_DRIVE": {
        "machine_id": "EQ-LSAW-001",
        "pm_tasks": [
            {"task": "Lubrication of all bearings", "interval_hours": 500, "last_pm_hours": 12450},
            {"task": "Gear oil change — main gearbox", "interval_hours": 2000, "last_pm_hours": 11000},
            {"task": "Full PM — disassemble, inspect, replace seals", "interval_hours": 8000, "last_pm_hours": 8000}
        ],
        "current_run_hours": 12780
    },
    "HSAW_STRIP_STRAIGHTENER": {
        "machine_id": "EQ-HSAW-003",
        "pm_tasks": [
            {"task": "Roller bearing lubrication", "interval_hours": 250, "last_pm_hours": 12600},
            {"task": "Roller wear measurement + replacement", "interval_hours": 1000, "last_pm_hours": 12000}
        ],
        "current_run_hours": 12710
    }
}
```

### Run-Hour Data Collection Options

**Option A: PLC Encoder Counter (Best)**
If machine has PLC with OPC-UA access:
```python
# Read running state from PLC digital output
# Increment run hours counter while state = RUNNING
def update_run_hours(machine_id):
    is_running = plc.read_bool('D100.0')  # Running state bit
    if is_running:
        increment_run_hours(machine_id, delta_minutes / 60)
```

**Option B: Smart Energy Meter Proxy**
If machine has energy sub-meter: running = power consumption > threshold → approximate run hours.

**Option C: Manual Entry (Simplest Start)**
Shift supervisor records production hours per machine on tablet each shift.
```
Morning shift: LSAW Line 1 — 7.5 hours running, 0.5 hours breakdown
```

### Threshold Check Logic
```python
def check_pm_thresholds():
    for machine in all_machines:
        current_hours = get_current_run_hours(machine)
        
        for pm_task in machine.pm_tasks:
            hours_since_last_pm = current_hours - pm_task['last_pm_hours']
            hours_until_due = pm_task['interval_hours'] - hours_since_last_pm
            
            if hours_until_due <= 50:  # Due within 50 hours
                # Check if work order already created
                if not sap_pm_order_exists(machine, pm_task):
                    create_sap_pm_order(machine, pm_task, urgency='NORMAL')
                    check_spares_availability(pm_task['required_spares'])
            
            if hours_until_due <= 0:  # OVERDUE
                send_overdue_alert(machine, pm_task)
```

### n8n Workflow Design
1. **Cron trigger**: Daily 06:30
2. **HTTP Request nodes** (parallel): Get run hours for all machines (from PLC API or manual entry DB)
3. **SAP RFC node**: Get last PM completion date/hours for each maintenance plan
4. **Function node**: Calculate hours since last PM and hours until next PM
5. **Filter node**: Keep machines with PM due within 50 hours or overdue
6. **SAP BAPI node**: Create PM work orders for machines without existing open orders
7. **Teams node**: Daily PM scheduler report to Anurag Singh:
   ```
   📋 PM SCHEDULER — 2026-06-01
   Due within 50 hours: 3 tasks created in SAP
   Due within 1 week: 8 tasks (for planning)
   Overdue: ⚠️ 1 task (EQ-DI-005, lubrication — 23 hours overdue)
   Spares check: All required spares available ✅
   ```
8. **[[047 - Spare Parts Inventory Reality Check]] node**: Verify spares availability before creating order

### Advance Warning Levels
| Hours Until Due | Action |
|---|---|
| 200 hours | Advance warning — plan spares ordering |
| 50 hours | Create SAP PM order — schedule with planner |
| 10 hours | Urgent alert — must complete this shift |
| 0 hours (overdue) | Critical alert — machine running on borrowed time |

### Estimated Build Time
- Manual entry system: 2 days
- PLC integration (if available): 2–3 weeks
- SAP PM BAPI integration: 2–3 days
- n8n workflow: 1 day

### Cost
- Software: Free (n8n + Python)
- SAP PM module: Existing license

---

## Related Ideas
- [[046 - Predictive Maintenance Dashboard]] — condition-based trigger complements hours-based trigger
- [[047 - Spare Parts Inventory Reality Check]] — ensures spares are available for scheduled PM
- [[053 - Spares Auto-Purchase Requisition Bot]] — auto-orders spares when PM created
- [[051 - Maintenance KPI Live Dashboard]] — PM adherence rate tracked here
- [[054 - Machine Breakdown RCA Knowledge Base]] — "breakdown happened because PM was overdue"

---

## Notes
- The transition from calendar-based to hours-based PM requires updating all SAP PM maintenance plans — this is an SAP configuration task requiring a PM module specialist
- Some maintenance tasks have BOTH calendar and hours triggers (e.g., gearbox oil: 6 months OR 2,000 hours, whichever comes first) — handle "whichever first" logic in the threshold checker
- For machines with widely varying production intensity (e.g., line only runs 3 days/week), hours-based PM saves 30–40% on premature calendar-based maintenance
