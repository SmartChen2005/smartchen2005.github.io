import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlPath = path.join(root, "dist", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const failures = [];
const imageRefs = [...html.matchAll(/<img[^>]+src="([^"]*)"/g)].map((match) => match[1]).filter(Boolean);
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

const slideCount = (html.match(/class="slide /g) || []).length;
if (slideCount !== 107) failures.push(`Expected 107 slides, found ${slideCount}`);
if (html.includes("prod-files-secure.s3")) failures.push("Expiring Notion asset URL remains");
if (html.includes("####")) failures.push("Unparsed Markdown heading remains");
if (html.includes("<p>&gt;</p>")) failures.push("Unparsed blockquote marker remains");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({
  htmlBytes: fs.statSync(htmlPath).size,
  slides: slideCount,
  imageReferences: imageRefs.length,
  uniqueAssets: new Set(imageRefs).size,
  localAssets: fs.readdirSync(path.join(root, "dist", "assets")).length
}, null, 2));

