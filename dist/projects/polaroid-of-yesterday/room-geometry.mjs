// Screen corners measured against the uncropped 2048 × 1152 reference.
// The original asset is exactly twice this size; all points share the photo's space.
export const PHOTO = Object.freeze({ width: 2048, height: 1152 });
export const TV = Object.freeze({
  width: 588, height: 328,
  // A two-pixel upper-left overscan covers the still image's bright screen seam.
  corners: Object.freeze([[727, 281], [1317, 288], [1306, 616], [733, 611]].map(Object.freeze)),
});
export function fitPhoto(width, height) {
  const scale = Math.min(width / PHOTO.width, height / PHOTO.height);
  return { width: PHOTO.width * scale, height: PHOTO.height * scale, scale };
}
// Homography maps the video AND its controls into the physical screen's perspective.
export function screenMatrix() {
  const points = TV.corners.map(([x, y]) => [x - TV.corners[0][0], y - TV.corners[0][1]]);
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = points;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  return [
    (x1 - x0 + g * x1) / TV.width, (y1 - y0 + g * y1) / TV.width, 0, g / TV.width,
    (x3 - x0 + h * x3) / TV.height, (y3 - y0 + h * y3) / TV.height, 0, h / TV.height,
    0, 0, 1, 0, x0, y0, 0, 1,
  ];
}
