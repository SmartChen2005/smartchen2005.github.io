import {MusicEngine, MODES, LAYERS, clamp} from './music-engine.mjs';

const engine = new MusicEngine();
const scene = document.querySelector('.scene');
const model = document.querySelector('.device-model');
const story = document.querySelector('.instrument-story');
const chapters = [...document.querySelectorAll('[data-scene]')];
const leds = [...document.querySelectorAll('[data-led]')];
const pixels = [...document.querySelectorAll('[data-pixel]')];
const zoneStrip = document.querySelector('.zone-strip');
const sequencer = document.querySelector('.scene-sequencer');
const range = document.querySelector('#distance-input');
const status = document.querySelector('#record-status');
const record = document.querySelector('#record-button');
const soundButton = document.querySelector('#sound-toggle');
const motionButton = document.querySelector('#motion-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = false, visible = true, sound = false, audioContext, master;
let targetDistance=72, lastFrame=0, lastTick=0, frame=0, activeChapter='hero';
let tiltX=0, tiltY=0, pointerTiltX=0, pointerTiltY=0;
let manualInput=false, cachedRect, lastReadout=0;

for(let i=0;i<8;i++) {
  const button=document.createElement('button');
  button.type='button'; button.textContent=String(i+1).padStart(2,'0');
  button.setAttribute('aria-label',`Activate spatial zone ${i+1}`);
  button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>setDistance(15+(i+.5)*145/8));
  zoneStrip.append(button);
}
for(let layer=0;layer<3;layer++) {
  const row=document.createElement('div');
  row.className='sequencer-row'; row.dataset.layer=layer; row.setAttribute('role','group');
  const name=document.createElement('span'); name.textContent=LAYERS[layer].toUpperCase(); row.append(name);
  for(let i=0;i<8;i++){const step=document.createElement('span');step.className='step';step.dataset.step=i;step.setAttribute('aria-hidden','true');row.append(step);}
  const state=document.createElement('span');state.className='layer-state';state.textContent='PLAY';row.append(state);
  sequencer.append(row);
}
const rows=[...sequencer.children];
const zones=[...zoneStrip.children];
function setDistance(value) {
  manualInput=true;targetDistance=Number(value);engine.sense(targetDistance,.016,true);
  updateReadout();renderSequencer();paintDevice();
}
function updateReadout() {
  document.querySelector('#distance-output').textContent=`${Math.round(engine.distance)} cm`;
  document.querySelector('#speed-output').textContent=engine.speed>.5?'Fast':engine.speed>.1?'Moving':'Still';
  document.querySelector('#zone-output').textContent=`${String(engine.zone+1).padStart(2,'0')} / 08`;
  if(document.activeElement!==range) range.value=Math.round(engine.distance);
  range.setAttribute('aria-valuetext',`${range.value} centimeters`);
  zones.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===engine.zone)));
  scene.style.setProperty('--sensor-scale',String(.8+engine.distance/160*.4));
}
function renderSequencer() {
  rows.forEach((row,layer)=>{
    const recording=engine.recording?.layer===layer;
    row.classList.toggle('is-recording',recording);
    row.querySelector('.layer-state').textContent=recording?'REC':'PLAY';
    row.setAttribute('aria-label',`${LAYERS[layer]}: ${recording?'recording':'playing'}`);
    row.querySelectorAll('.step').forEach((step,i)=>{
      const value=engine.loops[layer][i];
      step.classList.toggle('has-note',layer===0?value>0:value!==null);
      step.classList.toggle('is-playing',i===engine.step && (!reduced.matches||engine.recording));
    });
  });
}
function paintDevice() {
  leds.forEach((led,i)=>{
    const active=Math.floor(i/4)===(engine.step<0?engine.zone:engine.step);
    led.style.setProperty('--led-power',String(reduced.matches ? .85 : active ? 1 : .62+engine.speed*.22));
  });
  pixels.forEach((pixel,i)=>{
    const col=i%8, row=Math.floor(i/8);
    const lit = col===engine.zone || (row===7 && col<=(engine.step<0?0:engine.step));
    pixel.setAttribute('fill',lit?'#f4f4ee':'#535846');
  });
}
function updateRecordControls() {
  record.disabled=!!engine.recording;
  record.firstChild.textContent=engine.recording?'Recording one cycle ':`Replace ${LAYERS[engine.selected].toLowerCase()} loop `;
  document.querySelectorAll('[data-layer], [data-mode]').forEach(button=>{
    if(button.tagName==='BUTTON') button.disabled=!!engine.recording;
  });
}
range.addEventListener('input',event=>setDistance(event.target.value));
document.querySelectorAll('button[data-layer]').forEach(button=>button.addEventListener('click',()=>{
  engine.selected=Number(button.dataset.layer);
  document.querySelectorAll('button[data-layer]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  updateRecordControls();
}));
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  if(!engine.setMode(button.dataset.mode))return;
  document.querySelectorAll('[data-mode]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  const preset=engine.preset;
  document.querySelector('#mode-status').textContent=`${engine.mode[0].toUpperCase()+engine.mode.slice(1)} / ${preset.bpm} BPM / ${preset.description}`;
  scene.dataset.mode=engine.mode;lastTick=performance.now();renderSequencer();paintDevice();
}));
record.addEventListener('click',()=>{
  if(!engine.replace())return;
  if(paused){paused=false;updatePause();}
  status.textContent=`REC / ${LAYERS[engine.selected]} / 0 of 8 steps. Move or adjust the distance.`;
  updateRecordControls();renderSequencer();lastTick=performance.now();start();
});

function tone(frequency, time, duration, gain, type='sine') {
  if(!audioContext||!sound||audioContext.state!=='running')return;
  const oscillator=audioContext.createOscillator(), envelope=audioContext.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,time);
  envelope.gain.setValueAtTime(0,time);envelope.gain.linearRampToValueAtTime(gain,time+.005);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
  oscillator.connect(envelope);envelope.connect(master);
  oscillator.start(time);oscillator.stop(time+duration+.01);
}
function playAudio(notes) {
  if(!sound||!audioContext)return;
  const time=audioContext.currentTime, slice=60/engine.preset.bpm/2/3;
  if(notes[0])tone(notes[0]===1?80:notes[0]===2?190:1600,time,Math.min(slice,.06),.16,notes[0]===3?'triangle':'sine');
  if(notes[1]!==null)tone(65.406*Math.pow(2,engine.preset.scale[notes[1]]/12),time+slice,slice*.88,.16,'triangle');
  if(notes[2]!==null)tone(261.626*Math.pow(2,engine.preset.scale[notes[2]]/12),time+slice*2,slice*.88,.12);
}
function setSoundUI() {
  soundButton.innerHTML=sound?'Mute sound <span aria-hidden="true">−</span>':'Enable sound <span aria-hidden="true">＋</span>';
  soundButton.setAttribute('aria-pressed',String(sound));
}
async function mute() {
  sound=false;setSoundUI();
  if(audioContext?.state==='running') await audioContext.suspend().catch(()=>{});
}
soundButton.addEventListener('click',async()=>{
  soundButton.disabled=true;
  try {
    if(sound) await mute();
    else {
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)throw new Error('unavailable');
      if(!audioContext){audioContext=new Context();master=audioContext.createGain();master.gain.value=.45;master.connect(audioContext.destination);}
      await audioContext.resume();sound=true;setSoundUI();
      document.querySelector('#audio-status').textContent='Sound enabled. This browser demonstration uses simple synthesized tones.';
      if(paused){paused=false;updatePause();}start();
    }
  }catch {
    document.querySelector('#audio-status').textContent='Sound is unavailable in this browser. The visual instrument still works.';
    soundButton.textContent='Sound unavailable';
  }finally{soundButton.disabled=false;}
});
function updatePause() {
  document.body.classList.toggle('motion-paused',paused);
  motionButton.innerHTML=paused?'Resume motion <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
  motionButton.setAttribute('aria-pressed',String(paused));
  lastFrame=0;lastTick=performance.now();
}
motionButton.addEventListener('click',()=>{paused=!paused;updatePause();if(!paused)start();});

const captions={hero:'Handmade instrument / digital reconstruction',world:'Ultrasonic sensing / movement as input',zones:'Distance → data / eight spatial zones',layers:'Three layers / eight steps each',replace:'One layer records / the others keep playing',modes:'Musical rules / three modes',anatomy:'Prototype anatomy / exposed by design',logic:'Constrained scales / rule-based mapping',boards:'Control ↔ display / serial communication'};
let scrollQueued=false;
function syncScroll() {
  scrollQueued=false;
  const threshold=innerHeight*.42;
  const chapter=chapters.find(section=>{const r=section.getBoundingClientRect();return r.top<=threshold&&r.bottom>threshold;})||chapters[0];
  if(activeChapter!==chapter.dataset.scene) {
    activeChapter=chapter.dataset.scene;scene.dataset.chapter=activeChapter;
    document.querySelector('#scene-caption').textContent=captions[activeChapter];
    if(matchMedia('(pointer: coarse)').matches&&!manualInput){targetDistance=15+(chapters.indexOf(chapter)%8+.5)*145/8;engine.sense(targetDistance,.016,true);updateReadout();paintDevice();}
    cachedRect=null;
  }
  const bounds=story.getBoundingClientRect();visible=bounds.bottom>innerHeight*.25&&bounds.top<innerHeight&&!document.hidden;
  if(visible)start();
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(syncScroll);}},{passive:true});
window.addEventListener('resize',()=>{cachedRect=null;syncScroll();});
window.addEventListener('pointermove',event=>{
  if(!visible||paused||event.pointerType==='touch'||event.target.closest('button,input,a,.process-track'))return;
  cachedRect=model.getBoundingClientRect();
  const centerX=cachedRect.left+cachedRect.width*.51,centerY=cachedRect.top+cachedRect.height*.51;
  const dx=event.clientX-centerX,dy=event.clientY-centerY;
  const radius=Math.max(innerWidth*.5,350);
  targetDistance=15+clamp(Math.hypot(dx,dy)/radius,0,1)*145;
  pointerTiltX=clamp(dx/radius,-1,1)*3;pointerTiltY=clamp(-dy/innerHeight,-1,1)*2.5;
  manualInput=false;
  if(reduced.matches){engine.sense(targetDistance,.016,true);updateReadout();paintDevice();}
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointerTiltX=0;pointerTiltY=0;});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){visible=false;cancelAnimationFrame(frame);frame=0;lastFrame=0;void mute();}
  else{syncScroll();}
});
window.addEventListener('blur',()=>{pointerTiltX=0;pointerTiltY=0;void mute();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;void mute();});
window.addEventListener('pageshow',()=>syncScroll());
reduced.addEventListener('change',()=>{lastFrame=0;paintDevice();renderSequencer();start();});

function start(){if(!frame&&visible&&!paused&&!document.hidden&&(!reduced.matches||engine.recording||sound))frame=requestAnimationFrame(animate);}
function animate(time) {
  frame=0;
  if(!visible||paused||document.hidden)return;
  const elapsed=lastFrame?Math.min((time-lastFrame)/1000,.1):.016;lastFrame=time;
  engine.sense(targetDistance,elapsed);
  if(!reduced.matches){
    tiltX+=(pointerTiltX-tiltX)*.08;tiltY+=(pointerTiltY-tiltY)*.08;
    model.style.setProperty('--tilt-x',`${tiltX.toFixed(2)}deg`);model.style.setProperty('--tilt-y',`${tiltY.toFixed(2)}deg`);
  }
  if(time-lastReadout>100){updateReadout();lastReadout=time;}
  // Ambient, Trap and Techno vary the step interval, not merely their color.
  if(time-lastTick>=60000/engine.preset.bpm/2) {
    lastTick=time;
    const tick=engine.tick();renderSequencer();paintDevice();playAudio(tick.notes);
    document.querySelectorAll('.logic-chain li').forEach((item,i)=>item.classList.toggle('is-signal-active',activeChapter==='logic'&&!reduced.matches&&i===tick.step%7));
    if(engine.recording)status.textContent=`REC / ${LAYERS[engine.recording.layer]} / ${engine.recording.count} of 8 steps`;
    if(tick.completed!==null){status.textContent=`PLAY / ${LAYERS[tick.completed]} replaced. The other two loops stayed intact.`;updateRecordControls();}
  }
  start();
}

const track=document.querySelector('.process-track');
document.querySelector('#process-prev').addEventListener('click',()=>track.scrollBy({left:-track.clientWidth*.75,behavior:reduced.matches?'instant':'smooth'}));
document.querySelector('#process-next').addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.75,behavior:reduced.matches?'instant':'smooth'}));
track.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();track.scrollBy({left:(event.key==='ArrowLeft'?-1:1)*300,behavior:reduced.matches?'instant':'smooth'});}});
let drag=null;
track.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return;
  drag={x:event.clientX,left:track.scrollLeft};track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');
});
track.addEventListener('pointermove',event=>{if(drag)track.scrollLeft=drag.left+drag.x-event.clientX;});
const endDrag=()=>{drag=null;track.classList.remove('is-dragging');};
track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);track.addEventListener('lostpointercapture',endDrag);

document.querySelector('#video-play').addEventListener('click',()=>{
  void mute();
  const iframe=document.createElement('iframe');
  iframe.title='World Sensing Music Station — real prototype demonstration';
  iframe.src='https://www.youtube-nocookie.com/embed/EojQMf95e6k?autoplay=1&rel=0&playsinline=1';
  iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;
  iframe.referrerPolicy='strict-origin-when-cross-origin';
  document.querySelector('#video-player').append(iframe);
  document.querySelector('#video-poster').hidden=true;
  iframe.focus();
});
updateReadout();renderSequencer();paintDevice();syncScroll();start();
