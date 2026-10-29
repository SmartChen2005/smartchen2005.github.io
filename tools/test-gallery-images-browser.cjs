const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../dist');
const output = process.env.GALLERY_IMAGE_QA_DIR || path.join(require('node:os').tmpdir(), 'smartchen-gallery-images');
const baseline = process.argv.includes('--baseline');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html':'text/html', '.mjs':'text/javascript', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml' };
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(file !== root && !file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if(fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if(!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control','no-store'); res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  if(process.argv.includes('--stills-regression')){
    const child=require('node:child_process').spawn(process.execPath,['tools/test-stills-browser.cjs'],{env:{...process.env,STILLS_PREVIEW_URL:origin},stdio:'inherit'});
    process.exitCode=await new Promise(done=>child.once('exit',done));
    await new Promise(done=>server.close(done));return;
  }
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--no-proxy-server']});
  const results=[], errors=[];
  try {
    for(const [device,width,height,dpr] of [['desktop',1440,1000,2],['phone',390,844,3]]) {
      for(const route of ['/gallery/','/gallery/deliberate-practice/','/gallery/rhythms-of-chaos/','/gallery/intro-to-darkroom/','/projects/polaroid-of-yesterday/photography/?view=gallery']) {
        const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:device==='phone',hasTouch:device==='phone'});
        await context.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
        const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
        await page.goto(origin+route,{waitUntil:'networkidle'}); await page.evaluate(()=>document.fonts.ready);
        const images=page.locator('.media img, .print-paper img');
        if(route.includes('/photography/')) await images.evaluateAll(items=>items.forEach(i=>{i.loading='eager';}));
        for(let index=0;index<await images.count();index++) {
          const image=images.nth(index); if(!await image.isVisible()) continue;
          if(!route.includes('/photography/')) await image.scrollIntoViewIfNeeded();
          await image.evaluate(i=>Promise.race([i.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Image decode timed out: '+i.src)),10000))]));
        }
        const state=await page.evaluate(()=>({
          images:[...document.querySelectorAll('.media img,.print-paper img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,ratio:i.getAttribute('width')/i.getAttribute('height'),renderedRatio:i.clientWidth/i.clientHeight})),
          bytes:performance.getEntriesByType('resource').filter(r=>/\.(webp|jpe?g|png)(?:\?|$)/.test(r.name)).reduce((sum,r)=>sum+r.encodedBodySize,0),
          overflow:document.documentElement.scrollWidth>innerWidth
        }));
        assert(!state.overflow, route+' horizontal overflow');
        if(!baseline) assert(state.images.every(i=>i.src.includes('/gallery/assets/optimized/')),route+' must use responsive copies');
        results.push({device,route,imageBytes:state.bytes,images:state.images.length});
        fs.writeFileSync(path.join(output,baseline?'baseline.json':'optimized.json'),JSON.stringify(results,null,2)+'\n');
        console.log(`${device} ${route}: ${state.bytes} image bytes`);
        await page.evaluate(()=>scrollTo(0,0));
        await page.screenshot({path:path.join(output,`${baseline?'before':'after'}-${device}-${route.includes('practice')?'practice':route.includes('rhythms')?'rhythms':route.includes('darkroom')?'darkroom':route.includes('photography/')?'stills':'home'}.png`)});
        if(!baseline && route!=='/gallery/') {
          const stills=route.includes('/photography/');
          const trigger=page.locator(stills?'.print-link':'.story-image-open').first();
          const original=await trigger.getAttribute('href');
          const expected=new URL(await trigger.getAttribute('data-view-src'),page.url()).href;
          await trigger.click();
          const viewer=page.locator(stills?'.photo-viewer':'.gallery-viewer');
          await viewer.waitFor({state:'visible'});
          const full=viewer.locator(stills?'.viewer-image':'img');
          await page.waitForFunction(({selector,expected})=>{const i=document.querySelector(selector);return i?.complete&&i.naturalWidth>0&&i.currentSrc===expected;},{selector:stills?'.viewer-image':'.gallery-viewer img',expected});
          const size=await full.evaluate(i=>[i.naturalWidth,i.naturalHeight]);assert(Math.max(...size)<=3000);
          assert.equal(await viewer.locator(stills?'#viewer-original':'[data-original]').getAttribute('href'),new URL(original,page.url()).href);
          assert(!await page.evaluate(source=>performance.getEntriesByType('resource').some(r=>r.name===source),new URL(original,page.url()).href),'Opening the viewer must not download an uncapped original');
          await page.keyboard.press('Escape');assert(!await viewer.isVisible());
        }
        await context.close();
      }
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,baseline?'baseline.json':'optimized.json'),JSON.stringify(results,null,2)+'\n');
    console.log(JSON.stringify(results));
    console.log(baseline?'Captured before-optimization image transfers.':'Passed: desktop/phone responsive copies, five representative routes, 3000px viewer cap, retained originals, native Escape, no page errors or overflow.');
  } finally {await browser.close();await new Promise(done=>server.close(done));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
