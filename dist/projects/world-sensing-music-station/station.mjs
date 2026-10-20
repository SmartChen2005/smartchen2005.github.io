import {LAYERS,clamp} from './music-engine.mjs';
import {PlaceEngine,FAMILIAR_ROUTE,placeNotes,routePath} from './place-score.mjs';
import {displayText,matrixFrame} from './display-engine.mjs';
import {floorPoint,floorCoordinates,distanceAt,depthAt,roomPose,sonarArc} from './space-engine.mjs';
import './process-viewer.mjs';
const engine=new PlaceEngine();
const $=selector=>document.querySelector(selector);
const scene=$('.scene'),model=$('.device-model'),story=$('.instrument-story');
const range=$('#distance-input'),status=$('#record-status');
const soundButton=$('#sound-toggle'),motionButton=$('#motion-toggle');
const world=$('.spatial-world'),worldControl=$('#world-control'),stage=$('.device-stage');
const leds=[...document.querySelectorAll('[data-led]')],pixels=[...document.querySelectorAll('[data-pixel]')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=false,visible=true,sound=true,audioContext,master,analyser,audioSamples,frame=0;
let audioUnavailable=false,audioUnlocked=false,progress=0,worldU=.58,targetU=.58,following=false,worldDrag=null;
let auditionUntil=0,currentFrequency=0,lastSound=0;
let walking=null,routeStep=-1,savedRoute=[],routeCycles=0;
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
    row.disabled=engine.recording;
    row.setAttribute('aria-label',`Select ${LAYERS[layer]} layer; ${recording?'recording':'playing'}`);
    row.querySelector('.layer-state').textContent=recording?'REC':engine.loops[layer].some(value=>layer===0?value>0:value>=0)?'LOOP':'—';
    row.querySelectorAll('.step').forEach((step,i)=>{
      const value=engine.loops[layer][i];step.dataset.value=value;
      step.classList.toggle('has-note',layer===0?value>0:value>=0);
      step.classList.toggle('is-playing',i===engine.step&&(!reduced.matches||engine.recording));
    });
  });
  $('#record-button').disabled=engine.recording;
  $('#record-button').setAttribute('aria-pressed',String(engine.recording));
  $('#record-button').innerHTML=`<span aria-hidden="true">●</span> ${engine.recording?'Recording…':`Record ${LAYERS[engine.selected].toLowerCase()}`}`;
  document.querySelectorAll('[data-mode]').forEach(button=>button.disabled=engine.recording);
  $('#randomize-button').disabled=engine.recording;
  $('#route-demo').disabled=engine.recording;$('#route-replay').disabled=engine.recording||savedRoute.length!==8;
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
function updateRecordStatus() {status.textContent=`Recording ${LAYERS[engine.selected].toLowerCase()} · ${8-engine.remaining} / 8 beats. Keep moving.`;}
range.addEventListener('input',event=>{stopWalking();targetDistance=Number(event.target.value);auditionUntil=performance.now()+1500;void activateAudio();start();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
  engine.setMode(button.dataset.mode);
  document.querySelectorAll('[data-mode]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  $('#bpm-output').textContent=`${engine.preset.bpm} BPM`;sendText(engine.mode.toUpperCase());sendState();
  renderSequencer();paintDevice();auditionUntil=performance.now()+1500;lastTick=performance.now();
}));
$('#record-button').addEventListener('click',()=>{
  engine.replace();if(paused){paused=false;updatePause();}
  lastTick=performance.now();routeStep=-1;
  sendText('REPLACE 1LP');sendState();updateRecordStatus();renderSequencer();paintDevice();start();
});
$('#randomize-button').addEventListener('click',()=>{
  engine.loops[engine.selected]=FAMILIAR_ROUTE.map(([u,v],step)=>placeNotes(u,v,step,engine.mode)[engine.selected]);
  sendText('PATTERN');sendState();renderSequencer();paintDevice();
  status.textContent=`Example ${LAYERS[engine.selected].toLowerCase()} loop loaded. Record to replace this layer.`;
});
$('#clear-button').addEventListener('click',()=>{
  engine.clear();savedRoute=[];stopWalking();sendText('CLEARED');sendState();renderSequencer();paintDevice();
  status.textContent='All loops cleared. Walk a route or record a new one.';auditionUntil=0;void silenceTones();
});
function showRoute(points){
  $('#route-path').setAttribute('d',routePath(points));
  $('#route-markers').replaceChildren(...points.map(([u,v])=>{const p=floorPoint(u,v),circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r','5');return circle;}));
}
function stopWalking(){
  if(!walking)return;walking=null;
  $('#route-demo').setAttribute('aria-pressed','false');$('#route-replay').setAttribute('aria-pressed','false');
  $('#route-replay').textContent='Replay my route';
  $('#route-demo').innerHTML='Walk the familiar route <span aria-hidden="true">↻</span>';
  $('#route-status').textContent='Your turn. Move through the room, or walk the route again.';
}
function walkRoute(points,kind){
  if(walking===kind){stopWalking();return;}
  walking=kind;routeStep=-1;routeCycles=0;engine.step=-1;lastTick=performance.now()-engine.period;
  showRoute(points);if(paused){paused=false;updatePause();}
  $('#route-demo').setAttribute('aria-pressed',String(kind==='familiar'));$('#route-replay').setAttribute('aria-pressed',String(kind==='saved'));
  $('#route-replay').textContent=kind==='saved'?'Stop replay':'Replay my route';
  $('#route-demo').innerHTML=kind==='familiar'?'Stop walking <span aria-hidden="true">Ⅱ</span>':'Walk the familiar route <span aria-hidden="true">↻</span>';
  $('#route-status').textContent=kind==='saved'?'Retracing your recorded route. The same places bring back the same notes.':'Window → door → desk → window. Listen for the melody returning.';
  void activateAudio();start();
}
$('#route-demo').addEventListener('click',()=>walkRoute(FAMILIAR_ROUTE,'familiar'));
$('#route-replay').addEventListener('click',()=>walkRoute(savedRoute,'saved'));
$('#inspect-button').addEventListener('click',event=>{
  const inspecting=scene.classList.toggle('is-inspecting');event.currentTarget.setAttribute('aria-pressed',String(inspecting));
  syncScroll();
});
$('.technical-details').addEventListener('toggle',event=>{
  if(!event.currentTarget.open){scene.classList.remove('is-inspecting');$('#inspect-button').setAttribute('aria-pressed','false');}
  syncScroll();
});

function tone(frequency,time,duration,layer=2) {
  if(!frequency||!sound||audioContext?.state!=='running')return;
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
  oscillator.type=layer===2?'sine':'triangle';oscillator.frequency.value=frequency;
  const level=[.18,.14,.2][layer],attack=Math.min(.025,duration*.2);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+attack);
  gain.gain.exponentialRampToValueAtTime(.001,time+duration);
  oscillator.connect(gain);gain.connect(master);activeTones.add(oscillator);
  oscillator.onended=()=>{activeTones.delete(oscillator);oscillator.disconnect();gain.disconnect();};
  oscillator.start(time);oscillator.stop(time+duration+.005);
  currentFrequency=frequency;lastSound=performance.now()+(time-audioContext.currentTime+duration)*1000;
}
function playAudio(tick) {
  if(!sound||!audioContext||progress<.92)return;
  const time=audioContext.currentTime+.015+tick.swingDelay/1000, p=engine.period/1000;
  const frequencies=engine.frequencies(tick.notes);
  tone(frequencies[0],time,Math.min(.12,p*.3),0);tone(frequencies[1],time,p*.65,1);tone(frequencies[2],time,p*.8,2);
}
function soundUI(){
  const label=audioUnavailable?'Sound unavailable':sound?'Mute sound':'Unmute sound';
  soundButton.setAttribute('aria-label',label);soundButton.title=label;
  soundButton.setAttribute('aria-pressed',String(!sound));
  soundButton.dataset.audioState=audioUnavailable?'unavailable':!sound?'muted':audioContext?.state==='running'?'running':'pending';
  soundButton.disabled=audioUnavailable;
}
function silenceTones(){
  for(const oscillator of activeTones){try{oscillator.stop();}catch{}}
  activeTones.clear();lastSound=0;
}
async function suspendAudio(){
  silenceTones();
  if(audioContext?.state==='running')await audioContext.suspend().catch(()=>{});soundUI();
}
async function mute(){sound=false;auditionUntil=0;soundUI();await suspendAudio();}
async function activateAudio(){
  if(!sound||audioUnavailable||document.hidden||!visible)return;
  try{
    if(!audioContext){
      const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('unavailable');
      audioContext=new Context();master=audioContext.createGain();master.gain.value=.55;
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
function updatePause(){document.body.classList.toggle('motion-paused',paused);motionButton.textContent=paused?'Resume playback ▷':'Pause playback Ⅱ';motionButton.setAttribute('aria-pressed',String(paused));lastFrame=0;lastTick=performance.now();if(paused)silenceTones();}
motionButton.addEventListener('click',()=>{paused=!paused;updatePause();if(!paused)start();});

let scrollQueued=false;
function syncScroll() {
  scrollQueued=false;
  const play=$('#playground').getBoundingClientRect();
  const next=play.top<=innerHeight*.42?'play':'hero';
  if(next!==activeChapter){activeChapter=next;scene.dataset.chapter=next;}
  const bounds=story.getBoundingClientRect();
  const scrollProgress=clamp(-bounds.top/(innerHeight*(innerWidth<=900?.62:1.05)),0,1);
  progress=reduced.matches?(next==='play'?1:0):scrollProgress;
  $('.scene-caption').style.visibility=progress>.2?'hidden':'visible';
  const copyOpacity=1-clamp((progress-.2)/.6,0,1);
  for(const copy of document.querySelectorAll('.hero-title,.hero-bottom')){copy.style.opacity=String(copyOpacity);copy.style.visibility=copyOpacity===0?'hidden':'visible';}
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
  paintSpace(time);
  if(!reduced.matches&&time-lastMatrix>=60){
    lastMatrix=time;
    if(matrixMessage){matrixOffset++;if(matrixOffset>=matrixMessage.length*9){matrixMessage='';matrixOffset=0;}}
    else if(matrixQueue.length){matrixMessage=matrixQueue.shift();matrixOffset=0;}
    paintMatrix();
  }
  if(time-lastTick>=engine.period){
    lastTick=time;
    if(walking){
      const points=walking==='saved'?savedRoute:FAMILIAR_ROUTE;routeStep=(routeStep+1)%8;
      [targetU]=points[routeStep];targetDistance=distanceAt(points[routeStep][1]);
      if(routeStep===0&&++routeCycles>1)$('#route-status').textContent=`Route ${routeCycles} · The same path. The same melody.`;
      [...$('#route-markers').children].forEach((marker,i)=>marker.classList.toggle('is-current',i===routeStep));
    }
    const tick=engine.tickAt(targetU,depthAt(targetDistance),progress>.92&&(!!walking||time<auditionUntil));renderSequencer();paintDevice();playAudio(tick);
    if(engine.recording)updateRecordStatus();
    if(tick.completed!==null){savedRoute=engine.route.map(p=>[...p]);$('#route-replay').disabled=false;if(!walking)showRoute(savedRoute);status.textContent=`${LAYERS[tick.completed]} loop recorded. Add a layer, or replay your route.`;sendText('REPLACE OK');sendState();}
  }
  start();
}

$('#video-play').addEventListener('click',()=>{
  void mute();const iframe=document.createElement('iframe');
  iframe.title='World Sensing Music Station — prototype demonstration';iframe.src='https://www.youtube-nocookie.com/embed/EojQMf95e6k?autoplay=1&rel=0&playsinline=1';
  iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
  $('#video-player').append(iframe);$('#video-poster').hidden=true;iframe.focus();
});
function setPosition(u,v){stopWalking();targetU=clamp(u,.12,.88);targetDistance=distanceAt(v);auditionUntil=performance.now()+1500;start();}
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
  const photoBox=$('.hero-photo img').getBoundingClientRect();
  const phone=innerWidth<=900,heroWidth=photoBox.width*1.08;
  const inspecting=scene.classList.contains('is-inspecting')&&!phone;
  // Align the reconstructed coil with the coil in the uncropped photograph.
  const heroY=photoBox.top-sceneRect.top+photoBox.height*.6+heroWidth*.018;
  const heroX=photoBox.left-sceneRect.left+photoBox.width*.56-heroWidth*.019;
  const roomX=rect.left-sceneRect.left+(inspecting ? 560 : pose.device.x)/1000*rect.width;
  const roomY=inspecting ? Math.max(0,Math.min(innerHeight,sceneRect.bottom))*.46-sceneRect.top : rect.top-sceneRect.top+pose.device.y/740*rect.height;
  const travel=clamp((progress-.4)/.6,0,1),smooth=travel*travel*(3-2*travel);
  stage.style.left=`${heroX+(roomX-heroX)*smooth}px`;
  stage.style.top=`${heroY+(roomY-heroY)*smooth}px`;
  stage.style.width=`${heroWidth+(rect.width*(inspecting ? .94 : .28)-heroWidth)*smooth}px`;
  stage.style.opacity=String(clamp((progress-.06)/.32,0,1));
  $('.hero-photo').style.opacity=String(1-clamp(progress/.4,0,1));
  $('.hero-photo').style.visibility=progress>=.4?'hidden':'visible';
  world.style.opacity=String(travel*(inspecting ? .12 : 1));
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
  $('#live-note').textContent=audioUnavailable?'Sound unavailable':!sound?'Muted':paused?'Paused':time<lastSound+250&&currentFrequency?`${currentFrequency} Hz / on the beat`:'Move to play';
  const points=[];
  if(analyser&&sound&&audioContext.state==='running'&&!reduced.matches)analyser.getByteTimeDomainData(audioSamples);
  for(let i=0;i<128;i++){
    const value=analyser&&sound&&audioContext.state==='running'&&!reduced.matches?clamp((audioSamples[i*2]-128)*1.5,-12,12):0;
    points.push(`${i?'L':'M'}${170+i/127*750} ${675+value}`);
  }
  $('#music-wave').setAttribute('d',points.join(''));
}
showRoute(FAMILIAR_ROUTE);sendState();updateReadout();renderSequencer();paintDevice();paintMatrix();soundUI();updatePause();syncScroll();start();void activateAudio();
