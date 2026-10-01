// A small, deterministic demonstration of the documented musical rules.
// These ranges and presets belong to the web simulation, not a firmware claim.
export const MODES = {
  ambient: { bpm: 80, scale: [0,2,4,7,9,12,14,16], rhythm: [1,0,0,0,0,0,1,0], bass: [0,null,null,null,3,null,null,null], melody: [0,null,2,null,null,4,null,2], description: 'sparse pentatonic pattern' },
  trap: { bpm: 140, scale: [0,2,3,7,10,12,14,15], rhythm: [1,3,3,0,2,3,3,3], bass: [0,null,0,null,3,null,null,2], melody: [0,null,3,2,null,5,null,3], description: 'half-time anchor and active hats' },
  techno: { bpm: 128, scale: [0,2,3,5,7,10,12,14], rhythm: [1,3,1,3,1,3,1,3], bass: [0,0,2,0,0,3,2,0], melody: [0,2,3,2,4,3,2,0], description: 'steady four-on-the-floor pulse' }
};
export const LAYERS = ['Rhythm','Bass','Melody'];
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export class MusicEngine {
  constructor() {
    this.distance = 72;
    this.speed = 0;
    this.step = -1;
    this.selected = 2;
    this.recording = null;
    this.setMode('ambient');
  }
  get zone() { return clamp(Math.floor((this.distance-15)/145*8),0,7); }
  get preset() { return MODES[this.mode]; }
  setMode(mode) {
    if (!MODES[mode] || this.recording) return false;
    this.mode = mode;
    this.loops = [MODES[mode].rhythm.slice(),MODES[mode].bass.slice(),MODES[mode].melody.slice()];
    return true;
  }
  sense(raw, elapsed=.016, direct=false) {
    const previous = this.distance;
    const next = clamp(Number(raw)||15,15,160);
    // Frame-rate-independent exponential moving average, with a 140ms response.
    this.distance = direct ? next : previous + (next-previous)*(1-Math.exp(-clamp(elapsed,.001,.1)/.14));
    const change = Math.abs(this.distance-previous)/Math.max(elapsed,.016);
    this.speed = this.speed*.8+clamp(change/220,0,1)*.2;
  }
  replace() {
    if (this.recording) return false;
    this.recording = {layer:this.selected, count:0};
    return true;
  }
  tick() {
    this.step = (this.step+1)%8;
    let completed = null;
    if (this.recording) {
      const layer = this.recording.layer;
      let value = this.zone;
      if (layer===0) {
        const base = this.preset.rhythm[this.step];
        value = base || (this.speed>.28 && this.step%2===1 ? 3 : 0);
      } else if (this.mode==='ambient' && this.speed<.12 && this.step%2===1) value=null;
      this.loops[layer][this.step] = value;
      this.recording.count++;
      if (this.recording.count===8) { completed=layer; this.recording=null; }
    }
    return {step:this.step, notes:this.loops.map(loop=>loop[this.step]), completed};
  }
}
