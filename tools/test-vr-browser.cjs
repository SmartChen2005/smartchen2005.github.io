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
    for (const [index, item] of content.assignments[1].journey.entries()) {
      await page.locator(`[data-journey-button="${index}"]`).click();
      assert((await page.locator('#space-caption').textContent()).includes(item.title));
      assert.equal(await page.locator('[data-navigation]').getAttribute('data-space'), item.space);
    }
    await page.waitForTimeout(1600);
    assert(await page.locator('[data-navigation]').evaluate(e => Number(e.style.getPropertyValue('--ready')) > .99), 'The return journey deposits purchases and readies a reusable tool');
    await page.locator('[data-journey-button="2"]').press('Home');
    assert.equal(await page.locator('[data-navigation]').getAttribute('data-journey'), '0');

    // Actual wheel input advances and reverses both stories without capturing scroll.
    const alignStop = async (locator) => {
      const delta = await locator.evaluate(e => {
        const rect = e.closest('[data-scroll-stop]').getBoundingClientRect();
        return rect.top + rect.height / 2 - innerHeight * (innerWidth <= 760 ? .75 : .55);
      });
      await page.mouse.move(30, 250);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(350);
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const index of [0, 1, 2, 3, 2, 1, 0]) {
        await alignStop(page.locator(`[data-step-button="${index}"]`));
        assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), String(index), `Wheel progression/reversal at ${width}px`);
      }
      for (const index of [0, 1, 2, 1, 0]) {
        await alignStop(page.locator(`[data-journey-button="${index}"]`));
        assert.equal(await page.locator('[data-navigation]').getAttribute('data-journey'), String(index), `Preparation loop progression/reversal at ${width}px`);
        assert.equal(await page.locator('[data-navigation]').getAttribute('data-space'), content.assignments[1].journey[index].space);
      }
      const widthPx = await page.locator('.wheel-diagram').evaluate(e => e.getBoundingClientRect().width);
      assert(widthPx > (width === 390 ? 300 : 800), 'The explanatory drawing has a substantial reading area');
      const pace = await page.locator('.procedure .story-stop').first().evaluate(e => e.getBoundingClientRect().height);
      assert(pace >= (width === 390 ? 300 : 280), 'Each action has a slower native-scroll reading distance');
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
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), '3', 'Manual selection persists while idle');
    assert(await page.locator('[data-procedure]').evaluate(e => Number(e.style.getPropertyValue('--remove')) > .99), 'The complete wheel removal reaches its storage state');
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
      await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
      await page.waitForTimeout(150);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `No horizontal overflow at ${width}px`);
      const titleTop = await page.locator('#wheel-removal-training-title').evaluate(e => e.getBoundingClientRect().top);
      assert(titleTop < (width > 760 ? 660 : 680), `The opening leads directly into the first assignment at ${width}px`);
      const boxes = await page.locator('.video iframe').evaluateAll(es => es.map(e => { const b = e.getBoundingClientRect(); return [b.width, b.height]; }));
      boxes.forEach(([w, h]) => assert(Math.abs(w / h - 16 / 9) < .02, 'Videos retain 16:9'));
      if (output && [1440,390,320].includes(width)) {
        await page.waitForTimeout(750);
        await page.screenshot({ path: path.join(output, `vr-${width}.png`) });
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hero-art').count(), 0, 'The meaningless opening decoration is removed');
    await page.locator('[data-step-button="1"]').click();
    await alignStop(page.locator('[data-step-button="3"]'));
    assert.equal(await page.locator('[data-procedure]').getAttribute('data-step'), '1', 'Reduced motion keeps manual control');
    assert.equal(await page.locator('[data-procedure]').evaluate(e=>Number(e.style.getPropertyValue('--loosen'))), 1, 'Reduced motion renders the selected action immediately');
    await page.emulateMedia({ forcedColors: 'active' });
    assert.equal(await page.locator('[data-step-button="1"]').getAttribute('aria-pressed'), 'true');
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
    assert(await fallback.getByText(content.assignments[1].journey[2].description, { exact: true }).isVisible());
    await nojs.close();
    assert.deepEqual(errors, []);
    console.log('Passed: four procedure actions and three preparation stages; real wheel progression/reversal at desktop/phone widths; larger drawings and slower reading distance; sticky placement; manual override and idle stability; keyboard access; PDF responses; five viewport widths; reduced motion; forced colors; no-JS content; zero page exceptions.');
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
