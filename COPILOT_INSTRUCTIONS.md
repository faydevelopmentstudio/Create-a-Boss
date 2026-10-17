# Copilot Instructions

- Keep the game dependency-free and runnable by opening `index.html`; do not add external assets or paid service requirements.
- Keep the page shell/styles in `index.html`, browser/editor integration in `mechanics.js`, and deterministic progression calculations in `game-rules.js` unless a focused refactor is needed.
- Preserve the save key `bossforge-ascension-v1` and normalize persisted data when reading it. Treat saved local data as untrusted.
- Preserve the 18 × 10 × 3 = 540 network contract, five active contracts, 16 themes, 16 skins, 12 trails, 12 arenas, and 25/55/95-second chest slots.
- All 18 disciplines must continue to affect player combat and every rank must increase Threat Rating/enemy difficulty.
- The Ascension Trial and prestige require 50 Campaign clears and all 540 ranks. Final registration requires winning both trial phases; ordinary losses/wins and sandbox play must never unlock it.
- Keep the leaderboard browser-local and label it as such. Never imply the scores are public or verified.
- Keep boss documents validated and bounded on load/import; preserve pixel data when resizing, and do not award Campaign progress or rewards for sandbox encounters.
- Keep music and effects synthesized locally. Do not import commercial audio, copyrighted game assets, or remote runtime dependencies.
- Support keyboard and touch input, responsive layouts, and reduced-motion preferences.
- After mechanics edits, run `node --check mechanics.js` and `node --test test/game-rules.test.js`. Browser editor behavior, save migration, and all 50 Campaign clears still require manual verification.
- `TASK_BOARD.md` is authoritative about which master-spec phases are implemented, partial, and remaining. Do not mark untested features complete or claim the whole master specification is delivered.