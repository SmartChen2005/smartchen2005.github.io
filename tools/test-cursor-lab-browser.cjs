const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const playwrightModule = process.env.PLAYWRIGHT_MODULE || 'playwright';
const { chromium } = require(playwrightModule);
const origin = process.env.CURSOR_PREVIEW_URL || 'http://127.0.0.1:4185';
const output = process.env.CURSOR_LAB_QA_DIR || path.join(os.tmpdir(), 'smartchen-cursor-lab-qa');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const { studies, experimentURL, studyEdition } = await import('./figures-of-speech.mjs');
  const study = studies.find(item => item.id === '009');
  const archive = '/projects/figures-of-speech/';
  const route = archive + experimentURL(study);
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [], checks = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', request => request.request().url().startsWith(origin) ? request.continue() : request.abort());
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const state = frame => frame.locator('.site-cursor').evaluate(e => ({
      mode: e.dataset.mode, hidden: e.hidden, width: parseFloat(e.style.width),
      height: parseFloat(e.style.height), radius: parseFloat(e.style.borderRadius),
      fill: +e.style.getPropertyValue('--cursor-fill'), move: +e.style.getPropertyValue('--cursor-move'),
      scale: +e.style.getPropertyValue('--move-scale'),
    }));
    const waitMode = (frame, mode) => frame.waitForFunction(mode => {
      const e = document.querySelector('.site-cursor');
      const dimensions = { dot: [13, 13], button: [26, 26], identity: [26, 26], link: [34, 26], magnify: [34, 26], drag: [34, 26], dragging: [30, 24], text: [2, null] }[mode];
      return e && !e.hidden && e.dataset.mode === mode && Math.abs(parseFloat(e.style.width) - dimensions[0]) < .1
        && (dimensions[1] === null || Math.abs(parseFloat(e.style.height) - dimensions[1]) < .1)
        && (!['drag', 'dragging'].includes(mode) || +e.style.getPropertyValue('--cursor-move') === 1 && +e.style.getPropertyValue('--move-scale') === (mode === 'dragging' ? .75 : 1));
    }, mode);
    const openStudy = async () => {
      await page.locator('.view-switch:not([hidden])').waitFor({ state: 'visible' });
      await page.locator('.specimen[data-study="009"]').click();
      const iframe = await page.locator('#frame-slot iframe').elementHandle();
      const frame = await iframe.contentFrame();
      await frame.waitForFunction(() => document.body?.dataset.ready === 'true');
      return frame;
    };

    // The actual generated six-form plate supplies the catalogue JPEG.
    const plate = await context.newPage();
    await plate.setViewportSize({ width: 960, height: 560 });
    await plate.goto(origin + archive + `editions/${studyEdition(study)}/cursor-plate.html`);
    assert.deepEqual(await plate.locator('.cursor-specimen .site-cursor').evaluateAll(nodes => nodes.map(e => e.dataset.mode)), ['dot', 'button', 'text', 'link', 'magnify', 'drag']);
    const platePNG = await plate.screenshot({ path: path.join(output, 'cursor-plate.png') });
    if (process.argv.includes('--write-thumbnail')) {
      const sharp = require(process.env.SHARP_MODULE || path.join(path.dirname(require.resolve(playwrightModule + '/package.json')), '..', 'sharp'));
      await sharp(platePNG).jpeg({ quality: 94 }).toFile(path.join('dist/projects/figures-of-speech/assets', study.image));
    }
    await plate.close();
    checks.push('Plate order is dot/circle/text above three link/zoom/drag capsules; thumbnail is captured from the real preserved markup.');

    await page.goto(origin + archive);
    const frame = await openStudy();
    assert.equal(await frame.locator('.mechanism').count(), 8);
    assert.equal(await frame.locator('.site-cursor').count(), 1);
    await frame.locator('.surface-study span').first().hover(); await waitMode(frame, 'dot');
    await frame.locator('#press-action').click(); await waitMode(frame, 'button');
    assert.equal(await frame.locator('#action-result').textContent(), 'On');
    await frame.locator('#study-link').click(); await waitMode(frame, 'link');
    assert.equal(await frame.locator('#cursor-destination').textContent(), 'You arrived.');
    await frame.locator('#magnetic-word').click(); await waitMode(frame, 'identity');
    assert.equal(await frame.locator('#magnetic-word span').textContent(), 'Imagine');
    await frame.locator('#zoom-study').click(); await waitMode(frame, 'magnify');
    assert.equal(await frame.locator('#zoom-study').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('has-site-cursor')), false, 'Parent releases ownership inside the exhibit');
    checks.push('Actual catalogue iframe loads one pointer and working surface/action/link/word/photo mechanisms.');

    const handle = frame.locator('#drag-handle');
    await handle.hover(); await waitMode(frame, 'drag');
    const dragHover = await state(frame);
    const before = await handle.evaluate(e => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top), travelX: e.parentElement.clientWidth - e.offsetWidth, travelY: e.parentElement.clientHeight - e.offsetHeight }));
    const box = await handle.boundingBox();
    await page.mouse.down(); await waitMode(frame, 'dragging');
    const dragActive = await state(frame);
    await page.mouse.move(box.x + box.width / 2 + Math.min(35, before.travelX * .3), box.y + box.height / 2 + Math.min(25, before.travelY * .3), { steps: 6 });
    const moved = await handle.evaluate(e => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
    assert(moved.x > before.x + 1 && moved.y > before.y + 1, 'Actual object moves on both axes');
    await page.screenshot({ path: path.join(output, 'exhibit-dragging.png') });
    await page.mouse.up();
    await handle.press('Home');
    await handle.press('ArrowUp'); await handle.press('ArrowLeft');
    const keyboard = await handle.evaluate(e => ({ x: parseFloat(e.style.left), y: parseFloat(e.style.top) }));
    assert(keyboard.x < before.x && keyboard.y < before.y, 'Four-direction keyboard movement works');
    await handle.press('Home');

    const range = frame.locator('#range-study');
    await range.hover(); await waitMode(frame, 'drag');
    const rangeHover = await state(frame);
    const rangeBefore = await range.inputValue();
    const rangeBox = await range.boundingBox();
    await page.mouse.down(); await waitMode(frame, 'dragging');
    const rangeActive = await state(frame);
    await page.mouse.move(rangeBox.x + rangeBox.width * .8, rangeBox.y + rangeBox.height / 2, { steps: 5 });
    assert.notEqual(await range.inputValue(), rangeBefore, 'Native range changes its scalar value');
    await page.mouse.up();
    const shape = value => [value.width, value.height, value.radius, value.fill, value.move, value.scale];
    assert.deepEqual(shape(rangeHover), shape(dragHover), 'Drag and Range share the hover form');
    assert.deepEqual(shape(rangeActive), shape(dragActive), 'Drag and Range share the active form');
    await range.press('End'); assert.equal(await range.inputValue(), '100');
    checks.push('Drag moves freely in X/Y with four-direction keys; Range changes one value; both have identical hover/held pointer forms.');

    const entry = frame.locator('.text-study');
    await entry.hover(); await waitMode(frame, 'text');
    const expectedHeight = await entry.evaluate(e => Math.max(24, parseFloat(getComputedStyle(e).fontSize) * 1.1));
    await frame.waitForFunction(height => Math.abs(parseFloat(document.querySelector('.site-cursor').style.height) - height) < .1, expectedHeight);
    await entry.click(); await entry.fill('The text bar works');
    assert.equal(await entry.inputValue(), 'The text bar works');
    await entry.press('Home'); await entry.press('Shift+End'); await page.keyboard.type('Native replacement');
    assert.equal(await entry.inputValue(), 'Native replacement');
    await page.screenshot({ path: path.join(output, 'exhibit-text.png') });
    await entry.press('Escape');
    await page.locator('#frame-slot iframe').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => document.activeElement?.dataset.study), '009');
    checks.push('Text field uses the type-aware bar and native selection/replacement; Escape tears down the iframe and restores focus.');

    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await openStudy();
    await narrow.locator('#drag-handle').hover(); await waitMode(narrow, 'drag');
    const layout = await narrow.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cells: [...document.querySelectorAll('.mechanism')].map(e => { const r=e.getBoundingClientRect(); return {top:r.top,bottom:r.bottom}; }), height:innerHeight }));
    assert.equal(layout.overflow, false);
    assert(layout.cells.every(cell => cell.top >= 0 && cell.bottom <= layout.height), 'All eight mechanisms fit in the narrow iframe');
    await page.screenshot({ path: path.join(output, 'exhibit-narrow.png') });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await narrow.waitForFunction(() => !document.documentElement.classList.contains('has-site-cursor'));
    await narrow.locator('#press-action').click();
    assert.equal(await narrow.locator('#action-result').textContent(), 'On');
    await narrow.locator('.text-study').press('Escape');
    checks.push('Narrow iframe keeps all eight mechanisms visible; reduced motion retains native functional controls.');

    const standalone = await context.newPage();
    standalone.on('pageerror', error => errors.push(error.message));
    await standalone.setViewportSize({ width: 1280, height: 720 });
    await standalone.goto(origin + route);
    await standalone.waitForFunction(() => document.body?.dataset.ready === 'true');
    await standalone.locator('.text-study').hover(); await waitMode(standalone, 'text');
    await standalone.waitForFunction(() => Math.abs(parseFloat(document.querySelector('.site-cursor').style.height) - 30.8) < .1);
    await standalone.mouse.down(); await waitMode(standalone, 'text');
    assert(Math.abs((await state(standalone)).height - 30.8) < .1, 'Large-field selection retains its scaled bar height');
    await standalone.mouse.up();
    await standalone.screenshot({ path: path.join(output, 'standalone-desktop.png') });
    checks.push('Standalone desktop text field grows beyond the 24px minimum and retains its height during a press.');
    await standalone.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ route, checks, errors }, null, 2) + '\n');
    console.log(`Passed: ${checks.length} cursor-exhibit browser groups; no page errors. Evidence: ${output}`);
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
