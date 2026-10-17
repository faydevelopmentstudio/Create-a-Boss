(() => {
	const $ = (selector) => document.querySelector(selector);
	const Rules = window.BossforgeRules;
	const modes = ["Campaign", "Chaos Trial", "Rival Duel", "Endurance"];
	const sectors = ["Core", "Plating", "Drive", "Barrel", "Sights", "Capacitor", "Thrusters", "Hull", "Targeting", "Overclock"];
	const disciplines = ["Impact", "Velocity", "Flux", "Fortitude", "Precision", "Salvage", "Frost", "Ember", "Storm", "Echo", "Rift", "Aegis", "Vector", "Pulse", "Ruin", "Bloom", "Gravity", "Ascendant"];
	const themes = ["Carbon", "Signal Red", "Ion", "Foundry", "Citrus", "Deep Current", "Voltage", "Monsoon", "Wildfire", "Moss", "Glacier", "Solar", "Orchid", "Ultraviolet", "Prism", "Singularity"];
	const skins = ["Vanguard", "Scrapper", "Warden", "Courier", "Ronin", "Bastion", "Mantis", "Reactor", "Spectre", "Pilot", "Colossus", "Nomad", "Cipher", "Ranger", "Overlord", "Ascendant"];
	const trails = ["Ion Wake", "Comet", "Static", "Emberline", "Frostbite", "Pulse", "Toxic", "Solar Flare", "Prism", "Ghost", "Arc", "Blackout"];
	const arenas = ["The Foundry", "Glass Flats", "Storm Shelf", "Redline", "Cold Forge", "The Wreck", "Sunken Grid", "Cinder Run", "Hollow Crown", "Skyrail", "Ion Basin", "Last Light"];
	const palettes = ["#e63946", "#ff6f61", "#78aaff", "#e7a85d", "#d8ee6b", "#58b9cf", "#e0c94e", "#55d3a5", "#fa7954", "#9acb78", "#b6e7f2", "#ffb943", "#ee83bc", "#b083f5", "#e7f0ff", "#a5aab6"];
	const EDITOR_COLORS = ["#f8fafc", "#e63946", "#ff777c", "#f59e0b", "#d8ee6b", "#55d3a5", "#58b9cf", "#78aaff", "#b083f5", "#252630"];
	const EDITOR_SIZE = 24;
	const EDITOR_TEMPLATES = [{ id: "wraith", name: "Cinder Wraith", category: "Elemental" }, { id: "machine", name: "Iron Cathedral", category: "Machine" }, { id: "beast", name: "Maw of the Deep", category: "Monster" }, { id: "artifact", name: "Crowned Relic", category: "Possessed Artifact" }];
	const defaultState = () => ({ credits: 240, shards: 0, stage: 1, wins: 0, prestige: 0, completed: false, campaignClears: 0, finalTrialComplete: false, finalBossDefeated: false, finalRivalDefeated: false, completionRecordPending: false, bosses: [], selectedBossId: null, ranks: Array(180).fill(0), unlocked: { themes: [0], skins: [0], trails: [0], arenas: [0] }, equipped: { theme: 0, skin: 0, trail: 0, arena: 0 }, contracts: [], chests: [0, 0, 0], leaderboard: [], sound: true, best: 0, clears: 0 });
	const readSave = () => {
		try {
			const saved = JSON.parse(localStorage.getItem("bossforge-ascension-v1"));
			if (!saved || !Array.isArray(saved.ranks) || !saved.unlocked) return defaultState();
			return { ...defaultState(), ...saved, campaignClears: Number.isInteger(saved.campaignClears) ? Math.max(0, saved.campaignClears) : Math.max(0, Number(saved.stage || 1) - 1), finalTrialComplete: saved.finalTrialComplete === true, finalBossDefeated: saved.finalBossDefeated === true, finalRivalDefeated: saved.finalRivalDefeated === true, completionRecordPending: saved.completionRecordPending === true, bosses: Array.isArray(saved.bosses) ? saved.bosses.slice(0, 20).map(sanitizeBoss).filter(Boolean) : [], ranks: Array.from({ length: 180 }, (_, i) => Math.max(0, Math.min(3, Number(saved.ranks[i]) || 0))), unlocked: { ...defaultState().unlocked, ...saved.unlocked }, equipped: { ...defaultState().equipped, ...saved.equipped } };
		} catch (_) { return defaultState(); }
	};
	const state = readSave();
	const save = () => localStorage.setItem("bossforge-ascension-v1", JSON.stringify(state));
	if (!state.bosses.length) {
		state.bosses.push(createTemplateBoss(EDITOR_TEMPLATES[0]));
		state.selectedBossId = state.bosses[0].id;
		save();
	} else if (!state.bosses.some((boss) => boss.id === state.selectedBossId)) state.selectedBossId = state.bosses[0].id;
	const standardRivalSprite = createTemplateBoss({ id: "machine", name: "Arena Rival", category: "Machine" });
	const ascensionRivalSprite = createTemplateBoss({ id: "beast", name: "Ascension Rival", category: "Alien" });
	const contractTypes = [
		{ kind: "wins", name: "Clear the field", verb: "wins", goal: 2, reward: 85 },
		{ kind: "shots", name: "Hot barrels", verb: "shots fired", goal: 90, reward: 70 },
		{ kind: "dodges", name: "Close call", verb: "hits dodged", goal: 8, reward: 95 },
		{ kind: "credits", name: "Scrap collector", verb: "credits earned", goal: 180, reward: 110 },
		{ kind: "runs", name: "Drop in", verb: "runs played", goal: 3, reward: 75 },
		{ kind: "survive", name: "Still standing", verb: "seconds survived", goal: 75, reward: 105 }
	];
	const freshContract = (type) => ({ ...type, progress: 0, id: Math.random().toString(36).slice(2) });
	if (!Array.isArray(state.contracts) || state.contracts.length === 0) state.contracts = contractTypes.slice(0, 5).map(freshContract);
	const notify = (message) => { const node = $("#toast"); node.textContent = message; node.classList.add("visible"); clearTimeout(notify.timer); notify.timer = setTimeout(() => node.classList.remove("visible"), 2300); };
	const formatTime = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
	const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
	let currentView = "play";
	let selectedMode = "Campaign";
	let game = null;
	let frame = 0;
	let lastTick = 0;
	const keys = new Set();
	let pointerDown = false;
	let audioContext;
	let musicTimer;
	let editorTool = "pencil";
	let editorColor = "#e63946";
	let editorLayer = "body";
	let editorFrame = 0;
	let editorSymmetry = false;
	let editorGrid = true;
	let editorPointer = null;
	let editorHistory = [];
	let editorRedo = [];
	let editorZoom = 1;
	const sound = (frequency, duration, type = "triangle") => {
		if (!state.sound) return;
		try {
			audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			oscillator.type = type;
			oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
			gainNode.gain.setValueAtTime(0.035, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
			oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
			oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
		} catch (_) { /* Audio is optional. */ }
	};
	function unlockCosmetic() {
		const groups = [{ key: "themes", values: themes }, { key: "skins", values: skins }, { key: "trails", values: trails }, { key: "arenas", values: arenas }];
		for (const group of groups) {
			if (state.unlocked[group.key].length >= group.values.length) continue;
			const next = group.values.findIndex((_, index) => !state.unlocked[group.key].includes(index));
			state.unlocked[group.key].push(next);
			notify(`${group.key.slice(0, -1)} unlocked: ${group.values[next]}`);
			return;
		}
	}
	function checkContracts() {
		let changed = false;
		for (let i = 0; i < state.contracts.length; i++) {
			const contract = state.contracts[i];
			if (contract.progress < contract.goal) continue;
			state.credits += contract.reward;
			state.shards++;
			unlockCosmetic();
			const choices = contractTypes.filter((item) => item.name !== contract.name && !state.contracts.some((active, activeIndex) => activeIndex !== i && active.name === item.name));
			state.contracts[i] = freshContract(choices[Math.floor(Math.random() * choices.length)] || contractTypes[0]);
			notify(`Contract complete: ${contract.name} · +${contract.reward} credits`);
			changed = true;
		}
		if (changed) { save(); render(); }
	}
	const gain = (kind, amount) => {
		if (!amount) return;
		for (const contract of state.contracts) if (contract.kind === kind) contract.progress += amount;
		checkContracts();
	};
	function emptyFrame(size = EDITOR_SIZE) {
		return { body: Array(size * size).fill(null), effects: Array(size * size).fill(null), visible: { body: true, effects: true } };
	}
	function sanitizeBoss(candidate) {
		if (!candidate || typeof candidate !== "object") return null;
		const size = [16, 24, 32].includes(Number(candidate.size)) ? Number(candidate.size) : EDITOR_SIZE;
		const frames = Array.isArray(candidate.frames) ? candidate.frames.slice(0, 8).map((frame) => {
			const normalized = emptyFrame(size);
			for (const layer of ["body", "effects"]) {
				const pixels = frame?.[layer];
				if (!Array.isArray(pixels)) continue;
				for (let i = 0; i < Math.min(pixels.length, size * size); i++) normalized[layer][i] = typeof pixels[i] === "string" && /^#[\da-f]{6}$/i.test(pixels[i]) ? pixels[i] : null;
				normalized.visible[layer] = frame?.visible?.[layer] !== false;
			}
			return normalized;
		}) : [];
		return {
			id: typeof candidate.id === "string" && candidate.id.length < 80 ? candidate.id : crypto.randomUUID(),
			name: String(candidate.name || "Unnamed boss").trim().slice(0, 32) || "Unnamed boss",
			category: ["Monster", "Humanoid", "Machine", "Artifact", "Elemental", "Alien", "Abstract"].includes(candidate.category) ? candidate.category : "Monster",
			size,
			frames: frames.length ? frames : [emptyFrame(size)],
			health: Math.round(Math.max(100, Math.min(2500, Number(candidate.health) || 450))),
			armor: Math.round(Math.max(0, Math.min(80, Number(candidate.armor) || 0))),
			speed: Math.max(0.45, Math.min(1.8, Number(candidate.speed) || 0.8)),
			attackRate: Math.max(0.45, Math.min(2.2, Number(candidate.attackRate) || 1)),
			attackPattern: ["aimed", "spread", "sweep"].includes(candidate.attackPattern) ? candidate.attackPattern : "aimed"
		};
	}
	function createBlankBoss(name = "Unnamed construct", category = "Monster") {
		return sanitizeBoss({ id: crypto.randomUUID(), name, category, size: EDITOR_SIZE, frames: [emptyFrame(), emptyFrame()] });
	}
	function createTemplateBoss(template) {
		const boss = createBlankBoss(template.name, template.category);
		const frame = boss.frames[0];
		const core = template.id === "wraith" ? "#e63946" : template.id === "machine" ? "#8f98a8" : template.id === "beast" ? "#55a878" : "#e7a85d";
		for (let y = 3; y < 22; y++) for (let x = 3; x < 21; x++) {
			const dx = (x - 12) / 9; const dy = (y - 12) / 10;
			const ellipse = dx * dx + dy * dy <= 1;
			const rect = x >= 6 && x <= 17 && y >= 4 && y <= 20;
			const diamond = Math.abs(x - 12) / 8 + Math.abs(y - 12) / 9 <= 1;
			const inside = template.id === "machine" ? rect : template.id === "artifact" ? diamond : template.id === "beast" ? ellipse && !(y < 7 && x > 16) : ellipse && y < 19;
			if (inside) frame.body[y * EDITOR_SIZE + x] = (x + y) % 6 === 0 ? "#f8fafc" : core;
		}
		for (let x = 8; x <= 15; x++) frame.body[7 * EDITOR_SIZE + x] = template.id === "wraith" ? "#ff777c" : core;
		for (const x of [8, 15]) for (let y = 10; y <= 12; y++) frame.effects[y * EDITOR_SIZE + x] = "#f8fafc";
		for (let x = 10; x <= 13; x++) frame.effects[15 * EDITOR_SIZE + x] = "#090a0e";
		boss.frames[1] = JSON.parse(JSON.stringify(frame));
		boss.health = 620; boss.armor = 16; boss.speed = 0.82; boss.attackRate = 1.05;
		return boss;
	}
	const selectedBoss = () => state.bosses.find((boss) => boss.id === state.selectedBossId) || state.bosses[0];
	function saveEditorHistory() {
		const frame = selectedBoss()?.frames[editorFrame];
		if (!frame) return;
		editorHistory.push(JSON.stringify(frame));
		if (editorHistory.length > 60) editorHistory.shift();
		editorRedo = [];
	}
	function drawBossPixels(context, boss, x, y, displaySize, frameIndex = 0) {
		if (!boss) return;
		const size = boss.size; const frame = boss.frames[frameIndex % boss.frames.length] || boss.frames[0];
		for (const layer of ["body", "effects"]) {
			if (frame.visible[layer] === false) continue;
			for (let i = 0; i < size * size; i++) {
				const color = frame[layer][i];
				if (!color) continue;
				context.fillStyle = color;
				context.fillRect(x + i % size * displaySize / size, y + Math.floor(i / size) * displaySize / size, displaySize / size, displaySize / size);
			}
		}
	}
	function drawPilotSprite(context, centerX, centerY, displaySize, skin, color) {
		const designs = [
			["00100", "01110", "11111", "10101", "11111", "01010", "01010"],
			["10001", "11011", "11111", "10101", "11111", "01110", "01010"],
			["00100", "10101", "01110", "11111", "11111", "01010", "10001"]
		];
		const design = designs[skin % designs.length]; const scale = displaySize / design.length; const left = centerX - displaySize / 2; const top = centerY - displaySize / 2;
		context.fillStyle = "#090a0e";
		for (let y = 0; y < design.length; y++) for (let x = 0; x < design[y].length; x++) if (design[y][x] === "1") context.fillRect(left + x * scale + 1, top + y * scale + 1, scale, scale);
		context.fillStyle = color;
		for (let y = 0; y < design.length; y++) for (let x = 0; x < design[y].length; x++) if (design[y][x] === "1") context.fillRect(left + x * scale, top + y * scale, scale, scale);
		context.fillStyle = "#f8fafc"; context.fillRect(centerX - scale, centerY - scale, scale, scale); context.fillRect(centerX + scale, centerY - scale, scale, scale);
	}
	function render() {
		const main = $("#view");
		document.documentElement.style.setProperty("--accent", palettes[state.equipped.theme] || palettes[0]);
		$("#credits").textContent = state.credits.toLocaleString();
		$("#shards").textContent = state.shards;
		const stageLabel = $("#stage-label");
		if (stageLabel) stageLabel.textContent = `STAGE ${String(state.stage).padStart(2, "0")}`;
		document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === currentView));
		if (currentView === "play") main.innerHTML = playView();
		if (currentView === "boss") main.innerHTML = bossEditorView();
		if (currentView === "forge") main.innerHTML = forgeView();
		if (currentView === "contracts") main.innerHTML = contractsView();
		if (currentView === "locker") main.innerHTML = lockerView();
		if (currentView === "vault") main.innerHTML = vaultView();
		if (currentView === "records") main.innerHTML = recordsView();
		if (currentView === "boss") bindEditorCanvas();
		if (game && currentView === "play") game.canvas = $("#arena");
		if (game && currentView === "play") drawGame();
	}
	function playView() {
		const result = game && !game.active ? game.result : null;
		return `<section class="play-layout"><div class="arena-column"><div class="arena-heading"><div><span class="eyebrow">ASCENSION NETWORK / ${arenas[state.equipped.arena].toUpperCase()}</span><h1>${selectedMode}</h1></div><span id="stage-label" class="stage-tag">STAGE ${String(state.stage).padStart(2, "0")}</span></div><div class="canvas-wrap"><canvas id="arena" aria-label="Bossforge combat arena"></canvas><div id="arena-hud" class="arena-hud ${result ? "result" : ""}"><span id="player-hp">${result ? `REWARD +${result.reward} CR` : "HULL 100%"}</span><span id="run-status">${result ? result.message : "READY"}</span><span id="boss-hp">${result ? `${result.score} PTS` : "TARGET 100%"}</span></div><div class="mobile-controls"><button data-control="up" aria-label="Move up">↑</button><button data-control="left" aria-label="Move left">←</button><button data-control="down" aria-label="Move down">↓</button><button data-control="right" aria-label="Move right">→</button><button data-control="fire" aria-label="Fire">FIRE</button></div></div><div class="run-bar"><div class="mode-select">${modes.map((mode) => `<button data-mode="${mode}" class="mode-button ${selectedMode === mode ? "selected" : ""}">${mode}</button>`).join("")}<button data-mode="Ascension Trial" class="mode-button ${selectedMode === "Ascension Trial" ? "selected" : ""}" ${Rules.canStartAscensionTrial(state) ? "" : 'disabled title="Requires 50 Campaign clears and all 540 network ranks"'}>Ascension Trial</button></div><button id="launch" class="primary-button">${game && game.active ? "RESTART RUN" : "LAUNCH ARENA"}<span>↗</span></button></div><p class="control-hint">WASD / arrows to move · Space to fire · touch controls supported</p></div><aside class="play-rail"><div class="rail-title"><span class="eyebrow">FIELD REPORT</span><span class="live-dot"></span></div><div class="rail-stat"><span>Campaign clears</span><strong>${state.campaignClears}/50</strong></div><div class="rail-stat"><span>Threat rating</span><strong>${Rules.getCombatEffects(state.ranks).threatRating}</strong></div><div class="rail-stat"><span>Ascensions</span><strong>${state.prestige}</strong></div><div class="rail-contract"><div class="eyebrow">ACTIVE CONTRACTS</div>${state.contracts.slice(0, 3).map((c) => `<div class="mini-contract"><span>${c.name}</span><b>${Math.min(c.progress, c.goal)}/${c.goal}</b></div>`).join("")}<button data-view="contracts" class="text-button">All contracts <span>→</span></button></div><div class="rail-contract chest-mini"><div class="eyebrow">CHEST VAULT</div><p>${readyChests()} chests ready to claim</p><button data-view="vault" class="text-button">Open vault <span>→</span></button></div></aside></section>`;
	}
	const readyChests = () => state.chests.filter((time) => time > 0 && time <= Date.now()).length;
	const upgradeCost = (index, rank) => 18 + (index % 7) * 3 + rank * 22;
	function forgeView() {
		const mastered = state.ranks.reduce((sum, rank) => sum + rank, 0);
		const campaignClears = Math.max(0, state.stage - 1);
		const eligible = Rules.canRegisterLeaderboard(state);
		const effects = Rules.getCombatEffects(state.ranks);
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">18 DISCIPLINES / 10 SECTORS</span><h1>Ascension Network</h1><p>${mastered} / 540 ranks mastered · Threat ${effects.threatRating}</p></div><div class="network-progress"><div class="progress-line"><i style="width:${mastered / 5.4}%"></i></div><b>${(mastered / 5.4).toFixed(1)}%</b></div></div><div class="network-grid">${disciplines.map((discipline, d) => `<div class="discipline-row"><div class="discipline-name"><span>${String(d + 1).padStart(2, "0")}</span>${discipline}</div><div class="sector-list">${sectors.map((sector, s) => { const index = d * 10 + s; const rank = state.ranks[index]; return `<button class="node rank-${rank}" data-upgrade="${index}" title="${discipline} / ${sector} · Rank ${rank}/3 · ${Rules.DISCIPLINE_EFFECTS[d]} · Threat +1, enemy difficulty +0.09%"><span class="node-name">${sector}</span><span class="node-pips">${[0, 1, 2].map((n) => `<i class="${n < rank ? "filled" : ""}"></i>`).join("")}</span><small>${rank < 3 ? `${upgradeCost(index, rank)} cr` : "MASTERED"}</small></button>`; }).join("")}</div></div>`).join("")}</div><div class="prestige-strip"><div><span class="eyebrow">REBIRTH PROTOCOL</span><p>Clear 50 Campaign stages, master all 540 ranks, and defeat both phases of the Ascension Trial.</p></div><span class="prestige-condition">${campaignClears}/50 CAMPAIGN · ${mastered}/540 · ${state.finalTrialComplete ? "TRIAL CLEARED" : "TRIAL LOCKED"}</span><button class="secondary-button" id="prestige" ${eligible ? "" : "disabled"}>ASCEND</button></div></section>`;
	}
	function contractsView() {
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">FIELD ORDERS / REPLACED ON COMPLETION</span><h1>Active contracts</h1><p>Complete an order for credits, a forge shard, and a cosmetic unlock.</p></div><span class="count-badge">${state.contracts.length} ACTIVE</span></div><div class="contract-grid">${state.contracts.map((c, i) => `<article class="contract-card"><span class="contract-index">0${i + 1} / ROTATION</span><h2>${c.name}</h2><p>Earn ${c.goal} ${c.verb}.</p><div class="contract-progress"><div><i style="width:${Math.min(100, c.progress / c.goal * 100)}%"></i></div><span>${Math.min(c.progress, c.goal)} / ${c.goal}</span></div><div class="contract-reward"><span>REWARD</span><b>◈ ${c.reward} credits <i>+1 shard</i></b></div></article>`).join("")}</div></section>`;
	}
	function lockerView() {
		const groups = [{ key: "themes", label: "Themes", values: themes, equipped: "theme" }, { key: "skins", label: "Pilot frames", values: skins, equipped: "skin" }, { key: "trails", label: "Projectile trails", values: trails, equipped: "trail" }, { key: "arenas", label: "Environments", values: arenas, equipped: "arena" }];
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">FIELD KIT / QUEST REWARDS</span><h1>Locker</h1><p>Customization is earned by completing contracts.</p></div></div>${groups.map((group) => `<div class="locker-group"><div class="locker-title"><h2>${group.label}</h2><span>${state.unlocked[group.key].length} / ${group.values.length} UNLOCKED</span></div><div class="cosmetic-row">${group.values.map((value, i) => { const unlocked = state.unlocked[group.key].includes(i); const equipped = state.equipped[group.equipped] === i; return `<button class="cosmetic ${unlocked ? "unlocked" : "locked"} ${equipped ? "equipped" : ""}" ${unlocked ? `data-equip="${group.equipped}" data-id="${i}"` : "disabled"}><span class="swatch" style="--swatch:${palettes[i % palettes.length]}"></span><span>${value}</span><small>${equipped ? "EQUIPPED" : unlocked ? "EQUIP" : "LOCKED"}</small></button>`; }).join("")}</div></div>`).join("")}</section>`;
	}
	function vaultView() {
		const now = Date.now();
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">THREE LIVE COUNTDOWNS</span><h1>Chest vault</h1><p>Claim credits and forge shards when a slot is ready.</p></div></div><div class="vault-grid">${[25, 55, 95].map((seconds, i) => { const time = state.chests[i]; const ready = time > 0 && time <= now; const countdown = time ? Math.max(0, time - now) : 0; return `<article class="vault-slot ${ready ? "ready" : ""}"><span class="eyebrow">SLOT 0${i + 1} / ${seconds} SEC</span><div class="chest-art">${ready ? "✦" : "▣"}</div><strong>${ready ? "READY TO CLAIM" : time ? formatTime(countdown) : "AWAITING RUN"}</strong><p>${ready ? "A supply cache is waiting." : time ? "The forge is assembling your cache." : "Launch an arena to start the timer."}</p><button class="${ready ? "primary-button" : "secondary-button"}" data-chest="${i}" ${ready ? "" : "disabled"}>${ready ? "CLAIM CACHE" : "LOCKED"}</button></article>`; }).join("")}</div></section>`;
	}
	function bossEditorView() {
		const boss = selectedBoss();
		if (!boss) return `<section class="page-view"><h1>Boss Creator</h1><button class="primary-button" data-new-boss>CREATE BOSS</button></section>`;
		return `<section class="page-view">
			<div class="page-heading"><div><span class="eyebrow">PIXEL WORKSHOP / LOCAL DESIGNS</span><h1>Boss Creator</h1><p>Draw a boss, tune its behavior, then test it in a no-reward sandbox.</p></div><span class="count-badge">${state.bosses.length} / 20 DESIGNS</span></div>
			<div class="boss-list">${state.bosses.map((item) => `<button class="boss-chip ${item.id === boss.id ? "selected" : ""}" data-select-boss="${escapeHTML(item.id)}">${escapeHTML(item.name)}</button>`).join("")}<button class="editor-action" data-new-boss>+ NEW</button></div>
			<div class="editor-toolbar">${["pencil", "eraser", "fill", "line", "rectangle"].map((tool) => `<button class="editor-tool ${editorTool === tool ? "selected" : ""}" data-tool="${tool}">${tool.toUpperCase()}</button>`).join("")}<button class="editor-tool" data-undo ${editorHistory.length ? "" : "disabled"}>UNDO</button><button class="editor-tool" data-redo ${editorRedo.length ? "" : "disabled"}>REDO</button><label class="editor-check-row"><input type="checkbox" data-symmetry ${editorSymmetry ? "checked" : ""}> MIRROR</label><label class="editor-check-row"><input type="checkbox" data-grid ${editorGrid ? "checked" : ""}> GRID</label><button class="editor-tool" data-zoom="-1" aria-label="Zoom out">−</button><span class="editor-meta">${Math.round(editorZoom * 100)}%</span><button class="editor-tool" data-zoom="1" aria-label="Zoom in">+</button></div>
			<div class="boss-list">${EDITOR_TEMPLATES.map((template) => `<button class="boss-chip" data-template="${template.id}">+ ${template.name}</button>`).join("")}<span class="editor-meta">STARTER FRAMES</span></div>
			<div class="editor-layout"><div class="editor-main">
				<div class="editor-tabs">${boss.frames.map((_, index) => `<button class="editor-tab ${editorFrame === index ? "selected" : ""}" data-frame="${index}">FRAME ${index + 1}</button>`).join("")}<button class="editor-tab" data-add-frame>+ FRAME</button><button class="editor-tab" data-delete-frame ${boss.frames.length <= 1 ? "disabled" : ""}>DELETE FRAME</button><button class="editor-tab ${editorLayer === "body" ? "selected" : ""}" data-layer="body">BODY LAYER</button><button class="editor-tab ${editorLayer === "effects" ? "selected" : ""}" data-layer="effects">EFFECTS LAYER</button><label class="editor-check-row"><input type="checkbox" data-layer-visible ${boss.frames[editorFrame].visible[editorLayer] !== false ? "checked" : ""}> VISIBLE</label></div>
				<div class="editor-stage"><canvas id="pixel-editor" class="pixel-canvas" width="${boss.size}" height="${boss.size}" style="width:min(100%, ${Math.round(560 * editorZoom)}px)" aria-label="Editable ${boss.size} by ${boss.size} boss sprite"></canvas><canvas id="boss-preview" class="editor-preview" width="96" height="96" aria-label="Animated boss preview"></canvas></div>
				<div class="editor-palette">${EDITOR_COLORS.map((color) => `<button style="--swatch:${color}" data-color="${color}" aria-label="Select color ${color}" title="${color}"></button>`).join("")}<label class="editor-action">CUSTOM COLOR <input type="color" data-custom-color value="${editorColor}" aria-label="Choose custom pixel color"></label></div>
				<div class="editor-actions"><button class="primary-button" data-save-boss>SAVE DESIGN</button><button class="secondary-button" data-test-boss>TEST BOSS</button><button class="editor-action" data-duplicate-boss>DUPLICATE</button><button class="editor-action" data-export-boss>EXPORT JSON</button><button class="editor-action" data-import-boss>IMPORT JSON</button><input id="boss-import-file" type="file" accept="application/json,.json" hidden><button class="editor-action" data-delete-boss>DELETE</button></div>
			</div><aside class="editor-inspector">
				<label>DESIGN NAME<input type="text" maxlength="32" data-boss-prop="name" value="${escapeHTML(boss.name)}"></label>
				<label>ANATOMY<select data-boss-prop="category">${["Monster", "Humanoid", "Machine", "Artifact", "Elemental", "Alien", "Abstract"].map((category) => `<option ${boss.category === category ? "selected" : ""}>${category}</option>`).join("")}</select></label>
				<label>SPRITE SIZE<select data-size>${[16, 24, 32].map((size) => `<option value="${size}" ${boss.size === size ? "selected" : ""}>${size} × ${size}</option>`).join("")}</select></label>
				<label>HEALTH <output id="boss-health-value">${boss.health}</output><input type="range" min="100" max="2500" step="25" data-boss-prop="health" value="${boss.health}"></label>
				<label>ARMOR <output id="boss-armor-value">${boss.armor}</output><input type="range" min="0" max="80" step="1" data-boss-prop="armor" value="${boss.armor}"></label>
				<label>MOVEMENT <output id="boss-speed-value">${boss.speed.toFixed(2)}</output><input type="range" min="0.45" max="1.8" step="0.05" data-boss-prop="speed" value="${boss.speed}"></label>
				<label>ATTACK FREQUENCY <output id="boss-rate-value">${boss.attackRate.toFixed(2)}×</output><input type="range" min="0.45" max="2.2" step="0.05" data-boss-prop="attackRate" value="${boss.attackRate}"></label>
				<label>ATTACK PATTERN<select data-boss-prop="attackPattern"><option value="aimed" ${boss.attackPattern === "aimed" ? "selected" : ""}>Aimed shots</option><option value="spread" ${boss.attackPattern === "spread" ? "selected" : ""}>Three-way spread</option><option value="sweep" ${boss.attackPattern === "sweep" ? "selected" : ""}>Sweeping volley</option></select></label>
				<div class="editor-meta">SANDBOX POWER BUDGET: ${boss.health + boss.armor * 8 + Math.round(boss.speed * 120 + boss.attackRate * 90)} / 4,000</div>
			</aside></div></section>`;
	}
	function editorPoint(event, canvas) {
		const rect = canvas.getBoundingClientRect(); const boss = selectedBoss();
		return { x: Math.max(0, Math.min(boss.size - 1, Math.floor((event.clientX - rect.left) / rect.width * boss.size))), y: Math.max(0, Math.min(boss.size - 1, Math.floor((event.clientY - rect.top) / rect.height * boss.size))) };
	}
	function paintPixel(x, y, color) {
		const boss = selectedBoss(); const frame = boss?.frames[editorFrame];
		if (!frame || x < 0 || y < 0 || x >= boss.size || y >= boss.size) return;
		const paint = (px) => { frame[editorLayer][y * boss.size + px] = color; };
		paint(x);
		if (editorSymmetry) paint(boss.size - 1 - x);
	}
	function drawEditorLine(from, to, color) {
		let x = from.x; let y = from.y;
		const dx = Math.abs(to.x - x); const sx = x < to.x ? 1 : -1;
		const dy = -Math.abs(to.y - y); const sy = y < to.y ? 1 : -1;
		let error = dx + dy;
		while (true) {
			paintPixel(x, y, color);
			if (x === to.x && y === to.y) break;
			const twice = error * 2;
			if (twice >= dy) { error += dy; x += sx; }
			if (twice <= dx) { error += dx; y += sy; }
		}
	}
	function fillEditorRegion(point, color) {
		const boss = selectedBoss(); const frame = boss.frames[editorFrame];
		const fillFrom = (startX) => {
			const pixels = frame[editorLayer]; const target = pixels[point.y * boss.size + startX];
			if (target === color) return;
			const stack = [[startX, point.y]];
			while (stack.length) {
				const [x, y] = stack.pop();
				if (x < 0 || y < 0 || x >= boss.size || y >= boss.size || pixels[y * boss.size + x] !== target) continue;
				pixels[y * boss.size + x] = color;
				stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
			}
		};
		fillFrom(point.x);
		if (editorSymmetry) fillFrom(boss.size - 1 - point.x);
	}
	function drawEditorRectangle(start, end, color) {
		for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
			paintPixel(x, start.y, color); paintPixel(x, end.y, color);
		}
		for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
			paintPixel(start.x, y, color); paintPixel(end.x, y, color);
		}
	}
	function drawEditorCanvas() {
		const boss = selectedBoss(); const canvas = $("#pixel-editor"); const preview = $("#boss-preview");
		if (!boss || !canvas || !preview) return;
		const context = canvas.getContext("2d"); context.clearRect(0, 0, boss.size, boss.size);
		drawBossPixels(context, boss, 0, 0, boss.size, editorFrame);
		if (editorGrid) {
			context.strokeStyle = "rgba(255,255,255,.16)"; context.lineWidth = 0.035;
			for (let i = 0; i <= boss.size; i++) { context.beginPath(); context.moveTo(i, 0); context.lineTo(i, boss.size); context.stroke(); context.beginPath(); context.moveTo(0, i); context.lineTo(boss.size, i); context.stroke(); }
		}
		const previewContext = preview.getContext("2d"); previewContext.clearRect(0, 0, preview.width, preview.height);
		const previewFrame = Math.floor(Date.now() / 360) % boss.frames.length;
		const bob = Math.sin(Date.now() / 240) * 2;
		drawBossPixels(previewContext, boss, 8, 8 + bob, 80, previewFrame);
	}
	function bindEditorCanvas() {
		const canvas = $("#pixel-editor");
		if (!canvas) return;
		canvas.addEventListener("pointerdown", (event) => {
			event.preventDefault(); canvas.setPointerCapture(event.pointerId); saveEditorHistory();
			const point = editorPoint(event, canvas); editorPointer = { start: point, last: point };
			if (editorTool === "pencil") drawEditorLine(point, point, editorColor);
			if (editorTool === "eraser") drawEditorLine(point, point, null);
			if (editorTool === "fill") fillEditorRegion(point, editorColor);
			drawEditorCanvas();
		});
		canvas.addEventListener("pointermove", (event) => {
			if (!editorPointer || !["pencil", "eraser"].includes(editorTool)) return;
			const point = editorPoint(event, canvas); drawEditorLine(editorPointer.last, point, editorTool === "eraser" ? null : editorColor); editorPointer.last = point; drawEditorCanvas();
		});
		const finishStroke = (event) => {
			if (!editorPointer) return;
			const point = editorPoint(event, canvas);
			if (editorTool === "line") drawEditorLine(editorPointer.start, point, editorColor);
			if (editorTool === "rectangle") drawEditorRectangle(editorPointer.start, point, editorColor);
			editorPointer = null; save(); drawEditorCanvas();
		};
		canvas.addEventListener("pointerup", finishStroke);
		canvas.addEventListener("pointercancel", finishStroke);
		drawEditorCanvas();
	}
	function resizeBoss(boss, size) {
		if (!boss || ![16, 24, 32].includes(size) || size === boss.size) return;
		for (const frame of boss.frames) for (const layer of ["body", "effects"]) {
			const oldPixels = frame[layer]; const next = Array(size * size).fill(null);
			for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) next[y * size + x] = oldPixels[Math.floor(y * boss.size / size) * boss.size + Math.floor(x * boss.size / size)];
			frame[layer] = next;
		}
		boss.size = size;
	}
	function recordsView() {
		const sorted = [...state.leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
		const registrationReady = state.completionRecordPending && Rules.canRegisterLeaderboard(state);
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">LOCAL / THIS BROWSER ONLY</span><h1>Hall of records</h1><p>Scores are local. Registration opens only after the 50-stage Campaign, all 540 ranks, and the final Ascension Trial.</p></div><span class="count-badge">${registrationReady ? "ASCENSION COMPLETE" : "ENDGAME REQUIREMENTS LOCKED"}</span></div><div class="leaderboard"><div class="leader-head"><span>RANK</span><span>PILOT</span><span>MODE</span><span>SCORE</span></div>${sorted.length ? sorted.map((entry, i) => `<div class="leader-entry"><span>${String(i + 1).padStart(2, "0")}</span><strong>${escapeHTML(entry.name || "UNREGISTERED")}</strong><span>${escapeHTML(entry.mode)}</span><b>${entry.score.toLocaleString()}</b></div>`).join("") : `<div class="empty-records">No records yet. Local run scores will appear here.</div>`}</div>${registrationReady ? `<form id="record-form" class="record-form"><label for="nickname">Register final Ascension clear</label><input id="nickname" name="nickname" maxlength="18" minlength="2" placeholder="Pilot nickname" required><button class="primary-button">SUBMIT SCORE</button></form>` : ""}<button class="secondary-button download-button" id="download-standalone">DOWNLOAD STANDALONE HTML</button></section>`;
	}
	function newGame() {
		if (selectedMode === "Ascension Trial" && !Rules.canStartAscensionTrial(state)) return notify("Clear all 50 Campaign stages and master all 540 ranks first.");
		cancelAnimationFrame(frame); clearInterval(musicTimer); keys.clear();
		const canvas = $("#arena");
		const effects = Rules.getCombatEffects(state.ranks);
		const bossConfig = selectedMode === "Boss Sandbox" ? sanitizeBoss(selectedBoss()) : null;
		const enemyDifficulty = effects.enemyDifficultyMultiplier * (1 + Math.max(0, state.stage - 1) * 0.008);
		const segmentHp = selectedMode === "Ascension Trial" ? 1000 : bossConfig ? bossConfig.health : (selectedMode === "Chaos Trial" ? 170 : 100) + Math.min(state.stage, 50) * 3;
		const maxBossHp = selectedMode === "Endurance" ? 100000 : Math.round(segmentHp * enemyDifficulty);
		game = { active: true, paused: false, mode: selectedMode, effects, enemyDifficulty, bossConfig, hp: effects.maxHull, shield: effects.shieldPoints, bossHp: maxBossHp, maxBossHp, bossArmor: bossConfig ? bossConfig.armor / 100 : 0, player: { x: 0.14, y: 0.72 }, boss: { x: 0.78, y: 0.24, phase: 0 }, bullets: [], enemyBullets: [], elapsed: 0, score: 0, lastShot: 0, lastEnemyShot: 0, lastDamage: 0, lastDash: 0, finalTrialRivalPhase: false, canvas };
		canvas.focus();
		if (selectedMode !== "Boss Sandbox") {
			state.chests = state.chests.map((time, i) => time || Date.now() + [25000, 55000, 95000][i]);
			gain("runs", 1);
		}
		save(); render(); sound(240, 0.16, "sawtooth");
		musicTimer = setInterval(() => { if (game && game.active) sound([98, 123, 146, 110][Math.floor((game.elapsed / 1.8) % 4)], 0.28, "sine"); }, 1800);
		lastTick = performance.now(); frame = requestAnimationFrame(tick);
	}
	function endGame(won) {
		if (!game || !game.active) return;
		game.active = false; clearInterval(musicTimer);
		const sandbox = game.mode === "Boss Sandbox";
		const trialClear = game.mode === "Ascension Trial" && won && Rules.canStartAscensionTrial(state);
		const reward = sandbox ? 0 : Math.floor(((won ? 70 : 22) + game.score / 8) * game.effects.rewardMultiplier);
		if (!sandbox) {
			state.credits += reward; state.shards += won ? 2 : 1; state.best = Math.max(state.best, game.score);
			gain("credits", reward); if (won) gain("wins", 1);
			if (won) {
				state.clears++;
				if (game.mode === "Campaign") { state.campaignClears = Math.min(50, state.campaignClears + 1); state.stage = Math.min(51, state.campaignClears + 1); }
			}
			if (trialClear) {
				state.finalTrialComplete = true; state.finalBossDefeated = true; state.finalRivalDefeated = true;
				state.completionRecordPending = true; state.completed = true;
			}
			state.leaderboard.push({ id: crypto.randomUUID(), name: "UNREGISTERED", mode: game.mode, score: game.score, pending: trialClear, ascensionClear: trialClear });
			gain("survive", Math.floor(game.elapsed));
		}
		game.result = { message: sandbox ? (won ? "SANDBOX TEST CLEARED" : "SANDBOX TEST ENDED") : trialClear ? "ASCENSION COMPLETE" : won ? "SECTOR CLEARED" : "HULL BREACHED", reward, score: game.score };
		save(); sound(won ? 620 : 95, 0.6, won ? "sine" : "sawtooth");
		render();
		if (trialClear) notify("Ascension Trial complete. Hall of Ascension registration is unlocked.");
		else if (sandbox) notify("Sandbox test ended. Campaign progress and rewards were not changed.");
		else notify(`${won ? "Sector cleared" : "Run complete"} · ${reward} credits`);
	}
	function tick(now) {
		const delta = Math.min(0.04, (now - lastTick) / 1000); lastTick = now;
		if (!game || !game.active || game.paused) return;
		game.elapsed += delta;
		const bounds = game.canvas.getBoundingClientRect(); const width = bounds.width; const height = bounds.height;
		const speed = 0.42 * game.effects.movementMultiplier * delta;
		if (keys.has("Shift") && now - game.lastDash > 950 * game.effects.dashCooldownMultiplier) { game.player.x = Math.min(0.63, game.player.x + 0.13); game.lastDash = now; game.invulnerableUntil = now + 180; }
		if (keys.has("ArrowUp") || keys.has("w") || keys.has("W") || keys.has("up")) game.player.y -= speed;
		if (keys.has("ArrowDown") || keys.has("s") || keys.has("S") || keys.has("down")) game.player.y += speed;
		if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || keys.has("left")) game.player.x -= speed;
		if (keys.has("ArrowRight") || keys.has("d") || keys.has("D") || keys.has("right")) game.player.x += speed;
		game.player.x = Math.max(0.04, Math.min(0.63, game.player.x)); game.player.y = Math.max(0.08, Math.min(0.9, game.player.y));
		game.boss.phase += delta * (game.bossConfig?.speed || 1) * game.enemyDifficulty;
		game.boss.x = 0.77 + Math.sin(game.boss.phase * (game.mode === "Chaos Trial" ? 2.3 : 1.25)) * 0.12;
		game.boss.y = 0.2 + Math.sin(game.boss.phase * 1.8) * 0.11;
		game.hp = Math.min(game.effects.maxHull, game.hp + game.effects.hullRegenPerSecond * delta);
		if ((keys.has(" ") || keys.has("fire") || pointerDown) && now - game.lastShot > 240 / game.effects.fireRateMultiplier) {
			game.bullets.push({ x: game.player.x + 0.05, y: game.player.y, speed: 1.08 * game.effects.projectileSpeedMultiplier }); game.lastShot = now; gain("shots", 1); sound(390, 0.05, "square");
		}
		const attackInterval = Math.max(250, (game.mode === "Chaos Trial" ? 570 : 900) / (game.bossConfig?.attackRate || 1) / game.enemyDifficulty * (1 + game.effects.enemySlow));
		if (now - game.lastEnemyShot > attackInterval) {
			const dx = game.player.x - game.boss.x; const dy = game.player.y - game.boss.y; const length = Math.hypot(dx, dy) || 1;
			const angle = Math.atan2(dy, dx);
			const offsets = game.bossConfig?.attackPattern === "spread" ? [-0.26, 0, 0.26] : game.bossConfig?.attackPattern === "sweep" ? [Math.sin(game.elapsed * 1.6) * 0.34] : [0];
			for (const offset of offsets) game.enemyBullets.push({ x: game.boss.x - 0.035, y: game.boss.y + 0.02, vx: Math.cos(angle + offset) * 0.31 * game.enemyDifficulty, vy: Math.sin(angle + offset) * 0.31 * game.enemyDifficulty });
			game.lastEnemyShot = now;
		}
		game.bullets = game.bullets.filter((bullet) => {
			bullet.x += bullet.speed * delta;
			bullet.y += Math.max(-0.28, Math.min(0.28, (game.boss.y - bullet.y) * game.effects.homingStrength)) * delta;
			if (Math.hypot((bullet.x - game.boss.x) * width, (bullet.y - game.boss.y) * height) < 30) {
				const critical = Math.random() < game.effects.criticalChance;
				const damage = 5 * game.effects.damageMultiplier * (critical ? 1.8 : 1) * (1 - game.bossArmor * (1 - game.effects.armorPierce));
				const chained = Math.random() < game.effects.chainChance;
				const echoed = Math.random() < game.effects.repeatChance;
				game.bossHp -= damage * (chained ? 1.65 : 1); game.score += 12;
				game.hp = Math.min(game.effects.maxHull, game.hp + game.effects.onHitRecovery);
				if (echoed) { bullet.x = game.player.x + 0.05; bullet.y = game.player.y; return true; }
				return false;
			}
			return bullet.x < 1.1;
		});
		game.enemyBullets = game.enemyBullets.filter((bullet) => {
			bullet.x += bullet.vx * delta; bullet.y += bullet.vy * delta;
			if (Math.hypot((bullet.x - game.player.x) * width, (bullet.y - game.player.y) * height) < 22) {
				if (now > (game.invulnerableUntil || 0) && now - game.lastDamage > 480) {
					let damage = (game.mode === "Chaos Trial" ? 13 : 10) * game.enemyDifficulty;
					const shieldAbsorbed = Math.min(game.shield, damage); game.shield -= shieldAbsorbed; damage -= shieldAbsorbed; game.hp -= damage;
					game.lastDamage = now; sound(115, 0.12, "sawtooth");
				}
				return false;
			}
			if (bullet.x < game.player.x - 0.03 && Math.abs(bullet.y - game.player.y) < 0.07) { gain("dodges", 1); return false; }
			return bullet.x > -0.08 && bullet.x < 1.08 && bullet.y > -0.08 && bullet.y < 1.08;
		});
		game.score += Math.floor(delta * (game.mode === "Endurance" ? 16 : 4));
		if (game.mode === "Endurance" && game.elapsed >= 70) return endGame(true);
		if (game.bossHp <= 0 && game.mode === "Ascension Trial" && !game.finalTrialRivalPhase) {
			game.finalTrialRivalPhase = true; game.bossHp = game.maxBossHp = Math.round(1000 * game.enemyDifficulty); game.enemyBullets.length = 0; game.boss.phase = 0; notify("Final rival engaged. Keep moving."); sound(180, 0.4, "sawtooth");
		}
		else if (game.bossHp <= 0 && game.mode !== "Endurance") return endGame(true);
		if (game.hp <= 0) return endGame(false);
		if (game.mode === "Rival Duel" && game.elapsed > 65) return endGame(false);
		drawGame(); frame = requestAnimationFrame(tick);
	}
	function drawGame() {
		if (!game || !game.canvas || !game.canvas.isConnected) return;
		const canvas = game.canvas; const rect = canvas.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
		if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) { canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); }
		const ctx = canvas.getContext("2d"); const w = rect.width; const h = rect.height; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		const environment = state.equipped.arena;
		const backdrops = ["#101719", "#191719", "#112027", "#211b19", "#172021", "#1b1b20", "#132124", "#241b17", "#1a1b21", "#14211e", "#172023", "#20201b"];
		ctx.fillStyle = backdrops[environment] || backdrops[0]; ctx.fillRect(0, 0, w, h);
		ctx.strokeStyle = `${palettes[environment]}22`; ctx.lineWidth = 1;
		for (let x = (game.elapsed * 18) % 44; x < w; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 30, h); ctx.stroke(); }
		for (let y = 0; y < h; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
		if (environment % 3 === 1) { for (let radius = 30; radius < Math.max(w, h); radius += 62) { ctx.beginPath(); ctx.arc(w * 0.72, h * 0.46, radius, 0, Math.PI * 2); ctx.stroke(); } }
		if (environment % 3 === 2) { for (let x = 0; x < w; x += 96) { ctx.fillStyle = `${palettes[environment]}09`; ctx.fillRect(x, 0, 32, h); } }
		for (let i = 0; i < 14; i++) { const x = (i * 127 + game.elapsed * 13) % w; const y = (i * 71) % h; ctx.fillStyle = "rgba(214,240,223,.45)"; ctx.fillRect(x, y, 1.5, 1.5); }
		const px = game.player.x * w; const py = game.player.y * h; const bx = game.boss.x * w; const by = game.boss.y * h;
		ctx.imageSmoothingEnabled = false;
		drawPilotSprite(ctx, px, py, 35, state.equipped.skin, palettes[state.equipped.skin % palettes.length]);
		const rival = game.bossConfig || (game.mode === "Ascension Trial" && game.finalTrialRivalPhase ? ascensionRivalSprite : standardRivalSprite);
		drawBossPixels(ctx, rival, bx - 31, by - 31, 62, Math.floor(game.elapsed * 3));
		for (const bullet of game.bullets) { ctx.fillStyle = palettes[state.equipped.trail % palettes.length]; ctx.fillRect(bullet.x * w, bullet.y * h, 8, 3); }
		for (const bullet of game.enemyBullets) { ctx.fillStyle = "#ff777c"; ctx.fillRect(bullet.x * w, bullet.y * h, 5, 5); }
		ctx.shadowBlur = 0;
		if (game.active) {
			$("#player-hp").textContent = `HULL ${Math.max(0, Math.ceil(game.hp))}%`;
			$("#boss-hp").textContent = game.mode === "Endurance" ? "SURVIVE 70 SEC" : `TARGET ${Math.max(0, Math.ceil(game.bossHp / game.maxBossHp * 100))}%`;
			$("#run-status").textContent = `${Math.floor(game.elapsed)}s · ${game.score} PTS`;
		}
	}
	function navigate(view) {
		const wasPaused = game?.paused;
		currentView = view;
		if (game?.active && view !== "play") { game.paused = true; cancelAnimationFrame(frame); keys.clear(); }
		render();
		if (game?.active && view === "play" && wasPaused) { game.paused = false; game.canvas = $("#arena"); lastTick = performance.now(); frame = requestAnimationFrame(tick); }
	}
	function addBoss(template) {
		if (state.bosses.length >= 20) return notify("Workshop limit reached: 20 designs.");
		const boss = template ? createTemplateBoss(template) : createBlankBoss();
		state.bosses.push(boss); state.selectedBossId = boss.id; editorFrame = 0; editorHistory = []; editorRedo = []; save(); render();
	}
	function undoEditor(redo = false) {
		const source = redo ? editorRedo : editorHistory; const destination = redo ? editorHistory : editorRedo;
		const snapshot = source.pop(); const boss = selectedBoss();
		if (!snapshot || !boss?.frames[editorFrame]) return;
		destination.push(JSON.stringify(boss.frames[editorFrame]));
		boss.frames[editorFrame] = JSON.parse(snapshot); save(); render();
	}
	function handleEditorAction(event) {
		const target = event.target;
		if (target.closest("[data-new-boss]")) { addBoss(); return true; }
		const templateButton = target.closest("[data-template]");
		if (templateButton) { addBoss(EDITOR_TEMPLATES.find((template) => template.id === templateButton.dataset.template)); return true; }
		const selection = target.closest("[data-select-boss]");
		if (selection) { state.selectedBossId = selection.dataset.selectBoss; editorFrame = 0; editorHistory = []; editorRedo = []; save(); render(); return true; }
		const tool = target.closest("[data-tool]"); if (tool) { editorTool = tool.dataset.tool; render(); return true; }
		const colorButton = target.closest("[data-color]"); if (colorButton) { editorColor = colorButton.dataset.color; render(); return true; }
		const layer = target.closest("[data-layer]"); if (layer) { editorLayer = layer.dataset.layer; render(); return true; }
		const frame = target.closest("[data-frame]"); if (frame) { editorFrame = Number(frame.dataset.frame); editorHistory = []; editorRedo = []; render(); return true; }
		if (target.closest("[data-add-frame]")) { const boss = selectedBoss(); if (boss.frames.length >= 8) return notify("Animation limit reached: 8 frames."); boss.frames.push(JSON.parse(JSON.stringify(boss.frames[editorFrame]))); editorFrame = boss.frames.length - 1; save(); render(); return true; }
		if (target.closest("[data-delete-frame]")) { const boss = selectedBoss(); if (boss.frames.length > 1) { boss.frames.splice(editorFrame, 1); editorFrame = Math.max(0, editorFrame - 1); save(); render(); } return true; }
		if (target.closest("[data-undo]")) { undoEditor(); return true; }
		if (target.closest("[data-redo]")) { undoEditor(true); return true; }
		if (target.closest("[data-save-boss]")) { save(); notify("Boss design saved to this browser."); return true; }
		if (target.closest("[data-duplicate-boss]")) {
			if (state.bosses.length >= 20) return notify("Workshop limit reached: 20 designs.");
			const copy = sanitizeBoss({ ...JSON.parse(JSON.stringify(selectedBoss())), id: crypto.randomUUID(), name: `${selectedBoss().name} Copy` });
			state.bosses.push(copy); state.selectedBossId = copy.id; editorFrame = 0; editorHistory = []; editorRedo = []; save(); render(); return true;
		}
		if (target.closest("[data-delete-boss]")) {
			state.bosses = state.bosses.filter((boss) => boss.id !== state.selectedBossId);
			if (!state.bosses.length) state.bosses.push(createBlankBoss());
			state.selectedBossId = state.bosses[0].id; editorFrame = 0; editorHistory = []; editorRedo = []; save(); render(); return true;
		}
		if (target.closest("[data-export-boss]")) {
			const blob = new Blob([JSON.stringify(selectedBoss(), null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${selectedBoss().name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "boss"}.json`; link.click(); URL.revokeObjectURL(link.href); return true;
		}
		if (target.closest("[data-import-boss]")) { $("#boss-import-file").click(); return true; }
		if (target.closest("[data-test-boss]")) {
			const boss = selectedBoss();
			if (!boss.frames.some((frame) => frame.body.some(Boolean) || frame.effects.some(Boolean))) return notify("Draw at least one pixel before testing this boss.");
			selectedMode = "Boss Sandbox"; navigate("play"); newGame(); return true;
		}
		const zoom = target.closest("[data-zoom]"); if (zoom) { editorZoom = Math.max(0.65, Math.min(1.35, editorZoom + Number(zoom.dataset.zoom) * 0.1)); render(); return true; }
		return false;
	}
	function handleBossInput(event) {
		const target = event.target;
		if (target.matches("[data-custom-color]")) { editorColor = target.value; return; }
		const prop = target.closest("[data-boss-prop]");
		if (!prop) return;
		const boss = selectedBoss(); const key = prop.dataset.bossProp;
		boss[key] = ["health", "armor", "speed", "attackRate"].includes(key) ? Number(prop.value) : prop.value;
		const output = key === "health" ? "#boss-health-value" : key === "armor" ? "#boss-armor-value" : key === "speed" ? "#boss-speed-value" : key === "attackRate" ? "#boss-rate-value" : null;
		if (output) $(output).textContent = key === "speed" || key === "attackRate" ? `${Number(prop.value).toFixed(2)}×` : prop.value;
		save();
	}
	function importBossFile(event) {
		const file = event.target.files?.[0];
		if (!file) return;
		if (state.bosses.length >= 20) { notify("Workshop limit reached: 20 designs."); event.target.value = ""; return; }
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const imported = sanitizeBoss(JSON.parse(String(reader.result)));
				if (!imported) throw new Error("invalid boss document");
				imported.id = crypto.randomUUID(); state.bosses.push(imported); state.selectedBossId = imported.id; editorFrame = 0; editorHistory = []; editorRedo = []; save(); render(); notify("Boss design imported.");
			} catch (_) { notify("That boss JSON could not be imported."); }
			event.target.value = "";
		};
		reader.readAsText(file);
	}
	function downloadStandalone() {
		Promise.all([fetch("game-rules.js"), fetch("mechanics.js")]).then(async ([rulesResponse, sourceResponse]) => {
			if (!rulesResponse.ok || !sourceResponse.ok) throw new Error("unavailable");
			return Promise.all([rulesResponse.text(), sourceResponse.text()]);
		}).then(([rules, source]) => {
			const inline = `<script>${rules.replace(/<\/script/gi, "<\\/script")}\n${source.replace(/<\/script/gi, "<\\/script")}</script>`;
			const html = `<!doctype html>\n${document.documentElement.outerHTML.replace(/<script src="game-rules\.js"><\/script>\s*<script src="mechanics\.js"><\/script>/, inline)}`;
			const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); link.download = "bossforge-ascension-standalone.html"; link.click(); URL.revokeObjectURL(link.href);
		}).catch(() => notify("Standalone export needs the game hosted over HTTP. See README for local packaging."));
	}
	document.addEventListener("keydown", (event) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) event.preventDefault(); keys.add(event.key); });
	document.addEventListener("keyup", (event) => keys.delete(event.key));
	document.addEventListener("pointerdown", (event) => {
		const control = event.target.closest("[data-control]");
		if (control && control.dataset.control === "fire") { keys.add("fire"); return; }
		if (event.target.closest("#arena")) pointerDown = true;
	});
	document.addEventListener("pointerup", () => { pointerDown = false; keys.delete("fire"); });
	document.addEventListener("click", (event) => {
		const viewButton = event.target.closest("[data-view]"); if (viewButton) { navigate(viewButton.dataset.view); return; }
		if (currentView === "boss" && handleEditorAction(event)) return;
		const modeButton = event.target.closest("[data-mode]"); if (modeButton) { selectedMode = modeButton.dataset.mode; render(); return; }
		const control = event.target.closest("[data-control]"); if (control && control.dataset.control !== "fire") { const direction = control.dataset.control; keys.add(direction); setTimeout(() => keys.delete(direction), 170); return; }
		if (event.target.closest("#launch")) { newGame(); return; }
		const upgrade = event.target.closest("[data-upgrade]");
		if (upgrade) { const index = Number(upgrade.dataset.upgrade); const rank = state.ranks[index]; const cost = upgradeCost(index, rank); if (rank >= 3) return notify("Node fully mastered."); if (state.credits < cost) return notify(`Need ${cost - state.credits} more credits.`); state.credits -= cost; state.ranks[index]++; save(); render(); sound(480, 0.12); return; }
		const equip = event.target.closest("[data-equip]"); if (equip) { state.equipped[equip.dataset.equip] = Number(equip.dataset.id); save(); render(); return; }
		const chestButton = event.target.closest("[data-chest]");
		if (chestButton) { const index = Number(chestButton.dataset.chest); if (state.chests[index] <= Date.now()) { state.credits += 65 + index * 35; state.shards += 1 + (index === 2 ? 1 : 0); state.chests[index] = Date.now() + [25000, 55000, 95000][index]; save(); notify("Cache collected · credits and forge shards added."); render(); sound(520, 0.2, "sine"); } return; }
		if (event.target.closest("#prestige")) { if (!Rules.canRegisterLeaderboard(state)) return notify("Complete the Campaign, network, and Ascension Trial first."); state.prestige++; state.stage = 1; state.campaignClears = 0; state.clears = 0; state.ranks.fill(0); state.finalTrialComplete = false; state.finalBossDefeated = false; state.finalRivalDefeated = false; state.completionRecordPending = false; state.completed = false; state.credits += 5000; save(); notify("Ascension complete · +5,000 credits."); render(); return; }
		if (event.target.closest("#download-standalone")) downloadStandalone();
	});
	document.addEventListener("input", handleBossInput);
	document.addEventListener("change", (event) => {
		const target = event.target;
		if (target.matches("[data-symmetry]")) { editorSymmetry = target.checked; return; }
		if (target.matches("[data-grid]")) { editorGrid = target.checked; drawEditorCanvas(); return; }
		if (target.matches("[data-layer-visible]")) { selectedBoss().frames[editorFrame].visible[editorLayer] = target.checked; save(); drawEditorCanvas(); return; }
		if (target.matches("[data-size]")) { resizeBoss(selectedBoss(), Number(target.value)); editorHistory = []; editorRedo = []; save(); render(); return; }
		if (target.matches("#boss-import-file")) importBossFile(event);
	});
	document.addEventListener("submit", (event) => {
		if (event.target.id !== "record-form") return;
		event.preventDefault();
		if (!state.completionRecordPending || !Rules.canRegisterLeaderboard(state)) return notify("Nickname registration requires the completed Ascension Trial.");
		const name = String(new FormData(event.target).get("nickname")).trim().slice(0, 18); if (name.length < 2) return;
		const pending = [...state.leaderboard].reverse().find((entry) => entry.pending && entry.ascensionClear);
		if (!pending) return notify("No eligible Ascension record is waiting.");
		pending.name = name; delete pending.pending; state.completionRecordPending = false; save(); notify(`Final record registered as ${name}.`); render();
	});
	$("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("nav-collapsed"));
	$("#sound-toggle").addEventListener("click", () => { state.sound = !state.sound; save(); $("#sound-toggle").textContent = state.sound ? "SOUND ON" : "SOUND OFF"; });
	$("#sound-toggle").textContent = state.sound ? "SOUND ON" : "SOUND OFF";
	setInterval(() => { if (currentView === "vault") render(); }, 1000);
	setInterval(() => { if (currentView === "boss") drawEditorCanvas(); }, 220);
	document.addEventListener("visibilitychange", () => {
		if (!game?.active) return;
		if (document.hidden) { game.pausedBeforeHidden = !game.paused; game.paused = true; cancelAnimationFrame(frame); audioContext?.suspend(); }
		else if (game.pausedBeforeHidden && currentView === "play") { game.paused = false; lastTick = performance.now(); frame = requestAnimationFrame(tick); audioContext?.resume(); }
		else if (!game.paused) audioContext?.resume();
	});
	render();
})();
