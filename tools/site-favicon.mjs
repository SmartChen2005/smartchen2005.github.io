// One opaque white square for every live page; /favicon.ico also covers archived pages.
export const siteFavicon = (base = '') => `<link rel="icon" type="image/x-icon" href="${base}favicon.ico?rev=20261028-white">`;
