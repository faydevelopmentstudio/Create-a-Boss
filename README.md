# BOSSFORGE: ASCENSION — Expanded Edition

A dependency-free browser game with a playable pixel boss workshop, sandbox combat, and the existing arena progression loop. Build and export custom bosses, then advance through the 540-rank network and Campaign.

## Play

Open `index.html` in a modern browser. Keyboard controls are **WASD** or the **arrow keys** to move and **Space** to fire. The arena also has touch controls on narrow screens. Sound and a short synthesized music loop are generated locally with the Web Audio API; no audio files, paid APIs, or third-party game assets are used.

For reliable saved progress and standalone export, serve this folder over HTTP or publish it with GitHub Pages. Progress, boss designs, and local records are stored in this browser's `localStorage`; clearing browser data removes them. The save key remains `bossforge-ascension-v1`; new fields are migrated without resetting existing progress. Ordinary runs may appear as anonymous local scores, but nickname registration is locked until 50 Campaign clears, all 540 ranks, and both phases of the Ascension Trial are complete. The leaderboard is not public or cheat-resistant.

## Systems

- Four modes: Campaign, Chaos Trial, Rival Duel, and 70-second Endurance.
- Boss Creator: 16/24/32 pixel canvases; pencil, eraser, fill, line, and rectangle tools; palette/custom color, horizontal symmetry, body/effects layers, frame editing, undo/redo, templates, resizing, import/export, duplicate/delete, and boss behavior settings. Designs persist locally and can be tested in a reward-free sandbox.
- Ascension Network: 18 disciplines × 10 sectors × 3 ranks, for 540 total ranks. Every rank increases Threat Rating and enemy difficulty; all 18 disciplines contribute a player combat effect.
- Five active contracts. Completed orders are replaced and award credits, a forge shard, and the next available cosmetic.
- Sixteen themes, sixteen pilot frames, twelve projectile trails, and twelve arenas. All cosmetic unlocks come from contracts.
- Three cache timers (25, 55, and 95 seconds). Claiming a cache awards credits and forge shards.
- Ascension Trial unlocks after 50 Campaign clears and all 540 ranks are mastered. It has a boss phase followed by a rival phase.
- Rebirth and final nickname registration unlock only after the Ascension Trial succeeds. Rebirth preserves cosmetics and records, resets Campaign ranks, and awards 5,000 credits.
- Pixel-art arena combat uses synthesized local sound. A sandbox test does not change Campaign progression, award credits, or create leaderboard rows.

Run `./build-downloads.sh` to generate `BOSSFORGE-ASCENSION-Standalone.html` and `BOSSFORGE-ASCENSION-Expanded.zip`. The Hall of Records also offers a standalone export when the game is served over HTTP. The archive includes the game source, development docs, and standalone build; it does not include browser save data.

## Development

The page and styles are in `index.html`; progression and browser integration are in `mechanics.js`; pure progression rules are in `game-rules.js`. No package installation or build step is required. Run `node --test test/game-rules.test.js` for the automated endgame-gate and upgrade-effect tests, and `node --check mechanics.js` for syntax.

See [DEVELOPMENT_BLUEPRINT.md](DEVELOPMENT_BLUEPRINT.md), [COPILOT_INSTRUCTIONS.md](COPILOT_INSTRUCTIONS.md), and [TASK_BOARD.md](TASK_BOARD.md) for the implementation outline and handoff notes.

This is an incremental implementation, not the complete master specification. The 50-stage campaign, all upgrade purchases, and final trial have not been played through. Boss assembly from modular parts, phase/timeline behavior authoring, the five-world campaign, expanded chaos/corruption, advanced rival difficulty, cinematic chest/transition work, full settings, gamepad input, and secure public leaderboard remain unimplemented. Browser editor interactions and mobile layout still need a visual pass before release; no screenshots are included in the current ZIP.