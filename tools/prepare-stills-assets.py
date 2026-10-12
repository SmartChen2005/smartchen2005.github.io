"""Prepare local, uncropped exhibition images; retain every original untouched."""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
ROUTE = ROOT / 'dist/projects/polaroid-of-yesterday/photography'
collection = json.loads((ROOT / 'tools/stills-collection.json').read_text(encoding='utf-8'))
(ROUTE / 'assets').mkdir(exist_ok=True)
for photo in collection:
    with Image.open((ROUTE / photo['source']).resolve()) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        if image.size != (photo['width'], photo['height']):
            raise ValueError(f"Incorrect dimensions for {photo['id']}: {image.size}")
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(ROUTE / 'assets' / (photo['id'] + '.webp'), quality=88, method=6)
print(f'Prepared {len(collection)} aspect-preserving exhibition images.')
