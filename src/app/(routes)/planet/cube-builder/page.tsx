import type { Metadata } from "next";
import cubeIndexJson from "@data/planet/cube-index.json";
import type { CubeIndexData } from "@/types/cube";
import { CubeBuilder } from "@/components/CubeBuilder";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 큐브 빌더 (가성비 계산기)",
  description: "내 캐릭터 스탯과 장착 잠재능력을 입력하면 어느 부위를 큐브 돌리는 게 가장 효율적인지 계산합니다.",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 큐브",
    "메이플 플래닛 잠재능력",
    "큐브 빌더",
    "큐브 가성비",
    "수상한 큐브",
    "미라클 큐브",
  ],
  alternates: {
    canonical: "/planet/cube-builder",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 큐브 빌더 (가성비 계산기)",
    description: "내 캐릭터 스탯과 장착 잠재능력을 입력하면 어느 부위를 큐브 돌리는 게 가장 효율적인지 계산합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 큐브 빌더 (가성비 계산기)",
    description: "내 캐릭터 스탯과 장착 잠재능력을 입력하면 어느 부위를 큐브 돌리는 게 가장 효율적인지 계산합니다.",
  },
};

export default function PlanetCubeBuilderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "메이플 플래닛 큐브 빌더",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "내 캐릭터 스탯과 장착 잠재능력을 입력하면 어느 부위를 큐브 돌리는 게 가장 효율적인지 계산합니다.",
    url: "https://maplelandhub.com/planet/cube-builder",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CubeBuilder cubeData={cubeIndexJson as unknown as CubeIndexData} />
    </>
  );
}
