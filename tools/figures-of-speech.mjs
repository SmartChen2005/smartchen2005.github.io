// Curated 2026-10-27 from the existing site and its Git history.
// Dates identify recorded revisions, not unverified concept/creation dates.
export const studies = [
  {
    id: '001', title: 'Personal Card', kind: 'Object / Material', location: 'Homepage / Smart Chen',
    image: 'personal-card-isolated.jpg', alt: 'The silver Smart Chen contact card, isolated on white.', experiment: 'personal-card',
    world: 'card', first: '2026-09-29', revised: '2026-10-14',
    description: 'A contact card treated as a physical object: circular-grained metal, engraved lettering, and one moving studio light.',
    perspective: 'Identity is carried by material as well as information. Cursor movement and device tilt reveal the finish without moving the grain itself.',
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
    perspective: 'Gravity, collision, and response introduce game design through behavior. The click animation inherits the field already in motion.',
    instruction: 'Move to influence the field. Click “(game) designer” to play the contraction; the experiment then resets.',
    history: [['2026-09-28', '4c3f1a3', 'The interactive field and its converging entrance are recorded together.']],
  },
  {
    id: '004', title: 'Filmmaker', kind: 'Interaction / Hover', location: 'Homepage / filmmaker',
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
    image: 'gallery-entrance-isolated.jpg', alt: 'The isolated museum entrance animation on white.', experiment: 'gallery-entrance',
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
];

export const preservedEdition = '2026-10-27';
export const experimentURL = study => `editions/${preservedEdition}/${study.experiment}/`;
