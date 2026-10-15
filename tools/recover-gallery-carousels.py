"""Recover published Google Sites CSS carousel images in document order.

Only active projects with unresolved image references are processed. A changed
source image count stops the import rather than attaching images to wrong slots.
Notion uploads and targeted page edits are separate, explicit steps.
"""
import hashlib
import json
import re
import urllib.request
from datetime import date
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / 'tools/gallery-source/bundles'
OUT = ROOT / 'dist/gallery/assets/works'


class PublishedImages(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        url = attrs.get('src', '') if tag == 'img' else ''
        if tag == 'div' and attrs.get('aria-label') == 'Carousel image':
            match = re.search(r'background-image:\s*url\(([^)]+)\)', attrs.get('style', ''))
            url = match[1] if match else ''
        if url.startswith('https://sites.google.com/sitesv-images-rt/'):
            self.images.append(url)


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def recover():
    CACHE.mkdir(parents=True, exist_ok=True)
    snapshot = read_json(ROOT / 'tools/gallery-notion/snapshot.json')
    active = {p['properties']['Slug'] for p in snapshot['pages']}
    pending = read_json(ROOT / 'tools/gallery-source/pending-media.json')
    media = read_json(ROOT / 'tools/gallery-notion/media.json')
    records = []
    for slug in sorted({p['project'] for p in pending} & active):
        source = read_json(ROOT / f'tools/gallery-source/{slug}.json')
        request = urllib.request.Request(source['url'], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(request, timeout=60) as response:
            html = response.read().decode('utf-8')
        (CACHE / f'{slug}-carousel.html').write_text(html, encoding='utf-8')
        parser = PublishedImages()
        parser.feed(html)
        previous = [i['src'] for s in source['sections'] for i in s['items'] if i['tag'] == 'IMG']
        if len(previous) != len(parser.images):
            raise ValueError(f'{slug}: photo sequence changed ({len(previous)} vs {len(parser.images)})')
        for item in [p for p in pending if p['project'] == slug]:
            old = item['source']
            assert previous[item['number'] - 1] == old
            fresh = parser.images[item['number'] - 1]
            key = hashlib.sha256(old.encode()).hexdigest()[:20]
            original = OUT / f'{key}.jpg'
            display = OUT / f'{key}.webp'
            if not original.exists():
                with urllib.request.urlopen(fresh, timeout=60) as response:
                    data = response.read()
                # Decode before accepting the response as a photograph.
                import io
                with Image.open(io.BytesIO(data)) as check:
                    check.verify()
                original.write_bytes(data)
            with Image.open(original) as raw:
                image = ImageOps.exif_transpose(raw).convert('RGB')
                width, height = image.size
                image.thumbnail((1600, 2000), Image.Resampling.LANCZOS)
                image.save(display, quality=92, method=6)
                dw, dh = image.size
            record = {'original': f'assets/works/{original.name}', 'display': f'assets/works/{display.name}',
                      'width': width, 'height': height, 'displayWidth': dw, 'displayHeight': dh}
            media[old] = record
            records.append({'project': slug, 'number': item['number'], 'source': old,
                            'retrievedFrom': fresh, 'sourcePage': source['url'],
                            'retrievedDate': str(date.today()), 'sha256': hashlib.sha256(original.read_bytes()).hexdigest(),
                            **record})
            print(slug, item['number'], f'{width}x{height}', flush=True)
    # Write only after every active missing photograph has been recovered.
    (CACHE / 'recovered-carousels.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'tools/gallery-notion/media.json').write_text(json.dumps(media, indent=2) + '\n', encoding='utf-8')
    print(f'Recovered {len(records)} carousel photographs. Native Notion uploads still required.')


if __name__ == '__main__':
    recover()
