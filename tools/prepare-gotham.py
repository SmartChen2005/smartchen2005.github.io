"""Build web fonts from the user's Gotham archive; requires fonttools[woff]."""
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
from zipfile import ZipFile

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/font-sources/gotham.zip'
DEST = ROOT / 'dist/assets/fonts/gotham'
# The archive mixes versions and uses legacy weight numbers. Use explicit CSS
# weights and omit three conflicting aliases (documented in README.md).
FACES = [
    ('Thin', 100, 'normal'), ('Thin Italic', 100, 'italic'),
    ('Extra Light', 200, 'normal'), ('Extra Light Italic', 200, 'italic'),
    ('Light', 300, 'normal'), ('Book', 400, 'normal'),
    ('Medium', 500, 'normal'), ('Bold', 700, 'normal'),
    ('ItalicBold', 700, 'italic'), ('Black', 900, 'normal'),
    ('Ultra', 950, 'normal'),
]


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    manifest = {'source': str(SOURCE.relative_to(ROOT)),
                'sourceSha256': sha256(SOURCE.read_bytes()).hexdigest(), 'faces': []}
    rules = ['/* User-supplied Gotham fonts. See README.md for source details. */']
    with ZipFile(SOURCE) as archive:
        for label, weight, style in FACES:
            source = f'Gotham/Gotham {label}/Gotham {label}.otf'
            original = archive.read(source)
            font = TTFont(BytesIO(original), recalcTimestamp=False)
            filename = f'gotham-{label.lower().replace(" ", "-")}.woff2'
            font.flavor = 'woff2'
            font.save(DEST / filename)
            # Decode the generated font and compare every glyph's advance width
            # and character map with the source, checking conversion integrity.
            decoded = TTFont(DEST / filename)
            assert decoded.getBestCmap() == font.getBestCmap()
            assert decoded['hmtx'].metrics == font['hmtx'].metrics
            manifest['faces'].append({'source': source, 'sourceSha256': sha256(original).hexdigest(),
                                      'file': filename, 'weight': weight, 'style': style,
                                      'postScriptName': font['name'].getDebugName(6),
                                      'sha256': sha256((DEST / filename).read_bytes()).hexdigest()})
            rules.append(f'''@font-face {{
  font-family: 'Gotham';
  src: url('./{filename}') format('woff2');
  font-weight: {weight};
  font-style: {style};
  font-display: swap;
}}''')
    (DEST / 'gotham.css').write_text('\n\n'.join(rules) + '\n', encoding='utf-8')
    (DEST / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Built and verified {len(FACES)} WOFF2 faces.')


if __name__ == '__main__':
    main()
