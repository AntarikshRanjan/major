"""
Test Script: Metadata Extraction and Frame Extraction

This script tests stages 1-2 of the vision pipeline.

Usage:
    python scripts/test_stage1_2.py <path_to_video>

Example:
    python scripts/test_stage1_2.py data/input/sample.mp4
"""

import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.ingest.metadata import extract_metadata, print_metadata, MetadataExtractionError
from src.frames.extract_frames import extract_frames, FrameExtractionError


def main():
    if len(sys.argv) < 2:
        print("Usage: python test_stage1_2.py <video_path>")
        print("\nExample:")
        print("  python scripts/test_stage1_2.py data/input/sample.mp4")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("STAGE 1: METADATA EXTRACTION")
    print("="*60 + "\n")
    
    try:
        metadata = extract_metadata(video_path)
        print_metadata(metadata)
    except MetadataExtractionError as e:
        print(f"Error extracting metadata: {e}")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("STAGE 2: FRAME EXTRACTION")
    print("="*60 + "\n")
    
    # Extract frames to data/frames/
    output_dir = os.path.join("data", "frames")
    sampling_fps = 5.0
    
    print(f"Target sampling rate: {sampling_fps} fps")
    print(f"Output directory: {output_dir}\n")
    
    try:
        filenames, timestamps = extract_frames(
            video_path=video_path,
            output_dir=output_dir,
            sampling_fps=sampling_fps,
            metadata=metadata
        )
        
        print(f"\n✓ Successfully extracted {len(filenames)} frames")
        print(f"✓ Timestamps saved to {output_dir}/timestamps.json")
        
        # Show sample timestamps
        print("\nSample timestamps:")
        for i, ts in enumerate(timestamps[:5]):
            print(f"  {ts['filename']}: {ts['timestamp']:.2f}s")
        
        if len(timestamps) > 5:
            print(f"  ... ({len(timestamps) - 5} more frames)")
        
        print("\n" + "="*60)
        print("STAGES 1-2 COMPLETE ✓")
        print("="*60)
        
    except FrameExtractionError as e:
        print(f"Error extracting frames: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
