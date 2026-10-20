const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const content = require('./masb-source/experience.json');
const origin = process.env.MASB_PREVIEW_URL || 'http://127.0.0.1:4174';
const output = process.env.MASB_QA_OUTPUT;
const route = '/projects/multiverse-all-star-battlefront/';
if (output) fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-proxy-server'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + route);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('[data-process-button]:disabled').count(), 0);
    for (let i = 0; i < 4; i++) {
      await page.locator(`[data-process-button="${i}"]`).click();
      await page.waitForTimeout(1500);
      assert.equal(await page.locator('[data-battle-process]').getAttribute('data-stage'), String(i));
      assert.equal(await page.locator('[data-process-button][aria-pressed=true]').count(), 1);
      assert.equal(await page.locator('.process-scene[aria-hidden=false]').count(), 1);
      assert.equal(await page.locator('.process-scene:not([inert])').count(), 1);
      if (i === 0) assert.equal(await page.locator('[data-typed-prompt]').textContent(), content.example.prompt);
      if (i === 1) assert.equal(await page.locator('[data-stat-value="120"]').textContent(), '120');
      if (i === 2) assert.equal(await page.locator('[data-opponent-health]').locator('..').getAttribute('aria-valuenow'), '0');
      if (output) await page.screenshot({ path: path.join(output, `desktop-stage-${i}.png`) });
    }
    await page.locator('[data-process-button="3"]').press('Home');
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(1600);
    assert.equal(await page.locator('[data-process-button="1"]').evaluate(e => e === document.activeElement), true);
    assert.equal(await page.locator('[data-battle-process]').getAttribute('data-stage'), '1', 'Manual selection survives focus scrolling and settling');
    assert.equal(await page.locator('.process-current').getAttribute('aria-live'), 'polite');

    const align = async index => {
      const delta = await page.locator(`[data-process-button="${index}"]`).evaluate(e => {
        const r = e.closest('[data-process-stop]').getBoundingClientRect();
        return r.top + r.height / 2 - innerHeight * (innerWidth <= 760 ? .75 : .55);
      });
      await page.mouse.move(12, 250);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(350);
    };
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const index of [0, 1, 2, 3, 2, 1, 0]) {
        await align(index);
        assert.equal(await page.locator('[data-battle-process]').getAttribute('data-stage'), String(index), `Actual wheel progression/reversal at ${width}px`);
      }
      assert.equal(await page.locator('.process-current').getAttribute('aria-live'), 'off');
      await align(1);
      const top = await page.locator('.process-sticky').evaluate(e => e.getBoundingClientRect().top);
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(200);
      assert(Math.abs(await page.locator('.process-sticky').evaluate(e => e.getBoundingClientRect().top) - top) < 2, 'Canvas stays beside/above the moving stages');
      if (output) await page.screenshot({ path: path.join(output, `scroll-${width}.png`) });
    }
    // Sample three positions inside the battle chapter, including actual wheel input.
    await page.setViewportSize({ width: 1440, height: 1000 });
    const positions = await page.locator('[data-process-stop]').evaluateAll(es => es.map(e => { const r=e.getBoundingClientRect();return scrollY+r.top+r.height/2; }));
    for (const [progress, expectedTurn] of [[.52, '0'], [.65, '1'], [.80, '2']]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), positions[0] + (positions[3]-positions[0])*progress - 550);
      await page.waitForTimeout(1500);
      assert.equal(await page.locator('[data-battle-process]').getAttribute('data-turn'), expectedTurn);
    }
    for (const width of [1440, 1024, 760, 390, 320]) {
      await page.setViewportSize({ width, height: width < 760 ? 844 : 1000 });
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `No horizontal overflow at ${width}px`);
      for (let index = 0; index < 4; index++) {
        await page.locator(`[data-process-button="${index}"]`).click();
        await page.waitForTimeout(300);
        const fits = await page.locator(`[data-process-scene="${index}"]`).evaluate(e => e.scrollHeight <= e.clientHeight + 2 && e.scrollWidth <= e.clientWidth + 2);
        assert(fits, `Scene ${index} content fits at ${width}px`);
      }
      if (output && [390,320].includes(width)) await page.screenshot({ path: path.join(output, `result-${width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-process-button="1"]').click();
    await align(3);
    assert.equal(await page.locator('[data-battle-process]').getAttribute('data-stage'), '1');
    assert.equal(await page.locator('[data-stat-value="120"]').textContent(), '120');
    await page.emulateMedia({ forcedColors: 'active' });
    await page.locator('[data-process-button="3"]').click();
    assert.equal(await page.locator('[data-process-button="3"]').getAttribute('aria-pressed'), 'true');
    await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    const pdf = await context.request.get(origin + route + 'files/' + content.guide.file);
    assert.equal(pdf.status(), 200);
    assert.equal((await pdf.body()).subarray(0,5).toString(), '%PDF-');
    assert(await page.locator('.process-availability').isVisible());
    assert((await page.locator('.process-availability').textContent()).includes('Application currently unavailable.'));
    const image = page.locator('[data-preview]').first();
    await image.click();
    assert(await page.locator('.image-viewer').isVisible());
    await page.keyboard.press('Escape');
    assert.equal(await image.evaluate(e => e === document.activeElement), true);
    await page.goto(origin + '/projects/');
    await page.locator('a[href="multiverse-all-star-battlefront/"]').click();
    assert.equal(new URL(page.url()).pathname, route);
    const fallbackContext = await browser.newContext({ javaScriptEnabled: false });
    const fallback = await fallbackContext.newPage();
    await fallback.goto(origin + route);
    for (const step of content.steps) assert(await fallback.getByText(step.description, { exact: true }).isVisible());
    assert(await fallback.locator('.user-guide a').isVisible());
    assert.equal(await fallback.locator('[data-preview]').count(), 19);
    await fallbackContext.close();
    assert.deepEqual(errors, []);
    console.log('Passed: 4 manual/keyboard stages; real wheel progression and reverse at desktop/phone widths; 3 battle pages and example HP; sticky canvas; manual override; 5 responsive widths and all scene bounds; reduced motion; forced colors; original PDF HTTP response; original image viewer/focus restoration; Projects navigation; no-JS content; no page exceptions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
