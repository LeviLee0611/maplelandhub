# 메랜Hub — 프로젝트 노트

> 날짜별 일지는 `DEVLOG.md` / 이 파일은 **현재 상태 기준 기능·구조 정리**

---

## 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 런타임 | React 19, TypeScript 5 |
| 스타일 | Tailwind CSS v4 |
| 백엔드 | Supabase (PostgreSQL + Auth) |
| 배포 | Cloudflare Pages |
| 외부 API | maplestory.io (이미지) |
| 폰트 | Space Grotesk (영문), Noto Sans KR (한글) |

---

## 기능 현황

### 드롭 테이블 (Drop Table)
- 경로: `/drop-table`
- 몬스터↔아이템 양방향 검색(초성 지원 자동완성) → 드롭/역드롭 목록 조회
- 검색·필터·자동완성 로직 전부 `DropTable.tsx` 내부에 있음(자체 인라인 검색 — `MonsterSelect`/`MonsterPanel`/`EquipmentTable`은 쓰지 않음, 이 셋은 계산기 쪽 컴포넌트)
- 페이지가 실제로 로드하는 데이터는 `data/drop-index.json` (3.8MB, 서버에서 슬림화 후 전달)뿐 — `data/drops-parsed.json`은 빌드 파이프라인 중간 산출물이라 런타임에 쓰이지 않음(`data.md` 참고)
- 몬스터/아이템 선택 시 드롭 상세는 `/api/drop-table/{monster,item}/{mapleland,planet}`에서 온디맨드 fetch(초기 payload에 포함 안 됨)
- 서버 미출시 몬스터 필터링: `src/lib/release-filter.ts`
- 아이템 이미지: maplestory.io API

### 데미지 계산기 (Taken Damage)
- 경로: `/calculator/damage` (구 `/calculators/taken-damage` → redirect)
- 받는 데미지 계산 (물리/마법 분리)
- 로직: `src/lib/calculators/takenDamage/`
  - `index.ts` — 통합 진입점
  - `physical.ts` — 물리 방어 계산
  - `magical.ts` — 마법 방어 계산
  - `standardPdd.ts` — 표준 물리 방어력
- 컴포넌트: `TakenDamageCalculator.tsx`(버튼 없이 입력 즉시 재계산, `MonsterPanel`/`NumberField` 재사용) — `StatTable.tsx`/`SkillPanel.tsx`는 안 씀(원킬 계산기 전용 컴포넌트)
- 프리셋 저장: `character_presets` DB 테이블 (calculator='taken-damage')

### 원킬 계산기 (One-Hit / One-Shot)
- 경로: `/calculator/onehit`, `/calculators/onehit`
- 로직: `src/lib/calculators/onehit.ts`
- 프리셋 저장: `character_presets` DB 테이블 (calculator='onehit', server='mapleland'|'planet')
- UI 본체는 `src/app/(routes)/calculators/onehit/onehit-calculator-client.tsx`(`OneHitCalculatorClient`)로 분리 — 메랜/플래닛 페이지가 이 클라이언트 컴포넌트를 공유하고 `monsters`/`server` prop만 다르게 주입

> 파티 구인 기능은 제거됨 (2026-07 이전, `27913d9` 커밋 참고).

### 퀘스트 추적기 (Quest Tracker)
- 경로: `/quests`
- 데이터: `data/quests.json` (717KB, ~31,202줄)
- 완료 여부: `quest_trackers` DB 테이블 (로그인 유저)
- 컴포넌트: `QuestBoard.tsx`

### 버프 타이머 (Buff Timer)
- 경로: `/buff-timer`
- 버프 지속시간 트래킹 (클라이언트 사이드)

### 파밍 관리 (Farming Manager)
- 경로: `/farming-manager`

### 확률 계산기 (Probability)
- 경로: `/probability`, `/probability-secret`

### 어드민 패널
- 경로: `/admin`, `/admin/users`, `/admin/announcements`, `/admin/feedback`
- 권한: `admin_users` 테이블 + `is_admin()` 함수로 체크
- API Route: `src/app/api/admin/users/route.ts`

### 공지사항 (Announcements)
- 경로: `/announcements`, `src/app/announcements/page.tsx`
- `AnnouncementBanner` 컴포넌트 — 모든 페이지 상단 표시
- DB: `announcements` 테이블

### 피드백
- 경로: `/feedback`
- 알림: `src/app/api/feedback/notify/route.ts` (Resend API, `RESEND_API_KEY`/`ADMIN_EMAIL` 미설정 시 조용히 스킵)

### 메이플 플래닛 (Planet) — 두 번째 서버 지원
- 메랜과 동일 URL 구조를 `/planet` 이하에 미러링: `/planet`(랜딩), `/planet/drop-table`, `/planet/calculator/damage`, `/planet/calculators/onehit`
- **큐브 시뮬레이터** (`/planet/cube-simulator`) — 플래닛 전용 신규 기능(메랜엔 큐브/잠재능력 시스템 없음). 로직: `src/lib/calculators/cubeSimulator.ts`, 데이터: `data/planet/cube-index.json`
- **큐브 빌더** (`/planet/cube-builder`) — 캐릭터 스탯/현재 잠재 기준으로 장비 슬롯별 큐브 효율을 비교. 로직: `src/lib/calculators/cubeBuilder.ts`, UI: `src/components/CubeBuilder.tsx`. **노출 중단 상태(2026-07-16)**: 라우트/코드는 유지하되 사이드바·플래닛 랜딩·sitemap.xml에서 제거하고 `robots: {index:false, follow:false}`로 noindex 처리한 보류 기능 — URL을 직접 아는 사람만 접근 가능. 재노출 조건은 TODO.md "메이플 플래닛 데이터 정확도" 절 참고.
- 컴포넌트는 메랜과 공유하고 `monsters`/`server`/`calculatorBasePath`/`itemLinkBase` prop으로 서버 구분 (`setMonsterProvider` 전역 싱글턴은 동시 요청에 안전하지 않아 미사용)
- 서버별 테마: `[data-server="planet"]` CSS 선택자로 cyan↔amber 강조색 전환 (`--brand-accent` 등, `globals.css`)
- 데이터 파이프라인 상세: `data.md`의 "메이플 플래닛 데이터 파이프라인" 절 참고 — 소스 파일은 `scripts/sources/planet/`, 산출물은 `data/planet/`

---

## 아키텍처

### 라우팅 구조
```
src/app/
├── (routes)/          ← 메인 라우트 그룹
│   ├── drop-table/
│   ├── calculator/
│   │   ├── damage/
│   │   └── onehit/
│   ├── quests/
│   ├── buff-timer/
│   ├── farming-manager/
│   ├── probability/
│   ├── admin/
│   ├── login/
│   ├── feedback/
│   └── planet/        ← 메이플 플래닛 미러링 라우트
│       ├── drop-table/
│       ├── calculator/damage/
│       ├── calculators/onehit/
│       ├── cube-simulator/
│       └── cube-builder/
├── announcements/     ← 별도 그룹
└── api/               ← API Routes
```

### 컴포넌트 구조
- `sidebar-shell.tsx` — 전체 레이아웃(사이드바 + 콘텐츠). 별도 상단 네비게이션 컴포넌트는 없음 — `nav-bar.tsx`는 실제로 존재하지 않는 파일이라 아래 표에서 제거함(TODO.md에도 잘못 남아있던 항목)
- `ui/` — 재사용 UI 원자 (Panel, Cells, TableGrid, PanelHeader)
- 피처 컴포넌트 — 특정 기능 전용 (DropTable, QuestBoard 등)

### 인증
- Supabase Auth (Google OAuth)
- `src/lib/auth.ts` — 서버 사이드 auth 유틸
- `src/lib/supabase/client.ts` — 클라이언트 Supabase 인스턴스
- `src/lib/supabase/server.ts` — 서버 Supabase 인스턴스

### 성능
- Web Vitals 수집: `WebVitalsReporter` + `/api/vitals` 엔드포인트
- 대용량 JSON은 서버 컴포넌트에서만 import
- maplestory.io 이미지: next/image + remotePatterns 허용

---

## 알려진 중복/레거시

| 경로 | 상태 |
|---|---|
| `/calculators/taken-damage` | redirect → `/calculator/damage` |
| `/calculator/oneshot`, `/calculator/onehit` | `/calculators/onehit`로 정상 redirect, 중복 콘텐츠 문제 없음 확인(2026-07-09 SEO 점검) |
| `/services/*` | redirect 아님 — 각 계산기/기능 페이지와 다른 고유 설명 콘텐츠 + 자체 canonical, 문제 없음 확인(2026-07-09 SEO 점검) |
| `src/components/Panel.tsx` | `src/components/ui/Panel.tsx`와 중복(둘 다 실존, 미해결) — TODO.md 참고 |
