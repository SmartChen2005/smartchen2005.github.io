"""Generate lossless display copies while preserving all original archived files."""
from pathlib import Path
from PIL import Image

assets = Path(__file__).resolve().parents[1] / 'dist/projects/multiverse-all-star-battlefront/assets'
original_size = display_size = 0
for file in sorted(assets.glob('*.png')):
    display = file.with_suffix('.webp')
    with Image.open(file) as source:
        rgb = source.convert('RGBA' if 'A' in source.getbands() else 'RGB')
        rgb.save(display, 'WEBP', lossless=True, method=6, exact=True)
        with Image.open(display) as result:
            assert result.size == rgb.size
            assert rgb.tobytes() == result.convert(rgb.mode).tobytes(), file.name
    original_size += file.stat().st_size
    display_size += display.stat().st_size
print(f'Verified lossless display copies: {original_size:,} -> {display_size:,} bytes; original dimensions and pixels preserved.')
