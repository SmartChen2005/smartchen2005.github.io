// Shared navigation and Gallery entrance for the Projects directory and landing pages.
export function projectHeader({ base = '../../', current = false, theme = 'dark', placement = '' } = {}) {
  return `<header class="project-header project-header--${theme}${placement ? ` project-header--${placement}` : ''}" data-project-header>
    <nav class="project-header__nav" aria-label="Primary navigation">
      <a href="${base}">VegShark.com</a>
      <a href="${current ? './' : '../'}"${current ? ' aria-current="page"' : ''}>Projects</a>
      <a class="project-header__gallery" href="${base}gallery/"><span class="project-header__gallery-mark" aria-hidden="true"><img src="${base}gallery/assets/mobius-outline.svg" width="164" height="55" alt="" decoding="async"></span><span>The Gallery</span></a>
    </nav>
  </header>`;
}

export const projectHeaderAssets = base => `<link rel="stylesheet" href="${base}project-header.css?v=20261027-aligned">
  <link rel="stylesheet" href="${base}gallery-entry.css?rev=20261024-shared-entry">
  <script type="module" src="${base}gallery-entry.mjs?rev=20261024-shared-entry"></script>`;
