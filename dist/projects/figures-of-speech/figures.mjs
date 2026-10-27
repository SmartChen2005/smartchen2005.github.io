import { studies, contextURL } from './catalogue.mjs';

const dialog = document.querySelector('.study-dialog');
const close = document.querySelector('#close-study');
const slot = document.querySelector('#frame-slot');
const stage = document.querySelector('.preview-stage');
const status = document.querySelector('#preview-status');
const start = document.querySelector('#start-preview');
const play = document.querySelector('#play-preview');
const reset = document.querySelector('#reset-preview');
let current, opener, frame, timeout, loadCount = 0;

function stopPreview() {
  clearTimeout(timeout);
  // Removing the browsing context also retires its graphics, timers and input listeners.
  frame?.remove(); frame = null; loadCount = 0;
  slot.replaceChildren();
  stage.setAttribute('aria-busy', 'false');
  status.textContent = '';
  start.hidden = false; start.disabled = false;
  play.hidden = true; reset.hidden = true;
  document.querySelector('#study-poster').hidden = false;
}

function openStudy(study, source) {
  stopPreview(); current = study; opener = source;
  stage.dataset.world = study.world;
  document.querySelector('#study-number').textContent = `FIG. ${study.id}`;
  document.querySelector('#study-title').textContent = study.title;
  const poster = document.querySelector('#study-poster');
  poster.src = `assets/${study.image}`; poster.alt = study.alt;
  document.querySelector('#preview-instruction').textContent = study.instruction;
  document.querySelector('#context-link').href = contextURL(study);
  for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== study.id;
  dialog.showModal(); dialog.scrollTop = 0; close.focus({preventScroll:true});
}

function startPreview() {
  stopPreview();
  start.hidden = true; reset.hidden = false;
  stage.setAttribute('aria-busy', 'true');
  status.textContent = 'Loading interaction…';
  const activeFrame = document.createElement('iframe');
  frame = activeFrame;
  activeFrame.title = `${current.title} — current interactive version`;
  activeFrame.src = contextURL(current);
  // Never grant sensors automatically. The homepage’s own explicit permission flow remains in charge.
  activeFrame.allow = 'fullscreen';
  activeFrame.addEventListener('load', () => {
    if (frame !== activeFrame || !dialog.open) return;
    clearTimeout(timeout); stage.setAttribute('aria-busy', 'false');
    loadCount++;
    let documentReady = false;
    try { documentReady = !!activeFrame.contentDocument?.body?.children.length; } catch { /* Full page link remains available. */ }
    if (!documentReady) { status.textContent = 'Preview unavailable. Open the full page to try it.'; return; }
    document.querySelector('#study-poster').hidden = true;
    status.textContent = '';
    play.hidden = !current.action || loadCount > 1;
    play.disabled = false;
    play.textContent = current.action === 'cars' ? 'Play film' : 'Play transition';
    // Escape in the child must also be able to dismiss the containing study.
    activeFrame.contentDocument.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); dialog.close(); }
    });
  });
  timeout = setTimeout(() => {
    if (frame !== activeFrame) return;
    stage.setAttribute('aria-busy', 'false');
    status.textContent = 'This preview is taking longer. Reset it or open the full page.';
  }, 12000);
  slot.append(activeFrame);
}

if (typeof dialog.showModal === 'function') {
  for (const link of document.querySelectorAll('[data-study]')) link.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const study = studies.find(item => item.id === link.dataset.study);
    if (!study) return;
    event.preventDefault(); openStudy(study, link);
  });
}
close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); } });
dialog.addEventListener('close', () => { stopPreview(); opener?.focus({preventScroll:true}); });
start.addEventListener('click', startPreview);
reset.addEventListener('click', startPreview);
play.addEventListener('click', () => {
  const target = frame?.contentDocument?.querySelector(`[data-identity="${current.action}"]`);
  if (target) { target.click(); play.hidden = true; frame.focus(); }
  else status.textContent = 'Open the full page to play this interaction.';
});
window.addEventListener('pagehide', stopPreview);

const viewSwitch = document.querySelector('.view-switch');
viewSwitch.hidden = false;
for (const button of viewSwitch.querySelectorAll('button')) button.addEventListener('click', () => {
  const chronology = button.dataset.view === 'chronology';
  document.querySelector('#index-view').hidden = chronology;
  document.querySelector('#chronology-view').hidden = !chronology;
  document.querySelector('#view-label').textContent = chronology ? 'Chronology' : 'Index';
  for(const item of viewSwitch.querySelectorAll('button')) item.setAttribute('aria-pressed',String(item===button));
});
