import { installPhotoTransition } from './home-photo-transition.mjs?rev=20261024-shared-entry';

// Gallery's own article/category navigation stays within the exhibition.
const galleryPath = new URL('./gallery/', import.meta.url).pathname;
if (!location.pathname.startsWith(galleryPath)) {
  const link = document.querySelector('[data-project-header] .project-header__gallery');
  if (link) installPhotoTransition(link);
}
