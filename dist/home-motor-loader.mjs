// Keep the Three.js module graph and scene construction off the arrival path.
export function createDeferredMotorsport(canvas, options = {}, load = () => import('./home-motorsport.mjs?rev=20261027-restored')) {
  let motor = null, pending = null, active = false, playRequested = false;
  let width = 0, height = 0, band, aim = .5;
  function prepare() {
    if (motor || pending) return;
    pending = load().then(module => {
      motor = module.createMotorsport(canvas, options);
      if (width && height) motor.resize(width, height, band);
      motor.point(aim);
      motor.setActive(active);
      if (active && playRequested) motor.play();
      playRequested = false;
    }).catch(() => {
      pending = null;
      if (active) {
        document.body.dataset.motorFallback = 'true';
        options.onPlayback?.(false, 'unavailable');
      }
    });
  }
  return {
    resize(w, h, nextBand) { width = w; height = h; band = nextBand; motor?.resize(w, h, band); },
    point(value) { aim = value; motor?.point(value); },
    setActive(next, smoothExit = false) {
      active = next;
      if (!next) { playRequested = false; delete document.body.dataset.motorFallback; }
      if (motor) motor.setActive(next, smoothExit);
      else if (next) prepare();
    },
    play() { if (!active) return; if (motor) motor.play(); else { playRequested = true; prepare(); } },
    stop() { playRequested = false; motor?.stop(); },
  };
}
