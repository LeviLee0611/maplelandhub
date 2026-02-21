import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export function NavBar() {
  return (
    <header className="border-b border-white/10 bg-[rgba(17,23,38,0.6)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="display text-lg font-semibold tracking-tight text-white">
          메이플랜드허브
        </Link>
        <nav className="flex items-center gap-3 text-sm text-slate-200">
          <Link href="/calculator/oneshot" className="hover:text-white">
            원샷 계산기
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
