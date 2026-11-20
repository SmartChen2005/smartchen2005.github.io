# Exploration 19 — Git-backed playable timeline snapshots

## Question

Can Catwalk's development timeline communicate how each major version actually felt by letting visitors play representative historical builds instead of only reading summaries and commit hashes?

## Implemented experiment

- Select one representative Git commit for each meaningfully distinct playable era.
- Export each version as a static, self-contained browser build under `snapshots/game2/`.
- Lazy-load a build only when its milestone panel is opened.
- Share the identical historical Phaser runtime across snapshots to avoid duplicating the largest dependency.
- Do not create a snapshot for the pre-playable Foundation.
- Fold the closely related Prototype 04 revisions into one representative Gallery snapshot.
- Seed Milestones 09 and 10 with the route JSON from their own commit under snapshot-specific localStorage keys, leaving the current editor save untouched.
- Keep a regeneration script so the exported files remain traceable to Git rather than becoming hand-maintained copies.

## Representative commits

| Milestone | Commit | State |
| --- | --- | --- |
| 02 Keyboard Takeover | `20bc407` | Playable |
| 03 Paw Storm | `d3352d8` | Playable |
| 04 Cat Skills | `d80d086` | Playable |
| 05 Level Gallery | `f11bf4c` | Playable |
| 09 Single Route | `ee96983` | Playable with isolated historical route |
| 10 Pixel Street | `54194d7` | Playable with isolated historical route |
| 11 Desktop Hardware | `ad3c56a` | Playable with isolated historical route |
| 12 Persistent Mocha | `68d6f95` | Playable with isolated historical route |

## Temporary boundaries

- The exports are static copies committed to the repository because a normal browser cannot safely perform `git checkout` at runtime.
- Only distinct playable forms receive snapshots; minor fixes and similar Prototype 04 iterations remain folded into their representative build.
- Historical browser-engine compatibility can still change over time even though the source snapshot is immutable.

## Validation target

The timeline must expose exactly eight lazy panels, every launch page and local dependency must resolve, and the four route-based snapshots must never use Catwalk's current editor storage key.
