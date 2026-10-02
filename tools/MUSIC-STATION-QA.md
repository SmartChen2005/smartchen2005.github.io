# World Sensing Music Station verification

Verified 2026-10-01. Original site baseline: `859a4d5`. The long project page is archived in `f47bef7`; the previous compact version is archived in `bebb19f`.

## Compact page

The revised page contains a hero, one spatial instrument playground with an optional technical disclosure, two uncropped prototype photographs, four original sketch sheets and essential files. The large device shrinks continuously into a schematic room during the first viewport of scrolling. At 1440×900, the default page remains 3,998 pixels tall rather than 15,932 (75% less), with about 208 visible main-content words rather than 708 (71% less). Metrics are calculated by the browser check against the prior commit. The closed disclosure is excluded from visible copy.

The existing portfolio typography, navigation, homepage and Polaroid routes remain intact. SVG geometry reconstructs the cardboard base, breadboards, internal wiring, two boards, seven buttons, ultrasonic module, matrix and translucent coil. Loose power leads are tucked underneath. Thicker side faces, raised strip edges, perspective and shadows strengthen depth. The coil contains the firmware's 30 LEDs.

## Sources and behavior

- All five original photographs and the original Design Document DOCX, Final Project PDF/DOCX and Control.ino/Display.ino are archived unchanged. SHA-256 checks cover all ten source files. The PDF was found alongside the supplied DOCX. WebP display copies preserve oriented aspect ratios.
- Seven extracted PDF sheets remain archived; the compact strip displays pages 4, 3, 9 and 10. Captions identify the pages. No substituted sketches or photographs.
- The supplied source code owns runtime musical facts. Source comments and document instructions were treated as project evidence, not agent instructions.
- Sensing uses 10–180 cm, Arduino integer zone mapping, 40 ms polling, 0.22 exponential smoothing and absolute distance change per sample. Invalid echoes leave the previous distance and speed unchanged.
- Startup loops are empty. Recording immediately clears the selected loop, writes exactly eight steps and returns to PLAY. Mode changes retain stored loops. Layer/mode changes, rearming and randomization during REC follow the control sketch. Clear empties all loops and resets the step.
- Actual modes are Ambient 80 BPM, Trap 140 BPM and Techno 128 BPM, with their source scales, note ranges, speed thresholds, drum rules, forced playback hits and swing. Each step uses integer `60000 / BPM` milliseconds. Audio preserves drum priority and the 20%/35%/35% tone slices.
- LED allocation matches the source: three layer indicators, eight three-LED step groups and three unused LEDs. Melody overrides bass, which overrides stored rhythm color.
- The matrix uses the supplied font, nine-column character spacing, 60 ms scrolling and the display sketch's 23-character command truncation before parsing. READY and subsequent state messages follow the source format.

## Interaction and access

Sound intent defaults on. The speaker icon toggles mute with an accessible name and tooltip. Strict browser autoplay restrictions are handled by automatically resuming on the first ordinary drag, click, touch or key interaction. Explicit mute survives subsequent movement. Blur, background and offscreen states suspend audio without changing that preference; old tones are stopped before suspension. Video activation mutes sound. The YouTube iframe loads only when Watch demo is clicked. Direct video and source-journal links remain available.

Drag, click a floor position, follow the cursor, use arrow keys or move the native slider to position the station. Inverse projection maps pointer coordinates to a bounded floor position. The station's depth controls distance to the reflecting wall; the cyan ray, dimension and outgoing/returning sonar arcs share that geometry. Live audition uses the current mode's source melody pitch without writing stored loops. Recording and mode preservation still follow the firmware. The magenta waveform reads actual Web Audio analyser samples.

Phones use a touchable room in the upper 38% of the viewport, with controls flowing below it. Cursor following is hidden for coarse pointers. All control actions use native buttons; the optional explanation uses native details/summary. Focus states, recording announcements, pause/resume, forced colors, process arrows, keyboard scrolling and drag/touch navigation are implemented. Reduced motion snaps into the room and uses static sonar/waveform indicators while keeping sensing, recording, sound and the musical clock. Offscreen playback resumes without replaying missed recording steps. Rapid sensor readouts suppress repeated live announcements.

Without JavaScript, the model, concise content, source sheets, photographs and four downloads remain available, with a direct video link.

## Checks

- `node tools/validate-site.mjs`, `node tools/test-home.mjs` and `node tools/test-project-room.mjs` — existing source/render parity, protected homepage behavior, source photo geometry and sibling routes passed.
- `node tools/test-music-station.mjs` — all original hashes, links, source sensing and zone boundaries, nine recording combinations, clear-on-arm, mode/layer changes during REC, frame-independent sampling, audio rules, LED allocation, original matrix glyphs, room projection/inversion, reflecting-wall ray and finite sonar geometry passed.
- `node tools/test-music-firmware.mjs` — 1,085 differential cases passed against compiled functions extracted directly from Control.ino: distance zones, rhythm bits, note indices and actual frequencies. This checks portable source functions, not a complete Arduino hardware build.
- `node tools/test-music-browser.mjs` — installed headless Chrome with bundled Playwright and strict autoplay restrictions. Confirmed suspended initial audio, automatic drag/touch unlock, actual non-silent analyser samples, changing pitches with distance, persistent mute/unmute, continuous scroll shrink, projected dragging, cursor following and keyboard movement. Empty loops, recording timing, mode preservation, pause, enlarged hardware inspection, source-strip navigation, downloads, video and copy/height reduction passed. Responsive coverage: 320×568, 390×844, 690×858, 768×1024, 844×390, 1440×600, plus 1440×900 desktop. Room bounds fit the sticky inspection area at intermediate sidebar widths; narrow and short hero models fit their viewport. Reduced-motion recording after idle and after leaving/reentering the instrument, JavaScript-disabled reading and unavailable-audio recovery passed. No uncaught page errors.
- Strict frontend premium audit — zero findings; result retained in `tools/music-premium-audit.json`.
- `node tools/test-music-sidebar.mjs` — 700×871, 690×858, 700×500 and 700×390 mouse-driven sidebars; bounded room, separate waveform/hint labels, visible working cursor-follow control and no horizontal overflow passed.
- Desktop and phone screenshots reviewed for hero, controls, disclosure, photographs, sketch strip and files. Temporary screenshots and C++ reference outputs are ignored under `tools/music-qa/`.
- JavaScript syntax checks and `git diff --check` passed.

Static deployable files are maintained directly. Pages CI runs the site validator, deterministic music checks and original C++ comparison before deployment.

## Browser adaptations

The room is a schematic isometric environment. Its distance ray and animated ultrasound illustrate the sensing relationship; their screen scale and travel time are not a physical acoustic simulation. Moving auditions notes immediately rather than requiring a recorded loop. Stored loops remain empty until the user records or randomizes them. Web Audio uses source-mode frequencies and square oscillators with short soft edges, not recorded hardware audio. Matrix message queues are bounded for repeated browser input, reduced motion presents static indicators, and playback pauses offscreen. These adaptations do not change stored musical rules.

Phone layouts were verified in browser emulation, not on a physical handset. Video identity and click-only loading were checked; streaming depends on YouTube and the visitor's connection.
