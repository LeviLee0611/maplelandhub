# 메랜Hub — 데이터베이스 구조

> 마지막 업데이트: 2026-07-07

---

## 테이블 관계도

```
auth.users
    │
    └─→ profiles (1:1)
    │
    ├─→ posts (1:N) — 파티 구인 글
    │     └─→ applications (1:N) — 파티 신청
    │
    ├─→ feedback_requests (1:N) — 피드백/버그 신고
    │
    ├─→ character_presets (1:N) — 계산기 프리셋 저장
    │
    └─→ quest_trackers (1:N) — 퀘스트 진행 추적

admin_users (별도 — auth.users.id 참조)
announcements (독립 테이블 — 어드민이 작성)
```

---

## 테이블 목록

### profiles
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | auth.users.id와 동일 |
| nickname | TEXT | 인게임 닉네임 |
| server | TEXT | 서버명 |
| job | TEXT | 직업 |
| level | INT | 레벨 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | set_updated_at 트리거 자동 갱신 |

- **RLS**: 본인만 조회/수정 / 어드민은 전체 조회
- Google OAuth 가입 시 수동 생성 필요 (자동 트리거 없음)

---

### posts (파티 구인)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| author_id | UUID FK→auth.users | ON DELETE CASCADE |
| server | TEXT | 서버명 |
| purpose | TEXT | 목적 (파밍/레벨업 등) |
| hunt_area | TEXT | 사냥 지역 |
| level_min | INT | 최소 레벨 |
| level_max | INT | 최대 레벨 |
| slots_total | INT | 총 모집 인원 (>1 체크) |
| slots_filled | INT DEFAULT 1 | 현재 참여 인원 (>=1 체크) |
| status | TEXT DEFAULT 'open' | 'open' \| 'closed' |
| bump_at | TIMESTAMPTZ | 끌어올리기 시각 (정렬 기준) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

- **RLS**: 전체 조회 / 본인만 작성·수정·삭제
- **인덱스**: `idx_posts_bump_at DESC`, `idx_posts_server`, `idx_posts_status`

---

### applications (파티 신청)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| post_id | UUID FK→posts | ON DELETE CASCADE |
| applicant_id | UUID FK→auth.users | ON DELETE CASCADE |
| message | TEXT DEFAULT '' | 신청 메시지 |
| status | TEXT DEFAULT 'pending' | 'pending' \| 'accepted' \| 'rejected' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

- **UNIQUE**: (post_id, applicant_id) — 중복 신청 방지
- **RLS**: 신청자 또는 글 작성자만 조회 / 신청자만 생성 / 글 작성자만 수락·거절

---

### feedback_requests
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→auth.users (nullable) | 비로그인 허용 |
| type | TEXT | 'bug' \| 'feature' \| 'other' |
| title | TEXT | 제목 |
| message | TEXT | 내용 |
| contact | TEXT (nullable) | 연락처 |
| is_public | BOOLEAN DEFAULT false | 공개 여부 |
| status | TEXT DEFAULT 'new' | 'new' \| 'in_progress' \| 'done' |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### admin_users
| 컬럼 | 타입 | 설명 |
|---|---|---|
| user_id | UUID PK | auth.users.id |
| created_at | TIMESTAMPTZ | |

- `is_admin()` 함수로 권한 체크

---

### announcements
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| title | TEXT | 제목 |
| body | TEXT | 내용 |
| category | TEXT | 'notice' \| 'update' |
| is_pinned | BOOLEAN DEFAULT false | 상단 고정 |
| published_at | TIMESTAMPTZ DEFAULT now() | 공개 시각 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

### character_presets (계산기 프리셋)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→auth.users | ON DELETE CASCADE |
| calculator | TEXT | 'onehit' \| 'taken-damage' |
| server | TEXT DEFAULT 'mapleland' | 'mapleland' \| 'planet' |
| name | TEXT | 프리셋 이름 |
| data | JSONB | 계산기 입력값 전체 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

- **UNIQUE**: (user_id, calculator, server, name)
- **인덱스**: `idx_character_presets_user_calc_server` (user_id, calculator, server)

---

### quest_trackers (퀘스트 추적)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK→auth.users | ON DELETE CASCADE |
| quest_id | INT | 퀘스트 ID (data/quests.json 기준) |
| is_completed | BOOLEAN DEFAULT false | 완료 여부 |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## 트리거

| 트리거 | 테이블 | 시점 | 동작 |
|---|---|---|---|
| set_profiles_updated_at | profiles | BEFORE UPDATE | updated_at 자동 갱신 |
| set_posts_updated_at | posts | BEFORE UPDATE | updated_at 자동 갱신 |
| set_applications_updated_at | applications | BEFORE UPDATE | updated_at 자동 갱신 |

---

## RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | 본인 / 어드민 | 본인 | 본인 | — |
| posts | 전체 (public) | 본인 | 본인 | 본인 |
| applications | 신청자 or 글 작성자 | 본인 | 글 작성자 | 신청자 or 글 작성자 |
| announcements | 전체 | 어드민 | 어드민 | 어드민 |
| feedback_requests | 어드민 | 누구나 | 어드민 | 어드민 |
| character_presets | 본인 | 본인 | 본인 | 본인 |
| quest_trackers | 본인 | 본인 | 본인 | 본인 |

---

## 마이그레이션 이력

| 파일 | 내용 |
|---|---|
| `schema.sql` | 초기 스키마 (profiles, posts, applications, 기본 인덱스/RLS) |
| `20260224_add_character_presets.sql` | character_presets 테이블 추가 |
| `20260224_add_feedback_requests.sql` | feedback_requests 테이블 추가 |
| `20260225_add_announcements.sql` | announcements 테이블 추가 |
| `20260225_add_profiles_admin_policy.sql` | 어드민의 profiles 전체 조회 정책 추가 |
| `20260301_add_quest_trackers.sql` | quest_trackers 테이블 추가 |
| `20260707_add_server_to_character_presets.sql` | character_presets에 server 컬럼 추가 (mapleland/planet), unique 제약·인덱스 갱신 |
