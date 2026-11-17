// Real world-space positions: x/z describe a circle; y advances along its axis.
// Both views use the same photographs and the same perspective camera.
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export function spiralMetrics(width, height, count) {
  const printWidth = Math.min(410, width * .45, height * 1.12);
  const radius = Math.min(275, width * .175);
  const step = printWidth * .67 + 18;
  const end = Math.max(0, (count - 1) * step);
  const start = Math.min(end, step * .46, height * .16);
  return { radius, step, start, end, printWidth,
    distance: Math.max(height, (end - start) * 1.55), perspective: width > 1600 ? 1800 : width <= 760 ? 1000 : 1500 };
}

export function spiralPose(index, progress, width, height, count, { rotate = true } = {}) {
  const m = spiralMetrics(width, height, count);
  const angle = 1.38 + index * .99 - (rotate ? progress * 2.4 : 0);
  const z = Math.sin(angle) * m.radius * .55;
  // Counter the perspective change in print width and vertical spacing.
  const depthScale = 1 - z / m.perspective;
  const y = index * m.step - (m.start + progress * (m.end - m.start)) - height * .06;
  return { x: Math.cos(angle) * m.radius,
    y: y * depthScale,
    z, rx: Math.sin(angle) * 3, ry: Math.cos(angle) * -11, rz: 0,
    width: m.printWidth * depthScale };
}

export function galleryLayout(width, height, photos, viewportWidth = width, options = {}) {
  const margin = width <= 700 ? 18 : clamp(width * .03, 24, 48);
  const columns = viewportWidth >= 1440 ? 4 : viewportWidth >= 1024 ? 3 : 2;
  const gap = width <= 700 ? 16 : 24;
  const printWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  const slotHeight = printWidth * (options.referenceRatio || 4 / 3);
  const rowGap = width <= 700 ? 32 : 44;
  // The mobile Gallery/Polaroid breadcrumb occupies a second navigation row.
  const top = options.top ?? (height < 500 ? 100 : width <= 700 ? 240 : 230);
  const captionHeight = items => options.captions === false ? 0 : Math.max(64, ...items.map(photo =>
    10 + (Math.ceil((photo.title || '').length * 8 / printWidth) + Math.ceil((photo.kind || '').length * 8 / printWidth)) * 18));
  const items = [];
  let rowTop = top;
  for (let index = 0; index < photos.length; index++) {
    const column = index % columns, row = Math.floor(index / columns);
    if (column === 0 && row > 0) {
      const previous = photos.slice(index - columns, index);
      const captionSpace = captionHeight(previous);
      rowTop += slotHeight + captionSpace + rowGap;
    }
    items.push({ x: margin + column * (printWidth + gap) + printWidth / 2 - width / 2,
      y: rowTop + slotHeight / 2,
      z: 0, rx: 0, ry: 0, rz: 0, width: printWidth });
  }
  const lastRow = photos.slice(Math.floor(Math.max(0, photos.length - 1) / columns) * columns);
  const finalCaption = captionHeight(lastRow);
  return { items, columns, slotHeight, height: Math.max(height + 1, rowTop + slotHeight + finalCaption + rowGap + 60) };
}

export function interpolatePose(from, to, amount) {
  return Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}
