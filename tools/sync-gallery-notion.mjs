import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { NotionGalleryClient, galleryPageSnapshot } from './gallery-notion-client.mjs';
import { adaptNotionBlocks, allImages, canonicalMediaUrl, mediaFilename, mediaIdentity } from './gallery-document.mjs';
import { imageDimensions } from './gallery-image.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'tools/gallery-notion/config.json'),'utf8'));
const snapshotPath=path.join(root,'tools/gallery-notion/snapshot.json');
const mediaPath=path.join(root,'tools/gallery-notion/media.json');
const argumentsSet=new Set(process.argv.slice(2));
function imageHostAllowed(value){
 const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='sites.google.com'||u.hostname.endsWith('.amazonaws.com')||u.hostname.endsWith('.notion-static.com')||u.hostname==='www.notion.so'||u.hostname==='s3.us-west-2.amazonaws.com'||u.hostname==='images.unsplash.com');
}
async function downloadImage(url){
 let current=url;
 for(let redirects=0;redirects<5;redirects++){
  if(!imageHostAllowed(current))throw new Error('Image host is not allowed; the previous site is preserved.');
  // Never send the Notion API token to media hosts.
  const response=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(45000)});
  if(response.status>=300&&response.status<400){current=new URL(response.headers.get('location'),current).href;continue;}
  if(!response.ok||!/^image\/(jpeg|png|webp|gif|avif)/.test(response.headers.get('content-type')||''))throw new Error('A Notion image could not be downloaded; the previous site is preserved.');
  const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length>50*1024*1024)throw new Error('Image exceeds the 50 MB import limit');
  return {bytes,type:response.headers.get('content-type').split(';')[0]};
 }
 throw new Error('Too many image redirects');
}
async function synchronize(){
 if(argumentsSet.has('--offline')){const rendered=spawnSync(process.execPath,['tools/render-gallery.mjs'],{cwd:root,stdio:'inherit'});if(rendered.status!==0)throw new Error('Gallery render failed');return;}
 const client=new NotionGalleryClient({token:process.env.NOTION_TOKEN});
 const before=JSON.parse(fs.readFileSync(snapshotPath,'utf8'));
 const local=JSON.parse(fs.readFileSync(mediaPath,'utf8'));
 const rows=await client.listPages(config.dataSourceId);
 const pages=[];
 for(const row of rows){const old=before.pages.find(p=>p.id===row.id);pages.push(old?.blocks&&old.lastEditedAt===row.last_edited_time?{...galleryPageSnapshot({...row,blocks:old.blocks})}:galleryPageSnapshot(await client.readPage(row)));}
 // Download all required media before changing the content snapshot or generated pages.
 for(const page of pages){
  const images=allImages(adaptNotionBlocks(page.blocks));
  const cover=page.properties['Cover image']?.[0]||page.cover?.file?.url||page.cover?.external?.url||page.properties.Cover;
  if(cover)images.push({src:cover});
  for(const image of images){
   const key=canonicalMediaUrl(image.src),cached=local[image.src]||local[key]||local['notion-asset:'+mediaIdentity(image.src)];
   if(cached?.unavailable){local[key]=cached;continue;}
   if(cached?.display&&fs.existsSync(path.join(root,'dist/gallery',cached.display))){local[key]=cached;continue;}
   const file=await downloadImage(image.src);const extension={ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/avif':'avif'}[file.type];
   const relative='assets/works/'+crypto.createHash('sha256').update(key).digest('hex').slice(0,20)+'.'+extension;
   const target=path.join(root,'dist/gallery',relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.bytes);
   const dimensions=imageDimensions(file.bytes);local[key]={display:relative,original:relative,displayWidth:dimensions.width,displayHeight:dimensions.height};
  }
  // Signed URLs remain in memory. Stable canonical URLs and local files are exported.
  for(const image of images)image.src=canonicalMediaUrl(image.src);
  const clean=(blocks)=>{for(const b of blocks){const body=b[b.type];if(body?.file?.url&&b.type==='image')body.file.url=canonicalMediaUrl(body.file.url);if(body?.external?.url&&b.type==='image')body.external.url=canonicalMediaUrl(body.external.url);if(body?.children)clean(body.children);}};clean(page.blocks);
  if(page.properties['Cover image'])page.properties['Cover image']=page.properties['Cover image'].map(canonicalMediaUrl);
  if(page.cover?.file?.url)page.cover.file.url=canonicalMediaUrl(page.cover.file.url);
 }
 const candidate={schemaVersion:1,databaseId:config.databaseId,dataSourceId:config.dataSourceId,pages};
 // Validate every document before replacing the checked-in snapshot.
 for(const page of pages){const p=page.properties;if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.Slug||''))throw new Error('Published project needs a valid Slug');adaptNotionBlocks(page.blocks);}
 fs.writeFileSync(snapshotPath+'.tmp',JSON.stringify(candidate,null,2)+'\n');
 fs.writeFileSync(mediaPath+'.tmp',JSON.stringify(local,null,2)+'\n');
 const oldSnapshot=fs.readFileSync(snapshotPath),oldMedia=fs.readFileSync(mediaPath);
 fs.renameSync(snapshotPath+'.tmp',snapshotPath);fs.renameSync(mediaPath+'.tmp',mediaPath);
 const rendered=spawnSync(process.execPath,['tools/render-gallery.mjs'],{cwd:root,stdio:'inherit'});
 if(rendered.status!==0){fs.writeFileSync(snapshotPath,oldSnapshot);fs.writeFileSync(mediaPath,oldMedia);throw new Error('Gallery export was rejected; its previous content snapshot is preserved.');}
 console.log(`Synced ${pages.length} published Gallery projects from Notion.`);
}
if(argumentsSet.has('--watch')&&!argumentsSet.has('--offline')&&!process.env.NOTION_TOKEN){console.error('Set NOTION_TOKEN before starting the Gallery watcher.');process.exit(1);}
do {
 try {await synchronize();}catch(error){console.error(error.message);if(!argumentsSet.has('--watch'))process.exitCode=1;}
 if(!argumentsSet.has('--watch')||argumentsSet.has('--offline'))break;
 await delay(300000);
}while(true);
