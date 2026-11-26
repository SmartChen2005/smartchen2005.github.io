export const PEEL_DURATION = .94;
export const PAPER_SLOPE = .9;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (start, end, progress) => start + (end - start) * progress;

export function paperPeelFrame(width, height, progress) {
  const corners = [[0, 0], [width, 0], [width, height], [0, height]];
  const angle = Math.atan2(-PAPER_SLOPE, 1);
  const nx = Math.cos(angle), ny = Math.sin(angle);
  const t = clamp(progress, 0, 1);
  const eased = t * t * (3 - 2 * t);
  const edge = width * nx * (1 - eased) + height * ny * eased;
  const paper = [], crossing = [];
  corners.forEach((point, index) => {
    const next = corners[(index + 1) % corners.length];
    const distance = point[0] * nx + point[1] * ny - edge;
    const nextDistance = next[0] * nx + next[1] * ny - edge;
    if (distance <= 0) paper.push(point);
    if ((distance <= 0) === (nextDistance <= 0)) return;
    const ratio = distance / (distance - nextDistance);
    const intersection = [mix(point[0], next[0], ratio), mix(point[1], next[1], ratio)];
    paper.push(intersection);
    crossing.push(intersection[0] * -ny + intersection[1] * nx);
  });
  const depth = Math.sin(Math.PI * t) ** .43 * clamp(Math.min(width, height) * .071, 23, 70);
  const [a = 0, b = 0] = crossing;
  return { paper, angle, edge, depth, start: Math.min(a, b), end: Math.max(a, b) };
}

export function prepareCanvas(canvas, context, width, height) {
  const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3_200_000 / (width * height)));
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
}

function drawCurl(context, { angle, edge, depth, start, end }, paper) {
  if (depth < .5 || end - start < 1) return;
  context.save();
  context.rotate(angle);
  context.translate(edge, 0);
  const shadow = context.createLinearGradient(0, 0, depth * 1.4, 0);
  shadow.addColorStop(0, '#211d1955');
  shadow.addColorStop(.44, '#211d1926');
  shadow.addColorStop(1, '#211d1900');
  context.fillStyle = shadow;
  context.fillRect(0, start - depth, depth * 1.4, end - start + depth * 2);

  // The fold's cross section rolls from the sheet into a lit crest, then doubles underneath.
  const face = context.createLinearGradient(-depth, 0, depth * .44, 0);
  face.addColorStop(0, paper);
  face.addColorStop(.21, '#e2e0da');
  face.addColorStop(.49, '#fffefa');
  face.addColorStop(.67, '#f4f1e9');
  face.addColorStop(.90, '#c4c0b5');
  face.addColorStop(1, '#8e897d');
  context.fillStyle = face;
  context.beginPath();
  context.roundRect(-depth, start - depth * .78, depth * 1.44, end - start + depth * 1.56, depth * .46);
  context.fill();
  context.restore();
}

export function paperClipPath(points, offsetY = 0) {
  return `polygon(${points.map(([x, y]) => `${x}px ${y + offsetY}px`).join(',')})`;
}

export function createPaperCurl(width, height, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;
  canvas.setAttribute('aria-hidden', 'true');
  prepareCanvas(canvas, context, width, height);
  return { canvas, paint(progress) {
    const geometry = paperPeelFrame(width, height, progress);
    context.clearRect(0, 0, width, height);
    drawCurl(context, geometry, color);
    return geometry.paper;
  } };
}
