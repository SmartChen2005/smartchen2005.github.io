import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// A shallow segment, rather than half a cylinder. Its middle recedes into
// the screen; perspective bends the light rows gently toward the horizon.
const edition = '2026-11-09-concave-sky';
const root = 'dist/projects/figures-of-speech';
const output = `${root}/editions/${edition}`;
const angle = .83;
const camera = 3.4;
const depth = .84;
const blue = '#061b62';
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function surface(width, height, columns, pitch) {
  const points = [];
  const horizon = height * .44;
  for (let column = -columns; column <= columns; column++) {
    const theta = column / columns * angle;
    const z = depth * (Math.cos(theta) - Math.cos(angle)) / (1 - Math.cos(angle));
    const scale = camera / (camera + z);
    const x = width * .5 + width * .48 * Math.sin(theta) / Math.sin(angle) * scale;
    for (let row = -24; row <= 24; row++) {
      const y = horizon + (row * pitch + pitch * .3) * scale;
      if (y < -4 || y > height + 4) continue;
      const core = (1.1 * scale).toFixed(2);
      points.push(`<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"><circle r="${(3.2 * scale).toFixed(2)}" fill="url(#glow)"/><circle r="${core}" fill="white" opacity="${(.76 + .18 * scale).toFixed(2)}"/></g>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" data-surface="shallow-concave" data-arc-radians="${2 * angle}"><title>蓝色星空 — 内凹弧面</title><desc>规则白色灯点沿平缓的蓝色弧面排列，中央向屏幕深处退去，两侧略近。Inspired by 德国地铁站。</desc><defs><linearGradient id="blue"><stop stop-color="#0b2d81"/><stop offset=".23" stop-color="#08236f"/><stop offset=".5" stop-color="${blue}"/><stop offset=".77" stop-color="#08236f"/><stop offset="1" stop-color="#0b2d81"/></linearGradient><radialGradient id="glow"><stop stop-color="white" stop-opacity=".32"/><stop offset=".35" stop-color="white" stop-opacity=".12"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="${width}" height="${height}" fill="${blue}"/><rect width="${width}" height="${height}" fill="url(#blue)"/><g data-light-grid="projected">${points.join('')}</g></svg>\n`;
}

const desktop = surface(1280, 720, 13, 66);
const mobile = surface(480, 960, 4, 68);
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${blue}"><title>蓝色星空 — 内凹弧面</title><style>
:root{color-scheme:dark;background:${blue};color:#fff}*{box-sizing:border-box}html,body{margin:0;min-height:100%}main{position:fixed;inset:0;background:${blue}}picture,img{display:block;width:100%;height:100%}img{object-fit:fill}h1{position:absolute;width:1px;height:1px;margin:0;overflow:hidden;clip-path:inset(50%)}@media(forced-colors:active){:root,main{background:Canvas;color:CanvasText}picture{display:none}h1{width:auto;height:auto;inset:24px;clip-path:none}}@media print{main{position:relative;height:100vh}}
</style></head><body data-ready="true"><main><h1>蓝色星空 — Inspired by 德国地铁站</h1><picture><source media="(max-width:600px) and (orientation:portrait)" srcset="surface-mobile.svg"><img src="surface.svg" width="1280" height="720" alt="深蓝色的浅弧面向屏幕内凹，白色光点沿曲面规则排列，中央远、两侧近。"></picture></main></body></html>
`;
const payloads = new Map([
  ['blue-starry-sky/index.html', html],
  ['blue-starry-sky/surface.svg', desktop],
  ['blue-starry-sky/surface-mobile.svg', mobile],
]);

// Published editions are immutable; rerunning may verify, never replace them.
const committed = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', '--', output], { encoding: 'utf8' }).trim();
if (committed) {
  const manifest = JSON.parse(fs.readFileSync(`${output}/manifest.json`, 'utf8'));
  for (const [file, bytes] of payloads) {
    const expected = manifest.files.find(item => item.path === file)?.sha256;
    if (digest(bytes) !== expected || digest(fs.readFileSync(`${output}/${file}`)) !== expected) {
      throw new Error(`Committed edition ${edition} cannot change. Create a new edition.`);
    }
  }
} else {
  fs.mkdirSync(`${output}/blue-starry-sky`, { recursive: true });
  for (const [file, bytes] of payloads) fs.writeFileSync(`${output}/${file}`, bytes);
  fs.writeFileSync(`${output}/manifest.json`, JSON.stringify({
    edition,
    sourceCommit: '5213e83a35d0a16c790c3a3a5f7b01c776add573',
    preserved: '2026-11-09',
    description: 'A shallow inward-curved blue surface with projected white station lights. Revised from the flat blue-sky edition at the user’s request; inspired by German underground stations.',
    source: 'tools/render-figures-sky.mjs',
    studies: [{ slug: 'blue-starry-sky', kind: 'sky', title: '蓝色星空' }],
    files: [...payloads].map(([file, bytes]) => ({ path: file, sha256: digest(bytes) })),
  }, null, 2) + '\n');
}
fs.writeFileSync(`${root}/assets/blue-concave-sky.svg`, desktop);
console.log(`Rendered shallow concave sky: desktop, phone, catalogue plate; ${edition}.`);
