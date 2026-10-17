# Development Blueprint

## Product loop

In Boss Creator, draw and configure a local boss, save or export its JSON, then launch a no-reward sandbox test. In Campaign, choose a mode, dodge incoming projectiles, and fire back. Credits and shards fund the Ascension Network and chest rewards; contracts provide the cosmetic unlock path.

## Systems map

- `index.html`: responsive shell, navigation, visual styles, canvas, and screen containers.
- `mechanics.js`: local save migration, views, pixel editor, boss JSON handling, contracts, cosmetics, chest timers, combat, synthesized audio, and record submission.
- `game-rules.js`: pure 540-rank combat effects, Threat Rating, Ascension Trial eligibility, and final leaderboard eligibility.
- `test/game-rules.test.js`: Node built-in tests for rank effects and completion gates.
- Save key: `bossforge-ascension-v1` in browser `localStorage`.
- Runtime: modern browser with Canvas 2D, local storage, and optional Web Audio. No external assets or runtime packages.

## Progression rules

- The network contains 180 nodes. Each node supports three ranks: 540 total.
- Only a Campaign win advances `campaignClears` and `stage`. At 50 clears, all 540 ranks, and stage 51, the Ascension Trial becomes selectable.
- The Trial has two sequential HP phases. Only a Trial win sets all final boss/rival flags and creates a registration-pending score.
- Final nickname registration checks the full requirements again at form submission. Ordinary losses/wins and sandbox runs cannot unlock it.
- Prestige requires the same endgame gate and then resets Campaign progress/ranks while retaining boss designs, cosmetics, and score records.
- Each rank increments Threat Rating and raises enemy difficulty by approximately 0.093 percentage points. The 18 disciplines also affect player offense, defense, movement, recovery, targeting, and rewards.
- A contract grants its credit reward, one shard, and the next locked cosmetic. It is replaced immediately with a different active contract where possible.
- Starting a run starts any uninitialized 25-, 55-, and 95-second chest timers. Claiming a ready chest awards credits and one or two shards and starts that slot's next timer.
- The leaderboard is local-only. A server-side implementation must validate run duration, mode, score, and completion before accepting records.

## Boss workshop slice

The editor supports 16/24/32 grids, pencil, eraser, flood fill, line, rectangle, horizontal symmetry, two layers, visibility, up to eight frames, bounded undo/redo, zoom, templates, resize, local save, duplicate/delete, and JSON import/export. Health, armor, movement speed, attack frequency, and aimed/spread/sweep patterns are bounded. Sandbox encounters use the saved sprite and behavior and do not award rewards or affect campaign/leaderboard state.

Still needed: modular body-part assembly, per-phase behavior/visual timelines, transform/enrage authoring, opponent AI profiles, and the larger campaign/chaos/settings work listed in `TASK_BOARD.md`.

## Verification notes

Run `node --test test/game-rules.test.js` and `node --check mechanics.js`. Manually test drawing, saving/reopening, undo/redo, JSON round-trip, sandbox isolation, each mode, Campaign progression, chest claim idempotence, and the endgame registration flow. A complete 50-stage run and visual browser checks have not been performed.