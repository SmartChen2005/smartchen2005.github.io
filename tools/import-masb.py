"""Archive public Google Sites copy and embedded document without executing their markup."""
from html.parser import HTMLParser
from pathlib import Path
import json, re, hashlib

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/masb-source'
ASSETS = ROOT / 'dist/projects/multiverse-all-star-battlefront/assets'

class Element:
    def __init__(self, tag='', attrs=(), parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs), parent, []
    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)
    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c, Element): yield from c.walk()

class Parser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = self.current = Element()
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        e = Element(tag, attrs, self.current)
        self.current.children.append(e)
        if tag not in {'img','br','meta','link','input','hr','source','wbr'}: self.current = e
    def handle_endtag(self, tag):
        p = self.current
        while p.parent:
            if p.tag == tag:
                self.current = p.parent
                return
            p = p.parent
    def handle_data(self, data): self.current.children.append(data)

def clean(text):
    return re.sub(r'\s+', ' ', text.replace('\ufffd', ' ')).strip()

site = Parser((SOURCE/'google-sites.html.txt').read_text(encoding='utf-8')).root
doc = Parser((SOURCE/'technical-document.html.txt').read_text(encoding='utf-8')).root
main = next(e for e in site.walk() if e.attrs.get('role') == 'main')
content = next(e for e in doc.walk() if 'doc-content' in e.attrs.get('class',''))
intro = [clean(e.text()) for e in main.walk() if e.tag == 'p' and clean(e.text())]
blocks = []
for e in content.walk():
    if e.tag in {'p','li'}:
        text = clean(e.text())
        if text: blocks.append({'kind':e.tag, 'text':text})
    if e.tag == 'img': blocks.append({'kind':'image', 'url':e.attrs['src']})
media = []
for e in site.walk():
    match = re.search(r'background-image:\s*url\((.*?)\)',e.attrs.get('style',''))
    if match:
        media.append({'kind':'battle','url':match[1].strip('"')})
    if e.tag == 'img' and 'sitesv-images' in e.attrs.get('src',''):
        media.append({'kind':'character','url':e.attrs['src']})
data = {'source':'https://sites.google.com/view/vegshark/game/multiverse-all-star-battlefront',
        'document':'https://docs.google.com/document/d/e/2PACX-1vSvdWc_fM8-JNhXYQImOG3Us_UvJHnobgDF9NHJ6WXhd2HMml4cmfRdVkVicPolj4_bionlM4_6waLG/pub',
        'retrieved':'2026-10-05', 'intro':intro, 'blocks':blocks, 'media':media}
ASSETS.mkdir(parents=True, exist_ok=True)
items = media + [b for b in blocks if b['kind']=='image']
for index, item in enumerate(items):
    item['file'] = f"{item['kind']}-{index+1:02}.{'jpg' if item['kind']=='battle' else 'png'}"
    target = ASSETS/item['file']
    if target.exists():
        from PIL import Image
        with Image.open(target) as image: item['width'],item['height'] = image.size
        item['sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
(SOURCE/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'Imported {len(intro)} introduction blocks, {len(blocks)} document blocks, {len(media)} artwork images.')
