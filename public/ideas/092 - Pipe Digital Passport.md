# 092 · Pipe Digital Passport (Blockchain-Anchored)

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive
> **Helps**: All — commercial advantage | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
QR code on every pipe links to an immutable digital record: heat chemistry → weld parameters → all QA test results → coating thickness → inspector IDs → photogrammetric 3D scan. First in India. Premium differentiator for oil & gas customers who need full traceability.

---

## Implementation Blueprint

### Architecture
```
Production data (from all QA tools already built) 
→ Assembled into structured pipe record (JSON) 
→ IPFS (decentralized storage) → Content hash 
→ Ethereum or Hyperledger Fabric → Hash anchored on blockchain (immutable) 
→ QR code on pipe → Customer scans → Full certified history
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Data Assembly | n8n (aggregates all production data) | Compile pipe record |
| Storage | IPFS (InterPlanetary File System) | Decentralized immutable storage |
| Blockchain | Polygon (low-cost Ethereum L2) or Hyperledger Fabric | Hash anchoring |
| Smart Contract | Solidity (Ethereum) or Hyperledger Chaincode | Record management |
| QR Code | Python `qrcode` library | Physical access point |
| Viewer | Public web app (or customer portal) | Read passport |
| Verification | On-chain hash comparison | Tamper detection |

### What the Digital Passport Contains
```json
{
  "pipe_id": "WCL-LSAW-2026-HT45221-P042",
  "welspun_cert_number": "WCL-MTC-2026-04521",
  
  "material_pedigree": {
    "steel_supplier": "TATA Steel Ltd",
    "heat_number": "2024H-45221",
    "mill_certificate": {
      "carbon_pct": 0.14,
      "manganese_pct": 1.52,
      "yield_strength_MPa": 486,
      "tensile_strength_MPa": 568,
      "carbon_equivalent": 0.38
    },
    "api_5l_grade": "X65 PSL-2",
    "mtc_hash": "QmX7Y8..."  // IPFS hash of original MTC document
  },
  
  "production_record": {
    "production_line": "LSAW Line 1",
    "forming_date": "2026-05-15",
    "weld_parameters": {
      "process": "SAW",
      "wps_reference": "WPS-LSAW-004-Rev2",
      "welding_current_A": 855,
      "welding_voltage_V": 35,
      "travel_speed_m_min": 2.1,
      "welding_operator_id": "OP-0042"
    }
  },
  
  "quality_inspection": {
    "radiographic_test": {
      "result": "ACCEPT",
      "inspector_id": "JIG-001",
      "image_archive_hash": "QmA3B4..."
    },
    "hydrostatic_test": {
      "test_pressure_bar": 205,
      "duration_seconds": 10,
      "result": "PASS",
      "timestamp": "2026-05-28T14:32:15Z"
    },
    "coating_inspection": {
      "type": "3LPE",
      "thickness_mm": 3.62,
      "holiday_test": "PASS",
      "inspector_id": "JIG-003"
    },
    "dimensional_check": {
      "outer_diameter_mm": 508.3,
      "wall_thickness_mm": 14.2,
      "bevel_angle_degrees": 30.3,
      "length_m": 12.085
    }
  },
  
  "certification": {
    "api_monogram": true,
    "iso_3183_compliant": true,
    "third_party_inspector": "Bureau Veritas",
    "tpi_certificate_hash": "QmC5D6..."
  },
  
  "blockchain_anchor": {
    "chain": "Polygon",
    "transaction_hash": "0x1a2b3c...",
    "anchored_at": "2026-06-01T08:00:00Z",
    "data_hash": "0xABC123..."  // Hash of all above data — any change would invalidate
  }
}
```

### Blockchain Anchoring (Why and How)
```python
from web3 import Web3

def anchor_pipe_passport(pipe_data_json):
    # Step 1: Upload data to IPFS
    ipfs_client = ipfshttpclient.connect()
    ipfs_hash = ipfs_client.add_json(pipe_data_json)
    
    # Step 2: Compute data hash
    data_hash = Web3.keccak(text=json.dumps(pipe_data_json))
    
    # Step 3: Anchor on Polygon blockchain (low gas cost: ~$0.001 per record)
    contract.functions.recordPipe(
        pipe_id=pipe_data_json['pipe_id'],
        ipfs_hash=ipfs_hash,
        data_hash=data_hash
    ).transact()
    
    return {
        'ipfs_hash': ipfs_hash,
        'blockchain_tx': tx_hash,
        'anchored_at': datetime.utcnow()
    }
```

### Customer-Facing QR Code Experience
Customer scans QR code on pipe with phone:
```
https://passport.welspuncorp.com/pipe/WCL-LSAW-2026-HT45221-P042

Page loads showing:
┌─────────────────────────────────────────────┐
│ 🔗 WELSPUN PIPE DIGITAL PASSPORT            │
│ Verified on Blockchain ✅                    │
│ Pipe: 20" × 0.562" WT | Grade: X65 PSL-2    │
├─────────────────────────────────────────────┤
│ ✅ Material Chemistry       — Compliant      │
│ ✅ Mechanical Properties    — Compliant      │
│ ✅ Radiographic Inspection  — Passed         │
│ ✅ Hydrostatic Test (205 bar) — Passed       │
│ ✅ 3LPE Coating (3.62mm)    — Passed         │
│ ✅ BV Third-Party Inspection — Certified     │
├─────────────────────────────────────────────┤
│ [Download Full MTC PDF]                      │
│ [View Weld Parameters]                       │
│ [Verify on Blockchain]                       │
└─────────────────────────────────────────────┘
```

### Commercial Positioning
This becomes Welspun's **premium product differentiation**:
- Oil & gas operators are paying $50–200M for pipelines — they want full traceability
- Saudi Aramco, TotalEnergies, Shell are implementing "digital material passports" as mandatory requirements
- First Indian pipe manufacturer to offer this = preferred supplier status with premium-tier customers
- Potential to command 2–5% price premium on high-spec orders

### Phased Rollout
- **Phase 1** (3 months): Pilot on 1 customer project — digital record without blockchain
- **Phase 2** (6 months): Add IPFS storage + blockchain anchoring for tamper-proof records
- **Phase 3** (12 months): Full commercial rollout + marketing campaign
- **Phase 4** (18 months): API for customers to query their pipe data programmatically

### Estimated Build Time
- Phase 1 (digital record, no blockchain): 6–8 weeks
- Phase 2 (IPFS + blockchain): 3 months additional
- Phase 3 (web portal + QR system): 1 month additional

### Cost
- Blockchain gas costs (Polygon): ~$0.001 per pipe record = ~$100/year for 100,000 pipes
- IPFS storage (Pinata): ~$20/month
- Web portal development: 3 months of developer time
- Total ongoing: < ₹20,000/month

---

## Related Ideas
- [[032 - MTC Auto-Generator]] — MTC document that becomes part of the passport
- [[026 - Pipe Stencil OCR Verifier]] — verifies stencil matches passport record
- [[100 - Pipe Lifecycle Carbon Tracking]] — carbon data added to the passport
- [[085 - EU CBAM Carbon Certificate Generator]] — CBAM data embedded in passport
- [[096 - FloorOS SAP-Free Shop Floor App]] — mobile data capture that feeds passport

---

## Notes
- The blockchain is for TAMPER-PROOFING, not for customer data sharing — many customers just want the data accessible, not necessarily blockchain-anchored. Start without blockchain and add it as a "certification layer" for premium customers.
- GDPR/data privacy: if the passport includes inspector IDs and operator IDs, these are personal data — consult legal before publishing on a public portal
- The biggest challenge is data completeness: the passport is only as good as the data entering it. All the upstream QA tools (021–034) must be operational first.
