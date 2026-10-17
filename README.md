# BOSSFORGE: ASCENSION — Expanded Edition

A dependency-free browser arena game. Build your pilot through 540 upgrade ranks, clear contracts for cosmetic rewards, collect forge caches, and take on the moving rival.

## Play

Open `index.html` in a modern browser. Keyboard controls are **WASD** or the **arrow keys** to move and **Space** to fire. The arena also has touch controls on narrow screens. Sound and a short synthesized music loop are generated locally with the Web Audio API; no audio files, paid APIs, or third-party game assets are used.

For reliable saved progress and standalone export, serve this folder over HTTP or publish it with GitHub Pages. Progress and the leaderboard are stored in this browser's `localStorage`; clearing browser data removes them. The leaderboard is not public or cheat-resistant. A public leaderboard needs a server that verifies runs.

## Systems

- Four modes: Campaign, Chaos Trial, Rival Duel, and 70-second Endurance.
- Ascension Network: 18 disciplines × 10 sectors × 3 ranks, for 540 total ranks. Impact and Fortitude ranks affect damage and hull protection.
- Five active contracts. Completed orders are replaced and award credits, a forge shard, and the next available cosmetic.
- Sixteen themes, sixteen pilot frames, twelve projectile trails, and twelve arenas. All cosmetic unlocks come from contracts.
- Three cache timers (25, 55, and 95 seconds). Claiming a cache awards credits and forge shards.
- Prestige unlocks after 50 Campaign clears and all 540 ranks are mastered. Ascension resets stage and ranks and awards 5,000 credits.
- Local score records and nickname registration unlock after a run ends.

Run `./build-downloads.sh` to generate `BOSSFORGE-ASCENSION-Standalone.html` and `BOSSFORGE-ASCENSION-Expanded.zip`. The Hall of Records also offers a standalone export when the game is served over HTTP. The archive includes the game source, development docs, and standalone build; it does not include browser save data.

## Development

The page and styles are in `index.html`; game state, rendering, progression, and input are in `mechanics.js`. No package installation or build step is required. Check JavaScript syntax with `node --check mechanics.js`.

See [DEVELOPMENT_BLUEPRINT.md](DEVELOPMENT_BLUEPRINT.md), [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md), and [TASK_BOARD.md](TASK_BOARD.md) for the implementation outline and handoff notes.

The 50-stage prestige path has not been manually played through end to end. Browser interaction and mobile layout also need a visual pass in a real browser before release.