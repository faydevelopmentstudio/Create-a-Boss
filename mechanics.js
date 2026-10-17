(() => {
	const $ = (selector) => document.querySelector(selector);
	const modes = ["Campaign", "Chaos Trial", "Rival Duel", "Endurance"];
	const sectors = ["Core", "Plating", "Drive", "Barrel", "Sights", "Capacitor", "Thrusters", "Hull", "Targeting", "Overclock"];
	const disciplines = ["Impact", "Velocity", "Flux", "Fortitude", "Precision", "Salvage", "Frost", "Ember", "Storm", "Echo", "Rift", "Aegis", "Vector", "Pulse", "Ruin", "Bloom", "Gravity", "Ascendant"];
	const themes = ["Carbon", "Signal Red", "Ion", "Foundry", "Citrus", "Deep Current", "Voltage", "Monsoon", "Wildfire", "Moss", "Glacier", "Solar", "Orchid", "Ultraviolet", "Prism", "Singularity"];
	const skins = ["Vanguard", "Scrapper", "Warden", "Courier", "Ronin", "Bastion", "Mantis", "Reactor", "Spectre", "Pilot", "Colossus", "Nomad", "Cipher", "Ranger", "Overlord", "Ascendant"];
	const trails = ["Ion Wake", "Comet", "Static", "Emberline", "Frostbite", "Pulse", "Toxic", "Solar Flare", "Prism", "Ghost", "Arc", "Blackout"];
	const arenas = ["The Foundry", "Glass Flats", "Storm Shelf", "Redline", "Cold Forge", "The Wreck", "Sunken Grid", "Cinder Run", "Hollow Crown", "Skyrail", "Ion Basin", "Last Light"];
	const palettes = ["#43e6d1", "#ff6f61", "#78aaff", "#e7a85d", "#d8ee6b", "#58b9cf", "#e0c94e", "#55d3a5", "#fa7954", "#9acb78", "#b6e7f2", "#ffb943", "#ee83bc", "#b083f5", "#e7f0ff", "#a5aab6"];
	const defaultState = () => ({ credits: 240, shards: 0, stage: 1, wins: 0, prestige: 0, completed: false, ranks: Array(180).fill(0), unlocked: { themes: [0], skins: [0], trails: [0], arenas: [0] }, equipped: { theme: 0, skin: 0, trail: 0, arena: 0 }, contracts: [], chests: [0, 0, 0], leaderboard: [], sound: true, best: 0, clears: 0 });
	const readSave = () => {
		try {
			const saved = JSON.parse(localStorage.getItem("bossforge-ascension-v1"));
			if (!saved || !Array.isArray(saved.ranks) || !saved.unlocked) return defaultState();
			return { ...defaultState(), ...saved, ranks: Array.from({ length: 180 }, (_, i) => Math.min(3, saved.ranks[i] || 0)), unlocked: { ...defaultState().unlocked, ...saved.unlocked }, equipped: { ...defaultState().equipped, ...saved.equipped } };
		} catch (_) { return defaultState(); }
	};
	const state = readSave();
	const save = () => localStorage.setItem("bossforge-ascension-v1", JSON.stringify(state));
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
	function render() {
		const main = $("#view");
		document.documentElement.style.setProperty("--accent", palettes[state.equipped.theme] || palettes[0]);
		$("#credits").textContent = state.credits.toLocaleString();
		$("#shards").textContent = state.shards;
		$("#stage-label").textContent = `STAGE ${String(state.stage).padStart(2, "0")}`;
		document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === currentView));
		if (currentView === "play") main.innerHTML = playView();
		if (currentView === "forge") main.innerHTML = forgeView();
		if (currentView === "contracts") main.innerHTML = contractsView();
		if (currentView === "locker") main.innerHTML = lockerView();
		if (currentView === "vault") main.innerHTML = vaultView();
		if (currentView === "records") main.innerHTML = recordsView();
		if (game && currentView === "play") game.canvas = $("#arena");
		if (game && currentView === "play") drawGame();
	}
	function playView() {
		const result = game && !game.active ? game.result : null;
		return `<section class="play-layout"><div class="arena-column"><div class="arena-heading"><div><span class="eyebrow">ASCENSION NETWORK / ${arenas[state.equipped.arena].toUpperCase()}</span><h1>${selectedMode}</h1></div><span id="stage-label" class="stage-tag">STAGE ${String(state.stage).padStart(2, "0")}</span></div><div class="canvas-wrap"><canvas id="arena" aria-label="Bossforge combat arena"></canvas><div id="arena-hud" class="arena-hud ${result ? "result" : ""}"><span id="player-hp">${result ? `REWARD +${result.reward} CR` : "HULL 100%"}</span><span id="run-status">${result ? result.message : "READY"}</span><span id="boss-hp">${result ? `${result.score} PTS` : "TARGET 100%"}</span></div><div class="mobile-controls"><button data-control="up" aria-label="Move up">↑</button><button data-control="left" aria-label="Move left">←</button><button data-control="down" aria-label="Move down">↓</button><button data-control="right" aria-label="Move right">→</button><button data-control="fire" aria-label="Fire">FIRE</button></div></div><div class="run-bar"><div class="mode-select">${modes.map((mode) => `<button data-mode="${mode}" class="mode-button ${selectedMode === mode ? "selected" : ""}">${mode}</button>`).join("")}</div><button id="launch" class="primary-button">${game && game.active ? "RESTART RUN" : "LAUNCH ARENA"}<span>↗</span></button></div><p class="control-hint">WASD / arrows to move · Space to fire · touch controls supported</p></div><aside class="play-rail"><div class="rail-title"><span class="eyebrow">FIELD REPORT</span><span class="live-dot"></span></div><div class="rail-stat"><span>Clears</span><strong>${state.clears}</strong></div><div class="rail-stat"><span>Best run</span><strong>${state.best} <small>pts</small></strong></div><div class="rail-stat"><span>Ascensions</span><strong>${state.prestige}</strong></div><div class="rail-contract"><div class="eyebrow">ACTIVE CONTRACTS</div>${state.contracts.slice(0, 3).map((c) => `<div class="mini-contract"><span>${c.name}</span><b>${Math.min(c.progress, c.goal)}/${c.goal}</b></div>`).join("")}<button data-view="contracts" class="text-button">All contracts <span>→</span></button></div><div class="rail-contract chest-mini"><div class="eyebrow">CHEST VAULT</div><p>${readyChests()} chests ready to claim</p><button data-view="vault" class="text-button">Open vault <span>→</span></button></div></aside></section>`;
	}
	const readyChests = () => state.chests.filter((time) => time > 0 && time <= Date.now()).length;
	const upgradeCost = (index, rank) => 18 + (index % 7) * 3 + rank * 22;
	function forgeView() {
		const mastered = state.ranks.reduce((sum, rank) => sum + rank, 0);
		const campaignClears = Math.max(0, state.stage - 1);
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">18 DISCIPLINES / 10 SECTORS</span><h1>Ascension Network</h1><p>${mastered} / 540 ranks mastered.</p></div><div class="network-progress"><div class="progress-line"><i style="width:${mastered / 5.4}%"></i></div><b>${(mastered / 5.4).toFixed(1)}%</b></div></div><div class="network-grid">${disciplines.map((discipline, d) => `<div class="discipline-row"><div class="discipline-name"><span>${String(d + 1).padStart(2, "0")}</span>${discipline}</div><div class="sector-list">${sectors.map((sector, s) => { const index = d * 10 + s; const rank = state.ranks[index]; return `<button class="node rank-${rank}" data-upgrade="${index}" title="${discipline} / ${sector} · Rank ${rank}/3"><span class="node-name">${sector}</span><span class="node-pips">${[0, 1, 2].map((n) => `<i class="${n < rank ? "filled" : ""}"></i>`).join("")}</span><small>${rank < 3 ? `${upgradeCost(index, rank)} cr` : "MASTERED"}</small></button>`; }).join("")}</div></div>`).join("")}</div><div class="prestige-strip"><div><span class="eyebrow">REBIRTH PROTOCOL</span><p>Clear 50 campaign stages and master all 540 ranks to ascend.</p></div><span class="prestige-condition">${campaignClears}/50 CAMPAIGN · ${mastered}/540</span><button class="secondary-button" id="prestige" ${campaignClears < 50 || mastered < 540 ? "disabled" : ""}>ASCEND</button></div></section>`;
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
	function recordsView() {
		const sorted = [...state.leaderboard].sort((a, b) => b.score - a.score).slice(0, 10);
		return `<section class="page-view"><div class="page-heading"><div><span class="eyebrow">LOCAL / THIS BROWSER ONLY</span><h1>Hall of records</h1><p>Scores are local. A public board needs a verified server.</p></div><span class="count-badge">${state.completed ? "REGISTRATION OPEN" : "COMPLETE A RUN TO REGISTER"}</span></div><div class="leaderboard"><div class="leader-head"><span>RANK</span><span>PILOT</span><span>MODE</span><span>SCORE</span></div>${sorted.length ? sorted.map((entry, i) => `<div class="leader-entry"><span>${String(i + 1).padStart(2, "0")}</span><strong>${escapeHTML(entry.name)}</strong><span>${escapeHTML(entry.mode)}</span><b>${entry.score.toLocaleString()}</b></div>`).join("") : `<div class="empty-records">No records yet. Clear a run to make the board.</div>`}</div>${state.completed ? `<form id="record-form" class="record-form"><label for="nickname">Register completed run</label><input id="nickname" name="nickname" maxlength="18" minlength="2" placeholder="Pilot nickname" required><button class="primary-button">SUBMIT SCORE</button></form>` : ""}<button class="secondary-button download-button" id="download-standalone">DOWNLOAD STANDALONE HTML</button></section>`;
	}
	function newGame() {
		const canvas = $("#arena");
		const maxBossHp = selectedMode === "Endurance" ? 100000 : (selectedMode === "Chaos Trial" ? 170 : 100) + Math.min(state.stage, 50) * 3;
		game = { active: true, mode: selectedMode, hp: 100, bossHp: maxBossHp, maxBossHp, player: { x: 0.14, y: 0.72 }, boss: { x: 0.78, y: 0.24, phase: 0 }, bullets: [], enemyBullets: [], elapsed: 0, score: 0, lastShot: 0, lastEnemyShot: 0, lastDamage: 0, canvas };
		canvas.focus();
		state.chests = state.chests.map((time, i) => time || Date.now() + [25000, 55000, 95000][i]);
		gain("runs", 1); save(); render(); sound(240, 0.16, "sawtooth");
		musicTimer = setInterval(() => { if (game && game.active) sound([98, 123, 146, 110][Math.floor((game.elapsed / 1.8) % 4)], 0.28, "sine"); }, 1800);
		cancelAnimationFrame(frame); lastTick = performance.now(); frame = requestAnimationFrame(tick);
	}
	function endGame(won) {
		if (!game || !game.active) return;
		game.active = false; clearInterval(musicTimer);
		const reward = Math.floor((won ? 70 : 22) + game.score / 8);
		state.credits += reward; state.shards += won ? 2 : 1; state.best = Math.max(state.best, game.score); state.completed = true;
		gain("credits", reward); if (won) gain("wins", 1);
		if (won) { state.clears++; if (game.mode === "Campaign") state.stage = Math.min(51, state.stage + 1); }
		state.leaderboard.push({ name: "UNREGISTERED", mode: game.mode, score: game.score, pending: true });
		game.result = { message: won ? "SECTOR CLEARED" : "HULL BREACHED", reward, score: game.score };
		save(); sound(won ? 620 : 95, 0.6, won ? "sine" : "sawtooth");
		gain("survive", Math.floor(game.elapsed));
		if (state.stage >= 51 && state.ranks.reduce((sum, rank) => sum + rank, 0) === 540) notify("Ascension conditions met. Rebirth is ready.");
		render();
		notify(`${won ? "Sector cleared" : "Run complete"} · ${reward} credits`);
	}
	function tick(now) {
		const delta = Math.min(0.04, (now - lastTick) / 1000); lastTick = now;
		if (!game || !game.active) return;
		game.elapsed += delta;
		const bounds = game.canvas.getBoundingClientRect(); const width = bounds.width; const height = bounds.height;
		const speed = 0.42 * delta;
		if (keys.has("ArrowUp") || keys.has("w") || keys.has("W") || keys.has("up")) game.player.y -= speed;
		if (keys.has("ArrowDown") || keys.has("s") || keys.has("S") || keys.has("down")) game.player.y += speed;
		if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A") || keys.has("left")) game.player.x -= speed;
		if (keys.has("ArrowRight") || keys.has("d") || keys.has("D") || keys.has("right")) game.player.x += speed;
		game.player.x = Math.max(0.04, Math.min(0.63, game.player.x)); game.player.y = Math.max(0.08, Math.min(0.9, game.player.y));
		game.boss.phase += delta;
		game.boss.x = 0.77 + Math.sin(game.boss.phase * (game.mode === "Chaos Trial" ? 2.3 : 1.25)) * 0.12;
		game.boss.y = 0.2 + Math.sin(game.boss.phase * 1.8) * 0.11;
		if ((keys.has(" ") || keys.has("fire") || pointerDown) && now - game.lastShot > 240) {
			game.bullets.push({ x: game.player.x + 0.05, y: game.player.y, speed: 1.08 }); game.lastShot = now; gain("shots", 1); sound(390, 0.05, "square");
		}
		if (now - game.lastEnemyShot > (game.mode === "Chaos Trial" ? 570 : 900)) {
			const dx = game.player.x - game.boss.x; const dy = game.player.y - game.boss.y; const length = Math.hypot(dx, dy) || 1;
			game.enemyBullets.push({ x: game.boss.x - 0.035, y: game.boss.y + 0.02, vx: dx / length * 0.31, vy: dy / length * 0.31 }); game.lastEnemyShot = now;
		}
		const impactRank = state.ranks.slice(0, 10).reduce((sum, rank) => sum + rank, 0);
		const armorRank = state.ranks.slice(30, 40).reduce((sum, rank) => sum + rank, 0);
		game.bullets = game.bullets.filter((bullet) => { bullet.x += bullet.speed * delta; if (Math.hypot((bullet.x - game.boss.x) * width, (bullet.y - game.boss.y) * height) < 30) { game.bossHp -= 5 + impactRank; game.score += 12; return false; } return bullet.x < 1.1; });
		game.enemyBullets = game.enemyBullets.filter((bullet) => { bullet.x += bullet.vx * delta; bullet.y += bullet.vy * delta; if (Math.hypot((bullet.x - game.player.x) * width, (bullet.y - game.player.y) * height) < 22) { if (now - game.lastDamage > 480) { game.hp -= Math.max(4, (game.mode === "Chaos Trial" ? 13 : 10) - armorRank); game.lastDamage = now; sound(115, 0.12, "sawtooth"); } return false; } if (bullet.x < game.player.x - 0.03 && Math.abs(bullet.y - game.player.y) < 0.07) { gain("dodges", 1); return false; } return bullet.x > -0.08 && bullet.x < 1.08 && bullet.y > -0.08 && bullet.y < 1.08; });
		game.score += Math.floor(delta * (game.mode === "Endurance" ? 16 : 4));
		if (game.mode === "Endurance" && game.elapsed >= 70) return endGame(true);
		if (game.bossHp <= 0 && game.mode !== "Endurance") return endGame(true);
		if (game.hp <= 0) return endGame(false);
		if (game.mode === "Rival Duel" && game.elapsed > 65) return endGame(true);
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
		const accent = palettes[state.equipped.theme];
		const px = game.player.x * w; const py = game.player.y * h; const bx = game.boss.x * w; const by = game.boss.y * h;
		const skinIndex = state.equipped.skin;
		ctx.save(); ctx.translate(px, py); ctx.fillStyle = palettes[skinIndex % palettes.length]; ctx.shadowColor = accent; ctx.shadowBlur = 17; ctx.beginPath(); if (skinIndex % 3 === 0) { ctx.moveTo(22, 0); ctx.lineTo(-13, -13); ctx.lineTo(-8, 0); ctx.lineTo(-13, 13); } else if (skinIndex % 3 === 1) { ctx.moveTo(18, 0); ctx.lineTo(8, -12); ctx.lineTo(-14, -9); ctx.lineTo(-10, 0); ctx.lineTo(-14, 9); ctx.lineTo(8, 12); } else { ctx.moveTo(22, 0); ctx.lineTo(7, -17); ctx.lineTo(-15, -11); ctx.lineTo(-8, 0); ctx.lineTo(-15, 11); ctx.lineTo(7, 17); } ctx.closePath(); ctx.fill(); ctx.fillStyle = "#e6ffff"; ctx.fillRect(-5, -3, 12, 6); ctx.restore();
		ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.PI); ctx.fillStyle = "#ff735f"; ctx.shadowColor = "#ff735f"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.moveTo(27, 0); ctx.lineTo(-12, -22); ctx.lineTo(-20, 0); ctx.lineTo(-12, 22); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#ffd0ad"; ctx.fillRect(-7, -5, 12, 10); ctx.restore();
		for (const bullet of game.bullets) { ctx.fillStyle = palettes[state.equipped.trail % palettes.length]; ctx.shadowColor = palettes[state.equipped.trail % palettes.length]; ctx.shadowBlur = 11; ctx.beginPath(); ctx.ellipse(bullet.x * w, bullet.y * h, 8 + state.equipped.trail % 4, 2.5, 0, 0, Math.PI * 2); ctx.fill(); }
		for (const bullet of game.enemyBullets) { ctx.fillStyle = "#ff8068"; ctx.shadowColor = "#ff584c"; ctx.shadowBlur = 9; ctx.beginPath(); ctx.arc(bullet.x * w, bullet.y * h, 4, 0, Math.PI * 2); ctx.fill(); }
		ctx.shadowBlur = 0;
		if (game.active) {
			$("#player-hp").textContent = `HULL ${Math.max(0, Math.ceil(game.hp))}%`;
			$("#boss-hp").textContent = game.mode === "Endurance" ? "SURVIVE 70 SEC" : `TARGET ${Math.max(0, Math.ceil(game.bossHp / game.maxBossHp * 100))}%`;
			$("#run-status").textContent = `${Math.floor(game.elapsed)}s · ${game.score} PTS`;
		}
	}
	function downloadStandalone() {
		fetch("mechanics.js").then((response) => { if (!response.ok) throw new Error("unavailable"); return response.text(); }).then((source) => {
			const html = `<!doctype html>\n${document.documentElement.outerHTML.replace(/<script src="mechanics.js"><\/script>/, `<script>${source.replace(/<\/script/gi, "<\\/script")}<\/script>`)}`;
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
		const viewButton = event.target.closest("[data-view]"); if (viewButton) { currentView = viewButton.dataset.view; render(); return; }
		const modeButton = event.target.closest("[data-mode]"); if (modeButton) { selectedMode = modeButton.dataset.mode; render(); return; }
		const control = event.target.closest("[data-control]"); if (control && control.dataset.control !== "fire") { const direction = control.dataset.control; keys.add(direction); setTimeout(() => keys.delete(direction), 170); return; }
		if (event.target.closest("#launch")) { newGame(); return; }
		const upgrade = event.target.closest("[data-upgrade]");
		if (upgrade) { const index = Number(upgrade.dataset.upgrade); const rank = state.ranks[index]; const cost = upgradeCost(index, rank); if (rank >= 3) return notify("Node fully mastered."); if (state.credits < cost) return notify(`Need ${cost - state.credits} more credits.`); state.credits -= cost; state.ranks[index]++; save(); render(); sound(480, 0.12); return; }
		const equip = event.target.closest("[data-equip]"); if (equip) { state.equipped[equip.dataset.equip] = Number(equip.dataset.id); save(); render(); return; }
		const chestButton = event.target.closest("[data-chest]");
		if (chestButton) { const index = Number(chestButton.dataset.chest); if (state.chests[index] <= Date.now()) { state.credits += 65 + index * 35; state.shards += 1 + (index === 2 ? 1 : 0); state.chests[index] = Date.now() + [25000, 55000, 95000][index]; save(); notify("Cache collected · credits and forge shards added."); render(); sound(520, 0.2, "sine"); } return; }
		if (event.target.closest("#prestige")) { if (state.stage < 51 || state.ranks.reduce((sum, rank) => sum + rank, 0) < 540) return; state.prestige++; state.stage = 1; state.clears = 0; state.ranks.fill(0); state.credits += 5000; save(); notify("Ascension complete · +5,000 credits."); render(); return; }
		if (event.target.closest("#download-standalone")) downloadStandalone();
	});
	document.addEventListener("submit", (event) => {
		if (event.target.id !== "record-form") return;
		event.preventDefault(); const name = String(new FormData(event.target).get("nickname")).trim().slice(0, 18); if (name.length < 2) return;
		const pending = [...state.leaderboard].reverse().find((entry) => entry.pending);
		if (pending) { pending.name = name; delete pending.pending; }
		state.completed = false; save(); notify(`Record registered as ${name}.`); render();
	});
	$("#menu-toggle").addEventListener("click", () => document.body.classList.toggle("nav-collapsed"));
	$("#sound-toggle").addEventListener("click", () => { state.sound = !state.sound; save(); $("#sound-toggle").textContent = state.sound ? "SOUND ON" : "SOUND OFF"; });
	$("#sound-toggle").textContent = state.sound ? "SOUND ON" : "SOUND OFF";
	setInterval(() => { if (currentView === "vault") render(); }, 1000);
	render();
})();
