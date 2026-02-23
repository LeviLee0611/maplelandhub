import Link from "next/link";
import { AuthButton } from "@/components/auth-button";

export function NavBar() {
  return (
    <header className="border-b backdrop-blur-xl" style={{ borderColor: "var(--nav-border)", background: "var(--nav-bg)" }}>
      <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center">
          <img src="/favicon.ico" alt="메랜 Hub" className="h-[96px] w-[96px] rounded" />
        </Link>
        <nav className="flex items-center gap-3 text-sm" style={{ color: "var(--nav-text)" }}>
          <Link href="/calculators/onehit" className="hover:opacity-80">
            N방컷 계산기
          </Link>
          <Link href="/calculator/damage" className="hover:opacity-80">
            피격 데미지
          </Link>
          <Link href="/party" className="hover:opacity-80">
            파티 매칭
          </Link>
          <Link href="/feedback" className="hover:opacity-80">
            문의/요청
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
