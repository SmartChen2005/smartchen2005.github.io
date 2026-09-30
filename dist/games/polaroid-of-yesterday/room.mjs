import { PHOTO, screenMatrix } from './room-geometry.mjs';

const room = document.querySelector('.room');
const screen = document.querySelector('.tv-screen');

screen.style.transform = `matrix3d(${screenMatrix().join(',')})`;
const syncScale = () => room.style.setProperty('--room-scale', room.getBoundingClientRect().width / PHOTO.width);
syncScale();
new ResizeObserver(syncScale).observe(room);

const download = document.querySelector('.download-entrance');
const note = document.querySelector('.download-note');
download.addEventListener('click', () => {
  const open = download.getAttribute('aria-expanded') !== 'true';
  download.setAttribute('aria-expanded', String(open));
  note.hidden = !open;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !note.hidden) {
    note.hidden = true;
    download.setAttribute('aria-expanded', 'false');
    download.focus();
  }
});
