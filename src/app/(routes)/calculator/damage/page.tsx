import Link from "next/link";
import { TakenDamageCalculator } from "@/components/TakenDamageCalculator";
import { getMonsters } from "@/lib/data/monsters";

export default function DamageCalculatorPage() {
  return (
    <>
      <TakenDamageCalculator monsters={getMonsters()} />
      <p className="mx-auto mt-2 max-w-6xl px-4 text-xs text-slate-400/80">
        <Link href="/services/damage" className="hover:text-slate-200">
          피격 데미지 계산 방식 설명 보기
        </Link>
      </p>
    </>
  );
}
