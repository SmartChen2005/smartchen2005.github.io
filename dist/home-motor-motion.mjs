// Scenario Motion Loops craft: a pure time function, seeded elements and periods
// dividing twelve seconds. These are the Grid Tunnel and Warp Stars motifs.
export const MOTION_LOOP = 12;
export const motion = {
  mod: (x, n) => ((x % n) + n) % n,
  phase: (t, period, offset = 0) => ((t + offset) / period) - Math.floor((t + offset) / period),
  rand: (i, salt = 0) => {
    const n = (i * 12.9898 + salt * 78.233 + .5) * 127.1 + 311.7;
    const v = Math.sin(n) * 43758.5453123;
    return v - Math.floor(v);
  },
};
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function drawGridTunnel(ctx, w, h, time, P, strength = 1) {
  const t = motion.mod(time, MOTION_LOOP), cx = w * .5, cy = h * .43;
  const f = Math.max(w * .34, h * .9), drift = motion.phase(t, 1.5);
  const project = (x, y, z) => [cx + x * f / z, cy + y * f / z];
  const segment = (a, b, alpha, weight = 1) => {
    ctx.strokeStyle = P.fg; ctx.globalAlpha = alpha * strength;
    ctx.lineWidth = weight; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
  };
  // Nested moving rectangles: floor, ceiling and side walls share one vanishing point.
  for (let row = 27; row >= 0; row--) {
    const z = row + 1 - drift;
    if (z < .35) continue;
    const alpha = smooth(.35, 1.5, z) * (1 - smooth(2, 27, z));
    const corners = [[-3,-1.5],[3,-1.5],[3,1.5],[-3,1.5]].map(([x,y]) => project(x,y,z));
    for (let i = 0; i < 4; i++) segment(corners[i], corners[(i+1)%4], alpha * .64, Math.max(.55, 1.5 / Math.sqrt(z)));
  }
  for (let i = -6; i <= 6; i++) for (const side of [-1, 1]) {
    for (let row = 1; row < 19; row++) {
      const a = row * .75, b = a + .75;
      const opacity = (1 - smooth(2, 15, b)) * .34;
      segment(project(i*.5, side*1.5, a), project(i*.5, side*1.5, b), opacity, .7);
      if (Math.abs(i) < 4) segment(project(side*3, i*.375, a), project(side*3, i*.375, b), opacity, .65);
    }
  }
  ctx.globalAlpha = 1;
}

export function drawWarpStars(ctx, w, h, time, P, strength = 1, origin = [.5,.43]) {
  const t = motion.mod(time, MOTION_LOOP), span = Math.hypot(w, h);
  const cx = w * origin[0], cy = h * origin[1];
  for (let i = 0; i < 96; i++) {
    const p = motion.phase(t, 3, motion.rand(i,1)*3);
    const angle = motion.rand(i,2)*Math.PI*2;
    const radius = span*(.02 + motion.rand(i,3)*.08)*(.25 + p*p*13);
    const tail = radius*(.018 + .16*p);
    const alpha = smooth(0,.12,p)*(1-smooth(.8,1,p))*strength;
    ctx.strokeStyle = i%9===0 ? P.fg2 : i%4===0 ? P.paper : P.fg;
    ctx.lineWidth = .55 + p*.85; ctx.globalAlpha = alpha*.65;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(angle)*(radius-tail),cy+Math.sin(angle)*(radius-tail));
    ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
