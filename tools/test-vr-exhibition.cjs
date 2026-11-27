const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const source = require('./vr-source/content.json');

const preview = process.env.VR_PREVIEW_URL;
const origin = preview || 'https://vr-preview.test';
const route = '/projects/vr-for-skill-learning/';
const output = process.env.VR_QA_OUTPUT;
const exhibition = 'html[data-vr-mode="exhibition"]';
const vignette = '[data-exhibition-vignette]';
const chapters = [...source.assignments, source.concept];
const siteRoot = path.resolve(__dirname, '../dist');

async function capture(page, name) {
  if (!output) return;
  fs.mkdirSync(output, { recursive: true });
  await page.screenshot({ path: path.join(output, `vr-exhibition-${name}.png`) });
}

async function waitForRest(page) {
  await page.waitForFunction(selector => Number(getComputedStyle(document.querySelector(selector)).opacity) < .025, vignette);
}

async function activePanel(page, id) {
  const panel = page.locator(`[data-exhibit="${id}"][data-exhibit-active]`);
  await panel.waitFor({ state: 'visible' });
  assert(await panel.evaluate(el => !el.closest('[inert]')), `${id} can receive focus`);
  assert(await page.locator('[data-exhibit]:not([data-exhibit-active])').evaluateAll(panels => panels.every(panel => panel.inert)), 'Other exhibit controls stay outside the keyboard focus order');
  assert(await page.locator('[data-exhibit]:not([data-exhibit-visible])').evaluateAll(panels => panels.every(panel => {
    const { display, opacity } = getComputedStyle(panel);
    return display === 'none' || Number(opacity) === 0;
  })), 'Hidden walls do not leak child controls into other exhibits');
  return panel;
}

async function dwellAt(page, id, fraction = .5) {
  await page.locator(`[data-exhibition-stop="${id}"]`).evaluate((stop, fraction) => {
    const rect = stop.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top + rect.height * fraction, behavior: 'instant' });
  }, fraction);
  const panel = await activePanel(page, id);
  await waitForRest(page);
  return panel;
}

async function assertProjectedWall(panel) {
  const projection = await panel.evaluate(el => ({
    transform: el.style.transform,
    identity: new DOMMatrixReadOnly(getComputedStyle(el).transform).isIdentity,
  }));
  assert(projection.transform.startsWith('matrix3d(') && !projection.identity, 'Exhibit content uses a projected 3D wall plane');
  return projection.transform;
}

async function recordWebGLDraws(context) {
  await context.addInitScript(() => {
    window.vrTestDraws = 0;
    for (const Renderer of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Renderer) continue;
      for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const draw = Renderer.prototype[method];
        if (typeof draw !== 'function') continue;
        Renderer.prototype[method] = function (...args) {
          if (this.canvas.hasAttribute?.('data-exhibition-canvas')) window.vrTestDraws++;
          return draw.apply(this, args);
        };
      }
    }
  });
}

async function openPage(context, suffix = '', onError) {
  if (!preview) {
    // Use the built files through Chrome routing when loopback access is unavailable.
    await context.route(`${origin}/**`, async request => {
      const pathname = decodeURIComponent(new URL(request.request().url()).pathname);
      const file = path.resolve(siteRoot, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
      if (!file.startsWith(siteRoot + path.sep) || !fs.existsSync(file)) {
        await request.fulfill({ status: 404 });
        return;
      }
      const contentType = /\.(mjs|js)$/.test(file) ? 'text/javascript' : undefined;
      await request.fulfill({ path: file, contentType });
    });
  }
  await context.route('https://www.youtube-nocookie.com/**', request => request.fulfill({ body: '', contentType: 'text/html' }));
  const page = await context.newPage();
  if (onError) page.on('pageerror', onError);
  await page.goto(origin + route + suffix, { waitUntil: 'domcontentloaded' });
  return page;
}

async function assertOriginalReading(page, { documents = false } = {}) {
  await page.locator('#main').waitFor({ state: 'visible' });
  assert.equal(await page.locator(exhibition).count(), 0, 'Independent reading route is available');
  const main = page.locator('#main');
  for (const item of source.assignments) {
    const section = main.locator(`#${item.id}`);
    assert(await section.getByRole('heading', { name: item.title }).isVisible());
    for (const prose of [item.description, item.note, ...(item.steps || item.journey || []).map(step => step.description)]) {
      assert(await section.getByText(prose, { exact: true }).isVisible(), `Visible original copy for ${item.id}`);
    }
    await section.getByText(item.detailTitle, { exact: true }).click();
    assert(await section.getByText(item.detail, { exact: true }).isVisible(), 'Original supplemental design note');
    const frame = section.locator('iframe');
    assert((await frame.getAttribute('src')).includes(`/embed/${item.video}?start=${item.start}`), 'Archived video and timestamp survive');
    assert.equal(await frame.getAttribute('allowfullscreen'), '', 'Native fullscreen remains available');
    const directVideo = section.locator(`a[href*="watch?v=${item.video}"]`);
    assert(await directVideo.isVisible(), 'Direct YouTube fallback is visible');
    const document = section.locator(`a[href="files/${item.pdf}"]`);
    assert(await document.isVisible(), 'Original PDF link is visible');
    if (documents) {
      const result = await document.evaluate(async link => {
        const response = await fetch(link.href);
        return [response.status, (await response.text()).slice(0, 5)];
      });
      assert.deepEqual(result, [200, '%PDF-']);
    }
  }
  assert(await main.getByText(source.concept.description, { exact: true }).isVisible());
  assert.equal(await main.getByRole('link', { name: 'Open concept presentation' }).getAttribute('href'), source.concept.presentation);
  assert(await main.getByText(source.reflection, { exact: true }).isVisible());
  assert(await main.locator('.wheel-diagram').isVisible());
  assert(await main.locator('[data-navigation] .diagram-figure svg').isVisible());
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-proxy-server', '--enable-unsafe-swiftshader'] });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    await recordWebGLDraws(desktop);
    const errors = [];
    const page = await openPage(desktop, '', error => errors.push(error.message));
    await page.locator(exhibition).waitFor({ state: 'attached' });
    await page.locator('[data-exhibition-canvas]').waitFor({ state: 'visible' });
    await page.waitForFunction(() => window.vrTestDraws > 0);
    await waitForRest(page);
    const entrance = await activePanel(page, 'entrance');
    const entranceTransform = await assertProjectedWall(entrance);
    assert(await entrance.getByRole('heading', { level: 1 }).isVisible(), 'Title is mounted on the entrance wall');
    assert(await entrance.getByText(source.subtitle, { exact: true }).isVisible(), 'Subtitle shares the entrance wall');
    assert(await entrance.getByText(/Scroll to enter/).isVisible(), 'Entrance wall carries the scroll cue');
    await capture(page, 'desktop-entrance');

    const initialScroll = await page.evaluate(() => scrollY);
    const initialDraws = await page.evaluate(() => window.vrTestDraws);
    const motionDistance = 360;
    await page.mouse.move(740, 820);
    await page.mouse.wheel(0, motionDistance);
    await page.waitForFunction(initialScroll => scrollY > initialScroll + 150, initialScroll);
    await page.waitForFunction(selector => Number(getComputedStyle(document.querySelector(selector)).opacity) > .03, vignette);
    await page.waitForFunction(before => document.querySelector('[data-exhibit="entrance"]').style.transform !== before, entranceTransform);
    assert(await page.evaluate(initialDraws => window.vrTestDraws > initialDraws, initialDraws), 'Scrolling renders fresh 3D poses');
    await waitForRest(page);
    await page.mouse.wheel(0, -motionDistance);
    await page.waitForFunction(initialScroll => Math.abs(scrollY - initialScroll) < 5, initialScroll);
    await waitForRest(page);

    for (const { id, title } of chapters) {
      const panel = await dwellAt(page, id);
      assert((await panel.textContent()).includes(title), `Original title available at ${id}`);
      const assignment = source.assignments.find(item => item.id === id);
      if (assignment) {
        assert(await panel.getByText(assignment.description, { exact: true }).isVisible(), 'Original description is visible on the gallery wall');
        assert(await panel.locator('iframe').isVisible(), 'Original demonstration remains playable in its gallery');
        assert(await panel.locator(`a[href="files/${assignment.pdf}"]`).isVisible(), 'Original PDF remains accessible in its gallery');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Exhibition does not overflow horizontally');
      await capture(page, `desktop-${id}`);
    }
    const exit = await dwellAt(page, 'exit');
    await assertProjectedWall(exit);
    assert(await exit.getByRole('heading', { name: source.closing }).isVisible(), 'Closing title is mounted on an exit wall');
    await capture(page, 'desktop-exit');

    for (const [id, selector, attribute, controls, last] of [
      ['wheel-removal-training-study', '[data-procedure]', 'data-step', 'data-step-button', 3],
      ['garage-ready-study', '[data-navigation]', 'data-journey', 'data-journey-button', 2],
    ]) {
      const panel = await dwellAt(page, id, .34);
      const study = panel.and(page.locator(selector));
      await study.waitFor({ state: 'visible' });
      const earlier = Number(await study.getAttribute(attribute));
      const initialWall = await panel.boundingBox();
      const band = page.locator(`[data-exhibition-stop="${id}"]`);
      const advance = Math.round((await band.boundingBox()).height * .32);
      await page.mouse.move(25, 800);
      await page.mouse.wheel(0, advance);
      await page.waitForFunction(({ id, attribute, earlier }) => Number(document.querySelector(`[data-exhibit="${id}"]`).getAttribute(attribute)) > earlier, { id, attribute, earlier });
      assert(Number(await page.locator(vignette).evaluate(el => getComputedStyle(el).opacity)) < .035, 'Rolling through a diagram does not dim the stationary view');
      const laterWall = await panel.boundingBox();
      assert(Math.abs(laterWall.x - initialWall.x) < 2 && Math.abs(laterWall.y - initialWall.y) < 2, 'The exhibit stays aligned while diagram steps advance');
      const button = study.locator(`[${controls}="${last}"]`);
      await button.focus();
      await button.press('Enter');
      assert.equal(await study.getAttribute(attribute), String(last), 'Manual native activation still works');
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      await capture(page, `desktop-${id}`);
    }

    const navigation = page.getByRole('navigation', { name: 'Exhibition chapters' });
    await navigation.locator('summary').press('Enter');
    await navigation.getByRole('link', { name: 'Pitch Together' }).press('Enter');
    await activePanel(page, 'pitch-together');
    assert.equal(new URL(page.url()).hash, '#pitch-together');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await activePanel(page, 'pitch-together');
    await page.evaluate(() => { location.hash = 'garage-ready'; });
    await activePanel(page, 'garage-ready');
    await page.evaluate(() => { location.hash = 'pitch-together'; });
    await activePanel(page, 'pitch-together');
    await navigation.getByRole('button', { name: 'Next exhibit' }).press('Enter');
    await activePanel(page, 'tag');

    await page.locator('[data-vr-toggle]:visible').first().press('Enter');
    assert.equal(new URL(page.url()).searchParams.get('view'), 'reading');
    assert.equal(new URL(page.url()).hash, '#tag', 'Reading view retains the active exhibit');
    await page.locator('[data-vr-toggle]:visible').first().press('Enter');
    await activePanel(page, 'tag');
    await page.locator('[data-vr-toggle]:visible').first().press('Enter');
    await assertOriginalReading(page, { documents: true });
    assert.deepEqual(errors, []);
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await openPage(mobile);
    await phone.locator(exhibition).waitFor({ state: 'attached' });
    await waitForRest(phone);
    await assertProjectedWall(await activePanel(phone, 'entrance'));
    await capture(phone, 'phone-entrance');
    const touch = await mobile.newCDPSession(phone);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 165, y: 640 }] });
    for (const y of [610, 570, 530, 470, 415, 370]) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 165, y }] });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await phone.waitForFunction(() => scrollY > 150);
    await waitForRest(phone);
    const phonePanel = await dwellAt(phone, 'garage-ready');
    assert((await phonePanel.boundingBox()).height >= 300, 'Phone exhibit provides a useful reading area');
    const phoneToggle = await phone.locator('[data-vr-toggle]:visible').boundingBox();
    for (const link of await phone.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link').all()) {
      const bounds = await link.boundingBox();
      const overlaps = bounds.x < phoneToggle.x + phoneToggle.width && bounds.x + bounds.width > phoneToggle.x
        && bounds.y < phoneToggle.y + phoneToggle.height && bounds.y + bounds.height > phoneToggle.y;
      assert(!overlaps, 'Reading toggle leaves existing phone navigation links reachable');
    }
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await capture(phone, 'phone-garage-ready');
    await mobile.close();

    for (const options of [{ reducedMotion: 'reduce' }, { forcedColors: 'active' }, { javaScriptEnabled: false }]) {
      const context = await browser.newContext(options);
      const fallback = await openPage(context);
      await assertOriginalReading(fallback);
      await context.close();
    }

    const unsupported = await browser.newContext();
    await unsupported.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
        return /webgl/i.test(kind) ? null : getContext.call(this, kind, ...options);
      };
    });
    await assertOriginalReading(await openPage(unsupported));
    await unsupported.close();
    console.log('Passed: genuine WebGL draws, world-projected entrance and exit text, native desktop wheel and phone touch, motion-only vignette, each gallery, in-place SVG scroll and keyboard operation, chapter links and reload, reading switch and restoration, phone layout, original videos/notes/PDFs, reduced motion, forced colors, no JS and no WebGL.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
