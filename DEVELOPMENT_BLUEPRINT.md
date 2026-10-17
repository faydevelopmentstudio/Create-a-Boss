# Development Blueprint

## Product loop

Choose a combat mode, launch into the arena, dodge the rival's aimed projectiles, and fire back. A run ends on hull failure, rival defeat, or the Endurance timer. Credits and shards fund the Ascension Network and chest rewards; contracts provide the cosmetic unlock path.

## Systems map

- `index.html`: responsive shell, navigation, visual styles, canvas, and screen containers.
- `mechanics.js`: local save schema, view rendering, contracts, cosmetics, chest timers, network ranks, combat simulation, synthesized audio, and record registration.
- Save key: `bossforge-ascension-v1` in browser `localStorage`.
- Runtime: modern browser with Canvas 2D, local storage, and optional Web Audio. No external assets or runtime packages.

## Progression rules

- The network contains 180 nodes. Each node supports three ranks: 540 total.
- A Campaign win advances the campaign stage. Prestige becomes eligible after stage 50 is cleared (stage counter 51) and all ranks are mastered.
- A contract grants its credit reward, one shard, and the next locked cosmetic. It is replaced immediately with a different active contract where possible.
- Starting a run starts any uninitialized 25-, 55-, and 95-second chest timers. Claiming a ready chest awards credits and one or two shards and starts that slot's next timer.
- The leaderboard is local-only. A server-side implementation must validate run duration, mode, score, and completion before accepting records.

## Verification notes

Syntax can be checked with `node --check mechanics.js`. Manually test each mode, contract completion and replacement, chest timers and claims, rank purchases, cosmetics, prestige eligibility, record registration, and narrow-screen controls. A complete 50-stage run has not been verified.