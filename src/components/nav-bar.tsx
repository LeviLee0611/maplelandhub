import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export function NavBar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-slate-900">
          MapleLand Hub
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-700">
          <Link href="/calculators/onehit" className="hover:text-slate-900">
            n방컷 계산기
          </Link>
          <Link href="/calculators/taken-damage" className="hover:text-slate-900">
            피격 데미지
          </Link>
          <Link href="/parties" className="hover:text-slate-900">
            파티 매칭
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
