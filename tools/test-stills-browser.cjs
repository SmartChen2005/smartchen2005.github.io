const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.join(__dirname, 'stills-qa');
const collection = require('./polaroid-exhibition-photos.json');
fs.mkdirSync(output, { recursive: true });
const origin = process.env.STILLS_PREVIEW_URL || 'http://127.0.0.1:4173';
const route = '/gallery/trauma-induced-dissociative-amnesia/';
const url = origin + route;
const ready = page => page.waitForFunction(() => document.body.classList.contains('is-ready') && document.querySelector('.print').style.transform);
const settle = page => page.waitForTimeout(350);
const translation = print => print.evaluate(e => {
  const matrix = new DOMMatrix(e.style.transform);
  return { x: matrix.m41, y: matrix.m42, z: matrix.m43 };
});
const enter = async page => {
  await page.locator('.exhibition').evaluate(e => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - document.querySelector('.gallery-header').offsetHeight, behavior: 'instant' }));
  await settle(page);
};
const clear = async page => {
  const boxes = await page.locator('.print').evaluateAll(items => items.map(e => {
    const a = e.querySelector('.print-paper').getBoundingClientRect();
    return { left: a.left, right: a.right, top: a.top, bottom: a.bottom };
  }));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    assert(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1, 'Index images/captions never overlap');
  }
};
const checkSpiral = async page => {
  const states = await page.evaluate(async () => {
    const stage = document.querySelector('.installation');
    const space = document.querySelector('.exhibition-space');
    const prints = [...stage.querySelectorAll('.print')];
    const start = scrollY;
    const scrollToPosition = async position => {
      window.scrollTo({ top: start + space.getBoundingClientRect().height * position / (prints.length - 1), behavior: 'instant' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    };
    const results = [];
    for (let i = 0; i < prints.length; i++) {
      await scrollToPosition(i);
      const front = prints[i];
      const image = front.querySelector('img');
      const r = image.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      const pose = new DOMMatrix(front.style.transform);
      let samples = 0;
      for (const x of [.15, .5, .85]) {
        for (const y of [.15, .5, .85]) {
          const target = document.elementFromPoint(r.left + x * r.width, r.top + y * r.height);
          if (target?.closest('.print') === front) samples++;
        }
      }
      results.push({ index: i, facing: pose.m33, z: pose.m43, samples,
        height: image.clientHeight, portrait: front.dataset.orientation === 'portrait',
        fits: r.left >= 0 && r.right <= innerWidth && r.top >= stageBox.top - 1 && r.bottom <= innerHeight + 1 });
    }
    await scrollToPosition(6);
    const visible = prints.filter(print => Number(print.style.opacity) >= .95).map(print => {
      const r = print.querySelector('img').getBoundingClientRect();
      const center = r.left + r.width / 2;
      const clear = document.elementFromPoint(center, r.top + r.height / 2)?.closest('.print') === print;
      return { center, width: r.width, clear, fits: r.left >= 0 && r.right <= innerWidth };
    });
    const handoff = [];
    for (const i of [0, 5, 12, 13, 15]) {
      for (const offset of [.46, .5, .54]) {
        await scrollToPosition(i + offset);
        const a = prints[i].querySelector('img').getBoundingClientRect();
        const b = prints[i + 1].querySelector('img').getBoundingClientRect();
        handoff.push({ i, offset, gap: b.left - a.right });
      }
    }
    window.scrollTo({ top: start, behavior: 'instant' });
    return { centered: results, visible, handoff };
  });
  for (const state of states.centered) {
    assert(state.facing > .99 && state.z > -1 && state.fits && state.samples === 9,
      `The centered print is fully visible and clickable at ${page.viewportSize().width}px: ${JSON.stringify(state)}`);
  }
  for (const portrait of states.centered.filter(state => state.portrait)) {
    assert(Math.abs(portrait.height / states.centered[0].height - 1.32) < .03, 'Centered portraits retain their larger display size');
  }
  const { visible, handoff } = states;
  assert.equal(visible.length, 7, 'The middle of the wave shows six surrounding prints');
  assert(visible.every((item, i) => item.fits && item.clear && (!i || item.center > visible[i - 1].center)),
    `Thumbs are visible and flow across the viewport in order at ${page.viewportSize().width}px: ${JSON.stringify(visible)}`);
  assert(visible[0].width < visible[3].width / 2 && visible[6].width < visible[3].width / 2);
  assert(visible[0].width > 20 && visible[6].width > 20, 'Outer thumbnails stay readable rather than turning edge-on');
  for (const state of handoff) {
    assert(state.gap >= 0, `Lead prints are separated at the layer handoff at ${page.viewportSize().width}px: ${JSON.stringify(state)}`);
  }
};
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-proxy-server'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await ready(page); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.print').count(), collection.length);
    assert.equal(await page.locator('h1').textContent(), 'Trauma-Induced Dissociative Amnesia');
    assert.equal(await page.locator('.gallery-header, .gallery-footer').count(), 2);
    const categories = await page.locator('.print').evaluateAll(es => es.map(e => e.dataset.kind));
    assert.equal(await page.locator('.print-caption').count(), 0, 'Index is images only');
    assert.deepEqual(categories, collection.map(photo => photo.kind));
    const order = await page.locator('.print').evaluateAll(es => es.map(e => e.id));
    assert.deepEqual(order, collection.map(photo => photo.id));
    assert.equal(await page.locator('button[data-view=spiral]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('button[data-view=spiral]').textContent(), 'Wave');
    await page.screenshot({ path: path.join(output, 'combined-desktop-title.png') });
    await enter(page);
    await checkSpiral(page); await settle(page);
    const side = await page.locator('.print').nth(1).evaluate(print => {
      const pose = new DOMMatrix(print.style.transform);
      return { facing: pose.m33, z: pose.m43 };
    });
    assert(side.facing < .75 && side.z < -40, 'The photo next to center turns away and recedes in depth');
    const firstPrint = page.locator('.print').first();
    const before = await translation(firstPrint);
    await page.mouse.wheel(0, 650); await settle(page);
    const after = await translation(firstPrint);
    assert.notEqual(after.y, before.y, 'Native scroll advances the wave');
    assert.notEqual(after.x, before.x, 'The wave moves across the stage');
    await settle(page);
    assert.deepEqual(await translation(firstPrint), after, 'The wave rests when scrolling stops');
    await page.locator('.print-link').nth(6).focus(); await settle(page);
    await page.locator('.print-link').nth(6).evaluate(link => link.blur());
    await page.screenshot({ path: path.join(output, 'combined-desktop-spiral.png') });
    await page.locator('.print-link').nth(9).click();
    assert.equal(await page.locator('#viewer-counter').textContent(), '10 / 17', 'Outer thumbnails open the corresponding photo');
    await page.keyboard.press('Escape');
    await page.locator('body > .gallery-header').waitFor({ state: 'attached' });

    await page.locator('button[data-view=gallery]').click(); await settle(page);
    assert(page.url().includes('view=gallery'));
    await enter(page); await clear(page);
    assert.deepEqual(await page.locator('.print').evaluateAll(es => es.map(e => e.id)), order, 'Switching views preserves chronological order');
    assert(await page.locator('.print').evaluateAll(es => es.every(e => e.style.opacity === '1' && /,\s*0(?:\.0+)?px\)/.test(e.style.transform))), 'Index has no depth or image tint');
    await page.screenshot({ path: path.join(output, 'combined-desktop-index.png') });
    const fittedPrints = await page.locator('.print img').evaluateAll(images => {
      return images.every(image => {
        const frame = image.closest('.print-paper');
        return image.clientWidth === frame.clientWidth && image.clientHeight === frame.clientHeight &&
          getComputedStyle(image).objectFit === 'contain';
      });
    });
    assert(fittedPrints, 'The Index fits complete photos inside equal frames');
    const indexPortraitScale = await page.locator('.print[data-orientation=portrait] img').first().evaluate(image =>
      image.clientHeight / document.querySelector('.print img').clientHeight);
    assert(indexPortraitScale > 1.19 && indexPortraitScale < 1.25, 'Index reserves a taller row for portraits');


    const first = page.locator('.print-link').first();
    await page.evaluate(() => {
      window.viewerFrames = [];
      const observe = () => { if(!window.viewerFrames)return; const i=document.querySelector('.viewer-image'); if(document.querySelector('.photo-viewer').open && !i.hidden) window.viewerFrames.push({src:i.getAttribute('src'),width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height}); if(window.viewerFrames)requestAnimationFrame(observe); };
      requestAnimationFrame(observe);
    });

    await first.click();
    assert(await page.locator('.photo-viewer').evaluate(e => e.open));
    await page.waitForFunction(() => { const i = document.querySelector('.viewer-image'); return document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false' && !i.hidden && i.complete && i.naturalWidth > 0; });
    assert.equal(await page.locator('#viewer-title').textContent(), categories[0]);
    assert.equal(await page.locator('#viewer-kind').isVisible(), false, 'Viewer has one category description');
    assert(await page.locator('.viewer-close').evaluate(e => document.activeElement === e));
    assert(await page.locator('#previous-photo').isDisabled());
    const dimensions = await page.locator('.viewer-image').evaluate(i => ({ w: i.clientWidth, h: i.clientHeight, ratio: i.naturalWidth / i.naturalHeight }));
    assert(Math.abs(dimensions.w / dimensions.h - dimensions.ratio) < .02, 'Viewer retains the complete image ratio');
    assert.equal(await page.locator('.photo-viewer > .gallery-header').count(), 1, 'The actual Gallery masthead stays in the viewer');
    const close = await page.locator('.viewer-close').evaluate(e => ({width:e.offsetWidth, gap:parseFloat(getComputedStyle(e).gap), icon:e.querySelector('svg')?.closest('button')===e}));
    assert(close.icon && close.gap <= 8 && close.width >= 80, 'Close text/icon form one compact target');
    await page.screenshot({ path: path.join(output, 'combined-desktop-viewer.png') });

    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(400);
    const frames = await page.evaluate(() => { const frames=window.viewerFrames; window.viewerFrames=null; return frames; });
    assert(frames.length > 2);
    const shownSources = new Set(frames.map(f=>f.src));
    assert.equal(shownSources.size, 2, 'Next/Previous show only the two capped image URLs, without preview upgrades');
    for(const source of shownSources){const samples=frames.filter(f=>f.src===source);assert(Math.max(...samples.map(f=>f.width))-Math.min(...samples.map(f=>f.width))<.5 && Math.max(...samples.map(f=>f.height))-Math.min(...samples.map(f=>f.height))<.5, 'Each decoded image keeps one geometry while flipping');}
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() => { const i = document.querySelector('.viewer-image'); return document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false' && !i.hidden && i.complete && i.naturalWidth > 0; });
    assert.equal(await page.locator('#viewer-title').textContent(), categories[1]);
    await page.mouse.wheel(0, 700);
    assert.equal(await page.evaluate(() => scrollY), scroll, 'Viewer locks the background');
    await page.keyboard.press('Escape');
    await page.locator('body > .gallery-header').waitFor({ state: 'attached' });
    assert(await first.evaluate(e => document.activeElement === e), 'Escape restores the source focus');
    assert.equal(await page.locator('body > .gallery-header').count(), 1, 'Close restores the original shared header');
    await page.locator('.print-link').nth(categories.indexOf('Concept art')).focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => { const i = document.querySelector('.viewer-image'); return document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false' && !i.hidden && i.complete && i.naturalWidth > 0; });
    assert.equal(await page.locator('#viewer-title').textContent(), 'Concept art');
    await page.locator('.viewer-close').click();
    await page.locator('button[data-view=spiral]').click(); await settle(page);
    await page.locator('.print-link').last().focus(); await settle(page);
    const last = await page.locator('.print img').last().boundingBox();
    const top = await page.locator('.exhibition-header').evaluate(e => e.getBoundingClientRect().bottom);
    assert(last.y >= top && last.y + last.height < 1000, 'Keyboard reaches the last photograph below sticky navigation');
    for (const [width, height] of [[1920,1080],[1024,768],[768,1024],[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0)); await settle(page);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), 'No horizontal overflow');
      await page.locator('button[data-view=gallery]').click(); await settle(page); await enter(page); await clear(page);
      const columns = await page.locator('.print').evaluateAll(es => new Set(es.map(e => Math.round(e.getBoundingClientRect().left))).size);
      assert.equal(columns, width >= 1440 ? 4 : width >= 1024 ? 3 : 2);
      assert(await page.locator('.view-switch button').evaluateAll(es => es.every(e => e.getBoundingClientRect().height >= 44)));
      await page.screenshot({ path: path.join(output, `combined-index-${width}.png`) });
      await first.click();
      await page.waitForFunction(() => { const i = document.querySelector('.viewer-image'); return document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false' && !i.hidden && i.complete && i.naturalWidth > 0; });
      const box = await page.locator('.viewer-image').boundingBox();
      assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, 'Viewer fits each viewport');
      await page.screenshot({ path: path.join(output, `combined-viewer-${width}.png`) });
      await page.keyboard.press('Escape');
      await page.locator('button[data-view=spiral]').click(); await settle(page); await enter(page);
      await checkSpiral(page); await settle(page);
      await page.screenshot({ path: path.join(output, `combined-spiral-${width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await enter(page);
    const reducedBefore = await translation(firstPrint);
    await page.mouse.wheel(0, 650); await settle(page);
    const reducedAfter = await translation(firstPrint);
    assert.equal(reducedAfter.x, reducedBefore.x, 'Reduced motion disables the scroll-linked rotation');
    assert.notEqual(reducedAfter.y, reducedBefore.y, 'Vertical scrolling remains available with reduced motion');
    await page.locator('button[data-view=gallery]').click();
    assert.equal(await page.locator('body').getAttribute('data-transitioning'), 'false');
    await context.setOffline(true);
    await page.locator('button[data-view=spiral]').click();
    assert.equal(await page.locator('button[data-view=spiral]').getAttribute('aria-pressed'), 'true');
    await context.setOffline(false);
    await page.emulateMedia({ forcedColors: 'active' });
    await page.locator('button[data-view=gallery]').click(); await settle(page); await clear(page);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.locator('.gallery-footer').scrollIntoViewIfNeeded();
    assert(await page.locator('.gallery-footer').isVisible(), 'Normal Gallery footer remains reachable');
    const legacy = await context.newPage();
    await legacy.goto(origin + '/projects/polaroid-of-yesterday/photography/?view=gallery#the-room');
    await legacy.waitForURL('**' + route + '?view=gallery#the-room'); await ready(legacy);
    assert.equal(await legacy.locator('button[data-view=gallery]').getAttribute('aria-pressed'), 'true');
    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallback = await nojs.newPage(); await fallback.goto(url);
    assert.equal(await fallback.locator('.print-link').count(), collection.length);
    assert(!(await fallback.locator('.view-switch').isVisible()));
    assert(await fallback.locator('.print-link').first().getAttribute('href'));
    const wide = await context.newPage();
    await wide.setViewportSize({ width: 2508, height: 1300 });
    await wide.goto(url); await ready(wide); await enter(wide);
    await checkSpiral(wide);
    await wide.goto(url + '?view=gallery'); await ready(wide);
    const wideRow = await wide.locator('.print img').evaluateAll(async images => {
      const row = images.slice(8, 12);
      // Simulate a narrow responsive candidate arriving for the final three previews.
      row.slice(1).forEach(image => {
        const preview = image.srcset.split(',')[0].trim().split(' ')[0];
        image.removeAttribute('srcset');
        image.src = preview;
        image.loading = 'eager';
      });
      await Promise.all(row.map(image => image.decode()));
      return row.map(image => ({ width: image.clientWidth, height: image.clientHeight,
        naturalWidth: image.naturalWidth, contain: getComputedStyle(image).objectFit === 'contain' }));
    });
    assert(wideRow[1].naturalWidth < wideRow[1].width, 'The regression check uses a preview smaller than its frame');
    assert(wideRow.every(image => image.contain && image.width === wideRow[0].width && image.height === wideRow[0].height),
      'Same-ratio Index photos keep the same display size across different source resolutions');
    await wide.close();
    const broken = await context.newPage();
    await broken.route('**/gallery/assets/optimized/**', r => r.abort());
    await broken.goto(url + '?view=gallery'); await ready(broken); await enter(broken);
    assert(await broken.locator('.print-error').first().isVisible());
    await broken.locator('.print-link').first().click();
    await broken.locator('.viewer-error').waitFor({ state: 'visible' });
    await broken.unroute('**/gallery/assets/optimized/**');
    await broken.locator('#retry-photo').click();
    await broken.waitForFunction(() => { const i = document.querySelector('.viewer-image'); return !i.hidden && i.complete && i.naturalWidth > 0; });

    const headerNavigation = await context.newPage();
    await headerNavigation.goto(url+'?view=gallery'); await ready(headerNavigation); await enter(headerNavigation);
    await headerNavigation.locator('.print-link').first().click();
    await headerNavigation.locator('.photo-viewer .gallery-person a[href="#contact"]').click();
    await headerNavigation.waitForURL('**#contact');
    assert.equal(await headerNavigation.locator('body > .gallery-header').count(),1,'Viewer header links restore the shared masthead before navigation');
    assert(!(await headerNavigation.locator('.photo-viewer').evaluate(e=>e.open)));
    const navigation = await context.newPage();
    await navigation.route('https://www.youtube.com/**', r => r.abort());
    await navigation.goto(origin + '/projects/');
    await navigation.locator('a[href="polaroid-of-yesterday/"]').first().click();
    assert.equal(await navigation.locator('.camera-tag-caption').textContent(), 'Concept Photography and Game Screenshots');
    const opening = context.waitForEvent('page');
    await navigation.locator('.camera-entrance').click();
    const destination = await opening; await destination.waitForURL('**' + route); await ready(destination);
    assert.equal(await destination.locator('.print').count(), collection.length, 'Projects → Polaroid → Gallery opens the exhibition');
    await navigation.goto(origin + '/gallery/');
    assert.equal(await navigation.locator('.gallery-main h2 a[href="trauma-induced-dissociative-amnesia/"]').count(), 1);
    assert.equal(await navigation.locator('.stills-feature').count(), 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Passed: 17 chronologically ordered images; seven visible prints at mid-wave; uninterrupted layer handoff; clickable outer thumbnails; centered print dimensions and portrait sizing; Index, viewer, keyboard and reduced motion across eight viewport sizes; no-JS originals and image error recovery.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
