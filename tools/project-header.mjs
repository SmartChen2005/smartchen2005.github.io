// Shared, static navigation for the Projects directory and project landing pages.
export function projectHeader({ base = '../../', current = false, theme = 'dark', placement = '' } = {}) {
  return `<header class="project-header project-header--${theme}${placement ? ` project-header--${placement}` : ''}" data-project-header>
    <nav class="project-header__nav" aria-label="Primary navigation">
      <a href="${base}">VegShark.com</a>
      <a href="${current ? './' : '../'}"${current ? ' aria-current="page"' : ''}>Projects</a>
      <a class="project-header__gallery" href="${base}gallery/"><img src="${base}gallery/assets/mobius-outline.svg" width="160" height="54" alt="" aria-hidden="true" decoding="async"><span>The Gallery</span></a>
    </nav>
  </header>`;
}

export const projectHeaderStylesheet = base => `<link rel="stylesheet" href="${base}project-header.css">`;
