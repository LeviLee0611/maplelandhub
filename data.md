# 메랜Hub — 데이터 파이프라인

> 마지막 업데이트: 2026-07-16

---

## 개요

게임 데이터(몬스터, 드롭, 퀘스트, 스킬 등)는 외부 소스에서 수집 후 빌드 스크립트로 가공해 정적 JSON으로 저장.
Next.js가 빌드 타임에 JSON을 번들에 포함 — 런타임 외부 API 의존 없음.

**황금 규칙**: `data/*.json` 파일은 스크립트 산출물. 절대 직접 편집하지 말 것.

---

## 데이터 파일 목록

| 파일 | 크기 | 줄 수 | 설명 |
|---|---|---|---|
| `data/drop-index.json` | 3.8MB | — | 몬스터 ID → 드롭 아이템 인덱스 |
| `data/drops-parsed.json` | 3.7MB | ~164,678 | 파싱된 드롭 확률 데이터 |
| `data/dropchance` | 3.2MB | — | 원본 드롭 확률 HTML 소스 |
| `data/dropchance.chunk.js` | 1.3MB | — | 드롭 확률 청크 JS (빌드 중간 산출물) |
| `data/dropchance-report.json` | 503KB | — | 드롭 확률 빌드 리포트 |
| `data/quests.json` | 717KB | ~31,202 | 퀘스트 전체 목록 |
| `data/item-detail-by.json` | 318KB | — | 아이템 상세 (드롭 테이블 연동) |
| `data/npc-locations.json` | 211KB | — | NPC 맵 위치 |
| `data/monster-spawns.json` | 251KB | — | 몬스터 스폰 위치 |
| `data/monsters.json` | 156KB | ~8,707 | 몬스터 목록 |
| `data/release-filters.json` | 81B | — | 서버 미출시 몬스터 필터 설정 |
| `data/drops-merge-report.json` | 205B | — | 드롭 병합 리포트 |
| `data/raw/monsters.raw.ts` | — | — | 몬스터 원본 데이터 |
| `data/raw/skills.raw.ts` | — | — | 스킬 원본 데이터 |
| `data/skills/*.json` | — | — | 스킬별 데미지/매핑 데이터 |

---

## 빌드 스크립트 & 명령어

```bash
# 드롭 데이터 전체 파이프라인 (HTML → parsed → index)
npm run build:drop-table-from-dropchance

# 단계별 실행
npm run build:drops-from-dropchance   # HTML → drops-parsed.json
npm run build:drops-merged            # drops-parsed.json 병합
npm run build:drop-index              # drop-index.json 생성

# 퀘스트 데이터 임포트
npm run import:quests

# 몬스터 스폰 위치 빌드
npm run build:monster-spawns

# 몬스터 맵 위치 빌드
npm run build:monster-map-locations

# NPC 위치 빌드
npm run build:npc-locations

# 아이템 상세 데이터
npm run fetch:item-detail-by          # 원격 fetch 후 저장
npm run build:item-detail-by          # HTML → item-detail-by.json
```

**플래닛 데이터 자동 재생성**: `build:drop-table-from-dropchance`, `build:drop-index`, `build:item-detail-by`, `fetch:item-detail-by` 4개 스크립트는 `package.json`에서 끝에 `&& node scripts/build-planet-data.mjs`가 체이닝되어 있어 **`npm run build:planet-data`를 따로 실행할 필요 없음** — 메랜 원본(drop-index/item-detail-by)을 재생성하는 어떤 경로로 들어와도 플래닛이 자동으로 같이 갱신됨(2026-07-09, 메랜/플래닛 동기화 누락 재발 방지용으로 추가). 플래닛 데이터만 단독으로 다시 만들고 싶을 때만 `npm run build:planet-data`를 직접 호출.

---

## 스크립트 파일 목록

| 스크립트 | 역할 |
|---|---|
| `scripts/build-drops-parsed-from-dropchance-html.mjs` | 원본 HTML → drops-parsed.json |
| `scripts/build-merged-drops-parsed.mjs` | 드롭 데이터 병합 |
| `scripts/build-drop-index.mjs` | 몬스터 기준 드롭 인덱스 생성 (수기 소스: `scripts/sources/item-name-overrides.json`, 아래 참고) |
| `scripts/import-quests-from-turbopack.mjs` | 퀘스트 데이터 임포트 |
| `scripts/build-monster-spawns-from-html.mjs` | 몬스터 스폰 데이터 |
| `scripts/build-monster-map-locations.mjs` | 몬스터 맵 위치 |
| `scripts/build-npc-map-locations.mjs` | NPC 위치 |
| `scripts/build-item-detail-by-from-html.mjs` | 아이템 상세 빌드 |
| `scripts/fetch-item-detail-by.mjs` | 아이템 상세 fetch (기존 아이템 갱신) |
| `scripts/fetch-new-items-drop-data.mjs` | 신규 아이템 수집 + 드롭 데이터 fetch (신규 콘텐츠 추가용) |
| `scripts/find-item-names.mjs` | 아이템명 탐색 유틸 |
| `scripts/normalize-monsters.mjs` | 몬스터 데이터 정규화 |
| `scripts/normalize-skills.mjs` | 스킬 데이터 정규화 |
| `scripts/parse-drops-js.mjs` | JS 형식 드롭 파싱 |
| `scripts/build-planet-data.mjs` | 메이플 플래닛 데이터셋 생성 (아래 "메이플 플래닛 데이터 파이프라인" 참고) |

---

## 아이템명 → 아이템ID 수기 오버라이드 (`scripts/sources/item-name-overrides.json`)

`data/*.json`과 마찬가지로 손으로 편집하면 안 되는 산출물과 별개로, `scripts/sources/`에 두는 **손수 관리 소스** 파일(Planet의 `divergence-overrides.json`과 같은 성격). `build-drop-index.mjs`가 드롭 데이터를 조립할 때, 드랍표 스크래핑 단계에서 실제 아이템 DB와 이름이 안 맞아 "가상 아이템"(synthetic, 음수 ID)으로 처리된 항목을 이 파일의 이름→실제 itemId 매핑으로 우선 대체한다. 이 매핑이 없으면 해당 아이템은 아이콘 없이 텍스트 타일로만 표시됨(`DropTable.tsx`의 `ItemIcon`/`getResolvedIconItemId` 참고).

새로운 미매칭 아이템을 발견하면 `https://maplestory.io/api/KMS/389/item?searchFor=<이름>`으로 정확히 일치하는 실제 아이템을 찾아 이 파일에 추가하고 `npm run build:drop-index`를 재실행한다. 이름이 스크래핑 원본에서 아예 깨져 있어(OCR/HTML 파싱 오류 등) 실제 아이템을 특정할 수 없는 경우는 억지로 매칭하지 말고 비워둔다(오매칭이 미표시보다 나쁨).

---

## 정적 데이터 (src/data/mapledb/)

Next.js 내부에서 직접 import되는 JS 파일. 대형 데이터는 이쪽보다 `data/*.json`을 선호.

| 파일 | 내용 |
|---|---|
| `src/data/mapledb/drops.js` | 드롭 테이블 (mapledb 기준) |
| `src/data/mapledb/equips.js` | 장비 목록 |
| `src/data/mapledb/maps.js` | 맵 목록 |
| `src/data/mapledb/monsters.js` | 몬스터 (mapledb 기준) |
| `src/data/mapledb/npcs.js` | NPC 목록 |
| `src/data/mapledb/questdetail.js` | 퀘스트 상세 |
| `src/data/mapledb/quests.js` | 퀘스트 목록 |

---

## 데이터 필터링

서버 미출시 콘텐츠 필터:
- 설정: `data/release-filters.json`
- 로직: `src/lib/release-filter.ts`
  - `blockedMobCodeMin`: 이 값 이상인 mobCode 전체 차단 (default: 9,000,000)
  - `blockedMobCodes`: 개별 차단 몬스터 ID 배열
- 필터 적용 함수: `filterReleasedMonsters()`, `isReleasedMobCode()`, `isReleasedMonster()`

신규 몬스터/아이템 차단 시 `data/release-filters.json`만 수정하면 됨.

---

## 외부 이미지 API

- **maplestory.io API**: 아이템/몬스터 이미지 제공
- next.config.ts에서 `remotePatterns`으로 허용된 도메인
- URL 패턴: `https://maplestory.io/api/**`
- 런타임 의존 (오프라인 시 이미지 없음)

---

## 데이터 업데이트 시 체크리스트

1. 소스 파일 (HTML/JS) 업데이트 또는 원격 fetch
2. 해당 `scripts/*.mjs` 실행
3. 출력 JSON 크기/줄 수 이상 없는지 확인
4. `data/release-filters.json` 신규 차단 필요 항목 검토
5. `npm run build`로 번들 사이즈 확인
6. 드롭/몬스터 변경 시 `src/data/mapledb/` 파일도 동기화 필요한지 확인

---

## 번들 사이즈 주의사항

`data/*.json`은 Next.js 빌드 타임에 번들에 포함됨.

**"서버 컴포넌트에서 import"만으로는 부족함 — 실제로 겪은 함정(2026-07-09)**: `page.tsx`(서버 컴포넌트)에서 대용량 JSON을 import해도, 그 값을 그대로 `"use client"` 컴포넌트에 props로 넘기면 RSC 페이로드에 통째로 직렬화되어 결국 클라이언트로 전송됨. 예전엔 "서버 컴포넌트에서 import했으니 완료"로 잘못 기록했다가, 실측(`/drop-table` 2.4MB)으로 드러나서야 발견했음 — import 위치가 아니라 **클라이언트로 넘어가는 props의 크기**가 기준.

올바른 패턴(DropTable/QuestBoard에 적용된 방식, `data.md` 체크리스트 5번과 동일):
- 검색/렌더링에 실제로 필요한 필드만 남기고 서버에서 슬림화한 뒤 클라이언트 props로 전달 (예: `src/lib/drop-table-lookup.ts`, `src/lib/quest-board-data.ts` — 데이터 없는 순수 함수로 분리)
- 사용자가 선택했을 때만 필요한 상세 데이터(드랍 연관관계 등)는 초기 props에서 아예 빼고, API Route로 온디맨드 fetch
- drop-index.json (3.8MB), drops-parsed.json (3.7MB) 등은 서버 컴포넌트에서 import는 하되, 슬림화 없이 클라이언트 컴포넌트로 그대로 넘기지 말 것
- 작업 후엔 `npm run build` 산출물의 실제 페이지 크기(HTML/RSC payload)로 검증 — import 위치만 보고 안전하다고 판단하지 말 것

---

## 메이플 플래닛(Planet) 데이터 파이프라인

메랜Hub는 메이플랜드 외에 두 번째 사설서버 "메이플 플래닛"도 지원한다. Planet은 메이플랜드와
**동일한 pre-빅뱅 KMS 1.2.95~98 기반**이므로, 처음부터 새로 스크래핑하지 않고 이미 빌드된
메이플랜드 데이터를 기반으로 배율/오버라이드/보강 데이터를 얹어서 Planet 데이터셋을 만든다.

### 소스 vs 산출물 — 디렉터리 분리

`data/`는 "스크립트 산출물 전용, 손으로 편집 금지"가 프로젝트 규칙이라(위 황금 규칙 참고),
Planet 쪽에서 손으로 관리하거나 외부에서 받아온 원천 파일은 `data/planet/`이 아니라
**`scripts/sources/planet/`**에 둔다. `data/planet/`에는 빌드 스크립트가 생성한 산출물만 있다.

| 위치 | 파일 | 성격 |
|---|---|---|
| `scripts/sources/planet/` | `divergence-overrides.json` | 손수 관리 설정 파일 (배율/오버라이드/신규 몬스터, 아래 참고) |
| `scripts/sources/planet/` | `monster-attribute-data.js` | 외부 출처(영문) 몬스터 속성(불/얼음/전기/독/성 약점·반감·면역) 데이터 |
| `scripts/sources/planet/` | `monster-catalog-data.js` | 외부 출처 몬스터 스탯 카탈로그(680종) — 메랜에 없는 몬스터 신규 추가에 사용 |
| `scripts/sources/planet/` | `map-catalog-data.js` | 출처: maplestory.io — 맵별 몬스터 스폰 정보, 몬스터 `map` 필드 보강에 사용 |
| `scripts/sources/planet/` | `cube-data.js` | 출처: 공식 mapleplanet.co.kr/Cube — 수상한/미라클 큐브 옵션 확률 풀 |
| `scripts/sources/planet/` | `pack-source-data.js` | NPC 상점 판매처 데이터 — 현재 미사용(대응 기능 없음), 참고용으로만 보관 |
| `data/planet/` | `monsters.json` | 산출물. 형태(`Monster` 타입)는 메이플랜드와 동일 |
| `data/planet/` | `drop-index.json` | 산출물. 드롭률 배율 적용본 |
| `data/planet/` | `item-detail-by.json` | 산출물. 드롭률 배율 적용본 |
| `data/planet/` | `release-filters.json` | 메이플랜드 원본을 최초 1회 복사한 시작값. **TODO: Planet 실제 미출시 콘텐츠 경계는 다를 수 있음 — 수동 검토 필요** |
| `data/planet/` | `cube-index.json` | 산출물. `cube-data.js`를 정리한 큐브 시뮬레이터용 데이터 |

### 빌드 스크립트

```bash
npm run build:planet-data              # data/planet/*.json 생성/갱신 — 위 "자동 재생성" 참고, 대부분 직접 호출 불필요
npm run build:planet-data -- --force   # release-filters.json도 Mapleland 원본으로 덮어쓰기
```

`scripts/build-planet-data.mjs`가 순서대로 하는 일:
1. `data/monsters.json`, `data/drop-index.json`, `data/item-detail-by.json`, `scripts/sources/planet/divergence-overrides.json`을 읽음
2. **속성(ele) 보강** — `monster-attribute-data.js`가 있으면 mobCode로 매칭해 몬스터의 `ele` 필드를 채움 (영문 코드 `F/I/L/S/H` + `1/2/3` → 불/얼음/전기/독/성 + 면역/반감/약점으로 디코딩)
3. **신규 몬스터 추가** — `monster-catalog-data.js`가 있으면, 메랜 원본에 없는 mobCode만 골라 신규 몬스터로 추가 (이미 있는 mobCode는 건드리지 않음 — 스탯 차이가 있어도 검증 없이 덮어쓰지 않기 위함)
4. **출현 맵(map) 보강** — `map-catalog-data.js`가 있으면 몬스터별 최다 스폰 맵을 `map` 필드에 채움
5. `divergence-overrides.json`의 `rateMultipliers.dropRate`(기본 4배)를 `drop-index.json`/`item-detail-by.json`의 `prob` 필드에 곱해서 반영 (1.0 초과 시 100%로 clamp)
6. `monsterOverrides`(mobCode → 필드 오버라이드), `itemOverrides`(itemId → 필드 오버라이드), `newMonsters`(수기 추가 신규 몬스터)를 적용
7. `cube-data.js`가 있으면 정리해서 `cube-index.json`으로 저장
8. `data/planet/*.json`에 결과 저장. `release-filters.json`은 최초 1회만 복사 (`--force`로 강제 덮어쓰기 가능)

위 2~4번 단계는 해당 소스 파일이 없으면 조용히 건너뛴다 — 전부 선택적 보강이며 필수 아님.

### `divergence-overrides.json` — 손수 관리 설정 파일

자동 재생성되지 않음. 새로운 Planet-Mapleland 차이가 발견되면 직접 수정.

```jsonc
{
  "rateMultipliers": { "exp": 4, "dropRate": 4, "meso": 2 },
  "dropRateLevelException": { /* 95레벨 미만 + 킬러 레벨차 30↑ 시 보너스 미적용 — config 노브만, 미적용 */ },
  "mesoHalvedMonsterCodes": [],   // 버섯의성/커닝스퀘어/아리안트/마가티아/네오시티 특정 몬스터 메소 절반 예외 — TODO(아래 참고)
  "monsterOverrides": {},          // mobCode -> Monster 필드 일부 오버라이드 (기존 몬스터 수정)
  "itemOverrides": {},             // itemId -> item 필드 일부 오버라이드
  "newMonsters": []                // 메랜 원본에 아예 없는 Planet 전용 신규 몬스터 (mobCode는 실제 게임 ID여야 함)
}
```

**적용 범위 관련 결정 사항**:
- `dropRate` 배율만 정적 JSON(`drop-index.json`, `item-detail-by.json`)의 `prob` 필드에 직접 반영됨.
- `exp` 배율은 `monsters.json`의 `exp` 필드(몬스터 고유 스탯)에 굽지 않음 — 향후 EXP 계산기가 이 배율을 직접 곱해서 써야 함. 단, `monster-catalog-data.js`로 신규 추가된 몬스터의 `exp`는 소스 자체가 이미 Planet 4배 반영된 값으로 보임(자체 검증 완료, 자쿰/빨간달팽이 등으로 대조).
- `meso` 배율은 애초에 몬스터별 기본 메소 필드가 `data/*.json`에 존재하지 않아 config 값으로만 기록됨.
- `mesoHalvedMonsterCodes`는 현재 빈 배열: 언급된 몬스터명(시니컬한 주황버섯, 우는 파란버섯, 히죽대는 고스텀프,
  짜증내는 좀비버섯, 겁먹은 와일드보어)이 메이플랜드 `data/monsters.json`(689마리) 안에 정확히 일치하는 항목이
  없고, 버섯의 성/커닝 스퀘어/네오시티 지역 자체도 아직 데이터셋에 없음 — 파일 내 TODO 주석 참고.
- Cygnus Knights "여제의 축복" 스택 방식 등 세부 미확인 밸런스 차이가 더 있을 수 있음 — 발견되는 대로
  `monsterOverrides`/`itemOverrides`/`newMonsters`에 기록.
- `monster-catalog-data.js`와 매칭되지만 스탯이 다른 기존 몬스터(556종)는 자동 반영하지 않음 — 검증 없이 대량
  교체하면 오히려 부정확해질 수 있어, 개별 확인 후 `monsterOverrides`로 반영 권장.

### 검증 방법

`planet-helper.com`, `planetgo.kr`, `chowayo.com`, `mapleplanet.gg` 등 커뮤니티 사이트로 수치를
**스팟 체크(spot-check)만** 한다. 이 사이트들에서 데이터를 통째로 스크래핑하거나 복사하지 않음 —
어디까지나 배율/오버라이드가 맞는지 사람이 직접 대조하는 용도.
