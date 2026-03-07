"""
Video Metadata Extraction

Extracts technical metadata from video files using ffprobe.
This is the first stage of the vision pipeline.

Returns:
    {
        "duration": float,      # Total duration in seconds
        "fps": float,           # Frames per second
        "width": int,           # Video width in pixels
        "height": int,          # Video height in pixels
        "total_frames": int     # Computed: duration * fps
    }
"""

import ffmpeg
from typing import Dict


class MetadataExtractionError(Exception):
    """Raised when video metadata cannot be extracted."""
    pass


def extract_metadata(video_path: str) -> Dict:
    """
    Extract metadata from a video file using ffprobe.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Dictionary containing duration, fps, resolution, and frame count
        
    Raises:
        MetadataExtractionError: If video is invalid or metadata cannot be read
    """
    try:
        probe = ffmpeg.probe(video_path)
    except ffmpeg.Error as e:
        raise MetadataExtractionError(
            f"Failed to probe video: {e.stderr.decode() if e.stderr else str(e)}"
        )
    
    # Find the video stream
    video_stream = None
    for stream in probe.get('streams', []):
        if stream.get('codec_type') == 'video':
            video_stream = stream
            break
    
    if not video_stream:
        raise MetadataExtractionError("No video stream found in file")
    
    # Extract duration
    duration = None
    if 'duration' in video_stream:
        duration = float(video_stream['duration'])
    elif 'duration' in probe.get('format', {}):
        duration = float(probe['format']['duration'])
    else:
        raise MetadataExtractionError("Could not determine video duration")
    
    # Extract FPS
    fps_str = video_stream.get('r_frame_rate', '0/1')
    try:
        num, den = map(int, fps_str.split('/'))
        fps = num / den if den != 0 else 0
    except (ValueError, ZeroDivisionError):
        raise MetadataExtractionError(f"Invalid FPS format: {fps_str}")
    
    if fps == 0:
        raise MetadataExtractionError("Video has zero FPS")
    
    # Extract resolution
    width = video_stream.get('width')
    height = video_stream.get('height')
    
    if not width or not height:
        raise MetadataExtractionError("Could not determine video resolution")
    
    # Compute total frames
    total_frames = int(duration * fps)
    
    metadata = {
        "duration": duration,
        "fps": fps,
        "width": int(width),
        "height": int(height),
        "total_frames": total_frames
    }
    
    return metadata


def print_metadata(metadata: Dict) -> None:
    """
    Print metadata in a human-readable format.
    
    Args:
        metadata: Dictionary returned by extract_metadata()
    """
    print("=" * 50)
    print("VIDEO METADATA")
    print("=" * 50)
    print(f"Duration:     {metadata['duration']:.2f} seconds")
    print(f"FPS:          {metadata['fps']:.2f}")
    print(f"Resolution:   {metadata['width']}×{metadata['height']}")
    print(f"Total Frames: {metadata['total_frames']}")
    print("=" * 50)


if __name__ == "__main__":
    # Test with a sample video
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python metadata.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    try:
        metadata = extract_metadata(video_path)
        print_metadata(metadata)
    except MetadataExtractionError as e:
        print(f"Error: {e}")
        sys.exit(1)
