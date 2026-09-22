import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildSX70,projectPoint} from './camera-model.mjs';

for(const open of [0,.25,.5,.75,1]) {
  const faces=buildSX70(open);
  assert(faces.length>400);
  for(const face of faces)for(const point of face.points){
    assert(point.every(Number.isFinite));
    assert(projectPoint(point,-.55,.43,34,200,200).every(Number.isFinite));
  }
}
const foldedHeight=Math.max(...buildSX70(0).flatMap(f=>f.points.map(p=>p[1])));
const openHeight=Math.max(...buildSX70(1).flatMap(f=>f.points.map(p=>p[1])));
assert(openHeight>foldedHeight*2);

// Deterministic DOM/event harness exercises the actual production controller.
const listeners=new Map(), nodes=new Map(), frames=[];
let now=0, photoCount=0, failCapture=false, reduce=false;
const context2d=new Proxy({drawImage(){photoCount++;},createLinearGradient(){return {addColorStop(){}};}},{get:(o,k)=>o[k]??(()=>{})});
class Element {
  constructor(){this.dataset={};this.style={};this.children=[];this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
  setAttribute(){} matches(){return false;} getContext(){return context2d;}
  querySelector(s){if(!nodes.has(s))nodes.set(s,new Element());return nodes.get(s);}
  append(n){this.children.push(n);} prepend(n){this.children.unshift(n);}
  getBoundingClientRect(){return {x:250,y:50,width:500,height:500};}
  animate(){return {finished:Promise.resolve(),cancel(){}};} getAnimations(){return [];}
}
const body=new Element(),root=new Element();
const on=(name,fn)=>{if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);};
const sandbox={console,document:{body,documentElement:root,createElement:()=>new Element(),querySelector:()=>null,addEventListener:on},
  matchMedia:q=>({get matches(){return q.includes('reduced')?reduce:q.includes('fine');},addEventListener(){}}),
  innerWidth:1280,innerHeight:720,devicePixelRatio:1,scrollX:0,scrollY:0,
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},addEventListener:on,
  performance:{now:()=>now},setTimeout:()=>0,MutationObserver:class{},drawSX70(){},projectPoint,
  window:{html2canvas:()=>failCapture?Promise.reject(new Error('Expected capture failure')):Promise.resolve({width:1280})}};
vm.createContext(sandbox);
const code=fs.readFileSync(new URL('./camera.mjs',import.meta.url),'utf8').replace(/^import .*\n/,'').replace(/export /g,'');
vm.runInContext(code,sandbox);
const state=()=>body.children[0].dataset.state;
function dispatch(type,details={}){
  const event={button:0,buttons:0,detail:1,pointerType:'mouse',clientX:300,clientY:250,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...details};
  for(const fn of listeners.get(type)||[])fn(event);
  return event;
}
function advance(ms=500){for(let i=0;i<ms/16;i++){now+=16;const queued=frames.splice(0);queued.forEach(fn=>fn(now));}}
dispatch('pointermove');advance();assert.equal(state(),'folded');
const ordinary=dispatch('click');advance();assert.equal(state(),'open');assert(!ordinary.prevented);
dispatch('click',{detail:0});assert.equal(state(),'open');
dispatch('mousedown',{button:2,buttons:2});advance();assert.equal(state(),'viewfinder');
dispatch('mouseup',{button:2});advance();assert.equal(state(),'open');
dispatch('mousedown',{button:2,buttons:2});advance(80);dispatch('mouseup',{button:2});advance();assert.equal(state(),'open');
dispatch('mousedown',{button:2,buttons:2});advance();
const shutter=dispatch('mousedown',{button:0,buttons:3});assert(shutter.prevented&&shutter.stopped);
assert.equal(state(),'capturing');
assert(dispatch('click').prevented); // No image dialog / TOC click-through after shutter.
await new Promise(resolve=>setImmediate(resolve));advance(2600);
assert.equal(state(),'open');assert.equal(photoCount,1);
dispatch('mousedown',{button:2,buttons:2});advance();dispatch('blur');advance();assert.equal(state(),'open');
failCapture=true;dispatch('pointermove');dispatch('mousedown',{button:2,buttons:2});advance();dispatch('mousedown',{button:0,buttons:3});dispatch('click');
await new Promise(resolve=>setImmediate(resolve));advance();assert.equal(state(),'open');assert.equal(photoCount,1);
reduce=true;failCapture=false;dispatch('mousedown',{button:2,buttons:2});advance();assert.equal(state(),'viewfinder');
dispatch('mousedown',{button:0,buttons:3});dispatch('click');await new Promise(resolve=>setImmediate(resolve));assert.equal(state(),'open');
console.log('PASS: 3D geometry, open/fold, native clicks, keyboard clicks, hold/release, early release, multi-button shutter, click-through guard, ejection, blur recovery, capture failure, reduced motion.');
