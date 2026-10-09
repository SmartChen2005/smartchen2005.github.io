"""Prepare local material maps; preserve the original generated PNGs."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = root / 'tools/404-source/materials'
destination = root / 'dist/assets/maintenance'
destination.mkdir(parents=True, exist_ok=True)
for name in ['ceramic-albedo', 'yellow-plastic']:
    image = Image.open(source / f'{name}.png').convert('RGB')
    target = destination / f'{name}.webp'
    image.save(target, 'WEBP', quality=92, method=6)
    print(f'{target.name}: {image.width}×{image.height}, {target.stat().st_size:,} bytes')
