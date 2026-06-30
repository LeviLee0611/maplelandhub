# 메랜Hub — 개발 일지

> 최신 항목이 맨 위. 기능 구현 결정과 이유 위주로 기록.

---

## 2026-06-30

### 드롭테이블 신규 아이템 추가 (시그너스 업데이트)

**원인**: xn--o80b01o9mlw3kdzc.com 사이트가 `drop-rate-box` div에 `style` 속성을 추가했으나
기존 정규식 `<div class="drop-rate-box">` 가 속성 있는 경우를 매칭 못 하던 버그 수정.
→ `scripts/fetch-item-detail-by.mjs` 정규식 수정 (`"[^>]*>` 패턴 적용)

**신규 추가 스크립트**: `scripts/fetch-new-items-drop-data.mjs`
- xn--o80b01o9mlw3kdzc.com/itemnote 페이지 전체 스크래핑 (레벨 70+)
- 기존 drop-index.json에 없는 신규 아이템 필터링 후 item_detail 드롭 데이터 수집
- 카테고리: 전사/마법사/궁수/도적/해적/무기(Lv70+) + 소비(Weapon/Armor/Mastery Scroll 전체)

**결과** (`data/drop-index.json` 재빌드):
- 아이템 수: 2515 → 2687 (+172)
- 타임리스/리버스 세트 전 직업 완전 추가 (핑크빈 드롭: 0.125%/0.5%)
- 신규 주문서 203종, 마스터리북 포함

**재빌드 순서**:
1. `node scripts/fetch-new-items-drop-data.mjs` — 신규 item_detail 드롭 데이터 수집
2. `node scripts/build-drop-index.mjs` — drop-index.json 재빌드

---

### 시그너스 기사단 N방컷 계산기 추가

**스킬 데이터 (data/skills/)**
- `mainSkillMapping.json`: 5개 직업 항목 추가 (소울마스터, 플레임위자드, 윈드브레이커, 나이트워커, 스트라이커)
- `damageMapping.json`: 시그너스 공격 스킬 25종 전 레벨 데이터 추가 (총 107개 스킬)
  - 기존 동명 스킬과 충돌 방지: 어벤져(나워), 트리플 스로우(나워), 에너지 버스터(스커), 쇼크웨이브(스커) 등 명칭 구분
- `range20.json`: 20레벨 만렙 시그너스 스킬 20종 추가
- `range30.json`: 30레벨 만렙 시그너스 스킬 6종 추가 (소울 블레이드, 브랜디쉬(소마), 소울 드라이버, 플레임 기어, 파이어 스트라이크, 샤크 웨이브)

**계산기 페이지 (calculators/onehit/page.tsx)**
- `jobGroups`에 "시그너스" 추가 → 드롭다운에서 선택 가능
- `jobOptionsByGroup.시그너스`: 5개 직업 정의
- `jobProfile`: 5개 직업 스탯 프로필 (플레임위자드 = INT/LUK/마법직, 나머지 = 물리직)
- 직업 플래그 추가: isCygnusJob, isSoulMasterJob, isFlameWizardJob, isWindBreakerJob, isNightWalkerJob, isStrikerJob, isArcherOrWindBreaker
- 무기 타입: 소울마스터(검), 플레임위자드(없음), 윈드브레이커(활, 화살선택), 나이트워커/스트라이커(잠금)
- 정확도 공식: 시그너스 직업별 분기 (전사계/마법계/궁수계/도적계/해적계 공식 각각 적용)
- 나이트워커: 도적계 부스탯(STR) 합산, 크리티컬 스로우, 표창 선택 UI 활성화
- 플레임위자드: 마법사와 동일하게 패시브 마스터리 비적용

---

### 파일 구조 정리
- `party/page.tsx`: Coming Soon 스텁 → `redirect('/parties')`로 교체 (실제 기능 페이지로 연결)
- `nav-bar.tsx` 삭제: 정의만 있고 아무 데서도 import되지 않던 미사용 컴포넌트
- 루트 잡파일 삭제: `This`, `You` (빈 파일), `FETCH_HEAD` (git 아티팩트 잘못 위치)
- TypeScript 에러 0개 확인

---


### 문서화 체계 수립
- CLAUDE.md, AGENTS.md, database.md, data.md, project-notes.md, TODO.md, DEVLOG.md 작성
- 프로젝트 문서화 체계 수립 (Pet/pawprint 방식 접목)
- 데이터 파이프라인 현황 정리 (`data.md`)
- DB 스키마 전체 문서화 (`database.md`)
- 레거시/중복 경로 목록 확인 필요 항목 TODO에 추가

### 전체 최적화 (번들 + 버그)

**클라이언트 번들 경량화 (~9.5MB 절감)**
- `DropTable.tsx`: `drop-index.json` (3.8MB) + `item-detail-by.json` (318KB) import 제거
  - 두 파일을 서버 컴포넌트(`drop-table/page.tsx`)에서 import → props로 전달
  - `"use client"` 번들에서 ~4.1MB 제거
- `QuestBoard.tsx`: 6개 JSON import 모두 제거 (quests, monsters, monster-spawns, drop-index, item-detail-by, npc-locations = ~5.4MB)
  - `quests/page.tsx` 서버 컴포넌트에서 import → props로 전달
- `tsconfig.json`: 중첩된 `maplelandhub/` 디렉토리 exclude 추가 (TS 컴파일 충돌 방지)

**코드 품질 수정**
- `sidebar-shell.tsx`: 파티 매칭 링크 `/party`(Coming Soon 스텁) → `/parties`(실제 기능) 수정
- `calculators/onehit/page.tsx`: 프로덕션 `console.log` 제거 (useEffect 전체 삭제)
- `StatTable.tsx`: `highlight` prop 버그 수정 — 두 분기가 동일한 클래스를 사용하던 문제, highlight 시 `--retro-header-yellow` 색상 적용
- `TakenDamageCalculator.tsx`: 538번째 줄 중복 `<p>` 제거

**코드 구조 개선**
- `DropTable.tsx`: `getItemGroup`, `getItemLevel` 함수를 컴포넌트 바디에서 모듈 레벨로 이동
- `QuestBoard.tsx`: 로컬 `formatNumber` 제거 → `src/lib/utils.ts` 공유 함수 사용
- `DropIndexData`, `ItemDetailByData` 타입 export (page에서 재사용)
- `QuestBoardProps` 타입 export

---

<!-- 새 작업은 여기 위에 날짜 역순으로 추가 -->
