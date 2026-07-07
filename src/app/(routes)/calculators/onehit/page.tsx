import { getMonsters } from "@/lib/data/monsters";
import { OneHitCalculatorClient } from "./onehit-calculator-client";

export default function OneHitCalculatorPage() {
  return <OneHitCalculatorClient monsters={getMonsters()} server="mapleland" />;
}
