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
      assert((await page.locator('#procedure-caption').textContent()).includes(step.title));
      assert.equal(await page.locator('[data-procedure] [aria-pressed=true]').count(), 1);
      assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), String(index));
    }
    await page.locator('[data-step-button="3"]').press('Home');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-step-button="1"]').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('[data-step-button="1"]').getAttribute('aria-pressed'), 'true');
    for (const space of content.assignments[1].spaces) {
      await page.locator(`[data-space-button="${space.id}"]`).click();
      assert((await page.locator('#space-caption').textContent()).includes(space.title));
      assert.equal(await page.locator('[data-navigation]').getAttribute('data-space'), space.id);
    }
    await page.locator('[data-space-button=store]').press('ArrowLeft');
    assert.equal(await page.locator('[data-space-button=garage]').getAttribute('aria-pressed'), 'true');

    // Actual wheel input advances and reverses both stories without capturing scroll.
    const alignStop = async (locator) => {
      const delta = await locator.evaluate(e => {
        const rect = e.closest('[data-scroll-stop]').getBoundingClientRect();
        return rect.top + rect.height / 2 - innerHeight * .55;
      });
      await page.mouse.move(30, 250);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(250);
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const index of [0, 1, 2, 3, 2, 1, 0]) {
        await alignStop(page.locator(`[data-step-button="${index}"]`));
        assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), String(index), `Wheel progression/reversal at ${width}px`);
      }
      for (const space of ['garage', 'store', 'garage']) {
        await alignStop(page.locator(`[data-space-button="${space}"]`));
        assert.equal(await page.locator('[data-navigation]').getAttribute('data-space'), space, `Spatial wheel progression/reversal at ${width}px`);
      }
    }
    // The illustration really stays visible between stops, without hiding text.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await alignStop(page.locator('[data-step-button="2"]'));
    const diagramTop = await page.locator('.procedure .study-visual').evaluate(e => e.getBoundingClientRect().top);
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(200);
    const newTop = await page.locator('.procedure .study-visual').evaluate(e => e.getBoundingClientRect().top);
    assert(Math.abs(diagramTop - newTop) < 2, 'The diagram rests beside the scrolling procedure');
    await page.locator('[data-step-button="1"]').click();
    await page.locator('[data-step-button="1"]').press('End');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), '3', 'Manual selection persists while idle');
    assert.equal(await page.locator('#procedure-caption').getAttribute('aria-live'), 'polite');
    await alignStop(page.locator('[data-step-button="1"]'));
    assert.equal(await page.locator('#procedure-caption').getAttribute('aria-live'), 'off', 'Scroll changes do not flood assistive announcements');

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
      await page.waitForTimeout(150);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `No horizontal overflow at ${width}px`);
      const titleTop = await page.locator('#wheel-removal-training-title').evaluate(e => e.getBoundingClientRect().top);
      assert(titleTop < (width > 760 ? 660 : 680), `The opening leads directly into the first assignment at ${width}px`);
      const boxes = await page.locator('.video iframe').evaluateAll(es => es.map(e => { const b = e.getBoundingClientRect(); return [b.width, b.height]; }));
      boxes.forEach(([w, h]) => assert(Math.abs(w / h - 16 / 9) < .02, 'Videos retain 16:9'));
      if (output && [1440,390,320].includes(width)) {
        await page.waitForTimeout(750);
        await page.screenshot({ path: path.join(output, `vr-${width}.png`), fullPage: true });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hero-art svg').evaluate(e => getComputedStyle(e).animationName), 'none');
    await page.locator('[data-step-button="1"]').click();
    await alignStop(page.locator('[data-step-button="3"]'));
    assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), '1', 'Reduced motion keeps manual control');
    assert.equal(await page.locator('.orange-quarter').evaluate(e => getComputedStyle(e).transform), 'none');
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
    console.log('Passed: six states; real wheel progression and reversal at desktop/phone widths; sticky diagram; manual override and idle stability; quiet automatic announcements; compact opening; keyboard access; PDF responses; Projects round trip; five viewport widths; 16:9 media; reduced motion; forced colors; no-JS content; zero page exceptions.');
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
