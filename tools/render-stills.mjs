import fs from 'node:fs';
import { siteFavicon } from './site-favicon.mjs';
import { siteCursorAssets } from './site-cursor.mjs';
import { exhibitionSlug, exhibitionTitle } from './polaroid-exhibition.mjs';

// Keep old bookmarks and ?view=gallery links pointed at the one Gallery page.
const destination = '../../../gallery/' + exhibitionSlug + '/';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=${destination}"><link rel="canonical" href="https://smartchen2005.github.io/gallery/${exhibitionSlug}/">
${siteFavicon('../../../')}<title>${exhibitionTitle} | The Gallery</title>${siteCursorAssets('../../../')}
<script>location.replace(${JSON.stringify(destination)} + location.search + location.hash);</script>
</head><body><main><h1>${exhibitionTitle}</h1><p><a href="${destination}">View concept photography and game screenshots in The Gallery</a></p></main></body></html>
`;
fs.writeFileSync(new URL('../dist/projects/polaroid-of-yesterday/photography/index.html', import.meta.url), html);
console.log('Rendered the legacy Stills redirect to the combined Gallery exhibition.');
