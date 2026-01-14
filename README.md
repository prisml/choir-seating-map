# Choir Seating Map

합창단 좌석 배치도를 웹 기반으로 관리할 수 있는 시스템입니다.

## 프로젝트 개요

- **플랫폼**: React 19 기반 웹앱 (모바일 친화적)
- **기술 스택**: React, TypeScript, TailwindCSS, Supabase
- **배포**: Supabase Hosting

## 주요 기능

### Phase 1: 기본 기능
- [x] 프로젝트 초기 설정
- [ ] 좌석 배치도 생성 및 시각화 (그리드 기반)
- [ ] 좌석 클릭 → SATB 파트 선택 → 조 선택 → 멤버 배정
- [ ] 멤버 이름 표시

### Phase 2: 데이터 관리
- [ ] JSON 포맷으로 배치도 저장/로드
- [ ] 레이아웃 커스터마이징 (석, 열, 자리 수 설정)
- [ ] 멤버 관리 (SATB별, 조별)

### Phase 3: 멤버 인증
- [ ] Supabase 회원가입/로그인
- [ ] 멤버 정보 등록 및 관리

### Phase 4: 추가 기능
- [ ] PDF/이미지 출력
- [ ] 출석 체크 기능
- [ ] 멤버 검색 기능

## 데이터 구조

```json
{
  "sections": {
    "A": {
      "rows": {
        "1": 4,
        "2": 8,
        ...
      }
    }
  },
  "seats": {
    "A": {
      "1": {
        "Seat1": "user_id_1",
        ...
      }
    }
  },
  "members": {
    "user_id_1": {
      "name": "Kim",
      "part": "Soprano",
      "group": "1"
    }
  }
}
```

## 설치 및 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 프로젝트 구조

```
src/
├── components/     # React 컴포넌트
├── pages/          # 페이지 컴포넌트
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수
├── services/       # API, Supabase 서비스
├── App.tsx         # 메인 앱 컴포넌트
└── main.tsx        # 진입점
```

## 커밋 전략

각 기능별로 명확한 commit message를 사용하여 단계적으로 진행합니다.

- `feat: ` - 새로운 기능
- `fix: ` - 버그 수정
- `refactor: ` - 코드 리팩토링
- `chore: ` - 설정, 의존성 업데이트 등
