import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNotionMarkdown, adaptNotionBlocks, renderDocument, allImages, canonicalMediaUrl, mediaIdentity, safeUrl, landscapeRatio, portraitScale, withImageCaptions } from './gallery-document.mjs';
import { renderPractice, renderChapters } from './gallery-practice.mjs';
import { filmSections } from './gallery-film.mjs';
import { sourceCarousels } from './gallery-carousels.mjs';
import { withReadingLanguages } from './gallery-languages.mjs';
import { renderMobiusMark } from './gallery-mobius.mjs';
import { renderExhibitionRoom } from './gallery-architecture.mjs';
import { renderImageIndex } from './gallery-image-index.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const option=name=>{const at=process.argv.indexOf(name);return at>=0?process.argv[at+1]:null;};
const route=path.resolve(option('--out')||path.join(root,'dist/gallery'));
const catalog=JSON.parse(fs.readFileSync(path.join(root,'tools/gallery-projects.json'),'utf8'));
const layouts=JSON.parse(fs.readFileSync(path.join(root,'tools/gallery-layouts.json'),'utf8'));
const snapshot=JSON.parse(fs.readFileSync(option('--snapshot')||path.join(root,'tools/gallery-notion/snapshot.json'),'utf8'));
const mediaPath=path.join(root,'tools/gallery-notion/media.json');
const localMedia=fs.existsSync(mediaPath)?JSON.parse(fs.readFileSync(mediaPath,'utf8')):{};
const resolveMedia=url=>localMedia[url]||localMedia[canonicalMediaUrl(url)]||localMedia['notion-asset:'+mediaIdentity(url)]||{display:url,original:url};
const projects=snapshot.pages.filter(p=>p.properties.Published==='__YES__'||p.properties.Published===true).map(page=>{
 const p=page.properties,seed=catalog.find(project=>project.id===p.Slug)||{};
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.Slug||'')||['assets','index','generated-pages'].includes(p.Slug))throw new Error('A published Gallery project needs a safe, stable Slug.');
 if(!['Photography','Film'].includes(p.Type))throw new Error('Gallery Type must be Photography or Film.');
 const coverSource=p['Cover image']?.[0]||page.cover?.file?.url||p.Cover||page.cover?.external?.url;
 if(!safeUrl(coverSource,{media:true}))throw new Error('A published Gallery project needs a valid cover URL.');
 const cover=resolveMedia(coverSource),useSeed=coverSource===seed.coverSourceUrl;
 const authoredNodes=page.blocks?adaptNotionBlocks(page.blocks):parseNotionMarkdown(page.markdown);
 const carouselDefinitions=layouts.sourceCarousels?.[p.Slug];
 const originalSource=carouselDefinitions?JSON.parse(fs.readFileSync(path.join(root,'tools/gallery-source',p.Slug+'.json'),'utf8')):null;
 const groups=carouselDefinitions?.map(def=>{
  const section=originalSource.sections.find(s=>s.id===def.section);
  if(!section)throw new Error('Unknown source carousel section: '+def.section);
  return {label:def.label,originals:section.items.filter(i=>i.tag==='IMG').map(i=>resolveMedia(i.src).original)};
 });
 const nodes=sourceCarousels(authoredNodes,groups,resolveMedia);
 return {...seed,id:p.Slug,title:p.Project,category:p.Type,contentKind:p['Content kind'],relatedProject:p['Related project'],format:p.Format,summary:p.Summary,subtitle:p.Subtitle,date:p['Date label']||(p.Year?String(p.Year):''),credit:p.Credit,order:p.Order||0,featured:p.Featured==='__YES__'||p.Featured===true,sourceUrl:safeUrl(p.Link)||safeUrl(seed.sourceUrl)||'',coverSourceUrl:coverSource,cover:useSeed?seed.cover:cover.display,width:useSeed?seed.width:cover.displayWidth,height:useSeed?seed.height:cover.displayHeight,alt:useSeed?seed.alt:p.Project,nodes,referenceRatio:landscapeRatio(nodes,resolveMedia),page};
}).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
if(new Set(projects.map(p=>p.id)).size!==projects.length)throw new Error('Gallery requires published projects with unique slugs.');
const stills=JSON.parse(fs.readFileSync(path.join(root,'tools/stills-collection.json'),'utf8'));
const stillKinds=[...new Set(stills.map(p=>p.kind))];
const stillDescription=stillKinds.map(kind=>`${stills.filter(p=>p.kind===kind).length} ${kind==='Concept photography'?'concept photographs':'in-game screenshots'}`).join(' and ')+'.';
const stillCategory=stillKinds.includes('Concept photography')
  ? stillKinds.includes('In-game screenshot')?'Game screenshots &amp; concept photography':'Concept photography'
  : 'In-game screenshots';
const alt={
  'rhythms-of-chaos':'A crowded food hall beneath colorful restaurant signs.',
  'deliberate-practice':'An exhibition corner covered in monochrome prints, with a stool below.',
  'the-life-of-a-poser':'A skateboarder airborne above the rails of an outdoor skatepark.',
  'intro-to-darkroom':'A monochrome interior with a circular wall fixture and scattered points of light.',
  'analog-and-digital':'Three silhouettes on a ridge beneath a pastel evening sky.',
  'cathedrals-of-light':'An upward view of escalators and a circular skylight.',
  'surface-of-the-moon':'A small figure standing on a broad, dusty hillside beneath a pale sky.',
  'morning-unwoken':'A white-clad figure seen from behind on a forest path.',
  'cursed-stage':'A monochrome film cover with a performer, a candle and Chinese lettering.',
  'gorilla-in-the-studio':'A gorilla seen inside a studio, alongside the film title.',
  'the-common-things':'A person in a number 23 jersey on a city street, beneath the film title.',
  'rorschachs-mask':'A figure in a white coat with a covered face, beside the film title.'
};
const esc=s=>String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const footer=prefix=>`<footer class="gallery-footer" id="contact"><div class="gallery-footer-signature"><img class="gallery-room-drawing" src="${prefix}assets/exhibition-room.svg" width="160" height="132" alt="" aria-hidden="true" loading="lazy" decoding="async"><p>© 2026 VegShark.com</p></div><nav aria-label="Contact"><a href="mailto:smartchen324@gmail.com">Email</a><a href="https://www.instagram.com/smartchen324/">Instagram</a><a href="${prefix}../">Back to VegShark.com</a></nav></footer>`;
const header=(prefix,light=false)=>`<a class="skip-link" href="#main">Skip to projects</a><header class="gallery-header">${light?'<div class="cathedral-light-background cathedral-light-background--header" aria-hidden="true"></div>':''}<nav class="gallery-nav" aria-label="Gallery sections"><a href="${prefix}#photography">Photography</a><a href="${prefix}#polaroid">Stills</a><a href="${prefix}#films">Film</a></nav><a class="gallery-brand" href="${prefix||'./'}"><img class="gallery-brand-mobius" src="${prefix}assets/mobius-outline.svg" width="360" height="120" alt="" aria-hidden="true" decoding="async"><span>The Gallery</span></a><nav class="gallery-person" aria-label="Personal site"><a href="${prefix}../">VegShark.com</a><a href="#contact">Contact</a></nav></header>`;
const media=(p,prefix='',priority=false)=>`<span class="media${p.height>p.width?' portrait':''}"${p.height>p.width?` style="--print-scale:${portraitScale(p.width,p.height,p.referenceRatio)}"`:''}><img src="${p.cover.startsWith('assets/')?prefix:''}${p.cover}"${p.width?` width="${p.width}" height="${p.height}"`:''} alt="${esc(p.alt||alt[p.id]||p.title)}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async"><span class="media-error" hidden>Cover unavailable. Open the project to continue.</span></span>`;
const card=(p,prefix='',wide=false)=>`<article class="project-card${wide?' wide':''}"><a href="${prefix}${p.id}/">${media(p,prefix)}<div class="project-caption"><h3>${esc(p.title)}</h3><p>${esc(p.contentKind==='Concept photography'?p.contentKind:p.category)}${p.category==='Film'&&p.format==='Trailer'?' · '+esc(p.format):''}${p.date?' · '+esc(p.date):''}</p></div></a></article>`;
const editorialCard=(p,kind)=>`<article class="project-card editorial-${kind}"><a href="${p.id}/">${media(p)}<div class="editorial-copy"><h3>${esc(p.title)}</h3><p class="editorial-meta">${esc(p.contentKind==='Concept photography'?p.contentKind:p.category)}${p.date?' · '+esc(p.date):''}</p>${kind==='lead'&&p.summary?`<p class="editorial-summary">${esc(p.summary)}</p>`:''}</div></a></article>`;
function photographyEditorial(photos){
 const remaining=[...photos],take=id=>{const index=remaining.findIndex(p=>p.id===id);return index>=0?remaining.splice(index,1)[0]:null;};
 if(!photos.length)return '';
 const lead=take(layouts.photography.lead)||remaining.shift();
 const companions=layouts.photography.companions.map(take).filter(Boolean);
 while(companions.length<2&&remaining.length)companions.push(remaining.shift());
 return `<div class="photography-editorial${!remaining.length?' no-rail':''}"><div class="photography-main">${editorialCard(lead,'lead')}${companions.length?`<div class="photography-companions">${companions.map(p=>editorialCard(p,'spotlight')).join('')}</div>`:''}</div>${remaining.length?`<div class="photography-rail">${remaining.map(p=>editorialCard(p,'compact')).join('')}</div>`:''}</div>`;
}
const shell=(title,body,prefix='',layout='',film=false,project='')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="description" content="${esc(title)} — photography and film by Smart Chen."><title>${title==='The Gallery'?'The Gallery — Smart Chen':esc(title)+' | The Gallery — Smart Chen'}</title><link rel="stylesheet" href="${prefix}gallery.css?rev=20261015-media-fit">${project==='cathedrals-of-light'?`<link rel="stylesheet" href="${prefix}cathedral-light.css?rev=20261021-three-palettes"><script type="module" src="${prefix}cathedral-light.mjs?rev=20261021-three-palettes"></script>`:''}${film?`<link rel="stylesheet" href="${prefix}film-layout.css?rev=20261015-source">`:''}${prefix===''?`<link rel="stylesheet" href="../gallery-entry.css?rev=20261014-smooth-arrival">`:''}${layout==='index'?`<link rel="stylesheet" href="${prefix}image-index.css?rev=20261014-numbered">`:''}<script type="module" src="${prefix}gallery.mjs?rev=20261015-film-carousel"></script></head><body${project==='cathedrals-of-light'?' class="cathedral-light-page"':''}>${project==='cathedrals-of-light'?'<div class="cathedral-light-background" aria-hidden="true"></div>':''}${header(prefix,project==='cathedrals-of-light')}${body}${footer(prefix)}</body></html>`;
const featured=projects.find(p=>p.featured)||projects[0], photos=projects.filter(p=>p.category==='Photography'&&p.id!==featured.id),films=projects.filter(p=>p.category==='Film'&&p.id!==featured?.id);
const home=`<main class="gallery-main" id="main"><h1 class="sr-only">The Gallery</h1><div class="gallery-intro"><span>${projects.length+1} projects</span></div>
${featured?`<section class="feature" aria-labelledby="featured-title"><div class="feature-copy"><p class="eyebrow">${featured.category==='Film'?'Selected film':'Selected series'} · ${esc(featured.contentKind==='Concept photography'?featured.contentKind:featured.category)}</p><h2 id="featured-title"><a href="${featured.id}/">${esc(featured.title)}</a></h2>${featured.summary?`<p class="intro">${esc(featured.summary)}</p>`:''}<a class="text-link" href="${featured.id}/">${featured.category==='Film'?'View film':'View series'}</a></div><a class="media-link" href="${featured.id}/" aria-label="View ${esc(featured.title)}">${media(featured,'',true)}</a></section>`:''}
<section class="gallery-section" id="photography" aria-labelledby="photography-title"><div class="section-heading"><h2 id="photography-title">Photography</h2><span>${projects.filter(p=>p.category==='Photography').length} series</span></div>${photographyEditorial(photos)}${!projects.some(p=>p.category==='Photography')?'<p>No published photography projects.</p>':''}</section>
<section class="stills-feature" id="polaroid" aria-labelledby="polaroid-title"><div class="feature"><a href="../projects/polaroid-of-yesterday/photography/" aria-label="View Polaroid of Yesterday stills"><span class="media"><img src="../projects/polaroid-of-yesterday/photography/assets/the-room.webp" width="3840" height="2160" alt="An in-game living room with a camera, a television and a red chair." loading="lazy"><span class="media-error" hidden>Image unavailable. Open the project to continue.</span></span></a><div class="feature-copy"><p class="eyebrow">Project stills · ${stillCategory}</p><h2 id="polaroid-title"><a href="../projects/polaroid-of-yesterday/photography/">Polaroid of Yesterday</a></h2><p class="intro">${esc(stillDescription)}</p><a class="text-link" href="../projects/polaroid-of-yesterday/photography/">Enter the exhibition</a></div></div></section>
<section class="gallery-section" id="films" aria-labelledby="film-title"><div class="section-heading"><h2 id="film-title">Film</h2><span>${projects.filter(p=>p.category==='Film').length} projects</span></div><div class="project-grid film-grid">${films.map(p=>card(p)).join('\n')}${!projects.some(p=>p.category==='Film')?'<p>No published film projects.</p>':''}</div></section></main>`;
// Prepare all pages before writing any output: unsupported content cannot publish a partial build.
const rendered=new Map([['index.html',shell('The Gallery',home)]]);
for(const p of projects){
 const next=projects[(projects.indexOf(p)+1)%projects.length];
 const layout=layouts.articles[p.id];
 if(layout&&!['offset','centered','practice','source','index'].includes(layout))throw new Error('Unknown article layout: '+layout);
 const firstImage=allImages(p.nodes)[0];
 const firstImageIndex=p.nodes.indexOf(firstImage);
 // The opening photograph already appears in the hero. Retain authored captions in the body.
 const heroIsFirst=layout&&firstImage&&firstImageIndex>=0&&!firstImage.caption&&p.nodes[firstImageIndex+1]?.type!=='paragraph'&&resolveMedia(firstImage.src).original===resolveMedia(p.coverSourceUrl).original;
 const chaptered=layout==='source'&&p.nodes.filter(n=>n.type==='heading'&&n.level===2).length>1;
 const practice=layout==='practice'?renderPractice(p.nodes,{title:p.title,resolveMedia}):chaptered?renderChapters(p.nodes,{title:p.title,resolveMedia}):null;
 const sourceLayout=layout==='source';
 const paragraphMatches=(nodes,text)=>Boolean(text)&&nodes.some(n=>n.type==='paragraph'&&(Array.isArray(n.text)?n.text.map(t=>t.plain_text??t.text?.content??'').join(''):n.text).trim()===text.trim()||n.children&&paragraphMatches(n.children,text)||n.columns?.some(c=>paragraphMatches(c.children,text)));
 const sourceSummaryInBody=sourceLayout&&paragraphMatches(p.nodes,p.summary);
 const sourceCoverIncluded=p.category==='Film'||layout==='index'||sourceLayout&&allImages(p.nodes).some(image=>resolveMedia(image.src).original===resolveMedia(p.coverSourceUrl).original);
 const document=layout==='index'?renderImageIndex(p.nodes,{title:p.title,resolveMedia}):practice?.document??renderDocument(p.category==='Film'?filmSections(p.nodes):withReadingLanguages(sourceLayout?withImageCaptions(p.nodes):p.nodes,layouts.readingLanguages?.[p.id]),{title:p.title,resolveMedia,omitIntro:sourceLayout?'':p.summary,omitFirstImage:!sourceLayout&&heroIsFirst?firstImage.src:'',paragraphCaptions:!sourceLayout});
 const originalCover=resolveMedia(p.coverSourceUrl).original;
 const coverHref=p.coverSourceUrl===catalog.find(seed=>seed.id===p.id)?.coverSourceUrl?`../assets/${p.id}.jpg`:originalCover.startsWith('assets/')?'../'+originalCover:originalCover;
 const body=`<main class="project-main" id="main"><article data-project="${esc(p.id)}" class="story${p.category==='Film'?' story--film':''}${layout?' story--'+layout:''}"><header class="story-hero"><div class="story-title"><p class="eyebrow">${esc(p.contentKind||p.category)}${p.format?' · '+esc(p.format):''}</p><h1>${esc(p.title)}</h1>${p.subtitle?`<p class="story-subtitle" lang="zh-Hans">${esc(p.subtitle)}</p>`:''}${p.summary&&!sourceSummaryInBody?`<p class="story-intro">${esc(p.summary)}</p>`:''}${p.category==='Film'?'':`<div class="project-meta"><span>${esc(p.credit||'Smart Chen')}</span>${p.date?`<span>${esc(p.date)}</span>`:''}</div>`}${practice?.index||''}${p.relatedProject==='Polaroid of Yesterday'?'<a class="text-link story-related-project" href="../../projects/polaroid-of-yesterday/photography/">View Polaroid of Yesterday stills</a>':''}</div>${sourceCoverIncluded?'':`<a class="story-cover story-image-open" href="${esc(coverHref)}" data-image-title="${esc(p.title)} — published cover">${media(p,'../',true)}</a>`}</header><div class="story-body">${document}</div><p class="story-source"><a href="${esc(p.sourceUrl)}">Originally published on VegShark.com</a></p></article><section class="related" aria-labelledby="next-title"><div class="section-heading"><h2 id="next-title">Next project</h2><a class="text-link" href="../">All projects</a></div><div class="project-grid">${card(next,'../')}</div></section></main>`;
 rendered.set(p.id+'/index.html',shell(p.title,body,'../',layout,p.category==='Film',p.id));
}
const managedPath=path.join(route,'generated-pages.json');
const previous=fs.existsSync(managedPath)?JSON.parse(fs.readFileSync(managedPath,'utf8')):[];
for(const [relative,html] of rendered){const file=path.resolve(route,relative);if(!file.startsWith(route+path.sep))throw new Error('Output path escapes Gallery');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',html);fs.renameSync(file+'.tmp',file);}
for(const relative of previous){if(rendered.has(relative)||!/^[-a-z0-9]+\/index\.html$/.test(relative))continue;const file=path.resolve(route,relative);if(file.startsWith(route+path.sep)&&fs.existsSync(file))fs.unlinkSync(file);}
fs.writeFileSync(managedPath,JSON.stringify([...rendered.keys()],null,2)+'\n');
fs.mkdirSync(path.join(route,'assets'),{recursive:true});
fs.writeFileSync(path.join(route,'assets/mobius-outline.svg'),renderMobiusMark());
fs.writeFileSync(path.join(route,'assets/exhibition-room.svg'),renderExhibitionRoom());
fs.writeFileSync(path.join(route,'assets/sources.json'),JSON.stringify({imported:'2026-10-13',photographySource:'https://sites.google.com/view/vegshark/photography',filmSource:'https://sites.google.com/view/vegshark/film',covers:projects.map(p=>({id:p.id,project:p.sourceUrl,image:p.coverSourceUrl,width:p.width,height:p.height,original:resolveMedia(p.coverSourceUrl).original,display:p.cover}))},null,2)+'\n');
console.log(`Rendered The Gallery and ${projects.length} complete Notion project pages.`);
