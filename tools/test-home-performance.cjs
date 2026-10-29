const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../dist');
const output = process.env.HOME_QA_DIR || path.join(require('node:os').tmpdir(), 'smartchen-home-performance');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.ico': 'image/x-icon' };
let baseline = false;
const oldHtml = process.argv.includes('--compare') ? execFileSync('git', ['show', 'HEAD:dist/index.html'], { encoding: 'utf8' }) : null;
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  let file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store');
  res.end(baseline && pathname === '/' ? oldHtml : fs.readFileSync(file));
});

(async () => {
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-proxy-server'] });
  const errors = [], results = [];
  try {
    if (oldHtml) {
      baseline = true;
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
      await page.goto(origin); await page.evaluate(() => document.fonts.ready);
      await page.locator('.gallery-print.is-ready').nth(3).waitFor({ state: 'attached' });
      await page.screenshot({ path: path.join(output, 'home-before.png') });
      await page.hover('.identity-photo'); await page.waitForTimeout(3400);
      await page.screenshot({ path: path.join(output, 'filmmaker-before.png') });
      results.push({ baselineImageBytes: await page.evaluate(() => performance.getEntriesByType('resource').filter(r => /\.(jpg|webp)$/.test(r.name)).reduce((n, r) => n + r.encodedBodySize, 0)) });
      await page.close(); baseline = false;
    }
    for (const [name, width, height, dpr, touch] of [['desktop',1440,1000,2,false], ['phone',390,844,3,true], ['4k',3840,2160,2,false]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, isMobile: touch, hasTouch: touch });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin); await page.evaluate(() => document.fonts.ready);
      await page.locator('.gallery-print.is-ready').nth(3).waitFor({ state: 'attached' });
      await page.locator('.business-card-dock[data-state="settled"]').waitFor();
      const initial = await page.evaluate(() => ({
        resources: performance.getEntriesByType('resource').map(r => ({ url: r.name, bytes: r.encodedBodySize })),
        images: [...document.images].map(i => ({ src: i.currentSrc, loaded: i.complete && i.naturalWidth > 0, width: i.clientWidth })),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert(initial.images.every(i => i.loaded));
      assert(initial.images.slice(0, 4).every(i => i.src.endsWith('.webp')));
      assert(initial.images.at(-1).src.endsWith('/assets/selfportrait.jpg'), 'Portrait must load its original');
      assert.equal(await page.locator('.portrait-full img').evaluate(i => i.naturalWidth), 6000);
      assert(initial.resources.some(r => /three\.module/.test(r.url)), 'Three.js must load on arrival');
      assert(initial.resources.some(r => /home-motorsport/.test(r.url)), 'Car scene must load on arrival');
      assert(!initial.resources.some(r => /photography-preview\/.*\.jpg$/.test(r.url)), 'Film originals must not be downloaded');
      assert(!initial.overflow);
      const imageBytes = initial.resources.filter(r => /\.webp$/.test(r.url)).reduce((n,r) => n+r.bytes,0);
      assert(imageBytes < 1_100_000);
      results.push({ viewport: name, filmImageBytes: imageBytes, totalImageBytes: imageBytes + initial.resources.filter(r => /\/assets\/selfportrait\.jpg$/.test(r.url)).reduce((n,r) => n+r.bytes,0), totalBytes: initial.resources.reduce((n,r) => n+r.bytes,0), images: initial.images });
      await page.screenshot({ path: path.join(output, `home-${name}.png`) });
      if (touch) await page.goto(origin + '/?study=photo');
      else await page.hover('.identity-photo');
      await page.waitForFunction(() => document.querySelectorAll('.gallery-print.is-ready').length === 4);
      await page.waitForTimeout(3400);
      assert(await page.locator('.gallery-print img').evaluateAll(images => images.every(i => getComputedStyle(i).visibility === 'visible' && getComputedStyle(i).filter === 'none')));
      await page.screenshot({ path: path.join(output, `filmmaker-${name}.png`) });
      if (name === 'desktop') {
        await page.hover('.identity-cars');
        await page.waitForFunction(() => document.querySelector('.motor-scene').dataset.phase === 'preview', { timeout: 60000 });
        await page.click('.identity-cars'); await page.waitForFunction(() => document.body.dataset.motorPlaying === 'true');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('body').getAttribute('data-motor-playing'), null);
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results, null, 2));
    console.log('Passed: desktop/phone/4K responsive film photos; original 6000px portrait; arrival-time 3D loading; complete uncropped film previews; car hover/click/Escape; no page errors or overflow.');
  } finally { await browser.close(); await new Promise(done => server.close(done)); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
