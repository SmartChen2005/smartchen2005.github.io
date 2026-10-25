import { createMotorWorld, raceShot } from './home-motor-race.mjs?rev=20261024-pop-city';
export const MOTOR_DURATION=16;
const clamp=x=>Math.max(0,Math.min(1,x));
export function motorsportFrame(seconds){
  const t=Math.min(MOTOR_DURATION,Math.max(0,seconds)),shot=raceShot(t);
  return {t,shot:shot.id,phase:t===MOTOR_DURATION?'idle':t<.5?'opening':'city',idle:t===MOTOR_DURATION,
    gap:1.55*Math.cos((t-1.1)*Math.PI/2.45),leader:Math.cos((t-1.1)*Math.PI/2.45)>=0?'mini':'z4'};
}
export function createMotorsport(canvas,{dismiss=()=>{},worldFactory=createMotorWorld}={}){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),forced=matchMedia('(forced-colors: active)');
  const styles=getComputedStyle(document.documentElement),colors={};
  for(const key of ['cyan','pink','yellow','blue','coral','lime','cream','ink','purple'])colors[key]=styles.getPropertyValue(`--motor-pop-${key}`)?.trim();
  const world=worldFactory(canvas,colors),homepage=document.querySelector?.('.homepage');
  const dialog=document.querySelector?.('.motor-dialog'),close=document.querySelector?.('.motor-close'),trigger=document.querySelector?.('.identity-cars');
  let active=false,raf=0,last=0,time=0,width=0,height=0,exitTimer=0,input=.5,immersive=false,previousInert=false;
  function setImmersive(next){
    if(next===immersive)return;immersive=next;
    if(next){
      previousInert=homepage?.inert||false;if(homepage)homepage.inert=true;
      document.body.dataset.motorImmersive='true';if(dialog)dialog.hidden=false;
      // Let the opening Enter/Space finish before focusing its dismissal button.
      // Otherwise the same key release can activate the newly focused Close.
      if(document.activeElement===trigger)setTimeout(()=>{if(immersive)close?.focus({preventScroll:true});},100);
    }else{
      if(homepage)homepage.inert=previousInert;delete document.body.dataset.motorImmersive;
      if(dialog)dialog.hidden=true;if(document.activeElement===close)trigger?.focus({preventScroll:true});
    }
  }
  function unavailable(){
    cancelAnimationFrame(raf);raf=0;setImmersive(false);document.body.dataset.motorFallback='true';canvas.classList.remove('is-active');
  }
  function paint(){
    if(!width||!height)return;
    if(!world.available){unavailable();return;}
    if(!world.ready)return;
    if(reduced.matches)time=MOTOR_DURATION;
    const frame=motorsportFrame(time);canvas.dataset.phase=frame.phase;canvas.dataset.shot=frame.shot;canvas.dataset.leader=frame.leader;
    world.paint(frame,reduced.matches?.5:input);setImmersive(active&&!forced.matches);return frame;
  }
  function tick(now){
    raf=0;if(!active||document.hidden||reduced.matches||forced.matches)return;
    if(world.ready)time+=Math.max(0,(now-last)/1000);last=now;
    const frame=paint();if(world.available&&(!frame||!frame.idle))raf=requestAnimationFrame(tick);
  }
  function resume(){
    cancelAnimationFrame(raf);raf=0;if(!active)return;
    if(forced.matches){setImmersive(false);return;}
    const frame=paint();
    if(world.available&&!document.hidden&&!reduced.matches&&!frame?.idle){last=performance.now();raf=requestAnimationFrame(tick);}
  }
  world.whenReady?.then(resume);world.onUnavailable=unavailable;
  close?.addEventListener('click',()=>{dismiss();trigger?.focus({preventScroll:true});});
  dialog?.addEventListener('keydown',event=>{if(event.key==='Tab'){event.preventDefault();close?.focus({preventScroll:true});}});
  reduced.addEventListener('change',resume);forced.addEventListener('change',resume);document.addEventListener('visibilitychange',resume);
  return {
    resize(w,h){width=w;height=h;world.resize(w,h);if(active)paint();},
    point(value){input=clamp(value);},
    setActive(next,smoothExit=false){
      clearTimeout(exitTimer);delete document.body.dataset.carExit;
      if(next===active){if(!next)canvas.classList.remove('is-exiting');return;}
      active=next;
      if(next){
        time=0;delete document.body.dataset.motorFallback;canvas.classList.remove('is-exiting');canvas.classList.add('is-active');resume();
      }else{
        cancelAnimationFrame(raf);raf=0;setImmersive(false);delete document.body.dataset.motorFallback;
        if(smoothExit&&!reduced.matches&&!forced.matches){
          document.body.dataset.carExit='true';canvas.classList.add('is-exiting');
          exitTimer=setTimeout(()=>{canvas.classList.remove('is-exiting');delete document.body.dataset.carExit;},380);
        }else canvas.classList.remove('is-exiting');
        canvas.classList.remove('is-active');
      }
    },
  };
}
