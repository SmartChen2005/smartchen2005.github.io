"""Render every original PDF page and retain the user-selected hero photograph."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
import tempfile
from PIL import Image, ImageOps
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
page = root / 'dist/projects/world-sensing-music-station'
parser = argparse.ArgumentParser()
parser.add_argument('--poppler', required=True, type=Path)
parser.add_argument('--photo', type=Path)
args = parser.parse_args()
assets = page / 'assets'
manifest = json.loads((assets / 'sources.json').read_text(encoding='utf-8'))
if args.photo:
    original = assets / 'prototype-in-hand.jpg'
    original.write_bytes(args.photo.read_bytes())
    image = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
    for width in [900, 1800]:
        rendition = image.copy()
        rendition.thumbnail((width, width * 2))
        rendition.save(assets / f'prototype-in-hand-{width}.webp', quality=88)
    manifest['photos'] = [p for p in manifest['photos'] if p['file'] != original.name]
    manifest['photos'].append({'file': original.name, 'displaySize': list(image.size),
        'sha256': hashlib.sha256(original.read_bytes()).hexdigest(),
        'origin': 'User attachment, imported 2026-10-20; original EXIF retained.'})

pdf = page / 'files/Final Project.pdf'
pages = []
scratch = root / 'tools/music-qa'
scratch.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=scratch) as temporary:
    prefix = Path(temporary) / 'page'
    subprocess.run([str(args.poppler), '-scale-to', '1800', '-png', str(pdf), str(prefix)], check=True)
    for number in range(1, len(PdfReader(pdf).pages) + 1):
        rendered = next(p for p in Path(temporary).glob('page-*.png') if int(p.stem.split('-')[-1]) == number)
        image = Image.open(rendered).convert('RGB')
        filename = f'process-page-{number:02}.webp'
        image.save(assets / filename, quality=90)
        size = list(image.size)
        image.thumbnail((650, 900))
        image.save(assets / f'process-thumb-{number:02}.webp', quality=85)
        pages.append({'pdf': pdf.name, 'pdfPage': number, 'file': filename, 'size': size})
manifest['processPages'] = pages
(assets / 'sources.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(f'Rendered all {len(pages)} complete PDF pages; original source preserved.')
