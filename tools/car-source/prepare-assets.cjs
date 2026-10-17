// Packaging only: preserve the photographs' complete ratios and generated alpha.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const destination = path.resolve(__dirname, '../../dist/assets/cars');
const originals = process.env.CAR_PHOTO_DIRECTORY || 'C:/Users/15811/Downloads/cars';
const atlas = process.env.CAR_SPRITE_ATLAS || path.join(__dirname, 'vehicle-atlas.png');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
async function main() {
  fs.mkdirSync(destination, { recursive: true });
  const assets = [];
  for (const [name, number] of [['z4-night',111], ['mini-tree',120], ['mini-city',119], ['garage',118]]) {
    const original = `Weixin Image_20261017144451_${number}_1.jpg`;
    const input = fs.readFileSync(path.join(originals, original));
    const output = await sharp(input).rotate().resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    fs.writeFileSync(path.join(destination, `${name}.webp`), output);
    assets.push({ file: `${name}.webp`, original, sourceSHA256: hash(input), sha256: hash(output), bytes: output.length });
  }
  if (!atlas) throw new Error('Set CAR_SPRITE_ATLAS to the generated transparent atlas.');
  const input = fs.readFileSync(atlas), metadata = await sharp(input).metadata();
  for (const [name, row] of [['z4',0], ['mini',1]]) {
    const top = Math.floor(metadata.height / 2) * row;
    const cell = await sharp(input).extract({ left: 0, top, width: metadata.width, height: Math.floor(metadata.height / 2) }).png().toBuffer();
    const output = await sharp(cell).trim({ background: '#00000000', threshold: 8 })
      .resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
    fs.writeFileSync(path.join(destination, `${name}.webp`), output);
    assets.push({ file: `${name}.webp`, original: path.basename(atlas), sourceSHA256: hash(input), sha256: hash(output), bytes: output.length });
  }
  fs.writeFileSync(path.join(__dirname, 'assets.json'), JSON.stringify({ date: '2026-10-17', origin: 'Owner-supplied car photographs; transparent side elevations made with built-in ImageGen using 111 and 120 as identity references.', assets }, null, 2) + '\n');
  console.log(assets.map(a => `${a.file}: ${a.bytes} bytes`).join('\n'));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
