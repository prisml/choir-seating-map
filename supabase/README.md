# Supabase 설정

이 폴더에는 Supabase 데이터베이스 스키마 마이그레이션 파일이 있습니다.

## 초기 설정

새 환경에서 프로젝트를 설정할 때:

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택 → **SQL Editor**
3. `migrations/001_initial_schema.sql` 파일 내용을 붙여넣고 실행

## 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `members` | 합창단 멤버 정보 |
| `sections` | 좌석 섹션 (A석, B석 등) |
| `section_rows` | 섹션별 행 및 좌석 수 |
| `seats` | 좌석 배정 정보 |

## RLS (Row Level Security)

모든 테이블에 RLS가 적용되어 있어서 사용자는 자신의 데이터만 접근할 수 있습니다.

## 환경 변수

`.env` 파일에 다음 값을 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabase Dashboard → **Settings** → **API**에서 확인할 수 있습니다.
