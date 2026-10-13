"""Import the observed Google Sites project content; never scrape private state.

Input is the DOM-backed JSON captured from published pages in tools/gallery-source.
All photo URLs and embedded film IDs come from those observed pages.
"""
import hashlib, json, re, shutil, urllib.request, sys
from pathlib import Path
from html.parser import HTMLParser
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/gallery-source'
OUT = ROOT / 'dist/gallery/assets/works'
OUT.mkdir(parents=True, exist_ok=True)
projects = json.loads((ROOT / 'tools/gallery-projects.json').read_text(encoding='utf-8'))

class InlineMarkdown(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.parts=[]; self.stack=[]
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs); close=''
        if tag=='br': self.parts.append('<br>')
        elif tag=='a' and attrs.get('href'):
            link=attrs['href']
            if link.startswith('https://www.google.com/url?'):
                from urllib.parse import urlparse, parse_qs
                link=parse_qs(urlparse(link).query).get('q',[link])[0]
            self.parts.append('['); close=']('+link+')'
        elif tag in ('strong','b'): self.parts.append('**'); close='**'
        elif tag in ('em','i'): self.parts.append('*'); close='*'
        self.stack.append((tag,close))
    def handle_endtag(self, tag):
        if self.stack and self.stack[-1][0]==tag: self.parts.append(self.stack.pop()[1])
    def handle_data(self, data):
        self.parts.append(re.sub(r'([\\*~`$\[\]{}|^])',r'\\\1',data))

def rich(item):
    parser=InlineMarkdown(); parser.feed(item.get('html') or item['text'])
    return ''.join(parser.parts).replace('\xa0',' ').strip()

media={}
sources={}
for project in projects:
    data=json.loads((SOURCE/(project['id']+'.json')).read_text(encoding='utf-8'))
    assert data['title']!='404', project['id']
    sources[project['id']]=data
    for asset in (data.get('bundle') or {}).get('assets',[]):
        media.setdefault(asset['url'],{})['bundle']=asset['path']
    for section in data['sections']:
        for item in section['items']:
            if item['tag']=='IMG': media.setdefault(item['src'],{})

def prepare(pair):
    url, record=pair
    if not url.startswith('https://sites.google.com/sitesv-images-rt/'):
        raise ValueError('Unexpected published photo source: '+url[:80])
    key=hashlib.sha256(url.encode()).hexdigest()[:20]
    original=OUT/(key+'.jpg'); display=OUT/(key+'.webp')
    if not original.exists():
        bundled=Path(record.get('bundle',''))
        if record.get('bundle') and bundled.is_file(): shutil.copyfile(bundled,original)
        else:
            with urllib.request.urlopen(url,timeout=45) as response:
                content=response.read()
            original.write_bytes(content)
    with Image.open(original) as source:
        image=ImageOps.exif_transpose(source).convert('RGB')
        width,height=image.size
        if not display.exists():
            image.thumbnail((1600,2000),Image.Resampling.LANCZOS)
            image.save(display,quality=92,method=6)
        with Image.open(display) as shown: dw,dh=shown.size
    return url,{'original':'assets/works/'+original.name,'display':'assets/works/'+display.name,
                'width':width,'height':height,'displayWidth':dw,'displayHeight':dh}

if '--content-only' not in sys.argv:
    with ThreadPoolExecutor(max_workers=4) as executor:
        media=dict(executor.map(prepare,media.items()))
    (SOURCE/'media.json').write_text(json.dumps(media,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

payload=[]
for index, project in enumerate(projects):
    source=sources[project['id']]
    # Correct addresses are taken from the actual project pages, including Morning Unwoken.
    project['sourceUrl']=source['url']
    paragraphs=[i['text'].replace('\xa0',' ').strip() for s in source['sections'] for i in s['items'] if i['tag']=='P']
    summary=''
    if project['id']=='trauma-induced-dissociative-amnesia':
        summary='Concept photography for Polaroid of Yesterday.'
        project['relatedProject']='Polaroid of Yesterday'
        project['contentKind']='Concept photography'
    elif project['id']=='rhythms-of-chaos': summary=paragraphs[0]
    elif project['id']=='surface-of-the-moon': summary=paragraphs[0]
    elif project['id']=='rorschachs-mask': summary='inspired by Kanye and Watchmen'
    elif project['id']=='the-common-things': summary='six frames, twenty seconds each'
    project['summary']=summary
    project.setdefault('contentKind','Film' if project['category']=='Film' else 'Photography series')
    content=[]; photo_number=0
    if project['id']=='trauma-induced-dissociative-amnesia': content.append(summary+'\n')
    for section in source['sections']:
        items=[i for i in section['items'] if i['tag']!='H1']
        # Google Sites list DOM includes each LI's child P; import it once.
        filtered=[]
        for item in items:
            if filtered and filtered[-1]['tag']=='LI' and item['tag']=='P' and item['text']==filtered[-1]['text']: continue
            filtered.append(item)
        images_only=filtered and all(i['tag']=='IMG' for i in filtered)
        section_lines=[]
        for item in filtered:
            if item['tag']=='IMG':
                photo_number+=1
                # Untitled photographs have no invented caption. The converter supplies accessible labels.
                section_lines.append('!['+re.sub(r'([\\\[\]])',r'\\\1',item.get('alt',''))+']('+item['src']+')')
            elif item['tag']=='IFRAME':
                video=item['src']; match=re.search(r'youtube\.com/embed/([\w-]+)',video)
                if match: video='https://www.youtube.com/watch?v='+match[1]
                if not match and 'player.bilibili.com' not in video: raise ValueError('Unresolved film player: '+video)
                section_lines.append('<video src="'+video+'">'+item.get('alt','')+'</video>')
            elif item['tag'] in ('H2','H3'): section_lines.append('## '+rich(item))
            elif item['tag']=='LI': section_lines.append('- '+rich(item))
            elif item['tag']=='P' and item['text'].strip(): section_lines.append(rich(item))
        if images_only and len(section_lines)>1:
            # Keep original groups and sequence; each image remains uncropped and independent.
            for start in range(0,len(section_lines),2):
                group=section_lines[start:start+2]
                if len(group)==1: content.append(group[0]+'\n'); continue
                content.append('<columns>\n'+''.join('\t<column ratio="50">\n\t\t'+line+'\n\t</column>\n' for line in group)+'</columns>\n')
        else: content.extend(line+'\n' for line in section_lines)
    project['photoCount']=photo_number
    credit=next((p for p in paragraphs if re.match(r'directed (?:and filmed )?by ',p,re.I)), 'Smart Chen')
    props={'Project':project['title'],'Type':project['category'],'Focus':json.dumps(['Photography'] if project['category']=='Photography' else ['Film Production']),
           'Link':project['sourceUrl'],'Slug':project['id'],'Published':'__YES__','Featured':'__YES__' if index==0 else '__NO__',
           'Summary':summary,'Subtitle':project.get('subtitle',''),'Credit':credit,'Cover':project['coverSourceUrl'],
           'Order':index+1,'Related project':project.get('relatedProject',''),'Content kind':project['contentKind'],'Date label':project.get('date','')}
    if project['category']=='Film': props['Year']=2025
    if project['id']=='analog-and-digital': props['Year']=2025; props['Date label']='April 6, 2025'
    payload.append({'properties':props,'cover':project['coverSourceUrl'],'content':'\n'.join(content).strip()})
    # Keep the source snapshot portable, with web provenance instead of temporary machine paths.
    if '--content-only' not in sys.argv:
        source.pop('bundle',None)
        (SOURCE/(project['id']+'.json')).write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'tools/gallery-projects.json').write_text(json.dumps(projects,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(SOURCE/'notion-import.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Prepared',len(payload),'complete projects and',len(media),'unique published photographs.')
