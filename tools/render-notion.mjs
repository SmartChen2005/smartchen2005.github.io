import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const markdownPath = path.join(root, "tools", "notion-source.md");
const assetMapPath = path.join(root, "tools", "archive-slides-source.txt");
const outputPath = path.join(root, "dist", "index.html");

const markdown = fs.readFileSync(markdownPath, "utf8").replace(/\r/g, "");
const previousSource = fs.readFileSync(assetMapPath, "utf8");
const localImages = [...previousSource.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
const sourceImageCount = (markdown.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;

if (sourceImageCount !== localImages.length) {
  throw new Error(`Notion has ${sourceImageCount} images, but the local asset map has ${localImages.length}.`);
}

const escapeHtml = (value = "") => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function plainText(value = "") {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/\\([\\*~`$\[\]<>\{\}|^])/g, "$1")
    .trim();
}

function inline(value = "") {
  let output = escapeHtml(value);
  output = output
    .replace(/\\&gt;/g, "&gt;")
    .replace(/\\&lt;/g, "&lt;")
    .replace(/\\([\\*~`$\[\]\{\}|^])/g, "$1");
  output = output.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*]+?)\*/g, "<em>$1</em>");
  output = output.replace(/~~(.+?)~~/g, "<del>$1</del>");
  output = output.replace(/`([^`]+?)`/g, "<code>$1</code>");
  return output;
}

const usedIds = new Map();
function makeId(value) {
  const base = plainText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
  const count = (usedIds.get(base) || 0) + 1;
  usedIds.set(base, count);
  return count === 1 ? base : `${base}-${count}`;
}

let imageIndex = 0;
const featureMedia = new Set([1, 8, 9, 10, 19, 29, 30, 38, 41, 42, 53, 82]);
const compactMedia = new Set([24, 25, 26, 27, 28, 35, 57, 72, 79, 93, 94, 95, 96]);
const portraitMedia = new Set([54]);

function renderImage(line, nested = false, inColumn = false) {
  const match = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)/);
  if (!match) return "";
  const alt = plainText(match[1]);
  const occurrence = imageIndex + 1;
  const localSrc = localImages[imageIndex++];
  const caption = alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : "";
  const nestedClass = nested ? " nested-media" : "";
  const scaleClass = inColumn ? " column-media" : portraitMedia.has(occurrence) ? " portrait-media" : featureMedia.has(occurrence) ? " feature-media" : compactMedia.has(occurrence) ? " compact-media" : " standard-media";
  return `<figure class="document-image${nestedClass}${scaleClass}"><button class="image-open" type="button" data-full="${localSrc}" data-alt="${escapeHtml(alt)}" aria-label="Open image"><img src="${localSrc}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></button>${caption}</figure>`;
}

const lines = markdown.split("\n");
const headings = [];
const content = [];

for (let index = 0; index < lines.length; index += 1) {
  const original = lines[index];
  const trimmed = original.trim();

  if (trimmed === ">") {
    const quoted = [];
    while (index + 1 < lines.length && /^\t/.test(lines[index + 1])) {
      index += 1;
      const quotedLine = lines[index].trim();
      if (quotedLine) quoted.push(`<p>${inline(quotedLine)}</p>`);
    }
    content.push(`<blockquote>${quoted.join("")}</blockquote>`);
    continue;
  }

  const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
  if (heading) {
    const level = heading[1].length;
    const id = makeId(heading[2]);
    const text = plainText(heading[2]);
    headings.push({ level, id, text });
    content.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
    continue;
  }

  if (trimmed === "<columns>") {
    const columnLines = [];
    while (index + 1 < lines.length && lines[index + 1].trim() !== "</columns>") {
      columnLines.push(lines[++index]);
    }
    index += 1;
    const joined = columnLines.join("\n");
    const columns = [...joined.matchAll(/<column(?:\s+ratio="([^"]+)")?>\s*\n([\s\S]*?)\n\s*<\/column>/g)];
    const renderedColumns = columns.map((column) => {
      const ratio = Number(column[1]) || (100 / columns.length);
      const children = column[2].split("\n").map((child) => {
        const childTrimmed = child.trim();
        if (!childTrimmed) return "";
        if (childTrimmed === "<empty-block/>") return '<div class="empty-block" aria-hidden="true"></div>';
        if (childTrimmed.startsWith("![")) return renderImage(childTrimmed, false, true);
        return `<p>${inline(childTrimmed)}</p>`;
      }).join("");
      return `<div class="source-column" style="--column-ratio:${ratio}">${children}</div>`;
    }).join("");
    content.push(`<div class="source-columns columns-${columns.length}">${renderedColumns}</div>`);
    continue;
  }

  if (trimmed === "<empty-block/>") {
    content.push('<div class="empty-block" aria-hidden="true"></div>');
    continue;
  }

  if (!trimmed) continue;
  if (trimmed.startsWith("![")) {
    content.push(renderImage(trimmed, original.startsWith("\t")));
    continue;
  }

  const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
  if (numbered) {
    content.push(`<ol class="source-list" start="${numbered[1]}"><li>${inline(numbered[2])}</li></ol>`);
    continue;
  }

  const bullet = trimmed.match(/^-\s+(.+)$/);
  if (bullet) {
    content.push(`<ul class="source-list"><li>${inline(bullet[1])}</li></ul>`);
    continue;
  }

  const quote = trimmed.match(/^>\s?(.*)$/);
  if (quote) {
    content.push(`<blockquote>${inline(quote[1])}</blockquote>`);
    continue;
  }

  if (trimmed === "---") {
    content.push("<hr>");
    continue;
  }

  content.push(`<p>${inline(trimmed)}</p>`);
}

if (imageIndex !== localImages.length) {
  throw new Error(`Rendered ${imageIndex} images, expected ${localImages.length}.`);
}

const toc = headings.map(({ level, id, text }) => `<a class="toc-link toc-level-${level}" href="#${id}">${escapeHtml(text)}</a>`).join("");
const pageTitle = "Polaroid of Yesterday Game Design Document";

const css = `
:root{--black:#070707;--panel:#0b0b0b;--white:#f4f4ee;--body:#c7c7c0;--muted:#888982;--rule:#2c2c29;--yellow:#f6c934;--rail:21rem;--page:78rem;--body-font:"Helvetica Neue",Inter,Arial,sans-serif;--display-font:"Futura","Futura PT","Arial Black","Helvetica Neue",Arial,sans-serif;--ease:cubic-bezier(.22,1,.36,1)}
*{box-sizing:border-box}html{scroll-behavior:smooth;scrollbar-color:#676861 #111;scrollbar-width:thin;background:var(--black)}body{margin:0;background:var(--black);color:var(--body);font-family:var(--body-font);font-size:16px;line-height:1.68;font-weight:350;overflow-wrap:anywhere}::-webkit-scrollbar{width:11px;height:11px}::-webkit-scrollbar-track{background:#111}::-webkit-scrollbar-thumb{background:#5f605b;border:2px solid #111}::-webkit-scrollbar-thumb:hover{background:#83847c}a{color:inherit}.archive-nav{position:fixed;inset:0 auto 0 0;z-index:20;width:var(--rail);background:rgba(7,7,7,.98);border-right:1px solid var(--rule);padding:1.5rem 1.35rem;display:flex;flex-direction:column}.brand{font-family:var(--display-font);font-style:italic;font-weight:900;line-height:1.02;letter-spacing:-.035em;color:var(--yellow);text-decoration:none;padding:.25rem .35rem 1.2rem;border-bottom:1px solid var(--rule)}.toc{overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;padding:.8rem .6rem 1.5rem .35rem}.toc-link{display:block;text-decoration:none;color:var(--muted);font-size:.7rem;line-height:1.35;padding:.28rem 0;transition:color .2s var(--ease)}.toc-level-1{color:var(--white);font-weight:650;margin-top:.75rem}.toc-level-2{padding-left:.75rem}.toc-level-3{padding-left:1.5rem;font-size:.66rem}.toc-level-4{padding-left:2.25rem;font-size:.63rem}.toc-link:hover,.toc-link:focus-visible,.toc-link.active{color:var(--yellow)}.archive-nav a:focus-visible,.image-open:focus-visible,.dialog-close:focus-visible{outline:2px solid var(--yellow);outline-offset:3px}.progress-track{position:fixed;z-index:30;top:0;left:var(--rail);right:0;height:3px;background:#1d1d1a}.progress-bar{height:100%;width:0;background:var(--yellow);transition:width .12s linear}main{margin-left:var(--rail)}.document{max-width:var(--page);margin:0 auto;padding:clamp(3.5rem,7vw,7rem) clamp(2rem,6vw,6rem) 9rem}.document-title{border-bottom:1px solid var(--rule);padding-bottom:clamp(2rem,5vw,4rem);margin-bottom:clamp(3rem,6vw,6rem)}.document-title h1{font-family:var(--display-font);font-style:italic;font-weight:900;font-size:clamp(3rem,6.5vw,7rem);line-height:.86;letter-spacing:-.06em;color:var(--yellow);max-width:11ch;margin:0}.notion-content>h1,.notion-content>h2,.notion-content>h3,.notion-content>h4{color:var(--white);font-weight:400;letter-spacing:-.035em;line-height:1.08;scroll-margin-top:2rem}.notion-content>h1{font-size:clamp(2.8rem,5vw,5.4rem);margin:8rem 0 3rem;padding-top:1.2rem;border-top:1px solid var(--rule)}.notion-content>h1:first-child{margin-top:0}.notion-content>h2{font-size:clamp(2rem,3.3vw,3.5rem);margin:5.5rem 0 2rem}.notion-content>h3{font-size:clamp(1.5rem,2.2vw,2.25rem);margin:4rem 0 1.4rem}.notion-content>h4{font-size:clamp(1.2rem,1.6vw,1.55rem);margin:3rem 0 1rem}.notion-content>p,.notion-content>blockquote,.source-list{max-width:52rem;margin:0 0 1rem;font-size:1.05rem;color:var(--body)}.notion-content strong{color:var(--white);font-weight:650}.notion-content em{color:var(--white)}.notion-content code{font-family:Consolas,monospace;font-size:.92em}.notion-content a{text-underline-offset:.22em}.empty-block{height:1rem}.source-columns{display:flex;gap:1rem;align-items:flex-start;margin:2rem 0 2.5rem}.source-column{flex:var(--column-ratio) 1 0;min-width:0}.document-image{margin:2rem 0 2.5rem;max-width:100%}.source-column .document-image{margin:0}.nested-media{margin-left:2.2rem;max-width:calc(100% - 2.2rem)}.image-open{appearance:none;border:0;border-radius:0;padding:0;background:transparent;display:block;width:100%;cursor:zoom-in;text-align:left}.document-image img{display:block;width:100%;height:auto;object-fit:contain;border:1px solid var(--rule);background:#0a0a0a;transition:opacity .22s var(--ease),border-color .22s var(--ease)}.image-open:hover img{opacity:.86;border-color:var(--yellow)}figcaption{font-size:.7rem;line-height:1.45;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);padding:.65rem 0;border-bottom:1px solid var(--rule)}.source-list{padding-left:1.6rem;margin-bottom:.75rem}.source-list li{padding-left:.55rem}.source-list li::marker{color:var(--yellow);font-weight:700}blockquote{border-left:2px solid var(--yellow);padding-left:1.2rem}blockquote p{margin:.2rem 0}hr{border:0;border-top:1px solid var(--rule);margin:3rem 0}dialog{width:min(94vw,100rem);height:min(94vh,70rem);border:1px solid var(--rule);padding:0;background:#050505;color:var(--white)}dialog::backdrop{background:rgba(0,0,0,.9)}.dialog-inner{width:100%;height:100%;display:grid;place-items:center;padding:3rem}.dialog-inner img{max-width:100%;max-height:100%;object-fit:contain}.dialog-close{position:absolute;z-index:2;right:1rem;top:1rem;width:2.8rem;height:2.8rem;border:1px solid #64645f;background:#090909;color:var(--white);font-size:1.2rem;cursor:pointer}.dialog-close:hover{color:var(--yellow);border-color:var(--yellow)}
:root{--rail:22rem}
.brand{font-size:.9rem;line-height:1.08;padding-right:.5rem}
.toc{padding-top:1rem}
.toc-link{font-size:.82rem;line-height:1.42;padding:.36rem 0}
.toc-level-1{margin-top:.9rem;font-size:.85rem}
.toc-level-2{padding-left:.8rem}
.toc-level-3{padding-left:1.6rem;font-size:.78rem}
.toc-level-4{padding-left:2.4rem;font-size:.74rem}
.source-columns{gap:clamp(1rem,2vw,2rem);max-width:68rem;margin:2.5rem auto 3.25rem}
.document-image{width:min(100%,52rem);margin:2.25rem auto 3.25rem}
.document-image.feature-media{width:min(100%,68rem)}
.document-image.compact-media{width:min(100%,38rem)}
.document-image.portrait-media{width:min(100%,46rem)}
.source-column .document-image{width:100%;margin:0}
.notion-content>.document-image+:is(h1,h2,h3,h4),.notion-content>.source-columns+:is(h1,h2,h3,h4){margin-top:3.75rem}
@media(max-width:1050px){:root{--rail:0rem}.archive-nav{position:relative;width:100%;height:auto;border-right:0;border-bottom:1px solid var(--rule);padding:1rem 1.25rem}.brand{border:0;padding:0}.toc{display:none}.progress-track{left:0}.document{padding-top:4rem}}
@media(max-width:700px){.document{padding:3.5rem 1.25rem 6rem}.document-title h1{font-size:clamp(3rem,15vw,5rem)}.notion-content>h1{margin-top:5.5rem}.source-columns{display:grid;grid-template-columns:1fr}.nested-media{margin-left:0;max-width:none}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.toc-link,.document-image img,.progress-bar{transition:none}}
@media(forced-colors:active){*{border-color:CanvasText}.progress-bar{background:Highlight}.document-title h1{color:Highlight}}
`;

const script = `
const bar=document.querySelector('.progress-bar');const links=[...document.querySelectorAll('.toc-link')];const targets=[...document.querySelectorAll('.notion-content h1,.notion-content h2,.notion-content h3,.notion-content h4')];const byId=new Map(links.map(link=>[link.getAttribute('href').slice(1),link]));function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;bar.style.width=(max>0?scrollY/max*100:0)+'%'}addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);updateProgress();const observer=new IntersectionObserver(entries=>{const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;links.forEach(link=>link.classList.toggle('active',link===byId.get(visible.target.id)))},{rootMargin:'-15% 0px -75% 0px',threshold:[0,.2,.6]});targets.forEach(target=>observer.observe(target));const dialog=document.querySelector('.lightbox');const full=dialog.querySelector('img');let trigger=null;document.querySelectorAll('.image-open').forEach(button=>button.addEventListener('click',()=>{trigger=button;full.src=button.dataset.full;full.alt=button.dataset.alt;dialog.showModal();dialog.querySelector('.dialog-close').focus()}));dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{full.src='';full.alt='';trigger?.focus()});
`;

const favicon = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Crect%20width%3D%2232%22%20height%3D%2232%22%20fill%3D%22%23070707%22%2F%3E%3Crect%20x%3D%227%22%20y%3D%226%22%20width%3D%2218%22%20height%3D%2221%22%20fill%3D%22none%22%20stroke%3D%22%23f6c934%22%20stroke-width%3D%222%22%2F%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2214%22%20r%3D%224%22%20fill%3D%22%23f6c934%22%2F%3E%3C%2Fsvg%3E";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#070707"><meta name="description" content="${pageTitle}"><title>${pageTitle}</title><link rel="icon" type="image/svg+xml" href="${favicon}"><style>${css}</style></head><body><aside class="archive-nav" aria-label="Table of contents"><a class="brand" href="#document-title">${pageTitle}</a><nav class="toc">${toc}</nav></aside><div class="progress-track" aria-hidden="true"><div class="progress-bar"></div></div><main><article class="document"><header class="document-title" id="document-title"><h1>${pageTitle}</h1></header><div class="notion-content">${content.join("\n")}</div></article></main><dialog class="lightbox" aria-label="Image preview"><button class="dialog-close" type="button" aria-label="Close image preview">×</button><div class="dialog-inner"><img src="" alt=""></div></dialog><script>${script}</script></body></html>`;

fs.writeFileSync(outputPath, html);
console.log(JSON.stringify({headings:headings.length,images:imageIndex,characters:html.length},null,2));
