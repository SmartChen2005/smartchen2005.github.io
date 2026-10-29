// Draw navigation arrows without a font glyph that iOS can present as emoji.
export const northEastArrow = '<svg class="site-arrow" data-site-arrow="north-east" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 12 12" aria-hidden="true" focusable="false" style="display:inline-block;width:1em;height:1em;vertical-align:-.125em;flex:none;fill:none;stroke:currentColor;stroke-width:1.15"><path d="M2.5 9.5 9.5 2.5M3 2.5h6.5V9"/></svg>';

export function normalizeSiteArrows(html) {
  // Change visible text only. Preserve attributes, source code and styles.
  return html.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]*>)/gi)
    .map(part => part.startsWith('<') ? part : part.replace(/\u2197[\uFE0E\uFE0F]?|&#(?:8599|x2197);/gi, northEastArrow)).join('');
}
