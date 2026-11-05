# Gotham web fonts

Source: user-provided `gotham.zip`, imported 2026-11-05. The unchanged original
archive is kept at `tools/font-sources/gotham.zip` in the repository.

Load the stylesheet when a page needs Gotham:

```html
<link rel="stylesheet" href="/assets/fonts/gotham/gotham.css">
```

```css
.your-element {
  font-family: 'Gotham', Arial, sans-serif;
  font-weight: 400;
}
```

Normal weights: 100 Thin, 200 Extra Light, 300 Light, 400 Book, 500 Medium,
700 Bold, 900 Black, 950 Ultra. Italic faces exist for 100, 200 and 700.
Other italic weights may be synthesized by browsers. Chinese characters use
the page's fallback fonts. Existing pages do not load this stylesheet yet.

The source mixes font versions and contains conflicting internal names:
`Gotham Regular.otf` identifies itself as Gotham-Black; `Gotham Italic.otf`
identifies itself as Gotham-BoldItalic; `Gotham Bold Italic.ttf` is another
version of Gotham-BoldItalic. These three files remain in the original archive
but are excluded from installation and the web family to prevent collisions.
Book supplies the normal 400 face; ItalicBold supplies the 700 italic face.
CSS weights follow the style names because the original files use legacy
numeric weight values. Font binaries and embedded names are otherwise preserved.

Rebuild with Python plus `fonttools[woff]`, running
`python tools/prepare-gotham.py`. `manifest.json` records source/output hashes.
The build decodes every WOFF2 and checks character maps and advance widths.

The archive contains a FontsGeek attribution page, not a webfont license.
No additional usage rights are asserted by this import.
