import fs from 'node:fs';
import { normalizeSiteArrows } from './site-icons.mjs';
import { siteFavicon } from './site-favicon.mjs';
import { studies, experimentURL, preservedEdition, studyEdition } from './figures-of-speech.mjs';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const emphasis = value => escape(value).replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
const date = value => value.replaceAll('-', '.');
const revision = (item, study) => `<li><time datetime="${item[0]}">${date(item[0])}</time><span>${escape(item[2])}</span><a href="https://github.com/SmartChen2005/smartchen2005.github.io/commit/${item[1]}" target="_blank" rel="noopener noreferrer" aria-label="Source record for ${escape(study.title)} on ${item[0]} (opens in a new tab)">Record</a></li>`;

const grid = studies.map(study => `<a class="specimen" href="${experimentURL(study)}" data-study="${study.id}" aria-label="Open ${escape(study.title)} study">
      <div class="specimen-top"><span>FIG. ${study.number}</span><span>${escape(study.kind)}</span></div>
      <figure class="specimen-image specimen-image--${study.world}"><img src="assets/${study.image}" alt="${escape(study.alt)}" width="1280" height="720" ${study.id === '001' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>
      <div class="specimen-caption"><h2>${escape(study.title)}</h2><p>${escape(study.location)}</p><div><time datetime="${study.first}">${date(study.first)}</time><span class="specimen-open">View study</span></div></div>
    </a>`).join('\n');

const records = studies.flatMap(study => study.history.map(item => ({item, study}))).sort((a,b) => a.item[0].localeCompare(b.item[0]) || a.study.id.localeCompare(b.study.id));
const chronology = records.map(({item,study}) => `<li><time datetime="${item[0]}">${date(item[0])}</time><a href="${experimentURL(study)}" data-study="${study.id}"><span class="record-number">FIG. ${study.number}</span><strong>${escape(study.title)}</strong><span>${escape(item[2])}</span></a></li>`).join('\n');
const panels = studies.map(study => `<article data-panel="${study.id}" hidden><p class="study-type">${escape(study.kind)} / ${escape(study.location)}</p><p class="study-description">${escape(study.description)}</p><h3>Design perspective</h3><p>${emphasis(study.perspective)}</p><h3>Recorded development</h3><ol class="revision-list">${study.history.map(item => revision(item,study)).join('')}</ol><p class="record-note">Interactive edition preserved ${date(studyEdition(study).slice(0,10))}. Earlier development records are linked above.</p></article>`).join('\n');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffffff">
  <meta name="description" content="Figures of Speech — studies in motion and interface design by Smart Chen. An interactive index of VegShark.com, with dated development records.">
  ${siteFavicon('../../')}
  <title>Figures of Speech — Smart Chen</title>
  ${projectHeaderAssets('../../')}
  <link rel="stylesheet" href="figures.css?v=20261029-definition">
  <script type="module" src="figures.mjs?v=20261029-stories"></script>
</head>
<body>
  <a class="skip-link" href="#index">Skip to the index</a>
  ${projectHeader({theme:'light'})}
  <main class="archive">
    <header class="archive-cover">
      <div class="cover-meta"><span>Smart Chen / VegShark.com</span><span>2026 — Ongoing</span></div>
      <h1>Figures of Speech</h1>
      <div class="cover-definition">
        <p class="cover-pronunciation">/ˌfiɡyər əv ˈspēCH/</p>
        <p>A <dfn>figure of speech</dfn> is a word or phrase that departs from literal meaning to express ideas in a more vivid, creative, or impactful way</p>
      </div>
      <div class="cover-bottom"><p>Studies in Motion &amp; Interface Design</p><p>An evolving index of objects, interactions,<br>and the ideas behind this website.</p></div>
    </header>
    <div class="index-bar" id="index"><p><span id="view-label">Index</span> <span class="entry-count">/ ${studies.length} studies</span></p><div class="view-switch" aria-label="Archive view" hidden><button type="button" data-view="index" aria-pressed="true">Index</button><button type="button" data-view="chronology" aria-pressed="false">Chronology</button></div></div>
    <section class="specimen-grid" id="index-view" aria-label="Design studies">${grid}</section>
    <section id="chronology-view" aria-label="Recorded design chronology" hidden><p class="chronology-intro">Selected moments in the development of VegShark.com. Dates follow the source archive.</p><ol class="chronology-list">${chronology}</ol></section>
    <footer class="archive-colophon"><p>Design &amp; direction: Smart Chen<br>Developed through design experiments with AI.</p><p>Visual reference: Virgil Abloh,<br><a href="https://mcachicago.org/stories/editorial/virgil-abloh-figures-of-speech/" target="_blank" rel="noopener noreferrer">Figures of Speech, 2019</a></p><p>Index opened 2026.10.27<br>To be continued.</p></footer>
  </main>
  <dialog class="study-dialog" aria-labelledby="study-title">
    <div class="dialog-header"><p id="study-number"></p><h2 id="study-title"></h2><button type="button" id="close-study" autofocus>Close</button></div>
    <div class="study-layout"><div class="study-work"><div class="preview-stage" aria-busy="false"><img id="study-poster" alt="" width="1280" height="720"><div id="frame-slot"></div><p id="preview-status" role="status" aria-live="polite"></p></div><div class="preview-controls"><a id="new-page-link" href="editions/${preservedEdition}/personal-card/" target="_blank" rel="noopener noreferrer">Open in New Page</a></div><p id="preview-instruction"></p></div><div class="study-notes">${panels}</div></div>
  </dialog>
</body>
</html>
`;
fs.mkdirSync('dist/projects/figures-of-speech', {recursive:true});
fs.writeFileSync('dist/projects/figures-of-speech/index.html', normalizeSiteArrows(html));
// Ship the same curated data to the browser, without duplicating editorial content.
fs.copyFileSync('tools/figures-of-speech.mjs', 'dist/projects/figures-of-speech/catalogue.mjs');
console.log(`Rendered Figures of Speech: ${studies.length} studies, ${records.length} dated records.`);
