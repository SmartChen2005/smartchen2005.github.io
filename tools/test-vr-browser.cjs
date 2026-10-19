const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.VR_PREVIEW_URL || 'http://127.0.0.1:4174';
const output = process.env.VR_QA_OUTPUT;
const route = '/projects/vr-for-skill-learning/';
const content = require('./vr-source/content.json');
if (output) fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-proxy-server'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('[data-step-button="0"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('button:disabled').count(), 0, 'Client enhancement loads');
    for (const [index, step] of content.assignments[0].steps.entries()) {
      const button = page.locator(`[data-step-button="${index}"]`);
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#procedure-caption').textContent(), step.description);
      assert.equal(await page.locator('[data-procedure] [aria-pressed=true]').count(), 1);
      assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), String(index));
    }
    await page.locator('[data-step-button="3"]').press('Home');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-step-button="1"]').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('[data-step-button="1"]').getAttribute('aria-pressed'), 'true');
    for (const space of content.assignments[1].spaces) {
      await page.locator(`[data-space-button="${space.id}"]`).click();
      assert.equal(await page.locator('#space-caption').textContent(), space.description);
      assert.equal(await page.locator('[data-navigation]').getAttribute('data-space'), space.id);
    }
    await page.locator('[data-space-button=store]').press('ArrowLeft');
    assert.equal(await page.locator('[data-space-button=garage]').getAttribute('aria-pressed'), 'true');
    await page.locator('summary').first().click();
    assert.equal(await page.locator('details').first().getAttribute('open'), '');
    for (const a of content.assignments) {
      const response = await context.request.get(origin + route + 'files/' + a.pdf);
      assert.equal(response.status(), 200);
      assert((await response.body()).subarray(0, 5).equals(Buffer.from('%PDF-')));
    }
    for (const width of [1440, 1024, 760, 390, 320]) {
      await page.setViewportSize({ width, height: width < 760 ? 844 : 1000 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `No horizontal overflow at ${width}px`);
      const boxes = await page.locator('.video iframe').evaluateAll(es => es.map(e => { const b = e.getBoundingClientRect(); return [b.width, b.height]; }));
      boxes.forEach(([w, h]) => assert(Math.abs(w / h - 16 / 9) < .02, 'Videos retain 16:9'));
      if (output && [1440,390,320].includes(width)) {
        await page.waitForTimeout(750);
        await page.screenshot({ path: path.join(output, `vr-${width}.png`), fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hero-art svg').evaluate(e => getComputedStyle(e).animationName), 'none');
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('.hero-art').isVisible(), false);
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    await page.goto(origin + '/projects/');
    await page.getByRole('link').filter({ hasText: 'VR for Skill Learning' }).click();
    assert.equal(new URL(page.url()).pathname, route);
    await page.goto(origin + '/projects/multiverse-all-star-battlefront/');
    assert.equal(await page.locator('header a[href="../"]').count(), 1, 'Sibling uses the same Projects navigation');
    const nojs = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await nojs.newPage();
    await fallback.goto(origin + route, { waitUntil: 'domcontentloaded' });
    assert.equal(await fallback.locator('iframe').count(), 2);
    assert.equal(await fallback.locator('.document-link').count(), 2);
    assert(await fallback.getByText(content.assignments[0].steps[3].description, { exact: true }).isVisible());
    assert(await fallback.getByText(content.assignments[1].spaces[1].description, { exact: true }).isVisible());
    await nojs.close();
    assert.deepEqual(errors, []);
    console.log('Passed: all six states, exclusive pressed states, live descriptions, arrow/Home keyboard access, disclosures, real PDF HTTP responses, Projects round trip, five viewport widths, 16:9 media, reduced motion, forced colors, sibling navigation, no-JS content, zero page exceptions.');
    // External playback is evidence rather than an unconditional test: network/account restrictions are reported honestly.
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    for (const a of content.assignments) {
      const frame = page.frameLocator(`iframe[src*="${a.video}"]`);
      try {
        await frame.getByRole('button', { name: /^Play( video)?$/ }).first().click({ timeout: 15000 });
        await page.waitForTimeout(3000);
        const playback = await frame.locator('video').evaluate(v => ({ time: v.currentTime, paused: v.paused, ready: v.readyState }));
        const message = await frame.locator('body').innerText();
        console.log(JSON.stringify({ video: a.video, playback, message: message.slice(0, 450) }));
      } catch (error) {
        const iframe = page.frames().find(f => f.url().includes(a.video));
        console.log(JSON.stringify({ video: a.video, playbackVerified: false, reason: error.message.slice(0, 130), frameText: iframe ? (await iframe.locator('body').innerText().catch(() => '')).slice(0, 450) : 'Frame unavailable' }));
      }
    }
    if (output) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({ path: path.join(output, 'vr-desktop-final.png'), fullPage: true });
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
