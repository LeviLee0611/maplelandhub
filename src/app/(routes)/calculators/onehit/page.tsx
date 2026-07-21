import Link from "next/link";
import { getMonsters } from "@/lib/data/monsters";
import { OneHitCalculatorClient } from "./onehit-calculator-client";

export default function OneHitCalculatorPage() {
  return (
    <>
      <OneHitCalculatorClient monsters={getMonsters()} server="mapleland" />
      <p className="mx-auto mt-2 max-w-6xl px-4 text-xs text-slate-400/80">
        <Link href="/services/onehit" className="hover:text-slate-200">
          한방컷 계산 방식 설명 보기
        </Link>
      </p>
    </>
  );
}
