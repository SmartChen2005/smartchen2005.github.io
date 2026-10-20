import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
fs.mkdirSync('tools/music-qa',{recursive:true});
try {
  for(const [width,height] of [[700,871],[690,858],[700,500],[700,390]]){
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
    await page.goto(process.env.MUSIC_TEST_URL||'http://127.0.0.1:4173/projects/world-sensing-music-station/');
    await page.locator('a[href="#playground"]').last().click();
    const room=await page.locator('.spatial-world').boundingBox(),hint=await page.locator('#world-instruction').boundingBox(),readout=await page.locator('.world-readout').boundingBox();
    assert(room.y>=-1&&room.y+room.height<=height*(height<=500?.5:.42)+1,'Room stays in its sticky area');
    assert(hint.y>=readout.y+readout.height+4,JSON.stringify({width,height,hint,readout}));
    assert(await page.locator('#follow-toggle').isVisible());await page.locator('#follow-toggle').click();
    assert.equal(await page.locator('#follow-toggle').getAttribute('aria-pressed'),'true');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:`tools/music-qa/space-sidebar-${width}-${height}.png`});await context.close();
  }
  console.log('Passed: four narrow pointer layouts, bounded room, separate waveform/hint, cursor following and no horizontal overflow.');
} finally { await browser.close(); }
