# Choir Seating Map

합창단 좌석 배치도를 웹 기반으로 관리하는 프로젝트입니다. React 19 + TypeScript 기반으로, 좌석 배치 시각화, 멤버 배정, 레이아웃 커스터마이징 및 데이터 저장/로드 기능을 제공합니다.

## 프로젝트 개요

| 항목 | 기술 스택 |
|------|----------|
| **플랫폼** | React 19 + TypeScript, Vite 5 |
| **스타일** | TailwindCSS 3 |
| **데이터베이스** | Supabase (클라이언트 설정 완료) |
| **패키지 매니저** | pnpm |

## 현재 진행 상황

| Phase | 상태 | 내용 |
|-------|------|------|
| **Phase 1** | ✅ 완료 | 프로젝트 초기 설정, 좌석 시각화, 좌석 클릭 → 파트/조/멤버 배정 기본 워크플로우 |
| **Phase 2** | ✅ 완료 | JSON 저장/로드, 레이아웃 커스터마이징, 멤버 관리 CRUD |
| **Phase 3** | ✅ 완료 | Supabase 인증 (로그인/회원가입), 클라우드 데이터 동기화, 멤버 배정 UX 개선 |
| **Phase 4** | 📋 백로그 | PDF/이미지 출력, 출석 체크, 고급 검색 기능 |

## 주요 기능

### 🎵 좌석 배치도
- 섹션별 그리드 기반 좌석 시각화 (A석, B석 등)
- 좌석 클릭 → SATB 파트 선택 → 멤버 배정 워크플로우
- 멤버 선택 시 미리보기 → 확인/취소 플로우
- 좌석 비우기 기능
- 배정된 멤버 정보 실시간 표시

### 🎹 레이아웃 에디터
- 섹션 추가/삭제
- 행 추가/삭제
- 행별 좌석 수 조절 (1~20석)
- 총 좌석 수 실시간 표시

### 👥 멤버 관리
- 멤버 추가/수정/삭제 (CRUD)
- 이름 검색 및 파트별 필터링
- 파트별 멤버 통계 (Soprano, Alto, Tenor, Bass)

### 📊 데이터 관리
- ☁️ 클라우드 저장/로드 (Supabase)
- localStorage 자동 저장/로드
- JSON 파일 다운로드/업로드
- CSV 형식 내보내기

### 🔐 인증
- Supabase 기반 로그인/회원가입
- 보호된 라우트 (로그인 필수)
- 자동 세션 유지

## 데이터 구조

```typescript
interface SeatingMap {
  sections: Record<string, Section>;  // 섹션별 행/좌석 구조
  seats: Record<string, Record<number, Record<string, string>>>;  // 좌석 배정 정보
  members: Record<string, Member>;  // 멤버 정보
}

interface Member {
  id: string;
  name: string;
  part: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  group: string;
}
```

**JSON 예시:**
```json
{
  "sections": {
    "A": { "rows": { "1": 4, "2": 8 } },
    "B": { "rows": { "1": 6, "2": 6 } }
  },
  "seats": {
    "A": { "1": { "Seat1": "m1" } }
  },
  "members": {
    "m1": { "id": "m1", "name": "Kim", "part": "Soprano", "group": "1" }
  }
}
```

## 설치 및 개발

### 사전 요구사항
- Node.js 18+
- pnpm (권장) 또는 npm

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 타입 검사
pnpm exec tsc --noEmit

# 프로덕션 빌드
pnpm build

# 빌드 미리보기
pnpm preview
```

### 환경 변수 (Supabase 연동 시)

`.env` 파일 생성:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 개발 팁

- Vite 캐시 문제 발생 시 `node_modules/.vite` 폴더를 삭제하고 서버를 재시작하세요.
- 타입 에러 확인: `pnpm exec tsc --noEmit`

## 프로젝트 구조

```
src/
├── components/
│   ├── SeatingGrid.tsx      # 좌석 배치도 그리드 컴포넌트
│   ├── MemberSelector.tsx   # 멤버 선택/배정 (미리보기/확인/취소)
│   ├── DataManager.tsx      # 데이터 저장/로드 관리 (클라우드/로컬/JSON/CSV)
│   ├── LayoutEditor.tsx     # 레이아웃 편집 모달
│   ├── MemberManager.tsx    # 멤버 CRUD 관리
│   └── ProtectedRoute.tsx   # 인증 보호 라우트
├── hooks/
│   └── useAuth.ts           # Supabase 인증 훅
├── pages/
│   ├── HomePage.tsx         # 메인 대시보드 페이지
│   └── LoginPage.tsx        # 로그인/회원가입 페이지
├── services/
│   └── seatingService.ts    # Supabase 클라우드 동기화 서비스
├── types/
│   ├── index.ts             # 앱 타입 정의 (SeatingMap, Member 등)
│   └── database.ts          # Supabase 데이터베이스 타입
├── utils/
│   └── storage.ts           # 저장소 유틸리티 (localStorage, JSON, CSV)
├── lib/
│   └── supabase.ts          # Supabase 클라이언트 설정
├── App.tsx                  # 라우팅 설정
├── main.tsx                 # 진입점
├── vite-env.d.ts            # Vite 환경변수 타입
└── index.css                # 글로벌 스타일 (TailwindCSS)
```

## 커밋 컨벤션

- **타입**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- **예시**: `feat: 멤버 검색 기능 추가`, `fix: 좌석 배정 버그 수정`

## TODO

### � 백로그 (Phase 4)
- [ ] PDF/이미지 출력 기능
- [ ] 출석 체크 기능
- [ ] 멤버 대량 임포트/익스포트 (CSV)
- [ ] 고급 검색 및 필터링
- [ ] 드래그 앤 드롭 좌석 배정
- [ ] 멀티 유저 지원

## 라이선스

MIT

