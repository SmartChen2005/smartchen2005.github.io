import fs from 'node:fs';
import { figuresPronunciation, figuresDefinition } from './figures-cover.mjs';
import assert from 'node:assert/strict';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { siteFavicon } from './site-favicon.mjs';
import { imageRendition, renditionAttributes } from './gallery-media.mjs';
import { lineFighter } from './masb-fighters.mjs';
const output = new URL('../dist/projects/index.html', import.meta.url);
const header = projectHeader({base:'../', current:true});
const current = fs.readFileSync(output, 'utf8').replace(/\r\n/g, '\n').match(/<header class="project-header\b[\s\S]*?<\/header>/)?.[0];
assert.equal(current, header, 'Preserve the existing shared Header exactly.');
const room = imageRendition('projects/polaroid-of-yesterday/assets/room.jpg');
assert(room, 'Reuse the existing optimized Polaroid screenshot.');
const vr = JSON.parse(fs.readFileSync(new URL('./vr-source/content.json', import.meta.url), 'utf8'));
const { example: matchup } = JSON.parse(fs.readFileSync(new URL('./masb-source/experience.json', import.meta.url), 'utf8'));
const aiGameDesign = {
  href: 'ai-game-design/',
  title: 'Beyond Vibe Coding: Experiments in Human–AI Game Design',
  kind: 'Design research',
  description: 'Three playable games and a field handbook on creative control in human–AI collaboration.',
  previewImage: 'ai-game-design/media/projects-cover.webp',
  previewWidth: 1280,
  previewHeight: 320
};
const projects = [
  {href:'polaroid-of-yesterday/',title:'Polaroid of Yesterday',kind:'Narrative puzzle game',description:'A first-person game about photography, memory, and the stories we construct.',tone:'light',theme:'polaroid',effect:'polaroid',image:`<img ${renditionAttributes(room,'../',{sizes:'(max-width: 700px) calc(100vw - 80px), 520px',priority:true})} alt="" decoding="async" fetchpriority="high" draggable="false">`},
  {href:'gran-turismo/',title:'GRAN TURISMO',kind:'VR Adventure Game',layout:'gran-turismo',previewImage:'assets/gran-turismo-atlas-cover.webp?rev=20261120-opening-frame'},
  {href:'figures-of-speech/',title:'Figures of Speech',tone:'light',layout:'figures'},
  {href:'vr-for-skill-learning/',title:vr.title,layout:'vr'},
  aiGameDesign,
  {href:'driveframe/',title:'DRIVEFRAME',description:'Track &amp; mountain drive tracker.',tone:'dark',layout:'driveframe',previewImage:'driveframe/media/dashboard.webp',previewWidth:1280,previewHeight:600},
  {href:'world-sensing-music-station/',title:'World Sensing Music Station',kind:'Physical computing',description:'A handheld instrument that turns movement and space into sound.',tone:'light',previewImage:'world-sensing-music-station/device.svg',previewWidth:1000,previewHeight:800,previewClass:'device',previewEffect:'device'},
  {href:'multiverse-all-star-battlefront/',title:'Multiverse All-Star Battlefront',tone:'light',layout:'battlefront'}
];
function preview(project) {
  const image = project.image || `<img src="${project.previewImage}" width="${project.previewWidth||960}" height="${project.previewHeight||540}" alt="" loading="lazy" decoding="async" draggable="false">`;
  if (!project.effect) return `<div class="project-card-preview${project.previewClass?` project-card-preview--${project.previewClass}`:''}"${project.previewEffect?` data-project-effect="${project.previewEffect}"`:''} aria-hidden="true">${image}</div>`;
  return `<div class="project-preview project-preview--polaroid" data-project-effect="polaroid" aria-hidden="true"><div class="photo-print"><div class="photo-image">${image}<span class="photo-emulsion"></span></div><span class="photo-sheen"></span></div></div>`;
}
function granTurismoCard(project) {
  assert(fs.existsSync(new URL(project.previewImage, output)), 'The Gran Turismo atlas cover must ship with Projects.');
  return `<li class="project-feature project-feature--gran-turismo"><a class="directory-link" href="${project.href}" target="_blank" rel="noopener noreferrer" aria-labelledby="gran-turismo-title" aria-describedby="gran-turismo-kind gran-turismo-new-tab" draggable="false"><img class="gran-turismo-cover" src="${project.previewImage}" width="1680" height="900" alt="" loading="lazy" decoding="async" draggable="false"><div class="gran-turismo-caption"><h2 id="gran-turismo-title">${project.title}</h2><p id="gran-turismo-kind">${project.kind}</p><span id="gran-turismo-new-tab" hidden>Opens in a new tab</span></div></a></li>`;
}
function vrCard(project) {
  const panels = '<span class="vr-card-panel"></span>'.repeat(4);
  return `<li class="project-card project-tone--dark project-card--vr"><a class="directory-link" href="${project.href}" aria-labelledby="vr-card-title" draggable="false"><div class="vr-card-stage" data-project-effect="vr" aria-hidden="true"><div class="vr-card-map"><div class="vr-card-folds">${panels}</div></div></div><h2 id="vr-card-title">${project.title}</h2></a></li>`;
}
function battlefrontCard(project) {
  const panels = [matchup.player, matchup.opponent].map(({ drawing, name }) => `<div class="battlefront-panel battlefront-panel--${drawing}">${lineFighter(drawing, name)}</div>`).join('');
  return `<li class="project-card project-tone--light project-card--battlefront"><a class="directory-link" href="${project.href}" aria-labelledby="battlefront-card-title" draggable="false"><div class="battlefront-matchup" aria-hidden="true">${panels}</div><div class="battlefront-caption"><h2 id="battlefront-card-title">${project.title}</h2></div></a></li>`;
}
const entries = projects.map((p,i)=>{
  if (p.layout === 'gran-turismo') return granTurismoCard(p);
  if (p.layout === 'vr') return vrCard(p);
  if (p.layout === 'battlefront') return battlefrontCard(p);
  if (p.previewEffect === 'device') return `<li class="project-card project-tone--light project-card--music"><a class="directory-link" href="${p.href}" aria-labelledby="music-card-title" draggable="false"><div class="project-card-preview project-card-preview--device" data-project-effect="device" aria-hidden="true"><img src="${p.previewImage}" width="1000" height="800" alt="" loading="lazy" decoding="async" draggable="false"></div><h2 id="music-card-title">World Sensing<br>Music Station</h2></a></li>`;
  if (p.layout === 'figures') return `<li class="project-card project-tone--light project-card--figures"><a class="directory-link" href="${p.href}" aria-labelledby="figures-card-title" draggable="false"><div class="figures-title-stack"><h2 id="figures-card-title">${p.title}</h2><span aria-hidden="true">${p.title}</span><span aria-hidden="true">${p.title}</span></div><div class="figures-dictionary"><p class="figures-pronunciation">${figuresPronunciation}</p><p>${figuresDefinition}</p></div></a></li>`;
  const media=preview(p);
  const kind = p.kind ? `<p class="project-kind">${p.kind}</p>` : '';
  return `<li class="${p.effect?'project-feature':'project-card'} project-tone--${p.tone||'dark'}${p.layout?` project-card--${p.layout}`:''}${p.theme?` project-theme--${p.theme}`:''}"><a class="directory-link" href="${p.href}" draggable="false">${p.effect?'':media}<div class="project-copy">${kind}<h2 class="directory-title"${i===0?' id="polaroid-link-title"':''}>${p.title}</h2><p class="directory-description">${p.description}</p></div>${p.effect?media:''}</a></li>`;
}).join('\n');
fs.writeFileSync(output, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#061b62"><meta name="description" content="Games, tools, and experiments in interaction by Smart Chen.">
<title>Projects — Smart Chen</title>${siteFavicon('../')}
<link rel="preload" href="../assets/fonts/gotham/gotham-book.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../site.css"><link rel="stylesheet" href="../assets/fonts/gotham/gotham.css"><link rel="stylesheet" href="projects.css?rev=20261125-driveframe-caption">
${projectHeaderAssets('../')}<script type="module" src="projects.mjs?rev=20261117-atlas-cover"></script></head>
<body class="projects-directory" id="top"><a class="projects-skip" href="#main">Skip to projects</a>
${header}
<main class="projects-main" id="main"><div class="projects-intro"><h1 id="page-title">Projects</h1></div>
<ol class="directory" role="list" aria-label="Portfolio projects">${entries}</ol></main>
<footer class="projects-footer"><p>Smart Chen</p><a href="#top">Back to top</a></footer></body></html>\n`);
console.log('Rendered Projects.');
