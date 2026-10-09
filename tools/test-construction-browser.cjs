const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const path=require('node:path'),fs=require('node:fs');
const output=process.env.CONSTRUCTION_QA_DIR||path.join(__dirname,'construction-qa');fs.mkdirSync(output,{recursive:true});
const origin=process.env.CONSTRUCTION_PREVIEW_URL||'http://127.0.0.1:4173';
const url=origin+'/404.html';
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const ready=async()=>{await page.goto(url);await page.waitForFunction(()=>window.maintenanceScene,null,{timeout:20000});};
    const snapshot=()=>page.evaluate(()=>maintenanceScene.snapshot());
    const valid=async()=>{
      const all=await snapshot();
      for(const a of all){assert(a.x-a.radius>=-3.10001&&a.x+a.radius<=3.10001&&a.z-a.radius>=-2.80001&&a.z+a.radius<=3.10001,'Full footprint stays within floor boundaries');for(const b of all)if(a.id<b.id)assert(Math.hypot(a.x-b.x,a.z-b.z)>=a.radius+b.radius+.0449,'Props never intersect');}
    };
    await ready();assert.equal((await snapshot()).length,1);
    await page.screenshot({path:output+'/construction-desktop-final.png'});
    let point=await page.evaluate(()=>maintenanceScene.project(1));
    const before=(await snapshot())[0];
    await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+100,point.y+35,{steps:15});await page.mouse.up();
    const moved=(await snapshot())[0];assert(Math.hypot(moved.x-before.x,moved.z-before.z)>.1,'Raycast mouse dragging changes floor coordinates');await valid();
    await page.locator('#rotate-object').click();assert((await snapshot())[0].angle>moved.angle,'Rotation control works');
    await page.locator('#maintenance-scene').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('r');await valid();
    for(let i=0;i<16;i++){if(await page.locator('#add-objects').isDisabled())break;await page.locator('#add-objects').click();}
    await page.waitForTimeout(650);const populated=await snapshot();assert(populated.length>=20,'Dozens of props can be summoned');assert(populated.length<=40,'Scene has a finite object limit');
    assert(new Set(populated.map(x=>x.type)).size>=5,'Distinct prop types');assert(populated.every(x=>x.height===0),'Objects settle on floor');await valid();
    await page.screenshot({path:output+'/construction-dense.png'});
    const mainBefore=populated[0];await page.locator('#shuffle-objects').click();
    for(let i=0;i<40;i++){await valid();await page.waitForTimeout(35);}
    const shuffled=await snapshot();assert.equal(shuffled[0].x,mainBefore.x);assert.equal(shuffled[0].z,mainBefore.z);
    assert(shuffled.slice(1).some((body,i)=>Math.hypot(body.x-populated[i+1].x,body.z-populated[i+1].z)>.05),'Shuffle rearranges secondary objects');
    await page.locator('#clear-objects').click();const cleared=await snapshot();assert.equal(cleared.length,1);assert.equal(cleared[0].x,0);assert.equal(cleared[0].z,-.15);assert.equal(cleared[0].angle,.25);
    assert(await page.locator('#shuffle-objects').isDisabled());assert(await page.locator('#clear-objects').isDisabled());
    await page.setViewportSize({width:768,height:1024});await page.screenshot({path:output+'/construction-reference-size.png'});
    for(const [width,height]of [[390,844],[320,568],[700,390]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+width);
      for(const el of await page.locator('.scene-controls button,.scene-footer a').all()){const box=await el.boundingBox();assert(box.width>0&&box.height>=44&&box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=height,'Visible reachable controls at '+width);}
      await page.screenshot({path:output+`/construction-${width}x${height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const touchPage=await mobileContext.newPage();await touchPage.goto(url);await touchPage.waitForFunction(()=>window.maintenanceScene);
    const touchPoint=await touchPage.evaluate(()=>maintenanceScene.project(1)),touchBefore=await touchPage.evaluate(()=>maintenanceScene.snapshot()[0]);
    const cdp=await mobileContext.newCDPSession(touchPage);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchPoint.x,y:touchPoint.y}]});
    for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchPoint.x+i*5,y:touchPoint.y+i*3}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const touchAfter=await touchPage.evaluate(()=>maintenanceScene.snapshot()[0]);assert(Math.hypot(touchAfter.x-touchBefore.x,touchAfter.z-touchBefore.z)>.1,'Native touch dragging moves the sign');
    await touchPage.getByRole('button',{name:'Move closer',exact:true}).click();await touchPage.screenshot({path:output+'/construction-touch-selected.png'});await mobileContext.close();
    await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#add-objects').click();assert((await snapshot()).every(x=>x.height===0),'Reduced motion skips the drop');await page.locator('#shuffle-objects').click();await valid();await page.locator('#clear-objects').click();
    await page.emulateMedia({forcedColors:'active'});await page.locator('#maintenance-scene').focus();await page.screenshot({path:output+'/construction-forced-colors.png'});
    await page.emulateMedia({forcedColors:'none'});await page.goto(origin+'/missing/deep/404-scene');await page.waitForFunction(()=>window.maintenanceScene);assert.equal(await page.title(),'404 — Site under construction · Smart Chen');await page.locator('.scene-footer a').click();await page.waitForURL(origin+'/');
    const fallbackContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),fallbackPage=await fallbackContext.newPage();await fallbackPage.goto(url);assert(await fallbackPage.locator('noscript a').isVisible());await fallbackContext.close();
    const failureContext=await browser.newContext(),failurePage=await failureContext.newPage();await failurePage.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl2'||type==='webgl')return null;return native.call(this,type,...args);};});await failurePage.goto(url);await failurePage.waitForSelector('#scene-fallback:not([hidden])');assert(await failurePage.locator('#scene-fallback a').isVisible());await failureContext.close();
    assert.deepEqual(errors.filter(e=>!e.includes('status of 404')),[]);
    console.log(JSON.stringify({passed:true,props:populated.length,types:[...new Set(populated.map(x=>x.type))],checks:'mouse/touch/keyboard dragging, rotation, dense collision-free spawn, animated shuffle collision sampling, clear/reset, 4 responsive layouts, reduced motion, forced colors, nested fallback path, Home, no-JS and unavailable-WebGL fallbacks',consoleErrors:errors.filter(e=>!e.includes('status of 404'))}));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
