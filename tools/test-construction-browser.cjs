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
    await page.goto(url); await page.waitForFunction(() => window.maintenanceScene); await page.evaluate(() => document.fonts.ready);
    assert.equal((await snapshot()).length, 1); assert.equal(await page.locator('#add-objects,.scenic-control').count(), 0, 'No standalone Add control');
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
    await page.mouse.move(gesture.end.x, gesture.end.y, { steps: 45 }); await page.mouse.up(); await valid();
    const heroAfter = (await snapshot())[0];
    assert(Math.hypot(heroAfter.x - heroBefore.x, heroAfter.z - heroBefore.z) > .08, 'Dragging a prop physically pushes another prop');
    assert.equal((await snapshot()).length, countBeforePush, 'A drag never spawns');
    assert(await page.evaluate(() => maintenanceScene.grounded()), 'Pushed objects remain grounded');
    await page.screenshot({ path: output + '/construction-pushed.png' });
    await page.locator('#clear-objects').click();

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
    assert(await page.locator('#object-tools').isHidden(), 'Dragging does not open an editor panel');
    point = await pointFor(1); await page.mouse.move(point.x, point.y); await page.mouse.down(); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.equal((await snapshot()).length, 1, 'Cancelled interaction never spawns');

    await page.locator('#adjust-object').click(); await page.locator('#rotate-object').click();
    assert((await snapshot())[0].angle > rotated.angle, 'Non-drag rotation control works');
    await page.keyboard.press('Escape'); assert(await page.locator('#object-tools').isHidden());
    assert(await page.locator('#adjust-object').evaluate(el => el === document.activeElement), 'Escape restores Move focus');
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
    const mainBefore = populated[0]; await page.locator('#shuffle-objects').click();
    for (let i = 0; i < 40; i++) { await valid(); await page.waitForTimeout(35); }
    const shuffled = await snapshot(); assert.equal(shuffled[0].x, mainBefore.x); assert.equal(shuffled[0].z, mainBefore.z);
    assert(shuffled.slice(1).some((body, i) => Math.hypot(body.x - populated[i + 1].x, body.z - populated[i + 1].z) > .05), 'Shuffle rearranges secondary props');
    await page.locator('#clear-objects').click();
    const cleared = await snapshot(); assert.equal(cleared.length, 1); assert.equal(cleared[0].x, 0); assert.equal(cleared[0].z, -.15); assert.equal(cleared[0].angle, .25);
    assert(await page.locator('#shuffle-objects').isDisabled()); assert(await page.locator('#clear-objects').isDisabled());
    await page.setViewportSize({ width: 768, height: 1024 }); await page.screenshot({ path: output + '/construction-reference-size.png' });
    for (const [width, height] of [[390, 844], [320, 568], [700, 390]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(100);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow at ' + width);
      for (const el of await page.locator('.scene-controls button,.scene-footer a').all()) {
        const box = await el.boundingBox(); assert(box.width >= 44 && box.height >= 44 && box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= height, 'Reachable controls at ' + width);
      }
      await page.screenshot({ path: output + `/construction-${width}x${height}.png` });
    }
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const touchPage = await mobileContext.newPage(); await touchPage.goto(url); await touchPage.waitForFunction(() => window.maintenanceScene);
    const touchPoint = await touchPage.evaluate(() => maintenanceScene.project(1)), touchBefore = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    const cdp = await mobileContext.newCDPSession(touchPage);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchPoint.x, y: touchPoint.y }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchPoint.x + i * 5, y: touchPoint.y + i * 3 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const touchAfter = await touchPage.evaluate(() => maintenanceScene.snapshot()[0]);
    assert(Math.hypot(touchAfter.x - touchBefore.x, touchAfter.z - touchBefore.z) > .1, 'Native touch dragging moves a sign');
    assert.equal((await touchPage.evaluate(() => maintenanceScene.snapshot())).length, 1, 'Touch drag does not spawn');
    const tapped = await touchPage.evaluate(() => maintenanceScene.project(1));
    await touchPage.touchscreen.tap(tapped.x, tapped.y); assert.equal((await touchPage.evaluate(() => maintenanceScene.snapshot())).length, 2, 'Tap spawns one without relying on compatibility clicks');
    await touchPage.locator('#adjust-object').click(); await touchPage.getByRole('button', { name: 'Move closer', exact: true }).click();
    await touchPage.screenshot({ path: output + '/construction-touch-selected.png' }); await mobileContext.close();
    await page.emulateMedia({ reducedMotion: 'reduce' }); await pressAdd(); assert((await snapshot()).every(body => body.height === 0), 'Reduced motion skips the drop');
    await page.locator('#shuffle-objects').click(); await valid(); await page.locator('#clear-objects').click();
    await page.emulateMedia({ forcedColors: 'active' }); await page.locator('#maintenance-scene').focus(); await page.screenshot({ path: output + '/construction-forced-colors.png' });
    await page.emulateMedia({ forcedColors: 'none' }); await page.goto(origin + '/missing/deep/404-scene'); await page.waitForFunction(() => window.maintenanceScene);
    assert.equal(await page.title(), '404 — Site under construction · Smart Chen'); await page.locator('.scene-footer a').click(); await page.waitForURL(origin + '/');
    const fallbackContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const fallbackPage = await fallbackContext.newPage(); await fallbackPage.goto(url); assert(await fallbackPage.locator('noscript a').isVisible()); await fallbackContext.close();
    const failureContext = await browser.newContext(), failurePage = await failureContext.newPage();
    await failurePage.addInitScript(() => { const native = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { if (type === 'webgl2' || type === 'webgl') return null; return native.call(this, type, ...args); }; });
    await failurePage.goto(url); await failurePage.waitForSelector('#scene-fallback:not([hidden])'); assert(await failurePage.locator('#scene-fallback a').isVisible()); await failureContext.close();
    assert.deepEqual(errors.filter(e => !e.includes('status of 404')), []);
    console.log(JSON.stringify({ passed: true, props: populated.length, types: [...new Set(populated.map(body => body.type))], checks: 'click/tap/keyboard single spawning, click/drag/cancel discrimination, real object pushing, smooth drag-wheel rotation, non-drag controls, dense collision stability, Shuffle/Clear, responsive layouts, reduced motion, forced colors, deep 404/Home and fallback paths', consoleErrors: [] }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
