import fs from 'node:fs';
import { siteFavicon } from './site-favicon.mjs';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { wheel, map, lugPoints, starOrder } from './vr-illustrations.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(root, 'tools/vr-source/content.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const e = escape;
function interaction(a) {
  const procedure = Boolean(a.steps);
  const items = procedure ? a.steps : a.journey;
  const caption = procedure ? 'procedure-caption' : 'space-caption';
  return `<div class="study ${procedure ? 'procedure' : 'navigation-study'}" ${procedure ? 'data-procedure data-step="0"' : 'data-navigation data-space="garage"'}>
    <div class="study-top"><h3>${procedure ? 'One action leads to the next.' : 'Two spaces. One preparation loop.'}</h3></div>
    <div class="study-stage"><div class="study-visual"><div class="diagram-figure">${procedure ? wheel : map}<span class="utility diagram-label">${procedure ? 'Interaction study / Sequence, tools &amp; feedback' : 'Interaction study / Linked scenes &amp; persistent inventory'}</span></div><div class="study-progress" aria-hidden="true"><span></span></div><p class="study-caption" id="${caption}" aria-live="off">${e(items[0].title)}</p></div>
    <div class="story-stops" role="group" aria-label="${procedure ? 'Explore the wheel removal sequence' : 'Explore the preparation loop'}">${items.map((item,i)=>`<div class="story-stop" data-scroll-stop><button type="button" disabled ${procedure ? 'data-step-button' : 'data-journey-button'}="${i}" aria-pressed="${i===0}" aria-controls="${caption}"><span class="step-index">${String(i+1).padStart(2,'0')}</span><span>${e(item.title)}</span><span class="step-arrow" aria-hidden="true">&#8599;</span></button>${item.space ? `<span class="utility scene-name">${item.space === 'garage' ? 'Home Garage' : 'Auto Parts Store'}</span>` : ''}<p>${e(item.description)}</p></div>`).join('')}</div></div>
  </div>`;
}

function assignment(a) {
  return `<section class="assignment wrap" id="${a.id}" aria-labelledby="${a.id}-title">
    <div class="assignment-heading"><span class="assignment-number" aria-hidden="true">${a.number}</span><div class="assignment-name"><p class="utility">${e(a.topic)}</p><h2 id="${a.id}-title">${e(a.title)}</h2></div></div>
    ${interaction(a)}
    <p class="description">${e(a.description)}</p>
    <div class="project-body"><div class="project-media"><figure class="video"><iframe width="960" height="540" src="https://www.youtube-nocookie.com/embed/${a.video}?start=${a.start}&amp;rel=0" title="${e(a.title)} — demonstration" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe><figcaption><span class="utility">${a.number} / Project demonstration</span><a href="https://www.youtube.com/watch?v=${a.video}&amp;t=${a.start}s" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a></figcaption></figure>
    </div><aside class="project-notes"><div class="focus-note"><p class="utility">The learning focus</p><h3>${e(a.focus)}</h3><p>${e(a.note)}</p></div>
    <a class="document-link" href="files/${a.pdf}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 1H21L29 9V39H3ZM21 1V10H29M9 20H23M9 26H23M9 32H18"/></svg><span><span class="utility">A${Number(a.number)} / Design document</span><span>Read the original <span aria-hidden="true">↗</span></span><small>PDF · ${a.pages} ${a.pages===1?'page':'pages'} · opens in a new tab</small></span></a>
    <details><summary>${e(a.detailTitle)}</summary><p>${e(a.detail)}</p></details></aside></div>
  </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f3f2ec">
  <meta name="description" content="${e(content.subtitle)}">
  ${siteFavicon('../../')}
  <title>${e(content.title)} | Smart Chen</title>
  <link rel="canonical" href="https://smartchen2005.github.io/projects/vr-for-skill-learning/">
  <link rel="stylesheet" href="vr.css?v=interaction-3">
  ${projectHeaderAssets('../../')}
  <script type="module" src="vr.mjs?v=interaction-3"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${projectHeader({ theme: 'light' })}
  <main id="main">
    <section class="hero wrap" aria-labelledby="page-title">
      <div class="hero-top utility"><span>VR / Interaction Design</span><span>${e(content.year)}</span></div>
      <div class="hero-composition"><h1 id="page-title"><span>VR for</span><span>Skill Learning<span class="title-period">.</span></span></h1>
      </div>
      <div class="hero-bottom"><p>${e(content.subtitle)}</p><nav aria-label="Project assignments"><span class="utility">${String(content.assignments.length).padStart(2,'0')} Projects</span>${content.assignments.map(a=>`<a href="#${a.id}"><span class="utility">${a.number}</span> ${e(a.title)} <span aria-hidden="true">↓</span></a>`).join('')}</nav></div>
    </section>
    ${content.assignments.map(assignment).join('\n')}
    <section class="closing wrap" aria-labelledby="closing-title"><p class="utility">03 / An ongoing exploration</p><div><h2 id="closing-title">${e(content.closing)}</h2><p>${e(content.reflection)}</p><a class="return-link" href="../">All projects <span aria-hidden="true">↗</span></a></div><div class="closing-mark" aria-hidden="true"><span></span><span></span><span></span></div></section>
  </main>
  <footer class="footer wrap"><a href="../../">Smart Chen</a><span>VR for Skill Learning</span><a href="#main">Back to top ↑</a></footer>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'dist/projects/vr-for-skill-learning/index.html'), html);
const client = { steps: content.assignments.find(a => a.steps)?.steps, journey: content.assignments.find(a => a.journey)?.journey, lugPoints, starOrder };
fs.writeFileSync(path.join(root, 'dist/projects/vr-for-skill-learning/interaction-data.mjs'), `// Generated by tools/render-vr.mjs.\nexport default ${JSON.stringify(client, null, 2)};\n`);
console.log(`Rendered ${content.title}: ${content.assignments.length} assignments, videos and original PDF links.`);
