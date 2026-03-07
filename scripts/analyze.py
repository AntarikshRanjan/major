"""
analyze.py — Main CLI entry point for the v0dev vision pipeline.

Usage:
    python scripts/analyze.py data/input/sample.mp4

Options:
    --output PATH       Where to write observations.json
                        (default: data/output/observations.json)
    --model  MODEL      Gemini model name
                        (default: gemini-2.5-flash)
    --frames            Also run frame extraction (stage 2)
    --no-cleanup        Keep the uploaded file on Gemini's servers
    --min-confidence F  Drop observations below this threshold (0.0–1.0)
    --config PATH       Path to config YAML (default: config/defaults.yaml)
    --verbose           Enable DEBUG logging

Environment:
    GEMINI_API_KEY      Required. Your Google AI Studio API key.

Example:
    $env:GEMINI_API_KEY = "AIza..."
    python scripts/analyze.py data/input/my_site.mp4
"""

import sys
import os
import argparse
import logging
import json

# Make sure src/ is importable when running from project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.pipeline import VisionPipeline
from src.vision.gemini_client import GeminiClientError
from src.ingest.metadata import MetadataExtractionError


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="analyze",
        description="v0dev Vision Pipeline — Gemini-powered website video analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "video",
        help="Path to the input video file (mp4, mov, webm, …)",
    )
    p.add_argument(
        "--output",
        default=None,
        metavar="PATH",
        help="Output path for observations.json (default: data/output/observations.json)",
    )
    p.add_argument(
        "--model",
        default="gemini-2.5-flash",
        metavar="MODEL",
        help="Gemini model name (default: gemini-2.5-flash)",
    )
    p.add_argument(
        "--frames",
        action="store_true",
        help="Also run frame extraction (stage 2) to populate data/frames/",
    )
    p.add_argument(
        "--no-cleanup",
        action="store_true",
        help="Keep the uploaded file on Gemini's servers after analysis",
    )
    p.add_argument(
        "--min-confidence",
        type=float,
        default=None,
        metavar="F",
        help="Minimum confidence threshold for observations (overrides config)",
    )
    p.add_argument(
        "--config",
        default="config/defaults.yaml",
        metavar="PATH",
        help="Path to YAML configuration file",
    )
    p.add_argument(
        "--verbose",
        action="store_true",
        help="Enable DEBUG-level logging",
    )
    return p


def main():
    parser = build_parser()
    args = parser.parse_args()

    # Logging setup
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(levelname)s %(name)s: %(message)s",
    )

    # API key check
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print(
            "\nERROR: GEMINI_API_KEY environment variable is not set.\n"
            "Set it with:\n"
            "  $env:GEMINI_API_KEY = 'AIza...'        (PowerShell)\n"
            "  export GEMINI_API_KEY='AIza...'        (bash)\n",
            file=sys.stderr,
        )
        sys.exit(1)

    print("=" * 60)
    print("  v0dev Vision Pipeline — Gemini Analysis")
    print("=" * 60)
    print(f"  Video  : {args.video}")
    print(f"  Model  : {args.model}")
    print(f"  Output : {args.output or 'data/output/observations.json'}")
    print("=" * 60)

    # Build pipeline
    pipeline = VisionPipeline(
        api_key=api_key,
        config_path=args.config,
        extract_frames=args.frames,
        model=args.model,
        cleanup_remote=not args.no_cleanup,
    )

    # Override min_confidence if provided
    if args.min_confidence is not None:
        pipeline.min_confidence = args.min_confidence

    # Run
    try:
        observations = pipeline.run(
            video_path=args.video,
            output_path=args.output,
        )
    except FileNotFoundError as e:
        print(f"\nERROR: {e}", file=sys.stderr)
        sys.exit(1)
    except GeminiClientError as e:
        print(f"\nERROR (Gemini): {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

    # Summary
    print("\n" + "=" * 60)
    print(f"  DONE — {len(observations)} observations extracted")
    print("=" * 60)

    # Print category breakdown
    from collections import Counter
    counts = Counter(o["category"] for o in observations)
    for cat, n in sorted(counts.items()):
        print(f"  {cat:<12} {n}")

    # Show top 3 by confidence
    top = sorted(observations, key=lambda o: o["confidence"], reverse=True)[:3]
    if top:
        print("\n  Top observations by confidence:")
        for obs in top:
            print(f"    [{obs['confidence']:.2f}] {obs['claim']}")

    print()


if __name__ == "__main__":
    main()
