# 메랜Hub TODO

---

## 즉시 확인 필요 (레거시 정리)

- [x] 파티 매칭 기능 완전 제거 — `/party`, `/parties` 라우트, 컴포넌트, 타입 모두 삭제
- [ ] `/calculator/oneshot` vs `/calculator/onehit` — 중복 확인 후 redirect 또는 제거
- [ ] `/services/*` 경로들 — 각 기능 페이지 redirect인지 확인 후 정리
- [ ] `src/components/Panel.tsx` vs `src/components/ui/Panel.tsx` — 중복 제거
- [ ] `src/components/nav-bar.tsx` — 사용처 없음 확인 후 삭제 검토

---

## 데이터 파이프라인

- [ ] `data/release-filters.json` 주기적 검토 — 신규 출시 몬스터 차단 해제
- [ ] 드롭 데이터 최신화 프로세스 문서화 (언제, 어디서 원본 소스 구하는지)
- [x] 대용량 JSON 클라이언트 번들 포함 여부 감사 — DropTable(~4.1MB), QuestBoard(~5.4MB) 서버 props로 이전 완료
- [ ] `src/data/mapledb/` 파일들 `data/*.json`과 동기화 상태 확인

---

## 기능 개선

### 우선순위 높음
- [ ] 퀘스트 추적기 — 비로그인 로컬스토리지 지원 (현재 로그인만)
- [ ] 드롭 테이블 — 아이템 검색 (아이템명으로 드롭하는 몬스터 역검색)

### 우선순위 중간
- [ ] 계산기 프리셋 — 공유 링크 기능
- [ ] 버프 타이머 — 알림 소리/브라우저 알림
- [ ] 어드민 — 피드백 상태 변경 UI 개선

### 우선순위 낮음
- [ ] 다크모드 지원
- [ ] 모바일 최적화 (사이드바 모바일 드로어)
- [ ] 검색 기능 (몬스터/아이템 전역 검색)

---

## 기술 부채

- [x] TypeScript 엄격 모드 (`strict: true`) — 이미 적용되어 있음, 에러 0개 확인
- [x] `maplelandhub/` 중첩 폴더 — `.gitignore`에 추가 완료
- [ ] `src/components/` 정리 — ui/ 폴더로 원자 이동, 피처 컴포넌트 분리
- [ ] API Route 에러 처리 표준화
- [ ] 계산기 로직 단위 테스트 확충 (`src/lib/calculators/takenDamage/__tests__/` 참조)
- [ ] Web Vitals 수집 데이터 활용 계획 수립

---

## 배포 / 인프라

- [ ] Cloudflare Pages 환경변수 관리 문서화 (NEXT_PUBLIC_APP_URL 등)
- [x] `RESEND_API_KEY` + `ADMIN_EMAIL` 로컬 테스트 완료 — Cloudflare Pages(운영)에도 등록 필요
- [ ] Resend 발신 도메인 인증 후 `from` 주소 `onboarding@resend.dev`에서 실제 도메인으로 변경
- [ ] Supabase 백업 주기 확인 및 문서화
- [ ] maplestory.io API 다운 시 fallback 이미지 처리
- [x] `supabase/migrations/20260707_add_server_to_character_presets.sql`을 운영 Supabase에 적용 완료 (2026-07-07)

---

## 디자인 리뉴얼 (내일)

- [ ] 사이드바뿐 아니라 **전체 레이아웃/디자인**을 다시 손보기 — 색깔 위주로 (지금은 메랜 레이아웃에 강조색만 바꾼 수준)

---

## 메이플 플래닛 후속 작업

- [ ] `data/planet/divergence-overrides.json`의 빨간 달팽이/핑크빈 EXP 수정 — 조아요 단일 출처만 확인, 2차 교차검증 필요
- [ ] 카탈로그 매칭된 556종 몬스터의 스탯 차이(HP/EXP 등) 개별 검토 — 현재 미반영 상태로 보류 중
- [ ] `data/planet/release-filters.json` 수동 검토 — 메랜 걸 그대로 복사한 상태, 플래닛 실제 미출시 기준과 다를 수 있음
- [ ] 시그너스 "여제의 축복" 스택 방식 등 플래닛 고유 밸런스 차이 확인 (`divergence-overrides.json` TODO 참고)
- [ ] 핑크빈 서브페이즈(무적 페이즈/소환 몹) mobCode 확보 후 `newMonsters`에 추가
- [ ] 큐브 시뮬레이터/데이터 병합 스크립트(`scripts/build-planet-data.mjs`) 유닛 테스트 없음
