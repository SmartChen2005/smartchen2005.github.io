// Roughness only: no outlined circles, raised geometry or independent animation.
// Fixed, softly overlapping tool passes cover the full machined face.
// Uneven tool placement and diameter variation break row alignment at the same density.
// Overscan keeps the finish complete at every edge, without tiling an image.
const passes = [
  [-.036, -.026, .155, .76, .17], [.188, .066, .182, .74, .63],
  [.369, -.019, .158, .78, -.24], [.611, .044, .178, .75, .41],
  [.803, -.043, .16, .76, -.51], [1.024, .081, .174, .77, .89],
  [.031, .357, .177, .77, -.66], [.274, .273, .152, .74, .32],
  [.498, .407, .173, .76, -.12], [.692, .318, .16, .75, .76],
  [.934, .387, .183, .77, -.29], [1.137, .283, .158, .75, .58],
  [-.068, .716, .181, .76, -.82], [.157, .633, .166, .78, .21],
  [.397, .752, .18, .75, .53], [.577, .658, .151, .77, -.35],
  [.818, .789, .17, .74, .81], [1.052, .668, .167, .77, -.47],
  [.044, 1.055, .156, .75, .37], [.274, .962, .176, .77, -.73],
  [.471, 1.092, .165, .76, .68], [.702, .965, .18, .75, -.19],
  [.886, 1.062, .158, .77, .46], [1.124, 1.007, .171, .76, -.56],
];

// Reflection-only pigments: ice, cyan, lavender, violet, pink, champagne.
// This palette also supplies the broad studio reflection on the card face.
const spectrum = [[204,230,241],[183,220,230],[215,202,233],[193,179,217],[235,208,224],[236,225,201]];
export function titaniumReflection(phase) {
  const p = ((phase % 1 + 1) % 1) * spectrum.length;
  const low = Math.floor(p), t = p - low;
  return spectrum[low].map((value, i) => Math.round(value + (spectrum[(low + 1) % spectrum.length][i] - value) * t));
}
const spectrumLookup = Array.from({length:256},(_,i)=>titaniumReflection(i/256));

export function perlageSurface(width, height, ratio) {
  const field = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let density = 0, a = 0, b = 0, grain = 0, nearest = Infinity, fallbackAngle = 0;
    for (const [cx, cy, radius, weight, phase] of passes) {
      const dx = x / width - cx, dy = (y / height - cy) * ratio;
      const r = Math.hypot(dx, dy) / radius;
      if (r < nearest) { nearest = r; fallbackAngle = Math.atan2(dy, dx) + phase; }
      if (r >= 1) continue;
      const falloff = (1 - r * r) ** 2 * weight;
      const angle = Math.atan2(dy, dx) + phase;
      const abrasion = .88 + .12 * Math.sin(r * 160 + phase * 11);
      density += falloff;
      a += Math.cos(angle * 2) * falloff;
      b += Math.sin(angle * 2) * falloff;
      grain += abrasion * falloff;
    }
    const i = (y * width + x) * 4;
    // Consistent physical roughness; overlap changes local brushing direction,
    // not whether the left or right half has received a surface treatment.
    field[i] = Math.min(.85, .64 + density * .12);
    field[i + 1] = density ? a / density : Math.cos(fallbackAngle * 2);
    field[i + 2] = density ? b / density : Math.sin(fallbackAngle * 2);
    field[i + 3] = density ? grain / density : .88;
  }
  return field;
}

export function createPerlage(canvas) {
  const context = canvas?.getContext('2d');
  if (!context) return { resize() {}, draw() {} };
  let width = 0, height = 0, field = null, pixels = null;
  let horizontal = null, vertical = null;

  function resize(w, h) {
    // Viewport rotation/docking can briefly report an empty enclosure.
    // Keep the last valid sample until the existing layout settles.
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    const next = Math.max(1, Math.min(512, Math.round(w * Math.min(devicePixelRatio || 1, 1.5))));
    const nextHeight = Math.max(1, Math.round(next * h / w));
    if (width === next && height === nextHeight) return;
    canvas.width = width = next;
    canvas.height = height = nextHeight;
    pixels = context.createImageData(width, height);
    field = perlageSurface(width, height, h / w);
    horizontal = new Float32Array(width); vertical = new Float32Array(height);
  }

  function draw({ view, light, spectral }) {
    if (!pixels) return;
    const lx = light.x / 100, ly = light.y / 100;
    const angle = Math.atan2(.5 - ly, .52 - lx);
    const a = Math.cos(angle * 2), b = Math.sin(angle * 2);
    const inspection = Math.min(1, Math.hypot(view.x, view.y));
    for (let x = 0; x < width; x++) horizontal[x] = Math.exp(-(((x / width - lx) / .48) ** 2));
    for (let y = 0; y < height; y++) vertical[y] = Math.exp(-(((y / height - ly) / .9) ** 2));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const source = horizontal[x] * vertical[y];
      const satin = field[i + 1] * a + field[i + 2] * b;
      const strength = (.115 + inspection * .38 * source) * field[i] * field[i + 3];
      const highlight = Math.max(0, satin) ** 2;
      const shade = Math.max(0, -satin) * .25;
      // Color belongs to the moving, directional highlights, not the substrate.
      const phase = spectral.phase + field[i + 1] * .12 + field[i + 2] * .08;
      const color = spectrumLookup[Math.floor(((phase % 1 + 1) % 1) * 256)];
      const chroma = inspection * highlight * source;
      pixels.data[i] = satin >= 0 ? 255 + (color[0] - 255) * chroma : 77;
      pixels.data[i + 1] = satin >= 0 ? 255 + (color[1] - 255) * chroma : 78;
      pixels.data[i + 2] = satin >= 0 ? 255 + (color[2] - 255) * chroma : 74;
      pixels.data[i + 3] = Math.round(255 * strength * (highlight + shade));
    }
    context.putImageData(pixels, 0, 0);
  }
  return { resize, draw };
}
