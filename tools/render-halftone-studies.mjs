import fs from 'node:fs/promises';
import { studyIds, loadStudy } from '../dist/projects/figures-of-speech/halftone-bloom/study-list.mjs';

const root = new URL('../dist/projects/figures-of-speech/halftone-bloom/', import.meta.url);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const studies = await Promise.all(studyIds.map(async id => ({ id, ...(await loadStudy(id)).meta })));
const head = (title, description) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#000000">
  <meta name="robots" content="noindex">
  <meta name="description" content="${escape(description)}">
  <title>${escape(title)} · Halftone Studies</title>
  <link rel="icon" href="../../../../favicon.ico">
  <link rel="stylesheet" href="../../../../site-cursor.css?rev=20261028-drag-axis">
  <script type="module" src="../../../../site-cursor.mjs?rev=20261028-drag-axis"></script>
  <link rel="stylesheet" href="../bloom.css">
  <link rel="stylesheet" href="../studies.css">
  <script type="module" src="../studies.mjs"></script>
</head>`;

for (let index = 0; index < studies.length; index++) {
  const study = studies[index], next = studies[(index + 1) % studies.length];
  const html = `${head(study.title, study.description)}
<body class="study-page" data-study="${study.id}">
  <main class="experiment" id="experiment">
    <header class="masthead"><p>Halftone / ${String(index + 1).padStart(2, '0')}</p><a href="../studies/">All studies</a></header>
    <div class="art-stage"><canvas id="field" aria-hidden="true"></canvas></div>
    <div class="study-heading"><h1>${escape(study.title)}</h1><p>${escape(study.description)}</p></div>
    <footer class="controls" id="controls" hidden>
      <button class="replay" id="replay" type="button" aria-keyshortcuts="R" disabled>Replay <kbd aria-hidden="true">R</kbd></button>
      <button class="play" id="play" type="button" aria-label="Pause animation" disabled>Pause</button>
      <div class="timeline"><label class="visually-hidden" for="seek">Animation timeline</label><input id="seek" type="range" min="0" max="1000" step="1" value="0" disabled><output class="time" id="clock" aria-live="off">0.0 / ${study.duration.toFixed(1)} s</output></div>
      <a class="next-study" href="../${next.id}/">Next: ${escape(next.title)}</a>
      <details class="adjust" id="adjust"><summary>Adjust <span class="toggle-mark" aria-hidden="true">+</span></summary>
        <div class="adjust-panel">
          <label for="density">Density <output id="density-value" for="density" aria-live="off">100%</output></label>
          <input id="density" type="range" min="50" max="150" step="5" value="100">
          <label for="speed">Speed <output id="speed-value" for="speed" aria-live="off">1.0×</output></label>
          <input id="speed" type="range" min="0.5" max="2" step="0.1" value="1">
          <p>Pause or scrub to explore a moment.</p>
        </div>
      </details>
    </footer>
    <div class="fallback" id="failure" hidden><p>The artwork could not load.</p><button id="retry" type="button" disabled>Retry</button></div>
    <p class="visually-hidden" id="status" role="status"></p>
    <noscript><p class="fallback">Enable JavaScript to play this study.</p></noscript>
  </main>
</body>
</html>
`;
  await fs.mkdir(new URL(`${study.id}/`, root), { recursive: true });
  await fs.writeFile(new URL(`${study.id}/index.html`, root), html);
}

const cards = studies.map((study, index) => `      <a class="study-card" href="../${study.id}/">
        <div class="poster"><canvas width="720" height="520" data-poster="${study.id}" aria-hidden="true"></canvas><span class="poster-fallback">${escape(study.title)} · Open study</span></div>
        <div class="study-caption"><span class="number">${String(index + 1).padStart(2, '0')}</span><h2>${escape(study.title)}</h2><span class="open">Open study</span></div>
        <p>${escape(study.description)}</p>
      </a>`).join('\n');
const collection = `${head('Five ways to bloom', 'Five independent monochrome motion experiments. Photographs, moonlight, petals, fish and waves, all made of tiny square pixels.')}
<body class="studies-page">
  <header class="masthead"><p>Halftone studies</p><a href="../">Original Bloom</a></header>
  <main class="collection">
    <div class="collection-intro"><h1>Five ways<br>to bloom.</h1><p>One material, five experiments.<br>White pixels become images, living forms and moving landscapes.</p></div>
    <div class="study-grid">
${cards}
    </div>
    <footer class="collection-footer"><span>Each study has replay, pause and a timeline.</span><a href="../../">Figures of Speech</a></footer>
  </main>
</body>
</html>
`;
await fs.mkdir(new URL('studies/', root), { recursive: true });
await fs.writeFile(new URL('studies/index.html', root), collection);
console.log('Rendered five independent halftone studies and their unlisted collection.');
