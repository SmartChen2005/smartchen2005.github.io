import fs from 'node:fs';

// A shallow elliptical cylinder: the middle recedes, the sides approach the viewer.
function sky(width, height, columns, pitch) {
  const angle = 1.16, camera = 2.8, depth = 1.2;
  const edge = Math.sin(angle) / (camera + depth * Math.cos(angle));
  const dots = [];
  for (let column = -columns; column <= columns; column++) {
    const theta = column / columns * angle;
    const distance = camera + depth * Math.cos(theta);
    const scale = (camera + depth) / distance;
    const x = width / 2 + width * .49 * (Math.sin(theta) / distance) / edge;
    for (let row = -24; row <= 24; row++) {
      const y = height * .36 + row * pitch * scale;
      if (y < -3 || y > height + 3) continue;
      dots.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(.65 * scale).toFixed(2)}" opacity="${(.58 + (scale - 1) * .3).toFixed(2)}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><g fill="white">${dots.join('')}</g></svg>\n`;
}
fs.writeFileSync('dist/projects/assets/curved-sky.svg', sky(1600, 1000, 12, 66));
fs.writeFileSync('dist/projects/assets/curved-sky-mobile.svg', sky(480, 1000, 4, 72));
console.log('Rendered static shallow concave sky: desktop and phone.');
