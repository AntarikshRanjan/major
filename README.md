# v0dev Vision Analysis Service

## Purpose

This is the **vision frontend** of the v0dev compiler pipeline.

It transforms:
```
video.mp4 → observations.json
```

Observations are **probabilistic claims** about:
- Layout structure
- Motion patterns
- Temporal sections

These claims feed into downstream services that:
1. Generate QA questions for low-confidence claims
2. Fuse accepted claims into the CreativeSpec (canonical IR)

---

## Architecture

```
┌─────────────┐
│  video.mp4  │
└──────┬──────┘
       ↓
┌──────────────────┐
│ 1. Metadata      │ → fps, duration, resolution  (ffprobe)
└────────┬─────────┘
         ↓
┌──────────────────────────────────────┐
│ 2. Gemini Vision Analysis            │
│    model: gemini-2.0-flash           │
│    • Upload video via File API       │
│    • Structured prompt               │
│    • Returns JSON observations       │
└────────┬─────────────────────────────┘
         ↓
┌──────────────────┐
│ 3. Validate &    │ → filter by confidence, deduplicate
│    Normalise     │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ observations.json│
└──────────────────┘
```

**Optional:** pass `--frames` to also extract raw frames into `data/frames/`
(not required for Gemini analysis, kept for debugging).

---

## Output Contract

**File:** `data/output/observations.json`

**Schema:**
```json
[
  {
    "id": "obs_sec0_fade",
    "sectionId": "sec_0",
    "category": "motion",
    "claim": "Hero title fades in and moves upward",
    "confidence": 0.78,
    "evidence": {
      "frameRange": [12, 30],
      "keyframes": ["frame_0012.png", "frame_0025.png"]
    }
  }
]
```

**Fields:**
- `id`: Unique observation identifier
- `sectionId`: Section this observation belongs to
- `category`: `motion` | `layout` | `temporal`
- `claim`: Human-readable description
- `confidence`: Float in [0, 1]
- `evidence`: Frame ranges and keyframe references

---

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key (get one at https://aistudio.google.com)
$env:GEMINI_API_KEY = "AIza..."     # PowerShell
# export GEMINI_API_KEY="AIza..."   # bash

# Verify ffmpeg is installed (required for metadata stage)
ffmpeg -version
```

---

## Usage

```bash
# Place video in data/input/
cp your_video.mp4 data/input/sample.mp4

# Run the pipeline
python scripts/analyze.py data/input/sample.mp4

# Output: data/output/observations.json

# Additional options
python scripts/analyze.py data/input/sample.mp4 \
  --output data/output/my_obs.json \
  --model gemini-2.0-flash \
  --min-confidence 0.6 \
  --frames \       # also extract raw frames to data/frames/
  --verbose
```

---

## Pipeline Stages

### Stage 1 — Metadata Extraction
**Module:** `src/ingest/metadata.py`

Uses ffprobe to extract duration, FPS, resolution, and total frame count.

### Stage 2 — Gemini Video Analysis
**Module:** `src/vision/gemini_client.py` + `src/vision/prompts.py`

The video is uploaded to Gemini's File API. Once processed, a structured
prompt asks the model to identify:

- **Layout** sections (hero, nav, cards, modals, footer, …)
- **Motion** patterns (fade-in, slide-up, scroll, typewriter, parallax, …)
- **Temporal** section boundaries

The model returns a JSON array of observations directly.

### Stage 3 — Validate & Normalise
**Module:** `src/vision/observations.py`

- Validates schema conformance for each observation
- Fills in safe defaults for missing optional fields
- Filters by `min_confidence` threshold
- Deduplicates identical (sectionId, category, claim) tuples

---

## Configuration

Edit `config/defaults.yaml`:
```yaml
gemini:
  model: "gemini-2.0-flash"
  cleanup_remote: true      # delete uploaded file after analysis
  poll_interval: 5
  max_wait: 300

observations:
  min_confidence: 0.5       # drop observations below this score

sampling:
  fps: 5                    # used only with --frames flag
```

---

## Design Principles

1. **LLM-as-reasoner**: Gemini interprets visual content; we validate structure
2. **Evidence-based**: Every claim includes frame range + keyframe refs
3. **Probabilistic**: Confidence scores, not binary truth
4. **Composable**: Output feeds directly into downstream QA / CreativeSpec services

---

## Tech Stack

- **Python 3.9+**
- **google-generativeai**: Gemini File API + generation
- **ffmpeg-python**: Video metadata (ffprobe)
- **OpenCV**: Optional frame extraction
- **PyYAML**: Configuration

---

## License

See LICENSE file.