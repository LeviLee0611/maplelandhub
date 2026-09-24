import { TakenDamageCalculator } from "@/components/TakenDamageCalculator";
import { getMonsters } from "@/lib/data/monsters";
import { CalculatorGuide } from "@/components/CalculatorGuide";

export default function DamageCalculatorPage() {
  return (
    <>
      <TakenDamageCalculator monsters={getMonsters()} />
      <CalculatorGuide variant="damage" />
    </>
  );
}
