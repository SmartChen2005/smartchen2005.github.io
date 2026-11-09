import { hash, smooth } from '../halftone.mjs';

export const meta = {
  title: 'Exposure',
  description: 'Scattered pixels find their place. A photograph emerges from the noise.',
  duration: 8,
  posterTime: 8,
};

let photograph;
let preparation;
export function prepare() {
  if (photograph) return Promise.resolve();
  if (preparation) return preparation;
  preparation = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { photograph = image; resolve(); };
    image.onerror = () => { preparation = null; reject(new Error('The local photograph could not load.')); };
    image.src = new URL('../../../../assets/selfportrait-light.webp', import.meta.url).href;
  });
  return preparation;
}

export function drawSource(ctx, time, { width = 640, height = 640 } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  if (!photograph) return;
  // Preserve the complete photograph. Only its halftone rendition is animated.
  const imageWidth = width * .92;
  const imageHeight = imageWidth * photograph.naturalHeight / photograph.naturalWidth;
  const x = (width - imageWidth) / 2, y = (height - imageHeight) / 2;
  ctx.drawImage(photograph, x, y, imageWidth, imageHeight);
}

export function placeDot(point, time, grid, out) {
  const width = grid.columns * grid.pitch;
  const height = grid.rows * grid.pitch;
  const stagger = hash(point.column, point.row, 97) * .55;
  const assembly = smooth(.35 + stagger, 4.2 + stagger, time);
  const angle = hash(point.column, point.row, 19) * Math.PI * 2;
  const radius = width * (.16 + hash(point.column, point.row, 83) * .37);
  const initialX = width / 2 + Math.cos(angle) * radius;
  const initialY = height / 2 + Math.sin(angle) * radius * .8;
  const curl = Math.sin(assembly * Math.PI) * (1 - assembly) * width * .17;
  const x = initialX + (point.x - initialX) * assembly + Math.sin(angle + assembly * 5) * curl;
  const y = initialY + (point.y - initialY) * assembly + Math.cos(angle + assembly * 5) * curl;
  // Even the assembly travels on the same pixel lattice, then locks exactly.
  out[0] = assembly === 1 ? point.x : Math.round(x / grid.pitch) * grid.pitch;
  out[1] = assembly === 1 ? point.y : Math.round(y / grid.pitch) * grid.pitch;
}
