import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

// An existing edition is verified, never regenerated from evolving site code.
const cameraOnly=process.argv.includes('--camera');
const cursorText=process.argv.includes('--cursor-text');
const cursorOnly=cursorText||process.argv.includes('--cursor');
const gallerySmall=process.argv.includes('--gallery-small');
const galleryOnly=gallerySmall||process.argv.includes('--gallery');
const edition=cursorText?'2026-10-28-cursor-text':cursorOnly?'2026-10-28-cursor':gallerySmall?'2026-10-27-gallery-small':galleryOnly?'2026-10-27-gallery':cameraOnly?'2026-10-27-sx70':'2026-10-27';
const sourceCommit=cursorText?'24b4a5846e7016fbe8cc6ff4320b615612498a4b':cursorOnly?'bb2bac9272ba2244a3e74a1edbd6c0907f2de184':gallerySmall?'b63438bbc2230cf68135f58109e9a2ce840b1ace':galleryOnly?'2d4eba468c170080f4c85943b3e862853c95f9ff':cameraOnly?'1de028bb51c96eebaf8e44bf7cb12f8f1e8d394e':'e6bb1c9aa2798b7ddacddb74840fc948d857c61a';
const output=`dist/projects/figures-of-speech/editions/${edition}`;
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const refreshDraft=process.argv.includes('--refresh-draft');
if(refreshDraft){
  const committed=execFileSync('git',['ls-tree','HEAD',`${output}/manifest.json`],{encoding:'utf8'}).trim();
  if(committed)throw new Error('A committed edition cannot be refreshed. Create a new edition instead.');
}
if(fs.existsSync(`${output}/manifest.json`)&&!refreshDraft){
  const manifest=JSON.parse(fs.readFileSync(`${output}/manifest.json`,'utf8'));
  for(const file of manifest.files)if(digest(fs.readFileSync(`${output}/${file.path}`))!==file.sha256)throw new Error(`Preserved edition changed: ${file.path}`);
  console.log(`Verified immutable edition ${edition}; ${manifest.files.length} files.`);process.exit(0);
}
const tracked=name=>execFileSync('git',['show',`${sourceCommit}:dist/${name}`],{maxBuffer:40*1024*1024});
const files=[],seen=new Set();
function write(name,content,source=null){fs.mkdirSync(path.dirname(`${output}/${name}`),{recursive:true});fs.writeFileSync(`${output}/${name}`,content);files.push({path:name,sha256:digest(Buffer.from(content)),...(source?{source}: {})});}
function copy(name){
  if(seen.has(name))return;seen.add(name);
  const bytes=tracked(name);let content=bytes;
  if(/\.(?:mjs|js|css)$/.test(name)){
    let text=bytes.toString('utf8');
    const refs=new Set();
    text=text.replace(/(['"])((?:\.\.?\/|\/)[^'"\n]+?\.(?:mjs|js|css|webp|png|jpg|ttf|otf|pdf))(\?[^'"\n]*)?\1/g,(all,quote,url,query='')=>{
      const resolved=new URL(url,`https://edition.local/${name}`).pathname.slice(1);refs.add(resolved);
      if(!url.startsWith('/'))return all;
      let relative=path.posix.relative(path.posix.dirname(name),resolved);if(!relative.startsWith('.'))relative=`./${relative}`;
      if(/\.(?:mjs|js)$/.test(name)&&url.startsWith('/assets/'))return `new URL(${quote}${relative}${query}${quote},import.meta.url).href`;
      return `${quote}${relative}${query}${quote}`;
    });
    for(const match of text.matchAll(/url\(['"]?([^)'"?]+\.(?:ttf|otf|woff2?|webp|jpg|png))/g))refs.add(new URL(match[1],`https://edition.local/${name}`).pathname.slice(1));
    content=text;write(`runtime/${name}`,content,{path:`dist/${name}`,sha256:digest(bytes)});for(const ref of refs)copy(ref);
  }else write(`runtime/${name}`,content,{path:`dist/${name}`,sha256:digest(bytes)});
}
if(cursorOnly){
  for(const name of ['site-cursor.css','site-cursor-intents.mjs','projects/polaroid-of-yesterday/photography/assets/the-camera-remembers.webp'])copy(name);
  const original=tracked('site-cursor.mjs');
  const controller=original.toString('utf8').replace('window.top === window && !location.pathname.includes(\'/editions/\')','document.body.dataset.lab === \'cursor\'').replace("const homepage = Boolean(document.querySelector('.homepage'));","const homepage = true; // Standalone word-attraction specimen.");
  if(controller===original.toString('utf8')||controller.includes("window.top === window && !location.pathname.includes('/editions/')"))throw new Error('The pinned cursor extraction guard did not match');
  write('runtime/site-cursor.mjs',controller,{path:'dist/site-cursor.mjs',sha256:digest(original),adaptation:'Opt in only inside this standalone cursor study, including its word-attraction specimen. Native geometry, intent resolution, springs, inversion, capture tracking and preference fallbacks retained.'});
  for(const name of ['cursor-lab.css','cursor-lab.mjs'])write(name,fs.readFileSync(`tools/figures-lab/${name}`));
  write('adaptive-cursor/index.html',fs.readFileSync('tools/figures-lab/cursor-lab.html'));
  const markup=original.toString('utf8').match(/cursor\.innerHTML = '([^']+)';/)[1];
  const shapes=cursorText?[['dot',13,13,6.5,.65,''],['button',26,26,13,.88,''],['text',2,24,1,.9,''],['link',34,26,13,.88,'--cursor-arrow:1'],['magnify',34,26,13,.88,'--cursor-magnify:1'],['drag',34,26,13,.88,'--cursor-move:1']]:[['dot',13,13,6.5,.65,''],['button',26,26,13,.88,''],['link',34,26,13,.88,'--cursor-arrow:1'],['magnify',34,26,13,.88,'--cursor-magnify:1'],['drag',34,26,13,.88,'--cursor-move:1'],['dragging',30,24,12,.96,'--cursor-move:1;--move-scale:.75;--magnify-scale:.88235294']];
  write('cursor-plate.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Adaptive Cursor catalogue plate</title><link rel="stylesheet" href="cursor-lab.css"><style>html,body{margin:0;background:#fff}.cursor-plate{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(2,1fr);width:960px;height:560px;place-items:center}.cursor-specimen{width:260px;height:220px;display:grid;place-items:center}.cursor-specimen .site-cursor{position:relative;left:auto;top:auto;transform:scale(4)}</style><main class="cursor-plate" aria-label="Six preserved cursor forms">${shapes.map(([mode,w,h,r,fill,extra])=>`<div class="cursor-specimen"><div class="site-cursor" data-mode="${mode}" aria-hidden="true" style="width:${w}px;height:${h}px;border-radius:${r}px;--cursor-fill:${fill};${extra}">${markup}</div></div>`).join('')}</main></html>\n`);
  fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({edition,sourceCommit,preserved:'2026-10-28',description:cursorText?'Type-aware cursor edition: scalable text bars, two-dimensional object dragging and a one-axis range sharing the same pointer; revised six-form plate. All previous editions remain intact.':'Independent adaptive cursor and eight working interaction mechanisms, with a six-form catalogue plate. All previous editions remain intact.',studies:[{slug:'adaptive-cursor',kind:'cursor',title:'Adaptive Cursor'}],files},null,2)+'\n');
  console.log(`Preserved cursor edition ${edition}; ${files.length} files.`);process.exit(0);
}
if(galleryOnly){
  copy('home-gallery-architecture.mjs');copy('gallery/assets/mobius-outline.svg');
  const source=tracked('home-photo-transition.mjs');
  write('runtime/photo-frame.mjs',source.toString('utf8').split('export function installPhotoTransition')[0].replace(/^import .*;\r?\n/gm,'').replace(/^const architecture = .*;\r?\n/gm,''),{path:'dist/home-photo-transition.mjs',sha256:digest(source),adaptation:'Preserved native frame calculations; live page navigation installer excluded.'});
  for(const name of ['gallery-lab.css','gallery-lab.mjs'])write(name,fs.readFileSync(`tools/figures-lab/${name}`));
  write('gallery-entrance/index.html',`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="robots" content="noindex"><title>Into The Gallery — Preserved 2026-10-27</title><link rel="stylesheet" href="../gallery-lab.css"><script type="module" src="../gallery-lab.mjs"></script></head><body><main class="lab-stage" aria-label="Into The Gallery"><canvas id="gallery-lines" class="lab-canvas" role="img" aria-label="Animated museum entrance"></canvas><div class="gallery-brand"><img src="../runtime/gallery/assets/mobius-outline.svg" alt=""><span>The Gallery</span></div><div class="lab-controls"><button id="replay" type="button">Replay</button></div></main><noscript>This experiment needs JavaScript.</noscript></body></html>\n`);
  fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({edition,sourceCommit,preserved:'2026-10-27',description:gallerySmall?'Small-logo Gallery entrance: the complete mark, lettering and white clearance use 40% scale throughout. Earlier editions remain intact.':'Corrected isolated Gallery entrance: native white wordmark clearance, traced mark, title reveal and masthead scale. Earlier editions remain intact.',studies:[{slug:'gallery-entrance',kind:'gallery',title:'Into The Gallery'}],files},null,2)+'\n');
  console.log(`Preserved Gallery edition ${edition}; ${files.length} files.`);process.exit(0);
}
if(cameraOnly){
  const subject='projects/polaroid-of-yesterday/photography/assets/the-camera-remembers.webp';
  for(const name of ['camera-model.mjs','camera.css','vendor/html2canvas.min.js','vendor/html2canvas.LICENSE',subject])copy(name);
  const original=tracked('camera.mjs');
  let controller=original.toString('utf8').replace('fine.matches&&!contrast.matches&&!!ctx','!contrast.matches&&!!ctx');
  for(const event of ['pointermove','mousedown','click'])controller=controller.replace(`addEventListener('${event}',event=>{`,`addEventListener('${event}',event=>{\n  if(event.target?.closest?.('[data-camera-control]'))return;`);
  controller+=`\n// Standalone accessors preserve the native cursor, finder and capture pipeline.\nexport function labPosition(x,y){mouse={x,y};setVisible(true);positionFinder();schedule();}\nexport function labOpen(){if(busy)return;opened=true;setVisible(true);publish();schedule();}\nexport function labToggle(){if(busy)return;exitAim();opened=!opened;setVisible(true);publish();schedule();}\nexport function labShutter(){const result=takePhoto();consumeClick=false;return result;}\nexport function labState(){return {opened,busy,phase,enabled:enabled()};}\n`;
  write('runtime/camera.mjs',controller,{path:'dist/camera.mjs',sha256:digest(original),adaptation:'Standalone controls and coarse-pointer access; toolbar input is excluded from native cursor clicks. Original model, viewfinder, DOM capture and film choreography retained.'});
  for(const name of ['camera-lab.css','camera-lab.mjs'])write(name,fs.readFileSync(`tools/figures-lab/${name}`));
  write('polaroid-camera/index.html',`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="robots" content="noindex"><title>Polaroid Camera — Preserved 2026-10-27</title><link rel="stylesheet" href="../runtime/camera.css"><link rel="stylesheet" href="../camera-lab.css"><script src="../runtime/vendor/html2canvas.min.js" defer></script><script type="module" src="../camera-lab.mjs"></script></head><body data-lab="camera"><main class="camera-stage" aria-label="SX-70 camera cursor experiment"><figure class="camera-subject"><img src="../runtime/${subject}" width="1600" height="900" alt="A photograph of a camera framing a room, used as a subject for this experiment"><figcaption>Test subject</figcaption></figure><p class="camera-instruction" data-html2canvas-ignore>Click: open / fold / shoot · Hold RMB / F: aim</p></main><nav class="camera-controls" aria-label="Camera controls" data-camera-control data-html2canvas-ignore><button id="camera-fold" type="button">Fold</button><button id="camera-aim" type="button" aria-pressed="false">Aim</button><button id="camera-shutter" type="button" disabled>Shutter</button></nav></body></html>\n`);
  fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({edition,sourceCommit,preserved:'2026-10-27',description:'Independent SX-70 cursor edition with native folding, viewfinder, DOM capture and physical film ejection. The six earlier studies remain unchanged.',studies:[{slug:'polaroid-camera',kind:'camera',title:'Polaroid Camera'}],files},null,2)+'\n');
  console.log(`Preserved camera edition ${edition}; ${files.length} files.`);process.exit(0);
}
for(const name of ['home-business-card.mjs','home-business-card.css','home-exhibition.mjs','home-game-transition.mjs','home-gallery-architecture.mjs','home-motorsport.mjs','construction.mjs','construction.css','assets/fonts/instrument-serif-regular.ttf','assets/fonts/OFL.txt','assets/fonts/SourceHanSans-LICENSE.txt','assets/fonts/Anton-OFL.txt','assets/fonts/Archivo-OFL.txt','assets/hongyi-chen-resume.pdf','gallery/assets/mobius-outline.svg','vendor/three/LICENSE'])copy(name);
const homepage=tracked('index.html').toString('utf8');
const photos=[...homepage.matchAll(/<figure class="gallery-print">[\s\S]*?<\/figure>/g)].map(match=>match[0]);
for(const photo of photos)copy(photo.match(/src="([^"]+)"/)[1]);
const fieldSource=tracked('home-scenes.mjs');
const gameField=fieldSource.toString('utf8').replace(/^import .*;\r?\n/gm,'').replace('export function createScenes','export function createGameField').replace(/  const motor = createMotorsport\([^\n]+/,'  const motor = {resize(){},setActive(){},stop(){},play(){},point(){}};').replace(/  const gallery = createExhibition\([^\n]+/,'  const gallery = {resize(){}};');
write('runtime/game-field.mjs',gameField,{path:'dist/home-scenes.mjs',sha256:digest(fieldSource),adaptation:'Extracted game field; unused motor and photography integrations removed.'});
const photoSource=tracked('home-photo-transition.mjs');
write('runtime/photo-frame.mjs',photoSource.toString('utf8').split('export function installPhotoTransition')[0].replace(/^import .*;\r?\n/gm,'').replace(/^const architecture = .*;\r?\n/gm,''),{path:'dist/home-photo-transition.mjs',sha256:digest(photoSource),adaptation:'Preserved frame calculations; live page navigation installer excluded.'});
for(const name of ['lab.css','lab.mjs'])write(name,fs.readFileSync(`tools/figures-lab/${name}`));
const resources=markup=>markup.replace(/(src|href)="((?:assets|photography-preview)\/[^"#]+)"/g,'$1="../runtime/$2"');
const card=resources(homepage.match(/<div id="business-card"[\s\S]*?(?=<\/body>)/)[0]);
const definitions=[
  {slug:'personal-card',kind:'card',title:'Personal Card',css:'home-business-card.css',markup:card},
  {slug:'game-designer',kind:'games',title:'Game Designer',markup:'<canvas id="game-field" class="lab-canvas" aria-hidden="true"></canvas><canvas id="game-compression" class="lab-canvas" aria-hidden="true" hidden></canvas><button id="game-trigger" class="lab-trigger" type="button">(game) designer</button><p class="lab-help">Move to influence the field. Click the word to converge.</p>'},
  {slug:'filmmaker',kind:'photo',title:'Filmmaker',markup:`<div class="photo-scene">${photos.map(resources).join('')}</div><div class="lab-controls"><button id="replay" type="button">Replay development</button></div>`},
  {slug:'gallery-entrance',kind:'gallery',title:'Into The Gallery',markup:'<canvas id="gallery-lines" class="lab-canvas" role="img" aria-label="Animated museum entrance"></canvas><div class="gallery-brand"><img src="../runtime/gallery/assets/mobius-outline.svg" alt=""><span>The Gallery</span></div><div class="lab-controls"><button id="replay" type="button">Replay</button></div>'},
  {slug:'car-enthusiast',kind:'cars',title:'Car Enthusiast',markup:'<div class="scene-window"><canvas id="motor" role="button" tabindex="0" aria-label="Play the preserved car film"></canvas><canvas id="motor-foreground" class="motor-foreground" aria-hidden="true"></canvas></div><div class="lab-controls"><button id="play-film" type="button">Play film</button></div>'},
  {slug:'under-construction',kind:'construction',title:'Under Construction',css:'construction.css',markup:'<section class="maintenance scene-window" aria-label="Interactive 404 construction scene"><canvas id="maintenance-scene" role="application" aria-label="Add and move construction objects. Enter adds; arrow keys move; R rotates; brackets select." tabindex="0"></canvas><div id="scene-fallback" class="scene-fallback" hidden><p>404</p><h1>Site under construction</h1><p>This experiment needs WebGL.</p></div><div class="scene-footer"><p id="scene-help" class="scene-help" aria-hidden="true">DRAG TO MOVE</p><div class="scene-controls" role="group" aria-label="Arrange the construction scene"><button id="add-objects" type="button" aria-label="Add one object" disabled><span class="footer-label">+ ADD</span></button><button id="clear-objects" type="button" disabled><span class="footer-label">CLEAR</span></button></div></div><p id="scene-status" class="sr-only" role="status" aria-live="polite"></p></section>'},
];
for(const study of definitions)write(`${study.slug}/index.html`,`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><meta name="robots" content="noindex"><title>${study.title} — Preserved ${edition}</title>${study.css?`<link rel="stylesheet" href="../runtime/${study.css}">`:''}<link rel="stylesheet" href="../lab.css"><script type="module" src="../lab.mjs"></script></head><body data-lab="${study.kind}"><main class="lab-stage" aria-label="${study.title}">${study.markup}<p id="lab-error" class="lab-fallback" role="status" hidden>This preserved experiment could not load. Reload this page to try again.</p></main><noscript>This experiment needs JavaScript.</noscript></body></html>\n`);
fs.writeFileSync(`${output}/manifest.json`,JSON.stringify({edition,sourceCommit,preserved:'2026-10-27',description:'Independent component edition. Original implementation and resources are pinned; adapters remove surrounding website context and navigation.',studies:definitions.map(({slug,kind,title})=>({slug,kind,title})),files},null,2)+'\n');
console.log(`Preserved ${definitions.length} independent studies in ${files.length} files (${edition}).`);
