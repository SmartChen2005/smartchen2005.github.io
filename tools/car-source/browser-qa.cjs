const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '../../dist');
const output = process.env.CAR_QA_OUTPUT;
const baseline = process.env.CAR_QA_BASELINE === '1';
const types = { '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end(); return; }
  const target = fs.existsSync(file) && fs.statSync(file).isDirectory() ? path.join(file, 'index.html') : file;
  if (!fs.existsSync(target)) { response.writeHead(404).end(); return; }
  response.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(response);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.CAR_LIVE_URL || `http://127.0.0.1:${server.address().port}`);
    await page.evaluate(() => document.fonts.ready);
    const cars = page.locator('.identity-cars');
    await cars.hover();
    if (baseline) {
      await page.waitForTimeout(1500);
      if (output) await page.screenshot({ path: path.join(output, 'car-before.png') });
      return;
    }
    // Follow the real clock rather than replacing it with synthetic time jumps.
    for (const phase of ['ignition','rally','thermal','arboreal','orbit','return','idle']) {
      await page.waitForFunction(expected => document.querySelector('.motor-scene').dataset.phase === expected, phase);
      await page.waitForTimeout(phase === 'idle' ? 50 : 520);
      const screenshot = await page.screenshot(output ? { path: path.join(output, `car-${phase}.png`) } : {});
      const bounds = await page.locator('.sentence').boundingBox();
      const { data } = await sharp(screenshot).extract({left:Math.floor(bounds.x),top:Math.floor(bounds.y),width:Math.floor(bounds.width),height:Math.floor(bounds.height)}).removeAlpha().raw().toBuffer({resolveWithObject:true});
      let bright = 0; for (let i=0;i<data.length;i+=3) if (data[i]>150 && data[i+1]>150 && data[i+2]>150) bright++;
      if (bright < 100) console.log(await page.locator('.sentence').evaluate(e => ({world:document.body.dataset.world,color:getComputedStyle(e).color,visibility:getComputedStyle(e).visibility,font:document.fonts.status,fonts:[...document.fonts].map(f=>[f.family,f.status]),html:e.outerHTML})));
      assert(bright > 100, 'The homepage sentence must remain painted above every scene');
      assert.equal(await page.locator('.motor-scene').evaluate(c => c.dataset.phase), phase);
    }
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.motor-scene').getAttribute('data-phase'), 'idle');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.motor-scene').evaluate(c => getComputedStyle(c).visibility), 'hidden');
    await cars.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    assert.equal(await cars.getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(0, 0);
    await cars.hover();
    await page.waitForTimeout(150);
    assert.equal(await page.locator('.motor-scene').getAttribute('data-phase'), 'idle');
    if (output) await page.screenshot({ path: path.join(output, 'car-reduced.png') });
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.move(0, 0);
    await page.setViewportSize({ width: 844, height: 390 });
    await cars.hover();
    await page.waitForFunction(() => document.querySelector('.motor-scene').dataset.phase === 'rally');
    await page.waitForTimeout(450);
    if (output) await page.screenshot({ path: path.join(output, 'car-landscape.png') });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    phone.on('pageerror', error => errors.push(error.message));
    await phone.goto(`http://127.0.0.1:${server.address().port}`);
    await phone.locator('.identity-cars').tap();
    await phone.waitForFunction(() => document.querySelector('.motor-scene').dataset.phase === 'orbit');
    await phone.waitForTimeout(400);
    if (output) await phone.screenshot({ path: path.join(output, 'car-phone.png') });
    assert(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await phone.locator('.identity-cars').getAttribute('aria-pressed'), 'true');
    await phone.locator('.identity-cars').tap();
    await phone.waitForTimeout(450);
    assert.equal(await phone.locator('.motor-scene').evaluate(c => getComputedStyle(c).visibility), 'hidden');
    // Photos blocked/offline: the geometry and car silhouettes must still render.
    await page.route('**/assets/cars/**', route => route.abort());
    await page.reload();
    await page.locator('.identity-cars').hover();
    await page.waitForFunction(() => document.querySelector('.motor-scene').dataset.phase === 'rally');
    await page.context().setOffline(true);
    await page.waitForFunction(() => document.querySelector('.motor-scene').dataset.phase === 'thermal');
    await page.context().setOffline(false);
    assert.deepEqual(errors, []);
    console.log('Passed: real 14s sequence, decoded assets, idle, keyboard/Escape, reduced motion, landscape, touch toggle, narrow overflow, failed media/offline, no page errors.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
