"""Build uncropped film previews and a lightly encoded full-resolution portrait.

Requires Pillow with WebP support. Run from any directory with Python 3.
"""
import hashlib
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
PHOTOS = [
    'c6495aef5fe2fd2016e174644e7e9637',
    '7791361ef9a438ead7e13223550a212b',
    '44e0cac7f390dc59a1bdfd25e5930a85',
    'f85d2017537b65c254e52f035d2aa3ee',
]
SOURCES = [(f'photography-preview/{name}.jpg', (480, 960, 1920)) for name in PHOTOS]
manifest = {'quality': 90, 'resampling': 'Lanczos', 'images': []}

for source, widths in SOURCES:
    original_path = DIST / source
    with Image.open(original_path) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        # Preserve the embedded color profile; strip camera/GPS metadata.
        profile = original.info.get('icc_profile')
        record = {
            'source': source,
            'sha256': hashlib.sha256(original_path.read_bytes()).hexdigest(),
            'width': image.width, 'height': image.height,
            'originalBytes': original_path.stat().st_size,
            'variants': [],
        }
        for width in widths:
            height = round(image.height * width / image.width)
            preview = image.resize((width, height), Image.Resampling.LANCZOS)
            target = original_path.with_name(f'{original_path.stem}-{width}.webp')
            options = {'icc_profile': profile} if profile else {}
            preview.save(target, 'WEBP', quality=90, method=6, **options)
            record['variants'].append({
                'path': target.relative_to(DIST).as_posix(),
                'width': width, 'height': height, 'bytes': target.stat().st_size,
                'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            })
        manifest['images'].append(record)

# The important portrait retains the full source dimensions; do not resize or crop.
portrait_source = DIST / 'assets/selfportrait.jpg'
portrait_target = DIST / 'assets/selfportrait-light.webp'
with Image.open(portrait_source) as original:
    portrait = ImageOps.exif_transpose(original).convert('RGB')
    profile = original.info.get('icc_profile')
    options = {'icc_profile': profile} if profile else {}
    portrait.save(portrait_target, 'WEBP', quality=95, method=6, **options)
    manifest['portrait'] = {
        'source': 'assets/selfportrait.jpg',
        'sourceSha256': hashlib.sha256(portrait_source.read_bytes()).hexdigest(),
        'originalBytes': portrait_source.stat().st_size,
        'path': 'assets/selfportrait-light.webp',
        'width': portrait.width, 'height': portrait.height, 'quality': 95,
        'bytes': portrait_target.stat().st_size,
        'sha256': hashlib.sha256(portrait_target.read_bytes()).hexdigest(),
    }

(ROOT / 'tools/home-assets.json').write_text(
    json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
for image in manifest['images']:
    print(f"{image['source']}: {image['originalBytes']:,} bytes -> " +
          ', '.join(f"{v['width']}w: {v['bytes']:,}" for v in image['variants']))
print(f"Full-resolution portrait: {manifest['portrait']['originalBytes']:,} -> "
      f"{manifest['portrait']['bytes']:,} bytes, quality 95, no resizing")
