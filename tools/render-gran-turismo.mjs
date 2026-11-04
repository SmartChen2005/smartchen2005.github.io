import fs from 'node:fs';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { siteFavicon } from './site-favicon.mjs';
const route = new URL('../dist/projects/gran-turismo/', import.meta.url);
fs.mkdirSync(route, { recursive: true });
fs.writeFileSync(new URL('index.html', route), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#070707"><meta name="description" content="Gran Turismo — a project by Smart Chen.">
<title>Gran Turismo — Smart Chen</title>${siteFavicon('../../')}
<link rel="stylesheet" href="../../site.css"><link rel="stylesheet" href="gran-turismo.css?rev=20261103-video">${projectHeaderAssets('../../')}</head>
<body>${projectHeader()}<div class="site-shell"><main class="site-main project-main" id="main"><h1>Gran Turismo</h1><section class="project-video" aria-label="Gran Turismo video"><iframe src="https://www.youtube-nocookie.com/embed/OFylHWSwYDY" title="Gran Turismo video" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe><a class="document-link" href="https://youtu.be/OFylHWSwYDY" target="_blank" rel="noopener noreferrer">Watch on YouTube</a></section></main></div></body></html>\n`);
console.log('Rendered the Gran Turismo project page with its supplied YouTube video.');
