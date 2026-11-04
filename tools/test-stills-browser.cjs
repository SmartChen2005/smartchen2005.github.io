const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.join(__dirname, 'stills-qa');
fs.mkdirSync(output, { recursive: true });
const origin = process.env.STILLS_PREVIEW_URL || 'http://127.0.0.1:4173';
const route = '/gallery/trauma-induced-dissociative-amnesia/';
const url = origin + route;
const ready = page => page.waitForFunction(() => document.body.classList.contains('is-ready') && document.querySelector('.print').style.transform);
const settle = page => page.waitForTimeout(350);
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
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-proxy-server'] });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await ready(page); await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.print').count(), 31);
    assert.equal(await page.locator('h1').textContent(), 'Trauma-Induced Dissociative Amnesia');
    assert.equal(await page.locator('.gallery-header, .gallery-footer').count(), 2);
    const categories = await page.locator('.print').evaluateAll(es => es.map(e => e.dataset.kind));
    assert.equal(await page.locator('.print-caption').count(), 0, 'Index is images only');
    assert.equal(categories.filter(s => s === 'Concept art').length, 11);
    assert.equal(categories.filter(s => s === 'In-game screenshot').length, 20);
    const order = await page.locator('.print').evaluateAll(es => es.map(e => e.id));
    assert.equal(await page.locator('button[data-view=spiral]').getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: path.join(output, 'combined-desktop-title.png') });
    await enter(page);
    const before = await page.locator('.print').first().getAttribute('style');
    await page.mouse.wheel(0, 650); await settle(page);
    assert.notEqual(await page.locator('.print').first().getAttribute('style'), before, 'Native scroll advances the helix');
    await page.screenshot({ path: path.join(output, 'combined-desktop-spiral.png') });
    const portraitScales = await page.locator('.print').evaluateAll(async es => {
      const {spiralPose} = await import('/projects/polaroid-of-yesterday/photography/stills-layout.mjs');
      const ref = Number(document.querySelector('.exhibition').dataset.referenceRatio);
      return es.filter(e => e.querySelector('img').height > e.querySelector('img').width).map(e => {
        const i=e.querySelector('img'), index=Number(e.dataset.index), expected=spiralPose(index,0,document.documentElement.clientWidth,document.querySelector('.installation').clientHeight,es.length).width*ref*Number(i.getAttribute('width'))/Number(i.getAttribute('height'));
        return Math.abs(parseFloat(e.style.width)-expected)<.002;
      });
    });
    assert(portraitScales.length > 0 && portraitScales.every(Boolean), 'Spiral portraits use the landscape short-edge scale');

    await page.locator('button[data-view=gallery]').click(); await settle(page);
    assert(page.url().includes('view=gallery'));
    await enter(page); await clear(page);
    assert.deepEqual(await page.locator('.print').evaluateAll(es => es.map(e => e.id)), order, 'Switching views preserves mixed order');
    assert(await page.locator('.print').evaluateAll(es => es.every(e => e.style.opacity === '1' && /,\s*0(?:\.0+)?px\)/.test(e.style.transform))), 'Index has no depth or image tint');
    await page.screenshot({ path: path.join(output, 'combined-desktop-index.png') });
    const portraitHeights = await page.locator('.print img').evaluateAll(es => {
      const ref=Number(document.querySelector('.exhibition').dataset.referenceRatio);
      return es.filter(i=>i.height>i.width).map(i=>Math.abs(i.clientHeight-i.closest('.print-paper').clientWidth*ref)<2 && i.clientWidth<i.closest('.print-paper').clientWidth*.8);
    });
    assert(portraitHeights.length > 0 && portraitHeights.every(Boolean), 'Index portrait long edges align with landscape short edges');

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
      await page.screenshot({ path: path.join(output, `combined-spiral-${width}.png`) });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
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
    assert.equal(await fallback.locator('.print-link').count(), 31);
    assert(!(await fallback.locator('.view-switch').isVisible()));
    assert(await fallback.locator('.print-link').first().getAttribute('href'));
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
    assert.equal(await destination.locator('.print').count(), 31, 'Projects → Polaroid → Gallery opens the combined exhibition');
    await navigation.goto(origin + '/gallery/');
    assert.equal(await navigation.locator('.gallery-main h2 a[href="trauma-induced-dissociative-amnesia/"]').count(), 1);
    assert.equal(await navigation.locator('.stills-feature').count(), 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('Passed: 31 mixed images; Gallery shell; native scroll helix; Spiral/Index order and responsive non-overlap; category-only viewer; ratio/arrows/Escape/focus/scroll lock; seven viewports; 44px controls; last-image keyboard access; reduced motion/forced colors/offline; footer; legacy query/hash redirect; no-JS originals; image error/retry.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
