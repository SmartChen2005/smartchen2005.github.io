# Catwalk playable timeline snapshots

These directories are static exports of representative Git commits. The timeline page loads them on demand, so visitors can play each meaningfully distinct era without checking out an old branch.

The pre-playable Foundation has no snapshot. The closely related Prototype 04 iterations share the single `m05-level-gallery` representative build. Milestones 09–10 seed their historical route into snapshot-specific browser storage and do not read or overwrite the current editor save.

Regenerate the exports from the repository root with:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-game2-timeline-snapshots.ps1
```

The commit and launch route for each export are recorded in its `snapshot.json` file.
