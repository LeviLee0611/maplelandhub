import type { Metadata } from "next";
import cubeIndexJson from "@data/planet/cube-index.json";
import type { CubeIndexData } from "@/types/cube";
import { CubeBuilder } from "@/components/CubeBuilder";

// 검증된 수요가 없어 네비게이션/사이트맵/구조화 데이터에서 노출을 내림(2026-07-16) — 라우트 자체는
// 유지해서 URL을 직접 아는 사람은 계속 쓸 수 있게 하되, 검색엔진엔 잡히지 않도록 noindex 처리.
export const metadata: Metadata = {
  title: "메랜Hub - 메이플 플래닛 큐브 빌더 (가성비 계산기)",
  description: "내 캐릭터 스탯과 장착 잠재능력을 입력하면 어느 부위를 큐브 돌리는 게 가장 효율적인지 계산합니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanetCubeBuilderPage() {
  return <CubeBuilder cubeData={cubeIndexJson as unknown as CubeIndexData} />;
}
