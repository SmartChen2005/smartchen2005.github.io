import { readFileSync, writeFileSync } from 'node:fs';
import { projectHeader, projectHeaderAssets } from './project-header.mjs';
import { siteFavicon } from './site-favicon.mjs';
import { northEastArrow } from './site-icons.mjs';

const template = readFileSync(new URL('./ai-game-design.html', import.meta.url), 'utf8');
const base = '../../';
const tokens = {
  favicon: siteFavicon(base),
  headerAssets: projectHeaderAssets(base),
  header: projectHeader({ base, theme: 'light' }),
  arrow: northEastArrow,
};
const page = template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
  if (!Object.hasOwn(tokens, name)) throw new Error(`Unknown template token "${name}"`);
  return tokens[name];
});
writeFileSync(new URL('../dist/projects/ai-game-design/index.html', import.meta.url), page);
