# MapleLand Hub MVP

Next.js(App Router) + TypeScript + Tailwind + Supabase(Auth/Postgres/RLS) 기반 초기 코드베이스입니다.

## 핵심 정책
- 계산기/몬스터 정보: 비로그인 100% 사용 가능
- 파티 목록/상세/검색: 비로그인 가능
- 파티 작성/신청/수락/거절/신고/즐겨찾기/알림: 로그인 필요
- OAuth 우선순위: Discord 우선, Google 옵션

## 라우팅
- `/` 홈
- `/calculators/onehit` n방컷 계산기
- `/calculators/taken-damage` 피격 데미지 계산기
- `/parties` 파티 목록/검색
- `/parties/new` 파티 글 작성(로그인 필요)
- `/parties/[id]` 파티 상세/신청/수락/거절
- `/login` 로그인
- `/auth/callback` OAuth callback

## 환경 변수
`.env.local` 파일 생성 후 아래 값 설정:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## Supabase 설정
1. Supabase Dashboard > SQL Editor에서 `supabase/schema.sql` 실행
2. Authentication > Providers에서 Discord/Google 활성화
3. Redirect URL 등록
- 로컬: `http://localhost:3000/auth/callback`
- Cloudflare Pages 임시 도메인: `https://<your-pages-domain>/auth/callback`
- 커스텀 도메인: `https://<your-domain>/auth/callback`

## Cloudflare Pages 배포
1. Cloudflare Pages에서 GitHub 저장소 연결
2. Build command: `npm run build`
3. Build output directory: `.next`
4. Environment Variables 등록
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL` (배포 도메인)

## 개발 순서 체크리스트
1. Next.js 라우팅/레이아웃/기본 페이지 구성
- [x] 공용 네비게이션
- [x] 계산기/파티/로그인 라우트
- [x] 몬스터 정적 JSON 데이터 구조
2. Cloudflare Pages 임시 도메인 빌드 성공
- [ ] Git 연동
- [ ] 첫 배포 성공
- [ ] 임시 도메인 확인
3. Supabase Auth 최소 연동
- [x] Discord/Google OAuth 버튼
- [x] callback session 교환
- [x] 로그인 시 profiles upsert
4. 계산기 MVP
- [x] n방컷 계산기
- [x] 피격 데미지 계산기
5. DB/RLS
- [x] profiles/posts/applications 테이블
- [x] 필수 RLS 정책
6. 파티 매칭 MVP
- [x] 목록/검색(공개)
- [x] 글 작성(로그인)
- [x] 상세/신청
- [x] 작성자 수락/거절
7. 운영 전환
- [ ] 커스텀 도메인 연결
- [ ] Supabase redirect URL 정리
- [ ] 스팸 방어(쿨다운/레이트리밋)

## 왜 이 순서가 효율적인가
- 배포 파이프라인 선확정: 코드가 늘어나기 전에 CI/CD와 환경변수 경로를 고정하면 이후 디버깅 비용이 크게 줄어듭니다.
- 인증 최소 연동 선행: 파티 기능의 대부분이 권한/세션 의존이므로 초기에 auth 경로를 검증하면 재작업을 줄입니다.
- 계산기 선구현: 비로그인 SEO 유입 기능을 먼저 공개해 사용자 유입을 확보하고, 병렬로 커뮤니티 기능을 고도화할 수 있습니다.
- DB/RLS 후 파티 구현: 권한을 DB 레벨에서 강제해 프론트 실수로 인한 권한 누수를 방지하고, 기능 확장 시 안정적으로 스케일할 수 있습니다.

## 스팸 방어(초기 제안)
- 게시글 bump/작성 쿨다운: 30~60초 제한
- 신청 중복 차단: `(post_id, applicant_id)` unique 적용(이미 반영)
- API 경유 전환 시 IP/유저 기반 rate limit 추가

## 실행
```bash
npm install
npm run dev
```
