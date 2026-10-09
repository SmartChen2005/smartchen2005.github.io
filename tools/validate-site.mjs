import fs from "node:fs";
import path from "node:path";
import { createHash } from 'node:crypto';

const root = process.cwd();
const htmlPath = path.join(root, "dist", "projects", "polaroid-of-yesterday", "game-design-document", "index.html");
const markdownPath = path.join(root, "tools", "notion-source.md");
const assetMapPath = path.join(root, "tools", "archive-slides-source.txt");
const html = fs.readFileSync(htmlPath, "utf8");
const markdown = fs.readFileSync(markdownPath, "utf8").replace(/\r/g, "");
const failures = [];
// GitHub Pages serves this file at arbitrary missing-path depths.
const missingPage = path.join(root, 'dist/404.html');
if (!fs.existsSync(missingPage)) failures.push('The custom GitHub Pages 404 page is missing');
else {
  const page = fs.readFileSync(missingPage, 'utf8');
  for (const [, ref] of page.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:data:|https?:|#)/.test(ref)) continue;
    if (!ref.startsWith('/')) failures.push(`404 references must be root-relative at missing-path depths: ${ref}`);
    if (!fs.existsSync(path.join(root, 'dist', ref.replace(/^\//, '')))) failures.push(`Missing 404 dependency: ${ref}`);
  }
  for (const ref of ['construction-space.mjs', 'vendor/three/three.module.min.js', 'vendor/three/three.core.min.js', 'vendor/three/RoomEnvironment.mjs', 'assets/fonts/anton-regular.ttf', 'assets/maintenance/ceramic-albedo.webp', 'assets/maintenance/yellow-plastic.webp']) {
    if (!fs.existsSync(path.join(root, 'dist', ref))) failures.push(`Missing construction scene dependency: ${ref}`);
  }
}
const home = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
const homeCss = fs.readFileSync(path.join(root, 'dist/home.css'), 'utf8');
const settledCss = homeCss.replace(/@keyframes develop-print \{[\s\S]*?\n\}/, '');
if (/mix-blend-mode\s*:/.test(homeCss) || [...settledCss.matchAll(/\bfilter\s*:\s*([^;}]+)/g)].some(match => match[1].trim() !== 'none')) {
  failures.push('Only temporary exhibition development may alter tonal rendering; settled artwork and the portrait must remain unfiltered');
}
const exhibitionImages = [...home.matchAll(/src="photography-preview\/([^"]+)"/g)].map(match => match[1]);
const suppliedImages = fs.readdirSync(path.join(root, 'dist/photography-preview')).filter(name => /\.jpe?g$/i.test(name));
if (exhibitionImages.length !== 4 || JSON.stringify([...exhibitionImages].sort()) !== JSON.stringify(suppliedImages.sort())) {
  failures.push('The exhibition must use each of the four supplied photographs exactly once');
}
if (/\.identity::(?:after|before)/.test(homeCss)) failures.push('Persistent identity underline decorations must not return');
if (!fs.existsSync(path.join(root, 'dist/home-scenes.mjs'))) failures.push('Homepage scenery module is missing');
if (!fs.existsSync(path.join(root, 'dist/home-game-transition.mjs'))) failures.push('Game click transition module is missing');
const cardText = home.match(/<div class="card-print">([\s\S]*?)\n        <\/div>/)?.[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
if (cardText !== "Smart Chen 陈弘毅 Emory University '27 smartchen324@gmail.com Résumé Instagram") failures.push('Business card copy must match the supplied content exactly');
if (home.includes('↗') || (home.match(/class="card-arrow"/g) || []).length !== 2) failures.push('Business card arrows must be two inline SVGs, with no Unicode arrows');
if (!home.includes('href="mailto:smartchen324@gmail.com"') || !home.includes('href="https://www.instagram.com/smartchen324/"')) failures.push('Business card contact destinations are incorrect');
if (!home.includes('class="business-card-dock" hidden inert')) failures.push('The business card must start hidden and inert');
const imageDigest = file => createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
if (imageDigest('selfportrait.jpg') !== imageDigest('dist/assets/selfportrait.jpg')) {
  failures.push('The published portrait must be byte-for-byte identical to the supplied blue monochrome artwork');
}
if (!home.includes('Smart Chen is a (game) designer, photographer, and car enthusiast.')) {
  failures.push('The homepage identity sentence is missing');
}
for (const match of home.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const ref = match[1];
  if (/^(?:#|https?:|mailto:)/.test(ref)) continue;
  if (!fs.existsSync(path.join(root, 'dist', ref))) failures.push(`Missing homepage destination or asset: ${ref}`);
}
const sentenceMarkup = home.match(/<h1 class="sentence">([\s\S]*?)<\/h1>/)?.[1] ?? '';
const sentenceText = sentenceMarkup.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
if (sentenceText !== 'Smart Chen is a (game) designer, photographer, and car enthusiast.') {
  failures.push('The visible homepage sentence must remain exact and continuous');
}
if (/<br|<section|<dialog|<template/.test(home)) failures.push('The minimal homepage must not contain forced line breaks, sections, or dialogs');
for (const identity of ['name', 'games', 'photo', 'cars']) {
  if (!home.includes(`data-identity="${identity}"`)) failures.push(`Missing homepage identity: ${identity}`);
}
for (const file of ['camera.mjs', 'camera-model.mjs', 'camera.css']) {
  if (fs.readFileSync(path.join(root, 'dist', file), 'utf8') !== fs.readFileSync(path.join(root, 'tools', file), 'utf8')) {
    failures.push(`Camera build is stale: ${file}`);
  }
}
for (const file of ['vendor/html2canvas.min.js', 'vendor/html2canvas.LICENSE']) {
  if (!fs.existsSync(path.join(root, 'dist', file))) failures.push(`Missing camera dependency: ${file}`);
}
if (!html.includes('<span>Polaroid of Yesterday</span><span>Game Design Document</span>')) {
  failures.push('Expected capitalized two-line document title');
}

const stripMarkup = (value) => value
  .replace(/<[^>]+>/g, "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/\*(.*?)\*/g, "$1")
  .replace(/~~(.*?)~~/g, "$1")
  .replace(/`(.*?)`/g, "$1")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
  .replace(/\\([\\*~`$\[\]<>\{\}|^])/g, "$1")
  .trim();

const normalizeText = (value) => stripMarkup(value).replace(/\s+/g, " ").trim();

const imageRefs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
  .map((match) => match[1])
  .filter(Boolean);
for (const ref of new Set(imageRefs)) {
  const file = path.resolve(path.dirname(htmlPath), ref);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) failures.push(`Missing image: ${ref}`);
}

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) failures.push("Inline script not found");
else {
  try { new Function(scriptMatch[1]); }
  catch (error) { failures.push(`JavaScript syntax: ${error.message}`); }
}

const sourceHeadings = [...markdown.matchAll(/^(#{1,4})\s+(.+)$/gm)].map((match) => ({
  level: match[1].length,
  text: stripMarkup(match[2])
}));
const renderedHeadings = [...html.matchAll(/<h([1-4]) id="[^"]+">([\s\S]*?)<\/h\1>/g)].map((match) => ({
  level: Number(match[1]),
  text: stripMarkup(match[2])
}));
if (JSON.stringify(sourceHeadings) !== JSON.stringify(renderedHeadings)) {
  failures.push("Source heading order, hierarchy, or text changed");
}

const expectedDocumentText = markdown.split("\n").map((line) => {
  const trimmed = line.trim();
  if (!trimmed || /^<\/?(?:columns|column)(?:\s[^>]*)?>$/.test(trimmed) || trimmed === "<empty-block/>" || trimmed === "---") return "";
  const image = trimmed.match(/^!\[([^\]]*)\]\([^)]+\)/);
  if (image) return normalizeText(image[1]);
  return normalizeText(trimmed
    .replace(/^#{1,4}\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/^-\s+/, "")
    .replace(/^>\s?/, ""));
}).filter(Boolean).join(" ");
const contentMatch = html.match(/<div class="notion-content">([\s\S]*?)<\/div><\/article>/);
if (!contentMatch) failures.push("Rendered document content is missing");
else {
  const renderedDocumentText = normalizeText(contentMatch[1]
    .replace(/<\/(?:p|h[1-4]|li|blockquote|figcaption)>/g, " ")
    .replace(/<[^>]+>/g, ""));
  if (renderedDocumentText !== expectedDocumentText) {
    let mismatch = 0;
    while (mismatch < renderedDocumentText.length && renderedDocumentText[mismatch] === expectedDocumentText[mismatch]) mismatch += 1;
    failures.push(`Rendered document text differs from the Notion source near: expected "${expectedDocumentText.slice(mismatch, mismatch + 90)}", rendered "${renderedDocumentText.slice(mismatch, mismatch + 90)}"`);
  }
}

const tocCount = (html.match(/class="toc-link toc-level-/g) || []).length;
if (tocCount !== sourceHeadings.length) failures.push(`Expected ${sourceHeadings.length} TOC links, found ${tocCount}`);

const assetSource = fs.readFileSync(assetMapPath, "utf8");
const sourceImageRefs = [...assetSource.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => path.posix.basename(match[1])).filter(Boolean);
const renderedImageNames = imageRefs.map((ref) => path.posix.basename(ref));
if (JSON.stringify(sourceImageRefs) !== JSON.stringify(renderedImageNames)) failures.push("Source image order or references changed");

const scaledImages = (html.match(/<figure class="document-image[^"]*(?:feature|standard|portrait|compact|column)-media[^"]*">/g) || []).length;
if (scaledImages !== sourceImageRefs.length) failures.push("Responsive image scale classes are missing");

const firstImagePath = path.join(root, "dist", "projects", "polaroid-of-yesterday", "game-design-document", "assets", "asset-001.png");
if (fs.statSync(firstImagePath).size < 3_000_000) failures.push("The updated high-resolution first image is missing");

const inventedCopy = [
  "Photography reconstructs perception",
  "The image remains",
  "THE FACT REMAINS",
  "LOOK CLOSER",
  "CONTINUED /",
  "ENGLISH EDITION",
  "CHAPTER 0"
];
for (const phrase of inventedCopy) {
  if (html.includes(phrase)) failures.push(`Invented copy remains: ${phrase}`);
}

if (/scroll-snap|min-height:\s*100(?:vh|svh|dvh)/.test(html)) failures.push("Slide-style viewport constraints remain");
if (/\.document-image img\{[^}]*height:(?!auto)/.test(html)) failures.push("Document images use a forced height");
if (html.includes("prod-files-secure.s3")) failures.push("Expiring Notion asset URL remains");
if (html.includes("&lt;empty-block/&gt;")) failures.push("Unparsed Notion empty block remains");
if (html.includes("####")) failures.push("Unparsed Markdown heading remains");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  htmlBytes: fs.statSync(htmlPath).size,
  sourceHeadings: sourceHeadings.length,
  tocLinks: tocCount,
  imageReferences: imageRefs.length,
  uniqueAssets: new Set(imageRefs).size,
  firstImageBytes: fs.statSync(firstImagePath).size,
  sharedAssets: fs.readdirSync(path.join(root, "dist", "assets")).length,
  documentAssets: fs.readdirSync(path.dirname(firstImagePath)).length
}, null, 2));
