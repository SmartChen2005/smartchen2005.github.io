import {MusicEngine, LAYERS, MIN_CM, MAX_CM, clamp, noteIndex} from './music-engine.mjs';
import {displayText,matrixFrame} from './display-engine.mjs';
import {floorCoordinates,distanceAt,depthAt,roomPose,sonarArc} from './space-engine.mjs';
const engine=new MusicEngine();
const $=selector=>document.querySelector(selector);
const scene=$('.scene'),model=$('.device-model'),story=$('.instrument-story');
const range=$('#distance-input'),status=$('#record-status');
const soundButton=$('#sound-toggle'),motionButton=$('#motion-toggle');
const world=$('.spatial-world'),worldControl=$('#world-control'),stage=$('.device-stage');
const leds=[...document.querySelectorAll('[data-led]')],pixels=[...document.querySelectorAll('[data-pixel]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=false,visible=true,sound=true,audioContext,master,analyser,audioSamples,frame=0;
let audioUnavailable=false,audioUnlocked=false,progress=0,worldU=.58,targetU=.58,following=false,worldDrag=null;
let auditionUntil=0,lastAudition=0,currentFrequency=0,lastSound=0;
let targetDistance=45,lastFrame=0,lastTick=performance.now(),lastReadout=0,activeChapter='hero';
let tiltX=3,tiltY=-5,pointerX=3,pointerY=-5;
let matrixMessage='READY',matrixOffset=0,lastMatrix=0;
const matrixQueue=[];
const activeTones=new Set();
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
  $('#room-distance').textContent=`${Math.round(engine.distance)} cm`;
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
range.addEventListener('input',event=>{targetDistance=Number(event.target.value);auditionUntil=performance.now()+850;void activateAudio();start();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  engine.setMode(button.dataset.mode);
  document.querySelectorAll('[data-mode]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  $('#bpm-output').textContent=`${engine.preset.bpm} BPM`;sendText(engine.mode.toUpperCase());sendState();
  renderSequencer();paintDevice();auditionUntil=performance.now()+600;
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
  status.textContent='PLAY / All loops cleared.';auditionUntil=0;
});
$('#inspect-button').addEventListener('click',event=>{
  const inspecting=scene.classList.toggle('is-inspecting');event.currentTarget.setAttribute('aria-pressed',String(inspecting));
  syncScroll();
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
  oscillator.connect(gain);gain.connect(master);activeTones.add(oscillator);
  oscillator.onended=()=>{activeTones.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(time);oscillator.stop(time+duration+.005);
  currentFrequency=frequency;lastSound=performance.now()+(time-audioContext.currentTime+duration)*1000;
}
function playAudio(tick) {
  if(!sound||!audioContext)return;
  const time=audioContext.currentTime+tick.swingDelay/1000, p=engine.period;
  const kick=Math.floor(p*.20)/1000,bass=Math.floor(p*.35)/1000,melody=Math.floor(p*.35)/1000;
  const frequencies=engine.frequencies(tick.notes);
  tone(frequencies[0],time,kick);tone(frequencies[1],time+kick,bass);tone(frequencies[2],time+kick+bass,melody);
}
function soundUI(){
  const label=audioUnavailable?'Sound unavailable':sound?'Mute sound':'Unmute sound';
  soundButton.setAttribute('aria-label',label);soundButton.title=label;
  soundButton.setAttribute('aria-pressed',String(!sound));
  soundButton.dataset.audioState=audioUnavailable?'unavailable':!sound?'muted':audioContext?.state==='running'?'running':'pending';
  soundButton.disabled=audioUnavailable;
}
async function suspendAudio(){
  for(const oscillator of activeTones){try{oscillator.stop();}catch{}}
  activeTones.clear();lastSound=0;
  if(audioContext?.state==='running')await audioContext.suspend().catch(()=>{});soundUI();
}
async function mute(){sound=false;auditionUntil=0;soundUI();await suspendAudio();}
async function activateAudio(){
  if(!sound||audioUnavailable||document.hidden||!visible)return;
  try{
    if(!audioContext){
      const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('unavailable');
      audioContext=new Context();master=audioContext.createGain();master.gain.value=.35;
      analyser=audioContext.createAnalyser();analyser.fftSize=256;audioSamples=new Uint8Array(analyser.fftSize);
      master.connect(analyser);analyser.connect(audioContext.destination);audioContext.addEventListener('statechange',soundUI);
    }
    await audioContext.resume();
    if(!sound||document.hidden||!visible){await suspendAudio();return;}
    audioUnlocked=audioContext.state==='running';soundUI();start();
  }catch{audioUnavailable=true;soundUI();$('#audio-status').textContent='Sound is unavailable. Moving and recording still work visually.';}
}
soundButton.addEventListener('click',()=>{
  if(sound)void mute();
  else{sound=true;soundUI();auditionUntil=performance.now()+650;void activateAudio();}
});
// Browsers may suspend autoplay until this ordinary interaction; no separate enable step.
document.addEventListener('pointerdown',event=>{if(story.contains(event.target)&&!soundButton.contains(event.target))void activateAudio();},{capture:true});
document.addEventListener('keydown',event=>{if(story.contains(event.target)&&!soundButton.contains(event.target))void activateAudio();},{capture:true});
function updatePause(){document.body.classList.toggle('motion-paused',paused);motionButton.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';motionButton.setAttribute('aria-pressed',String(paused));lastFrame=0;lastTick=performance.now();}
motionButton.addEventListener('click',()=>{paused=!paused;updatePause();if(!paused)start();});

let scrollQueued=false;
function syncScroll() {
  scrollQueued=false;
  const play=$('#playground').getBoundingClientRect();
  const next=play.top<=innerHeight*.42?'play':'hero';
  if(next!==activeChapter){activeChapter=next;scene.dataset.chapter=next;}
  const bounds=story.getBoundingClientRect();
  const scrollProgress=clamp(-bounds.top/(innerHeight*.9),0,1);
  progress=reduced.matches?(next==='play'?1:0):scrollProgress;
  const nextVisible=bounds.bottom>innerHeight*.25&&bounds.top<innerHeight&&!document.hidden;
  if(nextVisible&&!visible){lastFrame=0;lastTick=performance.now();}
  if(!nextVisible&&visible)void suspendAudio();
  visible=nextVisible;
  worldControl.disabled=progress<.92||scene.classList.contains('is-inspecting');
  $('#follow-toggle').disabled=worldControl.disabled;
  if(visible&&audioUnlocked&&sound)void activateAudio();
  paintSpace(performance.now());
  if(visible)start();
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(syncScroll);}},{passive:true});
window.addEventListener('resize',syncScroll);
window.addEventListener('pointermove',event=>{
  if(!visible||paused||event.pointerType==='touch')return;
  pointerX=3+(event.clientX/innerWidth-.5)*5;pointerY=-5+(event.clientY/innerHeight-.5)*3;start();
},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{pointerX=3;pointerY=-5;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){visible=false;cancelAnimationFrame(frame);frame=0;lastFrame=0;void suspendAudio();}else{lastTick=performance.now();syncScroll();}});
window.addEventListener('blur',()=>{pointerX=3;pointerY=-5;endWorldDrag();void suspendAudio();});
window.addEventListener('focus',()=>{if(audioUnlocked)void activateAudio();});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;void suspendAudio();});
window.addEventListener('pageshow',()=>{lastTick=performance.now();syncScroll();});
reduced.addEventListener('change',()=>{lastFrame=0;matrixOffset=0;paintMatrix();renderSequencer();syncScroll();start();});
// Keep the musical clock running while reduced motion suppresses visual movement.
function start(){if(!frame&&visible&&!paused&&!document.hidden)frame=requestAnimationFrame(animate);}
function animate(time) {
  frame=0;if(!visible||paused||document.hidden)return;
  const elapsed=lastFrame?Math.min((time-lastFrame)/1000,.1):.016;lastFrame=time;
  engine.sense(targetDistance,elapsed);
  worldU=reduced.matches?targetU:worldU+(targetU-worldU)*(1-Math.exp(-elapsed*12));
  if(!reduced.matches){tiltX+=(pointerX-tiltX)*.08;tiltY+=(pointerY-tiltY)*.08;model.style.setProperty('--tilt-x',`${tiltX.toFixed(2)}deg`);model.style.setProperty('--tilt-y',`${tiltY.toFixed(2)}deg`);}
  if(time-lastReadout>100){updateReadout();lastReadout=time;}
  if(progress>.92&&time<auditionUntil&&time-lastAudition>=160){
    const index=noteIndex(engine.zone,engine.mode,true);
    if(index>=0&&sound&&audioContext?.state==='running')tone(engine.preset.scale[index],audioContext.currentTime,.14);
    lastAudition=time;
  }
  paintSpace(time);
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
function setPosition(u,v){targetU=clamp(u,.12,.88);targetDistance=distanceAt(v);auditionUntil=performance.now()+750;start();}
function positionFromPointer(event){
  const rect=world.getBoundingClientRect();
  const point=floorCoordinates((event.clientX-rect.left)/rect.width*1000,(event.clientY-rect.top)/rect.height*740+55);
  setPosition(point.u,point.v);
}
function endWorldDrag(){worldDrag=null;worldControl.classList.remove('is-dragging');}
worldControl.addEventListener('pointerdown',event=>{
  if(event.button!==0||paused)return;
  worldDrag=event.pointerId;worldControl.setPointerCapture(event.pointerId);worldControl.classList.add('is-dragging');
  positionFromPointer(event);void activateAudio();
});
worldControl.addEventListener('pointermove',event=>{if(!paused&&(worldDrag===event.pointerId||following&&event.pointerType!=='touch'))positionFromPointer(event);});
worldControl.addEventListener('pointerup',endWorldDrag);worldControl.addEventListener('pointercancel',endWorldDrag);worldControl.addEventListener('lostpointercapture',endWorldDrag);
worldControl.addEventListener('keydown',event=>{
  if(paused)return;const increment=event.shiftKey ? .08 : .04,v=depthAt(targetDistance);
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
    event.preventDefault();
    if(event.key==='ArrowLeft')setPosition(targetU-increment,v);
    if(event.key==='ArrowRight')setPosition(targetU+increment,v);
    if(event.key==='ArrowUp')setPosition(targetU,v-increment);
    if(event.key==='ArrowDown')setPosition(targetU,v+increment);
    if(event.key==='Home')setPosition(.58,depthAt(45));
    if(event.key==='End')setPosition(targetU,1);
  }
  if(event.key==='Escape'){following=false;$('#follow-toggle').setAttribute('aria-pressed','false');endWorldDrag();}
});
worldControl.addEventListener('click',event=>{if(event.detail===0){auditionUntil=performance.now()+750;void activateAudio();}});
$('#follow-toggle').addEventListener('click',event=>{following=!following;event.currentTarget.setAttribute('aria-pressed',String(following));});

function paintSpace(time){
  const pose=roomPose(worldU,engine.distance),rect=world.getBoundingClientRect(),sceneRect=scene.getBoundingClientRect();
  const phone=innerWidth<=700,heroWidth=phone ? Math.min(innerWidth*1.06,650)*(innerHeight<=650 ? .85 : 1) : Math.min(innerWidth*(innerHeight<=650 ? .65 : .72),innerHeight<=650 ? innerHeight*1.1 : 940);
  const inspecting=scene.classList.contains('is-inspecting')&&!phone;
  const heroY=innerHeight*(phone ? .48 : .58),roomX=rect.left-sceneRect.left+(inspecting ? 560 : pose.device.x)/1000*rect.width;
  const roomY=inspecting ? Math.max(0,Math.min(innerHeight,sceneRect.bottom))*.46-sceneRect.top : rect.top-sceneRect.top+pose.device.y/740*rect.height;
  stage.style.left=`${innerWidth*.5+(roomX-innerWidth*.5)*progress}px`;
  stage.style.top=`${heroY+(roomY-heroY)*progress}px`;
  stage.style.width=`${heroWidth+(rect.width*(inspecting ? .94 : .28)-heroWidth)*progress}px`;
  world.style.opacity=String(clamp((progress-.18)/.82,0,1)*(inspecting ? .12 : 1));
  world.style.visibility=progress>.05?'visible':'hidden';
  worldControl.style.pointerEvents=progress>.92&&!inspecting?'auto':'none';
  $('#room-shadow').setAttribute('cx',pose.floor.x);$('#room-shadow').setAttribute('cy',pose.floor.y+8);
  const {sensor,wall}=pose,dx=wall.x-sensor.x,dy=wall.y-sensor.y;
  $('#distance-ray').setAttribute('d',`M${sensor.x} ${sensor.y}L${wall.x} ${wall.y}`);
  $('#distance-ticks').setAttribute('d',`M${sensor.x-7} ${sensor.y+4}l14 -8M${wall.x-7} ${wall.y+4}l14 -8`);
  $('#wall-hit').setAttribute('cx',wall.x);$('#wall-hit').setAttribute('cy',wall.y);
  $('#echo-caption').setAttribute('x',wall.x+16);$('#echo-caption').setAttribute('y',wall.y-12);
  $('#room-distance').setAttribute('x',sensor.x+dx*.5+18);$('#room-distance').setAttribute('y',sensor.y+dy*.5-5);
  const phase=reduced.matches ? .35 : (time/(700+engine.distance*3))%1;
  $('#sonar-outbound').setAttribute('d',sonarArc(sensor,wall,phase));
  $('#sonar-return').setAttribute('d',sonarArc(sensor,wall,1-phase,true));
  $('#live-note').textContent=audioUnavailable?'Sound unavailable':!sound?'Muted':time<lastSound+250&&currentFrequency?`Live pitch / ${currentFrequency} Hz`:'Move to hear';
  const points=[];
  if(analyser&&sound&&audioContext.state==='running'&&!reduced.matches)analyser.getByteTimeDomainData(audioSamples);
  for(let i=0;i<128;i++){
    const value=analyser&&sound&&audioContext.state==='running'&&!reduced.matches?(audioSamples[i*2]-128)*3:0;
    points.push(`${i?'L':'M'}${170+i/127*750} ${675+value}`);
  }
  $('#music-wave').setAttribute('d',points.join(''));
}
sendState();updateReadout();renderSequencer();paintDevice();paintMatrix();soundUI();syncScroll();start();void activateAudio();
