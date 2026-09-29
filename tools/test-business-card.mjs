import assert from 'node:assert/strict';
import { businessCardLayout, createBusinessCard } from '../dist/home-business-card.mjs';

for (const [width,height] of [[1920,1080],[1280,720],[844,390],[535,673],[390,844],[320,568]]) {
  const photoWidth = width < 500 ? 205 : Math.max(180,Math.min(320,width*.22));
  const photo = {left:width*.1, right:width*.1+photoWidth, width:photoWidth,height:photoWidth*2/3,bottom:height*.43};
  photo.top = photo.bottom-photo.height;
  const sentence = {top:height*.48,bottom:height*.55};
  const layout = businessCardLayout(photo,sentence,{width,height});
  assert(layout.left >= 0 && layout.left+layout.width <= width-15);
  assert(layout.top >= 0);
  assert(layout.top+layout.height <= sentence.top-15 || layout.top >= sentence.bottom+23);
  if(layout.layout==='beside') assert.equal(layout.left,photo.right-photo.width*(14/282),'Card must emerge from behind the right edge');
  if(width>height) assert(Math.abs(layout.width/photo.width-1.05)<1e-9,'Landscape card ratio must remain constant');
  else assert.equal(layout.layout,'below','Vertical layout must retain the separate readable card');
}
for(const photoWidth of [170,180,220,282,320]) {
  const portrait={left:60,right:60+photoWidth,top:40,bottom:40+photoWidth*2/3,width:photoWidth,height:photoWidth*2/3};
  const layout=businessCardLayout(portrait,{top:360,bottom:410},{width:1000,height:600});
  assert.equal(layout.layout,'beside');
  assert(Math.abs(layout.width/portrait.width-1.05)<1e-9);
  assert(Math.abs(layout.height/portrait.height-1.05*1.5/1.64)<1e-9);
}

function harness({reduced=false,forced=false}={}) {
  let id=0, now=0, focus=0, animations=0;
  const frames=new Map(), events={}, mediaEvents=[];
  const style=()=>({values:{},setProperty(key,value){this.values[key]=value;},getPropertyValue(key){return this.values[key]||'';}});
  const card={style:style()}, email={focus:()=>focus++}, placeholder={addEventListener:(name,fn)=>{events.resume=fn;}};
  let entry=null;
  const slide={style:{},animate:()=>{animations++;entry={cancel(){this.cancelled=true;},finish(){this.onfinish?.();}};return entry;}};
  const dock={hidden:true,inert:true,style:style(),dataset:{},
    querySelector:selector=>({'.metal-card':card,'.card-email':email,'.business-card-slide':slide,'[data-resume-placeholder]':placeholder})[selector],
    getBoundingClientRect:()=>({left:400,top:100,width:300,height:183})};
  const portrait={isConnected:true,style:style(),getBoundingClientRect:()=>({height:188,bottom:292,toJSON:()=>({left:130,right:412,top:104,bottom:292,width:282,height:188})})};
  portrait.style.setProperty('--portrait-height','188px');
  const trigger={attrs:{},setAttribute(key,value){this.attrs[key]=value;}};
  const media={matches:reduced,addEventListener:(_,fn)=>mediaEvents.push(fn)};
  globalThis.matchMedia=q=>q.includes('forced')?{matches:forced}:media;
  globalThis.document={hidden:false,addEventListener:(name,fn)=>{events[name]=fn;}};
  globalThis.innerWidth=1280;globalThis.innerHeight=720;globalThis.scrollX=0;globalThis.scrollY=0;
  globalThis.performance={now:()=>now};
  globalThis.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
  globalThis.cancelAnimationFrame=key=>frames.delete(key);
  const instance=createBusinessCard(dock,portrait,{getBoundingClientRect:()=>({top:330,bottom:390})},trigger);
  return {instance,dock,card,trigger,events,media,mediaEvents,
    finish:()=>entry?.finish(), values:()=>({focus,animations}),frames,
    step(){now+=16;const work=[...frames.values()];frames.clear();work.forEach(fn=>fn(now));assert(frames.size<=1);}};
}
let app=harness();
assert(app.dock.hidden && app.dock.inert);
app.instance.show();assert.equal(app.dock.dataset.state,'entering');assert(app.dock.inert);
app.events.pointermove({clientX:700,clientY:100,pointerType:'mouse'});assert.equal(app.frames.size,0,'Light must wait for the card to settle');
app.finish();assert(!app.dock.inert);assert.equal(app.values().focus,0,'Pointer click should not steal focus');
app.events.pointermove({clientX:700,clientY:100,pointerType:'mouse'});app.step();
const first=app.card.style.values['--tilt-y'];
for(let i=0;i<100;i++)app.step();
assert.notEqual(app.card.style.values['--tilt-y'],first,'The material should respond with inertia');
assert.equal(app.frames.size,0,'The settled card must not run an idle animation loop');
app.events.pointermove({clientX:850,clientY:350,pointerType:'mouse'});
for(let i=0;i<100;i++)app.step();
assert(Math.abs(parseFloat(app.card.style.values['--tilt-y']))<.003,'Leaving the card must smoothly restore its resting orientation');
assert.equal(app.frames.size,0,'Restoration must stop after convergence');
app.instance.hide();assert(app.dock.hidden && app.dock.inert);assert.equal(app.trigger.attrs['aria-expanded'],'false');
app.instance.show(true);app.finish();assert.equal(app.values().focus,1,'Keyboard opening should reach the contact links');
app.instance.hide();app.instance.show();app.instance.hide();app.finish();assert(app.dock.hidden,'Cancelled entry must not reopen a closed card');
let prevented=false;app.events.resume({preventDefault:()=>{prevented=true;}});assert(prevented);
for(const options of [{reduced:true},{forced:true}]){
  app=harness(options);app.instance.show(true);assert.equal(app.values().animations,0);assert.equal(app.dock.dataset.state,'settled');
  app.events.pointermove({clientX:700,clientY:100,pointerType:'mouse'});assert.equal(app.frames.size,0);
}
console.log('Passed: right-edge anchoring, narrow/short-screen containment and sentence clearance; entry/settle/close/reopen; inert links during entry; keyboard focus; delayed light response and idle RAF cleanup; placeholder handling; reduced motion and forced colors.');
