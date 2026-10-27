// A viewfinder opens into an imagined art museum, then becomes the Gallery masthead.
export const PHOTO_TRANSITION_DURATION = 3000;
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const phase = (time, start, end) => ease((time - start) / (end - start));

export function photoTransitionFrame(time, width, height, origin, destination) {
  time = Math.max(0, Math.min(PHOTO_TRANSITION_DURATION, time));
  const open = phase(time, 0, 820), travel = phase(time, 640, 2040);
  const dock = phase(time, 1750, 2650);
  const center = { x: width / 2, y: height * .47 };
  const roomWidth = Math.min(width * .57, 820), roomHeight = Math.min(height * .49, 460);
  const room = { x: center.x - roomWidth / 2, y: center.y - roomHeight / 2, width: roomWidth, height: roomHeight };
  const source = { x: origin.left - 12, y: origin.top - 8, width: origin.width + 24, height: origin.height + 16 };
  const frame = {
    x: mix(source.x, room.x - roomWidth * travel * .8, open),
    y: mix(source.y, room.y - roomHeight * travel * .8, open),
    width: mix(source.width, roomWidth * (1 + travel * 1.6), open),
    height: mix(source.height, roomHeight * (1 + travel * 1.6), open),
  };
  // The original viewfinder passes beyond the viewport as the viewer enters the museum.
  const aperture = phase(time, 250, 1050);
  const rear = {
    x: mix(frame.x, -width * .12, aperture), y: mix(frame.y, -height * .12, aperture),
    width: mix(frame.width, width * 1.24, aperture), height: mix(frame.height, height * 1.24, aperture),
  };
  const brandWidth = Math.min(width - 36, 660);
  const brandHeight = brandWidth / 3;
  const brand = {
    x: mix(center.x - brandWidth / 2, destination.left, dock),
    y: mix(center.y - brandHeight / 2, destination.top, dock),
    width: mix(brandWidth, destination.width, dock),
    height: mix(brandHeight, destination.height, dock),
  };
  return {
    time, rear, brand, open, travel,
    homeOpacity: 1 - phase(time, 180, 540),
    whiteOpacity: phase(time, 160, 680) * (1 - phase(time, 2260, 2900)),
    roomOpacity: phase(time, 0, 160) * (1 - phase(time, 1850, 2440)),
    trace: phase(time, 690, 1570), brandOpacity: phase(time, 680, 950),
    titleOpacity: phase(time, 990, 1370),
    titleSize: mix(Math.min(68, width * .088), destination.fontSize, dock),
    reveal: phase(time, 2150, 2870),
  };
}

