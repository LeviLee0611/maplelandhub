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
  metadataBase: new URL((process.env.NEXT_PUBLIC_APP_URL ?? "https://maplelandhub.pages.dev").trim().replace(/\/$/, "")),
  title: "메랜Hub - 메이플랜드 도구들",
  description: "메이플랜드 유저를 위한 올인원 유틸리티 허브",
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
      <body className="min-h-screen">
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
