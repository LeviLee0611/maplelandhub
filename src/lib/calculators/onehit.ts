export type OneHitInput = {
  monsterHp: number;
  avgDamage?: number;
  minDamage?: number;
  maxDamage?: number;
  statDamage?: StatDamageInput;
  finalDamageMultiplier?: number;
  hitsPerSkill: number;
  accuracyRate: number; // 0-1
};

export type StatDamageInput = {
  primaryStat: number;
  secondaryStat: number;
  weaponAttack: number;
  statMultiplier: number;
  skillMultiplier?: number;
  mastery?: number; // 0-1
};

export type OneHitResult = {
  damagePerSkill: {
    min: number;
    avg: number;
    max: number;
  };
  oneShotAttack: number;
  hitsToKill: {
    min: number;
    avg: number;
    max: number;
  };
  oneShotChance: number; // 0-100
};

function ensurePositive(value: number, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function calcBaseDamageFromStats(input: StatDamageInput) {
  const primary = ensurePositive(input.primaryStat, 1);
  const secondary = ensurePositive(input.secondaryStat, 0);
  const weaponAttack = ensurePositive(input.weaponAttack, 1);
  const statMultiplier = ensurePositive(input.statMultiplier, 1);
  const skillMultiplier = ensurePositive(input.skillMultiplier ?? 1, 1);
  const mastery = Math.min(1, Math.max(0, input.mastery ?? 1));

  const maxDamage = ((primary * statMultiplier + secondary) * weaponAttack * skillMultiplier) / 100;
  const minDamage = maxDamage * mastery;
  const avgDamage = (minDamage + maxDamage) / 2;

  return { minDamage, avgDamage, maxDamage };
}

export function calcDamagePerSkill(rawDamage: number, hitsPerSkill: number, accuracyRate: number) {
  const damage = ensurePositive(rawDamage, 1);
  const hits = ensurePositive(hitsPerSkill, 1);
  const accuracy = Math.min(1, Math.max(0, accuracyRate));
  return Math.max(1, damage * hits * accuracy);
}

export function calcHitsToKill(monsterHp: number, damagePerSkill: number) {
  const hp = ensurePositive(monsterHp, 1);
  const damage = ensurePositive(damagePerSkill, 1);
  return Math.max(1, Math.ceil(hp / damage));
}

export function calcOneHit(input: OneHitInput): OneHitResult {
  const statsDamage = input.statDamage ? calcBaseDamageFromStats(input.statDamage) : null;
  const fallbackAvg = input.avgDamage ?? statsDamage?.avgDamage ?? 1;
  const minDamage = input.minDamage ?? statsDamage?.minDamage ?? fallbackAvg;
  const maxDamage = input.maxDamage ?? statsDamage?.maxDamage ?? fallbackAvg;
  const avgDamage = input.avgDamage ?? (minDamage + maxDamage) / 2;
  const finalMultiplier = ensurePositive(input.finalDamageMultiplier ?? 1, 1);

  const minPerSkill = calcDamagePerSkill(minDamage * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const avgPerSkill = calcDamagePerSkill(avgDamage * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const maxPerSkill = calcDamagePerSkill(maxDamage * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const hp = ensurePositive(input.monsterHp, 1);

  // Legacy NC behavior is closer to a binary "one-shot possible" check
  // using the upper bound attack value shown as #oneShot.
  const oneShotChance = hp <= maxPerSkill ? 100 : 0;

  return {
    damagePerSkill: {
      min: minPerSkill,
      avg: avgPerSkill,
      max: maxPerSkill,
    },
    oneShotAttack: Math.floor(maxPerSkill),
    hitsToKill: {
      min: calcHitsToKill(input.monsterHp, maxPerSkill),
      avg: calcHitsToKill(input.monsterHp, avgPerSkill),
      max: calcHitsToKill(input.monsterHp, minPerSkill),
    },
    oneShotChance,
  };
}
