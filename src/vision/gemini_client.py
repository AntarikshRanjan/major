"""
Gemini Vision Client

Uploads a video to the Gemini File API and runs structured analysis
to extract website observations.

Workflow:
    1. upload_video()   — upload file, wait until ACTIVE
    2. analyze_video()  — send prompt + file ref, get JSON back
    3. delete_video()   — clean up remote file (optional)
"""

import os
import time
import json
import logging
from typing import Optional
from pathlib import Path

import google.generativeai as genai

try:
    from dotenv import load_dotenv
    # Walk up from this file's location to find a .env file
    _env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(dotenv_path=_env_path)
except ImportError:
    pass  # python-dotenv not installed; rely on shell environment
from google.generativeai.types import File

logger = logging.getLogger(__name__)


class GeminiClientError(Exception):
    """Raised when Gemini API interaction fails."""
    pass


class GeminiClient:
    """
    Thin wrapper around the Gemini generative AI SDK for video analysis.

    Args:
        api_key: Gemini API key. Falls back to GEMINI_API_KEY env var.
        model:   Model name. Default is gemini-2.0-flash which supports video.
        poll_interval: Seconds between file-state polling attempts.
        max_wait:      Maximum seconds to wait for file processing.
    """

    DEFAULT_MODEL = "gemini-2.5-flash"

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        poll_interval: int = 5,
        max_wait: int = 300,
    ):
        resolved_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not resolved_key:
            raise GeminiClientError(
                "Gemini API key not provided. "
                "Set GEMINI_API_KEY environment variable or pass api_key=..."
            )

        genai.configure(api_key=resolved_key)
        self.model_name = model
        self.poll_interval = poll_interval
        self.max_wait = max_wait
        self._model = genai.GenerativeModel(model)

    # ------------------------------------------------------------------
    # File lifecycle
    # ------------------------------------------------------------------

    def upload_video(self, video_path: str) -> File:
        """
        Upload a video file to the Gemini File API.

        The file is uploaded and then polled until its state is ACTIVE
        (i.e., Gemini has finished processing it internally).

        Args:
            video_path: Absolute or relative path to the video file.

        Returns:
            A google.generativeai File object ready for use in prompts.

        Raises:
            GeminiClientError: If upload fails or file never becomes ACTIVE.
        """
        if not os.path.exists(video_path):
            raise GeminiClientError(f"Video file not found: {video_path}")

        file_size_mb = os.path.getsize(video_path) / (1024 * 1024)
        logger.info(f"Uploading {video_path} ({file_size_mb:.1f} MB) ...")
        print(f"[Gemini] Uploading video ({file_size_mb:.1f} MB) — this may take a moment ...")

        try:
            video_file = genai.upload_file(path=video_path)
        except Exception as e:
            raise GeminiClientError(f"Upload failed: {e}") from e

        # Poll until ACTIVE
        waited = 0
        while video_file.state.name != "ACTIVE":
            if waited >= self.max_wait:
                raise GeminiClientError(
                    f"File never became ACTIVE after {self.max_wait}s. "
                    f"Last state: {video_file.state.name}"
                )
            if video_file.state.name == "FAILED":
                raise GeminiClientError("Gemini file processing FAILED.")

            print(f"[Gemini] File state: {video_file.state.name} — waiting ...")
            time.sleep(self.poll_interval)
            waited += self.poll_interval
            video_file = genai.get_file(video_file.name)

        print(f"[Gemini] File ready: {video_file.uri}")
        return video_file

    def delete_video(self, video_file: File) -> None:
        """Delete the uploaded file from Gemini's servers."""
        try:
            genai.delete_file(video_file.name)
            logger.info(f"Deleted remote file: {video_file.name}")
        except Exception as e:
            logger.warning(f"Could not delete remote file {video_file.name}: {e}")

    # ------------------------------------------------------------------
    # Analysis
    # ------------------------------------------------------------------

    def analyze_video(self, video_file: File, prompt: str) -> str:
        """
        Send a prompt alongside an uploaded video file to Gemini and
        return the raw text response.

        Args:
            video_file: File object returned by upload_video().
            prompt:     The analysis prompt (see prompts.py).

        Returns:
            Raw text content of the model response.

        Raises:
            GeminiClientError: If the API call fails.
        """
        print(f"[Gemini] Running analysis with {self.model_name} ...")
        try:
            response = self._model.generate_content(
                [video_file, prompt],
                generation_config={
                    "temperature": 0.2,      # low temp for deterministic JSON
                    "response_mime_type": "application/json",
                },
            )
            return response.text
        except Exception as e:
            raise GeminiClientError(f"Analysis request failed: {e}") from e

    def analyze_video_path(
        self,
        video_path: str,
        prompt: str,
        cleanup: bool = True,
    ) -> str:
        """
        Convenience method: upload → analyze → (optionally delete).

        Args:
            video_path: Path to video file.
            prompt:     Analysis prompt.
            cleanup:    Whether to delete the remote file after analysis.

        Returns:
            Raw JSON string from Gemini.
        """
        video_file = self.upload_video(video_path)
        try:
            raw = self.analyze_video(video_file, prompt)
        finally:
            if cleanup:
                self.delete_video(video_file)
        return raw

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def parse_json_response(raw: str) -> dict | list:
        """
        Parse a raw Gemini response string into Python objects.

        Gemini with response_mime_type='application/json' should return
        valid JSON, but this method also strips common markdown fences
        as a safety net.

        Raises:
            GeminiClientError: If the text cannot be parsed as JSON.
        """
        text = raw.strip()

        # Strip ```json ... ``` fences if present
        if text.startswith("```"):
            lines = text.splitlines()
            text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise GeminiClientError(
                f"Could not parse Gemini response as JSON: {e}\n"
                f"Raw response (first 500 chars):\n{raw[:500]}"
            ) from e
