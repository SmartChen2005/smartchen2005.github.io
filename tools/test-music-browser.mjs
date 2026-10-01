import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const output='tools/music-qa';fs.mkdirSync(output,{recursive:true});
const url='http://127.0.0.1:4173/projects/world-sensing-music-station/';
const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(url);await page.screenshot({path:output+'/compact-hero.png'});
assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
assert.equal(await page.locator('.step.has-note').count(),0,'Empty startup');
await page.mouse.move(700,450);await page.waitForTimeout(400);const near=await page.locator('#distance-output').textContent();
await page.mouse.move(20,450);await page.waitForTimeout(600);assert.notEqual(await page.locator('#distance-output').textContent(),near);
await page.locator('#playground').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
await page.locator('[data-layer="2"]').click();await page.locator('#randomize-button').click();assert.equal(await page.locator('[data-layer="2"] .has-note').count(),8);
const stored=await page.locator('.step').evaluateAll(nodes=>nodes.map(node=>node.dataset.value));
await page.locator('[data-mode="techno"]').click();assert.match(await page.locator('#bpm-output').textContent(),/128/);
assert.deepEqual(await page.locator('.step').evaluateAll(nodes=>nodes.map(node=>node.dataset.value)),stored);
await page.screenshot({path:output+'/compact-play.png'});
await page.locator('#record-button').click();assert.equal(await page.locator('[data-layer="2"] .has-note').count(),0);
assert.match(await page.locator('#record-status').textContent(),/REC/);
await page.waitForTimeout(4100);assert.match(await page.locator('#record-status').textContent(),/PLAY.*Melody recorded/);
await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'true');await page.locator('#sound-toggle').click();
await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true');await page.locator('#motion-toggle').click();
await page.locator('.technical-details summary').click();await page.locator('#inspect-button').click();assert(await page.locator('.scene').evaluate(el=>el.classList.contains('is-inspecting')));
await page.screenshot({path:output+'/compact-inspect.png'});await page.locator('.technical-details summary').click();
await page.locator('#clear-button').click();assert.equal(await page.locator('.step.has-note').count(),0);
await page.locator('#prototype').scrollIntoViewIfNeeded();await page.screenshot({path:output+'/compact-prototype.png'});
await page.locator('#process').scrollIntoViewIfNeeded();await page.locator('#process-next').click();await page.waitForTimeout(600);assert((await page.locator('.process-track').evaluate(el=>el.scrollLeft))>0);
await page.screenshot({path:output+'/compact-process.png'});
for(const href of await page.locator('a[download]').evaluateAll(nodes=>nodes.map(node=>node.href))){const response=await context.request.get(href);assert(response.ok());assert((await response.body()).length>1000);}
await page.locator('#video-play').click();assert.match(await page.locator('#video-player iframe').getAttribute('src'),/EojQMf95e6k/);
// Compare the compact default page against the previous committed edition.
await page.goto(url);const compact=await page.evaluate(()=>({height:document.documentElement.scrollHeight,words:document.querySelector('main').innerText.trim().split(/\s+/).length}));
const previous=execFileSync('git',['show','f47bef7:dist/projects/world-sensing-music-station/index.html'],{encoding:'utf8'});
const previousCss=execFileSync('git',['show','f47bef7:dist/projects/world-sensing-music-station/station.css'],{encoding:'utf8'});
const old=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}}),oldPage=await old.newPage();await oldPage.goto(url);
await oldPage.setContent(previous.replace(/<script[\s\S]*?<\/script>/g,'').replace('<link rel="stylesheet" href="station.css">',`<style>${previousCss}</style>`));
const baseline=await oldPage.evaluate(()=>({height:document.documentElement.scrollHeight,words:document.querySelector('main').innerText.trim().split(/\s+/).length}));
assert(compact.height<baseline.height*.5);assert(compact.words<baseline.words*.5);
fs.writeFileSync(output+'/compact-metrics.json',JSON.stringify({baseline,compact,heightReduction:1-compact.height/baseline.height,copyReduction:1-compact.words/baseline.words},null,2));
await old.close();await context.close();
for(const [width,height] of [[390,844],[320,568],[768,1024],[1440,600]]){
  const device=await browser.newContext({viewport:{width,height},hasTouch:width<701,isMobile:width<701,reducedMotion:'reduce'}),p=await device.newPage();
  p.on('pageerror',error=>errors.push(error.message));await p.goto(url);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:output+`/compact-hero-${width}.png`});
  await p.locator('#playground').scrollIntoViewIfNeeded();await p.locator('[data-mode="techno"]').click();await p.locator('[data-layer="1"]').click();
  await p.locator('#distance-input').focus();await p.keyboard.press('End');assert.equal(await p.locator('#distance-input').inputValue(),'180');
  await p.waitForTimeout(2000); // Idle reduced-motion clocks must not replay missed steps into a new recording.
  await p.locator('#record-button').click();await p.waitForTimeout(2500);assert.match(await p.locator('#record-status').textContent(),/REC/);
  await p.waitForTimeout(1600);assert.match(await p.locator('#record-status').textContent(),/PLAY.*Bass recorded/);
  await p.screenshot({path:output+`/compact-play-${width}.png`});
  await p.locator('#process').scrollIntoViewIfNeeded();await p.locator('.process-track').focus();await p.keyboard.press('ArrowRight');assert((await p.locator('.process-track').evaluate(el=>el.scrollLeft))>0);
  await p.locator('#files').scrollIntoViewIfNeeded();await p.screenshot({path:output+`/compact-files-${width}.png`});
  if(width===390){
    await p.waitForTimeout(1800);await p.locator('#playground').scrollIntoViewIfNeeded();await p.locator('#record-button').click();
    await p.waitForTimeout(2500);assert.match(await p.locator('#record-status').textContent(),/REC/,'Offscreen time cannot shorten a recording');
    await p.waitForTimeout(1600);assert.match(await p.locator('#record-status').textContent(),/PLAY.*Bass recorded/);
  }
  await device.close();
}
const nojs=await browser.newContext({javaScriptEnabled:false});const fallback=await nojs.newPage();await fallback.goto(url);assert(await fallback.locator('.device-svg').isVisible());assert.equal(await fallback.locator('a[download]').count(),4);await nojs.close();
const failure=await browser.newContext();await failure.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});const unavailable=await failure.newPage();await unavailable.goto(url);await unavailable.locator('#sound-toggle').click();assert.equal(await unavailable.locator('#sound-toggle').textContent(),'Sound unavailable');await failure.close();
assert.deepEqual(errors,[]);await browser.close();console.log('Passed: compact page/copy; correct startup, sensing, record clearing, preserved mode data, timing, sound and pause; optional anatomy; prototype/video; sketch navigation; four downloads; four responsive/reduced-motion layouts; no-JS and audio failure.');
