import type { CalcContext, DamageRange, TempStats } from "@/types/takenDamage";
import { getStandardPDD } from "@/lib/calculators/takenDamage/standardPdd";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTemp(temp?: TempStats) {
  return {
    PddBonus: temp?.PddBonus ?? 0,
    InvinciblePercent: temp?.InvinciblePercent ?? 0,
    MesoGuard: Boolean(temp?.MesoGuard),
    PowerUpPercent: temp?.PowerUpPercent ?? 0,
  };
}

function applyMesoGuardHook(damage: number) {
  // TODO: Replace with actual meso guard reduction logic.
  return { damage, reduce: 0 };
}

function calcC(str: number, dex: number, intel: number, luk: number) {
  return str / 2800 + dex / 3200 + intel / 7200 + luk / 3200;
}

function calcD(level: number, mobLevel: number) {
  if (level >= mobLevel) {
    return 13 / (13 + (level - mobLevel));
  }
  return 1.3;
}

function calcB(pdd: number, stdPdd: number, level: number, mobLevel: number, str: number, dex: number, intel: number, luk: number) {
  const c = calcC(str, dex, intel, luk);
  const d = calcD(level, mobLevel);
  const temp1 = c * (28 / 45) + (level * 7) / 13000;
  const temp2 = d * (c + level / 550 + 0.28);
  return pdd >= stdPdd ? temp1 : temp2;
}

export function calcPhysicalTakenDamage(ctx: CalcContext): DamageRange {
  const { character, mob } = ctx;
  const limits = {
    MaxPad: ctx.limits?.MaxPad ?? 999999,
    MaxPdd: ctx.limits?.MaxPdd ?? 999999,
    MaxDamage: ctx.limits?.MaxDamage ?? 999999,
  };
  const temp = normalizeTemp(character.tempStats);

  let pad = (mob.templatePADamage ?? 0) + (mob.tempPADBonus ?? 0);
  pad = clamp(pad, 0, limits.MaxPad);

  const userPDD = clamp(character.secondaryStats.PDD + temp.PddBonus, 0, limits.MaxPdd);
  const tMin = pad * pad * 0.0082;
  const tMax = pad * pad * 0.0088;

  const { STR, DEX, INT, LUK } = character.basicStats;
  const standardPDD = getStandardPDD(character.jobClass, character.level);
  const c = calcC(STR, DEX, INT, LUK);
  const a = c + 0.28;
  const b = calcB(userPDD, standardPDD, character.level, mob.level, STR, DEX, INT, LUK);
  const common = userPDD * a + (userPDD - standardPDD) * b;

  let minDamage = tMin - common;
  let maxDamage = tMax - common;

  if (temp.InvinciblePercent > 0) {
    minDamage -= (temp.InvinciblePercent * minDamage) / 100;
    maxDamage -= (temp.InvinciblePercent * maxDamage) / 100;
  }

  let reduce = 0;
  if (temp.MesoGuard) {
    const minReduced = applyMesoGuardHook(minDamage);
    const maxReduced = applyMesoGuardHook(maxDamage);
    minDamage = minReduced.damage;
    maxDamage = maxReduced.damage;
    reduce = Math.max(minReduced.reduce ?? 0, maxReduced.reduce ?? 0);
  }

  if (temp.PowerUpPercent) {
    minDamage = (temp.PowerUpPercent * minDamage) / 100;
    maxDamage = (temp.PowerUpPercent * maxDamage) / 100;
  }

  minDamage = clamp(Math.floor(minDamage), 1, limits.MaxDamage);
  maxDamage = clamp(Math.floor(maxDamage), 1, limits.MaxDamage);

  return { min: Math.min(minDamage, maxDamage), max: Math.max(minDamage, maxDamage), reduce };
}
