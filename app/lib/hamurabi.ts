// ============================================================
// hamurabi.ts — Hamurabi game ported from BASIC to TypeScript
// Original: David Ahl, 1973 (Creative Computing)
// Source: https://github.com/philspil66/Hamurabi
// ============================================================

export interface GameState {
  year: number;
  population: number;
  grain: number;
  acres: number;
  starved: number;
  immigrants: number;
  plagueDeaths: number;
  totalStarved: number;
  avgStarvePct: number;
  landPrice: number;
  harvestPerAcre: number;
  ratsAte: number;
  phase: GamePhase;
  gameOver: boolean;
  /** Numeric score calculated at game end (0 if impeached) */
  finalScore: number;
  messages: string[];
  waitingForInput: InputType;
}

export type GamePhase = "report" | "buy_land" | "sell_land" | "feed" | "plant" | "end_turn" | "game_over";
export type InputType = "buy_acres" | "sell_acres" | "feed_people" | "plant_acres" | "none" | "play_again";

const TOTAL_YEARS = 10;

export function createGame(): GameState {
  return {
    year: 0,
    population: 95,
    grain: 2800,
    acres: 1000,
    starved: 0,
    immigrants: 5,
    plagueDeaths: 0,
    totalStarved: 0,
    avgStarvePct: 0,
    landPrice: randomInt(17, 26),
    harvestPerAcre: 3,
    ratsAte: 200,
    phase: "report",
    gameOver: false,
    finalScore: 0,
    messages: [],
    waitingForInput: "none",
  };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function startGame(): { state: GameState; output: string[] } {
  const state = createGame();
  const output = [
    "",
    "                    H A M U R A B I",
    "      (Adapted from the classic 1973 BASIC game)",
    "",
    "You are the ruler of ancient Sumeria. You must manage your",
    "kingdom's land, grain, and people for 10 years.",
    "",
    "Try not to starve everyone. Good luck, Hammurabi!",
    "",
  ];
  const report = generateReport(state);
  output.push(...report);
  state.phase = "buy_land";
  state.waitingForInput = "buy_acres";
  output.push(`Land is trading at ${state.landPrice} bushels per acre.`);
  output.push("How many acres do you wish to buy? (0 for none)");
  return { state, output };
}

function generateReport(state: GameState): string[] {
  state.year++;
  state.landPrice = randomInt(17, 26);

  const lines: string[] = [];
  lines.push(`──── YEAR ${state.year} of ${TOTAL_YEARS} ────`);
  lines.push("");

  if (state.year > 1) {
    if (state.starved > 0) {
      lines.push(`  ${state.starved} people starved.`);
    }
    if (state.immigrants > 0) {
      lines.push(`  ${state.immigrants} people came to the city.`);
    }
    if (state.plagueDeaths > 0) {
      lines.push(`  ☠ Plague struck! ${state.plagueDeaths} people died.`);
    }
  }

  lines.push(`  Population: ${state.population}`);
  lines.push(`  Acres owned: ${state.acres}`);
  lines.push(`  Grain harvested: ${state.harvestPerAcre} bushels/acre`);
  lines.push(`  Rats ate: ${state.ratsAte} bushels`);
  lines.push(`  Grain in storage: ${state.grain} bushels`);
  lines.push("");

  return lines;
}

// Temporary storage for turn decisions
let turnFeedPeople = 0;
let turnPlantAcres = 0;

export function processInput(
  state: GameState,
  input: string
): { state: GameState; output: string[] } {
  const num = parseInt(input.trim(), 10);
  const output: string[] = [];

  if (isNaN(num) || num < 0) {
    output.push("Hammurabi: I need a valid number. Try again.");
    return { state, output };
  }

  switch (state.waitingForInput) {
    case "buy_acres": {
      const cost = num * state.landPrice;
      if (cost > state.grain) {
        output.push(`Hammurabi: We only have ${state.grain} bushels. We can't afford that.`);
        output.push("How many acres do you wish to buy?");
        return { state, output };
      }
      state.grain -= cost;
      state.acres += num;
      if (num > 0) {
        output.push(`Bought ${num} acres for ${cost} bushels.`);
      }

      if (num === 0) {
        state.phase = "sell_land";
        state.waitingForInput = "sell_acres";
        output.push("How many acres do you wish to sell? (0 for none)");
      } else {
        // Skip selling if buying
        state.phase = "feed";
        state.waitingForInput = "feed_people";
        output.push(`How many bushels to feed your ${state.population} people?`);
        output.push(`(Each person needs 20 bushels. You have ${state.grain})`);
      }
      break;
    }

    case "sell_acres": {
      if (num > state.acres) {
        output.push(`Hammurabi: We only own ${state.acres} acres!`);
        output.push("How many acres do you wish to sell?");
        return { state, output };
      }
      state.grain += num * state.landPrice;
      state.acres -= num;
      if (num > 0) {
        output.push(`Sold ${num} acres for ${num * state.landPrice} bushels.`);
      }
      state.phase = "feed";
      state.waitingForInput = "feed_people";
      output.push(`How many bushels to feed your ${state.population} people?`);
      output.push(`(Each person needs 20 bushels. You have ${state.grain})`);
      break;
    }

    case "feed_people": {
      if (num > state.grain) {
        output.push(`Hammurabi: We only have ${state.grain} bushels!`);
        output.push("How many bushels to allocate to food?");
        return { state, output };
      }
      turnFeedPeople = num;
      state.grain -= num;
      state.phase = "plant";
      state.waitingForInput = "plant_acres";
      const maxPlantable = Math.min(state.acres, state.grain * 2, state.population * 10);
      output.push(`How many acres do you wish to plant with seed?`);
      output.push(`(Max plantable: ${maxPlantable} acres. 1 bushel seeds 2 acres, 1 person tends 10.)`);
      break;
    }

    case "plant_acres": {
      if (num > state.acres) {
        output.push(`Hammurabi: We only have ${state.acres} acres!`);
        output.push("How many acres to plant?");
        return { state, output };
      }
      const seedNeeded = Math.ceil(num / 2);
      if (seedNeeded > state.grain) {
        output.push(`Hammurabi: We need ${seedNeeded} bushels for seed but only have ${state.grain}!`);
        output.push("How many acres to plant?");
        return { state, output };
      }
      if (num > state.population * 10) {
        output.push(`Hammurabi: We only have ${state.population} people to tend the fields!`);
        output.push("How many acres to plant?");
        return { state, output };
      }
      turnPlantAcres = num;
      state.grain -= seedNeeded;

      // === RESOLVE THE YEAR ===
      const result = resolveYear(state, turnFeedPeople, turnPlantAcres);
      output.push(...result.output);

      if (result.impeached) {
        state.gameOver = true;
        state.waitingForInput = "none";
        state.phase = "game_over";
        return { state, output };
      }

      if (state.year >= TOTAL_YEARS) {
        // Final score
        const finalOutput = calculateFinalScore(state);
        output.push(...finalOutput);
        state.gameOver = true;
        state.waitingForInput = "none";
        state.phase = "game_over";
        return { state, output };
      }

      // Next year report
      const report = generateReport(state);
      output.push(...report);
      state.phase = "buy_land";
      state.waitingForInput = "buy_acres";
      output.push(`Land is trading at ${state.landPrice} bushels per acre.`);
      output.push("How many acres do you wish to buy? (0 for none)");
      break;
    }

    default:
      output.push("Unexpected input.");
  }

  return { state, output };
}

function resolveYear(
  state: GameState,
  fed: number,
  planted: number
): { output: string[]; impeached: boolean } {
  const output: string[] = [];
  output.push("");
  output.push("── Resolving year... ──");

  // Harvest
  state.harvestPerAcre = randomInt(1, 6);
  const harvest = planted * state.harvestPerAcre;
  state.grain += harvest;
  output.push(`  Harvested ${harvest} bushels (${state.harvestPerAcre}/acre).`);

  // Rats
  const ratsFactor = randomInt(1, 5);
  if (ratsFactor % 2 === 0) {
    state.ratsAte = Math.floor(state.grain / ratsFactor);
    state.grain -= state.ratsAte;
    output.push(`  🐀 Rats ate ${state.ratsAte} bushels!`);
  } else {
    state.ratsAte = 0;
  }

  // Starvation
  const peopleFed = Math.floor(fed / 20);
  state.starved = Math.max(0, state.population - peopleFed);
  state.totalStarved += state.starved;

  // Check impeachment (>45% starved in one year)
  if (state.starved > state.population * 0.45) {
    output.push("");
    output.push(`  💀 ${state.starved} people starved — over 45% of your population!`);
    output.push("  You have been IMPEACHED and thrown out of office!");
    output.push("  The people declare you a national disgrace!");
    output.push("");
    output.push("  G A M E   O V E R");
    state.finalScore = 0;
    return { output, impeached: true };
  }

  // Update avg starvation
  state.avgStarvePct = ((state.year - 1) * state.avgStarvePct + (state.starved * 100 / state.population)) / state.year;

  // Immigration
  state.immigrants = Math.floor(
    randomInt(1, 5) * (20 * state.acres + state.grain) / state.population / 100 + 1
  );
  state.population = state.population - state.starved + state.immigrants;

  // Plague (15% chance)
  state.plagueDeaths = 0;
  if (Math.random() < 0.15) {
    state.plagueDeaths = Math.floor(state.population / 2);
    state.population -= state.plagueDeaths;
    output.push(`  ☠ A terrible plague has struck! ${state.plagueDeaths} people died.`);
  }

  output.push("");
  return { output, impeached: false };
}

function calculateFinalScore(state: GameState): string[] {
  const lines: string[] = [];
  lines.push("");
  lines.push("════════════════════════════════════");
  lines.push("       FINAL REPORT — 10 YEARS");
  lines.push("════════════════════════════════════");
  lines.push("");
  lines.push(`  Average starvation: ${state.avgStarvePct.toFixed(1)}% per year`);
  lines.push(`  Total deaths from starvation: ${state.totalStarved}`);

  const acresPerPerson = state.population > 0 ? state.acres / state.population : 0;
  lines.push(`  Acres per person: ${acresPerPerson.toFixed(1)}`);
  lines.push(`  Final population: ${state.population}`);
  lines.push("");

  // Numeric score: population health + land management - starvation penalty
  const populationScore = state.population * 2;
  const landScore = Math.floor(state.acres / 10);
  const starvePenalty = Math.floor(state.avgStarvePct * 3);
  const grainBonus = Math.floor(state.grain / 100);
  const numericScore = Math.max(0, populationScore + landScore + grainBonus - starvePenalty);
  state.finalScore = numericScore;

  let verdict: string;
  if (state.avgStarvePct > 33 || acresPerPerson < 7) {
    verdict = "TERRIBLE";
    lines.push("  VERDICT: TERRIBLE");
    lines.push("  Your heavy-handed performance smacks of Nero and Ivan IV.");
    lines.push("  The people hate your guts!!");
  } else if (state.avgStarvePct > 10 || acresPerPerson < 9) {
    verdict = "POOR";
    lines.push("  VERDICT: POOR");
    lines.push("  Your performance could have been better.");
    lines.push(`  ${Math.floor(state.population * 0.8 * Math.random())} people`);
    lines.push("  would dearly like to see you assassinated.");
  } else if (state.avgStarvePct > 3 || acresPerPerson < 10) {
    verdict = "GOOD";
    lines.push("  VERDICT: GOOD");
    lines.push("  Your performance wasn't too bad at all!");
    lines.push("  The people are mostly satisfied.");
  } else {
    verdict = "EXCELLENT";
    lines.push("  VERDICT: ★ EXCELLENT ★");
    lines.push("  A fantastic performance! Charlemagne, Disraeli, and");
    lines.push("  Jefferson combined could not have done better!");
  }

  lines.push("");
  lines.push(`  🎯 SCORE: ${numericScore} pts (${verdict})`);
  lines.push("");
  lines.push("  So long for now, Hammurabi!");
  lines.push("  Type 'play hamurabi' to play again, or 'exit' to leave.");
  lines.push("");

  return lines;
}
