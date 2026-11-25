const demo = document.querySelector('#drive-demo');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let resume = !motion.matches;

const playDemo = () => {
  if (resume) demo.play().catch(() => {});
  resume = false;
};

if ('IntersectionObserver' in window) {
  const visibleFraction = .15;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio >= visibleFraction) playDemo();
    else if (!demo.paused) {
      resume = true;
      demo.pause();
    }
  }, { threshold: visibleFraction });
  observer.observe(demo);
} else playDemo();

motion.addEventListener('change', ({ matches }) => {
  if (!matches) return;
  resume = false;
  demo.pause();
});
