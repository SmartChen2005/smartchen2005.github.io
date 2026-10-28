// Canonical includes for live pages. Frozen editions and the SX-70 document keep
// their original pointer; a future dedicated experience may opt out explicitly.
export const siteCursorAssets = (base = '') => `<link rel="stylesheet" href="${base}site-cursor.css?rev=20261028-intents">
  <script type="module" src="${base}site-cursor.mjs?rev=20261028-intents"></script>`;

export const hasDedicatedPointer = (file, html) => file.replaceAll('\\', '/').includes('/editions/')
  || /<script\b[^>]*src="[^"]*camera\.mjs/.test(html)
  || /data-page-cursor="native"/.test(html);
