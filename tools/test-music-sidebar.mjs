import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
fs.mkdirSync('tools/music-qa',{recursive:true});
for(const [width,height] of [[700,871],[690,858],[700,500],[700,390]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/projects/world-sensing-music-station/');
  await page.locator('#playground').scrollIntoViewIfNeeded();
  await page.locator('#world-control').waitFor({state:'visible'});
  const room=await page.locator('.spatial-world').boundingBox(),hint=await page.locator('#world-instruction').boundingBox(),readout=await page.locator('.world-readout').boundingBox();
  assert(room.y+room.height<=height*.38+1,'Narrow mouse-driven room stays in its inspection area');
  assert(hint.y>=readout.y+readout.height+4,JSON.stringify({width,height,hint,readout}));
  assert(await page.locator('#follow-toggle').isVisible());await page.locator('#follow-toggle').click();
  assert.equal(await page.locator('#follow-toggle').getAttribute('aria-pressed'),'true');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`tools/music-qa/space-sidebar-${width}-${height}.png`});await context.close();
}
await browser.close();console.log('Passed: four narrow desktop-pointer/sidebar layouts, bounded room, separate waveform/hint, working cursor-follow control and no horizontal overflow.');
