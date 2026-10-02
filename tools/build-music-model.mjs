import fs from 'node:fs';
const out = 'dist/projects/world-sensing-music-station/';
const wires = [
 [58,60,420,120,15],[74,78,390,95,90],[88,92,395,330,130],[96,105,180,395,220],
 [105,65,285,235,18],[70,108,230,200,105],[118,75,430,165,120],[78,130,382,160,150],
 [114,140,360,370,20],[135,48,340,75,10],[428,105,415,418,230],[411,135,285,310,180],
 [389,112,340,290,230],[385,140,98,335,290],[408,85,330,385,430],[90,220,210,405,445],
 [88,245,265,425,370],[82,275,280,250,340],[420,290,347,435,480],[438,307,170,360,430],
 [130,350,340,430,295],[147,355,330,75,250],[166,389,450,230,480],[285,338,120,275,160],
 [320,298,398,182,180],[321,265,150,118,190],[290,297,260,118,70],[278,330,75,400,370]
];
const paths = wires.map(([x,y,a,b,c],i)=>`<path d="M${x} ${y} C${c} ${y-100} ${c} ${b+70} ${a} ${b}" stroke="${i%5===0?'#232326':i%7===0?'#c18b35':'#bd3938'}"/>`).join('');
const pins = (x,y,n,vertical=false)=>Array.from({length:n},(_,i)=>`<rect x="${x+(vertical?0:i*8)}" y="${y+(vertical?i*8:0)}" width="4" height="7" fill="#c9c6ad"/>`).join('');
const matrix = Array.from({length:64},(_,i)=>`<circle class="matrix-pixel" data-pixel="${i}" cx="${226+i%8*10}" cy="${242+Math.floor(i/8)*10}" r="3.8" fill="${[2,3,4,5,9,14,16,23,24,31,32,39,40,47,49,54,58,59,60,61].includes(i)?'#f4f4ee':'#535846'}"/>`).join('');
const led = Array.from({length:30},(_,i)=>{
 const t=i/30*Math.PI*2, x=268+222*Math.cos(t), y=238+222*Math.sin(t);
 const color=['#86e8cf','#cf80c3','#85bade','#eddb91'][Math.floor(i/8)];
 return `<g class="loop-led" data-led="${i}" style="--led-color:${color}"><circle class="led-glow" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="17" fill="${color}" opacity=".5" filter="url(#led-glow)"/><rect class="led-chip" x="${(x-4).toFixed(2)}" y="${(y-5).toFixed(2)}" width="8" height="10" rx="2" fill="${color}"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3" fill="#fafff8"/></g>`;
}).join('');
const buttons = [[128,352],[106,378],[150,378],[128,404],[373,205],[404,205],[435,205]].map(([x,y])=>`<g transform="translate(${x} ${y})"><rect x="-10" y="-10" width="20" height="20" fill="#a9a997" stroke="#727567"/><rect x="-8" y="-8" width="16" height="16" fill="#333632"/><circle r="5" fill="#1b1e1b" stroke="#626559"/>${pins(-11,-8,2,true)}</g>`).join('');
const svg = `<svg class="device-svg" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="device-svg-title device-svg-desc">
<title id="device-svg-title">World Sensing Music Station — reconstructed prototype</title>
<desc id="device-svg-desc">A raised cardboard base, three visible breadboards, internal red and black jumper wires, two control boards, seven buttons, an ultrasonic sensor and a central LED matrix, surrounded by a translucent coiled NeoPixel strip. Power leads are tucked underneath.</desc>
<defs>
 <linearGradient id="cardboard" x2="0.4" y2="1"><stop stop-color="#625243"/><stop offset="1" stop-color="#30291f"/></linearGradient>
 <linearGradient id="board-plastic" x2="0" y2="1"><stop stop-color="#dfded1"/><stop offset="1" stop-color="#9e9f94"/></linearGradient>
 <linearGradient id="strip" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d9e4df" stop-opacity=".55"/><stop offset=".3" stop-color="#a6c2c0" stop-opacity=".15"/><stop offset=".7" stop-color="#f4f5e8" stop-opacity=".4"/><stop offset="1" stop-color="#a2b4ad" stop-opacity=".25"/></linearGradient>
 <linearGradient id="sensor-metal" x2="0" y2="1"><stop stop-color="#d8dbd5"/><stop offset=".35" stop-color="#888f88"/><stop offset=".65" stop-color="#3d4542"/><stop offset="1" stop-color="#c1c5bc"/></linearGradient>
 <radialGradient id="sensor-face"><stop stop-color="#303735"/><stop offset=".65" stop-color="#232a28"/><stop offset=".85" stop-color="#747e76"/><stop offset="1" stop-color="#ccd1c7"/></radialGradient>
 <pattern id="holes" width="9" height="10" patternUnits="userSpaceOnUse"><rect x="3" y="3" width="2.8" height="3.6" rx=".8" fill="#494e46" opacity=".8"/></pattern>
 <pattern id="corrugation" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 0V8M3 0V8" stroke="#91806a" stroke-width="1" opacity=".45"/></pattern>
 <filter id="led-glow" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="5"/></filter>
 <filter id="device-shadow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="20"/></filter>
</defs>
<ellipse cx="512" cy="665" rx="305" ry="62" fill="#000" opacity=".85" filter="url(#device-shadow)"/>
<g id="device-body">
 <path d="M164 319L701 185L864 559L326 709Z" fill="#11150e"/>
 <path d="M164 277L326 666L326 709L164 319Z" fill="#483726" stroke="#746044"/>
 <path d="M326 666L864 516L864 559L326 709Z" fill="url(#corrugation)" stroke="#796246"/>
 <path d="M326 669L864 519" fill="none" stroke="#b5a283" stroke-width="3"/>
 <path d="M326 701L864 551" fill="none" stroke="#241e16" stroke-width="4"/>
 <g transform="matrix(1 -.25 .32 .68 175 287)">
  <path d="M-14 -10L526 -16L531 531L-10 535Z" fill="url(#cardboard)" stroke="#8a755f" stroke-width="2"/>
  <path d="M-14 -10L-14 -35L526 -40L526 -16Z" fill="#453b30" stroke="#6c5a48"/>
  <path d="M-14 -10L-34 -4L-29 512L-10 535Z" fill="#252924"/>
  ${[18,183,348].map(x=>`<g><rect x="${x}" y="20" width="156" height="483" rx="3" fill="#656c61"/><rect x="${x}" y="15" width="156" height="483" rx="3" fill="url(#board-plastic)"/><rect x="${x+8}" y="25" width="140" height="459" fill="url(#holes)"/><path d="M${x+9} 37V478M${x+147} 37V478" stroke="#b36c62" stroke-width="1.5"/><path d="M${x+18} 37V478M${x+138} 37V478" stroke="#647887" stroke-width="1.5"/><path d="M${x+72} 35V480" stroke="#757d71" stroke-width="5"/></g>`).join('')}
  <g fill="none" stroke-width="3" stroke-linecap="round" opacity=".95">${paths}</g>
  <g transform="translate(47 31)">
   <rect y="15" width="108" height="57" fill="#1d344b" stroke="#69817e"/>
   ${pins(16,64,9)}
   <rect x="4" y="19" width="100" height="4" fill="#a0ada2"/>
   <rect x="18" y="55" width="13" height="9" fill="#171c20"/><rect x="68" y="55" width="14" height="9" fill="#171c20"/>
   ${[28,80].map(x=>`<path d="M${x-21} 24V-7H${x+21}V24Z" fill="url(#sensor-metal)" stroke="#969f98"/><ellipse cx="${x}" cy="-7" rx="21" ry="20" fill="url(#sensor-face)"/><ellipse cx="${x}" cy="-7" rx="15" ry="14" fill="url(#holes)" stroke="#68736b"/>`).join('')}
  </g>
  <g transform="translate(376 68) rotate(3)">
   <rect width="60" height="122" rx="2" fill="#223b36" stroke="#6e8880"/>
   ${pins(3,4,14,true)}${pins(54,4,14,true)}
   <rect x="19" y="44" width="24" height="36" fill="#202625" stroke="#96998b"/>
   <rect x="16" y="-7" width="28" height="25" rx="2" fill="#8b9990" stroke="#b8bcb0"/>
   <circle cx="16" cy="97" r="3" fill="#ab5144"/>
  </g>
  <g transform="translate(84 425) rotate(-3)">
   <rect width="69" height="57" fill="#223c39" stroke="#87998b"/>
   ${pins(4,1,8)}${pins(4,49,8)}
   <rect x="22" y="14" width="23" height="24" fill="#1c2320" stroke="#8a8d7f"/>
   <rect x="20" y="42" width="28" height="27" fill="#a9b0a4" stroke="#626e64"/>
   <circle cx="8" cy="29" r="3" fill="#92c765"/>
  </g>
  <g transform="translate(413 392)"><rect width="45" height="56" fill="#213c36" stroke="#6d8b74"/><circle cx="22" cy="23" r="11" fill="#1c2421" stroke="#9a9d89"/><circle cx="22" cy="23" r="5" fill="#060a08"/>${pins(5,46,4)}</g>
  ${buttons}
  <path d="M205 222L312 222L317 324L205 324Z" fill="#4d5549" stroke="#b9bca7" stroke-width="5"/>
  <path d="M213 229L306 229L306 319L213 319Z" fill="#1d2723"/>
  ${matrix}
  <g fill="none" stroke-linecap="round">
   <circle cx="268" cy="254" r="222" stroke="#050908" stroke-width="31" opacity=".25"/>
   <circle cx="268" cy="243" r="222" stroke="url(#strip)" stroke-width="27"/>
   <circle cx="268" cy="210" r="222" stroke="url(#strip)" stroke-width="27"/>
   <path d="M46 210V243M490 210V243" stroke="#ccdfd7" stroke-width="3" opacity=".6"/>
   ${['#86e8cf','#cf80c3','#85bade','#eddb91'].map((color,i)=>`<circle class="loop-wash" cx="268" cy="238" r="222" stroke="${color}" stroke-width="9" stroke-dasharray="335 1060" stroke-dashoffset="${-i*349}" opacity=".08" filter="url(#led-glow)"/>`).join('')}
   <circle cx="268" cy="238" r="222" stroke="#d4e1d6" stroke-width="1.7" opacity=".8"/>
   <circle cx="268" cy="196" r="222" stroke="#e8f3ed" stroke-width="2" opacity=".75"/>
   <path d="M66 326Q49 309 41 287" stroke="#181e19" stroke-width="12"/>
  </g>
  ${led}
  <path d="M111 397L92 410" fill="none" stroke="#253529" stroke-width="12"/>
 </g>
</g>
</svg>`;
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(out+'device.svg',svg);
const html=fs.readFileSync(out+'index.html','utf8');
fs.writeFileSync(out+'index.html',html.replace(/<!-- DEVICE START -->[\s\S]*?<!-- DEVICE END -->/,`<!-- DEVICE START -->\n${svg}\n<!-- DEVICE END -->`));
console.log('Built source-grounded SVG reconstruction.');
