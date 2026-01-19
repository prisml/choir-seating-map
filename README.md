# Choir Seating Map

합창단 좌석 배치도를 웹 기반으로 관리하는 프로젝트입니다. 이 저장소는 React 19 + TypeScript 기반으로, 좌석 배치 시각화, 멤버 배정, 레이아웃 커스터마이징 및 데이터 저장/로드 기능을 제공합니다.

## 프로젝트 개요

- **플랫폼**: React 19 + TypeScript, Vite
- **스타일**: TailwindCSS
- **데이터베이스 / 인증**: Supabase 연동 예정
- **배포**: Supabase Hosting 또는 정적 호스팅

## 현재 진행 상황

- **Phase 1 (완료)**: 프로젝트 초기 설정, 좌석 시각화, 좌석 클릭 → 파트/조/멤버 배정 기본 워크플로우 ✅
- **Phase 2 (진행 중)**:
  - JSON 저장/로드: 구현 완료 (localStorage, JSON 다운로드/업로드, CSV 내보내기) ✅
  - 레이아웃 커스터마이징: 구현 완료 (레이아웃 에디터 모달) ✅
  - 멤버 관리: 기본 CRUD 및 검색 UI 구현 중 (MemberManager 컴포넌트) ▶️
- **Phase 3 (예정)**: Supabase 인증 및 멤버 동기화 (다음 우선순위)
- **Phase 4 (확장)**: PDF/이미지 출력, 출석 체크, 고급 검색 기능 (우선순위 하위)

## 주요 기능 요약

- 좌석 배치도 시각화 (그리드 기반)
- 좌석 클릭 → SATB 파트 선택 → 조 선택 → 멤버 배정 흐름
- 레이아웃 커스터마이징 (석 추가/삭제, 행/열 조절) with live preview
- 데이터 저장/로드: localStorage, JSON 파일(다운로드/업로드), CSV 내보내기
- 멤버 관리: 검색, 추가, 수정, 삭제, 파트/조 필터링

## 데이터 구조 예시

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

1. 의존성 설치

```bash
npm install
```

2. 개발 서버 실행

```bash
npm run dev
```

3. 타입 검사 (빌드 전 권장)

```bash
npx tsc --noEmit
```

4. 빌드

```bash
npm run build
```

## 개발 팁

- 개발 중 변경 후 타입 검사 에러가 발생하면 `npx tsc --noEmit`로 원인 확인하세요.
- Vite 캐시 문제 발생 시 `node_modules/.vite` 폴더를 삭제하고 서버를 재시작하세요.

## 프로젝트 구조

```
src/
├── components/     # React 컴포넌트 (SeatingGrid, MemberSelector, DataManager, LayoutEditor, MemberManager 등)
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수 (storage 등)
├── services/       # API, Supabase 서비스 (미구현)
├── App.tsx         # 메인 앱 컴포넌트
└── main.tsx        # 진입점
```

## 커밋 전략

- **커밋 타입**: `feat`, `fix`, `refactor`, `chore`, `docs`, `test` 등을 사용
- **메시지 규칙**: 브랜치/기능 단위로 작게 커밋하고 의미있는 메시지를 작성하세요.

## TODO (우선순위)

- 멤버 관리 고도화: 상세 검증, 그룹 관리, 대량 임포트/익스포트
- Supabase 연동: 인증, 멤버 동기화, 서버 저장소 연동
- 인쇄/내보내기: PDF/이미지 출력 기능

