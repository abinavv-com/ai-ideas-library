# 096 · FloorOS — SAP-Free Shop Floor Mobile App

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: ⚡ Efficiency, 🛡️
> **Helps**: All shop floor supervisors | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Tablet app for supervisors: scan pipe QR → view production order → record inspection → submit QA sign-off → auto-sync to SAP in the background. Replaces the SAP ECC GUI entirely on the shop floor — a mobile-first experience for a mobile-first workforce.

---

## Implementation Blueprint

### Architecture
```
React Native app (iOS/Android tablets) 
→ Local offline cache (SQLite) 
→ Background sync with n8n middleware 
→ n8n calls SAP BAPIs for all SAP read/write operations 
→ Supervisors use the app; SAP stays as the system of record
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Mobile App | React Native (cross-platform) | iOS + Android tablets |
| Offline Storage | SQLite (via react-native-sqlite-storage) | Work without WiFi |
| Sync Layer | n8n REST API + background sync | SAP integration |
| SAP Read | n8n + SAP RFC/OData | Pull production orders, specs |
| SAP Write | n8n + SAP BAPIs | Post confirmations, QA results |
| Authentication | Azure AD SSO or local user management | Secure login |
| Notifications | Push notifications (Firebase) | Alerts to supervisors |

### Core Modules

**Module 1: Pipe Lookup (QR Scan)**
```javascript
// Scan QR → display everything about that pipe
const handleQRScan = async (qrData) => {
    const pipeData = JSON.parse(qrData);
    
    const pipeDetails = await fetchFromSAP({
        heatNumber: pipeData.heat,
        batchId: pipeData.batch_id
    });
    
    // Display: grade, spec, production status, QA status, customer order
    setCurrentPipe(pipeDetails);
};
```

**Module 2: Production Confirmation**
```javascript
// Supervisor confirms pipes produced — replaces SAP MIGO transaction
const confirmProduction = async (productionData) => {
    // Store locally first (offline-capable)
    await localDB.insertConfirmation(productionData);
    
    // Sync to SAP when connected
    await syncQueue.add({
        type: 'SAP_GOODS_CONFIRMATION',
        bapi: 'BAPI_GOODSMVT_CREATE',
        data: {
            production_order: productionData.order,
            confirmed_quantity: productionData.qty,
            confirmation_date: new Date()
        }
    });
};
```

**Module 3: QA Inspection Recording**
```javascript
// Record inspection results — replaces SAP QM transaction
const recordInspection = async (inspectionData) => {
    const result = {
        inspection_lot: inspectionData.lot,
        characteristics: [
            {name: 'OD_mm', result_value: inspectionData.od, unit: 'MM'},
            {name: 'WT_mm', result_value: inspectionData.wt, unit: 'MM'},
            {name: 'HYDRO_TEST', result_value: inspectionData.hydro, unit: 'BAR'},
            {name: 'COATING_THICKNESS', result_value: inspectionData.coating, unit: 'MM'}
        ],
        overall_result: inspectionData.pass ? 'A' : 'R',  // A=Accept, R=Reject
        inspector_id: currentUser.employee_id
    };
    
    // Post to SAP QM via n8n
    await api.post('/sap/qm/record-results', result);
};
```

**Module 4: Shift Handover Digital Form**
```javascript
// Replace the [[006 - Shift Handover Voice Summarizer]] manual entry with structured form
const submitHandover = async (handoverData) => {
    await api.post('/handover/submit', {
        outgoing_shift: currentShift,
        line: currentLine,
        machine_faults: handoverData.faults,
        quality_holds: handoverData.holds,
        pending_work: handoverData.pending,
        production_count: handoverData.pipeCount
    });
    // n8n auto-routes to incoming supervisor
};
```

**Module 5: Maintenance Request**
```javascript
// Create SAP PM notification from the shop floor
const raiseMaintRequest = async (issue) => {
    await api.post('/sap/pm/create-notification', {
        equipment: currentStation.equipment_id,
        malfunction_start: new Date(),
        short_text: issue.description,
        priority: issue.severity === 'HIGH' ? '1' : '2',
        reported_by: currentUser.employee_id
    });
};
```

### Offline-First Architecture
Critical for factory floor (WiFi dead spots, network outages during shift changes):
```javascript
// All actions stored locally first
const offlineQueue = new OfflineQueue(localDB);

// Background sync when network available
const syncWorker = new BackgroundSync({
    onNetworkAvailable: () => {
        offlineQueue.processAll(apiClient);
    },
    syncInterval: 30000  // Try every 30 seconds
});

// UI shows sync status
const SyncIndicator = ({status}) => (
    status === 'synced' ? <GreenDot label="SAP Synced" /> :
    status === 'pending' ? <YellowDot label="3 items pending sync" /> :
    <RedDot label="Offline — changes queued" />
);
```

### Key Screens

**Home Screen:**
```
[Welspun FloorOS] | Anurag Singh | LSAW Line 1

Quick Actions:
[📦 Scan Pipe QR]  [✅ Record QA]  [🔧 Maintenance]  [📋 Production]

Today's Line Status:
Pipes confirmed today: 47 / Target: 55
QA holds pending: 3 (tap to view)
Maintenance alerts: 1 (tap to view)

Shift handover due in: 2:45 hrs
```

**Pipe Detail Screen:**
```
PIPE: HT-2341-P042
Grade: X65 | 20" × 0.562" WT | 3LPE

PRODUCTION: ✅ Complete (Batch 2026-06-01 Morning)
QA STATUS: 🔄 In Progress — awaiting UT result
Customer: Saudi Aramco (SO-4521)
Required delivery: 2026-06-15

[Record Inspection] [Add Note] [View Full History] [Flag Issue]
```

### SAP Integration via n8n (The Bridge Layer)
n8n acts as the "SAP adapter" — FloorOS never calls SAP directly:
```
FloorOS → n8n REST API → SAP BAPI/RFC → SAP DB
```
This means:
- SAP connectivity changes don't require app updates
- n8n can add business logic, validation, and error handling
- Multiple tools can use the same SAP integration layer

### Estimated Build Time
- React Native app (core screens): 8–10 weeks
- Offline sync: 2 weeks
- n8n SAP integration: 2 weeks (builds on earlier work)
- Testing + UAT: 4 weeks
- Total: ~4 months

### Cost
- React Native developer: External contractor, ~₹8–12L for 4 months
- Or: Internal IT team if available
- No licensing cost for the app itself

---

## Related Ideas
- [[072 - Pipe Location Digital Map]] — yard location module that integrates into FloorOS
- [[041 - WhatsApp Change Management System]] — change requests integrated here
- [[006 - Shift Handover Voice Summarizer]] — voice handover feeds FloorOS structured form
- [[035 - Operator Skill-to-Project Matcher]] — skills qualifications viewable in FloorOS
- [[092 - Pipe Digital Passport]] — FloorOS is the data capture tool for the passport

---

## Notes
- The key design principle: each screen should have no more than 3 taps to complete any common action. SAP ECC has 15+ screens for a goods movement — FloorOS must be 3 taps maximum.
- Offline capability is non-negotiable — the factory floor has WiFi dead spots, and supervisors cannot risk losing data due to connectivity
- Phase 1 should focus on the most painful workflows: QA sign-off and production confirmation. These are highest-frequency, highest-value.
