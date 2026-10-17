(function (root, factory) {
	const rules = factory();
	if (typeof module !== "undefined" && module.exports) module.exports = rules;
	if (root) root.BossforgeRules = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
	const DISCIPLINES = ["Impact", "Velocity", "Flux", "Fortitude", "Precision", "Salvage", "Frost", "Ember", "Storm", "Echo", "Rift", "Aegis", "Vector", "Pulse", "Ruin", "Bloom", "Gravity", "Ascendant"];
	const DISCIPLINE_EFFECTS = ["+1.8% projectile damage", "+1% movement speed", "+1.2% firing cadence", "+1.5 maximum hull", "+0.25% critical chance", "+1.2% contract and run credits", "-0.5% rival attack cadence", "+1.4% projectile damage", "+0.3% chain chance", "+0.3% echo chance", "-1.2% dash cooldown", "+0.7 shield and +0.8 hull", "+0.6% homing and +0.8% speed", "+0.8% firing cadence and hull repair", "+0.4% armor piercing", "+0.35 on-hit recovery", "+0.8% projectile speed", "+1.2% projectile damage"];

	function getRankTotals(ranks) {
		const disciplineRanks = Array(DISCIPLINES.length).fill(0);
		for (let index = 0; index < 180; index++) {
			disciplineRanks[Math.floor(index / 10)] += Math.max(0, Math.min(3, Number(ranks?.[index]) || 0));
		}
		return { disciplineRanks, totalRanks: disciplineRanks.reduce((sum, rank) => sum + rank, 0) };
	}

	function getCombatEffects(ranks) {
		const { disciplineRanks, totalRanks } = getRankTotals(ranks);
		const [impact, velocity, flux, fortitude, precision, salvage, frost, ember, storm, echo, rift, aegis, vector, pulse, ruin, bloom, gravity, ascendant] = disciplineRanks;
		return {
			disciplineRanks,
			totalRanks,
			threatRating: totalRanks,
			threatPercent: totalRanks / 540 * 100,
			enemyDifficultyMultiplier: 1 + totalRanks / 540 * 0.5,
			damageMultiplier: 1 + impact * 0.018 + ember * 0.014 + ascendant * 0.012,
			movementMultiplier: 1 + velocity * 0.01 + vector * 0.008,
			fireRateMultiplier: 1 + flux * 0.012 + pulse * 0.008,
			maxHull: 100 + fortitude * 1.5 + aegis * 0.8,
			criticalChance: precision * 0.0025,
			rewardMultiplier: 1 + salvage * 0.012,
			enemySlow: frost * 0.005,
			chainChance: storm * 0.003,
			repeatChance: echo * 0.003,
			dashCooldownMultiplier: Math.max(0.55, 1 - rift * 0.012),
			shieldPoints: aegis * 0.7,
			hullRegenPerSecond: pulse * 0.018,
			armorPierce: ruin * 0.004,
			onHitRecovery: bloom * 0.35,
			projectileSpeedMultiplier: 1 + gravity * 0.008 + precision * 0.004,
			homingStrength: vector * 0.006
		};
	}

	function canRegisterLeaderboard(state) {
		const { totalRanks } = getRankTotals(state?.ranks);
		return state?.campaignClears >= 50 && state?.stage >= 51 && totalRanks === 540 &&
			state?.finalTrialComplete === true && state?.finalBossDefeated === true && state?.finalRivalDefeated === true;
	}

	function canStartAscensionTrial(state) {
		const { totalRanks } = getRankTotals(state?.ranks);
		return state?.campaignClears >= 50 && state?.stage >= 51 && totalRanks === 540;
	}

	return Object.freeze({ DISCIPLINES, DISCIPLINE_EFFECTS, getRankTotals, getCombatEffects, canStartAscensionTrial, canRegisterLeaderboard });
});