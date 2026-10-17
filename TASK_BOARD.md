# Task Board

## Implemented in this slice

- [x] Preserve `bossforge-ascension-v1` and migrate old saves without resetting existing progress.
- [x] Gate Ascension Trial selection on 50 Campaign clears and all 540 ranks.
- [x] Require both final trial phases before nickname registration or prestige; ordinary run endings do not unlock registration.
- [x] Add automated tests for endgame eligibility and rank-effect bounds.
- [x] Add a local pixel boss workshop with 16/24/32 canvas sizes, pencil, eraser, fill, line, rectangle, palette/custom colors, symmetry, layers, frame editing, undo/redo, templates, resize, JSON import/export, duplication, deletion, and local persistence.
- [x] Add a no-reward boss sandbox that uses the saved art, health, armor, speed, attack rate, and attack pattern.
- [x] Connect all 18 disciplines to player combat effects and increase enemy difficulty/Threat Rating for every rank.
- [x] Use pixel-rendered player and rival sprites and a crimson base palette.
- [x] Pause combat when navigating away or hiding the browser tab.
- [x] Update standalone and ZIP builders to include the rules module.

## Remaining master-spec work

- [ ] Browser-test editor drawing, undo/redo, frame animation, import/export, sandbox isolation, mobile interactions, and console behavior; no browser automation runtime is installed in this workspace.
- [ ] Play all four existing modes and verify reward, chest, contract, and save/load paths.
- [ ] Complete 50 Campaign stages, master the network, win the Ascension Trial, register a name, and verify rebirth end to end.
- [ ] Expand the boss editor into reusable anatomy/components, opacity/shading/rotation/pan tools, phase timelines, transformations, enrage, minions, and behavior presets.
- [ ] Build five 10-stage worlds with distinct encounters, checkpoints, hazards, bosses, and stage data.
- [ ] Implement corruption counterplay and 30 bounded, readable Chaos Overdrive events.
- [ ] Add network pan/zoom, prerequisite connections, search/filtering, milestones, and branch rewards.
- [ ] Expand quests into claim-driven varied boards and add achievements/gallery rewards.
- [ ] Animate chest opening, reward transfer, boss transformations, transitions, and prestige.
- [ ] Add five fair rival difficulty profiles, defenses, profiles, and duel rewards.
- [ ] Add separate volume controls, effects intensity, save import/export, color accessibility, and gamepad support.
- [ ] Add screenshot captures at desktop/mobile sizes and include them in the release archive.
- [ ] Add a verified backend before offering any public leaderboard.
- [ ] Deploy to GitHub Pages and verify progress persistence on the deployed origin.

This board intentionally marks only work implemented in the current source. The full master specification and 50-stage completion path are not complete.