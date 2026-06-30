# 메랜Hub — 데이터 파이프라인

> 마지막 업데이트: 2026-06-30

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

---

## 스크립트 파일 목록

| 스크립트 | 역할 |
|---|---|
| `scripts/build-drops-parsed-from-dropchance-html.mjs` | 원본 HTML → drops-parsed.json |
| `scripts/build-merged-drops-parsed.mjs` | 드롭 데이터 병합 |
| `scripts/build-drop-index.mjs` | 몬스터 기준 드롭 인덱스 생성 |
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
- drop-index.json (3.8MB), drops-parsed.json (3.7MB)은 서버 컴포넌트에서만 import
- 클라이언트 컴포넌트에서 대용량 JSON 직접 import 금지
- 필요 시 API Route를 통해 서버 사이드에서 필터링 후 전달
