# Copilot Instructions

- Keep the game dependency-free and runnable by opening `index.html`; do not add external assets or paid service requirements.
- Keep gameplay state and progression in `mechanics.js`, and the page shell/styles in `index.html` unless a focused refactor is needed.
- Preserve the save key `bossforge-ascension-v1` and normalize persisted data when reading it. Treat saved local data as untrusted.
- Preserve the 18 × 10 × 3 = 540 network contract, five active contracts, 16 themes, 16 skins, 12 trails, 12 arenas, and 25/55/95-second chest slots.
- Prestige requires 50 cleared Campaign stages plus all 540 ranks. Other modes must not count toward Campaign stage eligibility.
- Keep nickname registration gated until a run has ended. The browser-only leaderboard must never be described as public or verified.
- Keep music and effects synthesized locally. Do not import commercial audio, copyrighted game assets, or remote runtime dependencies.
- Support keyboard and touch input, responsive layouts, and reduced-motion preferences.
- After mechanics edits, run `node --check mechanics.js`. Browser behavior and all 50 Campaign clears still require manual verification.