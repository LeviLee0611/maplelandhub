import { TakenDamageCalculator } from "@/components/TakenDamageCalculator";
import { getMonsters } from "@/lib/data/monsters";

export default function DamageCalculatorPage() {
  return <TakenDamageCalculator monsters={getMonsters()} />;
}
