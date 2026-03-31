#!/usr/bin/env python3
"""
Automatically extract individual gun silhouettes from the sheet
"""
import subprocess
import os
import sys

def run_cmd(cmd):
    """Run command and return success"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
        return result.returncode == 0
    except:
        return False

print("🔫 Gun Silhouette Extractor")
print("=" * 50)

# Step 1: Convert EPS to high-res PNG
eps_file = "gun silhouettes.eps"
sheet_png = "sheet-0.png"  # ImageMagick creates sheet-0.png for multi-page EPS

print(f"\n1️⃣  Checking for converted PNG...")
if os.path.exists(sheet_png):
    print(f"   ✓ Using existing {sheet_png}")
    size_mb = os.path.getsize(sheet_png) / 1024 / 1024
    print(f"   File size: {size_mb:.1f}MB")
else:
    print(f"   Converting {eps_file} to PNG...")
    if run_cmd(f'convert -density 300 "{eps_file}" -quality 100 "sheet.png"'):
        print(f"   ✓ Created {sheet_png}")
        size_mb = os.path.getsize(sheet_png) / 1024 / 1024
        print(f"   File size: {size_mb:.1f}MB")
    else:
        print("   ❌ Conversion failed")
        sys.exit(1)

# Step 2: Get image dimensions
print("\n2️⃣  Analyzing sheet layout...")
from PIL import Image

# Disable decompression bomb protection for large EPS conversions
Image.MAX_IMAGE_PIXELS = None

try:
    img = Image.open(sheet_png)
    width, height = img.size
    print(f"   Dimensions: {width}x{height}px")

    # Approximate gun positions on the sheet (will need adjustment)
    # Format: (name, x, y, w, h) - coordinates as percentages
    guns = [
        # Row 1 - Rifles
        ("ar15", 5, 5, 18, 8),
        ("ak47", 25, 5, 18, 8),
        ("bolt-action", 45, 5, 18, 8),
        ("milsurp", 65, 5, 18, 8),

        # Row 2 - More rifles
        ("ar10", 5, 18, 18, 8),
        ("rifle-generic", 25, 18, 18, 8),

        # Pistols column (right side)
        ("1911", 85, 5, 12, 10),
        ("glock", 85, 18, 12, 10),
        ("sig", 85, 31, 12, 10),
        ("beretta", 85, 44, 12, 10),
        ("revolver", 85, 57, 12, 10),

        # Shotguns
        ("pump-shotgun", 5, 35, 18, 8),
        ("auto-shotgun", 25, 35, 18, 8),
        ("shotgun-generic", 45, 35, 18, 8),
    ]

    print(f"   Found {len(guns)} guns to extract")

    # Step 3: Extract each gun
    print("\n3️⃣  Extracting individual guns...")
    extracted = 0

    for name, x_pct, y_pct, w_pct, h_pct in guns:
        # Convert percentages to pixels
        x = int(width * x_pct / 100)
        y = int(height * y_pct / 100)
        w = int(width * w_pct / 100)
        h = int(height * h_pct / 100)

        # Crop region
        gun_img = img.crop((x, y, x + w, y + h))

        # Save as PNG
        output_file = f"{name}.png"
        gun_img.save(output_file, "PNG")

        file_size = os.path.getsize(output_file) / 1024
        print(f"   ✓ {output_file:25s} ({file_size:.0f}KB)")
        extracted += 1

    print(f"\n✅ Successfully extracted {extracted} gun silhouettes!")
    print(f"\nRefresh your browser to see them in the app!")

except ImportError:
    print("   ❌ PIL/Pillow not installed")
    print("   Installing: pip3 install Pillow")
    subprocess.run(["pip3", "install", "Pillow"], check=True)
    print("   ✓ Installed! Re-run this script.")
except Exception as e:
    print(f"   ❌ Error: {e}")
    sys.exit(1)
