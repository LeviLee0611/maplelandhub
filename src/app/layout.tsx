import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SidebarShell } from "@/components/sidebar-shell";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { WebVitalsReporter } from "@/components/web-vitals-reporter";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const body = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL((process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.com").trim().replace(/\/$/, "")),
  title: "메랜Hub - 메이플랜드(메랜/매랜) 계산기 모음",
  description: "메랜, 매랜(메이플랜드) 유저를 위한 한방컷 계산기, 데미지 계산기, 드랍테이블, 퀘스트 정보 올인원 유틸리티 허브",
  keywords: [
    "메랜",
    "매랜",
    "메랜 계산기",
    "매랜 계산기",
    "메이플랜드",
    "메이플랜드 계산기",
    "메랜 한방컷계산기",
    "매랜 한방컷계산기",
    "메랜허브",
  ],
  openGraph: {
    type: "website",
    siteName: "메랜Hub",
    locale: "ko_KR",
    images: ["/favicon.ico"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const perfDebugEnabled = process.env.PERF_DEBUG === "1";

  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen overflow-x-hidden">
        <WebVitalsReporter debug={perfDebugEnabled} />
        <div className="page-glow" aria-hidden="true" />
        <Suspense fallback={null}>
          <AnnouncementBanner />
        </Suspense>
        <SidebarShell>{children}</SidebarShell>
      </body>
    </html>
  );
}
