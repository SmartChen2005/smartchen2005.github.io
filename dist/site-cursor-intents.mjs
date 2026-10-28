// Intent belongs to controls, not routes. This mirrors authored cursor rules
// into a private custom property so hiding the OS cursor never hides its meaning.
export function createCursorIntents(doc = document) {
  const win = doc.defaultView;
  const property = '--site-authored-cursor';
  const mirror = doc.createElement('style');
  mirror.dataset.cursorIntentRules = '';
  const actionableInputs = 'input:is([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"])';
  const native = 'textarea, select, input:not(:is([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"])), [contenteditable]:not([contenteditable="false"]), iframe, video[controls], audio[controls], [data-cursor-native]';
  const photo = 'a[data-preview], a[data-process-page], [data-lightbox], [data-zoom]';
  const action = `button, summary, [role="button"], [onclick], ${actionableInputs}`;
  const blocked = element => Boolean(element?.closest(':disabled, [aria-disabled="true"], [inert]'));

  function rules(sheet, seen = new Set()) {
    if (!sheet || sheet.disabled || sheet.ownerNode === mirror || seen.has(sheet)) return '';
    seen.add(sheet);
    let result = '';
    try {
      for (const rule of sheet.cssRules) {
        if (rule.styleSheet) {
          const nested = rules(rule.styleSheet, seen);
          result += rule.media?.mediaText ? `@media ${rule.media.mediaText}{${nested}}` : nested;
        } else if (rule.selectorText && rule.style) {
          const value = rule.style.getPropertyValue('cursor');
          // Shared cursor suppression must never become an intent rule.
          if (value && !rule.selectorText.includes('has-site-cursor') && !rule.selectorText.includes('has-home-cursor')) {
            result += `${rule.selectorText}{${property}:${value}${rule.style.getPropertyPriority('cursor') ? '!important' : ''}}`;
          }
        } else if (rule.cssRules) {
          const nested = rules({ cssRules: rule.cssRules }, seen);
          const header = rule.cssText.slice(0, rule.cssText.indexOf('{'));
          if (/^@(media|supports|container|layer)\b/.test(header)) result += `${header}{${nested}}`;
        }
      }
    } catch { /* Cross-origin styles retain semantic/data-cursor fallback. */ }
    return result;
  }
  function refresh() {
    const css = [...doc.styleSheets, ...(doc.adoptedStyleSheets || [])].map(sheet => rules(sheet)).join('\n');
    const changed = mirror.textContent !== css || !mirror.isConnected;
    if (mirror.textContent !== css) mirror.textContent = css;
    if (!mirror.isConnected) doc.head.append(mirror);
    if (changed) doc.dispatchEvent(new win.Event('site-cursor:intentschange'));
  }
  refresh();
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => { queued = false; refresh(); });
  };
  new MutationObserver(records => {
    if (records.some(record => !mirror.contains(record.target) && record.target !== mirror)) schedule();
  }).observe(doc.head, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['href', 'media', 'disabled'] });
  doc.addEventListener('load', event => { if (event.target.tagName === 'LINK') schedule(); }, true);
  doc.addEventListener('site-cursor:refresh', schedule);

  function source(element) {
    // Inline cursor declarations take part in the same browser cascade.
    for (let node = element; node instanceof win.Element; node = node.parentElement) {
      const value = node.style?.getPropertyValue('cursor');
      if (value) node.style.setProperty(property, value, node.style.getPropertyPriority('cursor'));
      else if (node.style?.getPropertyValue(property)) node.style.removeProperty(property);
    }
    const value = element ? win.getComputedStyle(element).getPropertyValue(property).trim() : '';
    return value.includes('url(') ? 'native' : value.split(',').at(-1).trim();
  }
  function dragOwner(element) {
    for (let node = element; node instanceof win.Element; node = node.parentElement) {
      if (blocked(node) || node.matches('[data-cursor="native"], [data-cursor-native]')) return null;
      if (node.matches('[data-cursor="drag"], [draggable="true"]') || /^(grab|grabbing|move)$/.test(source(node))) {
        // Prefer the actual authored scope over a child inheriting its cursor.
        let owner = node;
        while (owner.parentElement && /^(grab|grabbing|move)$/.test(source(owner.parentElement))) owner = owner.parentElement;
        return owner;
      }
    }
    return null;
  }
  function resolve(element) {
    if (!(element instanceof win.Element)) return { kind: 'dot', owner: null };
    if (blocked(element)) return { kind: 'dot', owner: null };
    if (element.closest(native)) return { kind: 'native', owner: null };
    const explicit = element.closest('[data-cursor]');
    if (explicit) {
      const kind = { zoom: 'magnify', action: 'button', link: 'link', drag: 'drag', native: 'native' }[explicit.dataset.cursor];
      if (kind) return { kind, owner: explicit };
    }
    const authored = source(element);
    if (/^(?:native|none|text|vertical-text|crosshair|not-allowed|wait|progress|[a-z-]*resize)$/.test(authored)) return { kind: 'native', owner: element };
    const image = element.closest(photo);
    const link = element.closest('a[href], area[href], [role="link"]');
    let imageURL = false;
    try { imageURL = link && /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(new URL(link.getAttribute('href') || '', doc.baseURI).pathname); } catch { /* Invalid links still retain their native activation. */ }
    if (image || imageURL || authored === 'zoom-in' || authored === 'zoom-out') return { kind: 'magnify', owner: image || link || element };
    const drag = dragOwner(element);
    if (drag) return { kind: 'drag', owner: drag };
    if (link) return { kind: 'link', owner: link };
    const control = element.closest(action);
    if (control || authored === 'pointer' || typeof element.onclick === 'function') return { kind: 'button', owner: control || element };
    return { kind: 'dot', owner: null };
  }
  return { resolve, dragOwner, source, refresh };
}
