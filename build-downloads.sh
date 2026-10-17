#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

node - "$ROOT" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const pagePath = path.join(root, "index.html");
const sourcePath = path.join(root, "mechanics.js");
const rulesPath = path.join(root, "game-rules.js");
const page = fs.readFileSync(pagePath, "utf8");
const source = fs.readFileSync(sourcePath, "utf8");
const rules = fs.readFileSync(rulesPath, "utf8");
const inline = `<script>\n${rules.replace(/<\/script/gi, "<\\/script")}\n${source.replace(/<\/script/gi, "<\\/script")}\n</script>`;
const standalone = page.replace(/<script src="game-rules\.js"><\/script>\s*<script src="mechanics\.js"><\/script>/, inline);
if (standalone === page) throw new Error("Could not locate both game script tags in index.html");
fs.writeFileSync(path.join(root, "BOSSFORGE-ASCENSION-Standalone.html"), standalone);
NODE

cd "$ROOT"
zip -j -q -FS BOSSFORGE-ASCENSION-Expanded.zip \
  index.html game-rules.js mechanics.js README.md DEVELOPMENT_BLUEPRINT.md \
  COPILOT_INSTRUCTIONS.md TASK_BOARD.md build-downloads.sh \
  BOSSFORGE-ASCENSION-Standalone.html
printf '%s\n' "Created BOSSFORGE-ASCENSION-Expanded.zip and BOSSFORGE-ASCENSION-Standalone.html"