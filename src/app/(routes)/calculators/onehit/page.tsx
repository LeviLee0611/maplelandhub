import { getMonsters } from "@/lib/data/monsters";
import { OneHitCalculatorClient } from "./onehit-calculator-client";
import { CalculatorGuide } from "@/components/CalculatorGuide";

export default function OneHitCalculatorPage() {
  return (
    <>
      <OneHitCalculatorClient monsters={getMonsters()} server="mapleland" />
      <CalculatorGuide variant="onehit" />
    </>
  );
}
