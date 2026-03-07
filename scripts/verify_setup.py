"""
Verification Script: Check v0dev Vision Pipeline Setup

This script verifies that all required files and dependencies are in place.
"""

import os
import sys
from pathlib import Path

def check_file(path, description):
    """Check if a file exists."""
    exists = os.path.exists(path)
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {path}")
    return exists

def check_directory(path, description):
    """Check if a directory exists."""
    exists = os.path.isdir(path)
    status = "✓" if exists else "✗"
    print(f"{status} {description}: {path}")
    return exists

def main():
    print("\n" + "="*70)
    print("v0dev VISION ANALYSIS SERVICE - SETUP VERIFICATION")
    print("="*70 + "\n")
    
    all_good = True
    
    # Core files
    print("📄 CORE FILES:")
    all_good &= check_file("requirements.txt", "Dependencies")
    all_good &= check_file("README.md", "Documentation")
    all_good &= check_file("config/defaults.yaml", "Configuration")
    print()
    
    # Source modules
    print("🐍 SOURCE MODULES:")
    all_good &= check_file("src/__init__.py", "Package init")
    all_good &= check_file("src/ingest/__init__.py", "Ingest package")
    all_good &= check_file("src/ingest/metadata.py", "Stage 1: Metadata extraction")
    all_good &= check_file("src/frames/__init__.py", "Frames package")
    all_good &= check_file("src/frames/extract_frames.py", "Stage 2: Frame extraction")
    print()
    
    # Scripts
    print("📜 SCRIPTS:")
    all_good &= check_file("scripts/test_stage1_2.py", "Test script for stages 1-2")
    print()
    
    # Data directories
    print("📁 DATA DIRECTORIES:")
    all_good &= check_directory("data/input", "Input directory")
    all_good &= check_directory("data/frames", "Frames directory")
    all_good &= check_directory("data/output", "Output directory")
    print()
    
    # Check if Python modules can be imported
    print("🔍 MODULE IMPORT CHECK:")
    try:
        sys.path.insert(0, os.getcwd())
        from src.ingest.metadata import extract_metadata
        print("✓ Can import src.ingest.metadata")
    except ImportError as e:
        print(f"✗ Cannot import src.ingest.metadata: {e}")
        all_good = False
    
    try:
        from src.frames.extract_frames import extract_frames
        print("✓ Can import src.frames.extract_frames")
    except ImportError as e:
        print(f"✗ Cannot import src.frames.extract_frames: {e}")
        all_good = False
    print()
    
    # Check dependencies
    print("📦 DEPENDENCY CHECK:")
    dependencies = [
        ("cv2", "opencv-python"),
        ("ffmpeg", "ffmpeg-python"),
        ("numpy", "numpy"),
        ("skimage", "scikit-image"),
        ("yaml", "PyYAML"),
        ("tqdm", "tqdm")
    ]
    
    missing_deps = []
    for module_name, package_name in dependencies:
        try:
            __import__(module_name)
            print(f"✓ {package_name}")
        except ImportError:
            print(f"✗ {package_name} - NOT INSTALLED")
            missing_deps.append(package_name)
            all_good = False
    
    if missing_deps:
        print(f"\n⚠️  Missing dependencies: {', '.join(missing_deps)}")
        print("   Install with: pip install -r requirements.txt")
    print()
    
    # Final status
    print("="*70)
    if all_good:
        print("✅ ALL CHECKS PASSED - Setup is complete!")
        print("\nNext steps:")
        print("1. Place a video in data/input/ (e.g., sample.mp4)")
        print("2. Run: python scripts/test_stage1_2.py data/input/sample.mp4")
        print("3. Check data/frames/ for extracted frames")
    else:
        print("❌ SOME CHECKS FAILED - Please review errors above")
        if missing_deps:
            print("\n⚠️  Install missing dependencies first:")
            print("   pip install -r requirements.txt")
    print("="*70 + "\n")
    
    return 0 if all_good else 1

if __name__ == "__main__":
    sys.exit(main())
