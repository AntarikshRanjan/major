"""
Frame Extraction Module

Samples frames from video at a specified FPS and saves them as PNG files.
Generates a timestamps.json mapping frame indices to video timestamps.

This is stage 2 of the vision pipeline.
"""

import os
import json
import cv2
from typing import Dict, List, Tuple
from tqdm import tqdm


class FrameExtractionError(Exception):
    """Raised when frame extraction fails."""
    pass


def extract_frames(
    video_path: str,
    output_dir: str,
    sampling_fps: float = 5.0,
    metadata: Dict = None
) -> Tuple[List[str], List[Dict]]:
    """
    Extract frames from video at specified sampling rate.
    
    Args:
        video_path: Path to input video file
        output_dir: Directory to save extracted frames
        sampling_fps: Target sampling rate (frames per second)
        metadata: Optional metadata dict (if None, will be computed from video)
        
    Returns:
        Tuple of:
        - List of frame filenames
        - List of timestamp mappings [{frame_index, timestamp, filename}]
        
    Raises:
        FrameExtractionError: If video cannot be opened or frames cannot be extracted
    """
    # Open video
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise FrameExtractionError(f"Could not open video: {video_path}")
    
    # Get video properties
    if metadata:
        source_fps = metadata['fps']
        total_frames = metadata['total_frames']
        duration = metadata['duration']
    else:
        source_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / source_fps
    
    # Calculate frame sampling interval
    # If source is 30fps and we want 5fps, we extract every 6th frame
    frame_interval = int(source_fps / sampling_fps)
    
    if frame_interval < 1:
        frame_interval = 1
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Extract frames
    frame_filenames = []
    timestamps = []
    frame_index = 0
    extracted_count = 0
    
    print(f"Extracting frames at {sampling_fps} fps (every {frame_interval} frames)...")
    
    with tqdm(total=total_frames // frame_interval) as pbar:
        while True:
            # Read frame
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Check if this frame should be sampled
            if frame_index % frame_interval == 0:
                # Calculate timestamp
                timestamp = frame_index / source_fps
                
                # Generate filename with zero-padding (4 digits)
                filename = f"frame_{extracted_count:04d}.png"
                filepath = os.path.join(output_dir, filename)
                
                # Save frame
                success = cv2.imwrite(filepath, frame)
                
                if not success:
                    cap.release()
                    raise FrameExtractionError(f"Failed to write frame: {filepath}")
                
                # Record metadata
                frame_filenames.append(filename)
                timestamps.append({
                    "frame_index": extracted_count,
                    "timestamp": timestamp,
                    "source_frame_index": frame_index,
                    "filename": filename
                })
                
                extracted_count += 1
                pbar.update(1)
            
            frame_index += 1
    
    cap.release()
    
    # Save timestamps to JSON
    timestamps_path = os.path.join(output_dir, "timestamps.json")
    with open(timestamps_path, 'w') as f:
        json.dump(timestamps, f, indent=2)
    
    print(f"Extracted {extracted_count} frames to {output_dir}")
    print(f"Timestamps saved to {timestamps_path}")
    
    return frame_filenames, timestamps


def load_timestamps(frames_dir: str) -> List[Dict]:
    """
    Load timestamps.json from a frames directory.
    
    Args:
        frames_dir: Directory containing timestamps.json
        
    Returns:
        List of timestamp dictionaries
        
    Raises:
        FileNotFoundError: If timestamps.json doesn't exist
    """
    timestamps_path = os.path.join(frames_dir, "timestamps.json")
    
    if not os.path.exists(timestamps_path):
        raise FileNotFoundError(f"timestamps.json not found in {frames_dir}")
    
    with open(timestamps_path, 'r') as f:
        return json.load(f)


def get_frame_at_time(timestamps: List[Dict], target_time: float) -> Dict:
    """
    Find the frame closest to a target timestamp.
    
    Args:
        timestamps: List of timestamp dictionaries
        target_time: Target timestamp in seconds
        
    Returns:
        Timestamp dictionary for the closest frame
    """
    if not timestamps:
        return None
    
    # Find frame with minimum time difference
    closest = min(timestamps, key=lambda x: abs(x['timestamp'] - target_time))
    return closest


if __name__ == "__main__":
    # Test frame extraction
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python extract_frames.py <video_path> <output_dir> [sampling_fps]")
        sys.exit(1)
    
    video_path = sys.argv[1]
    output_dir = sys.argv[2]
    sampling_fps = float(sys.argv[3]) if len(sys.argv) > 3 else 5.0
    
    try:
        # Extract metadata first (optional but recommended)
        from ..ingest.metadata import extract_metadata
        metadata = extract_metadata(video_path)
        
        # Extract frames
        filenames, timestamps = extract_frames(
            video_path,
            output_dir,
            sampling_fps,
            metadata
        )
        
        print(f"\nSuccess! Extracted {len(filenames)} frames.")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
