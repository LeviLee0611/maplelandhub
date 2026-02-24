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

  const rMin = pad * 0.8;
  const rMax = pad * 0.85;

  const userPDD = clamp(character.secondaryStats.PDD + temp.PddBonus, 0, limits.MaxPdd);

  const tMin = rMin * pad * 0.01;
  const tMax = rMax * pad * 0.01;

  const { STR, DEX, INT, LUK } = character.basicStats;
  let base = 0;
  if (character.jobClass === "warrior") {
    const v0 = (LUK + DEX) / 4 + INT / 9;
    const v1 = (STR * 2) / 7;
    base = Math.floor(v0 + v1);
  } else {
    const v0 = INT / 9 + (DEX * 2) / 7 + STR * 0.4;
    const v1 = LUK / 4;
    base = Math.floor(v0 + v1);
  }

  const mod = base * 0.00125;
  const standardPDD = getStandardPDD(character.jobClass, character.level);

  let fac = 0;
  if (userPDD < standardPDD) {
    const opt = character.level / 550 + mod + 0.28;
    if (character.level >= mob.level) {
      fac = (opt * (userPDD - standardPDD) * 13) / ((character.level - mob.level) + 13);
    } else {
      fac = opt * (userPDD - standardPDD) * 1.3;
    }
  } else {
    fac = base / 900 + ((character.level / 1300 + 0.28) * (userPDD - standardPDD) * 0.7);
  }

  const common = fac + (mod + 0.28) * userPDD;

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
