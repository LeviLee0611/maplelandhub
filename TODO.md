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
- [ ] `RESEND_API_KEY` + `ADMIN_EMAIL` Cloudflare Pages에 설정 확인 — 미설정 시 피드백 알림 조용히 생략됨 (서버 로그에 오류 기록)
- [ ] Resend 발신 도메인 인증 후 `from` 주소 `onboarding@resend.dev`에서 실제 도메인으로 변경
- [ ] Supabase 백업 주기 확인 및 문서화
- [ ] maplestory.io API 다운 시 fallback 이미지 처리
