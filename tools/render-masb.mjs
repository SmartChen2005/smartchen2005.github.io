import fs from 'node:fs';
import path from 'node:path';

// The archive owns the original project copy; user-supplied metadata is added to the hero.
const source = JSON.parse(fs.readFileSync('tools/masb-source/content.json', 'utf8'));
const route = 'dist/projects/multiverse-all-star-battlefront';
const escape = value => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const idFor = value => value.toLowerCase().replace(/^\d\.\d\s+/, '').replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const people = ['Smart Chen', 'Sam Liu', 'Neko Jin', 'Nathan Ren'];
const descriptions = ['A crowned serpent fighter with multiple arms', 'A lion-haired fighter in purple holding two swords', 'A winged armored dragon fighter with a shield', 'A black-clad ninja carrying swords', 'A green armored fighter carrying an axe', 'A crowned basketball fighter with glowing energy'];
const photoDescriptions = ['Character statistics displayed on a laptop', 'The battle results screen showing defeat', 'A visitor trying the game at the project exhibition', 'A player reading the generated comic panels', 'A generated battle comic displayed on a laptop', 'Two laptops running the project at the exhibition', 'A generated character and its statistics', 'The team beside the project exhibition', 'Sequential comic panels on the simulation screen', 'A visitor playing the game at the exhibition'];
const diagrams = ['Technical workflow diagram connecting user input, character creation, battle simulation, and image generation', 'Recurrent generation workflow passing the previous image into each new frame', 'Frontend architecture linking user input, data processing, display, and server assets'];
const characters = source.media.filter(m=>m.kind==='character');
const photos = source.media.filter(m=>m.kind==='battle');
const image = (m, alt, lazy=true) => `<img src="assets/${m.file.replace(/\.png$/,'.webp')}" width="${m.width}" height="${m.height}" alt="${escape(alt)}"${lazy?' loading="lazy"':''} decoding="async">`;
const imageLink = (m, alt, cls='') => `<a class="image-link ${cls}" href="assets/${m.file}" data-preview aria-label="Enlarge: ${escape(alt)}">${image(m,alt)}<span class="image-hint" aria-hidden="true">Enlarge +</span></a>`;

let document = '', openSection = false, openPerson = false, openList = false, diagramIndex = 0;
const headings = [];
for (const block of source.blocks.slice(2)) {
  if (block.kind !== 'li' && openList) { document+='</ol>'; openList=false; }
  if (/^\d\.\d /.test(block.text ?? '')) {
    if(openPerson){document+='</div>';openPerson=false;}
    if(openSection) document+='</section>';
    const id=idFor(block.text), [number,...words]=block.text.split(' ');
    headings.push({id,number,title:words.join(' ')});
    document+=`<section class="document-section" id="${id}"><h3><span class="section-number">${number}</span><span>${escape(words.join(' '))}</span></h3>`;
    openSection=true;
  } else if (people.includes(block.text)) {
    if(openPerson)document+='</div>';
    document+=`<div class="contribution" id="${idFor(block.text)}"><h4>${escape(block.text)}</h4>`;
    openPerson=true;
  } else if (block.kind==='image') {
    document+=`<figure class="diagram">${imageLink(block,diagrams[diagramIndex++])}</figure>`;
  } else if (block.kind==='li') {
    if(!openList){document+='<ol>';openList=true;}
    document+=`<li>${escape(block.text)}</li>`;
  } else document+=`<p>${escape(block.text)}</p>`;
}
if(openList)document+='</ol>';
if(openPerson)document+='</div>';
if(openSection)document+='</section>';

const html=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f13d24">
  <meta name="description" content="Multiverse All-Star Battlefront: an AI-driven battle simulation. Create a pixel-art fighter from your words and follow the battle in a generated comic.">
  <title>Multiverse All-Star Battlefront | Smart Chen</title>
  <link rel="stylesheet" href="battlefront.css">
  <script type="module" src="battlefront.mjs"></script>
</head>
<body>
  <a class="skip-link" href="#overview">Skip to content</a>
  <div class="poster" id="top">
    <header class="masthead wrap">
      <a class="brand" href="../../">Smart Chen</a>
      <nav aria-label="Primary navigation"><a href="../">Projects <span aria-hidden="true">↗</span></a><a href="../../">Home</a></nav>
    </header>
    <div class="hero wrap">
      <p class="project-type">A generative AI battle simulation</p>
      <h1><span>Multiverse</span><span>All-Star</span><span>Battlefront</span></h1>
      <div class="poster-circle" aria-hidden="true">Words<br>become<br>fighters.</div>
      <div class="hero-bottom">
        <p><time datetime="2025-09">September</time> to <time datetime="2025-11">November 2025</time><br><strong>Not a vibe-coding project</strong></p>
        <p>Smart Chen<br>Group leader, designer &amp; engineer</p>
        <nav aria-label="On this page"><a href="#overview">The game <span aria-hidden="true">↓</span></a><a href="#gallery">In action <span aria-hidden="true">↓</span></a><a href="#technical-document">Technical document <span aria-hidden="true">↓</span></a></nav>
      </div>
    </div>
  </div>
  <main>
    <section class="overview wrap section-grid" id="overview" aria-labelledby="overview-title">
      <div class="section-label"><p class="label">The game</p><h2 id="overview-title">${escape(source.intro[0])}</h2></div>
      <div class="overview-copy">${source.intro.slice(1).map(p=>`<p>${escape(p)}</p>`).join('')}</div>
    </section>
    <section class="fighters" aria-labelledby="fighters-title">
      <div class="wrap">
        <div class="section-heading"><h2 id="fighters-title">Characters from imagination.</h2><p>AI-generated fighters / Pixel art</p></div>
        <div class="fighter-grid">${characters.map((m,i)=>`<figure>${imageLink(m,descriptions[i])}</figure>`).join('')}</div>
      </div>
    </section>
    <section class="gallery wrap" id="gallery" aria-labelledby="gallery-title">
      <div class="section-heading"><h2 id="gallery-title">In action.</h2><p>The game &amp; the exhibition</p></div>
      <div class="photo-grid">${photos.map((m,i)=>`<figure>${imageLink(m,photoDescriptions[i])}<figcaption>${escape(photoDescriptions[i])}</figcaption></figure>`).join('')}</div>
    </section>
    <section class="technical wrap" id="technical-document" aria-labelledby="technical-title">
      <header class="technical-heading"><p class="label">${escape(source.blocks[0].text)}</p><h2 id="technical-title">Behind<br>the battle.</h2><p>${escape(source.blocks[1].text)}</p></header>
      <div class="document-layout">
        <aside><nav class="contents" aria-label="Technical document contents"><p class="label">Contents</p>${headings.map(h=>`<a href="#${h.id}"${h.number.startsWith('2.')&&h.number!=='2.0'?' class="subsection"':''}><span>${h.number}</span>${escape(h.title)}</a>`).join('')}<a class="top-link" href="#top">Back to top ↑</a></nav></aside>
        <article class="document" aria-label="The Game Company technical document">${document}</article>
      </div>
    </section>
  </main>
  <footer class="footer wrap"><a href="../">All projects <span aria-hidden="true">↗</span></a><div class="footer-links"><a href="https://www.instagram.com/smartchen324/">Instagram</a><a href="https://www.youtube.com/@VegShark001">YouTube</a><a href="https://www.linkedin.com/in/smartchen324/">LinkedIn</a><a href="mailto:smartchen324@gmail.com">Email</a></div><p>© 2026 Smart Chen. All rights reserved.</p></footer>
  <dialog class="image-viewer" aria-label="Image preview">
    <div class="viewer-toolbar"><p id="viewer-caption"></p><button type="button" class="viewer-close" autofocus>Close <span aria-hidden="true">×</span></button></div>
    <img class="viewer-image" alt="">
    <p class="viewer-error" role="status" hidden>Unable to load this image. <a href="#">Open the original image</a></p>
  </dialog>
</body>
</html>`;
fs.writeFileSync(path.join(route,'index.html'),html);
console.log(`Rendered MASB: ${source.intro.length} introduction blocks, ${source.blocks.length} document blocks, ${characters.length} characters, ${photos.length} exhibition images, ${diagramIndex} diagrams.`);
