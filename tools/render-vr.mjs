import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(root, 'tools/vr-source/content.json'), 'utf8'));
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const e = escape;
const nuts = [[160,62],[210,98],[191,157],[129,157],[110,98]];
const wheel = `<svg viewBox="0 0 320 230" aria-hidden="true" class="wheel-diagram">
  <path class="ground" d="M30 198H290"/><g class="wheel"><circle class="tire" cx="160" cy="115" r="82"/><circle class="rim" cx="160" cy="115" r="61"/><circle class="hub" cx="160" cy="115" r="18"/>
  ${nuts.map(([x,y])=>`<path class="spoke" d="M160 115L${x} ${y}"/>`).join('')}
  <path class="star" d="M160 62L191 157L110 98L210 98L129 157Z"/>
  ${nuts.map(([x,y],i)=>`<circle class="nut nut-${i}" cx="${x}" cy="${y}" r="7"/>`).join('')}</g>
  <g class="jack"><path d="M61 191H106M66 190L83 158L101 190M69 172H97M83 158V146M76 146H90M102 182L125 166"/></g>
  <g class="rack"><path d="M264 174V201H222V174M220 201H268"/><circle cx="244" cy="169" r="23"/><circle cx="244" cy="169" r="13"/></g>
  <path class="lift-arrow" d="M281 144V83M272 92L281 83L290 92"/>
</svg>`;
const map = `<svg viewBox="0 0 520 230" aria-hidden="true" class="space-diagram">
  <g class="map-garage"><path class="room-outline" d="M24 30H196V194H147M92 194H24Z"/><path class="furniture" d="M37 43H103V65H37ZM37 82H61V140H37ZM132 43H183V65H132ZM132 79H183V115H132Z"/><path class="arrival" d="M100 151H139V178H100Z"/></g>
  <path class="connection" d="M119 164H261V112H410V124"/><path class="travel-path" d="M119 164H261V112H410V124" pathLength="1"/><path class="direction" d="M250 156L259 164L250 172"/>
  <g class="map-store"><path class="room-outline" d="M326 89V30H496V194H326V137"/><path class="furniture" d="M345 48H397V71H345ZM425 48H477V71H425ZM345 92H397V115H345ZM425 92H477V115H425ZM345 139H397V162H345ZM425 139H477V162H425Z"/></g>
  <circle class="location" cx="119" cy="164" r="8"/><text x="24" y="221">HOME GARAGE</text><text x="326" y="221">AUTO PARTS STORE</text>
</svg>`;

function interaction(a) {
  if (a.steps) return `<div class="study procedure" data-procedure data-step="0">
    <div class="study-top"><h3>One action leads to the next.</h3><span class="utility scroll-hint">Scroll to explore / 04 steps</span></div>
    <div class="study-stage"><div class="story-stops" role="group" aria-label="Explore the wheel removal sequence">${a.steps.map((s,i)=>`<div class="story-stop" data-scroll-stop><button type="button" disabled data-step-button="${i}" aria-pressed="${i===0}" aria-controls="procedure-caption"><span class="step-index">${String(i+1).padStart(2,'0')}</span><span>${e(s.title)}</span><span class="step-arrow" aria-hidden="true">↗</span></button><p>${e(s.description)}</p></div>`).join('')}</div>
    <div class="study-visual"><div class="diagram-figure">${wheel}<span class="utility diagram-label">Sequence schematic</span></div><div class="study-progress" aria-hidden="true"><span></span></div><p class="study-caption" id="procedure-caption" aria-live="off">${e(a.steps[0].title)}</p></div></div>
  </div>`;
  return `<div class="study navigation-study" data-navigation data-space="garage">
    <div class="study-top"><h3>Two spaces. One preparation loop.</h3><span class="utility scroll-hint">Scroll to explore / 02 spaces</span></div>
    <div class="study-stage"><div class="story-stops" role="group" aria-label="Explore the two environments">${a.spaces.map((s,i)=>`<div class="story-stop" data-scroll-stop><button type="button" disabled data-space-button="${s.id}" aria-pressed="${i===0}" aria-controls="space-caption"><span class="space-dot" aria-hidden="true"></span><span>${e(s.title)}</span><span class="step-arrow" aria-hidden="true">↗</span></button><p>${e(s.description)}</p></div>`).join('')}</div>
    <div class="study-visual"><div class="diagram-figure">${map}<span class="utility diagram-label">Two-scene schematic</span></div><div class="study-progress" aria-hidden="true"><span></span></div><p class="study-caption" id="space-caption" aria-live="off">${e(a.spaces[0].title)}</p></div></div>
  </div>`;
}

function assignment(a) {
  return `<section class="assignment wrap" id="${a.id}" aria-labelledby="${a.id}-title">
    <div class="assignment-heading"><span class="assignment-number" aria-hidden="true">${a.number}</span><div class="assignment-name"><p class="utility">${e(a.assignment)} / ${e(a.topic)}</p><h2 id="${a.id}-title">${e(a.title)}</h2></div><p class="description">${e(a.description)}</p></div>
    <div class="project-body"><div class="project-media"><figure class="video"><iframe width="960" height="540" src="https://www.youtube-nocookie.com/embed/${a.video}?start=${a.start}&amp;rel=0" title="${e(a.title)} — demonstration" loading="eager" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe><figcaption><span class="utility">${a.number} / Project demonstration</span><a href="https://www.youtube.com/watch?v=${a.video}&amp;t=${a.start}s" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a></figcaption></figure>
    </div><aside class="project-notes"><div class="focus-note"><p class="utility">The learning focus</p><h3>${e(a.focus)}</h3><p>${e(a.note)}</p></div>
    <a class="document-link" href="files/${a.pdf}" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 32 40" aria-hidden="true"><path d="M3 1H21L29 9V39H3ZM21 1V10H29M9 20H23M9 26H23M9 32H18"/></svg><span><span class="utility">A${Number(a.number)} / Design document</span><span>Read the original <span aria-hidden="true">↗</span></span><small>PDF · ${a.pages} ${a.pages===1?'page':'pages'} · opens in a new tab</small></span></a>
    <details><summary>${e(a.detailTitle)}</summary><p>${e(a.detail)}</p></details></aside></div>
    ${interaction(a)}
  </section>`;
}

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f3f2ec">
  <meta name="description" content="${e(content.subtitle)}">
  <title>${e(content.title)} | Smart Chen</title>
  <link rel="canonical" href="https://smartchen2005.github.io/projects/vr-for-skill-learning/">
  <link rel="stylesheet" href="vr.css?v=scroll-2">
  <script type="module" src="vr.mjs?v=scroll-2"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead wrap"><a class="brand" href="../../">Smart Chen</a><nav aria-label="Primary navigation"><a href="../">Projects <span aria-hidden="true">↗</span></a><a href="../../">Home</a></nav></header>
  <main id="main">
    <section class="hero wrap" aria-labelledby="page-title">
      <div class="hero-top utility"><span>VR / Interaction Design</span><span>${e(content.year)}</span></div>
      <div class="hero-composition"><h1 id="page-title"><span>VR for</span><span>Skill Learning<span class="title-period">.</span></span></h1>
      <div class="hero-art" aria-hidden="true"><svg viewBox="0 0 460 460"><defs><clipPath id="disc-cut"><rect x="45" y="30" width="360" height="360"/></clipPath><pattern id="lines" patternUnits="userSpaceOnUse" width="9" height="9" patternTransform="rotate(-35)"><path d="M0 0V9" class="hatch-line"/></pattern></defs><path class="art-axis" d="M15 255H445M230 10V445"/><circle class="art-orbit" cx="230" cy="230" r="184"/><circle class="blue-disc" cx="230" cy="210" r="142"/><path class="paper-cut" d="M230 68A142 142 0 0 1 230 352Z"/><path class="hatched-half" d="M230 68A142 142 0 0 1 230 352Z"/><path class="orange-quarter" d="M230 210H390A160 160 0 0 1 230 370Z"/><path class="art-link" d="M125 335H230V210H349"/><circle class="art-node" cx="125" cy="335" r="9"/><circle class="art-node end" cx="349" cy="210" r="9"/><path class="art-cross" d="M27 34H43M35 26V42M417 414H433M425 406V422"/></svg><span class="art-caption utility">Action / Sequence / Space</span></div></div>
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
const client = { steps: content.assignments.find(a => a.steps)?.steps, spaces: content.assignments.find(a => a.spaces)?.spaces };
fs.writeFileSync(path.join(root, 'dist/projects/vr-for-skill-learning/interaction-data.mjs'), `// Generated by tools/render-vr.mjs.\nexport default ${JSON.stringify(client, null, 2)};\n`);
console.log(`Rendered ${content.title}: ${content.assignments.length} assignments, videos and original PDF links.`);
