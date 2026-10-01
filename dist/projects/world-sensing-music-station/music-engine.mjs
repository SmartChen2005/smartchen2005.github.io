// Musical rules ported from Control.ino. Cursor input replaces ultrasonic input.
export const MODES = {
  ambient: {bpm:80,swing:.05,scale:[262,294,330,392,440,523,587,660]},
  trap: {bpm:140,swing:.12,scale:[220,247,262,294,330,349,392,440]},
  techno: {bpm:128,swing:0,scale:[262,294,330,349,392,440,494,523]}
};
export const LAYERS=['Rhythm','Bass','Melody'];
export const MIN_CM=10, MAX_CM=180, PING_MS=40, ALPHA=.22, NUM_LEDS=30;
export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function distanceToZone(cm) {
  if(!Number.isFinite(cm)||cm<MIN_CM||cm>MAX_CM)return -1;
  return Math.trunc((Math.trunc(cm)-MIN_CM)*7/(MAX_CM-MIN_CM));
}
export function rhythmHit(zone,speed,step,mode) {
  if(zone<0)return 0;
  let hit=0;
  if(mode==='techno') {
    if(step%2===0)hit|=1;
    if(step%2===1)hit|=4;
    if(step===4)hit|=2;
    if(speed>1.2)hit|=4;
  }else if(mode==='trap') {
    if(step===4)hit|=2;
    if([0,3,6].includes(step)&&zone<=3)hit|=1;
    if(speed>.8)hit|=4;
    if(speed>1.8&&step%2===1)hit|=4;
  }else {
    if(speed>1.6)hit|=4;
    if(speed>2.6&&step%4===0)hit|=1;
  }
  return hit;
}
export function noteIndex(zone,mode,isMelody) {
  if(zone<0)return -1;
  if(mode==='ambient')return clamp(zone,1,6);
  if(mode==='trap')return isMelody?clamp(zone+2,2,7):clamp(zone,0,4);
  return [0,2,4,5,4,2,1,3][zone&7];
}
export function noteColor(index) {
  if(index<0)return [0,0,0];
  let position=255-index*32;
  if(position<85)return [255-position*3,0,position*3];
  if(position<170){position-=85;return [0,position*3,255-position*3];}
  position-=170;return [position*3,255-position*3,0];
}
export class MusicEngine {
  constructor() {
    this.distance=45;this.speed=0;this.step=-1;this.selected=0;
    this.mode='ambient';this.remaining=0;this.sampleElapsed=0;
    this.loops=[Array(8).fill(0),Array(8).fill(-1),Array(8).fill(-1)];
  }
  get zone(){return distanceToZone(this.distance);}
  get preset(){return MODES[this.mode];}
  get period(){return Math.floor(60000/this.preset.bpm);}
  get recording(){return this.remaining>0;}
  get displayState(){return `${this.mode.toUpperCase()} ${this.preset.bpm}bpm ${['RHY','BASS','MELO'][this.selected]} ${this.recording?'REC':'PLAY'}`;}
  setMode(mode){if(!MODES[mode])return false;this.mode=mode;return true;}
  sample(raw) {
    if(!Number.isFinite(raw)||raw<0)return false;
    const previous=this.distance;
    this.distance+=ALPHA*(raw-this.distance);this.speed=Math.abs(this.distance-previous);
    return true;
  }
  sense(raw,elapsed=.016) {
    this.sampleElapsed+=elapsed*1000;
    while(this.sampleElapsed>=PING_MS-1e-7){this.sampleElapsed=Math.max(0,this.sampleElapsed-PING_MS);this.sample(raw);}
  }
  replace() {
    this.loops[this.selected].fill(this.selected===0?0:-1);
    this.remaining=8;
  }
  clear() {
    this.loops[0].fill(0);this.loops[1].fill(-1);this.loops[2].fill(-1);
    this.remaining=0;this.step=-1;
  }
  randomize(random=Math.random) {
    this.loops[this.selected]=Array.from({length:8},(_,step)=>{
      const zone=Math.min(7,Math.floor(random()*8));
      return this.selected===0?rhythmHit(zone,1.5,step,this.mode):noteIndex(zone,this.mode,this.selected===2);
    });
  }
  tick() {
    this.step=(this.step+1)%8;
    let completed=null;
    if(this.recording) {
      const layer=this.selected;
      let value=layer===0?rhythmHit(this.zone,this.speed,this.step,this.mode):noteIndex(this.zone,this.mode,layer===2);
      if(this.mode==='ambient'&&layer>0&&this.speed<(layer===1?.6:.8))value=-1;
      this.loops[layer][this.step]=value;
      if(--this.remaining===0)completed=layer;
    }
    const notes=this.loops.map(loop=>loop[this.step]);
    if(this.mode==='trap'&&this.step===4)notes[0]|=2;
    if(this.mode==='techno'&&this.step%2===0)notes[0]|=1;
    return {step:this.step,notes,completed,swingDelay:this.step%2===1?Math.floor(this.period*this.preset.swing):0};
  }
  frequencies(notes) {
    return [notes[0]&1?110:notes[0]&2?220:notes[0]&4?880:0,
      notes[1]<0?0:Math.floor(this.preset.scale[notes[1]&7]/2),
      notes[2]<0?0:this.preset.scale[notes[2]&7]];
  }
  ledColors(activeStep=this.step) {
    const colors=Array.from({length:NUM_LEDS},()=>[0,0,0]);
    colors[this.selected]=[80,80,80];
    for(let step=0;step<8;step++) {
      let color=this.loops[0][step]?[60,20,0]:[0,0,0];
      if(this.loops[1][step]>=0)color=noteColor(this.loops[1][step]);
      if(this.loops[2][step]>=0)color=noteColor(this.loops[2][step]);
      if(step===activeStep)color=[120,120,120];
      for(let i=3+step*3;i<6+step*3;i++)colors[i]=color;
    }
    return colors;
  }
}
