"""
LLM-based observations -> CreativeSpec structurer.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from src.vision.gemini_client import GeminiClient, GeminiClientError

logger = logging.getLogger(__name__)

STRUCTURER_PROMPT_TEMPLATE = """
You are a structured data extraction assistant for an AI website reconstruction system.

You are given observations extracted from a UI video. Your job is to convert them into
a minimal, deterministic CreativeSpec JSON object.

Input observations:
{observations_json}

Your output MUST follow this exact JSON schema and contain no extra top-level or nested fields:
{{
  "sections": [
    {{
      "id": "sec_N",
      "type": "string or null",
      "components": [
        {{
          "type": "string",
          "label": "string or null"
        }}
      ],
      "layout": "string or null",
      "confidence": 0.0
    }}
  ],
  "design": {{
    "theme": "string or null",
    "density": "string or null",
    "style": "string or null"
  }},
  "animationPlan": [
    {{
      "sectionId": "sec_N or null",
      "name": "string",
      "trigger": "string or null"
    }}
  ],
  "features": ["string"]
}}

Instructions:
- Use ONLY the observations provided.
- Do NOT guess missing values. Use null instead.
- Preserve structure, not long text descriptions.
- Group observations into sections using their sectionId values.
- Extract reusable structural patterns such as grid, carousel, cards, forms, nav, hero, pricing.
- Keep output deterministic, compact, and minimal.
- If a section type cannot be determined from the observations, use null.
- If a layout cannot be determined from the observations, use null.
- Use confidence values only when supported by the observations; otherwise use null.
- Components should be reusable UI primitives, not full sentences.
- animationPlan should contain structured animation entries only when motion observations support them.
- features should contain distinct product-level capabilities only when clearly supported by observations.
- Return a JSON object only. No markdown fences. No commentary.
"""

TOP_LEVEL_KEYS = {"sections", "design", "animationPlan", "features"}
SECTION_KEYS = {"id", "type", "components", "layout", "confidence"}
COMPONENT_KEYS = {"type", "label"}
DESIGN_KEYS = {"theme", "density", "style"}
ANIMATION_KEYS = {"sectionId", "name", "trigger"}


def structure_observations(observations_path: str, output_path: str) -> dict[str, Any]:
    """
    Load observations, call Gemini to structure them, validate the result,
    and write the CreativeSpec to disk.
    """
    logger.info("Loading observations from %s", observations_path)
    observations = _load_json(observations_path)
    if not isinstance(observations, list):
        raise ValueError("observations.json must contain a JSON array")

    logger.info("Loaded %d observations for structuring", len(observations))
    prompt = build_structurer_prompt(observations)
    client = GeminiClient()

    logger.info("Requesting CreativeSpec structuring from Gemini model %s", client.model_name)
    raw = client.generate_json_from_prompt(prompt, temperature=0.0)
    parsed = client.parse_json_response(raw)
    creative_spec = validate_creative_spec(parsed)

    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Writing CreativeSpec to %s", output)
    with output.open("w", encoding="utf-8") as handle:
        json.dump(creative_spec, handle, indent=2, ensure_ascii=False)

    section_count = len(creative_spec["sections"])
    component_count = sum(len(section["components"]) for section in creative_spec["sections"])
    animation_count = len(creative_spec["animationPlan"])
    print(f"{section_count} sections, {component_count} components, {animation_count} animations")
    logger.info(
        "Structuring complete: sections=%d components=%d animationPlan=%d",
        section_count,
        component_count,
        animation_count,
    )
    return creative_spec


def build_structurer_prompt(observations: list[dict[str, Any]]) -> str:
    """
    Build the Gemini prompt for observations -> CreativeSpec structuring.
    """
    observations_json = json.dumps(observations, indent=2, ensure_ascii=False)
    return STRUCTURER_PROMPT_TEMPLATE.format(observations_json=observations_json)


def validate_creative_spec(raw: Any) -> dict[str, Any]:
    """
    Validate and sanitize the CreativeSpec schema returned by Gemini.
    """
    logger.info("Validating structured CreativeSpec response")
    if not isinstance(raw, dict):
        raise ValueError("CreativeSpec response must be a JSON object")

    sections = _validate_sections(raw.get("sections"))
    design = _validate_design(raw.get("design"))
    animation_plan = _validate_animation_plan(raw.get("animationPlan"))
    features = _validate_features(raw.get("features"))

    creative_spec = {
        "sections": sections,
        "design": design,
        "animationPlan": animation_plan,
        "features": features,
    }

    extra_top_level = set(raw) - TOP_LEVEL_KEYS
    if extra_top_level:
        logger.warning("Dropping unsupported top-level fields from CreativeSpec: %s", sorted(extra_top_level))

    logger.info(
        "CreativeSpec validated: sections=%d animationPlan=%d features=%d",
        len(sections),
        len(animation_plan),
        len(features),
    )
    return creative_spec


def _validate_sections(raw_sections: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_sections, list):
        logger.warning("CreativeSpec sections missing or invalid; defaulting to empty list")
        return []

    validated: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    for index, raw_section in enumerate(raw_sections):
        if not isinstance(raw_section, dict):
            logger.warning("Skipping section %d because it is not an object", index)
            continue

        section_id = raw_section.get("id")
        if not isinstance(section_id, str) or not section_id.strip() or section_id in used_ids:
            section_id = _next_section_id(index, used_ids)
            logger.warning("Section %d missing or duplicate id; generated %s", index, section_id)

        section = {
            "id": section_id,
            "type": _nullable_string(raw_section.get("type")),
            "components": _validate_components(raw_section.get("components")),
            "layout": _nullable_string(raw_section.get("layout")),
            "confidence": _nullable_confidence(raw_section.get("confidence")),
        }

        extra_fields = set(raw_section) - SECTION_KEYS
        if extra_fields:
            logger.warning("Dropping unsupported section fields from %s: %s", section_id, sorted(extra_fields))

        validated.append(section)
        used_ids.add(section_id)

    return validated


def _validate_components(raw_components: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_components, list):
        return []

    validated: list[dict[str, Any]] = []
    for index, raw_component in enumerate(raw_components):
        if not isinstance(raw_component, dict):
            logger.warning("Skipping component %d because it is not an object", index)
            continue

        component_type = raw_component.get("type")
        if not isinstance(component_type, str) or not component_type.strip():
            logger.warning("Skipping component %d because type is missing", index)
            continue

        component = {
            "type": component_type.strip(),
            "label": _nullable_string(raw_component.get("label")),
        }

        extra_fields = set(raw_component) - COMPONENT_KEYS
        if extra_fields:
            logger.warning("Dropping unsupported component fields: %s", sorted(extra_fields))

        validated.append(component)

    return validated


def _validate_design(raw_design: Any) -> dict[str, Any]:
    if not isinstance(raw_design, dict):
        logger.warning("CreativeSpec design missing or invalid; defaulting to null fields")
        return {"theme": None, "density": None, "style": None}

    design = {
        "theme": _nullable_string(raw_design.get("theme")),
        "density": _nullable_string(raw_design.get("density")),
        "style": _nullable_string(raw_design.get("style")),
    }

    extra_fields = set(raw_design) - DESIGN_KEYS
    if extra_fields:
        logger.warning("Dropping unsupported design fields: %s", sorted(extra_fields))

    return design


def _validate_animation_plan(raw_animation_plan: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_animation_plan, list):
        return []

    validated: list[dict[str, Any]] = []
    for index, raw_entry in enumerate(raw_animation_plan):
        if not isinstance(raw_entry, dict):
            logger.warning("Skipping animationPlan entry %d because it is not an object", index)
            continue

        name = raw_entry.get("name")
        if not isinstance(name, str) or not name.strip():
            logger.warning("Skipping animationPlan entry %d because name is missing", index)
            continue

        entry = {
            "sectionId": _nullable_string(raw_entry.get("sectionId")),
            "name": name.strip(),
            "trigger": _nullable_string(raw_entry.get("trigger")),
        }

        extra_fields = set(raw_entry) - ANIMATION_KEYS
        if extra_fields:
            logger.warning("Dropping unsupported animationPlan fields: %s", sorted(extra_fields))

        validated.append(entry)

    return validated


def _validate_features(raw_features: Any) -> list[str]:
    if not isinstance(raw_features, list):
        return []

    features: list[str] = []
    for index, feature in enumerate(raw_features):
        if not isinstance(feature, str) or not feature.strip():
            logger.warning("Skipping feature %d because it is empty", index)
            continue
        normalized = feature.strip()
        if normalized not in features:
            features.append(normalized)
    return features


def _nullable_string(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value or None
    logger.warning("Coercing non-string scalar to null: %r", value)
    return None


def _nullable_confidence(value: Any) -> float | None:
    if value is None:
        return None
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        logger.warning("Coercing invalid confidence to null: %r", value)
        return None
    return max(0.0, min(1.0, confidence))


def _next_section_id(seed_index: int, used_ids: set[str]) -> str:
    candidate_number = max(seed_index, 0)
    while True:
        candidate = f"sec_{candidate_number}"
        if candidate not in used_ids:
            return candidate
        candidate_number += 1


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)
