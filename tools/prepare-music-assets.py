from pathlib import Path
from shutil import copy2
from PIL import Image, ImageOps
from pypdf import PdfReader
import json
from hashlib import sha256

root = Path(__file__).resolve().parents[1]
dest = root / 'dist/projects/world-sensing-music-station/assets'
dest.mkdir(parents=True, exist_ok=True)
downloads = dest.parent / 'files'
downloads.mkdir(exist_ok=True)
for name in ['World Sensing Music Station Design Document.docx', 'Final Project.pdf', 'Final Project.docx']:
    copy2(Path('C:/Users/15811/Downloads') / name, downloads / name)
manifest = {'origin': 'User-supplied files in Downloads; imported 2026-10-01', 'files': [], 'photos': [], 'sketches': []}
for path in downloads.iterdir():
    manifest['files'].append({'file': path.name, 'sha256': sha256(path.read_bytes()).hexdigest()})
for name in ['IMG_7460','IMG_7466','IMG_7464','IMG_7469','IMG_7467']:
    source = Path('C:/Users/15811/Downloads/Untitled_Message') / (name + '.jpeg')
    copy2(source, dest / source.name)
    image = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    dimensions = image.size
    for width in [900,1800]:
        output = image.copy()
        output.thumbnail((width,width*2))
        output.save(dest / f'{name}-{width}.webp', quality=85)
    manifest['photos'].append({'file': source.name, 'displaySize': dimensions, 'sha256': sha256(source.read_bytes()).hexdigest()})
reader = PdfReader(downloads / 'Final Project.pdf')
for page in [2,3,4,5,9,10,11]:
    source = reader.pages[page-1].images[0].image.convert('RGB')
    source.thumbnail((1300,1800))
    source.save(dest / f'sketch-page-{page}.webp', quality=88)
    manifest['sketches'].append({'pdfPage': page, 'file': f'sketch-page-{page}.webp', 'size': source.size})
(dest / 'sources.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps(manifest))
