import fs from 'node:fs';
import assert from 'node:assert/strict';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { siteFavicon } from './site-favicon.mjs';
import { northEastArrow } from './site-icons.mjs';
import { imageRendition, renditionAttributes } from './gallery-media.mjs';
const output = new URL('../dist/projects/index.html', import.meta.url);
const header = projectHeader({base:'../', current:true});
const current = fs.readFileSync(output, 'utf8').match(/<header class="project-header\b[\s\S]*?<\/header>/)?.[0];
assert.equal(current, header, 'Preserve the existing shared Header exactly.');
const room = imageRendition('projects/polaroid-of-yesterday/assets/room.jpg');
assert(room, 'Reuse the existing optimized Polaroid screenshot.');
const projects = [
  {href:'polaroid-of-yesterday/',title:'Polaroid of Yesterday',kind:'Narrative puzzle game',description:'A first-person game about photography, memory, and the stories we construct.',theme:'polaroid',effect:'polaroid',image:`<img ${renditionAttributes(room,'../',{sizes:'(max-width: 700px) calc(100vw - 80px), 520px',priority:true})} alt="" decoding="async" fetchpriority="high" draggable="false">`},
  {href:'gran-turismo/',title:'Gran Turismo',kind:'VR exploration',description:'A journey through the ruins of a lost civilization.',effect:'stars',previewImage:'assets/project-placeholder.svg'},
  {href:'figures-of-speech/',title:'Figures of Speech',kind:'Motion & interface design',description:'An evolving collection of interactive studies from VegShark.com.',previewImage:'assets/project-placeholder.svg'},
  {href:'https://handbook.vegshark.com/',title:'The Vibe Coding Game Design Handbook',kind:'Game design resource',description:'handbook.vegshark.com',external:true,previewImage:'assets/project-placeholder.svg'},
  {href:'vr-for-skill-learning/',title:'VR for Skill Learning',kind:'VR interaction',description:'Practical skills, procedural guidance, and spatial learning.',previewImage:'assets/project-placeholder.svg'},
  {href:'world-sensing-music-station/',title:'World Sensing Music Station',kind:'Physical computing',description:'A handheld instrument that turns movement and space into sound.',previewImage:'world-sensing-music-station/device.svg',previewWidth:1000,previewHeight:800,previewClass:'device',previewEffect:'device'},
  {href:'multiverse-all-star-battlefront/',title:'Multiverse All-Star Battlefront',kind:'AI game experiment',description:'Imagined characters become pixel-art fighters and generated comics.',previewImage:'assets/project-placeholder.svg'}
];
function starfield() {
  let seed = 4127;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  return [{depth:.25,count:64},{depth:.55,count:56},{depth:1,count:40}].map(({depth,count})=>{
    const stars = Array.from({length:count},()=>{
      const x=random()*100, y=random()*100;
      const size=.7+depth*.65+random()*.65;
      const alpha=(.35+depth*.25+random()*.35)*(x<49 && y>22 && y<78 ? .28 : 1);
      return `<span class="starfield-star" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;width:${size.toFixed(2)}px;height:${size.toFixed(2)}px;opacity:${alpha.toFixed(3)}"></span>`;
    }).join('');
    return `<span class="starfield-layer" data-star-depth="${depth}">${stars}</span>`;
  }).join('');
}
function preview(project) {
  const image = project.image || `<img src="${project.previewImage}" width="${project.previewWidth||960}" height="${project.previewHeight||540}" alt="" loading="lazy" decoding="async" draggable="false">`;
  if (!project.effect) return `<div class="project-card-preview${project.previewClass?` project-card-preview--${project.previewClass}`:''}"${project.previewEffect?` data-project-effect="${project.previewEffect}"`:''} aria-hidden="true">${image}</div>`;
  if (project.effect === 'stars') return `<div class="project-preview project-preview--stars" data-project-effect="stars" aria-hidden="true">${starfield()}</div><div class="project-preview project-preview--cover" aria-hidden="true">${image}</div>`;
  return `<div class="project-preview project-preview--polaroid" data-project-effect="polaroid" aria-hidden="true"><div class="photo-print"><div class="photo-image">${image}<span class="photo-emulsion"></span></div><span class="photo-sheen"></span></div></div>`;
}
const entries = projects.map((p,i)=>{
  const media=preview(p);
  return `<li class="${p.effect?'project-feature':'project-card'}${p.theme?` project-theme--${p.theme}`:''}"><a class="directory-link" href="${p.href}"${p.external?' target="_blank" rel="noopener noreferrer"':''} draggable="false">${p.effect?'':media}<div class="project-copy"><p class="project-kind">${p.kind}${p.external?' <span class="project-external">· Opens in a new tab</span>':''}</p><div class="project-heading"><h2 class="directory-title"${i===0?' id="polaroid-link-title"':''}>${p.title}</h2><span class="directory-arrow" aria-hidden="true">${northEastArrow}</span></div><p class="directory-description">${p.description}</p></div>${p.effect?media:''}</a></li>`;
}).join('\n');
fs.writeFileSync(output, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#070707"><meta name="description" content="Games, tools, and experiments in interaction by Smart Chen.">
<title>Projects — Smart Chen</title>${siteFavicon('../')}
<link rel="stylesheet" href="../site.css"><link rel="stylesheet" href="projects.css?rev=20261104-device-tilt">
${projectHeaderAssets('../')}<script type="module" src="projects.mjs?rev=20261104-device-tilt"></script></head>
<body class="projects-directory" id="top"><a class="projects-skip" href="#main">Skip to projects</a>
${header}
<main class="projects-main" id="main"><div class="projects-intro"><h1 id="page-title">Projects</h1></div>
<ol class="directory" role="list" aria-label="Portfolio projects">${entries}</ol></main>
<footer class="projects-footer"><p>Smart Chen</p><a href="#top">Back to top</a></footer></body></html>\n`);
console.log('Rendered Projects: preserved Header, seven native links, Polaroid followed by Gran Turismo.');
