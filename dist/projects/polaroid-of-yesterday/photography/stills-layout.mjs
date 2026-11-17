// The prints follow an elliptical helix. The viewer travels along its axis.
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
export const spiralPortraitScale = 1.32;

export function spiralMetrics(width, height, count) {
  const printWidth = Math.min(450, width * .55, height * .90);
  return {
    printWidth,
    radius: Math.min(width * .24, printWidth * .68),
    depth: printWidth * 1.28,
    step: printWidth * .46 + 16,
    distance: Math.max(height, (count - 1) * clamp(printWidth * .90, 240, 390)),
    perspective: width <= 760 ? 680 : 920
  };
}

export function spiralPose(index, position, height, metrics, rotate) {
  const offset = index - position;
  const stagger = Math.sin(index * 2.39);
  const center = height * .045;
  const { printWidth, radius, depth, step } = metrics;
  if (!rotate) {
    return { x: stagger * printWidth * .13, y: offset * (printWidth * .76 + 22) - center,
      z: 0, rx: 0, ry: 0, rz: 0, width: printWidth, opacity: 1 };
  }
  // As a print approaches the center, it follows the arc around to face forward.
  const angle = offset * .9;
  const variation = (stagger - Math.sin(position * 2.39)) * step * .13;
  return { x: Math.sin(angle) * radius,
    y: offset * step + variation - center,
    z: (Math.cos(angle) - 1) * depth,
    rx: -Math.sin(angle) * 5,
    ry: clamp(angle * 180 / Math.PI, -90, 90),
    rz: stagger * Math.min(1, Math.abs(offset)) * 6,
    width: printWidth,
    opacity: clamp((1.48 - Math.abs(angle)) / .28) };
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
