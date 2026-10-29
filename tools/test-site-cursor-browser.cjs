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
    const loadErrors = [];
    page.on('requestfailed', request => {
      if (request.url().startsWith(origin) && ['script', 'stylesheet'].includes(request.resourceType())) loadErrors.push({ url: request.url(), failure: request.failure()?.errorText });
    });
    const state = () => page.locator('.site-cursor').evaluate(e => ({
      hidden: e.hidden, mode: e.dataset.mode, active: document.documentElement.classList.contains('has-site-cursor'),
      parent: e.parentElement.tagName, radius: parseFloat(e.style.borderRadius),
    }));
    const waitMode = mode => page.waitForFunction(mode => {
      const cursor = document.querySelector('.site-cursor');
      const width = { dot: 13, text: 2, link: 34, button: 26, identity: 26, magnify: 34, drag: 34, dragging: 30 }[mode];
      const capsule = ['link', 'magnify', 'button', 'identity', 'drag'].includes(mode);
      return cursor && !cursor.hidden && cursor.dataset.mode === mode && Math.abs(parseFloat(cursor.style.width) - width) < .1
        && (mode !== 'text' || parseFloat(cursor.style.height) >= 23.9 && cursor.style.borderRadius === '1px' && +cursor.style.getPropertyValue('--cursor-fill') === .9)
        && (!capsule || cursor.style.borderRadius === '13px' && cursor.style.height === '26px'
          && +cursor.style.getPropertyValue('--cursor-fill') === .88);
    }, mode);
    const waitTextHeight = height => page.waitForFunction(height => Math.abs(parseFloat(document.querySelector('.site-cursor').style.height) - height) < .1, height);
    const waitAxis = axis => page.waitForFunction(axis => {
      const e = document.querySelector('.site-cursor');
      return e.dataset.dragAxis === axis && +e.style.getPropertyValue('--cursor-move') === (axis === 'both' ? 1 : 0)
        && +e.style.getPropertyValue('--cursor-range') === (axis === 'both' ? 0 : 1);
    }, axis);
    const goto = async route => {
      await page.goto(origin + route, { waitUntil: 'load' });
      try { await page.locator('.site-cursor').waitFor({ state: 'attached' }); }
      catch (error) { console.error(JSON.stringify({ route, url: page.url(), errors, loadErrors: loadErrors.slice(-10) })); throw error; }
    };
    const hoverText = async target => {
      await target.scrollIntoViewIfNeeded();
      const point = await target.evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const rect = [...range.getClientRects()].find(r => r.width > 0 && r.height > 0);
        return { x: rect.left + Math.min(10, rect.width / 2), y: rect.top + rect.height / 2 };
      });
      await page.mouse.move(point.x, point.y);
    };
    const brightness = async (x, y) => {
      const buffer = await page.screenshot({ clip: { x: x - 1, y: y - 1, width: 3, height: 3 } });
      const data = await sharp(buffer).ensureAlpha().raw().toBuffer();
      return .2126 * data[16] + .7152 * data[17] + .0722 * data[18];
    };
    const pointerSurface = async label => {
      const pill = page.locator('.site-cursor');
      const rect = await pill.boundingBox();
      const x = Math.round(rect.x + rect.width / 2 + 10), y = Math.round(rect.y + rect.height / 2);
      await pill.evaluate(e => { e.style.visibility = 'hidden'; });
      const under = await brightness(x, y);
      await pill.evaluate(e => { e.style.visibility = ''; });
      const over = await brightness(x, y);
      const fill = await pill.evaluate(e => +e.style.getPropertyValue('--cursor-fill'));
      assert(Math.abs(over - (255 * fill + (1 - 2 * fill) * under)) < 12, `${label}: actual rendered pointer surface is visible and inverted (${under} -> ${over})`);
      assert(Math.abs(over - under) > 25, `${label}: pointer has visible contrast with its background`);
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
      await hoverText(page.locator('h1')); await waitMode('text');
      await waitTextHeight(await page.locator('h1').evaluate(e => Math.max(24, parseFloat(getComputedStyle(e).fontSize) * 1.1)));
      if (route.includes('analog')) await page.screenshot({ path: path.join(output, 'gallery-text-bar.png') });
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
    await waitMode('identity');
    await page.waitForFunction(() => document.querySelector('.site-cursor-attraction').style.getPropertyValue('--cursor-glow') === '1');
    assert.equal(await page.locator('.site-cursor').evaluate(e => getComputedStyle(e).mixBlendMode), 'difference');
    assert.equal(await page.locator('.site-cursor-action, .site-cursor-tap, .site-cursor-grab, .site-cursor-grabbing, .site-cursor-identity-hint').count(), 0, 'No center-dot/hand icons or separate homepage pointer');
    await pointerSurface('Homepage identity');
    await page.locator('.site-cursor').evaluate(e => { e.style.visibility = 'hidden'; });
    const shadow = await brightness(sampleX, sampleY);
    assert(shadow < paper - 10, `The gray shadow is actually visible (${paper} -> ${shadow})`);
    await page.mouse.move(sampleX, sampleY); await page.waitForTimeout(80);
    await page.locator('.site-cursor-light').evaluate(e => { e.style.visibility = 'hidden'; });
    const unlit = await brightness(sampleX, sampleY);
    await page.locator('.site-cursor-light').evaluate(e => { e.style.visibility = ''; });
    const lit = await brightness(sampleX, sampleY);
    assert(lit > unlit + 15, `The pointer hotspot is visible above the gray shadow (${unlit} -> ${lit})`);
    await page.locator('.site-cursor').evaluate(e => { e.style.visibility = ''; });
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
    checks.push('Rendered pixels prove the plain homepage circle, visible gray word shadow, moving pale hotspot, stable text and inverted Résumé lettering.');

    await goto('/projects/');
    await page.locator('.project-header__nav a').first().hover(); await waitMode('link');
    await page.screenshot({ path: path.join(output, 'dark-link.png') });
    await goto('/projects/figures-of-speech/');
    await page.locator('.view-switch:not([hidden])').waitFor({ state: 'visible' });
    await page.locator('.specimen[data-study="001"]').click();
    await page.locator('.study-dialog:modal .dialog-header button').hover(); await waitMode('button');
    await pointerSurface('Modal action button');
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
    await page.locator('#world-control').hover(); await waitMode('drag');
    await waitAxis('both');
    await pointerSurface('Draggable hover');
    await page.screenshot({ path: path.join(output, 'drag-ready.png') });
    const world = await page.locator('#world-control').boundingBox();
    const distanceBefore = await page.locator('#distance-input').inputValue();
    await page.mouse.down();
    await page.mouse.move(world.x + world.width / 2 + 60, world.y + world.height / 2 + 55, { steps: 5 });
    await waitMode('dragging');
    await waitAxis('both');
    assert.notEqual(await page.locator('#distance-input').inputValue(), distanceBefore, 'Actual device position changes during drag');
    await page.waitForFunction(() => +document.querySelector('.site-cursor').style.getPropertyValue('--move-scale') === .75);
    await page.screenshot({ path: path.join(output, 'drag-active.png') });
    await page.mouse.move(20, 130); await waitMode('dragging');
    // The room is animated. Sample the captured pointer over stable dark paper
    // so before/after pixels describe the capsule rather than device motion.
    await pointerSurface('Active drag');
    await page.mouse.up();
    await page.locator('#world-control').hover(); await waitMode('drag');
    await page.mouse.down(); await waitMode('dragging');
    await page.locator('#world-control').dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', bubbles: true });
    assert.equal((await state()).active, false, 'Cancelled grabs release custom pointer state');
    await page.mouse.up();
    await page.locator('#world-control').hover(); await waitMode('drag');
    const slider = page.locator('#distance-input');
    await slider.hover(); await waitMode('drag');
    await waitAxis('x');
    assert.equal(await slider.evaluate(e => getComputedStyle(e, '::-webkit-slider-thumb').cursor), 'none', 'Native thumb does not introduce a second cursor');
    await page.screenshot({ path: path.join(output, 'slider-ready.png') });
    const sliderRect = await slider.boundingBox();
    await page.mouse.move(sliderRect.x + sliderRect.width * .25, sliderRect.y + sliderRect.height / 2);
    await page.mouse.down(); await waitMode('dragging');
    await waitAxis('x');
    const sliderBefore = await slider.inputValue();
    await page.mouse.move(sliderRect.x + sliderRect.width * .75, sliderRect.y + sliderRect.height / 2, { steps: 6 });
    await waitMode('dragging');
    assert.notEqual(await slider.inputValue(), sliderBefore, 'Native slider value really changes during adjustment');
    await page.screenshot({ path: path.join(output, 'slider-active.png') });
    await page.mouse.move(sliderRect.x + sliderRect.width + 24, sliderRect.y + sliderRect.height / 2);
    await waitMode('dragging');
    await waitAxis('x');
    await page.mouse.up();
    await slider.hover(); await waitMode('drag');
    await slider.focus();
    const keyboardBefore = +await slider.inputValue();
    await page.keyboard.press('ArrowLeft');
    assert.equal(+await slider.inputValue(), keyboardBefore - 1, 'Native range keyboard adjustment is preserved');
    await page.keyboard.press('Tab'); assert.equal((await state()).active, false);
    await page.mouse.move(8, 700); await waitMode('dot');
    // Representative editable/native regions and dynamic opt-out, without
    // requiring production forms to be added just for testing.
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'qa-native-input'; input.style.cssText = 'position:fixed;left:10px;top:200px;width:150px;height:40px;z-index:20000';
      document.body.append(input);
    });
    await page.locator('#qa-native-input').hover(); await waitMode('text');
    await page.locator('#qa-native-input').click();
    await page.locator('#qa-native-input').fill('Native editing still works');
    assert.equal(await page.locator('#qa-native-input').inputValue(), 'Native editing still works');
    await page.mouse.move(8, 700); await waitMode('dot');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-site-cursor'));
    await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'active' });
    await page.mouse.move(9, 700); assert.equal((await state()).active, false);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.mouse.move(10, 700); await waitMode('dot');
    checks.push('Music objects and range slider share hover/active drag states; actual movement/value changes, outside release and slider keyboard adjustment work; editing/preferences remain native.');

    await goto('/projects/multiverse-all-star-battlefront/');
    await page.locator('[data-preview]').first().hover(); await waitMode('magnify');
    await page.locator('[data-preview]').first().click();
    await page.locator('.image-viewer:modal .viewer-close').hover(); await waitMode('button');
    await page.keyboard.press('Escape');
    await goto('/projects/world-sensing-music-station/');
    await page.locator('[data-process-page]').first().hover(); await waitMode('magnify');
    await page.locator('[data-process-page]').first().click();
    await page.locator('.process-viewer:modal #viewer-close').hover(); await waitMode('button');
    await page.keyboard.press('Escape');
    await goto('/404.html');
    await page.waitForFunction(() => window.maintenanceScene);
    const object = await page.evaluate(() => maintenanceScene.project(maintenanceScene.snapshot()[0].id));
    await page.mouse.move(object.x, object.y); await waitMode('drag');
    await page.mouse.down(); await waitMode('dragging');
    await page.mouse.move(object.x + 24, object.y + 12, { steps: 5 });
    await page.mouse.up();
    assert.notEqual((await state()).mode, 'native');
    checks.push('Project image previews, document-sheet previews and existing 404 object grabs share global intents.');

    // A route and class names unknown to the controller exercise future reuse.
    const futureURL = origin + '/__cursor-future-fixture/';
    await context.route(futureURL, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head>
      <link rel="stylesheet" href="/site-cursor.css?rev=20261028-drag-axis">
      <style>body{margin:40px;background:#fff}button,a,#future-drag{display:block;width:220px;height:60px;margin:12px;padding:10px;box-sizing:border-box}#future-drag{cursor:grab;background:#ddd}#future-drag.held{cursor:grabbing!important}</style>
      <script type="module" src="/site-cursor.mjs?rev=20261028-drag-axis"></script></head><body>
      <button id="future-action"><span style="cursor:text">An ordinary future action</span></button><a id="future-link" href="/next/">A future destination</a>
      <a id="future-image" href="/new-image.webp">A future image, without a known class</a>
      <button id="future-css">A future CSS-defined preview</button><div id="future-drag" style="cursor:grab">A future custom draggable</div>
      <input id="future-range" type="range" min="0" max="100" value="40" style="cursor:ew-resize">
      <input id="future-vertical" type="range" min="0" max="100" value="40" aria-label="Vertical level" style="writing-mode:vertical-lr;width:32px;height:140px">
      <section style="padding:24px;width:380px;font:20px/1.6 sans-serif">
        <p><span id="future-words">Select these words.</span></p>
        <p style="width:150px"><span id="future-wrap">Wrapped ordinary text continues onto several lines.</span></p>
        <p><span id="future-small" style="font-size:10px">Small type</span></p>
        <p><span id="future-large" style="display:inline-block;font-size:72px;line-height:1">Large</span></p>
        <p style="font-size:80px"><span id="future-nested-small" style="font-size:12px;pointer-events:none">Small inside large</span></p>
        <a href="/text-link/" style="cursor:text"><span id="future-link-label" data-cursor="text" style="cursor:text">Text-styled link</span></a>
        <input id="future-input" aria-label="Text entry" placeholder="An empty text field" style="display:block;width:260px;height:40px">
        <textarea id="future-textarea" aria-label="Multiline entry" style="width:260px;height:90px"></textarea>
        <div id="future-editor" contenteditable="true" role="textbox" aria-label="Editable text">Edit this text.</div>
        <select id="future-select" aria-label="Native choice"><option>A native choice</option></select>
      </section>
      <script>const d=document.querySelector('#future-drag');d.addEventListener('pointerdown',e=>{d.setPointerCapture(e.pointerId);d.classList.add('held')});d.addEventListener('pointermove',e=>{if(d.classList.contains('held'))d.dataset.x=e.clientX});for(const type of ['pointerup','pointercancel','lostpointercapture'])d.addEventListener(type,()=>d.classList.remove('held'));</script>
      </body></html>` }));
    await goto('/__cursor-future-fixture/');
    await page.locator('#future-action').hover(); await waitMode('button');
    assert.equal(await page.locator('.site-cursor-action').count(), 0, 'Action circles have no center icon');
    await page.locator('#future-action').evaluate(e => { e.disabled = true; }); await waitMode('dot');
    await page.locator('#future-action').evaluate(e => { e.disabled = false; }); await waitMode('button');
    await page.locator('#future-link').hover(); await waitMode('link');
    await page.locator('#future-image').hover(); await waitMode('magnify');
    await page.evaluate(() => { const button=document.createElement('button');button.id='future-late';button.textContent='Created after initialization';document.body.append(button); });
    await page.locator('#future-late').hover(); await waitMode('button');
    await page.evaluate(() => { const style=document.createElement('style');style.textContent='#future-css{cursor:zoom-in!important}';document.head.append(style); });
    await page.locator('#future-css').hover(); await waitMode('magnify');
    await page.evaluate(() => { const style=document.createElement('style');style.textContent='#future-css{cursor:col-resize!important}';document.head.append(style); });
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-site-cursor'));
    await page.locator('#future-range').hover(); await waitMode('drag');
    await waitAxis('x');
    await page.mouse.down(); await waitMode('dragging');
    await page.mouse.up(); await waitMode('drag');
    const vertical = page.locator('#future-vertical');
    await vertical.hover(); await waitMode('drag'); await waitAxis('y');
    assert(await page.locator('.site-cursor-range').evaluate(e => { const matrix = new DOMMatrixReadOnly(getComputedStyle(e).transform); return Math.abs(matrix.a) < .01 && matrix.b > .9; }), 'Vertical range glyph really rotates into the slider direction');
    const verticalBox = await vertical.boundingBox();
    await page.mouse.down(); await waitMode('dragging'); await waitAxis('y');
    const verticalBefore = await vertical.inputValue();
    await page.mouse.move(verticalBox.x + verticalBox.width / 2, verticalBox.y + verticalBox.height * .8, { steps: 5 });
    assert.notEqual(await vertical.inputValue(), verticalBefore, 'Native vertical range really changes value');
    await page.screenshot({ path: path.join(output, 'vertical-range.png') });
    await page.mouse.up();
    await page.locator('#future-words').hover(); await waitMode('text');
    const words = await page.locator('#future-words').boundingBox();
    await page.mouse.move(words.x + 2, words.y + words.height / 2);
    await page.mouse.down();
    await page.mouse.move(words.x + words.width - 2, words.y + words.height / 2, { steps: 6 });
    await waitMode('text');
    assert(await page.evaluate(() => getSelection().toString().length > 5), 'Native text selection still works');
    await page.mouse.move(words.x + words.width + 20, words.y + words.height / 2);
    await waitMode('text');
    await page.mouse.up(); await waitMode('dot');
    await page.evaluate(() => getSelection().removeAllRanges());
    await hoverText(page.locator('#future-wrap')); await waitMode('text');
    await page.locator('#future-small').hover(); await waitMode('text'); await waitTextHeight(24);
    await page.locator('#future-large').hover(); await waitMode('text'); await waitTextHeight(79.2);
    await page.evaluate(() => { const style=document.createElement('style');style.textContent='#future-large.enlarged{font-size:112px!important}';document.head.append(style);document.querySelector('#future-large').classList.add('enlarged'); });
    await waitTextHeight(123.2);
    await hoverText(page.locator('#future-nested-small')); await waitMode('text'); await waitTextHeight(24);
    await page.locator('#future-link-label').hover(); await waitMode('link');
    const entry = page.locator('#future-input');
    await entry.hover(); await waitMode('text'); await waitTextHeight(24);
    await entry.click(); await entry.fill('Native typing');
    await entry.press('Home'); await entry.press('Shift+End');
    await page.keyboard.type('Replaced natively');
    assert.equal(await entry.inputValue(), 'Replaced natively', 'Input focus, selection and replacement stay native');
    await page.screenshot({ path: path.join(output, 'input-text-bar.png') });
    await entry.evaluate(e => { e.type = 'date'; });
    await page.waitForFunction(() => !document.documentElement.classList.contains('has-site-cursor'));
    await entry.evaluate(e => { e.type = 'text'; });
    await entry.hover(); await waitMode('text');
    await page.locator('#future-textarea').hover(); await waitMode('text');
    await page.locator('#future-textarea').fill('Line one\nLine two');
    assert.equal(await page.locator('#future-textarea').inputValue(), 'Line one\nLine two');
    await page.locator('#future-editor').hover(); await waitMode('text');
    await page.locator('#future-editor').fill('Edited content');
    assert.equal(await page.locator('#future-editor').textContent(), 'Edited content');
    await page.locator('#future-select').hover();
    assert.equal((await state()).active, false, 'Native select retains ownership');
    checks.push('Visible/wrapped text and editors use a text bar; links/buttons outrank text; real selection, input replacement, multiline/contenteditable editing and native pickers work.');
    await page.locator('#future-drag').hover(); await waitMode('drag');
    await waitAxis('both');
    await page.mouse.down(); await waitMode('dragging');
    await page.mouse.move(500, 500); await waitMode('dragging');
    assert.equal(await page.locator('#future-drag').getAttribute('data-x'), '500');
    await page.mouse.up();
    await page.locator('#future-drag').hover(); await waitMode('drag');
    await page.locator('#future-drag').evaluate(e => { e.dataset.cursor = 'native'; });
    await page.locator('#future-drag').hover();
    assert.equal((await state()).active, false, 'Future controls can explicitly keep native ownership');
    checks.push('An unknown future route supports semantic actions/navigation/images, live CSS intents, disabled controls and capture-based dragging without controller edits.');

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
