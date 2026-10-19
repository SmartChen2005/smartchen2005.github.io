// Editorial schematics of the authored interactions, not a replica of Unity geometry.
const lugPoints = Array.from({ length: 5 }, (_, i) => {
  const angle = (-90 + i * 72) * Math.PI / 180;
  return [310 + Math.cos(angle) * 59, 290 + Math.sin(angle) * 59];
});
export const starOrder = [0, 2, 4, 1, 3];
export const wheel = `<svg viewBox="0 0 840 520" aria-hidden="true" class="wheel-diagram">
  <defs><pattern id="wheel-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" class="drawing-grid"/></pattern></defs>
  <rect x="20" y="30" width="800" height="450" fill="url(#wheel-grid)"/>
  <path class="drawing-ground" d="M30 440H810"/>
  <g class="vehicle-lift">
    <path class="vehicle-frame" d="M40 235V185L150 167L197 104H401L460 171H492V350H453M167 350H40V235M165 290A145 145 0 0 1 455 290M206 112L171 163H435L391 112ZM315 113V160M62 209H136M462 207H483M48 330H167"/>
    <path class="suspension" d="M310 180V238M280 197H340M283 209H337M286 222H334"/>
    <g class="brake-hub"><circle cx="310" cy="290" r="83"/><circle cx="310" cy="290" r="66"/><circle cx="310" cy="290" r="22"/>${lugPoints.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
  </g>
  <g class="rack"><path d="M612 294V437H802V294M606 437H808M625 418H790M637 418V440M777 418V440"/><path class="rack-slot" d="M656 418L671 365H751L766 418"/></g>
  <path class="wheel-route" d="M410 278C505 218 592 219 680 287" pathLength="1"/>
  <g class="wheel">
    <circle class="tire" cx="310" cy="290" r="138"/><circle class="tread" cx="310" cy="290" r="128"/><circle class="rim" cx="310" cy="290" r="108"/>
    ${lugPoints.map(([x,y]) => { const dx=x-310,dy=y-290; return `<path class="spoke" d="M${310+dx*.36-7} ${290+dy*.36}L${310+dx*1.6-10} ${290+dy*1.6}L${310+dx*1.6+10} ${290+dy*1.6}L${310+dx*.36+7} ${290+dy*.36}Z"/>`; }).join('')}
    <circle class="hub" cx="310" cy="290" r="31"/>
    <path class="star" d="${starOrder.map((n,i)=>`${i?'L':'M'}${lugPoints[n].join(' ')}`).join('')}Z" pathLength="1"/>
    ${lugPoints.map(([x,y],i)=>`<g class="lug" data-lug="${i}"><circle class="nut-halo" cx="${x}" cy="${y}" r="17"/><path class="nut" d="${Array.from({length:6},(_,j)=>{const a=j*Math.PI/3;return `${j?'L':'M'}${x+Math.cos(a)*9} ${y+Math.sin(a)*9}`;}).join('')}Z"/><circle class="socket" cx="${x}" cy="${y}" r="4"/></g>`).join('')}
  </g>
  <path class="jack-target" d="M109 438H181M117 433L145 350L174 433M130 350H160"/>
  <g class="jack-position"><path class="jack-base" d="M105 436H185L181 427H109Z"/><path class="jack-saddle" d="M132 348H158V355H132Z"/><path class="jack-arms" d="M115 427L174 352M176 427L116 352M115 390H176"/><circle class="jack-pivot" cx="145" cy="390" r="5"/><path class="jack-handle" d="M178 414L219 378L244 378"/></g>
  <g class="wrench"><path class="wrench-body" d="M0 -10H47L65 3V24H38L34 65H13L17 14H0Z"/><path class="wrench-metal" d="M-15 -7H2V7H-15ZM35 65H11V78H35Z"/><path class="wrench-trigger" d="M35 25H44V44H33"/><path class="wrench-detail" d="M12 -2H39M21 52H30"/></g>
  <g class="technical-labels"><text x="40" y="60">DIRECT INTERACTION / FOUR ACTIONS</text><text x="615" y="469">WHEEL RACK</text><text x="42" y="469">JACK PLACEMENT TARGET</text><path d="M142 455V441M703 455V441"/><text x="565" y="100">ALIGN</text><text x="565" y="123">LOOSEN</text><text x="565" y="146">LIFT</text><text x="565" y="169">STORE</text><path d="M546 86V173"/></g>
</svg>`;

export const map = `<svg viewBox="0 0 840 520" aria-hidden="true" class="space-diagram">
  <defs><pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" class="drawing-grid"/></pattern></defs>
  <g class="map-garage"><path class="room-fill" d="M24 84H364V243H348V300H364V438H24Z"/><path class="room-outline" d="M364 243V84H24V438H364V300"/>
    <rect x="32" y="92" width="324" height="338" fill="url(#map-grid)"/>
    <g class="workbench"><path d="M90 116H279V169H90ZM102 169V185M267 169V185"/><path class="tool-drawing" d="M131 135L151 155M127 128L134 128L139 135L133 141L125 136ZM188 126V156M180 126H196M233 129L214 151M211 154L218 159"/></g>
    <g class="storage"><path d="M45 214H128V290H45ZM45 239H128M45 265H128"/><path d="M70 226H103M70 252H103M70 278H103"/></g>
    <g class="arrivals"><path d="M97 322H258V374H97ZM108 374V390M247 374V390"/><path class="snap-zone" d="M117 332H155V363H117ZM168 332H205V363H168ZM218 332H245V363H218Z"/></g>
    <g class="task-board"><path d="M294 110H341V180H294Z"/><path d="M303 127L307 131L314 122M303 145L307 149L314 140M303 163L307 167L314 158M321 127H331M321 145H331M321 163H331"/></g>
    <text class="floor-label" x="90" y="105">WORKBENCH</text><text class="floor-label" x="45" y="204">STORAGE</text><text class="floor-label" x="97" y="410">ARRIVALS TABLE</text>
  </g>
  <g class="map-store"><path class="room-fill" d="M479 84H816V438H479V300H496V243H479Z"/><path class="room-outline" d="M479 243V84H816V438H479V300"/>
    <rect x="487" y="92" width="321" height="338" fill="url(#map-grid)"/>
    ${Array.from({length:6},(_,i)=>{const x=507+(i%2)*174,y=119+Math.floor(i/2)*83;return `<g class="department" data-department="${i}"><rect x="${x}" y="${y}" width="107" height="52"/><path d="M${x} ${y+13}H${x+107}M${x+18} ${y+23}V${y+42}M${x+39} ${y+23}V${y+42}M${x+62} ${y+23}V${y+42}M${x+86} ${y+23}V${y+42}"/><text x="${x+3}" y="${y-7}">0${i+1}</text></g>`;}).join('')}
    <g class="directory-board"><path d="M674 377H784V415H674Z"/><path d="M683 386H713M683 395H727M742 386H772M742 395H772"/></g><text class="floor-label" x="674" y="430">DIRECTORY</text>
  </g>
  <path class="connection" d="M190 347H415V272H645V191"/><path class="travel-path" d="M190 347H415V272H645V191" pathLength="1"/>
  <path class="reuse-path" d="M130 253H174V185H217" pathLength="1"/>
  <g class="location"><circle class="location-ring" cx="190" cy="347" r="19"/><circle class="location-core" cx="190" cy="347" r="7"/><path d="M179 357Q190 365 201 357"/></g>
  <g class="supply-crate"><path d="M-12 -10H12V12H-12ZM-12 -10L0 -16L12 -10M0 -16V6M-12 -10L0 -4L12 -10"/></g>
  <g class="ready-tool"><path d="M189 127L207 148M188 126L182 127L179 135L187 142L194 137M203 145L210 151"/></g>
  <g class="technical-labels"><text x="24" y="56">HOME GARAGE</text><text x="479" y="56">AUTO PARTS STORE</text><text x="24" y="482">STORE PURCHASES / REUSE TOOLS</text><text x="479" y="482">SIX SIGNED DEPARTMENTS</text><path d="M411 76V44M403 55L411 44L419 55"/><text x="406" y="33">N</text></g>
</svg>`;

export { lugPoints };
