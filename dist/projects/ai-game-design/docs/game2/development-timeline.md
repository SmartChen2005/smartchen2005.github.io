# Catwalk Development Timeline

## Document purpose

This document records Catwalk’s development from its first concept through the current playable prototype. Small fixes and clarification passes are folded into the major prototype milestone they belong to.

Each milestone records:

- what the major update established;
- the player feedback that shaped it;
- important revisions made before moving on;
- every Git save associated with that milestone.

**Coverage:** 2026-07-26 through 2026-08-03

**Latest gameplay save covered:** `68d6f95`
**Current prototype family:** Main Menu + Single Route Editor + Pixel Street Playtest + Persistent Mocha

## Playable historical builds

The web timeline includes a Git-backed interactive build for every meaningfully distinct playable era. Each build is a static export of one representative commit, so opening it does not switch the current branch or alter the current source tree. The pre-playable Foundation has no snapshot, and the closely related Prototype 04 iterations share one representative Gallery build. The route-based Milestones 09–12 use isolated historical route storage and cannot overwrite the current editor save. See `docs/game2/explorations/19-playable-timeline-snapshots.md` for the commit mapping and boundaries.

---

## 01. Foundation: concept, workflow, and Git baseline

**Date:** 2026-07-26 — 2026-07-27

### Major update

- Named the game **Catwalk** and recorded Mocha, a Siamese cat, as its real-life inspiration.
- Defined the overlapping spaces: a cat travelling home inside the computer and Mocha interfering with the player’s physical screen, keyboard, mouse, and hand.
- Chose an exploratory workflow: implement one small idea, play it, discuss it, then keep, revise, or delete it.
- Created Catwalk-specific requirements and development logs.
- Preserved the project baseline, created the `codex/catwalk-exploration` branch, and established one Git save per stable step.

### Player feedback

- Move beyond the visual and interaction limits of an HTML/CSS/SVG-heavy production approach.
- Let the design emerge through development instead of fixing the complete game in advance.
- Give AI room to propose and test ideas.
- Keep Catwalk’s own requirements, logs, and Git history.

### Git saves

- `acde9db` — project baseline
- `01467c5` — Git checkpoint record

> The original July 26 concept files had no Git repository save at the moment they were written; the baseline commit captured them the following day.

---

## 02. Prototype 01: Keyboard Takeover

**Date:** 2026-07-27

### Major update

- Replaced the placeholder page with the first playable Phaser 4.2.1 platform room.
- Added movement, jumping, platforms, falling recovery, a checkpoint, and an exit.
- Mocha occupies `WASD` at a safe midpoint, forcing the player to adapt by switching to the arrow keys.
- Added a visible keyboard, programmatic cat graphics, input tests, and a verified browser playthrough.

### Player feedback

- Start with the smallest playable interaction that directly translates the real experience of adapting controls around Mocha.
- Do not wait for a complete game design before implementing something playable.

### Git saves

- `fc43248` — define Keyboard Takeover
- `20bc407` — build Keyboard Takeover

---

## 03. Prototype 02: Paw Storm and the complete keyboard

**Date:** 2026-07-27

### Major update

- Added `J` scratch, `K` roll, and `L` pounce white-model actions.
- Added destructible boxes and a wider platforming gap.
- Added four surreal paws entering from different keyboard edges.
- Paw Storm blocks `W / J / K`, continuously holds `D`, and leaves arrow keys plus `L` available.
- Replaced the simplified keyboard with a complete ANSI 104-key layout.
- Aligned each paw pad to exactly one target key while leaving the other 100 keys visually unobstructed.

### Player feedback

- Paws should both block keys and forcibly hold keys down.
- Paws can surround the keyboard rather than entering realistically from one side.
- The platform cat needs actions beyond basic movement.
- The final keyboard must be complete and recognizable.
- A paw acting on one key should cover as little of the other functional keys as possible.

### Git saves

- `67af1cf` — define Paw Storm
- `38d5259` — build Paw Storm actions
- `5673a88` — require full keyboard and precise coverage
- `d3352d8` — render the full keyboard and paw targets

---

## 04. Prototype 03: Distinct cat skills and the tunnel rebuild

**Date:** 2026-07-29

### Major update

- Extended the world into a horizontally scrolling route.
- Kept `W` as normal jump and `J` as scratch.
- Changed `K` into a low “liquid cat” posture for tunnels.
- Changed `L` into wall climbing.
- Moved Paw Storm later so the movement types could be compared before controls changed.

### Player feedback

- `K` and `L` felt too similar to each other and to `W`.
- Try more cat-specific skills with clearly different functions.
- Lengthen the level.
- Record the slightly misaligned arrow-key layout, although it was not the current priority.

### Important revision folded into this milestone

Releasing `K` caused the cat to fall through the floor. Two collision patches failed the player’s real playtest. The tunnel was then rebuilt from scratch with:

- a fixed standing-size physics body;
- same-size standing and low visual textures;
- a visual-only low roof;
- static conditional entrance gates instead of runtime body resizing.

The player confirmed that the rebuilt version fixed the bug.

### Git saves

- `5be523b` — define the distinct-skills route
- `aead858` — build the distinct-skills route
- `237324b` — first tunnel fix
- `32247b1` — second tunnel fix
- `d80d086` — rebuild the tunnel mechanic
- `44b32b7` — record the successful player confirmation

---

## 05. Prototype 04: 29-Level Gallery and Cat Lock

**Date:** 2026-07-29 — 2026-07-31

### Major update

- Replaced the long route with 24 numbered, single-screen level sketches.
- Added Previous and Next controls with wraparound navigation.
- Added `S` as **Loaf**, stopping horizontal motion and resisting forced `D`.
- Rebuilt the unreachable Level 05 staircase.
- Turned Levels 17–24 into ordered Cat Lock sequences whose actions change level state and unlock the exit.
- Several sequences trigger Paw Storm halfway through, requiring the player to adapt during the combination.
- Added five deliberately extreme challenge sketches as Levels 25–29: narrow rooftop chains, forced movement, multi-enemy alleys, and long action sequences that switch available inputs after Paw Storm.

### Player feedback

- `S` seemed unused and needed a purpose.
- Create 20+ numbered levels for rapid screening.
- Level 05 was impossible.
- Later levels should use complex causal combinations rather than simple arrangements of basic objects.
- Levels from 17 onward seemed to be missing whatever unlocked the exit.
- Add five very hard, highly challenging levels to the gallery.

### Important revisions folded into this milestone

- Reconnected jump and hold nodes to the live update loop.
- Allowed climbing nodes to activate while the action remained held.
- Restored the ability to complete Cat Lock levels beginning at Level 17.

### Git saves

- `3a9323b` — define the 24-level gallery
- `80d5afe` — build the gallery
- `af3014f` — make Level 05 reachable
- `be0cd89` — add stateful Cat Lock combinations
- `18610e2` — restore Cat Lock progression
- `f11bf4c` — add five hard gallery levels

---

## 06. Prototype 04 controls: Space climb, long roll, and readable hints

**Date:** 2026-07-29

### Major update

- Moved wall climbing from `L` to `Space`.
- Rebuilt `L` as a grounded, movement-dependent long roll.
- Tuned the roll to travel farther than a running `W` jump while staying lower.
- Updated level hints, keyboard highlights, Paw Storm allowances, and Cat Lock nodes.
- Changed Level 19’s final jump node from blocked `W` to available `Arrow Up`.
- Added explicit `PRESS`, `HOLD`, and `MOVE +` verbs, hold progress, reset feedback, and next-step instructions.

### Player feedback

- Put climbing on `Space`.
- Use `L` for a lower, longer roll that is clearly different from `W`.
- Level 19 was bugged.
- Later Cat Lock levels required holding `S` without explaining that it was a hold action.

### Git saves

- `57e0bbf` — move climb to Space and add the long roll
- `c16293a` — show Arrow Up in Level 19
- `176557d` — clarify Cat Lock input hints

---

## 07. Prototype 04 actors: Yarn and toy mice

**Date:** 2026-07-30

### Major update

- Added an actor configuration to all 24 levels.
- Added yarn balls as a one-use protection resource.
- Added patrolling toy mice.
- `J` scratch and `L` roll can remove mice.
- Unprotected contact returns the player to the checkpoint.
- Added a minimal yarn and remaining-threat HUD.
- After nine-life playtesting was introduced, yarn was revised to save the cat from any one death—including an enemy hit or a fall—without automatically removing the enemy.

### Player feedback

- The current combinations were promising.
- Add items or enemies throughout the levels.
- Make yarn protect against one death, not only one animal attack.

### Git saves

- `680a972` — define the actor experiment
- `e6f9120` — add yarn and toy mice
- `14ee76b` — make yarn save one death

---

## 08. Prototype 04 alley threats: Pigeons, guard dogs, and collision cleanup

**Date:** 2026-07-30

### Major update

- Added pigeons and guard dogs alongside toy mice.
- Pigeons fly low; `K` lets them pass overhead and `J` scares them away.
- Guard dogs accelerate toward moving players; `S` loafing makes them lose interest, while jumping can avoid them.
- Dogs cannot be directly defeated by `J` or `L`.
- Updated the HUD from `MICE` to `THREATS` and highlighted the relevant response keys.

### Player feedback

- Add enemy types based on things a cat might encounter in an alley.
- Different enemies should create different responses rather than being mouse reskins.
- Level 19 still allowed the cat to fall beneath the visible ground.
- In Level 08, using `K` made the pigeon disappear; that felt like a bug.
- The guard-dog design was liked.

### Important revisions folded into this milestone

- Moved the global void-reset line to `y=490`, so the cat respawns before fully sinking below the visible floor.
- Corrected the pigeon dodge so `K` no longer deletes the pigeon.
- Added a 700ms contact cooldown while the pigeon passes overhead.
- Kept `J` as the action that actually scares the pigeon away.
- Marked the guard-dog direction for retention and further tuning.

### Git saves

- `f60865c` — reset falls at the visible ground line
- `8af4401` — define the alley-threat experiment
- `ce60657` — add pigeons and guard dogs
- `cd5a726` — keep pigeons after ducking

---

## 09. Single Route Editor: one continuous Catwalk

**Date:** 2026-07-30

### Major update

- Turned the gallery’s pieces into a pan-and-zoom editor for one continuously growing horizontal route.
- Made every mechanic, actor, instruction, checkpoint, Cat Lock element, and cat interference placeable and editable.
- Connected saved route data directly to Phaser and established `Playtest`, `Playtest Here`, and `Return to Editor` as one edit–play–revise loop.
- Added grouped selection, readable library and patrol guides, durable JSON saving, and restoration of the same route position after testing.
- Connected tutorial, nine lives, platform-safe respawning, Loaf rest checkpoints, dog calming, outside-monitor dialogue, and timed or positioned interference to the same authoring model.

### Player feedback

- Put all existing content into one unlimited horizontal scene and make interference authorable by position or time.
- Play the designed route directly, start near the edited location, and return to that same editor view.
- Make checkpoint behavior, patrol areas, dialogue ownership, grouped selection, and library objects understandable without guesswork.
- Keep special interactions physically legible: climbing requires wall contact, calmed dogs remain visible, Loaf Zones become optional rest points, and the Game Start Flag begins nine-life play.

### Git saves

- `57582ff` — define the single-route editor experiment
- `a81f732` — build the single-route editor
- `8f240c2` — define the editor route playtest
- `0d11927` — playtest editor routes
- `ad45bb0` — require wall contact for climbing
- `866b015` — add placeable instruction text
- `39d6d47` — playtest from a nearby checkpoint
- `59fb9f4` — keep calmed dogs in the scene
- `d114df2` — turn Loaf Zones into rest checkpoints
- `c62ab70` — add the Game Start Flag and nine lives
- `a1f4e03` — use the Game Start Flag for nearby playtests
- `9ad43e6` — improve editor icons and patrol guides
- `d1356b3` — preserve the editor position after nearby playtests
- `1211c27` — add box multi-selection and grouped editing
- `76a4a32` — add outside-monitor player dialogue
- `b471c7a` — add screen interference events
- `2472027` — resolve platform checkpoint spawn surfaces
- `5814908` — reset the physics body during respawn
- `adde90e` — save the current single route as a durable project file
- `ee96983` — allow comma-separated Paw Storm key lists

> “Infinite” currently means a virtual route that automatically grows as content is placed. The editor remains a white-model authoring surface even though its generated Playtest now has a separate art layer.

---

## 10. First art direction: pixel street

**Date:** 2026-08-01

### Major update

- Applied the first art pass only to the player-authored Playtest, keeping the editor and Gallery as white-model tools.
- Built a close blue-hour pixel alley with pixel characters and street-object interpretations for every terrain family.
- Corrected cat-to-building scale and low-clearance readability, then replaced the mirrored background with scrolling randomized facades.
- Added a side passage and safe non-colliding alley clutter to create depth without changing gameplay collision.

### Player feedback

- Make the game inside the monitor pixel art while preserving the editor and Gallery as white models.
- Bring buildings close to believable cat scale and make every terrain object, especially boxes and low obstacles, readable.
- Scroll varied buildings with the route and add enough side-passage depth and clutter for the scene to feel like an alley.

### Git saves

- `175b525` — add pixel street art to the editor-route Playtest
- `737c52c` — refine alley scale, box stacks, and low-clearance ducts
- `24847b8` — align the low pipe with its authored clearance
- `0155d34` — scroll the alley backdrop across the route
- `ccc4bda` — add randomized building variants without adjacent repeats
- `9c749bc` — add side-alley depth and safe decorative clutter
- `54194d7` — prevent rolling inside low tunnels

---

## 11. The physical setup: monitor and mechanical keyboard

**Date:** 2026-08-02

### Major update

- Rebuilt the world around the pixel game as a graphite desktop setup.
- Corrected the full ANSI 104-key layout and added a close-fitting dimensional case, individual key travel, and distinct blocked or held feedback.
- Rebuilt the monitor frame, substantial stand, and weighted base, then enlarged the entire composition to reduce unused browser space.
- Tested and deliberately reverted a realistic outer-world illustration, a long wood table, and silver hardware before retaining the graphite direction.

### Player feedback

- Prioritize a believable mechanical keyboard before the surrounding room.
- Keep edge keys inside a shell that closely follows the key field and make every real key press visibly respond.
- Strengthen the monitor stand, revert the unattractive table and silver experiments, and enlarge the computer, keyboard, and game together.

### Git saves

- `752c0ef` — illustrate the outer world experiment
- `4318377` — restore the prior outer world
- `b076fbe` — rebuild the mechanical keyboard
- `2d69eb1` — align the keyboard shell
- `e18069d` — tighten the keyboard case
- `55bb81a` — extend the lower keyboard case
- `13b41f4` — rebuild the monitor hardware
- `0e1e393` — rebuild the monitor stand
- `5814092` — try the long wood table
- `3dcf2d4` — restore the prior table
- `08bb92c` — try silver hardware
- `a2a6b99` — restore graphite hardware
- `ad3c56a` — enlarge the desktop composition

---

## 12. Persistent Mocha: a cat with a life outside the game

**Date:** 2026-08-03

### Major update

- Replaced isolated interference graphics with one persistent, high-detail pixel Siamese based on Mocha’s photos.
- Added a dedicated outside-world controller that connects sleep, sitting, grooming, stretching, walking, screen blocking, and Paw Storm through approach–action–return transitions.
- Kept Mocha at one consistent large scale, limited Paw Storm to two shorter visible paws, and isolated individual keyboard feedback so one key no longer makes its row appear to bounce.
- Changed the idle system from random pose swapping to complete activity sequences; grooming returns to sitting, stretching returns to sleep, and sleep now lasts 12–21 seconds.

### Player feedback

- Make the cat recognizable as Mocha, pixel-styled but detailed, and continuously present even when she is not interfering.
- Keep her body the same large size in every state and make the paws look less strange.
- Smooth all transitions, add grooming and stretching with natural returns to rest, and allow much longer periods of sleep.

### Git saves

- `925b004` — bring Mocha into the desk world
- `024bb8d` — animate persistent pixel Mocha
- `ecaca59` — keep Mocha at a consistent size
- `2a88b40` — enlarge Mocha and isolate key feedback
- `dad6593` — smooth Mocha pose transitions
- `5f38860` — animate Mocha’s daily routines
- `68d6f95` — let Mocha sleep longer

---

## 13. A complete front door: main menu and route sources

**Date:** 2026-08-07

### Major update

- Turned the default Catwalk page into a monitor-based game main menu while retaining the established computer and full mechanical keyboard.
- Added four explicit paths: play the durable designed route, load an editor-exported JSON route, open the editor, or browse the development timeline.
- Isolated campaign, uploaded, and editor-autosave route sources so loading a JSON cannot overwrite active editor work.
- Preserved the 29-level Gallery as a development tool and added a main-menu return after both completion and game over.
- Restored the complete keyboard and persistent Mocha to the menu, including real key feedback, autonomous rest activities, and precise short paw interactions.
- Compacted the entire desktop composition for laptop-height screens, changed the menu to English-only copy, and made it the only direct path back to the wider game collection.
- Gave the monitor menu a separate black, warm-gold pixel RPG identity with four full-width choices stacked vertically, without changing the surrounding hardware or Mocha system.

### Player feedback

- The game was mostly built, but its page logic still felt like disconnected development tools.
- Entering Catwalk should first show the computer and a main menu inside its monitor.
- The designed game, imported routes, editor, and development timeline need clear separate roles, and a finished run needs a way back.
- The first menu pass hid the keyboard and omitted Mocha; the menu should preserve the same physical-world relationship as gameplay.
- Remove the Chinese interface copy and remove direct collection-home links from Catwalk subpages.
- Do not carry the editor's colors or tool-like panel language into the main menu; it should read as an RPG arcade title screen.

### Git saves

- `5dc5fa7` — add the complete Catwalk main menu flow
- `96579bc` — restore Mocha and the keyboard to the Catwalk menu
- `c0eecbf` — keep the complete Catwalk menu world visible
- `d2eb025` — restore Catwalk menu initialization dependency order
- `a25788b` — polish the Catwalk menu and enlarge Mocha
- `eeef381` — restyle the Catwalk menu as a black pixel RPG screen
- `4a1312d` — keep one shared keyboard-and-pointer menu selection
- `3adbcb1` — simplify the public menu and unify editor level naming
- `1df3876` — author Game Start lives and remove automatic terrain hints
- `fd4e9fd` — adopt the first supplied campaign file
- `c2b5b61` — replace it with the corrected VegShark route and UTF-8 text
- `8b2e41c` — rename the player-facing authoring tool Route Studio
- `050c811` — extend the RPG menu frame across the monitor screen
- `3eba80a` — restore compact centered options inside the full-screen frame
- `4d494b6` — visibly shrink the centered menu options
- `f2fb1cb` — place each option description below its title
- `7656db1` — remove the unused space before each option arrow
- `9c8eab8` — align all option arrows and remove Choose your path

---

## Closing note

### Roles and authority

VegShark was the creative director, lead game designer, playtest lead, final route author, and final approver: VegShark supplied Mocha’s real behavior, judged fun and feel, rejected weak interpretations, and set the visual bar. Codex served as prototyping engineer, technical designer, tools/UI implementer, QA, and archivist: I proposed experiments, built them, diagnosed failures, and kept the editor, tests, Git, and timeline aligned.

### How the roles changed

At first VegShark set the premise and gave AI room to explore, while I chose the first playable experiments. Repeated playtests then made VegShark a hands-on design director and me the rapid implementation partner. Near release, VegShark moved toward level author and art/product director; I shifted toward integration, polish, regression testing, and documentation.

### Main technology

Phaser 3 drives the platformer’s rendering, physics, camera, enemies, and keyboard actions. Route Studio uses Canvas 2D and plain JavaScript. HTML/CSS/JS builds the physical monitor, mechanical keyboard, menu, and Mocha. JSON and localStorage power editable routes; Node tests, Git saves, and playable snapshots preserve each stage.

### Decisions that redirected the game

Four choices changed Catwalk most: making real key interference the core; replacing separate challenge rooms with one continuous JSON-authored route; separating the pixel alley inside the monitor from the physical desk world outside; and turning Mocha from an occasional blocker into a persistent autonomous character. The in-world main menu finally unified the campaign, loaded levels, Route Studio, and this development record.

---

## Final retained design

- Keep the exploratory, playtest-driven workflow.
- Keep the complete keyboard and the precise relationship between visible paws and actual input effects.
- Keep `W` jump, `J` scratch, `K` low posture, `S` loaf, `L` long roll, and `Space` climb as current white-model candidates.
- Keep the guard-dog encounter direction for further tuning.
- Keep one continuous horizontal route and author it through the editor.
- Keep the editor and Gallery as white-model design surfaces while the player-authored route Playtest explores the pixel street direction.
- Keep the graphite monitor and full mechanical keyboard as the current physical-world hardware direction.
- Keep Mocha continuously present outside the game, with daily routines and interference performed by the same animated character.
- Continue testing whether mice, pigeons, dogs, and yarn create decisions or merely add interruption.
- Treat the 29 levels as a reusable idea library rather than a fixed sequence.
- Treat Cat Lock sequences, numerical tuning, the generated background, first-pass terrain mappings, and combat-like interactions as disposable prototypes.

## Known limitations at close

- The arrow-key area remains slightly misaligned.
- Some item-only levels may not give yarn enough immediate value.
- Pigeon altitude, dog charge speed, calm distance, contact ranges, and enemy exit feedback remain temporary.
- The live editor route still needs player testing for coordinate fidelity, collision, camera rhythm, and event timing.
- Undo/redo and cloud sharing are not implemented.
- The pixel street and generated Mocha sheets remain first art passes; a layered background pipeline, audio, story structure, the formal route, and less abstract dynamic paws remain open.

---

## Complete Catwalk product save index through `9c8eab8`

This index records the 89 Catwalk product saves covered by the milestones. Timeline-maintenance and repository-workflow commits are intentionally omitted.

| Date | Save | Commit summary |
|---|---|---|
| 2026-07-27 | `acde9db` | `chore: establish project baseline for Catwalk exploration` |
| 2026-07-27 | `01467c5` | `docs: record Catwalk git checkpoint` |
| 2026-07-27 | `fc43248` | `docs: define Catwalk keyboard takeover prototype` |
| 2026-07-27 | `20bc407` | `feat: build Catwalk keyboard takeover prototype` |
| 2026-07-27 | `67af1cf` | `docs: define Catwalk paw storm prototype` |
| 2026-07-27 | `38d5259` | `feat: expand Catwalk with paw storm actions` |
| 2026-07-27 | `5673a88` | `docs: require full keyboard and precise paw coverage` |
| 2026-07-27 | `d3352d8` | `feat: render full keyboard with precise paw targets` |
| 2026-07-29 | `5be523b` | `docs: define distinct cat skills route` |
| 2026-07-29 | `aead858` | `feat: add distinct cat skills route` |
| 2026-07-29 | `237324b` | `fix: prevent standing inside low tunnel` |
| 2026-07-29 | `32247b1` | `fix: stabilize tunnel traversal collider` |
| 2026-07-29 | `d80d086` | `refactor: rebuild tunnel squeeze mechanic` |
| 2026-07-29 | `44b32b7` | `docs: confirm tunnel bug fix in playtest` |
| 2026-07-29 | `3a9323b` | `docs: define 24-level Catwalk gallery` |
| 2026-07-29 | `80d5afe` | `feat: add 24-level Catwalk gallery` |
| 2026-07-29 | `af3014f` | `fix: make Catwalk level 05 reachable` |
| 2026-07-29 | `be0cd89` | `feat: add stateful Catwalk combination levels` |
| 2026-07-29 | `18610e2` | `fix: restore Cat Lock progression` |
| 2026-07-29 | `57e0bbf` | `feat: move climb to Space and add long roll` |
| 2026-07-29 | `c16293a` | `fix: show Arrow Up in Catwalk level 19` |
| 2026-07-29 | `176557d` | `feat: clarify Cat Lock input hints` |
| 2026-07-30 | `680a972` | `docs: define Catwalk actor experiment` |
| 2026-07-30 | `e6f9120` | `feat: add yarn and toy mice to Catwalk` |
| 2026-07-30 | `f60865c` | `fix: reset Catwalk falls at visible ground` |
| 2026-07-30 | `8af4401` | `docs: define Catwalk alley threat experiment` |
| 2026-07-30 | `ce60657` | `feat: add pigeon and dog alley threats` |
| 2026-07-30 | `cd5a726` | `fix: keep pigeons after ducking` |
| 2026-07-30 | `57582ff` | `docs: define Catwalk single route editor` |
| 2026-07-30 | `a81f732` | `feat: add Catwalk single route editor` |
| 2026-07-30 | `8f240c2` | `docs: define Catwalk editor route playtest` |
| 2026-07-30 | `0d11927` | `feat: playtest Catwalk editor routes` |
| 2026-07-30 | `ad45bb0` | `fix: require wall contact for Catwalk climbing` |
| 2026-07-30 | `866b015` | `feat: add placeable Catwalk instruction text` |
| 2026-07-30 | `39d6d47` | `feat: playtest Catwalk from nearby checkpoint` |
| 2026-07-30 | `59fb9f4` | `fix: keep calmed dogs in Catwalk` |
| 2026-07-31 | `d114df2` | `feat: turn Loaf Zones into rest checkpoints` |
| 2026-07-31 | `c62ab70` | `feat: add Catwalk game start and nine lives` |
| 2026-07-31 | `a1f4e03` | `fix: use game start for nearby playtests` |
| 2026-07-31 | `9ad43e6` | `feat: improve Catwalk editor visual guides` |
| 2026-07-31 | `d1356b3` | `fix: preserve Catwalk editor playtest position` |
| 2026-07-31 | `1211c27` | `feat: add box multi-selection to Catwalk editor` |
| 2026-07-31 | `76a4a32` | `feat: add outside-monitor player dialogue` |
| 2026-07-31 | `b471c7a` | `feat: add Catwalk screen interference events` |
| 2026-07-31 | `2472027` | `fix: respawn Catwalk checkpoints on platforms` |
| 2026-07-31 | `5814908` | `fix: reset Catwalk physics body on respawn` |
| 2026-07-31 | `f11bf4c` | `feat: add five hard Catwalk gallery levels` |
| 2026-07-31 | `adde90e` | `data: save Catwalk single route snapshot` |
| 2026-07-31 | `ee96983` | `fix: allow multiple Paw Storm key entries` |
| 2026-07-31 | `14ee76b` | `feat: make Catwalk yarn save one death` |
| 2026-08-01 | `175b525` | `feat: add pixel street art to Catwalk route playtest` |
| 2026-08-01 | `737c52c` | `feat: refine Catwalk alley scale and obstacles` |
| 2026-08-01 | `24847b8` | `fix: align low pipe with authored clearance` |
| 2026-08-01 | `0155d34` | `feat: scroll Catwalk alley across route` |
| 2026-08-01 | `ccc4bda` | `feat: vary Catwalk alley backdrops` |
| 2026-08-01 | `9c749bc` | `feat: add Catwalk alley depth and clutter` |
| 2026-08-01 | `54194d7` | `fix: prevent rolling inside low tunnels` |
| 2026-08-02 | `752c0ef` | `feat: illustrate Catwalk outer world` |
| 2026-08-02 | `4318377` | `Revert "feat: illustrate Catwalk outer world"` |
| 2026-08-02 | `b076fbe` | `feat: rebuild Catwalk mechanical keyboard` |
| 2026-08-02 | `2d69eb1` | `refine: align Catwalk keyboard shell` |
| 2026-08-02 | `e18069d` | `refine: tighten Catwalk keyboard case` |
| 2026-08-02 | `55bb81a` | `refine: extend Catwalk keyboard lower case` |
| 2026-08-02 | `13b41f4` | `feat: rebuild Catwalk monitor hardware` |
| 2026-08-02 | `0e1e393` | `refine: rebuild Catwalk monitor stand` |
| 2026-08-02 | `5814092` | `feat: add Catwalk long wood table` |
| 2026-08-02 | `3dcf2d4` | `Revert "feat: add Catwalk long wood table"` |
| 2026-08-02 | `08bb92c` | `experiment: try silver Catwalk hardware` |
| 2026-08-02 | `a2a6b99` | `Revert "experiment: try silver Catwalk hardware"` |
| 2026-08-02 | `ad3c56a` | `refine: enlarge Catwalk desktop composition` |
| 2026-08-03 | `925b004` | `feat: bring Mocha into Catwalk desk world` |
| 2026-08-03 | `024bb8d` | `feat: animate persistent pixel Mocha` |
| 2026-08-03 | `ecaca59` | `fix: keep pixel Mocha at a consistent size` |
| 2026-08-03 | `2a88b40` | `fix: enlarge Mocha and isolate key feedback` |
| 2026-08-03 | `dad6593` | `feat: smooth Mocha pose transitions` |
| 2026-08-03 | `5f38860` | `feat: animate Mocha's daily routines` |
| 2026-08-03 | `68d6f95` | `tune: let Mocha sleep longer` |
| 2026-08-07 | `5dc5fa7` | `feat: add Catwalk main menu flow` |
| 2026-08-07 | `96579bc` | `refine: restore Mocha and keyboard to Catwalk menu` |
| 2026-08-07 | `c0eecbf` | `fix: keep Catwalk menu world visible` |
| 2026-08-07 | `d2eb025` | `fix: load Catwalk menu dependencies in order` |
| 2026-08-07 | `a25788b` | `refine: polish Catwalk menu and enlarge Mocha` |
| 2026-08-07 | `eeef381` | `refine: restyle Catwalk menu as pixel RPG` |
| 2026-08-07 | `4a1312d` | `fix: keep one Catwalk menu selection` |
| 2026-08-07 | `3adbcb1` | `feat: clarify Catwalk level naming` |
| 2026-08-07 | `1df3876` | `feat: author Catwalk starting lives` |
| 2026-08-07 | `fd4e9fd` | `feat: adopt VegSharl Catwalk route` |
| 2026-08-07 | `c2b5b61` | `fix: use corrected VegShark route` |
| 2026-08-07 | `8b2e41c` | `refine: rename Catwalk editor Route Studio` |
| 2026-08-07 | `050c811` | `refine: make Catwalk menu fill monitor` |
| 2026-08-07 | `3eba80a` | `refine: center compact Catwalk menu options` |
| 2026-08-07 | `4d494b6` | `refine: shrink Catwalk menu options` |
| 2026-08-07 | `f2fb1cb` | `refine: stack Catwalk menu descriptions` |
| 2026-08-07 | `7656db1` | `refine: remove Catwalk menu dead space` |
| 2026-08-07 | `9c8eab8` | `refine: align Catwalk menu arrows` |

## Source records

- `docs/game2/requirements.md`
- `docs/game2/explorations/01-keyboard-takeover.md` through `23-world-cat-interference.md`
- `dev-logs/game2/2026-07-26.md` through `2026-08-07.md`
- Git history scoped to Catwalk’s page, script, styles, tests, requirements, exploration notes, and development logs
- `data/game2/catwalk-single-route.json`
