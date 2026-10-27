// Curated 2026-10-27 from the existing site and its Git history.
// Dates identify recorded revisions, not unverified concept/creation dates.
export const studies = [
  {
    id: '001', title: 'Personal Card', kind: 'Object / Material', location: 'Homepage / Smart Chen',
    image: 'personal-card.jpg', alt: 'The silver Smart Chen contact card with its engraved name.',
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
    id: '002', title: 'Game Designer', kind: 'Interaction / Hover', location: 'Homepage / (game) designer',
    image: 'game-hover.jpg', alt: 'Small balls and platforms from the homepage physics experiment.',
    world: 'games', first: '2026-09-28', revised: '2026-09-28',
    description: 'A field of balls and platforms turns a word in the introduction into a small physical system.',
    perspective: 'The interaction introduces game design through behavior: gravity, collision, and response become part of the sentence.',
    instruction: 'Move within the preview to change the field. Activate “(game) designer” to enter Projects.',
    history: [['2026-09-28', '4c3f1a3', 'The recorded homepage mechanics establish the interactive field.']],
  },
  {
    id: '003', title: 'Into Projects', kind: 'Motion / Transition', location: 'Homepage → Projects',
    image: 'game-enter.jpg', alt: 'The physical field converging toward the middle of the screen.',
    world: 'games', action: 'games', first: '2026-09-28', revised: '2026-09-28',
    description: 'The active physics field contracts toward a point before the Projects directory appears.',
    perspective: 'Navigation continues the system already on screen. Existing motion passes into the transition instead of restarting as a separate effect.',
    instruction: 'Use “Play transition” to enter Projects. Replay returns to the starting field.',
    history: [['2026-09-28', '4c3f1a3', 'The recorded homepage mechanics include the Projects entrance.']],
  },
  {
    id: '004', title: 'Filmmaker', kind: 'Interaction / Hover', location: 'Homepage / filmmaker',
    image: 'filmmaker.jpg', alt: 'Four photographs arranged around the introduction with viewfinder corners.',
    world: 'photo', first: '2026-09-28', revised: '2026-10-23',
    description: 'Photographs and viewfinder corners form a temporary exhibition around the homepage introduction.',
    perspective: 'Framing connects the written identity to looking, image making, and the work collected in The Gallery.',
    instruction: 'Explore the photograph preview. Activate “filmmaker” to travel into The Gallery.',
    history: [
      ['2026-09-28', '4c3f1a3', 'Photography is part of the recorded interactive homepage.'],
      ['2026-10-23', '613b029', 'The written identity changes from photographer to filmmaker.'],
    ],
  },
  {
    id: '005', title: 'Into The Gallery', kind: 'Motion / Transition', location: 'Homepage + Projects → The Gallery',
    image: 'gallery-enter.jpg', alt: 'The imagined museum architecture drawn during the Gallery entrance.',
    world: 'photo', action: 'photo', first: '2026-10-14', revised: '2026-10-24',
    description: 'A viewfinder opens into an imagined museum, then resolves into the real Gallery masthead.',
    perspective: 'Entering a collection becomes a spatial journey. The opening frame, architecture, and destination belong to one continuous movement.',
    instruction: 'Use “Play transition” to enter The Gallery. Replay starts the journey again.',
    history: [
      ['2026-10-14', '0f00edf', 'The architectural museum entrance is introduced.'],
      ['2026-10-14', '15ad6b7', 'The handoff into the real Gallery is refined.'],
      ['2026-10-24', 'b256173', 'The same entrance is shared with project navigation.'],
    ],
  },
  {
    id: '006', title: 'Car Enthusiast', kind: 'Motion / Film', location: 'Homepage / car enthusiast',
    image: 'car-enthusiast.jpg', alt: 'The MINI and BMW Z4 racing through a pale line-art tunnel.',
    world: 'cars', action: 'cars', first: '2026-10-24', revised: '2026-10-27',
    description: 'A MINI Cooper S and BMW Z4 move from a narrow city street into an abstract star-grid chase.',
    perspective: 'The identity unfolds through vehicle character, camera placement, and editing. A continuous street preview becomes a complete short film.',
    instruction: 'Use “Play film” for the full sequence. Replay restores the moving street preview.',
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
    image: 'under-construction.jpg', alt: 'The interactive 404 construction site and its movable objects.',
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

export const contextURL = study => study.world === '404' ? '../../404.html' : `../../?study=${study.world}`;
