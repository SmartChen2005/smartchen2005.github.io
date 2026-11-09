import { studies, experimentURL, studyEdition } from './catalogue.mjs?rev=20261029-stories';

const dialog = document.querySelector('.study-dialog');
const close = document.querySelector('#close-study');
const slot = document.querySelector('#frame-slot');
const stage = document.querySelector('.preview-stage');
const status = document.querySelector('#preview-status');
let current, opener, frame, timeout;

function stopPreview() {
  clearTimeout(timeout);
  // Removing the browsing context also retires its graphics, timers and input listeners.
  frame?.remove(); frame = null;
  slot.replaceChildren();
  stage.setAttribute('aria-busy', 'false');
  status.textContent = '';
  document.querySelector('#study-poster').hidden = false;
}

function openStudy(study, source) {
  stopPreview(); current = study; opener = source;
  stage.dataset.world = study.world;
  document.querySelector('#study-number').textContent = `FIG. ${study.number}`;
  document.querySelector('#study-title').textContent = study.title;
  const poster = document.querySelector('#study-poster');
  poster.src = `assets/${study.image}`; poster.alt = study.alt;
  document.querySelector('#preview-instruction').textContent = study.instruction;
  document.querySelector('#new-page-link').href = experimentURL(study);
  for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== study.id;
  dialog.showModal(); dialog.scrollTop = 0; close.focus({preventScroll:true});
  startPreview();
}

function startPreview() {
  stopPreview();
  stage.setAttribute('aria-busy', 'true');
  status.textContent = 'Loading interaction…';
  const activeFrame = document.createElement('iframe');
  frame = activeFrame;
  activeFrame.title = `${current.title} — preserved ${studyEdition(current).slice(0,10)}`;
  activeFrame.src = experimentURL(current);
  // The preserved card retains its own explicit sensor-permission flow.
  activeFrame.allow = 'fullscreen';
  activeFrame.addEventListener('load', () => {
    if (frame !== activeFrame || !dialog.open) return;
    try { if (activeFrame.contentDocument?.body?.dataset.ready === 'true') revealPreview(); }
    catch { status.textContent = 'Preview unavailable. Use Open in New Page to reload the experiment.'; }
  });
  timeout = setTimeout(() => {
    if (frame !== activeFrame) return;
    stage.setAttribute('aria-busy', 'false');
    status.textContent = 'This experiment is taking longer to load. Use Open in New Page to reload it.';
  }, 12000);
  slot.append(activeFrame);
}

function revealPreview() {
  if(!frame || !dialog.open)return;
  clearTimeout(timeout);stage.setAttribute('aria-busy','false');
  frame.dataset.ready='true';status.textContent='';
  document.querySelector('#study-poster').hidden=true;
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
  if(event.data?.type==='figures-lab-ready')revealPreview();
  if(event.data?.type==='figures-lab-close')dialog.close();
});

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
