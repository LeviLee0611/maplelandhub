import Link from "next/link";
import Image from "next/image";
import { AuthButton } from "@/components/auth-button";
import { AdminLink } from "@/components/admin-link";

export function NavBar() {
  return (
    <header className="border-b backdrop-blur-xl" style={{ borderColor: "var(--nav-border)", background: "var(--nav-bg)" }}>
      <div className="mx-auto flex h-24 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6 xl:px-8">
        <Link href="/" className="flex items-center">
          <Image src="/favicon.ico" alt="메랜 Hub" width={96} height={96} className="h-[96px] w-[96px] rounded" />
        </Link>
        <nav className="flex items-center gap-3 text-sm" style={{ color: "var(--nav-text)" }}>
          <Link href="/announcements" className="hover:opacity-80">
            공지/업데이트
          </Link>
          <Link href="/calculators/onehit" className="hover:opacity-80">
            N방컷 계산기
          </Link>
          <Link href="/calculator/damage" className="hover:opacity-80">
            피격뎀 계산기
          </Link>
          <Link href="/drop-table" className="hover:opacity-80">
            드랍 테이블
          </Link>
          <Link href="/quests" className="hover:opacity-80">
            메랜 퀘스트
          </Link>
          <span className="inline-flex items-center gap-1 text-amber-100/90">
            파티 매칭
            <span className="rounded-full border border-amber-200/40 px-1.5 py-0.5 text-[10px] uppercase text-amber-100">Soon</span>
          </span>
          <Link href="/feedback" className="hover:opacity-80">
            문의/요청
          </Link>
          <AdminLink />
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
