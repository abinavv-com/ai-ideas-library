# 097 · GAN Synthetic X-Ray Training Dataset

> **Section**: Strategic & Experimental | **Complexity**: 🔴 Year 1–2 | **Impact**: 🛡️ Safety
> **Helps**: Jignesh | **Index**: [[100 AI Ideas - Welspun Pipe Division (Presentation)]]

---

## What It Does
Use a Generative Adversarial Network to create 10,000+ synthetic defect X-ray images from Welspun's real dataset of ~1,000 actual defect examples. Enables the [[021 - X-Ray Weld Defect Detector]] AI model to achieve production-grade accuracy without waiting years to collect enough real defect data.

---

## Implementation Blueprint

### Architecture
```
Welspun real defect X-ray dataset (~1,000 images, labelled) 
→ pix2pix or DCGAN model training (GPU workstation) 
→ Generate 10,000+ synthetic defect images 
→ Quality filter (FID score + radiographer review) 
→ Combined dataset (real + synthetic) → [[021 - X-Ray Weld Defect Detector]] model training
```

### Tech Stack
| Component | Tool | Purpose |
|---|---|---|
| GAN Framework | PyTorch + `torchvision` | GAN training |
| Architecture | pix2pix (conditional GAN) or StyleGAN3 | Image generation |
| GPU | NVIDIA RTX 4090 workstation or AWS P3 rental | Training |
| Quality Metric | FID (Fréchet Inception Distance) | Measure synthetic quality |
| Validation | Radiographer visual review | Confirm medical plausibility |
| Data Augmentation | `albumentations` library | Additional augmentation |

### Why Synthetic Data is Needed for Weld X-Rays
Real pipe weld X-ray defect images are:
- **Rare**: A well-run production line has 2–3% reject rate → only 20–30 defect images per 1,000 pipes
- **Imbalanced**: Most defects are porosity; cracks, slag inclusions, and lack-of-fusion are much rarer
- **Legally constrained**: Some X-ray images may be part of contractual records — can't freely use for AI training without customer consent
- **Hard to collect at scale**: Even over 2 years, might collect 2,000 defect images across all types

The YOLOv8 model in [[021 - X-Ray Weld Defect Detector]] needs minimum 500–1,000 examples per defect class for reliable performance. Without synthetic augmentation, it may take 5+ years to collect enough real data.

### GAN Approach 1: pix2pix (Conditional GAN)
```python
# pix2pix: Generate defect images conditioned on a mask
# Input: Background X-ray (clean weld) + Defect mask (where to put defect)
# Output: Realistic X-ray with defect in specified location

# Training:
# - Real pair: (clean_region_from_defect_image, full_defect_image)
# - Generator learns to synthesize defect appearance
# - Discriminator learns to tell real from fake

from torch.utils.data import Dataset

class XRayDefectDataset(Dataset):
    def __init__(self, real_defect_images):
        self.pairs = []
        for img in real_defect_images:
            # Crop: clean region near defect (input)
            clean_region = self.extract_clean_region(img)
            # Full image with defect (target)
            defect_region = img['full_image']
            self.pairs.append((clean_region, defect_region, img['defect_mask']))

# Generator: UNet architecture
# Discriminator: PatchGAN (70×70 patch discriminator)
```

### GAN Approach 2: StyleGAN3 + DiffAugment
```python
# StyleGAN3: Higher quality, more diverse generation
# But requires more real data to train (~5,000+ images)
# Use with DiffAugment to work with smaller dataset

# Generates: realistic X-ray textures
# Then: overlay generated defect patterns on clean X-ray backgrounds

# Two-stage process:
# Stage 1: Generate realistic X-ray background (from clean images)
# Stage 2: Use pix2pix to insert defects from defect texture library
```

### Quality Assessment

**FID Score (Fréchet Inception Distance)**
- Measures how similar synthetic images are to real images statistically
- Lower FID = more realistic
- Target FID < 30 (very high quality)

**Radiographer Review**
Critical validation step: have Jignesh or a senior NDT inspector review 100 random synthetic defect images:
- Rate each: "Would you mistake this for a real defect? Y/N"
- Target: >80% rated as "plausible"
- Reject any images that are clearly unrealistic artifacts

### Combined Dataset Strategy
```python
# Training strategy: Mix real and synthetic
# Proven to work better than synthetic-only training

training_data = {
    'real_normal': 5000,      # Clean weld X-rays (abundant)
    'real_porosity': 450,      # Real porosity defects
    'real_slag': 120,          # Real slag inclusions (rarer)
    'real_crack': 45,          # Real cracks (very rare)
    
    'synthetic_porosity': 2000,  # GAN-generated
    'synthetic_slag': 800,       # GAN-generated
    'synthetic_crack': 500,      # GAN-generated
    'synthetic_lack_fusion': 600  # GAN-generated
}

# Key research finding: 50% real / 50% synthetic often outperforms 100% real
# (because synthetic fills in rare defect types that are underrepresented)
```

### Training Infrastructure
```bash
# Rent GPU compute for GAN training (one-time, not ongoing)
# AWS P3.2xlarge (V100 GPU): ~$3/hour
# Estimated training time: 48–72 hours
# Cost: ~$150–200 per training run

# Or: Use Welspun's own RTX 4090 workstation
# (purchased for [[091 - PipeGPT Welspun Local LLM]])
# Training time: ~4–7 days on RTX 4090
# Cost: Just electricity
```

### Validation Protocol Before Using Synthetic Data
1. Train model A: Real data only
2. Train model B: Real + synthetic data
3. Evaluate both on held-out real test set (50 defective + 50 clean pipes)
4. Only use synthetic data if Model B precision/recall ≥ Model A on real test set

### Estimated Build Time
- GAN training infrastructure: 2 weeks
- Real data preparation + labeling (if not done for [[021 - X-Ray Weld Defect Detector]]): 4 weeks
- GAN training: 1 week (GPU compute)
- Synthetic image quality review: 1 week
- Downstream model retraining: 1 week
- Validation: 2 weeks
- Total: ~2–3 months (concurrent with [[021 - X-Ray Weld Defect Detector]] development)

### Cost
- GPU compute (GAN training): ~₹15,000–20,000 per training run (AWS rental)
- Radiographer review: Staff time (~8 hours)
- RTX 4090 hardware (shared): Already covered by [[091 - PipeGPT Welspun Local LLM]]

---

## Related Ideas
- [[021 - X-Ray Weld Defect Detector]] — the primary beneficiary of this synthetic dataset
- [[091 - PipeGPT Welspun Local LLM]] — shares GPU infrastructure
- [[097 - GAN Synthetic X-Ray Training Dataset]] — self
- [[024 - Visual Coating Defect Camera System]] — same synthetic augmentation approach applicable
- [[031 - Surface Rust Severity Classifier]] — same limited training data problem

---

## Notes
- This is a research-grade project — it requires someone with ML expertise (ideally PhD-level or equivalent experience in GANs). Consider engaging an ML consulting firm or IIT collaboration.
- The generated images should never be used for anything other than AI model training — they are NOT real inspection records and must not be mixed with real QA documentation
- Store synthetic images separately with clear labeling: SYNTHETIC_GENERATED_DO_NOT_USE_AS_QA_RECORD
