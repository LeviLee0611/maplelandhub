export function estimateDamagePerHit(attack: number, skillMultiplier: number, defense: number) {
  const scaled = attack * (skillMultiplier / 100);
  return Math.max(1, Math.floor(scaled - defense));
}

export function estimateHitsToKill(monsterHp: number, damagePerHit: number) {
  return Math.max(1, Math.ceil(monsterHp / Math.max(1, damagePerHit)));
}

export function requiredAttackForHits(monsterHp: number, skillMultiplier: number, defense: number, hits: number) {
  const raw = monsterHp / Math.max(1, hits) + defense;
  return Math.ceil(raw / Math.max(0.01, skillMultiplier / 100));
}

export function estimateTakenDamage(monsterAttack: number, playerDefense: number, reductionRate: number) {
  const reducedByDef = Math.max(1, monsterAttack - playerDefense * 0.45);
  const reducedBySkill = reducedByDef * (1 - reductionRate / 100);
  return Math.max(1, Math.floor(reducedBySkill));
}
