// Roughness only: no outlined circles, raised geometry or independent animation.
// Unequal, softly overlapping tool passes leave generous unworked areas.
const passes = [
  [.12, .20, .135, .40, .17], [.29, .15, .15, .65, .63],
  [.45, .27, .125, .48, -.24], [.63, .18, .16, .76, .41],
  [.82, .30, .13, .62, -.51], [.95, .11, .14, .32, .89],
  [.22, .45, .155, .56, -.66], [.39, .55, .13, .35, .32],
  [.69, .51, .145, .58, -.12], [.91, .64, .17, .77, .76],
  [.08, .78, .14, .25, -.29], [.27, .83, .16, .40, .58],
  [.58, .91, .135, .28, -.82], [.77, .88, .16, .62, .21],
];

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
    field = new Float32Array(width * height * 4);
    horizontal = new Float32Array(width); vertical = new Float32Array(height);
    const ratio = h / w;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      let density = 0, a = 0, b = 0, grain = 0;
      for (const [cx, cy, radius, weight, phase] of passes) {
        const dx = x / width - cx, dy = (y / height - cy) * ratio;
        const r = Math.hypot(dx, dy) / radius;
        if (r >= 1) continue;
        const falloff = (1 - r * r) ** 2 * weight;
        const angle = Math.atan2(dy, dx) + phase;
        // Fine circular abrasion, softened below the threshold of a drawn ring.
        const abrasion = .88 + .12 * Math.sin(r * 160 + phase * 11);
        density += falloff;
        a += Math.cos(angle * 2) * falloff;
        b += Math.sin(angle * 2) * falloff;
        grain += abrasion * falloff;
      }
      const i = (y * width + x) * 4;
      field[i] = Math.min(.9, density);
      // Direction and groove response are independent of pass coverage.
      // Apply coverage once below, rather than dimming it again in the BRDF.
      field[i + 1] = density ? a / density : 0;
      field[i + 2] = density ? b / density : 0;
      field[i + 3] = density ? grain / density : 0;
    }
  }

  function draw({ view, light }) {
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
      const strength = (.012 + inspection * .27) * source * field[i] * field[i + 3];
      const highlight = Math.max(0, satin) ** 2;
      const shade = Math.max(0, -satin) * .28;
      // A trace of cool interference appears only in the strongest reflection.
      const spectral = inspection * highlight * source;
      pixels.data[i] = satin >= 0 ? 255 - spectral * 9 : 77;
      pixels.data[i + 1] = satin >= 0 ? 255 - spectral * 5 : 78;
      pixels.data[i + 2] = satin >= 0 ? 255 : 74;
      pixels.data[i + 3] = Math.round(255 * strength * (highlight + shade));
    }
    context.putImageData(pixels, 0, 0);
  }
  return { resize, draw };
}
