@AGENTS.md

## 작업 규칙

- 커밋/푸시는 명시적 요청 시에만
- 기술적 세부사항은 자율 결정, 근본적인 제품 방향 변경 시에만 질문
- 응답은 간결하게
- TypeScript 타입 오류, ESLint 오류는 즉시 수정

## 핵심 파일 위치

- 페이지: `src/app/(routes)/`
- 컴포넌트: `src/components/`
- 계산기 로직: `src/lib/calculators/`
- Supabase 클라이언트: `src/lib/supabase/`
- 타입: `src/types/`
- 정적 데이터 (대용량): `data/`
- 데이터 빌드 스크립트: `scripts/`
- DB 스키마: `supabase/schema.sql`
- DB 기록: `database.md`
- 개발 기록: `DEVLOG.md`
- 데이터 파이프라인: `data.md`
- TODO: `TODO.md`

## 스택 요약

- **프레임워크**: Next.js 16 (App Router)
- **런타임**: React 19, TypeScript 5
- **스타일**: Tailwind CSS v4
- **백엔드**: Supabase (PostgreSQL + Auth)
- **배포**: Cloudflare Pages (`maplelandhub.pages.dev`)
- **외부 이미지 API**: maplestory.io

## 데이터 주의사항

`data/` 폴더 JSON 파일들은 빌드 스크립트로 생성된 대용량 파일 — 절대 수동 편집 금지.
수정이 필요하면 해당 `scripts/*.mjs` 스크립트를 수정하고 재빌드.
자세한 내용은 `data.md` 참조.

## 병렬 에이전트 사용 기준

3개 이상 파일을 다른 Zone에서 수정해야 할 때 자동으로 병렬 에이전트 적용.
Zone 정의와 파일 소유권 규칙은 `AGENTS.md` 참조.
