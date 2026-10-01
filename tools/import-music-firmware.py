from pathlib import Path
from shutil import copy2
from hashlib import sha256
import json, re

root = Path(__file__).resolve().parents[1]
route = root / 'dist/projects/world-sensing-music-station'
manifest_path = route / 'assets/sources.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
for name in ['Control.ino', 'Display.ino']:
    source = Path('C:/Users/15811/Downloads') / name
    copy2(source, route / 'files' / name)
    manifest['files'] = [entry for entry in manifest['files'] if entry['file'] != name]
    manifest['files'].append({'file': name, 'sha256': sha256(source.read_bytes()).hexdigest()})
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
source = (route / 'files/Display.ino').read_text(encoding='utf-8')
font_block = source.split('const uint8_t FONT[37][ROWS] = {', 1)[1].split('\n};', 1)[0]
font = [[int(value, 16) for value in re.findall(r'0x[0-9A-Fa-f]+', row)] for row in re.findall(r'\{([^}]+)\}', font_block)]
assert len(font) == 37 and all(len(row) == 8 for row in font)
(route / 'matrix-font.mjs').write_text('// Glyphs from Display.ino; regenerate with tools/import-music-firmware.py.\nexport const FONT = ' + json.dumps(font) + ';\n', encoding='utf-8')
print('Archived both original sketches and imported the original 8x8 font.')
