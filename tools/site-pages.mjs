// Standalone imports retain their authored HTML, styles, scripts and metadata.
export const isStandalonePage = file => /(?:^|\/)projects\/gran-turismo\/index\.html$/.test(file.replaceAll('\\', '/'));
