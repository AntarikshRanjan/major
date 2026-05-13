"""
Public normalizer entrypoint.

This module preserves the existing normalize(...) interface while delegating
all structuring work to the LLM-based structurer.
"""

from __future__ import annotations

from typing import Any

from src.normalizer.structurer import structure_observations


def normalize(observations_path: str, output_path: str) -> dict[str, Any]:
    """
    Convert observations.json into CreativeSpec JSON using the LLM structurer.
    """
    return structure_observations(observations_path, output_path)
