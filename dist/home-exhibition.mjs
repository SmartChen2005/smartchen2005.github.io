// The layout reserves the sentence's measured band; all prints retain their 3:2 ratio.
export function exhibitionLayout(width, height, band, ratios = [1.5, 1.5, 1.5, 1.5]) {
  const margin = Math.max(12, Math.min(width * .045, height * .045));
  const upper = Math.max(0, band.top - margin * 2);
  const lower = Math.max(0, height - band.bottom - margin * 2);
  const plans = [
    { x: .105, scale: .235, top: true, place: .16 },
    { x: .66, scale: .19, top: true, place: .78 },
    { x: .225, scale: .185, top: false, place: .8 },
    { x: .615, scale: .25, top: false, place: .06 },
  ];
  return plans.map((plan, index) => {
    const available = plan.top ? upper : lower;
    const w = Math.min(width * plan.scale, available * .76 * ratios[index]);
    const h = w / ratios[index];
    const start = plan.top ? margin : band.bottom + margin;
    return { x: width * plan.x, y: start + (available - h) * plan.place, width: w, height: h };
  });
}

export function createExhibition(root) {
  const prints = [...root.querySelectorAll('.gallery-print')];
  // Decode before enabling the development animation, including on a cold load.
  for (const print of prints) {
    const image = print.querySelector('img');
    const ready = () => print.classList.add('is-ready');
    if (image.complete && image.naturalWidth) ready();
    else image.decode().then(ready).catch(() => image.addEventListener('load', ready, { once: true }));
  }
  return {
    resize(width, height, band) {
      const ratios = prints.map(print => {
        const img = print.querySelector('img');
        return Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
      });
      exhibitionLayout(width, height, band, ratios).forEach((rect, index) => {
        const style = prints[index].style;
        style.left = `${rect.x}px`;
        style.top = `${rect.y}px`;
        style.width = `${rect.width}px`;
      });
    },
  };
}
