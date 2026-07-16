"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const AdminLink = dynamic(() => import("@/components/admin-link").then((mod) => mod.AdminLink), {
  ssr: false,
  loading: () => null,
});

const AuthButton = dynamic(() => import("@/components/auth-button").then((mod) => mod.AuthButton), {
  ssr: false,
  loading: () => (
    <Link href="/login" className="btn-login rounded-full px-4 py-1 text-sm">
      로그인
    </Link>
  ),
});

// 플래닛 버전이 있는 기능만 접두사를 붙인다. 나머지(공지/퀘스트/문의)는 아직 메랜 전용.
function getPrimaryLinks(isPlanet: boolean) {
  const planetPrefix = isPlanet ? "/planet" : "";
  return [
    { label: "공지/업데이트", href: "/announcements", icon: "megaphone" },
    { label: "한방컷 계산기", href: `${planetPrefix}/calculators/onehit`, icon: "target" },
    { label: "피격뎀 계산기", href: `${planetPrefix}/calculator/damage`, icon: "shield" },
    { label: "드랍 테이블", href: `${planetPrefix}/drop-table`, icon: "cube" },
    // 큐브/잠재능력은 메이플랜드엔 없는 플래닛 전용 시스템이라 플래닛 모드에서만 노출
    ...(isPlanet
      ? [
          { label: "큐브 시뮬레이터", href: "/planet/cube-simulator", icon: "star" },
          { label: "큐브 빌더", href: "/planet/cube-builder", icon: "target" },
        ]
      : []),
    { label: "메랜 퀘스트", href: "/quests", icon: "quest" },
    { label: "문의/요청", href: "/feedback", icon: "mail" },
  ];
}

// 같은 기능을 유지한 채 메랜 ↔ 플래닛 페이지로 전환하기 위한 경로 매핑.
const PLANET_MIRRORED_PATHS = ["/drop-table", "/calculator/damage", "/calculators/onehit"];

function getServerSwitchHref(pathname: string, targetServer: "mapleland" | "planet") {
  if (targetServer === "planet") {
    if (pathname === "/") return "/planet";
    const mirrored = PLANET_MIRRORED_PATHS.find((path) => pathname === path);
    return mirrored ? `/planet${mirrored}` : "/planet";
  }
  if (pathname === "/planet") return "/";
  const mirrored = PLANET_MIRRORED_PATHS.find((path) => pathname === `/planet${path}`);
  return mirrored ?? "/";
}

const guideLinks = [
  { label: "사이트 소개", href: "/about", icon: "info" },
  { label: "사용방법 (필독)", href: "/guide", icon: "book" },
  { label: "문의하기", href: "/contact", icon: "chat" },
  { label: "개인정보처리방침", href: "/privacy", icon: "lock" },
  { label: "업데이트 내역", href: "/changelog", icon: "spark" },
  { label: "확률의 비밀 (TM)", href: "/probability", icon: "star" },
];

function SidebarIcon({ name, size = 4 }: { name: string; size?: number }) {
  const className = `h-${size} w-${size} text-slate-200/80`;
  switch (name) {
    case "megaphone":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path
            fill="currentColor"
            d="M4 10v4h3l4 3v-10l-4 3H4Zm11.5-5 5.5 2v10l-5.5 2V5ZM4 9h2v6H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z"
          />
        </svg>
      );
    case "mail":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12l4-4h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
        </svg>
      );
    case "target":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path fill="currentColor" d="M12 4a8 8 0 1 0 8 8h-3a5 5 0 1 1-5-5V4Z" />
        </svg>
      );
    case "shield":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path fill="currentColor" d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
        </svg>
      );
    case "cube":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path fill="currentColor" d="M12 2 3 6v12l9 4 9-4V6l-9-4Zm0 2.3L18.5 7 12 9.7 5.5 7 12 4.3ZM5 9l6 2.7v7.2L5 16V9Zm14 0v7l-6 2.9v-7.2L19 9Z" />
        </svg>
      );
    case "quest":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
          <path fill="currentColor" d="M6 3h9a3 3 0 0 1 3 3v14l-4-2-4 2-4-2-4 2V6a3 3 0 0 1 3-3h1Zm1 4v2h8V7H7Zm0 4v2h6v-2H7Z" />
        </svg>
      );
    case "info":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="M11 10h2v7h-2v-7Zm0-3h2v2h-2V7Zm1-5a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
        </svg>
      );
    case "book":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="M6 4h9a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V6a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "chat":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case "lock":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-3 0H10V6a2 2 0 1 1 4 0v2Z" />
        </svg>
      );
    case "spark":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="M12 2 9 8l-6 3 6 3 3 6 3-6 6-3-6-3-3-6Z" />
        </svg>
      );
    case "star":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-200/70">
          <path fill="currentColor" d="m12 2 2.9 6.1 6.8 1-5 4.8 1.2 6.7L12 17l-5.9 3.6 1.2-6.7-5-4.8 6.8-1L12 2Z" />
        </svg>
      );
    default:
      return null;
  }
}

export function SidebarShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const desktopSidebarWidth = collapsed ? "4rem" : "16rem";
  const pathname = usePathname() ?? "/";
  const isPlanet = pathname === "/planet" || pathname.startsWith("/planet/");
  const primaryLinks = getPrimaryLinks(isPlanet);

  return (
    <div className="min-h-screen" data-server={isPlanet ? "planet" : "mapleland"}>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[var(--nav-bg)] px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/favicon.ico" alt="메랜Hub" width={40} height={40} className="h-10 w-10 rounded" />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-100">
              메랜Hub
              <span className="rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[color:var(--brand-accent-text)]">
                {isPlanet ? "PLANET" : "MAPLELAND"}
              </span>
            </div>
            <div className="text-[10px] text-slate-300/70">v1.0</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <AdminLink />
          <AuthButton />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-100"
            aria-label="사이드바 열기"
          >
            메뉴
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={`fixed left-0 top-12 z-50 flex h-[calc(100vh-3rem)] flex-col gap-6 border-r border-white/10 bg-[rgb(17,23,38)] px-4 py-6 shadow-lg transition-all lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-16" : "w-64"} lg:fixed`}
        style={{ width: desktopSidebarWidth }}
      >
        <div className="relative hidden items-center justify-between gap-3 lg:flex">
          <Link href="/" className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <Image
              src="/favicon.ico"
              alt="메랜Hub"
              width={collapsed ? 32 : 48}
              height={collapsed ? 32 : 48}
              className={collapsed ? "h-8 w-8 rounded" : "h-12 w-12 rounded"}
            />
            {!collapsed && (
              <div>
                <div className="flex items-center gap-1.5 text-base font-semibold text-slate-100">
                  메랜Hub
                  {isPlanet && (
                    <span className="rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[color:var(--brand-accent-text)]">
                      PLANET
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300/70">v1.0</div>
              </div>
            )}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute right-0 top-6 hidden h-11 w-6 translate-x-full items-center justify-center rounded-r-lg border border-l-0 border-white/15 bg-[linear-gradient(145deg,rgba(10,18,30,0.95),rgba(18,30,52,0.9))] text-[color:var(--brand-accent-text)] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.85)] lg:inline-flex"
          aria-label="사이드바 접기"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3 w-3">
            <path
              fill="currentColor"
              d={collapsed ? "M10 6l6 6-6 6-1.4-1.4L13.2 12 8.6 7.4 10 6Z" : "M14 6 8 12l6 6 1.4-1.4L10.8 12l4.6-4.6L14 6Z"}
            />
          </svg>
        </button>

        <div className={collapsed ? "hidden" : ""}>
          <div className="mb-1.5 px-1 text-[10px] font-semibold tracking-[0.08em] text-slate-400/70">서버 선택</div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={getServerSwitchHref(pathname, "mapleland")}
              onClick={() => setOpen(false)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
                !isPlanet
                  ? "border-rose-400/70 bg-rose-400/15 shadow-[0_0_16px_rgba(190,18,60,0.25)]"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <span className="text-xl">🌲</span>
              <span className={`text-xs font-bold ${!isPlanet ? "text-rose-100" : "text-slate-300/80"}`}>메이플랜드</span>
            </Link>
            <Link
              href={getServerSwitchHref(pathname, "planet")}
              onClick={() => setOpen(false)}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition ${
                isPlanet
                  ? "border-amber-300/70 bg-amber-300/15 shadow-[0_0_16px_rgba(245,158,11,0.25)]"
                  : "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
              }`}
            >
              <span className="text-xl">🪐</span>
              <span className={`text-xs font-bold ${isPlanet ? "text-amber-200" : "text-slate-300/80"}`}>메이플 플래닛</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                title={collapsed ? link.label : undefined}
                className={`btn-ghost flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  collapsed ? "justify-center" : "gap-3"
                } ${
                  isActive
                    ? "border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] text-[color:var(--brand-accent-text)]"
                    : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <SidebarIcon name={link.icon} />
                  <span className={collapsed ? "sr-only" : undefined}>{link.label}</span>
                </span>
                <span className={collapsed ? "hidden" : "text-xs text-slate-200/60"}>›</span>
              </Link>
            );
          })}
        </div>

        {!collapsed && (
          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 px-3 py-3">
            <div className="text-[10px] font-semibold text-slate-200/70">사이트 안내</div>
            <div className="mt-2 grid gap-1">
              {guideLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  title={collapsed ? link.label : undefined}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[11px] text-slate-200/80 hover:bg-white/10"
                >
                  <span className="flex items-center gap-2">
                    <SidebarIcon name={link.icon} />
                    <span>{link.label}</span>
                  </span>
                  <span className="text-[10px] text-slate-200/50">↗</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div
        className={`transition-[margin,width] duration-200 ${collapsed ? "lg:ml-16 lg:w-[calc(100%-4rem)]" : "lg:ml-64 lg:w-[calc(100%-16rem)]"}`}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pb-16 pt-6 md:px-6 xl:px-8">
          <div className="hidden w-full items-center justify-end gap-3 pb-4 lg:flex">
            <AdminLink />
            <AuthButton />
          </div>
          <main className="w-full">{children}</main>
        </div>
      </div>
    </div>
  );
}
