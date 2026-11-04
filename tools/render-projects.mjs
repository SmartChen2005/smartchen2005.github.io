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
  {href:'polaroid-of-yesterday/',title:'Polaroid of Yesterday',kind:'Narrative puzzle game',description:'A first-person game about photography, memory, and the stories we construct.',image:`<img ${renditionAttributes(room,'../',{sizes:'(max-width: 700px) calc(100vw - 80px), 520px',priority:true})} alt="" decoding="async" fetchpriority="high">`},
  {href:'gran-turismo/',title:'Gran Turismo',kind:'VR exploration',description:'A journey through the ruins of a lost civilization.',image:'<img src="assets/gran-turismo-demo.jpg" width="480" height="360" alt="" loading="lazy" decoding="async">'},
  {href:'figures-of-speech/',title:'Figures of Speech',kind:'Motion & interface design',description:'An evolving collection of interactive studies from VegShark.com.'},
  {href:'https://handbook.vegshark.com/',title:'The Vibe Coding Game Design Handbook',kind:'Game design resource',description:'handbook.vegshark.com',external:true},
  {href:'vr-for-skill-learning/',title:'VR for Skill Learning',kind:'VR interaction',description:'Practical skills, procedural guidance, and spatial learning.'},
  {href:'world-sensing-music-station/',title:'World Sensing Music Station',kind:'Physical computing',description:'A handheld instrument that turns movement and space into sound.'},
  {href:'multiverse-all-star-battlefront/',title:'Multiverse All-Star Battlefront',kind:'AI game experiment',description:'Imagined characters become pixel-art fighters and generated comics.'}
];
const entries = projects.map((p,i)=>`<li class="${p.image?'project-feature':'project-card'}"><a class="directory-link" href="${p.href}"${p.external?' target="_blank" rel="noopener noreferrer"':''} draggable="false"><div class="project-copy"><p class="project-kind">${p.kind}${p.external?' <span class="project-external">· Opens in a new tab</span>':''}</p><div class="project-heading"><h2 class="directory-title"${i===0?' id="polaroid-link-title"':''}>${p.title}</h2><span class="directory-arrow" aria-hidden="true">${northEastArrow}</span></div><p class="directory-description">${p.description}</p></div>${p.image?`<div class="project-preview">${p.image}</div>`:''}</a></li>`).join('\n');
fs.writeFileSync(output, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#070707"><meta name="description" content="Games, tools, and experiments in interaction by Smart Chen.">
<title>Projects — Smart Chen</title>${siteFavicon('../')}
<link rel="stylesheet" href="../site.css"><link rel="stylesheet" href="projects.css?rev=20261104-compact-cards">
${projectHeaderAssets('../')}<script type="module" src="projects.mjs?rev=20261104-apple"></script></head>
<body class="projects-directory" id="top"><a class="projects-skip" href="#main">Skip to projects</a>
${header}
<main class="projects-main" id="main"><div class="projects-intro"><h1 id="page-title">Projects</h1></div>
<ol class="directory" role="list" aria-label="Portfolio projects">${entries}</ol></main>
<footer class="projects-footer"><p>Smart Chen</p><a href="#top">Back to top</a></footer></body></html>\n`);
console.log('Rendered Projects: preserved Header, seven native links, Polaroid followed by Gran Turismo.');
