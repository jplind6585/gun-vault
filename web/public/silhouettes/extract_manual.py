#!/usr/bin/env python3
"""
Manual extraction with precise coordinates from the sheet
"""
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

sheet = Image.open('sheet-0.png')
width, height = sheet.size
print(f"Sheet: {width}x{height}px")

# Manually identified coordinates (x, y, width, height in pixels)
# Based on visual inspection of sheet-preview.jpg
# Scale factor: 24167/2000 = 12.08
guns = [
    # Rifles - Column 1
    ("ar15", 80, 550, 3500, 900),           # AR-15 style rifle, row 3
    ("ak47", 80, 1600, 3500, 900),          # AK-47 style rifle, row 5
    ("bolt-action", 80, 2600, 3500, 900),   # Bolt action with scope, row 8
    
    # Rifles - Column 2  
    ("ar10", 3700, 550, 3500, 900),         # AR-10 style, column 2 row 3
    ("milsurp", 3700, 3600, 3500, 900),     # Military surplus style
    
    # Tactical - Column 3
    ("rifle-generic", 7300, 1000, 3500, 900),
    
    # Shotguns - Column 4
    ("pump-shotgun", 10900, 2000, 3500, 900),
    ("auto-shotgun", 10900, 3500, 3500, 900),
    ("shotgun-generic", 10900, 900, 3500, 900),
    
    # Pistols - Column 5 (stacked vertically)
    ("glock", 14500, 80, 2200, 1100),      # Top pistol
    ("1911", 14500, 1300, 2200, 1100),     # Second pistol
    ("sig", 14500, 2500, 2200, 1100),      # Third pistol
    ("beretta", 14500, 3700, 2200, 1100),  # Fourth pistol
    
    # More pistols - Column 6
    ("pistol-generic", 16900, 1300, 2200, 1100),
    ("revolver", 16900, 5200, 2200, 1100),
]

print(f"\nExtracting {len(guns)} guns...\n")

for name, x, y, w, h in guns:
    try:
        gun_img = sheet.crop((x, y, x + w, y + h))
        gun_img.save(f"{name}.png", "PNG")
        size_kb = len(gun_img.tobytes()) / 1024
        print(f"✓ {name:25s} ({x},{y}) {w}x{h}")
    except Exception as e:
        print(f"✗ {name:25s} Error: {e}")

print(f"\n✅ Done! Refresh browser to see updated silhouettes.")
