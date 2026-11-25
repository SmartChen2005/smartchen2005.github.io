import { readFileSync, writeFileSync } from 'node:fs';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { siteFavicon } from './site-favicon.mjs';

const base = '../../';
const tokens = {
  favicon: siteFavicon(base),
  headerAssets: projectHeaderAssets(base),
  header: projectHeader({ base }),
};
const template = readFileSync(new URL('./driveframe.html', import.meta.url), 'utf8');
const page = template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
  if (!Object.hasOwn(tokens, name)) throw new Error(`Unknown DRIVEFRAME template token: ${name}`);
  return tokens[name];
});
writeFileSync(new URL('../dist/projects/driveframe/index.html', import.meta.url), page);
