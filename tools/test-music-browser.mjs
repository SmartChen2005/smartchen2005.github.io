import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {FAMILIAR_ROUTE,placeNotes} from '../dist/projects/world-sensing-music-station/place-score.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',args:['--autoplay-policy=document-user-activation-required']});
const output='tools/music-qa';fs.mkdirSync(output,{recursive:true});
const url=process.env.MUSIC_TEST_URL||'http://127.0.0.1:4173/projects/world-sensing-music-station/';
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.addInitScript(()=>{
    const Native=window.AudioContext;window.__audioNotes=[];
    window.AudioContext=class extends Native{
      constructor(...args){super(...args);window.__audioContext=this;}
      createAnalyser(){const analyser=super.createAnalyser();window.__audioAnalyser=analyser;return analyser;}
      createOscillator(){const oscillator=super.createOscillator(),start=oscillator.start.bind(oscillator);oscillator.start=(...args)=>{window.__audioNotes.push({hz:oscillator.frequency.value,time:this.currentTime,type:oscillator.type});return start(...args);};return oscillator;}
    };
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
  assert.equal(await page.locator('.step.has-note').count(),0);
  assert.equal(await page.evaluate(()=>window.__audioContext.state),'suspended');
  assert.equal(await page.locator('.hero-photo img').evaluate(img=>img.naturalWidth>0),true);
  await page.screenshot({path:output+'/place-hero.png'});
  await page.evaluate(()=>scrollTo({top:260,behavior:'instant'}));await page.waitForTimeout(100);
  const photo=await page.locator('.hero-photo').evaluate(el=>Number(el.style.opacity));
  const model=await page.locator('.device-stage').evaluate(el=>Number(el.style.opacity));
  assert(photo>0&&photo<1&&model>0&&model<1,'Photo and model share an intermediate scroll frame');
  await page.screenshot({path:output+'/place-transition.png'});
  await page.locator('a[href="#playground"]').last().click();await page.waitForTimeout(800);
  assert(await page.locator('#world-control').isEnabled());
  await page.locator('#route-demo').click();await page.waitForTimeout(12300);
  const notes=await page.evaluate(()=>window.__audioNotes);
  assert(notes.length>=16,'Two complete route phrases sound');
  assert.deepEqual(notes.slice(0,8).map(n=>n.hz),notes.slice(8,16).map(n=>n.hz),'Retracing the route repeats the melody');
  assert(notes.every(n=>n.type==='sine'),'The empty-loop route auditions a single soft melody voice');
  assert(notes.slice(1).every((n,i)=>n.time-notes[i].time>.65),'Motion adds no off-beat note bursts');
  const peak=await page.evaluate(async()=>{
    let max=0;const samples=new Uint8Array(window.__audioAnalyser.fftSize);
    for(let i=0;i<40;i++){window.__audioAnalyser.getByteTimeDomainData(samples);max=Math.max(max,...samples.map(v=>Math.abs(v-128)));await new Promise(r=>setTimeout(r,20));}return max;
  });assert(peak>0&&peak<127,'Real audio reaches the output without clipping');
  await page.locator('#record-button').click();assert(await page.locator('[data-mode="techno"]').isDisabled());
  await page.waitForTimeout(6200);assert.match(await page.locator('#record-status').textContent(),/Melody loop recorded/);
  const values=await page.locator('[data-layer="2"] .step').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value)));
  assert.deepEqual(values,FAMILIAR_ROUTE.map(([u,v],i)=>placeNotes(u,v,i)[2]));
  await page.locator('#route-demo').click();await page.locator('#route-replay').click();assert.equal(await page.locator('#route-replay').getAttribute('aria-pressed'),'true');
  await page.locator('#sound-toggle').click();const count=await page.evaluate(()=>window.__audioNotes.length);
  await page.locator('#distance-input').fill('160');await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>window.__audioNotes.length),count,'Mute survives movement');
  assert.equal(await page.locator('#route-replay').getAttribute('aria-pressed'),'false','Manual input takes over from replay');
  await page.locator('#sound-toggle').click();await page.locator('#motion-toggle').click();assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'),'true');await page.locator('#motion-toggle').click();
  await page.locator('[data-mode="techno"]').click();assert.equal(await page.locator('[data-layer="2"] .step').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.value))).then(v=>JSON.stringify(v)),JSON.stringify(values));
  await page.locator('#clear-button').click();assert.equal(await page.locator('.step.has-note').count(),0);assert(await page.locator('#route-replay').isDisabled());
  await page.locator('.technical-details summary').click();await page.locator('#inspect-button').click();assert(await page.locator('#world-control').isDisabled());await page.locator('.technical-details summary').click();
  await page.screenshot({path:output+'/place-controls.png'});
  await page.locator('#process').scrollIntoViewIfNeeded();assert.equal(await page.locator('.process-sheet').count(),13);
  await page.locator('#process-next').click();await page.waitForTimeout(400);assert(await page.locator('.process-track').evaluate(el=>el.scrollLeft>0));
  await page.locator('[data-process-page="2"]').click();assert(await page.locator('.process-viewer').evaluate(el=>el.open));
  await page.locator('#viewer-next').click();assert.match(await page.locator('#viewer-title').textContent(),/4 \/ 13/);
  await page.keyboard.press('ArrowRight');assert.match(await page.locator('#viewer-title').textContent(),/5 \/ 13/);
  await page.locator('#viewer-zoom').click();assert.equal(await page.locator('#viewer-zoom').getAttribute('aria-pressed'),'true');
  await page.keyboard.press('Escape');assert.equal(await page.locator('.process-viewer').evaluate(el=>el.open),false);
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.processPage),'2','Viewer restores focus');
  await page.screenshot({path:output+'/place-process.png'});
  for(const href of await page.locator('a[download]').evaluateAll(nodes=>nodes.map(n=>n.href))){const response=await context.request.get(href);assert(response.ok());}
  await context.close();
  for(const [width,height] of [[320,568],[390,844],[700,871],[768,1024],[844,390],[1024,768],[1440,600]]){
    const device=await browser.newContext({viewport:{width,height},hasTouch:width<=900,isMobile:width<=900,reducedMotion:'reduce'}),p=await device.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const photo=await p.locator('.hero-photo').boundingBox(),thesis=await p.locator('.hero-bottom').boundingBox();
    if(width<=520)assert(photo.y+photo.height<=thesis.y+1,'Phone photo and thesis do not overlap');
    await p.screenshot({path:output+`/place-hero-${width}.png`});
    await p.locator('a[href="#playground"]').last().click();await p.waitForTimeout(150);
    assert.equal(await p.evaluate(()=>innerWidth),width,'The transition cannot expand a mobile layout viewport');
    assert(await p.locator('#world-control').isEnabled(),JSON.stringify(await p.evaluate(()=>({width:innerWidth,height:innerHeight,scroll:scrollY,play:document.querySelector('#playground').getBoundingClientRect().top,chapter:document.querySelector('.scene').dataset.chapter}))));
    const world=await p.locator('.spatial-world').boundingBox();
    assert(world.y>=-1&&world.y+world.height<=height+1,'Room stays in viewport');
    await p.locator('#route-demo').click();await p.locator('#record-button').click();await p.waitForTimeout(6200);assert.match(await p.locator('#record-status').textContent(),/loop recorded/);
    await p.locator('#distance-input').focus();await p.keyboard.press('End');assert.equal(await p.locator('#distance-input').inputValue(),'180');
    await p.screenshot({path:output+`/place-play-${width}.png`});
    await p.locator('[data-process-page="12"]').click();await p.locator('#viewer-image').evaluate(img=>img.decode());assert.match(await p.locator('#viewer-title').textContent(),/13 \/ 13/);assert(await p.locator('#viewer-next').isDisabled());await p.keyboard.press('Escape');
    await device.close();
  }
  const plain=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await plain.newPage();await p.goto(url);assert(await p.locator('.hero-photo img').isVisible());assert.equal(await p.locator('.process-sheet a').count(),13);await plain.close();
  const unavailable=await browser.newContext();await unavailable.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});const broken=await unavailable.newPage();await broken.goto(url);assert(await broken.locator('#sound-toggle').isDisabled());await unavailable.close();
  assert.deepEqual(errors,[]);
  console.log('Passed: photo/model scroll frame; identical repeated route audio; real non-clipping soft audio; eight-step recording/replay; mute, pause, mode retention and manual takeover; all 13 PDF pages, viewer zoom/arrows/Escape/focus; seven responsive layouts, reduced motion, no-JS and unavailable audio.');
} finally { await browser.close(); }
