"""Extract the site's OFL Instrument Serif outlines for the physical car-scene sentence.

Requires FontTools only when regenerating; the website loads the checked-in JSON.
"""
import json
import hashlib
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

ROOT = Path(__file__).resolve().parents[1]
TEXT = 'Smart Chen is a (game) designer, filmmaker, and car enthusiast.'

def extract(filename):
    font = TTFont(ROOT / 'dist/assets/fonts' / filename)
    scale = font['head'].unitsPerEm
    glyphs = font.getGlyphSet()
    cmap = font.getBestCmap()
    result = {}
    class Outline(BasePen):
        def __init__(self):
            super().__init__(glyphs)
            self.contours = []
        def point(self, p): return [round(p[0]/scale, 6), round(p[1]/scale, 6)]
        def _moveTo(self, p): self.contours.append([['M', *self.point(p)]])
        def _lineTo(self, p): self.contours[-1].append(['L', *self.point(p)])
        def _qCurveToOne(self, a, b): self.contours[-1].append(['Q', *self.point(a), *self.point(b)])
        def _curveToOne(self, a, b, c): self.contours[-1].append(['C', *self.point(a), *self.point(b), *self.point(c)])
        def _closePath(self): self.contours[-1].append(['Z'])
        def _endPath(self): self._closePath()
    for char in sorted(set(TEXT)):
        name = cmap[ord(char)]
        pen = Outline()
        glyphs[name].draw(pen)
        result[char] = {'advance': round(font['hmtx'][name][0]/scale, 6), 'contours': pen.contours}
    return result

source_hashes = {name: hashlib.sha256((ROOT / 'dist/assets/fonts' / name).read_bytes()).hexdigest()
                 for name in ['instrument-serif-regular.ttf', 'instrument-serif-italic.ttf']}
payload = {'text': TEXT, 'source': 'Instrument Serif, OFL — dist/assets/fonts/OFL.txt', 'sourceHashes': source_hashes,
           'regular': extract('instrument-serif-regular.ttf'), 'italic': extract('instrument-serif-italic.ttf')}
destination = ROOT / 'dist/assets/motor-sentence-glyphs.json'
destination.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
print(f'Generated {destination.name}: {destination.stat().st_size} bytes')
