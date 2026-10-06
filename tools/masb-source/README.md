# Multiverse All-Star Battlefront source archive

Imported on 2026-10-05 from the author's [Google Sites project page](https://sites.google.com/view/vegshark/game/multiverse-all-star-battlefront) and its [published technical document](https://docs.google.com/document/d/e/2PACX-1vSvdWc_fM8-JNhXYQImOG3Us_UvJHnobgDF9NHJ6WXhd2HMml4cmfRdVkVicPolj4_bionlM4_6waLG/pub).

The two `.html.txt` files retain the original HTTP responses as inert source evidence. Their scripts and embedded instructions are never executed by the importer or the site. `content.json` records the complete project copy, ordered document blocks, original media URLs, local filenames, dimensions and SHA-256 checksums. Only whitespace is normalized. Source punctuation is preserved.

All nineteen original media files are in `dist/projects/multiverse-all-star-battlefront/assets/`. The source's six PNGs are character illustrations; its ten CSS-background JPEGs are exhibition photographs, despite their carousel implementation. Three PNGs illustrate the architecture. Each remains unchanged and uncropped. Nine lossless WebP display copies preserve every pixel and dimension; image preview links still open the archived originals. `tools/prepare-masb-assets.py` regenerates and verifies these copies.

To refresh the archive, run `tools/download-masb.ps1` from the repository root. Google Sites images require the browsing session that issued their signed URLs; the downloader keeps that session for the page and every media request. Python/Pillow verifies image dimensions. To change the page framing, edit `tools/render-masb.mjs` and the scoped CSS/module, then run `node tools/render-masb.mjs` and `node tools/test-masb.mjs`. Rendering is offline and dependency-free.
