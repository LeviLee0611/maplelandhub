# 메랜Hub — Agent Workflow Rules

## 프로젝트 개요
- **앱:** Next.js 16 + Supabase 기반 메이플랜드 유틸리티 허브
- **메인 작업 폴더:** `src/`
- **정적 데이터:** `data/` (빌드 스크립트 산출물 — 직접 편집 금지)
- **DB 백엔드:** `supabase/`

---

## 병렬 에이전트 워크플로우

### 언제 병렬 에이전트를 쓰나
| 상황 | 방식 |
|---|---|
| 파일 1~2개 수정 | Main 직접 처리 |
| 3개 이상 파일, 다른 Zone | 병렬 에이전트 |
| 크로스 피처 리팩토링 | Zone당 에이전트 1개 |
| 탐색/분석만 필요 | Explore 에이전트 |

### 에이전트 역할
| 타입 | 역할 |
|---|---|
| Plan | 설계, 인터페이스 계약 정의, 의존성 분석 |
| Explore | 파일 탐색, 심볼 검색, 영향 범위 파악 |
| general-purpose | 실제 코드 수정/구현 |

### 병렬 실행 순서
```
1. Plan 에이전트 → 설계 + 인터페이스 계약 확정
2. general-purpose 에이전트 N개 동시 발사 (Zone 기준 파일 소유권 분리)
3. Main → npx tsc --noEmit + eslint 결과 취합
```

---

## 파일 소유권 — Zone 지도

병렬 작업 시 에이전트마다 하나의 Zone만 담당. Zone 경계를 넘으면 안 됨.

```
Zone A │ 드롭테이블 & 몬스터
       │ src/app/(routes)/drop-table/
       │ src/components/DropTable.tsx
       │ src/components/MonsterPanel.tsx
       │ src/components/MonsterSelect.tsx
       │ src/data/mapledb/ (drops.js, monsters.js, maps.js, npcs.js)
       │ src/lib/data/monsters.ts
       │ src/types/monster.ts

Zone B │ 계산기
       │ src/app/(routes)/calculator/
       │ src/app/(routes)/calculators/
       │ src/components/TakenDamageCalculator.tsx
       │ src/components/EquipmentTable.tsx
       │ src/components/StatTable.tsx
       │ src/components/SkillPanel.tsx
       │ src/components/NumberField.tsx
       │ src/components/SpinnerInput.tsx
       │ src/lib/calculators/
       │ src/lib/calculators.ts
       │ src/types/takenDamage.ts

Zone C │ 퀘스트
       │ src/app/(routes)/quests/
       │ src/components/QuestBoard.tsx
       │ src/types/quest.ts
       │ (파티 구인 기능은 완전히 제거됨 — /party, /parties, party-card.tsx, party.ts 전부 삭제 완료.
       │  posts/applications DB 테이블만 레거시로 남아있음, database.md 참고)

Zone D │ 데이터 파이프라인 (빌드 스크립트)
       │ scripts/
       │ data/
       │ data.md

Zone E │ 어드민 & 인증 & 피드백
       │ src/app/(routes)/admin/
       │ src/app/(routes)/login/
       │ src/app/(routes)/feedback/
       │ src/app/api/
       │ src/components/admin-link.tsx
       │ src/components/auth-button.tsx
       │ src/lib/auth.ts

Zone F │ 백엔드 전용 (DB, Supabase)
       │ supabase/
       │ src/lib/supabase/
       │ src/types/database.ts
       │ database.md
```

---

## Main 전용 파일 (에이전트 절대 수정 금지)

```
src/app/layout.tsx
src/app/globals.css
src/components/sidebar-shell.tsx
next.config.ts
tsconfig.json
```

이 파일들은 여러 Zone이 참조하는 허브. 병렬 수정 시 충돌 확정. Main이 직접 처리.

---

## 인터페이스 계약 원칙

병렬 에이전트 발사 전, Plan 단계에서 반드시 확정:
1. 새 함수 시그니처 (파라미터, 반환 타입)
2. 새 타입/인터페이스 정의
3. DB 스키마 변경 내용
4. Zone 간 데이터 흐름

계약이 확정되지 않으면 병렬 에이전트 발사하지 않음.

---

## 검증 게이트

병렬 에이전트 완료 후 반드시:
```
npx tsc --noEmit    ← 0 errors 목표
npx eslint src/     ← 0 errors 목표
```
issues 있으면 Main이 직접 픽스 후 완료 처리.

---

## 데이터 파이프라인 규칙

- `data/*.json` 파일은 절대 직접 편집 금지 — 스크립트 산출물
- 데이터 수정 = 해당 `scripts/*.mjs` 수정 → 재빌드
- Zone D 에이전트만 `scripts/`, `data/` 접근 허용
- 자세한 빌드 명령어는 `data.md` 참조
