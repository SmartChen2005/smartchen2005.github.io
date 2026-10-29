// Curated 2026-10-27 from the existing site and its Git history.
// Dates identify recorded revisions, not unverified concept/creation dates.
export const studies = [
  {
    id: '001', title: 'Personal Card', kind: 'Object / Material', location: 'Homepage / Smart Chen',
    image: 'personal-card-lit.jpg', alt: 'The silver Smart Chen contact card with its real hover reflection, isolated on white.', experiment: 'personal-card',
    world: 'card', first: '2026-09-29', revised: '2026-10-14',
    description: 'A contact card designed as a physical object: aluminum, perlage finishing, engraved lettering, and a single moving studio light to reveal its surface.',
    perspective: "Identity is carried by material as well as information. The CMF choices draw inspiration from the titanium Apple Card and traditional watchmaking techniques. Cursor movement and device tilt change the card's orientation relative to a simulated light source, revealing the perlage finish through shifting reflections.",
    instruction: 'Move over the card to inspect its surface. On supported phones, touch the card to enable device tilt.',
    history: [
      ['2026-09-29', '7377c93', 'The contact card becomes part of the homepage.'],
      ['2026-10-01', '0202f44', 'Circular graining becomes part of the metal finish.'],
      ['2026-10-01', 'b1c5367', 'Device tilt joins the same material response.'],
      ['2026-10-14', '7ed8259', 'A downloadable résumé joins the contact links.'],
    ],
  },
  {
    id: '002', title: 'Game Designer', kind: 'Interaction / Motion', location: 'Homepage / (game) designer',
    image: 'game-designer-isolated.jpg', alt: 'The standalone game design physics field and its trigger on white.', experiment: 'game-designer',
    world: 'games', first: '2026-09-28', revised: '2026-09-28',
    description: 'A field of balls and platforms responds to movement, then contracts toward a point when the word is activated.',
    perspective: 'Inspired by the classic arcade game Pong.',
    instruction: 'Move to influence the field. Click “(game) designer” to play the contraction; the experiment then resets.',
    history: [['2026-09-28', '4c3f1a3', 'The interactive field and its converging entrance are recorded together.']],
  },
  {
    id: '004', hidden: true, title: 'Filmmaker', kind: 'Interaction / Hover', location: 'Homepage / filmmaker',
    image: 'filmmaker-isolated.jpg', alt: 'Four developing photographs and viewfinder corners on white.', experiment: 'filmmaker',
    world: 'photo', first: '2026-09-28', revised: '2026-10-23',
    description: 'Photographs and viewfinder corners form a temporary exhibition around the homepage introduction.',
    perspective: 'Framing connects the written identity to looking, image making, and the work collected in The Gallery.',
    instruction: 'Watch the photographs develop. Click a print or Replay development to see the process again.',
    history: [
      ['2026-09-28', '4c3f1a3', 'Photography is part of the recorded interactive homepage.'],
      ['2026-10-23', '613b029', 'The written identity changes from photographer to filmmaker.'],
    ],
  },
  {
    id: '005', title: 'Into The Gallery', kind: 'Motion / Transition', location: 'Homepage + Projects → The Gallery',
    image: 'gallery-entrance-small.jpg', alt: 'The museum entrance with a small Gallery wordmark and white clearance.', experiment: 'gallery-entrance', edition: '2026-10-27-gallery-small',
    world: 'photo', action: 'photo', first: '2026-10-14', revised: '2026-10-24',
    description: 'A viewfinder opens into an imagined museum, then resolves into the real Gallery masthead.',
    perspective: 'Entering a collection becomes a spatial journey. The opening frame, architecture, and destination belong to one continuous movement.',
    instruction: 'The preserved entrance plays on opening. Click the drawing or Replay to see it again.',
    history: [
      ['2026-10-14', '0f00edf', 'The architectural museum entrance is introduced.'],
      ['2026-10-14', '15ad6b7', 'The handoff into the real Gallery is refined.'],
      ['2026-10-24', 'b256173', 'The same entrance is shared with project navigation.'],
    ],
  },
  {
    id: '006', title: 'Car Enthusiast', kind: 'Motion / Film', location: 'Homepage / car enthusiast',
    image: 'car-enthusiast-isolated.jpg', alt: 'The preserved MINI and BMW Z4 film presented on its own.', experiment: 'car-enthusiast',
    world: 'cars', action: 'cars', first: '2026-10-24', revised: '2026-10-27',
    description: 'A MINI Cooper S and BMW Z4 move from a narrow city street into an abstract star-grid chase.',
    perspective: 'The identity unfolds through vehicle character, camera placement, and editing. A continuous street preview becomes a complete short film.',
    instruction: 'The street preview is already moving. Click the scene or Play film for the full sequence.',
    history: [
      ['2026-10-24', '0305c56', 'The MINI and Z4 line-art race is introduced.'],
      ['2026-10-25', '313388e', 'Hover preview and full playback become separate states.'],
      ['2026-10-25', '499dbd8', 'The street preview becomes endless; the film gains a full vertical loop.'],
      ['2026-10-27', '0f1dfac', 'A lower second-shot camera is tried.'],
      ['2026-10-27', '4054039', 'The previous second-shot height is restored.'],
    ],
  },
  {
    id: '007', title: 'Under Construction', kind: 'Interface / Playground', location: '404 / Unavailable pages',
    image: 'under-construction-isolated.jpg', alt: 'The standalone 404 construction experiment with its own controls.', experiment: 'under-construction',
    world: '404', first: '2026-10-09', revised: '2026-10-09',
    description: 'The 404 page becomes a construction site where objects can be added, moved, and rotated.',
    perspective: 'An unavailable destination still offers something to explore. Construction is both the message and the interaction.',
    instruction: 'Drag objects to move them. Add and clear with the page controls; the canvas also supports keyboard movement and rotation.',
    history: [
      ['2026-10-09', 'cd7e993', 'The construction-site 404 page is introduced.'],
      ['2026-10-09', '0dfe75d', 'Scroll rotation direction is refined.'],
    ],
  },
  {
    id: '008', title: 'Polaroid Camera', kind: 'Object / Cursor', location: 'Polaroid of Yesterday / Game Design Document',
    image: 'polaroid-camera-detail.jpg', alt: 'A larger, high-resolution rendering of the articulated SX-70 camera on white.', experiment: 'polaroid-camera',
    edition: '2026-10-27-sx70', world: 'camera', first: '2026-09-22', revised: '2026-09-22',
    description: 'A folding SX-70 replaces the document cursor. It opens, enters a viewfinder, photographs the page, and ejects a print.',
    perspective: "Inspired by my game *Polaroid of Yesterday*, in which the protagonist uses an SX-70 camera. The interaction brings an element of the game's world into the website.",
    instruction: 'Move the camera with the pointer. Click to open or fold; hold RMB or F to aim, then click to shoot. The controls also provide Open/Fold, Aim and Shutter.',
    history: [
      ['2026-09-22', '8efb234', 'The Polaroid cursor is introduced.'],
      ['2026-09-22', 'ac8453e', 'The camera model and interaction details are refined.'],
    ],
  },
  {
    id: '009', title: 'Adaptive Cursor', kind: 'Object / Interaction', location: 'Homepage + Shared website pointer',
    image: 'adaptive-cursor-axis-forms.jpg', alt: 'Dot, action circle and text bar on the upper row; link, magnifier and four-way drag capsules on the lower row, together on white.', experiment: 'adaptive-cursor',
    edition: '2026-10-28-cursor-axis', world: 'cursor', first: '2026-10-27', revised: '2026-10-28',
    description: 'One pointer changes shape to express what can happen next: press, follow, inspect, move or type. Free objects use four-way arrows; sliders use arrows along their axis. Text bars follow the type size.',
    perspective: 'The cursor becomes a small object with its own material and motion. Its transformations make the available interaction visible before anything is activated.',
    instruction: 'Move across the eight specimens. Drag the object in two dimensions, adjust the horizontal range, or type with the text bar. Press the button and word, follow the link, or zoom the photo. Touch and keyboard retain access.',
    history: [
      ['2026-10-27', '7202a4f', 'The adaptive magnetic pointer is introduced on the homepage.'],
      ['2026-10-27', '423886d', 'The pointer becomes shared across the live website.'],
      ['2026-10-28', '328c30c', 'Link, zoom and drag capsules share one visual language.'],
      ['2026-10-28', '3ce2a99', 'Actions use plain circles; native range inputs gain drag feedback.'],
      ['2026-10-28', 'bb2bac9', 'The word-attraction shadow gains a softer, unclipped falloff.'],
      ['2026-10-28', '73cc7cf', 'Text and editable fields gain a lower-priority vertical bar.'],
      ['2026-10-28', '24b4a58', 'The text bar follows type size, with a 24px minimum and no upper cap.'],
      ['2026-10-28', '8c39410', 'Free objects gain four-way arrows; sliders retain directional two-way arrows.'],
    ],
  },
// Keep source IDs stable while numbering only the visible catalogue entries.
].filter(study => !study.hidden).map((study, index) => ({ ...study, number: String(index + 1).padStart(3, '0') }));

export const preservedEdition = '2026-10-27';
export const studyEdition = study => study.edition || preservedEdition;
export const experimentURL = study => `editions/${studyEdition(study)}/${study.experiment}/`;
