export type OneHitInput = {
  monsterHp: number;
  avgDamage: number;
  minDamage?: number;
  maxDamage?: number;
  hitsPerSkill: number;
  accuracyRate: number; // 0-1
};

export type OneHitResult = {
  damagePerSkill: {
    min: number;
    avg: number;
    max: number;
  };
  hitsToKill: {
    min: number;
    avg: number;
    max: number;
  };
};

function ensurePositive(value: number, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
  const minDamage = input.minDamage ?? input.avgDamage;
  const maxDamage = input.maxDamage ?? input.avgDamage;
  const avgDamage = input.avgDamage ?? (minDamage + maxDamage) / 2;

  const minPerSkill = calcDamagePerSkill(minDamage, input.hitsPerSkill, input.accuracyRate);
  const avgPerSkill = calcDamagePerSkill(avgDamage, input.hitsPerSkill, input.accuracyRate);
  const maxPerSkill = calcDamagePerSkill(maxDamage, input.hitsPerSkill, input.accuracyRate);

  return {
    damagePerSkill: {
      min: minPerSkill,
      avg: avgPerSkill,
      max: maxPerSkill,
    },
    hitsToKill: {
      min: calcHitsToKill(input.monsterHp, maxPerSkill),
      avg: calcHitsToKill(input.monsterHp, avgPerSkill),
      max: calcHitsToKill(input.monsterHp, minPerSkill),
    },
  };
}
