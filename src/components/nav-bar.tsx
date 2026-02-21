import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export function NavBar() {
  return (
    <header className="border-b border-white/10 bg-[rgba(17,23,38,0.6)] backdrop-blur-xl">
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center">
          <img src="/favicon.ico" alt="메랜 Hub" className="h-[96px] w-[96px] rounded" />
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-200">
          <Link href="/calculators/onehit" className="hover:text-white">
            한방컷 계산기
          </Link>
          <Link href="/calculator/damage" className="hover:text-white">
            피격 데미지
          </Link>
          <Link href="/party" className="hover:text-white">
            파티 매칭
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
