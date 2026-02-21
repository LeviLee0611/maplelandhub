import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "메이플랜드 파티 매칭",
  description: "메이플랜드 파티 매칭 게시판에서 파티원을 빠르게 찾으세요.",
  keywords: ["메이플랜드", "파티 매칭", "파티 모집", "파티원 구하기"],
  alternates: {
    canonical: "/party",
  },
};

export default function PartyLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "메이플랜드 파티 매칭",
    description: "메이플랜드 파티 매칭 게시판에서 파티원을 빠르게 찾으세요.",
    url: "https://maplelandhub.pages.dev/party",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
