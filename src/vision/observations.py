"""
Observation Parsing & Validation

Validates and normalises raw observations returned by Gemini before they
are written to observations.json.
"""

import uuid
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Required top-level keys in every observation
_REQUIRED_KEYS = {"id", "sectionId", "category", "claim", "confidence", "evidence"}
_VALID_CATEGORIES = {"motion", "layout", "temporal"}


class ObservationValidationError(Exception):
    """Raised when a Gemini response cannot be coerced into valid observations."""
    pass


def validate_observation(obs: dict, index: int) -> dict:
    """
    Validate and fill in defaults for a single observation dict.

    Args:
        obs:   Raw dict from parsed Gemini JSON.
        index: Position in the list (used for generated IDs and logging).

    Returns:
        Cleaned observation dict.

    Raises:
        ObservationValidationError: If the observation is structurally broken.
    """
    if not isinstance(obs, dict):
        raise ObservationValidationError(
            f"Observation [{index}] is not a dict: {type(obs)}"
        )

    # -- id --
    if not obs.get("id"):
        obs["id"] = f"obs_auto_{index:04d}"
        logger.warning(f"Observation [{index}] missing 'id', generated: {obs['id']}")

    # -- sectionId --
    if not obs.get("sectionId"):
        obs["sectionId"] = "sec_0"
        logger.warning(f"Observation {obs['id']} missing 'sectionId', defaulted to sec_0")

    # -- category --
    category = obs.get("category", "").lower()
    if category not in _VALID_CATEGORIES:
        logger.warning(
            f"Observation {obs['id']} has unknown category '{category}', defaulting to 'layout'"
        )
        obs["category"] = "layout"
    else:
        obs["category"] = category

    # -- claim --
    if not obs.get("claim"):
        raise ObservationValidationError(
            f"Observation {obs['id']} is missing required field 'claim'."
        )

    # -- confidence --
    try:
        conf = float(obs.get("confidence", 0.5))
        obs["confidence"] = max(0.0, min(1.0, conf))
    except (TypeError, ValueError):
        logger.warning(f"Observation {obs['id']} has invalid confidence, defaulting to 0.5")
        obs["confidence"] = 0.5

    # -- evidence --
    if not isinstance(obs.get("evidence"), dict):
        obs["evidence"] = {
            "frameRange": [0, 0],
            "keyframes": [],
            "description": "",
        }
    else:
        ev = obs["evidence"]
        if "frameRange" not in ev or not isinstance(ev["frameRange"], list):
            ev["frameRange"] = [0, 0]
        if "keyframes" not in ev or not isinstance(ev["keyframes"], list):
            ev["keyframes"] = []
        if "description" not in ev:
            ev["description"] = ""

    return obs


def validate_observations(raw: Any, min_confidence: float = 0.0) -> list[dict]:
    """
    Validate a list of raw observations (as parsed from Gemini JSON).

    Args:
        raw:            Parsed Python object (should be a list of dicts).
        min_confidence: Drop observations below this confidence threshold.

    Returns:
        List of validated observation dicts.

    Raises:
        ObservationValidationError: If raw is not a list.
    """
    if not isinstance(raw, list):
        raise ObservationValidationError(
            f"Expected a JSON array of observations, got {type(raw).__name__}."
        )

    validated = []
    skipped = 0

    for i, obs in enumerate(raw):
        try:
            obs = validate_observation(obs, i)
        except ObservationValidationError as e:
            logger.warning(f"Skipping observation [{i}]: {e}")
            skipped += 1
            continue

        if obs["confidence"] < min_confidence:
            logger.info(
                f"Dropping {obs['id']} — confidence {obs['confidence']:.2f} "
                f"< threshold {min_confidence:.2f}"
            )
            skipped += 1
            continue

        validated.append(obs)

    logger.info(
        f"Observations: {len(validated)} accepted, {skipped} skipped "
        f"(min_confidence={min_confidence})"
    )
    return validated


def deduplicate_observations(observations: list[dict]) -> list[dict]:
    """
    Remove duplicate observations based on identical (sectionId, category, claim).
    Keeps the one with higher confidence.
    """
    seen: dict[tuple, dict] = {}
    for obs in observations:
        key = (obs["sectionId"], obs["category"], obs["claim"].lower().strip())
        if key not in seen or obs["confidence"] > seen[key]["confidence"]:
            seen[key] = obs
    return list(seen.values())
