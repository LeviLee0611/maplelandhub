import type { Metadata } from "next";
import { Space_Grotesk, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
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
  title: "메랜Hub - 메이플랜드 도구들",
  description: "메이플랜드 유저를 위한 올인원 유틸리티 허브",
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
        <NavBar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8">{children}</main>
      </body>
    </html>
  );
}
