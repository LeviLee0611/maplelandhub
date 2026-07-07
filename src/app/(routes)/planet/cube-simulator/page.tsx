import type { Metadata } from "next";
import cubeIndexJson from "@data/planet/cube-index.json";
import type { CubeIndexData } from "@/types/cube";
import { CubeSimulator } from "@/components/CubeSimulator";

export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 큐브 시뮬레이터",
  description: "메이플 플래닛 수상한 큐브 / 미라클 큐브 잠재능력 확률을 시뮬레이션합니다.",
  keywords: [
    "메이플 플래닛",
    "메이플플래닛",
    "플래닛",
    "메이플 플래닛 큐브",
    "메이플 플래닛 잠재능력",
    "수상한 큐브",
    "미라클 큐브",
    "큐브 시뮬레이터",
  ],
  alternates: {
    canonical: "/planet/cube-simulator",
  },
  openGraph: {
    title: "메랜Hub - 메이플 플래닛 큐브 시뮬레이터",
    description: "메이플 플래닛 수상한 큐브 / 미라클 큐브 잠재능력 확률을 시뮬레이션합니다.",
  },
  twitter: {
    title: "메랜Hub - 메이플 플래닛 큐브 시뮬레이터",
    description: "메이플 플래닛 수상한 큐브 / 미라클 큐브 잠재능력 확률을 시뮬레이션합니다.",
  },
};

export default function PlanetCubeSimulatorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "메이플 플래닛 큐브 시뮬레이터",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    description: "메이플 플래닛 수상한 큐브 / 미라클 큐브 잠재능력 확률을 시뮬레이션합니다.",
    url: "https://maplelandhub.com/planet/cube-simulator",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CubeSimulator cubeData={cubeIndexJson as unknown as CubeIndexData} />
    </>
  );
}
