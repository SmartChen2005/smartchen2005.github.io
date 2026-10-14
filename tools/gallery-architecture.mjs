// Two quiet architectural fragments for the exhibition's permanent frame.
// Static, unfilled drawings keep the animated entrance separate from the work.
export function renderGalleryPortal() {
  // A small vaulted doorway in perspective, separate from the wordmark contour.
  const joints = Array.from({length:7},(_,i)=>{
    const angle=Math.PI+i/6*Math.PI;
    const point=r=>[22+r*Math.cos(angle),27+r*Math.sin(angle)].map(v=>v.toFixed(2)).join(' ');
    return `M${point(10)}L${point(14)}`;
  }).join(' ');
  return `<svg class="gallery-portal" viewBox="4 4 44 56" width="44" height="56" fill="none" stroke="currentColor" stroke-width=".8" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 50V22A14 14 0 0 1 44 22V50 M20 50V22A10 10 0 0 1 40 22V50" opacity=".45"/><path d="M8 55V27A14 14 0 0 1 36 27V55 M12 55V27A10 10 0 0 1 32 27V55 M8 55H12 M32 55H36 M8 27H12 M32 27H36 ${joints}"/><path d="M22 13L30 8 M36 27L44 22 M36 55L44 50 M32 55L40 50 M12 55L20 50" opacity=".6"/></svg>`;
}

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
