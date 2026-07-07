# 메랜Hub — 개발 일지

> 최신 항목이 맨 위. 기능 구현 결정과 이유 위주로 기록.

---

## 2026-07-07

### 메이플 플래닛(Planet) 서버 지원 추가

**배경**: 메이플랜드 외에 최근 흥행 중인 신규 사설서버 "메이플 플래닛"(넥슨 MapleStory Worlds 플랫폼, 빅뱅 직전 KMS 1.2.95~98 기반 — 메이플랜드와 동일 버전)의 유저층을 흡수하기 위해 드랍테이블/계산기부터 플래닛 버전 제공. 이미 플래닛 전용 커뮤니티 사이트가 여럿(planet-helper.com, 플래닛고, 조아요, mapleplanet.gg) 있어 정면 대결보다 "메랜Hub가 잘하는 기능부터" 전략으로 진행.

**라우트 구조**: 기존 메랜 URL(`/`, `/drop-table`, `/calculator/damage`, `/calculators/onehit`)은 그대로 두고 `/planet` 이하에 미러링 — SEO 자산 보존 + 서버별 URL 분리.
- `/planet` — 랜딩 페이지 (기능 카드 그리드)
- `/planet/drop-table`, `/planet/calculator/damage`, `/planet/calculators/onehit`
- `/planet/cube-simulator` — 플래닛 전용 신규 기능(아래 참고, 메랜엔 큐브/잠재능력 시스템 자체가 없음)

**컴포넌트 재사용 전략**: `DropTable`/`TakenDamageCalculator`/`OneHitCalculatorClient`(구 onehit page.tsx에서 분리)는 메랜과 플래닛이 공유. 몬스터 데이터/서버 구분은 전부 **prop으로 주입**(`monsters`, `server`, `calculatorBasePath`, `itemLinkBase`) — 기존에 있던 `setMonsterProvider`(전역 mutable 싱글턴) 패턴은 동시 요청 환경에서 안전하지 않아 사용하지 않음.

**사이드바/홈페이지**: 서버 전환 pill을 큰 카드형 버튼(🌲메이플랜드/🪐메이플 플래닛)으로 확장, 홈페이지에도 "서버를 선택하세요" 2카드 섹션 추가. 메랜Hub 로고 옆에 항상 MAPLELAND/PLANET 배지 표시 (기존엔 플래닛일 때만 표시했었음 — 대칭으로 수정).

---

### 플래닛 색상 테마 분리 (cyan ↔ amber)

`--brand-accent`, `--brand-accent-2` 등 CSS 커스텀 프로퍼티를 도입, `[data-server="planet"]` 선택자로 앰버/오렌지 톤으로 전환되게 함(메랜은 기존 cyan/emerald 유지). `DropTable`/`TakenDamageCalculator`/`onehit-calculator-client`의 하드코딩된 cyan/sky/emerald 클래스를 CSS 변수 참조로 교체. `PanelHeader.tsx`(드랍테이블류)와 `Panel.tsx`(계산기류)가 서로 다른 톤 시스템을 쓰고 있어서 둘 다 따로 `[data-server="planet"]` 오버라이드 필요했음 — 처음에 `PanelHeader`만 고치고 `Panel`을 놓쳐서 계산기 페이지 창 헤더가 여전히 파란색이던 버그를 나중에 발견해 수정.

**Turbopack 트러블슈팅**: `globals.css` 증분 수정이 dev 서버에 반영 안 되는 현상이 세션 내내 반복됨 — `.next` 캐시 삭제 후 서버 재시작으로만 해결됨. CSS만 고쳤는데 브라우저에 반영이 안 되면 우선 의심할 것.

---

### 플래닛 데이터 파이프라인

Planet은 메랜과 동일 KMS 버전이라 **메랜 원본 데이터를 베이스로 재사용 + 배율/보강 데이터만 얹는 방식**으로 구축(`scripts/build-planet-data.mjs`, 상세는 `data.md` 참고).

- **드랍률 4배** 배율을 `drop-index.json`/`item-detail-by.json`의 `prob`에 직접 반영 (커뮤니티 사이트 패치노트로 배율 로직 검증함: 듀얼 버크의 일비 표창 0.008%→0.032% 정확히 일치)
- **몬스터 속성(불/얼음/전기/독/성 약점·반감·면역)**: 외부 영문 데이터셋을 mobCode로 매칭해 자동 보강 (464종 매칭, 기존 데이터와 충돌 0건 — 항상 상위집합이라 안전하게 덮어씀)
- **신규 몬스터 124종 추가**: 메랜 원본에 없는 몬스터(파풀라투스, 피아누스, 도도, 오베론 등 포함)를 외부 카탈로그 데이터에서 자동 추가. 기존에 있는 mobCode는 스탯 차이가 있어도 검증 없이 덮어쓰지 않음(556종 보류 중)
- **출현 맵(`map` 필드) 보강**: maplestory.io 공개 API 기반 데이터로 451종 몬스터의 구체적 스폰 맵 채움 (기존엔 전 몬스터 공백이었음)
- **데이터 정확도 검증**: 조아요(chowayo.com) 등과 스팟체크 — 자쿰 3페이즈/기본 달팽이는 완전 일치, 빨간 달팽이(레벨/EXP 뒤바뀜)·핑크빈(EXP 큰 차이) 등 불일치 발견해 `divergence-overrides.json`에 수정 반영(단일 출처만 확인한 잠정치)

**소스 파일 위치 정리**: 손수 관리/외부 출처 데이터(`divergence-overrides.json`, `monster-attribute-data.js`, `monster-catalog-data.js`, `map-catalog-data.js`, `cube-data.js`)는 `data/*.json`이 "빌드 산출물 전용, 직접 편집 금지"라는 프로젝트 규칙과 충돌해서 `data/planet/` → **`scripts/sources/planet/`**로 이동. `data/planet/`엔 이제 산출물만 남음.

**중요 발견**: 세션 도중 받은 데이터 파일 중 `app.js`가 실제로는 경쟁 사이트(플래닛고)의 **웹앱 소스코드 + 라이브 Firebase 자격증명**이었음을 발견 — 삭제 처리. 나머지 데이터 파일들은 출처가 명시돼 있어(공식 mapleplanet.co.kr, maplestory.io 공개 API, KMS 데이터마이닝 팩) 사용 가능하다고 판단.

---

### 큐브 시뮬레이터 (신규 기능, `/planet/cube-simulator`)

공식 mapleplanet.co.kr/Cube에 공개된 수상한 큐브(185개)/미라클 큐브(132개) 옵션 확률 풀 기반. 옵션 종류는 공식 가중치(weight)로 뽑고, 옵션 내 수치 등급(1~20단계)은 균등분포로 단순화 — 페이지에 이 한계를 명시. 메랜엔 큐브/잠재능력 시스템 자체가 없어 사이드바에 플래닛 모드에서만 노출.

---

### 계산기 프리셋 서버 분리 + 로컬 상태 버그 수정

`character_presets` 테이블에 `server` 컬럼 추가 마이그레이션(`20260707_add_server_to_character_presets.sql`, unique 제약을 `(user_id, calculator, server, name)`으로 확장) — 운영 Supabase에 적용 완료 확인함(익명 키로 스키마 조회해 컬럼 존재 검증).

외부 코드 리뷰(codex) 피드백으로 발견된 문제 수정:
- 한방컷 계산기의 로컬 프로필 저장 키, 피격뎀 계산기의 QuickSlots 저장 키가 서버 구분 없이 공통이라 메랜↔플래닛 전환 시 몬스터/스탯 상태가 서로 덮이는 문제 — `server`별로 키 분리(단, **기존 메랜 유저 저장분 유실처럼 보이지 않게 메랜은 기존 키 유지, 플래닛만 새 키** 사용)

---

### SEO — 플래닛 검색 노출

`sitemap.ts`에 플래닛 라우트 5개 전부 추가(기존엔 메랜만 있었음), 루트 레이아웃과 플래닛 각 페이지에 "메이플 플래닛/메이플플래닛/플래닛" 등 keywords 메타 추가, 한방컷·큐브 시뮬레이터 페이지엔 JSON-LD 구조화 데이터도 추가(기존 메랜 한방컷 계산기 SEO 커밋 패턴 재사용).

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

### 드랍 테이블 검색 성능 최적화 + 자동완성 선택 버그 수정

**문제**: `/drop-table` 페이지에서 아이템/몬스터 검색 시 타이핑할 때 체감 딜레이 발생.

**원인** (`src/components/DropTable.tsx`):
- `filteredItems`/`filteredMonsters`가 키 입력마다 아이템 2,687개·몬스터 653개 전체를 `sort()`로 정렬
- 정렬 비교 함수(comparator) 안에서 `getMatchScore` → `getSearchKeys`(정규식 다수 + 한글 초성 변환)를 이름마다 매 비교 시점에 재계산
- 정렬 특성상 같은 항목의 검색 키가 비교당 여러 번 중복 계산되어, 키 입력 1번에 검색 키 계산이 수만 번 발생

**수정**:
- `itemSearchKeysById`, `monsterSearchKeysByMobCode`: 아이템/몬스터별 검색 키를 `useMemo`로 1회만 계산해 `Map`에 캐싱 (의존성은 `dropData.items` / 빈 배열 — 마운트 후 재계산 안 됨)
- `getMatchScore(name, keyword)` → `getMatchScoreFromKeys(keys, keyword)`로 변경, 캐싱된 키 배열을 직접 사용
- 정렬 비교 함수에서 점수를 매번 재계산하던 방식 → 키워드가 있을 때 점수를 단일 패스(O(n))로 먼저 계산한 뒤, 가벼운 숫자 비교로만 정렬

**검증**:
- 브라우저 실측(`next dev`, 비압축 빌드 기준): "주문서" 입력 시 키 입력당 처리 시간 4.7ms → 41.4ms(첫 글자, JIT 워밍업) → 12.5ms → 9.9ms로 프레임 예산(16ms) 안쪽 안정화
- `npx tsc --noEmit`, `npx eslint src/` 통과

**추가로 발견한 버그 수정**:
- `suggestionItems` 배열 순서가 `[...items, ...monsters]`(아이템 우선)였는데, 실제 렌더링 순서는 몬스터 → 아이템이라 키보드 `ArrowDown`/`Enter` 선택 시 화면 하이라이트와 실제 선택 항목이 어긋나는 버그 존재
- `[...monsters, ...items]`로 순서를 렌더링과 일치시켜 수정
- 브라우저에서 ArrowDown → 하이라이트된 몬스터 → Enter → 동일 몬스터 선택까지 직접 확인

---

<!-- 새 작업은 여기 위에 날짜 역순으로 추가 -->
