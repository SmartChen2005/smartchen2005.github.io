import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlPath = path.join(root, "dist", "index.html");
const markdownPath = path.join(root, "tools", "notion-source.md");
const assetMapPath = path.join(root, "tools", "archive-slides-source.txt");
const html = fs.readFileSync(htmlPath, "utf8");
const markdown = fs.readFileSync(markdownPath, "utf8").replace(/\r/g, "");
const failures = [];
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
  const file = path.join(root, "dist", ref);
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
const sourceImageRefs = [...assetSource.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]).filter(Boolean);
if (JSON.stringify(sourceImageRefs) !== JSON.stringify(imageRefs)) failures.push("Source image order or references changed");

const scaledImages = (html.match(/<figure class="document-image[^"]*(?:feature|standard|portrait|compact|column)-media[^"]*">/g) || []).length;
if (scaledImages !== sourceImageRefs.length) failures.push("Responsive image scale classes are missing");

const firstImagePath = path.join(root, "dist", "assets", "asset-001.png");
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
  localAssets: fs.readdirSync(path.join(root, "dist", "assets")).length
}, null, 2));
