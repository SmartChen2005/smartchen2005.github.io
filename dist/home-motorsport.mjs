import { createMotorWorld, raceShot } from './home-motor-race.mjs?rev=20261025-loop';
export const MOTOR_DURATION=20.5;
export const MOTOR_CLICK_LEAD=1;
export function openingFrame(time,idle=false){return {t:0,shot:'starlit-lead',phase:'preview',idle,openingTime:time};}
const clamp=x=>Math.max(0,Math.min(1,x));
export function motorsportFrame(seconds){
 const t=Math.min(MOTOR_DURATION,Math.max(0,seconds)),shot=raceShot(t);
 return {t,shot:shot.id,phase:t===MOTOR_DURATION?'idle':t<.5?'opening':'city',idle:t===MOTOR_DURATION};
}
export function createMotorsport(canvas,{foreground=null,worldFactory=createMotorWorld,onPlayback=()=>{}}={}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),forced=matchMedia('(forced-colors: active)');
 const world=worldFactory(canvas,{foreground}),layers=[canvas,foreground].filter(Boolean);
 let active=false,playing=false,raf=0,last=0,time=0,previewTime=0,openingAtClick=0,width=0,height=0,exitTimer=0,input=.5,lastPalette=null;
 const notify=(next,reason)=>{if(playing===next)return;playing=next;onPlayback(next,reason);};
 function unavailable(){cancelAnimationFrame(raf);raf=0;notify(false,'unavailable');document.body.dataset.motorFallback='true';layers.forEach(c=>c.classList.remove('is-active'));}
 function paint(){
  if(!width||!height)return;if(!world.available){unavailable();return;}if(!world.ready)return;
  if(reduced.matches&&playing)time=MOTOR_DURATION;time=Math.min(time,MOTOR_DURATION);
  const frame=playing?motorsportFrame(time):openingFrame(previewTime,reduced.matches);if(playing&&time<MOTOR_CLICK_LEAD)frame.openingTime=openingAtClick+time;
  canvas.dataset.phase=frame.phase;canvas.dataset.shot=frame.shot;canvas.dataset.playback=playing?'film':'preview';canvas.dataset.time=(playing?time:previewTime).toFixed(3);world.paint(frame,reduced.matches?.5:input);
  const palette=world.model?.palette;if(palette&&palette!==lastPalette){for(const key of ['ink','accent','paper'])document.body.style.setProperty(`--motor-${key}`,palette[key]);lastPalette=palette;}return frame;
 }
 function finish(){previewTime=openingAtClick+MOTOR_CLICK_LEAD;notify(false,'complete');if(active)resume();}
 function tick(now){
  raf=0;if(!active||document.hidden||reduced.matches||forced.matches)return;
  if(world.ready){const dt=Math.max(0,(now-last)/1000);if(playing)time+=dt;else previewTime+=dt;}last=now;const frame=paint();
  if(playing&&frame?.idle){finish();return;}if(world.available&&(!frame||!frame.idle))raf=requestAnimationFrame(tick);
 }
 function resume(){
  cancelAnimationFrame(raf);raf=0;if(!active)return;
  if(forced.matches){notify(false,'preference');return;}
  const frame=paint();if(playing&&frame?.idle){finish();return;}
  if(world.available&&!document.hidden&&!reduced.matches&&!frame?.idle){last=performance.now();raf=requestAnimationFrame(tick);}
 }
 world.whenReady?.then(resume);world.onUnavailable=unavailable;
 reduced.addEventListener('change',resume);forced.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);
 return {
  resize(w,h,band){width=w;height=h;world.resize(w,h,band);if(active)paint();},point(value){input=clamp(value);},
  play(){if(!active||!world.available||forced.matches)return;time=0;openingAtClick=previewTime;notify(true,'start');resume();},
  stop(){cancelAnimationFrame(raf);raf=0;const wasPlaying=playing;notify(false,'cancel');if(active){if(wasPlaying)previewTime=openingAtClick+Math.min(time,MOTOR_CLICK_LEAD);paint();}},
  setActive(next,smoothExit=false){
   clearTimeout(exitTimer);delete document.body.dataset.carExit;
   if(next===active){if(!next)layers.forEach(c=>c.classList.remove('is-exiting'));return;}active=next;
   if(next){time=0;previewTime=0;delete document.body.dataset.motorFallback;layers.forEach(c=>{c.classList.remove('is-exiting');c.classList.add('is-active');});resume();}
   else{cancelAnimationFrame(raf);raf=0;notify(false,'cancel');delete document.body.dataset.motorFallback;
    if(smoothExit&&!reduced.matches&&!forced.matches){document.body.dataset.carExit='true';layers.forEach(c=>c.classList.add('is-exiting'));exitTimer=setTimeout(()=>{layers.forEach(c=>c.classList.remove('is-exiting'));delete document.body.dataset.carExit;},380);}
    else layers.forEach(c=>c.classList.remove('is-exiting'));layers.forEach(c=>c.classList.remove('is-active'));
   }
  },
 };
}
