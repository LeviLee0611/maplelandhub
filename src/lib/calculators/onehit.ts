export type OneHitInput = {
  monsterHp: number;
  monsterLevel?: number;
  characterLevel?: number;
  monsterDef?: number;
  monsterMDef?: number;
  avgDamage?: number;
  minDamage?: number;
  maxDamage?: number;
  statDamage?: StatDamageInput;
  finalDamageMultiplier?: number;
  skillMultiplier?: number;
  isMagic?: boolean;
  ignoreDefense?: boolean;
  hitsPerSkill: number;
  accuracyRate: number; // 0-1
};

export type StatDamageInput = {
  primaryStat: number;
  secondaryStat: number;
  weaponAttack: number;
  statMultiplier?: number;
  minStatMultiplier?: number;
  maxStatMultiplier?: number;
  skillMultiplier?: number;
  mastery?: number; // 0-1
  isMagic?: boolean;
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
  nShotChances: Array<{
    hits: number;
    chance: number;
    isPlus?: boolean;
  }>;
};

function ensurePositive(value: number, fallback = 1) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function calcBaseDamageFromStats(input: StatDamageInput) {
  const primary = ensurePositive(input.primaryStat, 1);
  const secondary = ensurePositive(input.secondaryStat, 0);
  const weaponAttack = ensurePositive(input.weaponAttack, 1);
  const fallbackMultiplier = ensurePositive(input.statMultiplier ?? 1, 1);
  const minStatMultiplier = ensurePositive(input.minStatMultiplier ?? fallbackMultiplier, fallbackMultiplier);
  const maxStatMultiplier = ensurePositive(input.maxStatMultiplier ?? fallbackMultiplier, fallbackMultiplier);
  const skillMultiplier = ensurePositive(input.skillMultiplier ?? 1, 1);
  const mastery = Math.min(1, Math.max(0, input.mastery ?? 1));

  if (input.isMagic) {
    const magic = weaponAttack;
    const maxDamage = (0.0033665 * magic * magic + 3.3 * magic + 0.5 * primary) * skillMultiplier;
    const minDamage = (0.0033665 * magic * magic + 3.3 * magic * 0.9 * mastery + 0.5 * primary) * skillMultiplier;
    const avgDamage = (minDamage + maxDamage) / 2;
    return { minDamage, avgDamage, maxDamage };
  }

  const maxDamage = ((primary * maxStatMultiplier + secondary) * weaponAttack * skillMultiplier) / 100;
  const minDamage = ((primary * minStatMultiplier * 0.9 * mastery + secondary) * weaponAttack * skillMultiplier) / 100;
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
  const baseMin = input.minDamage ?? statsDamage?.minDamage ?? fallbackAvg;
  const baseMax = input.maxDamage ?? statsDamage?.maxDamage ?? fallbackAvg;
  const baseAvg = input.avgDamage ?? (baseMin + baseMax) / 2;
  const finalMultiplier = ensurePositive(input.finalDamageMultiplier ?? 1, 1);
  const skillMultiplier = ensurePositive(input.skillMultiplier ?? 1, 1);
  const isMagic = Boolean(input.isMagic);
  const monsterDef = ensurePositive(input.monsterDef ?? 0, 0);
  const monsterMDef = ensurePositive(input.monsterMDef ?? 0, 0);
  const monsterLevel = ensurePositive(input.monsterLevel ?? 0, 0);
  const characterLevel = ensurePositive(input.characterLevel ?? 0, 0);
  const diffLevel = Math.max(0, monsterLevel - characterLevel);
  const levelFactor = Math.max(0, 1 - 0.01 * diffLevel);
  const magicDefFactor = 1 + 0.01 * diffLevel;

  const applyDefense = (minValue: number, maxValue: number) => {
    if (input.ignoreDefense) {
      const avgValue = (minValue + maxValue) / 2;
      if (isMagic) {
        return { min: minValue, max: maxValue, avg: avgValue };
      }
      return {
        min: minValue * skillMultiplier,
        max: maxValue * skillMultiplier,
        avg: avgValue * skillMultiplier,
      };
    }
    if (isMagic) {
      const maxAfter = maxValue - monsterMDef * 0.5 * magicDefFactor;
      const minAfter = minValue - monsterMDef * 0.6 * magicDefFactor;
      return {
        min: minAfter,
        max: maxAfter,
        avg: (minAfter + maxAfter) / 2,
      };
    }

    const maxAfter = maxValue * levelFactor - monsterDef / 5;
    const minAfter = minValue * levelFactor - monsterDef / 6;
    return {
      min: minAfter * skillMultiplier,
      max: maxAfter * skillMultiplier,
      avg: ((minAfter + maxAfter) / 2) * skillMultiplier,
    };
  };

  const defended = applyDefense(baseMin, baseMax);

  const minPerSkill = calcDamagePerSkill(defended.min * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const avgPerSkill = calcDamagePerSkill(defended.avg * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const maxPerSkill = calcDamagePerSkill(defended.max * finalMultiplier, input.hitsPerSkill, input.accuracyRate);
  const hp = ensurePositive(input.monsterHp, 1);

  const oneShotChance = (() => {
    if (hp <= minPerSkill) return 100;
    if (hp > maxPerSkill) return 0;
    if (maxPerSkill === minPerSkill) return 0;
    const rate = (maxPerSkill - hp) / (maxPerSkill - minPerSkill);
    return Math.max(0, Math.min(1, rate)) * 100;
  })();

  const withinHitsChance = (hits: number) => {
    const cappedHits = Math.max(1, Math.floor(hits));
    const minTotal = minPerSkill * cappedHits;
    const maxTotal = maxPerSkill * cappedHits;
    if (hp <= minTotal) return 100;
    if (hp > maxTotal) return 0;
    if (maxTotal === minTotal) return 0;
    const rate = (maxTotal - hp) / (maxTotal - minTotal);
    return Math.max(0, Math.min(1, rate)) * 100;
  };

  const minHits = calcHitsToKill(input.monsterHp, maxPerSkill);
  const maxHits = calcHitsToKill(input.monsterHp, minPerSkill);
  const displayEnd = Math.min(maxHits, minHits + 4);
  const nShotChances: OneHitResult["nShotChances"] = [];

  for (let hits = minHits; hits <= displayEnd; hits += 1) {
    const current = withinHitsChance(hits);
    const prev = hits > 1 ? withinHitsChance(hits - 1) : 0;
    const exact = Math.max(0, current - prev);
    nShotChances.push({ hits, chance: exact });
  }

  if (maxHits > displayEnd) {
    const prev = withinHitsChance(displayEnd);
    const remaining = Math.max(0, 100 - prev);
    nShotChances.push({ hits: displayEnd + 1, chance: remaining, isPlus: true });
  }

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
    nShotChances,
  };
}
