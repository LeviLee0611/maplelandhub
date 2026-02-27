import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SidebarShell } from "@/components/sidebar-shell";
import { AnnouncementBanner } from "@/components/announcement-banner";

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
    images: ["/images/bg-game.png.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/images/bg-game.png.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <div className="page-glow" aria-hidden="true" />
        <AnnouncementBanner />
        <SidebarShell>{children}</SidebarShell>
      </body>
    </html>
  );
}
