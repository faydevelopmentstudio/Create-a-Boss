const test = require("node:test");
const assert = require("node:assert/strict");
const { canRegisterLeaderboard, canStartAscensionTrial, getCombatEffects } = require("../game-rules.js");

const masteredRanks = Array(180).fill(3);
const eligibleState = {
	campaignClears: 50,
	stage: 51,
	ranks: masteredRanks,
	finalTrialComplete: true,
	finalBossDefeated: true,
	finalRivalDefeated: true
};

test("ordinary run and loss state cannot register on the Hall of Ascension", () => {
	assert.equal(canRegisterLeaderboard({ completed: true }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, finalTrialComplete: false }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, finalBossDefeated: false }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, finalRivalDefeated: false }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, campaignClears: 49 }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, stage: 50 }), false);
	assert.equal(canRegisterLeaderboard({ ...eligibleState, ranks: Array(180).fill(2) }), false);
});

test("registration is allowed only after every Ascension requirement", () => {
	assert.equal(canRegisterLeaderboard(eligibleState), true);
});

test("the Ascension Trial requires all Campaign clears and all network ranks", () => {
	assert.equal(canStartAscensionTrial({ ...eligibleState, finalTrialComplete: false }), true);
	assert.equal(canStartAscensionTrial({ ...eligibleState, campaignClears: 49 }), false);
	assert.equal(canStartAscensionTrial({ ...eligibleState, ranks: Array(180).fill(2) }), false);
});

test("every discipline rank increases threat and changes combat effects", () => {
	for (let discipline = 0; discipline < 18; discipline++) {
		const ranks = Array(180).fill(0);
		const before = getCombatEffects(ranks);
		ranks[discipline * 10] = 1;
		const after = getCombatEffects(ranks);
		assert.ok(after.threatRating > before.threatRating, `discipline ${discipline} should raise Threat Rating`);
		assert.ok(after.enemyDifficultyMultiplier > before.enemyDifficultyMultiplier, `discipline ${discipline} should raise enemy difficulty`);
		assert.notDeepEqual(after.disciplineRanks, before.disciplineRanks);
		assert.ok(Object.keys(after).some((key) => key !== "disciplineRanks" && key !== "totalRanks" && key !== "threatRating" && key !== "enemyDifficultyMultiplier" && after[key] !== before[key]), `discipline ${discipline} should improve a player stat`);
	}
});

test("combat effects are bounded by the 540-rank contract", () => {
	const effects = getCombatEffects(masteredRanks);
	assert.equal(effects.totalRanks, 540);
	assert.equal(effects.threatRating, 540);
	assert.equal(effects.threatPercent, 100);
	assert.equal(effects.enemyDifficultyMultiplier, 1.5);
	assert.ok(effects.maxHull > 100);
	assert.ok(effects.damageMultiplier > 1);
});