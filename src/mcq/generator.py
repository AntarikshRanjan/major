"""
Generate dynamic MCQ questions from a CreativeSpec JSON file using Gemini.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import google.generativeai as genai

from src.vision.gemini_client import GeminiClient, GeminiClientError

logger = logging.getLogger(__name__)

VALID_CATEGORIES = {"animation", "design", "layout", "features"}


def generate_mcq(spec_path: str, output_path: str, api_key: str = None) -> dict[str, Any]:
    """
    Load a CreativeSpec, ask Gemini for grounded MCQ questions, validate them,
    write mcq_questions.json, and return the final payload.
    """
    logger.info("Loading CreativeSpec from %s", spec_path)
    spec = _load_json(spec_path)
    if not isinstance(spec, dict):
        raise ValueError("creative_spec.json must contain a JSON object")

    prompt = _build_prompt(spec)
    client = GeminiClient(api_key=api_key)

    logger.info("Requesting dynamic MCQ questions from Gemini model %s", client.model_name)
    raw = _generate_with_gemini(client, prompt)
    parsed = GeminiClient.parse_json_response(raw)
    questions = _validate_questions(parsed)

    payload = {
        "generated_from": spec_path,
        "total_questions": len(questions),
        "questions": questions,
    }

    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Writing validated MCQ questions to %s", output_path)
    with output_file.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)

    categories = ", ".join(_ordered_categories_present(questions)) or "none"
    print(f"{len(questions)} questions generated covering: {categories}")
    logger.info(
        "MCQ generation complete: total=%d categories=%s",
        len(questions),
        categories,
    )
    return payload


def merge_answers(mcq_path: str, answers: dict, spec_path: str) -> dict:
    """
    Merge user answers into creative_spec.json and save the updated spec.
    """
    logger.info("Loading MCQ file from %s", mcq_path)
    mcq_payload = _load_json(mcq_path)
    if not isinstance(mcq_payload, dict):
        raise ValueError("mcq_questions.json must contain a JSON object")

    logger.info("Loading CreativeSpec from %s", spec_path)
    spec = _load_json(spec_path)
    if not isinstance(spec, dict):
        raise ValueError("creative_spec.json must contain a JSON object")

    if not isinstance(answers, dict):
        raise ValueError("answers must be a dict mapping question ids to answers")

    questions = mcq_payload.get("questions")
    if not isinstance(questions, list):
        questions = []

    for question in questions:
        if not isinstance(question, dict):
            logger.warning("Skipping malformed question entry during merge: %r", question)
            continue

        question_id = question.get("id")
        if not isinstance(question_id, str) or question_id not in answers:
            continue

        answer_values = _normalize_answer_values(answers[question_id])
        if not answer_values:
            logger.warning("Question %s has empty answer payload; skipping", question_id)
            continue

        category = question.get("category")
        logger.info("Merging answer for %s (%s)", question_id, category)
        if category == "animation":
            _merge_animation_answer(spec, question, answer_values)
        elif category == "design":
            _merge_design_answer(spec, question, answer_values)
        elif category == "features":
            _merge_features_answer(spec, answer_values)
        elif category == "layout":
            _merge_layout_answer(spec, question, answer_values)
        else:
            logger.warning("Question %s has unsupported category %r; skipping", question_id, category)

    output_file = Path(spec_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    logger.info("Writing updated CreativeSpec back to %s", spec_path)
    with output_file.open("w", encoding="utf-8") as handle:
        json.dump(spec, handle, indent=2, ensure_ascii=False)

    return spec


def _build_prompt(spec: dict[str, Any]) -> str:
    logger.info("Building Gemini prompt from CreativeSpec")
    spec_json = json.dumps(spec, indent=2, ensure_ascii=False)
    return f"""
You are a smart UI/UX assistant helping a developer build a website.

You have been given a CreativeSpec JSON that was extracted from a screen 
recording of a reference website. Your job is to generate smart, specific 
MCQ questions that will help clarify missing, uncertain, or incomplete 
information in the spec so the developer can build the best possible website.

Here is the CreativeSpec:
{spec_json}

Analyze the spec carefully and generate questions based on:
1. Any section with empty animations list → ask about animation preferences for that section
2. Any component type that is vague or missing detail → ask for clarification
3. design.theme = "unknown" or design.colorPalette is empty → ask about colors and theme
4. design.density = "unknown" → ask about spacing and layout density
5. meta.missingAnimations = true → ask multiple animation questions
6. features is empty → ask what features the user wants to add
7. Any section type = "unknown" → ask the user to clarify what that section is
8. Any rawClaims that mention uncertainty words like "likely", "appears", "possibly", 
   "seems" → generate a clarification question for that claim
9. Always ask about the animation library preference
10. Always ask about mobile responsiveness

Rules for generating questions:
- Make every question SPECIFIC to what you found in the spec
- Reference actual section ids, component labels, and claims from the spec
- Do NOT generate generic questions — every question must be grounded in the spec data
- Generate between 8 and 15 questions total
- Cover all 4 categories: animation, design, layout, features

Return a JSON array of question objects — nothing else. No markdown fences.

Each question object must follow this exact schema:
{{
  "id": "q_001",
  "category": "animation" | "design" | "layout" | "features",
  "question": "specific question text referencing actual spec content",
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "multi": true or false,
  "reason": "why this question is being asked — reference the spec field",
  "targetSection": "sec_N" or null
}}

Rules for options:
- Always 3 to 5 options
- Always include a neutral/none option where relevant
- Make options specific and actionable, not generic
- For animation questions, name actual animation types
- For color questions, suggest colors that match the detected theme

Rules for multi:
- multi: true only for features questions where user can want multiple things
- multi: false for all design, animation, layout questions
"""


def _generate_with_gemini(client: GeminiClient, prompt: str) -> str:
    try:
        model = genai.GenerativeModel(client.model_name)
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "response_mime_type": "application/json",
            },
        )
        return response.text
    except Exception as exc:
        raise GeminiClientError(f"MCQ generation request failed: {exc}") from exc


def _validate_questions(raw: Any) -> list[dict[str, Any]]:
    logger.info("Validating Gemini-generated MCQ response")
    if not isinstance(raw, list):
        raise ValueError("Gemini MCQ response must be a JSON array")

    validated: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    for index, question in enumerate(raw, start=1):
        validated_question = _validate_question(question, index, used_ids)
        if validated_question is None:
            continue
        validated.append(validated_question)
        used_ids.add(validated_question["id"])

    if len(validated) > 15:
        logger.warning("Gemini returned %d valid questions; truncating to 15", len(validated))
        validated = validated[:15]
    elif len(validated) < 8:
        logger.warning("Gemini returned only %d valid questions; expected 8-15", len(validated))

    logger.info("Validated %d questions out of %d generated entries", len(validated), len(raw))
    return validated


def _validate_question(
    question: Any,
    index: int,
    used_ids: set[str],
) -> dict[str, Any] | None:
    if not isinstance(question, dict):
        logger.warning("Skipping question %d because it is not an object", index)
        return None

    category = question.get("category")
    if category not in VALID_CATEGORIES:
        logger.warning("Skipping question %d because category %r is invalid", index, category)
        return None

    question_text = question.get("question")
    if not isinstance(question_text, str) or not question_text.strip():
        logger.warning("Skipping question %d because question text is empty", index)
        return None

    options = question.get("options")
    if not isinstance(options, list):
        logger.warning("Skipping question %d because options is not a list", index)
        return None

    clean_options = [option.strip() for option in options if isinstance(option, str) and option.strip()]
    if len(clean_options) < 3 or len(clean_options) > 5:
        logger.warning(
            "Skipping question %d because it has %d valid options (expected 3-5)",
            index,
            len(clean_options),
        )
        return None

    multi = question.get("multi")
    if not isinstance(multi, bool):
        logger.warning("Skipping question %d because multi is not boolean", index)
        return None

    reason = question.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        logger.warning("Skipping question %d because reason is empty", index)
        return None

    target_section = question.get("targetSection")
    if target_section is not None and not isinstance(target_section, str):
        logger.warning("Skipping question %d because targetSection is invalid", index)
        return None

    question_id = question.get("id")
    if not isinstance(question_id, str) or not question_id.strip() or question_id in used_ids:
        question_id = _next_question_id(index, used_ids)

    if category != "features" and multi:
        logger.warning("Skipping question %s because only features questions may be multi-select", question_id)
        return None

    return {
        "id": question_id,
        "category": category,
        "question": question_text.strip(),
        "options": clean_options,
        "multi": multi,
        "reason": reason.strip(),
        "targetSection": target_section.strip() if isinstance(target_section, str) else None,
    }


def _next_question_id(seed_index: int, used_ids: set[str]) -> str:
    candidate_number = max(seed_index, 1)
    while True:
        candidate = f"q_{candidate_number:03d}"
        if candidate not in used_ids:
            return candidate
        candidate_number += 1


def _ordered_categories_present(questions: list[dict[str, Any]]) -> list[str]:
    ordered = []
    for category in ("animation", "design", "layout", "features"):
        if any(question.get("category") == category for question in questions):
            ordered.append(category)
    return ordered


def _load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _normalize_answer_values(answer: Any) -> list[str]:
    if isinstance(answer, str):
        value = answer.strip()
        return [value] if value else []
    if isinstance(answer, list):
        normalized = []
        for item in answer:
            if isinstance(item, str) and item.strip():
                normalized.append(item.strip())
        return normalized
    return []


def _merge_animation_answer(spec: dict[str, Any], question: dict[str, Any], answers: list[str]) -> None:
    sections = _get_sections(spec)
    target_section = question.get("targetSection")
    target_sections = sections if target_section is None else [
        section for section in sections if section.get("id") == target_section
    ]

    if target_section is not None and not target_sections:
        logger.warning("Animation target section %s not found; skipping", target_section)
        return

    for section in target_sections:
        animations = section.get("animations")
        if not isinstance(animations, list):
            animations = []
            section["animations"] = animations
        for answer in answers:
            if answer not in animations:
                animations.append(answer)


def _merge_design_answer(spec: dict[str, Any], question: dict[str, Any], answers: list[str]) -> None:
    design = spec.get("design")
    if not isinstance(design, dict):
        design = {}
        spec["design"] = design

    question_text = str(question.get("question", "")).lower()
    answer_text = answers[0]

    if "animation library" in question_text:
        design["animationLibrary"] = answer_text
        return

    if "density" in question_text or "spacing" in question_text:
        design["density"] = answer_text
        return

    if "color" in question_text or "theme" in question_text:
        design["theme"] = _derive_theme(answer_text)
        palette = design.get("colorPalette")
        if not isinstance(palette, list):
            palette = []
        design["colorPalette"] = _merge_unique_strings(palette, [_derive_palette_color(answer_text)])


def _merge_features_answer(spec: dict[str, Any], answers: list[str]) -> None:
    features = spec.get("features")
    if not isinstance(features, list):
        features = []
        spec["features"] = features
    spec["features"] = _merge_unique_strings(features, answers)


def _merge_layout_answer(spec: dict[str, Any], question: dict[str, Any], answers: list[str]) -> None:
    target_section = question.get("targetSection")
    if not isinstance(target_section, str) or not target_section.strip():
        logger.warning("Layout answer missing targetSection; skipping")
        return

    for section in _get_sections(spec):
        if section.get("id") == target_section:
            section["layoutStyle"] = answers[0]
            return

    logger.warning("Layout target section %s not found; skipping", target_section)


def _get_sections(spec: dict[str, Any]) -> list[dict[str, Any]]:
    sections = spec.get("sections")
    if not isinstance(sections, list):
        spec["sections"] = []
        return spec["sections"]
    return [section for section in sections if isinstance(section, dict)]


def _merge_unique_strings(existing: list[Any], new_values: list[str]) -> list[str]:
    merged = [value for value in existing if isinstance(value, str) and value.strip()]
    for value in new_values:
        if value and value not in merged:
            merged.append(value)
    return merged


def _derive_theme(answer: str) -> str:
    lowered = answer.lower()
    if "light" in lowered:
        return "light"
    if "dark" in lowered:
        return "dark"
    if "color" in lowered or "accent" in lowered:
        return "custom"
    return answer


def _derive_palette_color(answer: str) -> str:
    lowered = answer.lower()
    color_map = (
        ("green", "green"),
        ("blue", "blue"),
        ("purple", "purple"),
        ("orange", "orange"),
        ("red", "red"),
        ("yellow", "yellow"),
        ("white", "white"),
        ("black", "black"),
    )
    for needle, color in color_map:
        if needle in lowered:
            return color
    return answer
