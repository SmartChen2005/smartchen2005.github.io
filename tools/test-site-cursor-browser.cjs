const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(playwrightModule);
const sharp = require(process.env.SHARP_MODULE || path.join(path.dirname(require.resolve(playwrightModule + '/package.json')), '..', 'sharp'));
const origin = process.env.CURSOR_PREVIEW_URL || 'http://127.0.0.1:4185';
const output = process.env.SITE_CURSOR_QA_DIR || path.join(os.tmpdir(), 'smartchen-site-cursor-qa');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const { hasDedicatedPointer } = await import('./site-cursor.mjs');
  const routes = fs.readdirSync('dist', { recursive: true }).filter(file => file.endsWith('.html'))
    .filter(file => !hasDedicatedPointer(path.join('dist', file), fs.readFileSync(path.join('dist', file), 'utf8')))
    .map(file => '/' + file.replaceAll('\\', '/').replace(/index\.html$/, ''));
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [], cancellations = [], checks = [];
  const recordError = error => {
    if (error.name === 'InvalidStateError' && error.message === 'Transition was aborted because of invalid state. ViewTransition opt-in disabled') cancellations.push(error.message);
    else errors.push(error.message);
  };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    // Embedded third-party players retain native interaction; no external player
    // needs to load for this local pointer regression.
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.on('pageerror', recordError);
    const state = () => page.locator('.site-cursor').evaluate(e => ({
      hidden: e.hidden, mode: e.dataset.mode, active: document.documentElement.classList.contains('has-site-cursor'),
      parent: e.parentElement.tagName, radius: parseFloat(e.style.borderRadius),
    }));
    const waitMode = mode => page.waitForFunction(mode => {
      const cursor = document.querySelector('.site-cursor');
      const width = { dot: 13, link: 34, button: 22, magnify: 34 }[mode];
      const capsule = mode === 'link' || mode === 'magnify';
      return cursor && !cursor.hidden && cursor.dataset.mode === mode && Math.abs(parseFloat(cursor.style.width) - width) < .1
        && (!capsule || cursor.style.borderRadius === '13px' && cursor.style.height === '26px'
          && +cursor.style.getPropertyValue('--cursor-fill') === .88);
    }, mode);
    const goto = async route => {
      await page.goto(origin + route, { waitUntil: 'load' });
      await page.locator('.site-cursor').waitFor({ state: 'attached' });
    };
    const brightness = async (x, y) => {
      const buffer = await page.screenshot({ clip: { x: x - 1, y: y - 1, width: 3, height: 3 } });
      const data = await sharp(buffer).ensureAlpha().raw().toBuffer();
      return .2126 * data[16] + .7152 * data[17] + .0722 * data[18];
    };
    for (let i = 0; i < routes.length; i++) {
      await goto(routes[i]);
      await page.mouse.move(8 + i % 4, 610 + i % 3);
      await waitMode('dot');
      assert.equal((await state()).active, true, routes[i]);
      assert.equal(await page.locator('.site-cursor').count(), 1, 'One controller per document');
    }
    checks.push(`All ${routes.length} live pages load exactly one working shared pointer.`);
    console.log(`Checked shared pointer on ${routes.length} live routes.`);

    for (const [route, name, tone] of [['/projects/', 'dark-projects', 'dark'], ['/gallery/', 'light-gallery', 'light'], ['/projects/polaroid-of-yesterday/', 'dark-room', 'dark']]) {
      await goto(route);
      await page.mouse.move(8, 700); await waitMode('dot');
      await page.keyboard.press('Escape'); // Hide the cursor for a local background sample.
      const x = 9, y = route.includes('polaroid') ? 9 : 300;
      const background = await brightness(x, y);
      await page.mouse.move(x, y); await waitMode('dot');
      const pointer = await brightness(x, y);
      if (tone === 'dark') assert(pointer > background + 60, `Pale pointer over dark surface: ${route} (${background} -> ${pointer})`);
      else assert(pointer < background - 80, `Dark pointer over white surface: ${route} (${background} -> ${pointer})`);
      await page.screenshot({ path: path.join(output, name + '.png') });
    }
    checks.push('Actual rendered pixels prove pale dots on dark Projects/room backgrounds and a dark dot on white Gallery.');

    await goto('/gallery/');
    await page.locator('.media-link').first().hover(); await waitMode('link');
    for (const route of ['/gallery/analog-and-digital/', '/gallery/rhythms-of-chaos/']) {
      await goto(route);
      const photo = page.locator('.story-image-open').first();
      await photo.hover(); await waitMode('magnify');
      assert.equal((await state()).radius, 13, 'Photo details use the navigation capsule geometry');
      assert.equal((await page.locator('.site-cursor').boundingBox()).height, 26);
      assert.equal(await page.locator('.site-cursor').evaluate(e => +e.style.getPropertyValue('--cursor-fill')), .88);
      assert.equal(await page.locator('.site-cursor').evaluate(e => +e.style.getPropertyValue('--cursor-arrow')), 0, 'Photo detail is distinct from navigation');
      await page.screenshot({ path: path.join(output, route.includes('analog') ? 'photo-magnifier.png' : 'index-magnifier.png') });
      await photo.click();
      await page.locator('.gallery-viewer:modal').waitFor();
      await page.locator('.gallery-viewer [data-close]').hover(); await waitMode('button');
      assert.equal((await state()).parent, 'DIALOG');
      await page.keyboard.press('Escape');
      await page.locator('.gallery-viewer:modal').waitFor({ state: 'hidden' });
      await photo.hover(); await waitMode('magnify');
    }
    await goto('/projects/polaroid-of-yesterday/photography/?view=gallery');
    await page.locator('.print-link').first().hover(); await waitMode('magnify');
    await page.locator('.print-link').first().click();
    await page.locator('dialog:modal').waitFor();
    await page.keyboard.press('Escape');
    checks.push('Gallery cover links retain arrows; editorial/index/Stills photo details show magnifiers and open/close real viewers.');

    await goto('/');
    await page.locator('.business-card-dock[data-state="settled"]').waitFor();
    await page.mouse.move(80, 740); await waitMode('dot');
    const sentence = await page.locator('.sentence').boundingBox();
    const name = await page.locator('.identity-name').boundingBox();
    const sampleX = Math.round(name.x + name.width / 2), sampleY = Math.round(name.y + name.height - 4);
    const paper = await brightness(sampleX, sampleY);
    await page.locator('.identity-name').hover();
    await page.waitForFunction(() => document.querySelector('.site-cursor').style.getPropertyValue('--cursor-glow') === '1');
    const shadow = await brightness(sampleX, sampleY);
    assert(shadow < paper - 10, `The gray shadow is actually visible (${paper} -> ${shadow})`);
    await page.mouse.move(sampleX, sampleY); await page.waitForTimeout(80);
    await page.locator('.site-cursor-light').evaluate(e => { e.style.visibility = 'hidden'; });
    const unlit = await brightness(sampleX, sampleY);
    await page.locator('.site-cursor-light').evaluate(e => { e.style.visibility = ''; });
    const lit = await brightness(sampleX, sampleY);
    assert(lit > unlit + 15, `The pointer hotspot is visible above the gray shadow (${unlit} -> ${lit})`);
    assert.deepEqual(await page.locator('.sentence').boundingBox(), sentence);
    await page.screenshot({ path: path.join(output, 'home-shadow-hotspot.png') });

    await page.locator('.card-links a').first().hover(); await waitMode('link');
    assert.equal(await page.locator('.site-cursor').evaluate(e => getComputedStyle(e).mixBlendMode), 'difference');
    await page.waitForTimeout(160);
    const pill = await page.locator('.site-cursor').boundingBox();
    const clip = { x: Math.floor(pill.x), y: Math.floor(pill.y), width: Math.ceil(pill.width) + 2, height: Math.ceil(pill.height) + 2 };
    await page.locator('.site-cursor').evaluate(e => { e.style.visibility = 'hidden'; });
    const under = await sharp(await page.screenshot({ clip })).ensureAlpha().raw().toBuffer();
    await page.locator('.site-cursor').evaluate(e => { e.style.visibility = ''; });
    const over = await sharp(await page.screenshot({ clip })).ensureAlpha().raw().toBuffer();
    let invertedTextPixels = 0;
    for (let y = 0; y < clip.height; y++) for (let x = 0; x < clip.width; x++) {
      const dx = x + clip.x - pill.x - pill.width / 2, dy = y + clip.y - pill.y - pill.height / 2;
      if (Math.abs(dx) < 9 && Math.abs(dy) < 9) continue; // Exclude the cursor's own icon.
      if (Math.max(Math.abs(dx) - 4, 0) ** 2 + dy ** 2 > 100) continue; // Stay inside the solid capsule.
      const at = (y * clip.width + x) * 4;
      const base = .2126 * under[at] + .7152 * under[at + 1] + .0722 * under[at + 2];
      const result = .2126 * over[at] + .7152 * over[at + 1] + .0722 * over[at + 2];
      if (base < 140 && result > base + 35 && Math.abs(result - (224.4 - .76 * base)) < 18) invertedTextPixels++;
    }
    assert(invertedTextPixels >= 2, 'Actual Résumé lettering beneath the pill becomes light, rather than disappearing into its dark fill');
    await page.screenshot({ path: path.join(output, 'home-inverted-resume.png') });
    checks.push('Rendered pixels prove visible gray identity shadow, a moving pale hotspot, stable text and inverted Résumé lettering.');

    await goto('/projects/');
    await page.locator('.project-header__nav a').first().hover(); await waitMode('link');
    await page.screenshot({ path: path.join(output, 'dark-link.png') });
    await goto('/projects/figures-of-speech/');
    await page.locator('.specimen[data-study="001"]').click();
    await page.locator('.study-dialog:modal .dialog-header button').hover(); await waitMode('button');
    assert.equal((await state()).parent, 'DIALOG', 'The cursor joins a modal top layer');
    await page.screenshot({ path: path.join(output, 'modal-pointer.png') });
    await page.locator('.study-dialog iframe').hover();
    assert.equal((await state()).active, false, 'Embedded preserved experiments retain their own pointer');
    await page.locator('.study-dialog:modal .dialog-header button').hover(); await waitMode('button');
    await page.locator('.study-dialog:modal .dialog-header button').click();
    await page.mouse.move(12, 700); await waitMode('dot');
    assert.equal((await state()).parent, 'BODY', 'Closing a modal restores the document cursor host');
    checks.push('Links/buttons adapt; native modals retain a visible pointer; embedded editions keep ownership.');

    await goto('/projects/world-sensing-music-station/');
    await page.locator('a[href="#playground"]').last().click();
    await page.waitForFunction(() => !document.querySelector('#world-control').disabled);
    await page.locator('#world-control').hover();
    assert.equal((await state()).active, false, 'Music dragging retains grab/grabbing');
    await page.locator('input[type="range"]').first().hover();
    assert.equal((await state()).active, false, 'Native range interaction is preserved');
    await page.mouse.move(8, 700); await waitMode('dot');
    // Representative editable/native regions and dynamic opt-out, without
    // requiring production forms to be added just for testing.
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'qa-native-input'; input.style.cssText = 'position:fixed;left:10px;top:200px;width:150px;height:40px;z-index:20000';
      document.body.append(input);
    });
    await page.locator('#qa-native-input').hover(); assert.equal((await state()).active, false);
    await page.locator('#qa-native-input').fill('Native editing still works');
    await page.mouse.move(8, 700); await waitMode('dot');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-site-cursor'));
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await page.mouse.move(9, 700); assert.equal((await state()).active, false);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.mouse.move(10, 700); await waitMode('dot');
    checks.push('Drag surfaces, range and text inputs remain native; dynamic reduced-motion/forced-colors preferences work.');

    const cameraRoute = '/projects/polaroid-of-yesterday/game-design-document/';
    await page.goto(origin + cameraRoute);
    await page.mouse.move(700, 350);
    await page.waitForFunction(() => document.documentElement.classList.contains('sx-cursor'));
    assert.equal(await page.locator('.site-cursor').count(), 0, 'SX-70 page has no shared pointer');
    assert.equal(await page.locator('link[href*="site-cursor"],script[src*="site-cursor"]').count(), 0);
    await page.screenshot({ path: path.join(output, 'native-camera.png') });
    checks.push('The live SX-70 camera page retains its actual camera cursor without shared includes.');

    await goto('/gallery/');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.gallery-brand').hover(); await waitMode('link');
    await page.screenshot({ path: path.join(output, 'narrow-gallery.png') });
    await page.keyboard.press('Tab'); assert.equal((await state()).active, false);
    const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await touch.newPage();
    await touchPage.goto(origin + '/projects/');
    await touchPage.locator('.project-header__nav a').first().tap();
    await touchPage.waitForURL(origin + '/');
    assert.equal(await touchPage.locator('html').evaluate(e => e.classList.contains('has-site-cursor')), false);
    await touch.close();
    checks.push('Narrow mouse, native keyboard and touch navigation retain their behavior.');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ routes, checks, errors, knownTransitionCancellations: cancellations }, null, 2) + '\n');
    console.log(`Passed: ${routes.length} live routes and ${checks.length} browser groups; no unexpected errors. Evidence: ${output}`);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
