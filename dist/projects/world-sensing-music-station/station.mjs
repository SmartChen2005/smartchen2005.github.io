import {MusicEngine, LAYERS, MIN_CM, MAX_CM, clamp} from './music-engine.mjs';
import {displayText,matrixFrame} from './display-engine.mjs';
const engine=new MusicEngine();
const $=selector=>document.querySelector(selector);
const scene=$('.scene'),model=$('.device-model'),story=$('.instrument-story');
const range=$('#distance-input'),status=$('#record-status');
const soundButton=$('#sound-toggle'),motionButton=$('#motion-toggle');
const leds=[...document.querySelectorAll('[data-led]')],pixels=[...document.querySelectorAll('[data-pixel]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=false,visible=true,sound=false,audioContext,master,frame=0;
let targetDistance=45,lastFrame=0,lastTick=performance.now(),lastReadout=0,activeChapter='hero';
let tiltX=0,tiltY=0,pointerX=0,pointerY=0,manualInput=false;
let matrixMessage='READY',matrixOffset=0,lastMatrix=0;
const matrixQueue=[];
function sendText(message) {
  const text=displayText(message);
  if(reduced.matches){matrixMessage=text;matrixOffset=0;paintMatrix();return;}
  // Bound queued visual messages for repeated browser interactions.
  if(matrixQueue.length>3)matrixQueue.shift();matrixQueue.push(text);
}
function sendState(){sendText(engine.displayState);}

for(let layer=0;layer<3;layer++) {
  const row=document.createElement('button');
  row.type='button';row.className='sequencer-row';row.dataset.layer=layer;
  row.setAttribute('aria-pressed',String(layer===engine.selected));
  const name=document.createElement('span');name.textContent=LAYERS[layer].toUpperCase();row.append(name);
  for(let i=0;i<8;i++){const step=document.createElement('span');step.className='step';step.dataset.step=i;step.setAttribute('aria-hidden','true');row.append(step);}
  const state=document.createElement('span');state.className='layer-state';state.textContent='PLAY';row.append(state);
  row.addEventListener('click',()=>{engine.selected=layer;sendState();renderSequencer();paintDevice();if(engine.recording)updateRecordStatus();});
  $('.sequencer').append(row);
}
const rows=[...$('.sequencer').children];
function renderSequencer() {
  rows.forEach((row,layer)=>{
    const recording=engine.recording&&engine.selected===layer;
    row.classList.toggle('is-recording',recording);row.setAttribute('aria-pressed',String(layer===engine.selected));
    row.setAttribute('aria-label',`Select ${LAYERS[layer]} layer; ${recording?'recording':'playing'}`);
    row.querySelector('.layer-state').textContent=recording?'REC':'PLAY';
    row.querySelectorAll('.step').forEach((step,i)=>{
      const value=engine.loops[layer][i];step.dataset.value=value;
      step.classList.toggle('has-note',layer===0?value>0:value>=0);
      step.classList.toggle('is-playing',i===engine.step&&(!reduced.matches||engine.recording));
    });
  });
}
function updateReadout() {
  $('#distance-output').textContent=`${Math.round(engine.distance)} cm`;
  $('#zone-output').textContent=engine.zone<0?'OUT OF RANGE':`ZONE ${engine.zone+1} / 8`;
  range.value=Math.round(targetDistance);range.setAttribute('aria-valuetext',`${range.value} centimeters`);
  scene.style.setProperty('--sensor-scale',String(.8+engine.distance/MAX_CM*.3));
}
function paintMatrix() {
  const bits=matrixFrame(matrixMessage,matrixOffset);
  pixels.forEach((pixel,i)=>pixel.setAttribute('fill',bits[i]?'#f4f4ee':'#535846'));
}
function paintDevice() {
  const colors=engine.ledColors(reduced.matches&&!engine.recording?-1:engine.step);
  leds.forEach((led,i)=>{
    const color=colors[i];
    led.style.setProperty('--led-color',`rgb(${color.join(',')})`);
    led.style.setProperty('--led-power',color.some(Boolean)?String(Math.max(.35,Math.max(...color)/255)):'0.04');
  });
}
function updateRecordStatus() {status.textContent=`REC / ${LAYERS[engine.selected]} / ${8-engine.remaining} of 8 steps`;}
range.addEventListener('input',event=>{targetDistance=Number(event.target.value);manualInput=true;start();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  engine.setMode(button.dataset.mode);
  document.querySelectorAll('[data-mode]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  $('#bpm-output').textContent=`${engine.preset.bpm} BPM`;sendText(engine.mode.toUpperCase());sendState();
  renderSequencer();paintDevice();
}));
$('#record-button').addEventListener('click',()=>{
  engine.replace();if(paused){paused=false;updatePause();}
  sendText('REPLACE 1LP');sendState();updateRecordStatus();renderSequencer();paintDevice();start();
});
$('#randomize-button').addEventListener('click',()=>{
  engine.randomize();sendText('RND');sendState();renderSequencer();paintDevice();
  status.textContent=`${engine.recording?'REC':'PLAY'} / ${LAYERS[engine.selected]} randomized.`;
});
$('#clear-button').addEventListener('click',()=>{
  engine.clear();sendText('CLEARED');sendState();renderSequencer();paintDevice();
  status.textContent='PLAY / All loops cleared.';
});
$('#inspect-button').addEventListener('click',event=>{
  const inspecting=scene.classList.toggle('is-inspecting');event.currentTarget.setAttribute('aria-pressed',String(inspecting));
});
$('.technical-details').addEventListener('toggle',event=>{
  if(!event.currentTarget.open){scene.classList.remove('is-inspecting');$('#inspect-button').setAttribute('aria-pressed','false');}
  syncScroll();
});

function tone(frequency,time,duration) {
  if(!frequency||!sound||audioContext?.state!=='running')return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
  oscillator.type='square';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.12,time+.003);
  gain.gain.setValueAtTime(.12,time+Math.max(.004,duration-.003));gain.gain.linearRampToValueAtTime(0,time+duration);
  oscillator.connect(gain);gain.connect(master);oscillator.start(time);oscillator.stop(time+duration+.005);
}
function playAudio(tick) {
  if(!sound||!audioContext)return;
  const time=audioContext.currentTime+tick.swingDelay/1000, p=engine.period;
  const kick=Math.floor(p*.20)/1000,bass=Math.floor(p*.35)/1000,melody=Math.floor(p*.35)/1000;
  const frequencies=engine.frequencies(tick.notes);
  tone(frequencies[0],time,kick);tone(frequencies[1],time+kick,bass);tone(frequencies[2],time+kick+bass,melody);
}
function soundUI(){soundButton.textContent=sound?'Mute sound −':'Enable sound ＋';soundButton.setAttribute('aria-pressed',String(sound));}
async function mute(){sound=false;soundUI();if(audioContext?.state==='running')await audioContext.suspend().catch(()=>{});}
soundButton.addEventListener('click',async()=>{
  soundButton.disabled=true;
  try{
    if(sound)await mute();
    else{
      const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('unavailable');
      if(!audioContext){audioContext=new Context();master=audioContext.createGain();master.gain.value=.35;master.connect(audioContext.destination);}
      await audioContext.resume();if(document.hidden)return;
      sound=true;soundUI();$('#audio-status').textContent='Sound enabled. Record a layer or try Randomize.';
      if(paused){paused=false;updatePause();}start();
    }
  }catch{soundButton.textContent='Sound unavailable';$('#audio-status').textContent='Sound is unavailable. The visual instrument still works.';}
  finally{soundButton.disabled=false;}
});
function updatePause(){document.body.classList.toggle('motion-paused',paused);motionButton.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';motionButton.setAttribute('aria-pressed',String(paused));lastFrame=0;lastTick=performance.now();}
motionButton.addEventListener('click',()=>{paused=!paused;updatePause();if(!paused)start();});

let scrollQueued=false;
function syncScroll() {
  scrollQueued=false;
  const play=$('#playground').getBoundingClientRect();
  const next=play.top<=innerHeight*.42?'play':'hero';
  if(next!==activeChapter){activeChapter=next;scene.dataset.chapter=next;}
  const bounds=story.getBoundingClientRect();
  const nextVisible=bounds.bottom>innerHeight*.25&&bounds.top<innerHeight&&!document.hidden;
  if(nextVisible&&!visible){lastFrame=0;lastTick=performance.now();}
  visible=nextVisible;
  if(matchMedia('(pointer:coarse)').matches&&!manualInput&&next==='play')targetDistance=clamp(45+Math.max(0,-play.top)*.12,MIN_CM,MAX_CM);
  if(visible)start();
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(syncScroll);}},{passive:true});
window.addEventListener('resize',syncScroll);
window.addEventListener('pointermove',event=>{
  if(!visible||paused||event.pointerType==='touch'||event.target.closest('button,input,a,summary,.process-track'))return;
  const rect=model.getBoundingClientRect(),radius=Math.max(innerWidth*.5,350);
  const dx=event.clientX-(rect.left+rect.width*.51),dy=event.clientY-(rect.top+rect.height*.51);
  targetDistance=MIN_CM+clamp(Math.hypot(dx,dy)/radius,0,1)*(MAX_CM-MIN_CM);
  pointerX=clamp(dx/radius,-1,1)*3;pointerY=clamp(-dy/innerHeight,-1,1)*2.5;manualInput=false;start();
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointerX=0;pointerY=0;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){visible=false;cancelAnimationFrame(frame);frame=0;lastFrame=0;void mute();}else{lastTick=performance.now();syncScroll();}});
window.addEventListener('blur',()=>{pointerX=0;pointerY=0;void mute();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;void mute();});
window.addEventListener('pageshow',()=>{lastTick=performance.now();syncScroll();});
reduced.addEventListener('change',()=>{lastFrame=0;matrixOffset=0;paintMatrix();renderSequencer();start();});
// Keep the musical clock running while reduced motion suppresses visual movement.
function start(){if(!frame&&visible&&!paused&&!document.hidden)frame=requestAnimationFrame(animate);}
function animate(time) {
  frame=0;if(!visible||paused||document.hidden)return;
  const elapsed=lastFrame?Math.min((time-lastFrame)/1000,.1):.016;lastFrame=time;
  engine.sense(targetDistance,elapsed);
  if(!reduced.matches){tiltX+=(pointerX-tiltX)*.08;tiltY+=(pointerY-tiltY)*.08;model.style.setProperty('--tilt-x',`${tiltX.toFixed(2)}deg`);model.style.setProperty('--tilt-y',`${tiltY.toFixed(2)}deg`);}
  if(time-lastReadout>100){updateReadout();lastReadout=time;}
  if(!reduced.matches&&time-lastMatrix>=60){
    lastMatrix=time;
    if(matrixMessage){matrixOffset++;if(matrixOffset>=matrixMessage.length*9){matrixMessage='';matrixOffset=0;}}
    else if(matrixQueue.length){matrixMessage=matrixQueue.shift();matrixOffset=0;}
    paintMatrix();
  }
  if(time-lastTick>=engine.period){
    lastTick+=engine.period;const tick=engine.tick();renderSequencer();paintDevice();playAudio(tick);
    if(engine.recording)updateRecordStatus();
    if(tick.completed!==null){status.textContent=`PLAY / ${LAYERS[tick.completed]} recorded.`;sendText('REPLACE OK');sendState();}
  }
  start();
}

const track=$('.process-track');
$('#process-prev').addEventListener('click',()=>track.scrollBy({left:-track.clientWidth*.7,behavior:reduced.matches?'instant':'smooth'}));
$('#process-next').addEventListener('click',()=>track.scrollBy({left:track.clientWidth*.7,behavior:reduced.matches?'instant':'smooth'}));
track.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();track.scrollBy({left:(event.key==='ArrowLeft'?-1:1)*280,behavior:reduced.matches?'instant':'smooth'});}});
let drag=null;
track.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,left:track.scrollLeft};track.setPointerCapture(event.pointerId);track.classList.add('is-dragging');});
track.addEventListener('pointermove',event=>{if(drag)track.scrollLeft=drag.left+drag.x-event.clientX;});
const endDrag=()=>{drag=null;track.classList.remove('is-dragging');};
track.addEventListener('pointerup',endDrag);track.addEventListener('pointercancel',endDrag);track.addEventListener('lostpointercapture',endDrag);
$('#video-play').addEventListener('click',()=>{
  void mute();const iframe=document.createElement('iframe');
  iframe.title='World Sensing Music Station — prototype demonstration';iframe.src='https://www.youtube-nocookie.com/embed/EojQMf95e6k?autoplay=1&rel=0&playsinline=1';
  iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
  $('#video-player').append(iframe);$('#video-poster').hidden=true;iframe.focus();
});
sendState();updateReadout();renderSequencer();paintDevice();paintMatrix();syncScroll();start();
