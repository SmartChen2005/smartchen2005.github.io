import { PHOTO, screenMatrix } from './room-geometry.mjs';

const room = document.querySelector('.room');
const screen = document.querySelector('.tv-screen');

screen.style.transform = `matrix3d(${screenMatrix().join(',')})`;
const syncScale = () => room.style.setProperty('--room-scale', room.getBoundingClientRect().width / PHOTO.width);
syncScale();
new ResizeObserver(syncScale).observe(room);
