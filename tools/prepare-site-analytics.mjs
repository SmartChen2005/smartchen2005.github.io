import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const analyticsTag = '<script defer src="/site-analytics.js"></script>';
const archiveDirectories = new Set(['editions', 'snapshots', 'vendor']);

function* publishedPages(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !archiveDirectories.has(entry.name)) {
      yield* publishedPages(file);
    } else if (entry.isFile() && entry.name.endsWith('.html') && entry.name !== '404.html') {
      yield file;
    }
  }
}

export function prepareSiteAnalytics(directory) {
  if (!fs.existsSync(path.join(directory, 'site-analytics.js'))) {
    throw new Error('Missing site-analytics.js in the Pages artifact');
  }

  let count = 0;
  for (const file of publishedPages(directory)) {
    const html = fs.readFileSync(file, 'utf8');
    if (html.includes(analyticsTag)) continue;
    const headEnd = /<\/head\s*>/i.exec(html);
    if (!headEnd) throw new Error(`Missing closing head tag in ${file}`);
    const newline = html.includes('\r\n') ? '\r\n' : '\n';
    const prepared = html.slice(0, headEnd.index) + `  ${analyticsTag}${newline}` + html.slice(headEnd.index);
    fs.writeFileSync(file, prepared);
    count++;
  }
  return count;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`Prepared analytics on ${prepareSiteAnalytics('dist')} Pages HTML files.`);
}
