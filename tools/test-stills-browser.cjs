const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.join(__dirname,'stills-qa');
fs.mkdirSync(output,{recursive:true});
const origin = process.env.STILLS_PREVIEW_URL || 'http://127.0.0.1:4173';
const url = origin+'/projects/polaroid-of-yesterday/photography/';
const pause = p => p.waitForTimeout(1250);
const ready = p => p.waitForFunction(() => document.body.classList.contains('is-ready') && document.querySelector('.print').style.transform);
const settle = async p => {await pause(p); await p.evaluate(()=>document.fonts.ready);};
const galleryClear = async p => {
  const bounds = await p.locator('.print').evaluateAll(es=>es.map(e=>{
    const image=e.querySelector('img').getBoundingClientRect(),caption=e.querySelector('figcaption').getBoundingClientRect();
    return {left:image.left,right:image.right,top:image.top,bottom:Math.max(image.bottom,caption.bottom)};
  }));
  for(let i=0;i<bounds.length;i++)for(let j=i+1;j<bounds.length;j++){
    const a=bounds[i],b=bounds[j];
    assert(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'Rendered gallery images and captions never overlap');
  }
};
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'}), errors=[];
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await ready(page);await settle(page);
    assert.equal(await page.locator('.print').count(),20);
    assert.equal(await page.locator('button[data-view=spiral]').getAttribute('aria-pressed'),'true');
    const loaded=await page.locator('.print img').evaluateAll(images=>images.slice(0,9).every(i=>i.complete&&i.naturalWidth));
    assert(loaded,'Initial photographs load');
    await page.screenshot({path:path.join(output,'spiral-desktop.png')});
    const before=await page.locator('#the-room').evaluate(e=>e.style.transform);
    await page.mouse.wheel(0,900);await settle(page);
    assert.notEqual(await page.locator('#the-room').evaluate(e=>e.style.transform),before,'Scroll moves the vertical camera');
    assert(await page.evaluate(()=>window.scrollY)>800,'Native scroll remains active');
    await page.screenshot({path:path.join(output,'spiral-scrolled.png')});
    await page.locator('button[data-view=gallery]').click();await pause(page);
    assert.equal(await page.locator('button[data-view=gallery]').getAttribute('aria-pressed'),'true');
    assert(page.url().includes('view=gallery'));
    assert(await page.locator('.print').evaluateAll(es=>es.every(e=>e.style.transform.includes(', 0px)')||e.style.transform.includes(',0px)'))),'Gallery flattens all depth');
    await page.evaluate(()=>window.scrollTo(0,0));await settle(page);
    await galleryClear(page);
    assert(await page.locator('.print').evaluateAll(es=>es.every(e=>e.style.opacity==='1')),'Settled gallery preserves original image tones');
    await page.screenshot({path:path.join(output,'gallery-desktop.png')});
    await page.locator('#the-room .print-link').click();await page.waitForTimeout(800);
    assert(await page.locator('.photo-viewer').evaluate(e=>e.open));
    assert.equal(await page.locator('#viewer-title').textContent(),'The room');
    assert(await page.locator('.viewer-close').evaluate(e=>document.activeElement===e),'Close receives focus');
    assert.equal(await page.locator('#previous-photo').isDisabled(),true);
    const imageBox=await page.locator('.viewer-image').boundingBox();
    assert(Math.abs(imageBox.width/imageBox.height-16/9)<.01,'Viewer preserves original ratio');
    await page.screenshot({path:path.join(output,'viewer-desktop.png')});
    const initialScroll=await page.evaluate(()=>window.scrollY);
    await page.keyboard.press('ArrowRight');await page.waitForTimeout(300);
    assert.equal(await page.locator('#viewer-title').textContent(),'After dark');
    await page.mouse.wheel(0,800);assert.equal(await page.evaluate(()=>window.scrollY),initialScroll,'Modal locks background scroll');
    await page.keyboard.press('Escape');await page.waitForTimeout(150);
    assert(!(await page.locator('.photo-viewer').evaluate(e=>e.open)));
    assert(await page.locator('#the-room .print-link').evaluate(e=>document.activeElement===e),'Closing restores source focus');
    await page.locator('button[data-view=spiral]').click();await pause(page);
    await page.locator('#the-room .print-link').focus();await page.keyboard.press('Enter');
    assert(await page.locator('.photo-viewer').evaluate(e=>e.open),'Spiral opens shared viewer through keyboard');
    await page.locator('.viewer-close').click();
    // Rapid mode changes settle to the final requested composition.
    await page.locator('button[data-view=gallery]').click();await page.waitForTimeout(150);
    await page.locator('button[data-view=spiral]').click();await pause(page);
    assert.equal(await page.locator('body').getAttribute('data-transitioning'),'false');
    // All photos remain reachable by keyboard, even far outside the camera.
    await page.locator('#what-remains .print-link').focus();await settle(page);
    const lastBox=await page.locator('#what-remains img').boundingBox();
    assert(lastBox.y>100&&lastBox.y+lastBox.height<940,'Keyboard brings a distant photograph into view');
    await page.evaluate(()=>window.scrollTo(0,0));await settle(page);
    for (const [w,h] of [[390,844],[320,568],[844,390]]) {
      await page.setViewportSize({width:w,height:h});await settle(page);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),true,'No horizontal overflow');
      await page.screenshot({path:path.join(output,`spiral-${w}.png`)});
      await page.locator('button[data-view=gallery]').click();await pause(page);
      await page.evaluate(()=>window.scrollTo(0,0));await settle(page);
      await galleryClear(page);
      await page.screenshot({path:path.join(output,`gallery-${w}.png`)});
      await page.locator('#the-room .print-link').click();await page.waitForTimeout(750);
      const box=await page.locator('.viewer-image').boundingBox();
      assert(box.x>=0&&box.y>=0&&box.x+box.width<=w&&box.y+box.height<=h,'Phone viewer fits viewport');
      await page.screenshot({path:path.join(output,`viewer-${w}.png`)});
      await page.keyboard.press('Escape');
      await page.locator('button[data-view=spiral]').click();await pause(page);
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.locator('button[data-view=gallery]').click();await page.waitForTimeout(50);
    assert.equal(await page.locator('body').getAttribute('data-transitioning'),'false','Reduced motion skips the morph');
    await page.locator('button[data-view=spiral]').click();await page.waitForTimeout(50);
    await page.mouse.wheel(0,400);await page.waitForTimeout(100);
    await page.screenshot({path:path.join(output,'reduced-motion.png')});
    await context.setOffline(true);await page.locator('button[data-view=gallery]').click();await page.waitForTimeout(50);
    assert.equal(await page.locator('button[data-view=gallery]').getAttribute('aria-pressed'),'true','Loaded exhibition works offline');
    await context.setOffline(false);
    const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    const fallback=await nojs.newPage();await fallback.goto(url);await fallback.screenshot({path:path.join(output,'no-javascript.png')});
    assert.equal(await fallback.locator('.print').count(),20);
    assert(!(await fallback.locator('.view-switch').isVisible()));
    assert((await fallback.locator('#the-room .print-link').getAttribute('href')).endsWith('room.jpg'));
    // Failed media keeps an understandable, actionable original link.
    const broken=await context.newPage();await broken.route('**/assets/the-room.webp',r=>r.abort());await broken.goto(url);await ready(broken);
    assert(await broken.locator('#the-room .print-error').isVisible());
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('Passed: native scrolling and 3D depth; continuous mode changes; original ratios; shared viewer; focus, Escape and arrows; modal scroll lock; distant keyboard focus; mobile and landscape; reduced motion; offline; no-JS; image error fallback.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
