export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const spiralPortraitScale = 1.32;

export function spiralMetrics(width, height, count) {
  const printWidth = Math.min(450, width * .55, height * .90);
  const span = Math.min(width * .43, 1050);
  return {
    printWidth,
    span,
    shoulder: Math.min(printWidth * .67, span * .84),
    amplitude: Math.min(height * .18, printWidth * .42),
    distance: Math.max(height, (count - 1) * clamp(printWidth * .90, 240, 390)),
    perspective: width <= 760 ? 680 : 920
  };
}

export function spiralPose(index, position, height, metrics, rotate) {
  const offset = index - position;
  const stagger = Math.sin(index * 2.39);
  const { printWidth, span, shoulder, amplitude, perspective } = metrics;
  if (!rotate) {
    return { x: stagger * printWidth * .13, y: offset * (printWidth * .76 + 22) - height * .045,
      z: 0, rx: 0, ry: 0, rz: 0, width: printWidth, opacity: 1 };
  }
  const distance = Math.abs(offset);
  const side = Math.sign(offset);
  const inner = clamp(distance);
  // Give the two lead prints separate screen space before their depth order switches.
  const across = shoulder * (1 - (1 - inner) ** 2.3) + (span - shoulder) * clamp((distance - 1) / 2.8);
  const wavePhase = Math.min(distance / 1.22, 2) * Math.PI;
  const lift = (1 - Math.cos(wavePhase)) * amplitude;
  const edge = clamp(distance - 2);
  const edgeDrop = edge ** 2 * (3 - 2 * edge) * amplitude * .52;
  const variation = (stagger * inner + Math.sin(offset * .92)) * amplitude * .085;
  const recession = 1 - Math.exp(-distance * 1.3);
  const z = -printWidth * .75 * recession;
  const depthScale = 1 - z / perspective;
  const scale = .23 + .77 * Math.exp(-.52 * distance ** 2);
  const turn = recession * 60 * (1 - .78 * clamp((distance - 1) / 2.1));
  return {
    x: side * across * depthScale,
    y: (height * .10 - lift + edgeDrop + variation) * depthScale,
    z,
    rx: Math.sin(offset * 1.75) * -8,
    ry: side * turn,
    rz: stagger * inner * 7,
    width: printWidth * scale * depthScale,
    opacity: clamp((3.8 - distance) / .65)
  };
}

export function galleryLayout(width, height, photos, viewportWidth = width, options = {}) {
  const margin = width <= 700 ? 18 : clamp(width * .03, 24, 48);
  const columns = viewportWidth >= 1440 ? 4 : viewportWidth >= 1024 ? 3 : 2;
  const gap = width <= 700 ? 16 : 24;
  const printWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  const baseHeight = printWidth * (options.referenceRatio || 4 / 3);
  const printHeight = photo => baseHeight * (photo.height > photo.width ? options.portraitScale ?? 1 : 1);
  const rowGap = width <= 700 ? 32 : 44;
  // The mobile Gallery/Polaroid breadcrumb occupies a second navigation row.
  const top = options.top ?? (height < 500 ? 100 : width <= 700 ? 240 : 230);
  const captionHeight = items => options.captions === false ? 0 : Math.max(64, ...items.map(photo =>
    10 + (Math.ceil((photo.title || '').length * 8 / printWidth) + Math.ceil((photo.kind || '').length * 8 / printWidth)) * 18));
  const items = [];
  let rowTop = top;
  for (let index = 0; index < photos.length; index += columns) {
    const row = photos.slice(index, index + columns);
    const rowHeight = Math.max(...row.map(printHeight));
    row.forEach((_, column) => {
      items.push({ x: margin + column * (printWidth + gap) + printWidth / 2 - width / 2,
        y: rowTop + rowHeight / 2,
        z: 0, rx: 0, ry: 0, rz: 0, width: printWidth, opacity: 1 });
    });
    rowTop += rowHeight + captionHeight(row) + rowGap;
  }
  return { items, columns, height: Math.max(height + 1, rowTop + 60) };
}

export function interpolatePose(from, to, amount) {
  return Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}
