"""Prepare uncropped local covers bundled from the user's previous portfolio."""
import json, sys, shutil
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
root = Path(__file__).resolve().parents[1]
projects = json.loads((root / 'tools/gallery-projects.json').read_text(encoding='utf-8'))
assets = {}
for folder in sys.argv[1:]:
    data = json.loads((Path(folder) / 'manifest.json').read_text(encoding='utf-8'))
    for file in Path(folder).iterdir():
        if file.name != 'manifest.json':
            assets[file.name] = file
out = root / 'dist/gallery/assets'
out.mkdir(parents=True, exist_ok=True)
qa = root / 'tools/stills-qa'
qa.mkdir(exist_ok=True)
sheet = Image.new('RGB', (1000, 4 * 300), 'white')
draw = ImageDraw.Draw(sheet)
for i, p in enumerate(projects):
    original = assets[p['assetId']]
    original_target = out / (p['id'] + '.jpg')
    shutil.copyfile(original, original_target)
    with Image.open(original) as source:
        image = ImageOps.exif_transpose(source).convert('RGB')
        p['width'], p['height'] = image.size
        image.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
        image.save(out / (p['id'] + '.webp'), quality=94, method=6)
        p['cover'] = 'assets/' + p['id'] + '.webp'
        thumb = image.copy()
        thumb.thumbnail((235, 255), Image.Resampling.LANCZOS)
        x, y = (i % 4) * 250, (i // 4) * 300
        sheet.paste(thumb, (x, y))
        draw.text((x, y + 263), p['id'][:32], fill='black')
    manifest = json.loads((original.parent / 'manifest.json').read_text(encoding='utf-8'))
    entries = manifest.get('assets', [])
    if isinstance(entries, list):
        p['coverSourceUrl'] = next((a.get('url') for a in entries if a.get('id') == p['assetId']), '')
    print(p['id'], p['width'], p['height'])
(root / 'tools/gallery-projects.json').write_text(json.dumps(projects, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
sheet.save(qa / 'gallery-imported-covers.jpg')
