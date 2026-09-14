import type { Monster } from "@/types/monster";

/**
 * 이름 + (있으면) mobCode로 몬스터 하나를 확정한다.
 *
 * 이름만으로 찾으면 동명이몹에서 배열 첫 항목으로 흘러간다 — 출시분 기준 52개 이름이 중복이고
 * 그중 19개는 HP까지 다르다(스톤골렘 4000 vs 600, 주니어 스톤볼 600 vs 8 등). 목록에서 고르거나
 * 링크로 mobCode가 넘어온 경우엔 그걸 우선한다. mobCode가 없거나 목록에 없으면 이름으로 폴백한다
 * (URL의 ?mob=이름, 예전에 저장된 프리셋 등 mobCode가 없는 경로를 지원해야 하므로).
 *
 * 이 파일은 일부러 `@/lib/data/monsters`(몬스터 JSON을 import하는 모듈)와 분리돼 있다 — 클라이언트
 * 컴포넌트(계산기)가 이 함수만 필요한데 같은 모듈에서 가져오면, 쓰지도 않는 몬스터 JSON 전체가
 * 번들에 같이 딸려 들어간다(2026-09-11 발견: 계산기 4개 페이지 클라이언트 청크에 약 150KB 상당의
 * 몬스터 데이터가 새로 포함된 걸 확인 — 서버 컴포넌트만 `@/lib/data/monsters`의 `getMonsters`/
 * `getPlanetMonsters`를 쓰도록 정리).
 */
export function resolveSelectedMonster(
  monsters: Monster[],
  name: string,
  mobCode?: number | null,
): Monster | undefined {
  if (mobCode != null) {
    const byCode = monsters.find((monster) => monster.mobCode === mobCode);
    if (byCode) return byCode;
  }
  return monsters.find((monster) => monster.name === name);
}
