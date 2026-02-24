import { calcMagicalTakenDamage, calcPhysicalTakenDamage } from "@/lib/calculators/takenDamage";
import type { CalcContext } from "@/types/takenDamage";

const baseContext: CalcContext = {
  character: {
    level: 120,
    jobClass: "warrior",
    basicStats: { STR: 500, DEX: 120, INT: 4, LUK: 4 },
    secondaryStats: { PDD: 450, MDD: 280 },
    tempStats: { InvinciblePercent: 0, MesoGuard: false, PowerUpPercent: 0 },
  },
  mob: {
    level: 88,
    templatePADamage: 390,
    templateMADamage: 430,
  },
};

const physicalLowPdd: CalcContext = {
  ...baseContext,
  character: {
    ...baseContext.character,
    secondaryStats: { PDD: 100, MDD: 280 },
  },
};

const magicalHighMdd: CalcContext = {
  ...baseContext,
  character: {
    ...baseContext.character,
    secondaryStats: { PDD: 450, MDD: 800 },
  },
};

const physicalA = calcPhysicalTakenDamage(baseContext);
const physicalB = calcPhysicalTakenDamage(physicalLowPdd);
const magicalA = calcMagicalTakenDamage(baseContext);
const magicalB = calcMagicalTakenDamage(magicalHighMdd);

console.log("Physical (standard PDD case):", physicalA);
console.log("Physical (below standard PDD):", physicalB);
console.log("Magical (MDD 280):", magicalA);
console.log("Magical (MDD 800):", magicalB);
