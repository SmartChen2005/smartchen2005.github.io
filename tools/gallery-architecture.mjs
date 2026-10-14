// Static, unfilled exhibition-room drawing for the Gallery footer.

export function renderExhibitionRoom() {
  const project = ([x, y, z]) => [64 + (x - z) * 15, 80 + (x + z) * 4.8 - y * 15];
  const paths = [];
  const line = (points, detail = false) => {
    const d = points.map((point, i) => `${i ? 'L' : 'M'}${project(point).map(v => v.toFixed(2)).join(' ')}`).join('');
    paths.push(`<path d="${d}"${detail ? ' opacity=".55"' : ''}/>`);
  };
  const rectangle = (x1, x2, y1, y2, z) => line([[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z],[x1,y1,z]]);
  // Open roof, cornice and two walls; the floor remains a white paper plane.
  line([[0,0,4],[0,0,0],[6,0,0],[6,0,4],[0,0,4]]);
  line([[0,0,0],[0,4,0],[6,4,0],[6,4,4],[6,0,4]]);
  line([[0,3.78,0],[6,3.78,0],[6,3.78,4]]);
  line([[0,3.55,0],[6,3.55,0],[6,3.55,4]], true);
  for (const x of [1.5,3,4.5]) line([[x,0,0],[x,0,4]], true);
  for (const z of [1.33,2.66]) line([[0,0,z],[6,0,z]], true);
  // Moulded arch and jambs, echoed from the entry's museum colonnade.
  for (const radius of [.78,.94]) {
    const arch = Array.from({length:25},(_,i)=>{
      const angle=i/24*Math.PI;
      return [3.65+radius*Math.cos(angle),1.75+radius*Math.sin(angle),0];
    });
    line([[3.65+radius,0,0],...arch,[3.65-radius,0,0]]);
  }
  line([[2.55,1.75,0],[2.85,1.75,0]]);
  line([[4.45,1.75,0],[4.75,1.75,0]]);
  line([[2.53,0,.18],[4.77,0,.18],[4.77,0,.36],[2.53,0,.36]], true);
  // Empty hanging frames and a small exhibition plinth, never image borders.
  rectangle(.55,1.65,1.35,2.9,0);
  rectangle(.67,1.53,1.48,2.77,0);
  line([[6,1.35,.9],[6,1.35,2.45],[6,2.9,2.45],[6,2.9,.9],[6,1.35,.9]]);
  line([[6,1.48,1.03],[6,1.48,2.32],[6,2.77,2.32],[6,2.77,1.03],[6,1.48,1.03]], true);
  line([[2.1,0,2.5],[3.25,0,2.5],[3.25,.55,2.5],[2.1,.55,2.5],[2.1,0,2.5]]);
  line([[2.1,.55,2.5],[2.1,.55,3.35],[3.25,.55,3.35],[3.25,.55,2.5]]);
  line([[2.1,0,2.5],[2.1,0,3.35],[3.25,0,3.35],[3.25,.55,3.35]]);
  line([[2.1,0,3.35],[2.1,.55,3.35]]);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 132" width="160" height="132" fill="none" stroke="#8a8a8a" stroke-width=".65" stroke-linejoin="round">${paths.join('')}</svg>\n`;
}
