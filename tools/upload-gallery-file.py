"""Send the one multipart POST authorized by Notion's create_file_upload tool.

The input plan arrives through stdin and is never saved. Never log credentials.
"""
import json, sys, urllib.request, time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

if sys.argv[1]!='--stdin': raise ValueError('Upload credentials must arrive in memory through stdin.')
print('Ready for upload batch.',flush=True)
if sys.platform=='win32' and sys.stdin.isatty():
    import msvcrt
    characters=[]
    while True:
        character=msvcrt.getwch()  # Console input without echo.
        if character in ('\r','\n'): break
        characters.append(character)
    plan=json.loads(''.join(characters))
else: plan=json.loads(sys.stdin.readline())
def send(item):
    upload=item['upload'];data=Path(item['path']).read_bytes()
    target=urlparse(upload['upload_url'])
    if target.scheme!='https' or target.hostname!='api.notion.com' or not target.path.startswith('/v1/mcp/file_uploads/') or upload.get('upload_method')!='POST':
        raise ValueError('Unexpected Notion upload destination')
    assert len(data)<=20*1024*1024,'Notion single-part upload limit'
    boundary='gallery-notion-file-boundary'
    body=('--'+boundary+'\r\nContent-Disposition: form-data; name="'+upload['upload_form_field']+'"; filename="'+upload['filename']+'"\r\nContent-Type: '+upload['content_type']+'\r\n\r\n').encode()+data+('\r\n--'+boundary+'--\r\n').encode()
    headers={**upload['upload_headers'],'Content-Type':'multipart/form-data; boundary='+boundary}
    request=urllib.request.Request(upload['upload_url'],data=body,headers=headers,method='POST')
    with urllib.request.urlopen(request,timeout=60) as response:result=json.loads(response.read())
    return {'source':item['source'],'filename':upload['filename'],'fileUploadId':upload['file_upload_id'],'result':result}
results=[]
for item in plan:
    try: results.append(send(item))
    except Exception as error:
        results.append({'source':item['source'],'filename':item['upload']['filename'],'fileUploadId':item['upload']['file_upload_id'],'error':type(error).__name__,'status':getattr(error,'code',None)})
    # Retain each confirmed upload if the machine sleeps or a later transfer fails.
    Path(sys.argv[2]).write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    time.sleep(.4)
print('Uploaded',sum('error' not in r for r in results),'of',len(results),'photographs to Notion.')
