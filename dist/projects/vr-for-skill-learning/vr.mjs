import data from './interaction-data.mjs';

// Both studies use native buttons: Tab/Enter/Space, plus optional arrow navigation.
function connectStudy(root, selector, render) {
  if (!root) return;
  const buttons = [...root.querySelectorAll(selector)];
  function select(button) {
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button));
    render(button);
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = buttons.indexOf(button);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      select(buttons[next]);
    });
  }
}

const procedure = document.querySelector('[data-procedure]');
connectStudy(procedure, '[data-step-button]', button => {
  const index = Number(button.dataset.stepButton);
  procedure.dataset.step = String(index);
  document.getElementById('procedure-caption').textContent = data.steps[index].description;
});
const navigation = document.querySelector('[data-navigation]');
connectStudy(navigation, '[data-space-button]', button => {
  const space = data.spaces.find(item => item.id === button.dataset.spaceButton);
  navigation.dataset.space = space.id;
  document.getElementById('space-caption').textContent = space.description;
});
