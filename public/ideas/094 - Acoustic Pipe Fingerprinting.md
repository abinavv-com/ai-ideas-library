# 094 · Acoustic Pipe Fingerprinting

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🏆 Competitive
> **Helps**: Jignesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Strike each finished pipe with a calibrated hammer. ML model analyzes the acoustic resonance signature to detect internal defects (voids, delaminations, wall thickness variations) and verify wall thickness uniformity — a $5,000-equivalent test done with a ₹5,000 setup.

---

## Implementation Blueprint

### Architecture
```
Calibrated hammer strike at pipe end (or automated striker) 
→ Condenser microphone captures acoustic response (0–20 kHz) 
→ Raspberry Pi ADC digitizes signal 
→ 1D-CNN model (PyTorch) analyzes frequency spectrum 
→ Classification: Normal / Suspect-defect / Definitely-defect 
→ Suspect pipes flagged for conventional UT inspection
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| Striker | Calibrated ball-peen hammer or automated pneumatic striker | Consistent excitation |
| Microphone | Behringer ECM8000 condenser mic (~$80) | High-frequency capture |
| ADC | Behringer UMC22 USB audio interface or Raspberry Pi + ADS1256 | Digitize signal |
| Processing | Python `scipy.signal` + `librosa` | Feature extraction |
| ML Model | 1D-CNN (PyTorch) | Defect classification |
| Hardware | Raspberry Pi 4 | Run inference locally |
| UI | Python Tkinter or web app | Operator interface |

### Physical Principle (Acoustic Resonance)
When a pipe is struck:
- The pipe vibrates at its natural resonant frequencies
- These frequencies depend on: pipe geometry, material properties (E, density), wall thickness, and boundary conditions
- A defect (void, crack, delamination) creates damping or additional resonant modes
- Wall thickness reduction = lower resonant frequency for given OD

This is the same principle used in:
- Acoustic guitar vs. cracked guitar (different sound)
- Coin tapping test for bonding quality
- Railway wheel tap test (still used today)

### Signal Processing Pipeline
```python
import numpy as np
import librosa
from scipy.fft import fft, fftfreq
from scipy.signal import welch

def process_acoustic_signal(audio_file, sample_rate=44100):
    """Process pipe strike audio recording"""
    
    # Load audio
    signal, sr = librosa.load(audio_file, sr=sample_rate)
    
    # Isolate the pipe resonance (window: 10-500ms after strike)
    strike_start = find_strike_onset(signal)
    resonance = signal[strike_start + 100:strike_start + 5000]  # 100-500ms window
    
    # Feature extraction
    features = {
        # Time domain
        'decay_rate': calculate_exponential_decay(resonance),
        'rms_energy': np.sqrt(np.mean(resonance**2)),
        
        # Frequency domain
        'dominant_frequency_hz': find_dominant_frequency(resonance, sr),
        'frequency_bandwidth_hz': calculate_bandwidth(resonance, sr),
        
        # Spectral features
        'mfcc': librosa.feature.mfcc(y=resonance, sr=sr, n_mfcc=20),
        'spectral_centroid': librosa.feature.spectral_centroid(y=resonance, sr=sr),
        'spectral_rolloff': librosa.feature.spectral_rolloff(y=resonance, sr=sr),
        
        # Pipe-specific
        'expected_fundamental_hz': calculate_theoretical_frequency(pipe_specs),
        'frequency_deviation': abs(dominant_freq - expected_fundamental_hz)
    }
    
    return features
```

### 1D-CNN Model Architecture
```python
import torch
import torch.nn as nn

class AcousticDefectCNN(nn.Module):
    def __init__(self):
        super().__init__()
        
        # 1D CNN for processing raw audio or mel-spectrogram
        self.conv1 = nn.Conv1d(1, 64, kernel_size=7, stride=2)
        self.conv2 = nn.Conv1d(64, 128, kernel_size=5, stride=2)
        self.conv3 = nn.Conv1d(128, 256, kernel_size=3)
        
        self.pool = nn.AdaptiveAvgPool1d(128)
        self.fc1 = nn.Linear(256 * 128, 512)
        self.fc2 = nn.Linear(512, 3)  # 3 classes: Normal / Suspect / Defect
        
    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.relu(self.conv2(x))
        x = F.relu(self.conv3(x))
        x = self.pool(x)
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x
```

### Training Data Generation
The challenge: how to get labeled training data?

**Method 1: Synthetic defects**
- Take normal pipes
- Machine a controlled void/notch (inside the pipe wall)
- Record acoustic signature
- Label as "defect"

**Method 2: Correlation with known UT results**
- Record acoustic signature for every pipe going through UT
- Label: if UT shows defect → acoustic = "defect"; if UT clear → acoustic = "normal"
- Over 3 months of production, build labeled dataset

**Method 3: Academic datasets**
- NDE (Non-Destructive Evaluation) acoustic datasets from universities — some publicly available

### Validation Approach
Before deployment as a screening tool:
- Test on 500+ pipes across a range of conditions
- Compare acoustic result to UT result (ground truth)
- Target: sensitivity >90% (must catch 90% of real UT-rejectable defects)
- Acceptable: 30–40% false positive rate (flagged for UT re-check — UT is the final arbiter)

### Operator Interface
```
ACOUSTIC PIPE INSPECTION
Pipe: HT-2341-P042 | Grade: X65 | OD: 508mm | WT: 14.3mm

[STRIKE THE PIPE NOW]
[Microphone: Ready ●]

Recording in progress... |||||||||| 0.5 seconds

ANALYSIS RESULT:
Dominant frequency: 4,240 Hz (expected: 4,210 Hz — 0.7% deviation — NORMAL)
Decay time: 2.4 seconds (normal range: 2.1–2.8 seconds)
Spectral profile: Normal

CLASSIFICATION: ✅ PASS — No acoustic anomaly detected
Confidence: 87%

[Record next pipe] [Flag for UT check] [Export batch report]
```

### Estimated Build Time
- Hardware setup: 1 week
- Data collection + labeling: 6–8 weeks (concurrent with production)
- Model training: 2 weeks
- Validation: 4–6 weeks (parallel with conventional UT)

### Hardware Cost
- Behringer ECM8000 microphone: ~₹5,000
- Behringer UMC22 audio interface: ~₹4,000
- Raspberry Pi 4: ~₹5,000
- Calibrated striker (custom made): ~₹2,000
- Stand + enclosure: ~₹3,000
- Total: ~₹19,000 — an order of magnitude cheaper than any equivalent commercial system

---

## Related Ideas
- [[021 - X-Ray Weld Defect Detector]] — conventional defect detection complement
- [[022 - Hydrostatic Test Pressure Anomaly Detector]] — another physics-based defect indicator
- [[097 - GAN Synthetic X-Ray Training Dataset]] — synthetic defect data generation (same concept)
- [[094 - Acoustic Pipe Fingerprinting]] — self
- [[091 - PipeGPT Welspun Local LLM]] — AI stack this would integrate with

---

## Notes
- This is genuinely experimental — the technology works in research settings but industrial application on production lines has not been widely commercialized for pipe inspection. Consider it a 12–18 month R&D project.
- Partnership opportunity: IIT research groups (IIT Kharagpur has a strong NDE group) could be research partners on this project — reduces cost and adds academic validation
- Even if the full defect detection model takes time, the wall thickness verification (frequency deviation → wall thickness) could be deployed in 3–4 months as a simpler first use case
