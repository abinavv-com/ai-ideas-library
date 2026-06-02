# 043 · Pipe Energy Cost Attribution Model

> **Section**: Manufacturing & Process | **Complexity**: 🔵 Month 4–6 | **Impact**: 💰 Cost Savings
> **Helps**: Mahesh, finance | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Sub-meters electricity and gas consumption at each production station. Attributes energy cost to specific pipe batches — giving the cost team a real cost-per-ton figure per product line instead of a plant-wide averaged estimate that obscures which products are profitable.

---

## Implementation Blueprint

### Architecture
```
Smart energy meters at each production station 
→ MQTT/Modbus data collection 
→ n8n or Python aggregation 
→ Attribute energy per meter to SAP production orders running at that time 
→ Power BI cost-per-product report
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Energy Meters | Eastron SDM630 (3-phase, Modbus) or Schneider iEM3x | Sub-metering at station level |
| Gas Meters | Pulse-output gas meter + Raspberry Pi counter | Gas consumption per furnace |
| Data Collection | Node-RED or Python Modbus reader | Read meter registers |
| Message Bus | MQTT (Mosquitto) | Transport to central server |
| Attribution | Python (joins meter data with SAP production schedule) | Cost per batch |
| Visualization | Power BI | Management reporting |

### Metering Points to Install
Priority order:
1. **LSAW line**: Forming press (high electricity user), welding power supply, motor drives
2. **HSAW line**: SAW welding power supplies, strip straightener drives
3. **DI line**: Electric arc furnace (largest energy consumer), annealing furnace (gas)
4. **Coating line**: Induction heaters for 3LPE, shot blast compressors
5. **Air compressors**: Central utilities often >20% of plant energy

### Smart Meter Setup (Eastron SDM630)
```python
# Read Modbus registers from Eastron SDM630
import minimalmodbus

meter = minimalmodbus.Instrument('/dev/ttyUSB0', 1)  # COM port, slave address
meter.serial.baudrate = 9600

def read_meter():
    return {
        'voltage_L1': meter.read_float(0, functioncode=4),    # Register 0x0000
        'current_L1': meter.read_float(6, functioncode=4),    # Register 0x0006
        'power_kW': meter.read_float(52, functioncode=4),     # Register 0x0034
        'energy_kWh': meter.read_float(342, functioncode=4),  # Register 0x0156
        'timestamp': datetime.now().isoformat()
    }

# Read every 1 minute, publish to MQTT
```

### Energy Attribution Logic
The key challenge: at any given moment, a meter is consuming energy while a specific SAP production order is running.

```python
def attribute_energy_to_orders(meter_readings, production_schedule):
    """
    Join energy meter time series with SAP production order schedule
    to calculate kWh per production order
    """
    attributed_costs = []
    
    for reading in meter_readings:
        timestamp = reading['timestamp']
        kWh = reading['energy_increment_kWh']
        meter_id = reading['meter_id']
        
        # Find which production order was running on this station at this time
        active_order = get_active_production_order(meter_id, timestamp, production_schedule)
        
        if active_order:
            # Energy rate (₹/kWh) from finance team — update monthly
            cost_inr = kWh * get_energy_rate(timestamp)
            
            attributed_costs.append({
                'production_order': active_order['order_id'],
                'product': active_order['product'],
                'tons': active_order['tons_produced'],
                'meter_id': meter_id,
                'energy_kWh': kWh,
                'cost_inr': cost_inr
            })
    
    return attributed_costs
```

### Cost Per Ton by Product (Power BI Output)
```
ENERGY COST PER TON — May 2026

Product           | kWh/ton | Gas GJ/ton | Total Energy ₹/ton | % of COGS
LSAW 20" X65 3LPE |  280    |    0.8     |    ₹2,240          |  4.2%
LSAW 36" X70      |  310    |    0.9     |    ₹2,480          |  4.7%
HSAW 48" X60      |  180    |    0.3     |    ₹1,440          |  2.7%
DI DN300 K9       |  520    |    2.1     |    ₹4,960          |  9.3%

Plant Average: 310 kWh/ton | ₹2,480/ton

Key Finding: DI pipe energy cost is 2.2× LSAW — reflected in pricing?
```

### Immediate Value (Even Before Full Sub-Metering)
- Phase 1: Install sub-meters only on top 3 energy consumers (EAF, annealing furnace, LSAW welding)
- Phase 2: Add remaining stations over 6 months
- Phase 1 already covers ~70% of plant energy use

### Estimated Build Time
- Smart meter procurement + installation: 4–6 weeks (electrical contractor needed)
- Software pipeline: 2 weeks
- SAP production order matching: 1 week
- Power BI report: 1 week

### Hardware Cost
- Eastron SDM630 meter: ~₹3,000 each
- 15 meters: ~₹45,000
- Installation (licensed electrician): ~₹30,000–50,000
- Raspberry Pi + Modbus converters: ~₹15,000
- Total: ~₹1–1.2L

---

## Related Ideas
- [[039 - Annealing Furnace Belt Speed Optimizer]] — energy optimization from this tool
- [[040 - Production OEE Live Dashboard]] — energy cost alongside OEE data
- [[083 - Project-Level Profitability Tracker]] — energy attribution improves project P&L accuracy
- [[085 - EU CBAM Carbon Certificate Generator]] — energy data feeds Scope 1 carbon calculation
- [[100 - Pipe Lifecycle Carbon Tracking]] — energy attribution is the foundation

---

## Notes
- The installation must be done by a licensed electrician and may require DISCOMS approval for sub-metering at industrial scale in Gujarat — check with Roshan's compliance team
- In India, industrial tariff varies by time-of-day (ToD tariff) — heavier loads during peak hours (18:00–22:00) cost 1.5–2× normal rates. This should be factored into shift scheduling.
- Start with a 30-day "energy audit" even before buying smart meters — clip-on current clamps ($200) can give good estimates without permanent installation
