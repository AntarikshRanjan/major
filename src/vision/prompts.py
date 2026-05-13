"""
Gemini Analysis Prompts

Contains the structured prompts sent to Gemini for website video analysis.
The prompts instruct Gemini to return JSON conforming to the observations schema.

Observation schema:
    {
        "id":         str,           # "obs_<section>_<short_descriptor>"
        "sectionId":  str,           # "sec_0", "sec_1", ...
        "category":   str,           # "motion" | "layout" | "temporal"
        "claim":      str,           # human-readable description
        "confidence": float,         # 0.0 – 1.0
        "evidence": {
            "frameRange":  [int, int],   # approximate frame indices
            "keyframes":   [str, ...],   # "frame_XXXX.png" labels
            "description": str           # brief evidence note
        }
    }
"""

# ---------------------------------------------------------------------------
# Primary analysis prompt — full website video
# ---------------------------------------------------------------------------

WEBSITE_ANALYSIS_PROMPT = """
You are a senior frontend engineer analysing a screen-recording of a website or
web application. Your goal is to extract GRANULAR, COMPONENT-LEVEL observations
about the WEBSITE CONTENT ONLY.

STRICT SCOPE — observe ONLY elements that are part of the website itself:
- The page layout, sections, and UI components built by the site's developers
- Animations and transitions that are part of the site's design

IGNORE completely — do NOT emit any observation for:
- Desktop or OS notifications (system pop-ups, notification banners)
- Browser chrome (address bar, tabs, bookmarks toolbar, browser buttons)
- Advertisement banners, ad iframes, or third-party ad widgets
- Screen-recording artifacts (cursor highlights, recording indicators, overlays)
- Any UI element that is NOT rendered inside the website's own viewport content

Watch this video carefully and extract structured observations about:

1. **Layout** — What UI sections and components exist inside the website?
   For every distinct section, identify:
   - The section type (navbar, hero, features, pricing, testimonials, FAQ, footer, modal, sidebar, etc.)
   - Specific components WITHIN each section:
     * Headings and subheadings (include the visible text)
     * Buttons and CTAs (include the button label text)
     * Navigation links (include visible link names)
     * Images, icons, illustrations, videos, or background visuals
     * Cards, grid items, or list elements (count them, describe their content)
     * Forms, input fields, dropdowns, checkboxes
     * Badges, tags, chips, or labels
     * Logos or brand elements
   - Visual traits: background color, text color, column layout (1-col, 2-col, 3-col grid, etc.)

2. **Motion** — What animations or transitions occur within the website?
   (e.g. fade-in, slide-up, slide-in from left/right, scale/zoom, parallax
    scrolling, typewriter text, spinning loaders, hover effects, page transitions,
    sticky header appearing on scroll, number count-up, progress bars filling)

3. **Temporal** — How is the website video segmented across time?
   (e.g. intro section 0–3s, features walkthrough 3–15s, pricing at 15–20s, CTA at the end)

For EVERY distinct observation emit one JSON object. Aim for detailed coverage:
- One observation per UI section (what the section is and its overall layout)
- Additional observations for notable sub-component groups within a section
- One observation per animation or transition
- One observation per temporal boundary

Return a **JSON array** of observations — nothing else.

Each observation must match this exact schema:
{
  "id":         "<string: obs_secN_shortname>",
  "sectionId":  "<string: sec_N where N identifies a distinct LOGICAL UI section — assign a new sec_N for each named content area (navbar, hero, 'Artificial Intelligence', 'Gaming', footer, etc.); do NOT share a sectionId across different sections just because they appear in one continuous scroll>",
  "category":   "<string: motion | layout | temporal>",
  "claim":      "<string: one precise sentence — include specific text, colors, or counts where visible>",
  "confidence": <float: 0.0–1.0, how certain you are>,
  "evidence": {
    "frameRange":   [<start_frame_approx>, <end_frame_approx>],
    "keyframes":    ["frame_XXXX.png"],
    "description":  "<string: brief note on what makes this claim evident>"
  }
}

Rules:
- Assume 5 fps for frame index estimates (frame 0 = t=0s, frame 10 = t=2s, etc.).
- Assign sectionIds by LOGICAL content boundary, not scroll position. Each distinct named section (navbar, hero, testimonials, pricing, footer, and every topic-specific content block like 'Artificial Intelligence', 'Gaming', 'Robotics and Edge AI', etc.) must get its own unique sec_N. Do NOT collapse multiple named sections into one sectionId because they appear in the same scroll region.
- Emit at least one "temporal" observation per detected section boundary.
- Emit at least one "layout" observation per distinct UI section.
- Emit multiple "layout" observations per section to cover its key sub-components.
- Emit at least one "motion" observation per animation or transition you notice.
- In "claim", be specific: instead of "there is a button", write
  "a blue 'Get Started' CTA button is centered below the hero heading".
- confidence 0.9+ = unmistakably clear; 0.7 = likely; 0.5 = plausible but uncertain.
- Do NOT wrap the JSON in markdown fences.
- Return ONLY the JSON array.
"""


# ---------------------------------------------------------------------------
# Section-focused refinement prompt (used when a section needs deeper analysis)
# ---------------------------------------------------------------------------

SECTION_DEEP_DIVE_PROMPT = """
You are a senior frontend engineer. Focus only on the portion of this video
described below and return detailed observations for that section.

Section context: {section_context}
Approximate time range: {start_time}s – {end_time}s

Return a JSON array of observations using the same schema:
{{
  "id":         "obs_secN_shortname",
  "sectionId":  "sec_N",
  "category":   "motion | layout | temporal",
  "claim":      "one concise sentence",
  "confidence": 0.0-1.0,
  "evidence": {{
    "frameRange":   [start, end],
    "keyframes":    ["frame_XXXX.png"],
    "description":  "brief evidence note"
  }}
}}

Return ONLY the JSON array.
"""


def build_section_prompt(section_context: str, start_time: float, end_time: float) -> str:
    """Fill in the section deep-dive prompt template."""
    return SECTION_DEEP_DIVE_PROMPT.format(
        section_context=section_context,
        start_time=f"{start_time:.1f}",
        end_time=f"{end_time:.1f}",
    )
