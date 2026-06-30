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
- 몬스터 선택 → 드롭 아이템 목록 조회
- `MonsterSelect` → `MonsterPanel` → `DropTable` + `EquipmentTable` 흐름
- 데이터: `data/drop-index.json` (3.8MB), `data/drops-parsed.json` (3.7MB)
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
- 컴포넌트: `TakenDamageCalculator.tsx`, `StatTable.tsx`, `SkillPanel.tsx`
- 프리셋 저장: `character_presets` DB 테이블 (calculator='taken-damage')

### 원킬 계산기 (One-Hit / One-Shot)
- 경로: `/calculator/onehit`, `/calculators/onehit`
- 로직: `src/lib/calculators/onehit.ts`
- 프리셋 저장: `character_presets` DB 테이블 (calculator='onehit')

### 파티 구인 (Party Finder)
- 경로: `/parties`, `/parties/new`, `/parties/[id]`
- 기능: 파티 글 작성 / 목록 / 상세 / 신청
- DB: `posts` (파티 글), `applications` (신청)
- 컴포넌트: `party-card.tsx`

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
- 경로: `/announcements`, `app/announcements/page.tsx`
- `AnnouncementBanner` 컴포넌트 — 모든 페이지 상단 표시
- DB: `announcements` 테이블

### 피드백
- 경로: `/feedback`
- 알림: `src/app/api/feedback/notify/route.ts`

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
│   ├── parties/
│   ├── quests/
│   ├── buff-timer/
│   ├── farming-manager/
│   ├── probability/
│   ├── admin/
│   ├── login/
│   └── feedback/
├── announcements/     ← 별도 그룹
└── api/               ← API Routes
```

### 컴포넌트 구조
- `sidebar-shell.tsx` — 전체 레이아웃 (사이드바 + 콘텐츠)
- `nav-bar.tsx` — 상단 네비게이션
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
| `/calculator/oneshot` | onehit 중복 추정 — 확인 필요 |
| `/party` | `/parties`와 역할 중복 추정 — 정리 필요 |
| `/services/*` | 각 기능 페이지로 redirect 추정 — 확인 필요 |
| `src/components/Panel.tsx` | `src/components/ui/Panel.tsx`와 중복 추정 |
