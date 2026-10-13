"""Preserve the browser-exported photographs and map them to their Notion sources."""
import hashlib, json, shutil
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'tools/gallery-source'
OUT=ROOT/'dist/gallery/assets/works'
OUT.mkdir(parents=True,exist_ok=True)
projects=json.loads((ROOT/'tools/gallery-projects.json').read_text(encoding='utf-8'))
media={}; pending=[]
for project in projects:
    source=json.loads((SOURCE/(project['id']+'.json')).read_text(encoding='utf-8'))
    urls=[i['src'] for s in source['sections'] for i in s['items'] if i['tag']=='IMG']
    files={a['url']:a['path'] for a in (source.get('bundle') or {}).get('assets',[])}
    refreshed=SOURCE/'bundles'/(project['id']+'.json')
    if refreshed.exists():
        fresh=json.loads(refreshed.read_text(encoding='utf-8'))
        assert len(urls)==len(fresh['images']),project['id']+' photo sequence changed'
        fresh_files={a['url']:a['path'] for a in fresh['bundle']['assets']}
        for old,new in zip(urls,fresh['images']):
            if new in fresh_files:files[old]=fresh_files[new]
    for number,url in enumerate(urls,1):
        key=hashlib.sha256(url.encode()).hexdigest()[:20]
        original=OUT/(key+'.jpg');display=OUT/(key+'.webp')
        if not original.exists() and url in files:shutil.copyfile(files[url],original)
        if not original.exists():
            media[url]={'unavailable':True,'sourcePage':project['sourceUrl']}
            pending.append({'project':project['id'],'number':number,'source':url,'reason':'Published carousel uses a CSS background; original file export unavailable.'})
            continue
        with Image.open(original) as raw:
            image=ImageOps.exif_transpose(raw).convert('RGB');w,h=image.size
            if not display.exists():
                image.thumbnail((1600,2000),Image.Resampling.LANCZOS)
                image.save(display,quality=92,method=6)
        with Image.open(display) as shown:dw,dh=shown.size
        media[url]={'original':'assets/works/'+original.name,'display':'assets/works/'+display.name,'width':w,'height':h,'displayWidth':dw,'displayHeight':dh}
    cover=ROOT/'dist/gallery'/project['cover']
    media[project['coverSourceUrl']]={'display':project['cover'],'original':'assets/'+project['id']+'.jpg','displayWidth':project['width'],'displayHeight':project['height']}
(ROOT/'tools/gallery-notion/media.json').write_text(json.dumps(media,indent=2)+'\n',encoding='utf-8')
(SOURCE/'pending-media.json').write_text(json.dumps(pending,indent=2)+'\n',encoding='utf-8')
print('Cached',sum(not m.get('unavailable') for u,m in media.items())-len(projects),'project photographs;',len(pending),'carousel originals need source files.')
