"""Generate responsive Gallery/Stills display copies; never modify originals."""
import hashlib
import io
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
POLICY = json.loads((ROOT / 'tools/gallery-image-policy.json').read_text())
MANIFEST = ROOT / 'tools/gallery-image-renditions.json'
previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
aliases = {}
sources = set()

def register(source, display=None):
    file = (DIST / source).resolve()
    if not file.is_relative_to(DIST.resolve()) or not file.is_file():
        raise ValueError(f'Missing or invalid image source: {source}')
    sources.add(source)
    aliases[source] = source
    if display:
        aliases[display] = source

media = json.loads((ROOT / 'tools/gallery-notion/media.json').read_text(encoding='utf-8'))
for item in media.values():
    if item.get('original') and not item.get('unavailable'):
        register('gallery/' + item['original'], 'gallery/' + item['display'])
for item in json.loads((ROOT / 'tools/gallery-projects.json').read_text(encoding='utf-8')):
    register(f"gallery/assets/{item['id']}.jpg", 'gallery/' + item['cover'])
stills = DIST / 'projects/polaroid-of-yesterday/photography'
for item in json.loads((ROOT / 'tools/stills-collection.json').read_text(encoding='utf-8')):
    source = (stills / item['source']).resolve().relative_to(DIST.resolve()).as_posix()
    register(source, f"projects/polaroid-of-yesterday/photography/assets/{item['id']}.webp")
# Include retained covers/work assets that are not currently selected by the CMS.
for file in (DIST / 'gallery').rglob('*'):
    if 'optimized' in file.parts or file.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'}:
        continue
    key = file.relative_to(DIST).as_posix()
    if key not in aliases:
        register(key)

output = DIST / 'gallery/assets/optimized'
output.mkdir(parents=True, exist_ok=True)

def prepare(source):
    file = DIST / source
    data = file.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    old = previous.get('images', {}).get(source)
    if previous.get('policy') == POLICY and old and old['sha256'] == digest:
        if all((DIST / v['path']).is_file() and hashlib.sha256((DIST / v['path']).read_bytes()).hexdigest() == v['sha256'] for v in old['variants']):
            return source, old
    with Image.open(io.BytesIO(data)) as raw:
        if getattr(raw, 'n_frames', 1) != 1:
            raise ValueError(f'Animated image requires a separate animation-preserving export: {source}')
        image = ImageOps.exif_transpose(raw)
        image = image.convert('RGBA' if image.mode == 'RGBA' or 'transparency' in image.info else 'RGB')
        profile = raw.info.get('icc_profile')
        options = {'icc_profile': profile} if profile else {}
        long_edge = min(max(image.size), POLICY['longEdge'])
        edges = sorted({min(edge, long_edge) for edge in POLICY['previewLongEdges']})
        record = {'sha256': digest, 'bytes': len(data), 'width': image.width, 'height': image.height, 'variants': []}
        for edge in edges:
            scale = edge / max(image.size)
            size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
            display = image if size == image.size else image.resize(size, Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            display.save(buffer, 'WEBP', quality=POLICY['quality'], method=POLICY['method'], **options)
            encoded = buffer.getvalue()
            encoded_hash = hashlib.sha256(encoded).hexdigest()
            target = output / f'{encoded_hash[:24]}-{size[0]}x{size[1]}.webp'
            if not target.exists() or hashlib.sha256(target.read_bytes()).hexdigest() != encoded_hash:
                target.write_bytes(encoded)
            record['variants'].append({'path': target.relative_to(DIST).as_posix(), 'width': size[0], 'height': size[1], 'bytes': len(encoded), 'sha256': encoded_hash})
        return source, record

images = {}
with ThreadPoolExecutor(max_workers=4) as pool:
    jobs = [pool.submit(prepare, source) for source in sorted(sources)]
    for job in as_completed(jobs):
        source, record = job.result()
        images[source] = record
        if len(images) % 10 == 0:
            print(f'Prepared {len(images)}/{len(sources)} original images', flush=True)

manifest = {'schemaVersion': 1, 'policy': POLICY, 'aliases': dict(sorted(aliases.items())), 'images': dict(sorted(images.items()))}
MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'originals': len(images), 'variants': sum(len(i['variants']) for i in images.values()), 'originalBytes': sum(i['bytes'] for i in images.values()), 'smallestBytes': sum(i['variants'][0]['bytes'] for i in images.values()), 'largestBytes': sum(i['variants'][-1]['bytes'] for i in images.values())}), flush=True)
