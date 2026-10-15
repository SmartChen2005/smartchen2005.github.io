import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseNotionMarkdown, adaptNotionBlocks, renderDocument, allImages, canonicalMediaUrl, mediaIdentity, publicationNodes, withImageCaptions } from './gallery-document.mjs';
import { NotionGalleryClient, galleryPageSnapshot } from './gallery-notion-client.mjs';
import { imageDimensions } from './gallery-image.mjs';
import { practiceSections, renderPractice } from './gallery-practice.mjs';
import { withReadingLanguages } from './gallery-languages.mjs';

const document=parseNotionMarkdown('An **editorial** paragraph.<br>Second line.\n<columns>\n\t<column ratio="65">\n\t\t![A portrait](https://images.unsplash.com/portrait.jpg)\n\t</column>\n\t<column ratio="35">\n\t\t![A landscape](https://images.unsplash.com/landscape.jpg)\n\t</column>\n</columns>\n<video src="https://www.youtube.com/watch?v=oOozEVsR1Ps">Film</video>');
assert.equal(allImages(document).length,2);
const html=renderDocument(document,{title:'Test series',resolveMedia:()=>({display:'assets/test.webp',original:'assets/test.jpg',displayWidth:800,displayHeight:1200})});
assert.match(html,/<strong>editorial<\/strong>/);assert.match(html,/65fr 35fr/);assert.match(html,/width="800" height="1200"/);assert.match(html,/youtube-nocookie.com/);
assert(!html.includes('autoplay=1'));
const player=html.match(/<iframe[^>]+>/)[0];
assert.match(player,/loading="eager"/,'Film players initialize without requiring a scroll to trigger lazy loading');
assert.match(player,/referrerpolicy="strict-origin-when-cross-origin"/,'YouTube receives the embedding origin');
assert.match(html,/href="https:\/\/www.youtube.com\/watch\?v=oOozEVsR1Ps"/,'The direct viewing fallback remains available');
assert.throws(()=>parseNotionMarkdown('<columns>\n<column ratio="50">\nMissing end'),/Unclosed/);
assert.throws(()=>adaptNotionBlocks([{id:'unsupported',type:'unsupported'}]),/Unsupported/);
const malicious=renderDocument([{type:'paragraph',text:'**<img src=x onerror=alert(1)>** [Unsafe](javascript:alert)' }],{title:'Safe'});
assert(!malicious.includes('<img'));assert(!malicious.includes('href="javascript:'));assert(malicious.includes('&lt;img'));
const native='notion-file-block://aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb?name=image.jpg';
assert.equal(mediaIdentity(native),'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
const original='https://prod-files-secure.s3.us-west-2.amazonaws.com/space/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/image.jpg?X-Amz-Signature=temporary';
assert.equal(mediaIdentity(original),mediaIdentity(native));
assert(!canonicalMediaUrl(original).includes('Signature'));
assert.notEqual(mediaIdentity(original),mediaIdentity(original.replaceAll('bbbbbbbb','cccccccc')),'Replacing an image with the same filename must use its new asset identity');

const requests=[];let throttled=true;
const reply=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers});
const client=new NotionGalleryClient({token:'test-only',sleep:async()=>{},fetchImpl:async(url,options)=>{
 requests.push({url,options});
 if(throttled){throttled=false;return reply({},429,{'retry-after':'1'});}
 if(url.includes('/query')){const cursor=JSON.parse(options.body).start_cursor;return reply(cursor?{results:[{id:'second',object:'page'}],has_more:false}:{results:[{id:'first',object:'page'}],has_more:true,next_cursor:'next'});}
 if(url.includes('/blocks/root/children'))return reply({results:[{id:'column',type:'column_list',has_children:true,column_list:{}}],has_more:false});
 if(url.includes('/blocks/column/children'))return reply({results:[{id:'nested',type:'paragraph',paragraph:{rich_text:[{plain_text:'Nested text'}]}}],has_more:false});
 throw new Error('Unexpected request');
}});
assert.equal((await client.listPages('e7cabc37-a86f-831f-b28f-8728d395d577')).length,2);
const blocks=await client.children('root');assert.equal(blocks[0].column_list.children[0].paragraph.rich_text[0].plain_text,'Nested text');
assert(requests.every(r=>r.url.startsWith('https://api.notion.com/v1/')));
const filter=JSON.parse(requests.find(r=>r.options.body)?.options.body).filter;assert(filter.and.some(f=>f.property==='Published'));
const incomplete=new NotionGalleryClient({token:'test-only',fetchImpl:async()=>reply({request_status:{type:'incomplete'},results:[]})});
await assert.rejects(()=>incomplete.listPages('e7cabc37-a86f-831f-b28f-8728d395d577'),/incomplete/);
const props={Project:{type:'title',title:[{plain_text:'A project'}]},Published:{type:'checkbox',checkbox:true},PrivateNotes:{type:'rich_text',rich_text:[{plain_text:'Do not export'}]}};
assert(!('PrivateNotes' in galleryPageSnapshot({id:'test',properties:props}).properties));

const snapshot=JSON.parse(fs.readFileSync(new URL('gallery-notion/snapshot.json',import.meta.url),'utf8'));
assert.equal(new Set(snapshot.pages.map(p=>p.id)).size,snapshot.pages.length,'Each current CMS project appears once');
const sourceCounts=snapshot.pages.map(page=>allImages(page.blocks?adaptNotionBlocks(page.blocks):parseNotionMarkdown(page.markdown)).length);
const articleLayouts=JSON.parse(fs.readFileSync(new URL('gallery-layouts.json',import.meta.url),'utf8')).articles;
const indexed=p=>articleLayouts[p.properties.Slug]==='index';
const archiveCount=snapshot.pages.filter(p=>!indexed(p)).reduce((count,p)=>count+JSON.parse(fs.readFileSync(new URL(`gallery-source/${p.properties.Slug}.json`,import.meta.url),'utf8')).sections.flatMap(s=>s.items).filter(i=>i.tag==='IMG').length,0);
assert.equal(snapshot.pages.reduce((count,p,i)=>count+(indexed(p)?0:sourceCounts[i]),0),archiveCount,'Unchanged archive projects retain their source photographs');
assert.equal(snapshot.pages.find(p=>p.properties.Slug==='trauma-induced-dissociative-amnesia').properties['Content kind'],'Concept photography');
const imagesDir=new URL('../dist/gallery/assets/works/',import.meta.url);
const media=JSON.parse(fs.readFileSync(new URL('gallery-notion/media.json',import.meta.url),'utf8'));
const languageConfig=JSON.parse(fs.readFileSync(new URL('gallery-layouts.json',import.meta.url))).readingLanguages['analog-and-digital'];
const analogPage=snapshot.pages.find(p=>p.properties.Slug==='analog-and-digital');
const analogNodes=parseNotionMarkdown(analogPage.markdown),unchangedAnalog=JSON.stringify(analogNodes);
const bilingual=withReadingLanguages(analogNodes,languageConfig);
const readingPair=bilingual[0].columns[0].children[0];
assert.equal(readingPair.type,'language-pair');
assert.deepEqual(readingPair.children.map(p=>p.code),['zh-Hans','en']);
assert.equal(readingPair.children[0].children[0].text,analogNodes[0].columns[0].children[0].text,'Chinese prose remains editable in its original Notion column');
assert.equal(readingPair.children[1].children[0].text,analogNodes[1].children[1].text,'English prose is read from its Notion section');
assert.deepEqual(allImages(bilingual).map(i=>i.src),allImages(analogNodes).map(i=>i.src),'Moving translated prose cannot move or duplicate photographs');
assert.equal(JSON.stringify(analogNodes),unchangedAnalog,'Public language layout must not rewrite CMS source blocks');
assert(!bilingual.some(n=>n.type==='toggle'),'Remove the separate public translation disclosure');
assert.throws(()=>withReadingLanguages([analogNodes[0]],languageConfig),/translated Notion section/,'Incomplete translated content cannot silently disappear');
const restLanguages=adaptNotionBlocks([
 {type:'column_list',column_list:{children:[
  {column:{children:[{type:'paragraph',paragraph:{rich_text:[{plain_text:'中文原文'}]}}]}},
  {column:{children:[{type:'image',image:{external:{url:'https://example.com/original.jpg'}}}]}}
 ]}},
 {type:'toggle',toggle:{rich_text:[{plain_text:'English translation'}],children:[{type:'paragraph',paragraph:{rich_text:[{plain_text:'Updated English from Notion'}]}}]}}
]);
const restReading=renderDocument(withReadingLanguages(restLanguages,languageConfig),{title:'Bilingual test'});
assert.match(restReading,/Updated English from Notion/,'REST sync follows edited translation text');
assert.match(restReading,/type="radio" name="article-reading-language"/,'Native language controls work without JavaScript');
assert.match(restReading,/lang="zh-Hans"/);assert.match(restReading,/lang="en"/);
const analogHtml=fs.readFileSync(new URL('../dist/gallery/analog-and-digital/index.html',import.meta.url),'utf8');
assert(!analogHtml.includes('<summary>English translation</summary>'),'Translation is no longer a separate section below the article');
const sourceGroups={
 'trauma-induced-dissociative-amnesia':[[1,2],[1,2],[1,1]],
 'rhythms-of-chaos':[[1,1],[1,1]],
 'intro-to-darkroom':[[4,0],[1,1,1],[1,1,1],[1,1,1],[1,1]],
 'analog-and-digital':[[0,1],[1,1],[1,1],[1,1]],
 'cathedrals-of-light':[[1,2],[1,1],[1,1],[1,1]],
 'surface-of-the-moon':[[2,2],[1,1],[1,1]],
 'morning-unwoken':[[1,1,1,1],[1,1,1,1]],
 'cursed-stage':[[0,3],[1,1,1],[1,1,1],[1,1,1]],
 'gorilla-in-the-studio':[[0,0],[3,3]],
 'the-common-things':[[0,0],[3,3]],
 'rorschachs-mask':[[2,2]]
};
const local=u=>media[u]||media[canonicalMediaUrl(u)]||media['notion-asset:'+mediaIdentity(u)];
const normalized=s=>s.replace(/\[([^\]]+)\]\([^\s)]+\)/g,'$1').replace(/<[^>]+>/g,' ').replace(/\\([*])/g,'$1').replace(/\s+/g,' ').trim();
for(const p of snapshot.pages){
 const slug=p.properties.Slug,nodes=parseNotionMarkdown(p.markdown),published=publicationNodes(nodes);
 const article=fs.readFileSync(new URL(`../dist/gallery/${slug}/index.html`,import.meta.url),'utf8');
 if(indexed(p)){
  const photos=allImages(published),grid=article.match(/<section class="image-index"[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert(photos.length>0&&grid,`Current Notion photographs have an index: ${slug}`);
  assert.deepEqual([...grid.matchAll(/href="\.\.\/([^\"]+)"/g)].map(m=>m[1]),photos.map(image=>local(image.src)?.original),`Current Notion image order and originals: ${slug}`);
  assert.deepEqual([...grid.matchAll(/<figcaption>(.*?)<\/figcaption>/g)].map(m=>m[1]),photos.map((_,i)=>String(i+1).padStart(2,'0')),`Number-only captions: ${slug}`);
  assert(normalized(article).includes(normalized(p.properties.Summary)),`Current Notion introduction: ${slug}`);
  assert(!article.includes('Website layout notes'),`Editor notes stay private: ${slug}`);
  continue;
 }
 const source=JSON.parse(fs.readFileSync(new URL(`gallery-source/${slug}.json`,import.meta.url)));
 const originalImages=source.sections.flatMap(s=>s.items).filter(i=>i.tag==='IMG');
 const identity=i=>local(i.src)?.original||(local(i.src)?.unavailable?i.src:null);
 assert.deepEqual(allImages(nodes).map(identity),originalImages.map(identity),`Original photograph order is retained: ${slug}`);
 for(const item of source.sections.flatMap(s=>s.items).filter(i=>['P','LI','H2','H3'].includes(i.tag))){
  const text=slug==='deliberate-practice'&&['H2','H3'].includes(item.tag)?item.text.replace(/^\((.*)\)$/s,'$1'):item.text;
  assert(normalized(p.markdown).includes(normalized(text)),`Source wording retained: ${slug} / ${item.text.slice(0,40)}`);
 }
 if(sourceGroups[slug])assert.deepEqual(published.filter(n=>n.type==='columns').map(n=>n.columns.map(c=>allImages(c.children).length)),sourceGroups[slug],`Author's original spatial groups: ${slug}`);
 assert(p.markdown.includes('Website layout notes (not published)'),`Layout guidance saved in Notion: ${slug}`);
 assert(!article.includes('Website layout notes')&&!article.includes('制作或更新此网站页面'),`Editor notes stay private: ${slug}`);
 assert(!article.includes('project-breadcrumb'),`No duplicate navigation: ${slug}`);
}
const pairedCaption=withImageCaptions(parseNotionMarkdown('![](https://example.com/photo.jpg)\nShot on Film\nby Jiacheng Liu\n## Next section'));
assert.equal(pairedCaption[0].caption,'Shot on Film\nby Jiacheng Liu');
assert.equal(pairedCaption[1].type,'heading','Caption grouping cannot consume the following chapter');
const galleryHome=fs.readFileSync(new URL('../dist/gallery/index.html',import.meta.url),'utf8');
const leftBlock=galleryHome.split('<div class="photography-main">')[1].split('<div class="photography-rail">')[0];
assert.deepEqual([...leftBlock.matchAll(/<article class="project-card[^\"]*"><a href="([^\"]+)"/g)].map(m=>m[1]),['rhythms-of-chaos/','deliberate-practice/','analog-and-digital/']);
for(const slug of ['trauma-induced-dissociative-amnesia','rhythms-of-chaos','analog-and-digital','deliberate-practice']){
 const page=snapshot.pages.find(p=>p.properties.Slug===slug);
 const article=fs.readFileSync(new URL(`../dist/gallery/${slug}/index.html`,import.meta.url),'utf8');
 for(const image of allImages(page.blocks?adaptNotionBlocks(page.blocks):parseNotionMarkdown(page.markdown))){
  const asset=media[image.src]||media[canonicalMediaUrl(image.src)]||media['notion-asset:'+mediaIdentity(image.src)];
  assert(asset?.original&&article.includes(`href="../${asset.original}"`),`Editorial layout must retain original photograph: ${slug}`);
 }
 if(['trauma-induced-dissociative-amnesia','rhythms-of-chaos'].includes(slug))assert.equal((article.match(/class="(?:story-cover )?story-image-open"/g)||[]).length,allImages(parseNotionMarkdown(page.markdown)).length,'The opening image remains selectable once, in the hero');
}
const practicePage=snapshot.pages.find(p=>p.properties.Slug==='deliberate-practice');
const practiceNodes=parseNotionMarkdown(practicePage.markdown);
const {sections}=practiceSections(practiceNodes);
assert.deepEqual(sections.map(s=>allImages(s.children).length),[6,6,4,1,4],'Preserve the five source assignments and photo order');
assert.deepEqual(sections.map(s=>s.children.filter(n=>n.type==='columns').map(n=>n.columns.length)),[[3,3],[2,2,2],[2,2],[],[2,2]],'Source comparison and pairings stay in the CMS');
const practiceHtml=fs.readFileSync(new URL('../dist/gallery/deliberate-practice/index.html',import.meta.url),'utf8');
assert.equal((practiceHtml.match(/<figcaption>/g)||[]).length,16,'All source captions remain with their photographs');
assert(!practiceHtml.includes('Website layout notes')&&!practiceHtml.includes('网站编辑备注'),'Internal layout notes are not published');
assert.match(practiceHtml,/class="story-cover story-image-open"[^>]*href="\.\.\/assets\/works\/5b07dba56991f915781b\.jpg"/,'Selected Notion cover is used, independently of the first body image');
assert.equal((practiceHtml.match(/class="practice-section practice-feature"/g)||[]).length,2,'The last two source sections have a larger print treatment');
assert.match(practiceHtml,/id="practice-contents"/);
assert.equal((practiceHtml.match(/href="#practice-contents"/g)||[]).length,5,'Every chapter heading returns to the contents');
assert(!practiceHtml.match(/(?:<h2[^>]*><a[^>]*>|href="#practice-section-\d+">)\(/),'Chapter labels have no enclosing parentheses');
const morning=snapshot.pages.find(p=>p.properties.Slug==='morning-unwoken');
assert.equal(local(morning.properties['Cover image'][0]).original,local(allImages(parseNotionMarkdown(morning.markdown))[2].src).original,'Morning Unwoken uses its third photograph as the Notion cover');
assert.match(galleryHome,/morning-unwoken[^>]*[\s\S]*?assets\/works\/58f7925f68ce9c2ac46c\.webp/);
const notesOnly=adaptNotionBlocks([{type:'toggle',toggle:{rich_text:[{plain_text:'Website layout notes (not published)'}],children:[{type:'paragraph',paragraph:{rich_text:[{plain_text:'Internal layout guidance'}]}}]}}]);
assert.equal(renderDocument(notesOnly,{title:'Test'}),'','REST exports also omit the internal note');
assert.equal(renderPractice(notesOnly,{title:'Test'}).document,'');
for(const file of fs.readdirSync(imagesDir).filter(n=>n.endsWith('.jpg'))){const dimensions=imageDimensions(fs.readFileSync(new URL(file,imagesDir)));assert(dimensions.width>0&&dimensions.height>0);}
const qa=path.resolve('tools/stills-qa/gallery-converter-test');fs.mkdirSync(qa,{recursive:true});
const emptyPath=path.join(qa,'empty.json');fs.writeFileSync(emptyPath,JSON.stringify({...snapshot,pages:[]}));
const output=path.join(qa,'site');
const empty=spawnSync(process.execPath,['tools/render-gallery.mjs','--snapshot',emptyPath,'--out',output],{encoding:'utf8'});
assert.equal(empty.status,0,empty.stderr);assert.match(fs.readFileSync(path.join(output,'index.html'),'utf8'),/No published photography projects/);
const curatedPath=path.join(qa,'unpublished-curation.json');
const unpublished=new Set(['rhythms-of-chaos','analog-and-digital']);
const curatedSnapshot={...snapshot,pages:snapshot.pages.map(p=>unpublished.has(p.properties.Slug)?{...p,properties:{...p.properties,Published:false}}:p)};
fs.writeFileSync(curatedPath,JSON.stringify(curatedSnapshot));
const curatedOutput=path.join(qa,'curated-site');
const curated=spawnSync(process.execPath,['tools/render-gallery.mjs','--snapshot',curatedPath,'--out',curatedOutput],{encoding:'utf8'});
assert.equal(curated.status,0,curated.stderr);
const photoSection=fs.readFileSync(path.join(curatedOutput,'index.html'),'utf8').split('id="photography"')[1].split('<section class="stills-feature"')[0];
const destinations=[...photoSection.matchAll(/<article class="project-card[^\"]*"><a href="([^\"]+)"/g)].map(m=>m[1]);
const expected=snapshot.pages.filter(p=>p.properties.Type==='Photography'&&p.properties.Featured!=='__YES__'&&!unpublished.has(p.properties.Slug)).map(p=>p.properties.Slug+'/');
assert.deepEqual(destinations.sort(),expected.sort(),'Unpublishing curated projects must retain each remaining project once');
const protectedPage=fs.readFileSync(path.join(output,'index.html'),'utf8');
const invalid=path.join(qa,'invalid.json');fs.writeFileSync(invalid,JSON.stringify({...snapshot,pages:[{...snapshot.pages[0],properties:{...snapshot.pages[0].properties,Slug:'../escape'}}]}));
const rejected=spawnSync(process.execPath,['tools/render-gallery.mjs','--snapshot',invalid,'--out',output],{encoding:'utf8'});
assert.notEqual(rejected.status,0);assert.equal(fs.readFileSync(path.join(output,'index.html'),'utf8'),protectedPage,'An invalid export cannot replace the existing page');
const missingToken=spawnSync(process.execPath,['tools/sync-gallery-notion.mjs','--watch'],{encoding:'utf8',env:{...process.env,NOTION_TOKEN:''}});
assert.equal(missingToken.status,1);assert.match(missingToken.stderr,/Set NOTION_TOKEN/);
console.log(`Passed: Notion document structures; natural image dimensions; native asset identities; safe links/markup; video rendering; pagination/nested blocks; rate-limit recovery; incomplete-export protection; CMS property scope; ${sourceCounts.reduce((a,b)=>a+b,0)} current photograph references and CMS-driven index order.`);
