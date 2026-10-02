import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {floorPoint} from '../dist/projects/world-sensing-music-station/space-engine.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',args:['--autoplay-policy=document-user-activation-required']});
const output='tools/music-qa';fs.mkdirSync(output,{recursive:true});
const url='http://127.0.0.1:4173/projects/world-sensing-music-station/';
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.addInitScript(()=>{
  const Native=window.AudioContext;window.__audioNotes=[];
  window.AudioContext=class extends Native{
    constructor(...args){super(...args);window.__audioContext=this;}
    createAnalyser(){const analyser=super.createAnalyser();window.__audioAnalyser=analyser;return analyser;}
    createOscillator(){const oscillator=super.createOscillator(),start=oscillator.start.bind(oscillator);oscillator.start=(...args)=>{window.__audioNotes.push(oscillator.frequency.value);return start(...args);};return oscillator;}
  };
});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(url);await page.screenshot({path:output+'/compact-hero.png'});
assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
assert.equal(await page.locator('.step.has-note').count(),0,'Empty startup');
assert.equal(await page.locator('#sound-toggle').getAttribute('aria-label'),'Mute sound');
assert.equal(await page.evaluate(()=>window.__audioContext.state),'suspended','Browser autoplay is locked until ordinary interaction');
const large=await page.locator('.device-stage').evaluate(el=>el.getBoundingClientRect().width);
await page.evaluate(()=>scrollTo({top:450,behavior:'instant'}));await page.waitForTimeout(100);
const middle=await page.locator('.device-stage').evaluate(el=>el.getBoundingClientRect().width);assert(middle<large*.8&&middle>large*.35,'Continuous scroll shrink');
await page.locator('#playground').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
const small=await page.locator('.device-stage').evaluate(el=>el.getBoundingClientRect().width);assert(small<middle*.65);
const world=await page.locator('.spatial-world').boundingBox();
const screenPoint=(u,v)=>{const p=floorPoint(u,v,55);return {x:world.x+p.x/1000*world.width,y:world.y+p.y/740*world.height};};
const a=screenPoint(.5,.15),b=screenPoint(.65,.85);
await page.mouse.move(a.x,a.y);await page.mouse.down();await page.waitForTimeout(550);const near=await page.locator('#distance-output').textContent();
await page.mouse.move(b.x,b.y,{steps:18});await page.waitForTimeout(600);await page.mouse.up();
assert.notEqual(await page.locator('#distance-output').textContent(),near);
const far=parseInt(await page.locator('#distance-output').textContent());
assert.equal(await page.locator('#sound-toggle').getAttribute('data-audio-state'),'running','Drag automatically unlocks sound');
const peak=await page.evaluate(async()=>{
  let max=0;const samples=new Uint8Array(window.__audioAnalyser.fftSize);
  for(let i=0;i<10;i++){window.__audioAnalyser.getByteTimeDomainData(samples);max=Math.max(max,...samples.map(v=>Math.abs(v-128)));await new Promise(resolve=>setTimeout(resolve,20));}return max;
});assert(peak>0,'Real non-silent audio reaches the analyser');
assert((await page.evaluate(()=>new Set(window.__audioNotes).size))>1,'Distance changes the live note');
await page.screenshot({path:output+'/space-play.png'});
await page.locator('#follow-toggle').click();await page.mouse.move(a.x,a.y);await page.waitForTimeout(650);assert(parseInt(await page.locator('#distance-output').textContent())<far-50,'Follow settles to the new location');
await page.locator('#follow-toggle').click();
await page.locator('#world-control').focus();await page.keyboard.press('ArrowDown');await page.waitForTimeout(450);
await page.locator('[data-layer="2"]').click();await page.locator('#randomize-button').click();assert.equal(await page.locator('[data-layer="2"] .has-note').count(),8);
const stored=await page.locator('.step').evaluateAll(nodes=>nodes.map(node=>node.dataset.value));
await page.locator('[data-mode="techno"]').click();assert.match(await page.locator('#bpm-output').textContent(),/128/);
assert.deepEqual(await page.locator('.step').evaluateAll(nodes=>nodes.map(node=>node.dataset.value)),stored);
await page.screenshot({path:output+'/compact-play.png'});
await page.locator('#record-button').click();assert.equal(await page.locator('[data-layer="2"] .has-note').count(),0);
assert.match(await page.locator('#record-status').textContent(),/REC/);
await page.waitForTimeout(4100);assert.match(await page.locator('#record-status').textContent(),/PLAY.*Melody recorded/);
await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'true');
const noteCount=await page.evaluate(()=>window.__audioNotes.length);await page.locator('#distance-input').fill('80');await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__audioNotes.length),noteCount,'Mute survives ordinary movement');
await page.locator('#sound-toggle').click();await page.waitForTimeout(100);assert.equal(await page.locator('#sound-toggle').getAttribute('data-audio-state'),'running');
await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true');await page.locator('#motion-toggle').click();
await page.locator('.technical-details summary').click();await page.locator('#inspect-button').click();assert(await page.locator('.scene').evaluate(el=>el.classList.contains('is-inspecting')));
await page.waitForTimeout(550);assert(await page.locator('#world-control').isDisabled());
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
for(const [width,height] of [[390,844],[320,568],[690,858],[768,1024],[844,390],[1440,600]]){
  const device=await browser.newContext({viewport:{width,height},hasTouch:width<701,isMobile:width<701,reducedMotion:'reduce'}),p=await device.newPage();
  p.on('pageerror',error=>errors.push(error.message));await p.goto(url);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:output+`/compact-hero-${width}.png`});
  await p.locator('#playground').scrollIntoViewIfNeeded();await p.locator('[data-mode="techno"]').click();await p.locator('[data-layer="1"]').click();
  if(width<=700){
    const instruction=await p.locator('#world-instruction').boundingBox(),readout=await p.locator('.world-readout').boundingBox();
    assert(instruction.y>=readout.y+readout.height+4,'Movement hint and sound readout remain separate');
  }
  if(width<701){
    const box=await p.locator('.spatial-world').boundingBox(),position=floorPoint(.5,.6,55);
    assert(box.y>=0&&box.y+box.height<=height*.38+1,'Room fits the sticky inspection area at intermediate widths');
    await p.touchscreen.tap(box.x+position.x/1000*box.width,box.y+position.y/740*box.height);await p.waitForTimeout(100);
    assert.equal(await p.locator('#sound-toggle').getAttribute('data-audio-state'),'running','Touch starts sound without an enable button');
  }
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
const failure=await browser.newContext();await failure.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});const unavailable=await failure.newPage();await unavailable.goto(url);assert.equal(await unavailable.locator('#sound-toggle').getAttribute('aria-label'),'Sound unavailable');assert(await unavailable.locator('#sound-toggle').isDisabled());await failure.close();
assert.deepEqual(errors,[]);await browser.close();console.log('Passed: continuous scroll shrink; projected drag/follow/keyboard movement; wall distance and live pitch; default audio intent, gesture unlock, actual non-silent output, mute/unmute; compact copy; source recording rules and timing; disclosure/media/downloads; six responsive/reduced-motion layouts including intermediate sidebar and landscape; no-JS and unavailable audio.');
