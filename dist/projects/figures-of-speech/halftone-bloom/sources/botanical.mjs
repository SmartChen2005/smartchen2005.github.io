export const meta = {
  title: 'Botanical',
  description: 'A closed bud unfolds into a flower, one layer of paper-thin petals at a time.',
  duration: 10,
  posterTime: 10,
};

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const gray = value => { const v = Math.round(value); return `rgb(${v},${v},${v})`; };
const random = (index, seed) => {
  let n = Math.imul(index + 1, 374761393) ^ Math.imul(seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};

function leaf(ctx, x, y, angle, length, breadth, light) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const shade = ctx.createLinearGradient(-breadth, 0, breadth, -length);
  shade.addColorStop(0, gray(light * .24));
  shade.addColorStop(.47, gray(light));
  shade.addColorStop(.53, gray(light * .66));
  shade.addColorStop(1, gray(light * .18));
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-breadth, -length * .23, -breadth * .58, -length * .74, 0, -length);
  ctx.bezierCurveTo(breadth * .42, -length * .68, breadth * .83, -length * .2, 0, 0);
  ctx.fill();
  ctx.strokeStyle = gray(light * .7);
  ctx.lineWidth = .0018;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-.005, -length * .46, 0, -length * .96);
  ctx.stroke();
  ctx.lineWidth = .0007;
  ctx.strokeStyle = gray(light * .43);
  for (let vein = 1; vein <= 8; vein++) {
    const t = vein / 10;
    const spread = Math.sin(t * Math.PI) * breadth * .6;
    ctx.beginPath();
    ctx.moveTo(0, -length * t);
    ctx.quadraticCurveTo(-spread * .52, -length * (t + .035), -spread, -length * (t + .13));
    ctx.moveTo(0, -length * t);
    ctx.quadraticCurveTo(spread * .4, -length * (t + .035), spread * .72, -length * (t + .11));
    ctx.stroke();
  }
  ctx.restore();
}

function petalPath(ctx, length, breadth, curl, lean) {
  ctx.beginPath();
  ctx.moveTo(-breadth * .08, .012);
  ctx.bezierCurveTo(-breadth * .76, -length * .16, -breadth * .9 + lean, -length * .7, lean - breadth * .35, -length * .96);
  ctx.bezierCurveTo(lean - breadth * .13, -length * (1.06 + curl), lean + breadth * .55, -length * (1.07 - curl), lean + breadth * .58, -length * .87);
  ctx.bezierCurveTo(breadth * .9 + lean, -length * .53, breadth * .58, -length * .12, breadth * .08, .012);
  ctx.closePath();
}

function petal(ctx, { angle, length, breadth, lean, curl, brightness, opening, ring }) {
  ctx.save();
  // The bud is upright and narrow. Each ring opens at its own rate and takes on
  // the radial projection of an open peony, with a small asymmetric lean.
  const spread = .10 + opening * .90;
  const a = angle * spread;
  ctx.rotate(a);
  ctx.translate(0, -(.008 + ring * .003) * opening);
  const projectedLength = length * (.43 + opening * .57);
  const projectedWidth = breadth * (.20 + opening * .80);
  const bend = lean * opening;
  petalPath(ctx, projectedLength, projectedWidth, curl * opening, bend);
  const light = ctx.createLinearGradient(-projectedWidth * .6, -projectedLength, projectedWidth * .65, .025);
  light.addColorStop(0, gray(brightness * .72));
  light.addColorStop(.23, gray(brightness));
  light.addColorStop(.55, gray(brightness * .79));
  light.addColorStop(.82, gray(brightness * .41));
  light.addColorStop(1, gray(brightness * .12));
  ctx.fillStyle = light;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // The soft central fold supplies real tone for the halftone screen, while the
  // hairline veins keep the enlarged final frame botanical rather than geometric.
  const fold = ctx.createLinearGradient(-projectedWidth * .22, 0, projectedWidth * .32, 0);
  fold.addColorStop(0, 'rgba(0,0,0,0)');
  fold.addColorStop(.48, 'rgba(0,0,0,.15)');
  fold.addColorStop(.57, 'rgba(255,255,255,.12)');
  fold.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fold;
  ctx.fillRect(-projectedWidth, -projectedLength * 1.2, projectedWidth * 2, projectedLength * 1.3);
  for (let vein = -3; vein <= 3; vein++) {
    ctx.beginPath();
    ctx.moveTo(vein * projectedWidth * .015, .01);
    ctx.bezierCurveTo(vein * projectedWidth * .09, -projectedLength * .32,
      vein * projectedWidth * .16 + bend * .65, -projectedLength * .66,
      vein * projectedWidth * .12 + bend, -projectedLength * .97);
    ctx.strokeStyle = vein % 2 ? 'rgba(0,0,0,.13)' : 'rgba(255,255,255,.13)';
    ctx.lineWidth = .0009;
    ctx.stroke();
  }
  ctx.restore();
  petalPath(ctx, projectedLength, projectedWidth, curl * opening, bend);
  ctx.lineWidth = .00115;
  ctx.strokeStyle = gray(brightness * .84);
  ctx.stroke();
  // A curled edge cuts a narrow shadow beneath a pale rim.
  ctx.beginPath();
  ctx.moveTo(bend - projectedWidth * .35, -projectedLength * .96);
  ctx.bezierCurveTo(bend - projectedWidth * .08, -projectedLength * .87,
    bend + projectedWidth * .28, -projectedLength * .83,
    bend + projectedWidth * .58, -projectedLength * .87);
  ctx.strokeStyle = gray(brightness * .45);
  ctx.lineWidth = .002;
  ctx.stroke();
  ctx.restore();
}

export function drawSource(ctx, time, { width = 640, height = 640, seed = 29 } = {}) {
  const seconds = Math.max(0, Math.min(meta.duration, time));
  const growth = smooth((seconds - .55) / 7.9);
  ctx.save();
  ctx.scale(width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1, 1);

  // The living support is intentionally quieter than the pale flower head.
  const stemLight = ctx.createLinearGradient(.48, .5, .52, .88);
  stemLight.addColorStop(0, '#8f8f8f');
  stemLight.addColorStop(.4, '#757575');
  stemLight.addColorStop(1, '#303030');
  ctx.beginPath();
  ctx.moveTo(.5, .43);
  ctx.bezierCurveTo(.494, .61, .535, .71, .497, .91);
  ctx.strokeStyle = stemLight;
  ctx.lineWidth = .008;
  ctx.lineCap = 'round';
  ctx.stroke();
  leaf(ctx, .512, .755, -1.03, .235, .057, 127);
  leaf(ctx, .505, .837, 1.03, .183, .041, 102);
  leaf(ctx, .51, .643, .90, .163, .033, 88);

  ctx.translate(.5, .397 + (1 - growth) * .024);
  ctx.scale(1, .86 + (1 - growth) * .14);
  // A dark calyx remains visible underneath the unfurling lower petals.
  for (let sepal = 0; sepal < 6; sepal++) {
    leaf(ctx, 0, .044, (sepal - 2.5) * .62 + Math.PI,
      .07 + growth * .037, .019, 95 + sepal * 8);
  }
  const rings = [13, 15, 16, 14, 11, 8];
  let index = 0;
  for (let ring = 0; ring < rings.length; ring++) {
    const count = rings[ring];
    const ringOpen = smooth((seconds - .5 - ring * .36) / (5.1 + ring * .22));
    for (let n = 0; n < count; n++, index++) {
      const jitter = random(index + 19, seed) - .5;
      const angle = (n / count * Math.PI * 2 + ring * .37 + jitter * .13) - Math.PI;
      const length = (.288 - ring * .031) * (.91 + random(index + 91, seed) * .16);
      const breadth = (.098 - ring * .009) * (.86 + random(index + 171, seed) * .29);
      const directionalLight = .85 + Math.cos(angle + .8) * .13;
      petal(ctx, {
        angle,
        length,
        breadth,
        lean: (random(index + 231, seed) - .5) * .045,
        curl: .035 + random(index + 301, seed) * .04,
        brightness: (211 + random(index + 361, seed) * 40) * directionalLight,
        opening: ringOpen,
        ring,
      });
    }
  }

  // The irregular heart opens last; it never becomes a flat white disk.
  const heart = smooth((seconds - 5.5) / 2.7);
  const core = ctx.createRadialGradient(-.005, -.007, .001, 0, 0, .039);
  core.addColorStop(0, '#d4d4d4');
  core.addColorStop(.35, '#777');
  core.addColorStop(1, '#1a1a1a');
  ctx.beginPath();
  ctx.ellipse(0, 0, .019 + heart * .016, .023 + heart * .01, -.2, 0, Math.PI * 2);
  ctx.fillStyle = core;
  ctx.fill();
  for (let stamen = 0; stamen < 42; stamen++) {
    const a = stamen * 2.399963;
    const r = Math.sqrt(stamen / 42) * .029 * heart;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    ctx.strokeStyle = gray(120 + random(stamen + 400, seed) * 75);
    ctx.lineWidth = .0011;
    ctx.beginPath();
    ctx.moveTo(x * .55, y * .55);
    ctx.lineTo(x, y - .007 * heart);
    ctx.stroke();
    ctx.fillStyle = gray(180 + random(stamen + 470, seed) * 65);
    ctx.beginPath();
    ctx.ellipse(x, y - .007 * heart, .0017, .0026, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
