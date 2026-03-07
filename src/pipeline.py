"""
Vision Pipeline — Orchestrator

Ties together:
    Stage 1 — Metadata extraction    (ffprobe)
    Stage 2 — Frame extraction       (OpenCV, optional — kept for evidence labels)
    Stage 3 — Gemini video analysis  (replaces manual motion/segmentation/obs stages)

Outputs:
    data/output/observations.json
"""

import os
import json
import logging
import yaml
from typing import Optional

from src.ingest.metadata import extract_metadata, MetadataExtractionError
from src.vision.gemini_client import GeminiClient, GeminiClientError
from src.vision.prompts import WEBSITE_ANALYSIS_PROMPT
from src.vision.observations import (
    validate_observations,
    deduplicate_observations,
    ObservationValidationError,
)

logger = logging.getLogger(__name__)


def load_config(config_path: str = "config/defaults.yaml") -> dict:
    """Load YAML configuration, returning empty dict on failure."""
    try:
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}
    except FileNotFoundError:
        logger.warning(f"Config not found at {config_path}, using defaults.")
        return {}


class VisionPipeline:
    """
    End-to-end vision analysis pipeline for website screen recordings.

    Args:
        api_key:         Gemini API key (or set GEMINI_API_KEY env var).
        config_path:     Path to defaults.yaml.
        extract_frames:  Whether to run frame extraction (stage 2).
                         Frames are not required for Gemini analysis but
                         populate keyframe evidence labels.
        model:           Gemini model to use.
        cleanup_remote:  Delete uploaded file from Gemini after analysis.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        config_path: str = "config/defaults.yaml",
        extract_frames: bool = False,
        model: str = "gemini-2.5-flash",
        cleanup_remote: bool = True,
    ):
        self.config = load_config(config_path)
        self.extract_frames_flag = extract_frames
        self.cleanup_remote = cleanup_remote

        obs_cfg = self.config.get("observations", {})
        self.min_confidence: float = obs_cfg.get("min_confidence", 0.5)

        paths_cfg = self.config.get("paths", {})
        self.frames_dir: str = paths_cfg.get("frames", "data/frames")
        self.output_dir: str = paths_cfg.get("output", "data/output")

        sampling_cfg = self.config.get("sampling", {})
        self.sampling_fps: float = sampling_cfg.get("fps", 5.0)

        self.client = GeminiClient(
            api_key=api_key,
            model=model,
        )
        # override cleanup preference
        self._cleanup = cleanup_remote

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    def run(self, video_path: str, output_path: Optional[str] = None) -> list[dict]:
        """
        Run the full pipeline on a video file.

        Args:
            video_path:  Path to the input video (mp4, mov, webm, …).
            output_path: Where to write observations.json.
                         Defaults to data/output/observations.json.

        Returns:
            List of validated observation dicts.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        output_path = output_path or os.path.join(self.output_dir, "observations.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # ── Stage 1: Metadata ──────────────────────────────────────────
        print("\n[Stage 1] Extracting video metadata ...")
        try:
            metadata = extract_metadata(video_path)
            _print_metadata(metadata)
        except MetadataExtractionError as e:
            logger.warning(f"Metadata extraction failed: {e}. Continuing without metadata.")
            metadata = {}

        # ── Stage 2: Frame extraction (optional) ───────────────────────
        if self.extract_frames_flag:
            print("\n[Stage 2] Extracting frames ...")
            self._run_frame_extraction(video_path, metadata)
        else:
            print("\n[Stage 2] Skipping frame extraction (not required for Gemini analysis).")

        # ── Stage 3: Gemini analysis ───────────────────────────────────
        print("\n[Stage 3] Running Gemini video analysis ...")
        raw_json = self._run_gemini_analysis(video_path)

        # ── Parse & validate ───────────────────────────────────────────
        print("\n[Post-process] Validating observations ...")
        parsed = self.client.parse_json_response(raw_json)
        observations = validate_observations(parsed, min_confidence=self.min_confidence)
        observations = deduplicate_observations(observations)

        # ── Write output ───────────────────────────────────────────────
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(observations, f, indent=2, ensure_ascii=False)

        print(f"\n✓ {len(observations)} observations written to {output_path}")
        return observations

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _run_gemini_analysis(self, video_path: str) -> str:
        """Upload video and run the analysis prompt, returning raw JSON string."""
        video_file = self.client.upload_video(video_path)
        try:
            raw = self.client.analyze_video(video_file, WEBSITE_ANALYSIS_PROMPT)
        finally:
            if self._cleanup:
                self.client.delete_video(video_file)
        return raw

    def _run_frame_extraction(self, video_path: str, metadata: dict) -> None:
        """Run stage-2 frame extraction (best-effort, non-fatal)."""
        try:
            from src.frames.extract_frames import extract_frames, FrameExtractionError
            extract_frames(
                video_path=video_path,
                output_dir=self.frames_dir,
                sampling_fps=self.sampling_fps,
                metadata=metadata or None,
            )
        except Exception as e:
            logger.warning(f"Frame extraction failed (non-fatal): {e}")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _print_metadata(m: dict) -> None:
    if not m:
        return
    print(f"  Duration:   {m.get('duration', '?'):.2f}s")
    print(f"  FPS:        {m.get('fps', '?'):.2f}")
    print(f"  Resolution: {m.get('width', '?')}×{m.get('height', '?')}")
    print(f"  Frames:     {m.get('total_frames', '?')}")
