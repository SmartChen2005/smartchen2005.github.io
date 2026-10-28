const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const origin = process.env.CURSOR_PREVIEW_URL || 'http://127.0.0.1:4185';
const output = process.env.CURSOR_QA_DIR || path.join(os.tmpdir(), 'smartchen-home-cursor-qa');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  const browserTransitionAborts = [];
  const checks = [];
  function recordError(error) {
    // Chrome can reject its existing CSS cross-document transition when opt-in
    // changes. Reproduced with home-cursor.mjs blocked; navigation still works.
    if (error.name === 'InvalidStateError' && error.message === 'Transition was aborted because of invalid state. ViewTransition opt-in disabled') {
      browserTransitionAborts.push(error.message);
    } else errors.push(error.message);
  }
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      const raf = window.requestAnimationFrame.bind(window), cancel = window.cancelAnimationFrame.bind(window);
      window.cursorFrames = new Set(); window.cursorMaxFrames = 0;
      window.requestAnimationFrame = callback => {
        const own = new Error().stack.includes('site-cursor.mjs');
        const id = raf(time => { window.cursorFrames.delete(id); callback(time); });
        if (own) { window.cursorFrames.add(id); window.cursorMaxFrames = Math.max(window.cursorMaxFrames, window.cursorFrames.size); }
        return id;
      };
      window.cancelAnimationFrame = id => { window.cursorFrames.delete(id); cancel(id); };
    });
    const page = await context.newPage();
    page.on('pageerror', recordError);
    const read = () => page.locator('.home-cursor').evaluate(el => ({
      mode: el.dataset.mode, identity: el.dataset.identity, hidden: el.hidden,
      rect: el.getBoundingClientRect().toJSON(),
      color: getComputedStyle(el).color, arrow: +el.style.getPropertyValue('--cursor-arrow'),
      fill: +el.style.getPropertyValue('--cursor-fill'), edge: +el.style.getPropertyValue('--cursor-edge'),
      attraction: (() => { const shadow = document.querySelector('.site-cursor-attraction'); return {
        rect: shadow.getBoundingClientRect().toJSON(), light: shadow.style.getPropertyValue('--light-x'),
        glow: +shadow.style.getPropertyValue('--cursor-glow'), color: getComputedStyle(shadow).color,
      }; })(),
      active: document.documentElement.classList.contains('has-home-cursor'),
      frames: window.cursorFrames.size, maxFrames: window.cursorMaxFrames,
    }));
    const settle = async () => {
      await page.waitForFunction(() => !window.cursorFrames.size);
    };
    const snap = name => page.screenshot({ path: path.join(output, `${name}.png`) });
    await page.goto(origin + '/');
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.business-card-dock[data-state="settled"]').waitFor();
    assert.equal((await read()).active, false, 'Native pointer until mouse input');
    const baseline = await page.locator('.sentence').boundingBox();
    await page.mouse.move(80, 740); await settle();
    let state = await read();
    assert.equal(state.mode, 'dot'); assert.equal(state.rect.width, 13);
    assert(Math.abs(state.rect.x + 6.5 - 80) < .1);
    assert.equal(await page.locator('body').evaluate(e => getComputedStyle(e).cursor), 'none');
    await snap('dot'); checks.push('Free dot tracks the mouse; native cursor is replaced only after initialization.');

    for (const id of ['name', 'games', 'photo', 'cars']) {
      const target = page.locator(`[data-identity="${id}"]`);
      const bounds = await target.boundingBox();
      await page.mouse.move(bounds.x + bounds.width * .25, bounds.y + bounds.height / 2); await settle();
      state = await read();
      assert.equal(state.identity, id); assert.equal(state.mode, 'identity');
      assert.equal(state.fill, .88, 'Homepage actions use the shared inverted action circle');
      assert.equal(state.rect.width, 26); assert.equal(state.rect.height, 26);
      assert.equal(state.edge, 0);
      assert(Math.abs(state.rect.x + 13 - bounds.x - bounds.width * .25) < .15, 'The circle follows the real pointer');
      assert.equal(state.attraction.glow, 1, 'Gray attraction remains behind the word');
      assert(Math.abs(state.attraction.rect.width - bounds.width - 20) < .15);
      assert(Math.abs(state.attraction.rect.x - bounds.x + 10) < .15);
      const light = parseFloat(state.attraction.light);
      await page.mouse.move(bounds.x + bounds.width * .75, bounds.y + bounds.height / 2); await settle();
      assert(parseFloat((await read()).attraction.light) > light + bounds.width * .4, 'Light encodes the real pointer position');
      if (id === 'cars') assert.equal((await read()).attraction.color, 'rgb(242, 241, 237)');
      await snap(id);
    }
    assert.deepEqual(await page.locator('.sentence').boundingBox(), baseline, 'No heading layout changes');
    // Reverse direction before a spring can settle: no stale target or second RAF.
    for (const id of ['name', 'photo', 'games', 'cars', 'games', 'name']) {
      const box = await page.locator(`[data-identity="${id}"]`).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
    await settle(); assert.equal((await read()).identity, 'name');
    assert.equal((await read()).maxFrames, 1);
    checks.push('All four identities have the shared plain 26px inversion circle; separate gray attraction covers padded bounds, with moving light and pale ink in the dark world.');

    await page.mouse.move(80, 740); await settle();
    const name = await page.locator('.identity-name').boundingBox();
    await page.mouse.move(name.x - 8, name.y + name.height / 2); await settle();
    assert.equal((await read()).identity, 'name', 'Ten-pixel magnet is a real hit region');
    const expanded = await page.locator('.identity-name').getAttribute('aria-expanded');
    await page.mouse.click(name.x - 8, name.y + name.height / 2);
    assert.notEqual(await page.locator('.identity-name').getAttribute('aria-expanded'), expanded, 'Padded-region clicks activate the real button');
    await page.mouse.move(name.x - 12, name.y + name.height / 2); await settle();
    assert.equal((await read()).mode, 'dot', 'Clean release outside the magnet');
    await page.locator('.identity-name').click();
    await page.locator('.business-card-dock[data-state="settled"]').waitFor();
    for (const selector of ['.card-email', '.card-links a:first-child', '.card-links a:last-child']) {
      await page.locator(selector).hover(); await settle();
      state = await read();
      assert.equal(state.mode, 'link'); assert.equal(state.rect.width, 34); assert.equal(state.arrow, 1);
    }
    await snap('link');
    const pillWidth = (await read()).rect.width;
    await page.mouse.down(); await settle();
    assert((await read()).rect.width < pillWidth - 2, 'Pointer-down gives press feedback');
    await page.mouse.move(80, 740); await page.mouse.up(); await settle();
    checks.push('Magnet padding activates native targets; every card link has an arrow pill and press/release feedback.');

    await context.route('**/assets/hongyi-chen-resume.pdf', route => route.fulfill({ contentType: 'text/html', body: '<title>Resume target</title>' }));
    const popupPromise = context.waitForEvent('page');
    await page.locator('.card-links a:first-child').click();
    const popup = await popupPromise; await popup.waitForLoadState();
    assert(popup.url().endsWith('/assets/hongyi-chen-resume.pdf'));
    await popup.close(); await page.bringToFront();
    checks.push('Résumé still opens its real destination in a separate tab.');

    await page.mouse.move(80, 740); await settle();
    await page.keyboard.press('Tab');
    assert.equal((await read()).active, false, 'Keyboard restores native cursor');
    assert(await page.evaluate(() => document.activeElement.matches(':focus-visible')));
    await page.locator('.identity-name').focus(); await page.keyboard.press('Enter');
    if (await page.locator('.identity-name').getAttribute('aria-expanded') === 'false') await page.keyboard.press('Enter');
    await page.locator('.business-card-dock[data-state="settled"]').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.identity-name').getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('.identity-name').evaluate(e => e === document.activeElement), true);
    checks.push('Keyboard focus, Enter and Escape retain existing behavior.');

    await page.locator('.identity-cars').hover(); await settle();
    await page.locator('.identity-cars').click();
    await page.waitForFunction(() => document.body.hasAttribute('data-motor-playing'));
    await settle(); assert.equal((await read()).mode, 'dot', 'Hidden movie trigger releases the frame without moving mouse');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('body').getAttribute('data-motor-playing'), null);
    await page.mouse.move(80, 740); await settle();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal((await read()).active, false); assert.equal((await read()).frames, 0);
    await page.mouse.move(90, 740); await settle();
    await page.mouse.move(-5, -5); assert.equal((await read()).active, false);
    await page.mouse.move(100, 740); await settle();
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
    assert.equal((await read()).active, false);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
    await page.mouse.move(110, 740); await settle();
    assert.equal((await read()).active, true); assert.equal((await read()).maxFrames, 1);
    checks.push('Movie, blur, viewport exit and page lifecycle release state; one cursor RAF at most, none when settled.');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal((await read()).active, false);
    await page.locator('.identity-name').hover(); assert.equal((await read()).active, false);
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await page.mouse.move(80, 740); assert.equal((await read()).active, false);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.mouse.move(90, 740); await settle(); assert.equal((await read()).active, true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.identity-games').hover(); await settle();
    assert.equal((await read()).identity, 'games'); await snap('narrow-mouse');
    checks.push('Reduced motion and forced colors restore the native pointer; narrow mouse layout still works.');

    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', recordError);
    await touchPage.goto(origin + '/');
    await touchPage.locator('.business-card-dock[data-state="settled"]').waitFor();
    await touchPage.locator('.identity-name').tap();
    assert.equal(await touchPage.locator('.home-cursor').evaluate(e => e.hidden), true);
    assert.equal(await touchPage.locator('html').evaluate(e => e.classList.contains('has-home-cursor')), false);
    assert.equal(await touchPage.locator('.identity-name').getAttribute('aria-expanded'), 'false');
    await touchPage.screenshot({ path: path.join(output, 'touch.png') });
    await touchContext.close();

    // Failure to load the enhancement must never hide the native pointer.
    const fallback = await context.newPage();
    await fallback.route('**/home-cursor.mjs*', route => route.abort());
    await fallback.goto(origin + '/');
    await fallback.mouse.move(80, 740);
    assert.equal(await fallback.locator('.home-cursor').count(), 0);
    assert.equal(await fallback.locator('html').evaluate(e => e.classList.contains('has-home-cursor')), false);
    await fallback.close();
    checks.push('Touch remains native; a failed cursor-module request leaves the native cursor intact.');

    // Use a fresh document for real navigation: the synthetic pagehide/pageshow
    // lifecycle stress above is intentionally not an actual browser traversal.
    const navigation = await context.newPage();
    navigation.on('pageerror', recordError);
    await navigation.goto(origin + '/');
    await navigation.locator('.identity-games').hover();
    await navigation.waitForTimeout(350);
    await navigation.locator('.identity-games').click();
    await navigation.waitForURL('**/projects/');
    assert.equal(await navigation.locator('.home-cursor').count(), 0, 'The feature is confined to the homepage');
    await navigation.goBack(); await navigation.locator('.identity-name').waitFor();
    await navigation.mouse.move(80, 740);
    await navigation.waitForFunction(() => document.querySelector('.home-cursor')?.dataset.mode === 'dot' && document.documentElement.classList.contains('has-home-cursor'));
    await navigation.close();
    checks.push('Actual Projects navigation and browser Back restore a working homepage pointer.');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ checks, pageErrors: errors, browserTransitionAborts }, null, 2) + '\n');
    console.log(`Passed: ${checks.length} browser groups; no unexpected page errors; ${browserTransitionAborts.length} known Chrome transition cancellations. Evidence: ${output}`);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
