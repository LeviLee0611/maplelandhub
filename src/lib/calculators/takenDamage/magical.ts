import type { CalcContext, DamageRange, TempStats } from "@/types/takenDamage";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeTemp(temp?: TempStats) {
  return {
    MddBonus: temp?.MddBonus ?? 0,
    InvinciblePercent: temp?.InvinciblePercent ?? 0,
    MesoGuard: Boolean(temp?.MesoGuard),
    PowerUpPercent: temp?.PowerUpPercent ?? 0,
  };
}

function applyMesoGuardHook(damage: number) {
  // TODO: Replace with actual meso guard reduction logic.
  return { damage, reduce: 0 };
}

export function calcMagicalTakenDamage(ctx: CalcContext): DamageRange {
  const { character, mob } = ctx;
  const limits = {
    MaxMad: ctx.limits?.MaxMad ?? 999999,
    MaxMdd: ctx.limits?.MaxMdd ?? 999999,
    MaxDamage: ctx.limits?.MaxDamage ?? 999999,
  };
  const temp = normalizeTemp(character.tempStats);

  let mad = (mob.templateMADamage ?? 0) + (mob.tempMADBonus ?? 0);
  mad = clamp(mad, 0, limits.MaxMad);

  const rMin = mad * 0.75;
  const rMax = mad * 0.8;

  const userMDD = clamp(character.secondaryStats.MDD + temp.MddBonus, 0, limits.MaxMdd);

  const tMin = rMin * mad * 0.01;
  const tMax = rMax * mad * 0.01;

  const { STR, DEX, LUK } = character.basicStats;

  const base = STR / 7 + LUK / 5 + DEX / 6 + userMDD;
  const mod = character.jobClass === "magician" ? base * 0.3 : base * 0.25;

  let minDamage = tMin - mod;
  let maxDamage = tMax - mod;

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
