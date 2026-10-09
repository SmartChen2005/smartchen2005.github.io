const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path = require('node:path'), fs = require('node:fs');
const output = process.env.CONSTRUCTION_QA_DIR || path.join(__dirname, 'construction-qa');
fs.mkdirSync(output, { recursive: true });
const origin = process.env.CONSTRUCTION_PREVIEW_URL || 'http://127.0.0.1:4173';
const url = origin + '/404.html';
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => { let seed = 404; Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const snapshot = () => page.evaluate(() => maintenanceScene.snapshot());
    const valid = async () => {
      const all = await snapshot();
      for (const a of all) {
        assert(a.x - a.radius >= -3.10001 && a.x + a.radius <= 3.10001 && a.z - a.radius >= -2.80001 && a.z + a.radius <= 3.10001, 'Full footprints stay within floor boundaries');
        for (const b of all) if (a.id < b.id) assert(Math.hypot(a.x - b.x, a.z - b.z) >= a.radius + b.radius + .0449, 'No prop intersections');
        const wallX = Math.max(1.95, Math.min(3.15, a.x)), wallZ = Math.max(-3.4, Math.min(.2, a.z));
        assert(Math.hypot(a.x - wallX, a.z - wallZ) >= a.radius + .0449, 'No column intersections');
      }
    };
    const pointFor = id => page.evaluate(id => maintenanceScene.project(id), id);
    const pressAdd = async () => { await page.locator('#maintenance-scene').focus(); await page.keyboard.press('Enter'); };
    const clearScene = async () => {
      await page.waitForFunction(() => maintenanceScene.resting(), null, { timeout: 6000 });
      const before = (await snapshot())[0];
      await page.locator('#clear-objects').click();
      const after = (await snapshot())[0];
      assert.equal(after.id, before.id); assert.equal(after.x, before.x); assert.equal(after.z, before.z); assert.equal(after.angle, before.angle);
      assert.equal((await snapshot()).length, 1, 'Clear removes only secondary objects');
    };
    await page.goto(url); await page.waitForFunction(() => window.maintenanceScene); await page.evaluate(() => document.fonts.ready);
    assert.equal((await snapshot()).length, 1); assert.equal(await page.locator('#adjust-object,#shuffle-objects,#object-tools,.scenic-control').count(), 0, 'Move, Shuffle and the old toolbar are removed'); assert(await page.locator('#add-objects').isEnabled(), 'Native Add is available');
    assert.equal(await page.locator('.scene-home [aria-hidden]').count(), 0, 'Home has no detached arrow');
    assert.equal((await page.locator('.scene-home').textContent()).trim(), 'BACK TO HOME');
    await page.screenshot({ path: output + '/construction-desktop-final.png' });
    let point = await pointFor(1);
    // A click tolerates tiny hand motion and adds exactly one, without moving the sign.
    const clickBefore = (await snapshot())[0];
    await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.mouse.move(point.x + 3, point.y + 1); await page.mouse.up();
    assert.equal((await snapshot()).length, 2, 'Click adds exactly one object');
    assert.equal((await snapshot())[0].x, clickBefore.x); assert.equal((await snapshot())[0].z, clickBefore.z);
    await page.waitForTimeout(550); await valid();

    // Drive a spawned prop toward the hero through the real floor raycast, so
    // displacement proves that the browser uses the pushing solver.
    let source;
    for (let attempt = 0; attempt < 6; attempt++) {
      const candidates = (await snapshot()).slice(1);
      for (const candidate of candidates) {
        const p = await pointFor(candidate.id);
        if (await page.evaluate(p => maintenanceScene.pick(p.x, p.y), p) === candidate.id) { source = candidate; break; }
      }
      if (source) break;
      await pressAdd(); await page.waitForTimeout(550);
    }
    assert(source, 'A visible spawned prop is available for a real push');
    const heroBefore = (await snapshot())[0], countBeforePush = (await snapshot()).length;
    const normalLength = Math.hypot(heroBefore.x - source.x, heroBefore.z - source.z);
    const nx = (heroBefore.x - source.x) / normalLength, nz = (heroBefore.z - source.z) / normalLength;
    const gesture = await page.evaluate(({ id, x, z }) => {
      const body = maintenanceScene.snapshot().find(b => b.id === id), start = maintenanceScene.project(id), floor = maintenanceScene.floorAt(start.x, start.y);
      return { start, end: maintenanceScene.projectFloor(x + floor.x - body.x, z + floor.z - body.z) };
    }, { id: source.id, x: heroBefore.x + nx * .15, z: heroBefore.z + nz * .15 });
    await page.mouse.move(gesture.start.x, gesture.start.y); await page.mouse.down();
    for (let i = 1; i <= 30; i++) { await page.mouse.move(gesture.start.x + (gesture.end.x - gesture.start.x) * i / 30, gesture.start.y + (gesture.end.y - gesture.start.y) * i / 30); await page.waitForTimeout(16); }
    await page.waitForTimeout(180); await page.mouse.up(); await valid();
    const heroAfter = (await snapshot())[0];
    assert(Math.hypot(heroAfter.x - heroBefore.x, heroAfter.z - heroBefore.z) > .08, 'Dragging a prop physically pushes another prop');
    assert.equal((await snapshot()).length, countBeforePush, 'A drag never spawns');
    assert(await page.evaluate(() => maintenanceScene.grounded()), 'Pushed objects remain grounded');
    await page.screenshot({ path: output + '/construction-pushed.png' });
    await clearScene();
    assert((await page.evaluate(() => maintenanceScene.clearing())).particles > 0, 'Clear creates a local smoke puff');
    await page.waitForTimeout(120); await page.screenshot({ path: output + '/construction-clear-puff.png' });
    await page.waitForFunction(() => maintenanceScene.clearing().objects === 0);
    await page.reload(); await page.waitForFunction(() => window.maintenanceScene);

    point = await pointFor(1); await page.mouse.move(point.x, point.y); await page.mouse.down();
    for (let i = 1; i <= 18; i++) { await page.mouse.move(point.x + i * 6, point.y + i * 2); await page.waitForTimeout(14); }
    await page.mouse.up(); const released = (await snapshot())[0];
    assert(Math.hypot(released.vx, released.vz) > .15, 'A moving release retains velocity');
    await page.waitForTimeout(120); const coast = (await snapshot())[0];
    assert(Math.hypot(coast.x - released.x, coast.z - released.z) > .015, 'The sign glides after mouse release'); await valid();
    await page.waitForFunction(() => maintenanceScene.resting(), null, { timeout: 6000 });
    const settled = (await snapshot())[0]; await page.waitForTimeout(120);
    assert.equal((await snapshot())[0].x, settled.x); assert.equal((await snapshot())[0].z, settled.z);
    await clearScene();
    assert.equal((await page.evaluate(() => maintenanceScene.clearing())).particles, 0, 'A lone hero creates no smoke');
    await page.reload(); await page.waitForFunction(() => window.maintenanceScene);

    point = await pointFor(1);
    await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x + 60, point.y + 25, { steps: 12 });
    await page.mouse.wheel(0, 100); await page.waitForTimeout(180);
    const intermediate = (await snapshot())[0].angle;
    assert(intermediate > .27 && intermediate < .5, 'Wheel rotation eases smoothly during the drag');
    await page.mouse.move(point.x + 95, point.y + 40, { steps: 8 });
    await page.waitForTimeout(650); await page.mouse.up();
    const rotated = (await snapshot())[0];
    assert(Math.abs(rotated.angle - .5) < .006, 'Moving after scrolling does not cancel the rotation target');
    assert.equal((await snapshot()).length, 1, 'Wheel/drag release never adds objects');
    assert(rotated.height === 0); await valid();
    await page.mouse.wheel(0, 100); await page.waitForTimeout(80);
    assert.equal((await snapshot())[0].angle, rotated.angle, 'Wheel outside a drag does not rotate');
    assert.equal(await page.locator('#object-tools').count(), 0, 'Dragging has no editor panel');
    point = await pointFor(1); await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.equal((await snapshot()).length, 1, 'Cancelled interaction never spawns');

    await page.locator('#maintenance-scene').focus(); await page.keyboard.press('r');
    assert((await snapshot())[0].angle > rotated.angle, 'Keyboard rotation remains available without Move UI');
    await page.locator('#add-objects').click(); assert.equal((await snapshot()).length, 2, 'Add button spawns exactly one');
    await clearScene();
    await page.waitForFunction(() => maintenanceScene.clearing().objects === 0);
    await pressAdd(); assert.equal((await snapshot()).length, 2, 'Enter adds exactly one');
    await page.keyboard.press('Space'); assert.equal((await snapshot()).length, 3, 'Space adds exactly one');
    await page.keyboard.press(']'); assert.equal(await page.evaluate(() => maintenanceScene.selection()), (await snapshot())[1].id, 'Keyboard cycling reaches another prop');
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('r'); await valid();
    for (let i = 0; i < 55; i++) await pressAdd();
    await page.waitForTimeout(650);
    const populated = await snapshot();
    assert(populated.length >= 20 && populated.length <= 40, 'Dense spawning has a finite limit and valid placements');
    assert(new Set(populated.map(body => body.type)).size >= 5, 'Original prop family retained');
    assert(await page.evaluate(() => maintenanceScene.grounded())); await valid();
    await page.screenshot({ path: output + '/construction-dense.png' });
    assert(!populated.some(body => body.type === 'yellowCone'), 'No yellow cone variant remains');
    // Sample a dense drag and its subsequent inertial contacts on real frames.
    let densePoint;
    for (const body of populated) { const p = await pointFor(body.id); if (await page.evaluate(p => maintenanceScene.pick(p.x, p.y), p) === body.id) { densePoint = p; break; } }
    assert(densePoint); await page.mouse.move(densePoint.x, densePoint.y); await page.mouse.down();
    for (let i = 1; i <= 16; i++) { await page.mouse.move(densePoint.x + i * 4, densePoint.y + i); await page.waitForTimeout(16); await valid(); }
    await page.mouse.up(); for (let i = 0; i < 35; i++) { await valid(); await page.waitForTimeout(25); }
    await clearScene();
    const densePuffs = await page.evaluate(() => maintenanceScene.clearing());
    assert.equal(densePuffs.objects, populated.length - 1); assert.equal(densePuffs.particles, densePuffs.objects * 7);
    await page.waitForTimeout(120); await page.screenshot({ path: output + '/construction-clear-dense.png' });
    await page.locator('#add-objects').click();
    const newborn = (await snapshot())[1].id;
    await page.waitForFunction(() => maintenanceScene.clearing().objects === 0);
    assert((await snapshot()).some(body => body.id === newborn), 'An object added during the puff survives its cleanup');
    await clearScene();
    await page.locator('#clear-objects').click();
    assert.equal((await page.evaluate(() => maintenanceScene.clearing())).particles, 0, 'Repeated Clear releases pending clouds');
    assert(await page.locator('#add-objects').isEnabled());
    await page.reload(); await page.waitForFunction(() => window.maintenanceScene);
    await page.setViewportSize({ width: 768, height: 1024 }); await page.screenshot({ path: output + '/construction-reference-size.png' });
    for (const [width, height] of [[390, 844], [320, 568], [700, 390]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(100);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
      for (const el of await page.locator('.scene-controls button,.scene-home').all()) {
        const box = await el.boundingBox(); assert(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= height, 'Reachable controls at ' + width);
      }
      await page.screenshot({ path: output + `/construction-${width}x${height}.png` });
    }
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await mobileContext.newPage(); await touchPage.goto(url); await touchPage.waitForFunction(() => window.maintenanceScene);
    const touchPoint = await touchPage.evaluate(() => maintenanceScene.project(1)), touchBefore = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    const cdp = await mobileContext.newCDPSession(touchPage);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchPoint.x, y: touchPoint.y }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchPoint.x + i * 5, y: touchPoint.y + i * 3 }] }); await touchPage.waitForTimeout(20); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touchPage.waitForTimeout(100);
    const touchAfter = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    assert(Math.hypot(touchAfter.x - touchBefore.x, touchAfter.z - touchBefore.z) > .1, 'Native touch dragging moves a sign');
    assert.equal((await touchPage.evaluate(() => maintenanceScene.snapshot())).length, 1, 'Touch drag does not spawn');
    await touchPage.waitForFunction(() => maintenanceScene.resting(), null, { timeout: 6000 });
    const tapped = await touchPage.evaluate(() => maintenanceScene.project(1));
    await touchPage.touchscreen.tap(tapped.x, tapped.y); assert.equal((await touchPage.evaluate(() => maintenanceScene.snapshot())).length, 2, 'Tap spawns one without relying on compatibility clicks');
    await touchPage.getByRole('button', { name: 'Add one object', exact: true }).tap(); await touchPage.waitForFunction(() => maintenanceScene.snapshot().length === 3);
    await touchPage.screenshot({ path: output + '/construction-touch-selected.png' });
    await touchPage.waitForFunction(() => maintenanceScene.resting());
    const touchClearBefore = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    await touchPage.getByRole('button', { name: 'CLEAR', exact: true }).tap();
    const touchClearAfter = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    assert.equal(touchClearAfter.x, touchClearBefore.x); assert.equal(touchClearAfter.z, touchClearBefore.z); assert.equal(touchClearAfter.angle, touchClearBefore.angle);
    await touchPage.waitForTimeout(120); await touchPage.screenshot({ path: output + '/construction-clear-mobile.png' });
    await touchPage.waitForFunction(() => maintenanceScene.clearing().objects === 0); await mobileContext.close();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await pressAdd(); assert((await snapshot()).every(body => body.height === 0), 'Reduced motion skips the drop');
    await valid(); await clearScene();
    assert.equal((await page.evaluate(() => maintenanceScene.clearing())).particles, 0, 'Reduced motion clears without smoke animation');
    point = await pointFor(1); await page.mouse.move(point.x, point.y); await page.mouse.down();
    await page.mouse.move(point.x + 60, point.y + 25, { steps: 12 }); await page.mouse.up();
    const reducedEnd = (await snapshot())[0];
    assert.equal(reducedEnd.vx, 0); assert.equal(reducedEnd.vz, 0);
    await page.waitForTimeout(150);
    assert.equal((await snapshot())[0].x, reducedEnd.x); assert.equal((await snapshot())[0].z, reducedEnd.z);
    await valid(); await clearScene();
    await page.emulateMedia({ forcedColors: 'active' }); await page.locator('#maintenance-scene').focus(); await page.screenshot({ path: output + '/construction-forced-colors.png' });
    await page.emulateMedia({ forcedColors: 'none' }); await page.goto(origin + '/missing/deep/404-scene'); await page.waitForFunction(() => window.maintenanceScene);
    assert.equal(await page.title(), '404 — Site under construction · Smart Chen'); await page.locator('.scene-home').click(); await page.waitForURL(origin + '/');
    const fallbackContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallbackPage = await fallbackContext.newPage(); await fallbackPage.goto(url); assert(await fallbackPage.locator('noscript a').isVisible()); await fallbackContext.close();
    const failureContext = await browser.newContext(), failurePage = await failureContext.newPage();
    await failurePage.addInitScript(() => { const native = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2' || type === 'webgl') return null; return native.call(this, type, ...args); }; });
    await failurePage.goto(url); await failurePage.waitForSelector('#scene-fallback:not([hidden])'); assert(await failurePage.locator('#scene-fallback a').isVisible()); await failureContext.close();
    assert.deepEqual(errors.filter(e => !e.includes('status of 404')), []);
    console.log(JSON.stringify({ passed: true, props: populated.length, types: [...new Set(populated.map(body => body.type))], checks: 'arrow-free Home, Clear preserves hero pose, smoke lifecycle and rapid Clear/Add, mouse/touch/keyboard spawning and dragging, wheel rotation, release glide and rest, dense collisions, responsive layouts, reduced motion, forced colors, deep 404/Home and fallbacks', consoleErrors: [] }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
