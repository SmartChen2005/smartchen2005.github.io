import fs from 'node:fs';
import { normalizeSiteArrows } from './site-icons.mjs';
const root=new URL('../dist/projects/world-sensing-music-station/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('assets/sources.json',root),'utf8'));
const labels=['Project overview','Scribble sketches I','Scribble sketches II','Fluid experiments','Early concepts','Elevator pitch & research','Research gap','Sensing research','Storyboard','Prototype drawing','Instrument development','Device in use','Prototype & demonstration'];
const sheets=manifest.processPages.map(({pdfPage,size},i)=>{
  const number=String(pdfPage).padStart(2,'0');
  return `        <figure class="process-sheet"><a href="assets/process-page-${number}.webp" data-process-page="${i}" aria-label="Enlarge PDF page ${pdfPage}: ${labels[i]}"><img src="assets/process-thumb-${number}.webp" width="${size[0]}" height="${size[1]}" loading="lazy" alt="Complete original PDF page ${pdfPage}: ${labels[i]}."></a><figcaption><span>${labels[i]}</span><small>PDF ${pdfPage} / ${manifest.processPages.length}</small></figcaption></figure>`;
}).join('\n');
const section=`    <section class="document-section process-section" id="process" aria-labelledby="process-title"><div class="section-heading"><div><p class="technical">The complete process / ${manifest.processPages.length} pages</p><h2 id="process-title">FROM SKETCH<br>TO INSTRUMENT.</h2></div><div class="process-tools"><p class="micro">Swipe through every page. Select a page to read it.</p><div><button type="button" id="process-prev" aria-label="Previous PDF pages">←</button><button type="button" id="process-next" aria-label="Next PDF pages">→</button></div></div></div>
      <div class="process-track" tabindex="0" role="region" aria-label="All ${manifest.processPages.length} original PDF pages; use arrow keys or the previous and next buttons">
${sheets}
      </div><p class="process-position micro" id="process-position" aria-live="polite">Pages 1–4 of ${manifest.processPages.length}</p>
    </section>`;
const path=new URL('index.html',root);
const html=fs.readFileSync(path,'utf8').replace(/    <section class="document-section process-section"[\s\S]*?<\/section>/,section);
fs.writeFileSync(path,normalizeSiteArrows(html));
console.log(`Rendered ${manifest.processPages.length} complete process pages.`);
