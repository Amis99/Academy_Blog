# 학원광장 (Academy Square)

한국 학원 홍보 및 관리 플랫폼 - 학원 정보, 게시글, 관리자 기능을 통합한 종합 커뮤니티 서비스

## 🚀 주요 기능

### 사용자 기능
- **게시글 작성**: 학원 홍보 글 작성 (최대 20장 이미지 업로드)
- **필터링**: 지역, 과목, 대상학년별 게시글 필터링
- **익명 댓글**: 로그인 없이 이름+비밀번호로 댓글 작성
- **좋아요 시스템**: IP 기반 좋아요 기능
- **카카오톡 미리보기**: Open Graph 메타 태그 지원

### 관리자 기능
- **사용자 관리**: 가입 승인, 강퇴, 강퇴 해제
- **게시글 관리**: 모든 게시글 삭제 권한
- **통계 대시보드**: 사용자 현황 및 게시글 통계

### 인증 시스템
- **사용자 등록**: 관리자 승인 후 이용 가능
- **세션 기반 인증**: PostgreSQL 세션 저장
- **역할 기반 접근**: 관리자/일반사용자 권한 분리

## 🛠️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (개발 서버 & 빌드 도구)
- **Tailwind CSS** + **shadcn/ui**
- **TanStack Query** (서버 상태 관리)
- **Wouter** (라우팅)
- **React Hook Form** + **Zod** (폼 처리)

### Backend
- **Node.js** + **Express.js**
- **TypeScript**
- **PostgreSQL** + **Drizzle ORM**
- **Passport.js** (인증)
- **Multer** (파일 업로드)
- **Neon Database** (서버리스 PostgreSQL)

### DevOps
- **Replit** (개발 환경)
- **Vite** (프론트엔드 빌드)
- **tsx** (TypeScript 실행)

## 📁 프로젝트 구조

```
├── client/          # React 프론트엔드
│   ├── src/
│   │   ├── components/  # UI 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── hooks/       # 커스텀 훅
│   │   └── lib/         # 유틸리티
├── server/          # Express 백엔드
│   ├── auth.ts      # 인증 로직
│   ├── routes.ts    # API 라우트
│   ├── storage.ts   # 데이터베이스 로직
│   └── file-persistence.ts  # 파일 관리
├── shared/          # 공유 타입 및 스키마
│   └── schema.ts    # Drizzle 스키마
├── uploads/         # 업로드된 이미지
└── README.md
```

## 🔧 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-secret-key
NODE_ENV=development
```

### 3. 데이터베이스 설정
```bash
npm run db:push
```

### 4. 개발 서버 실행
```bash
npm run dev
```

서버가 http://localhost:5000에서 실행됩니다.

## 🔐 기본 관리자 계정

- **사용자명**: admin
- **비밀번호**: admin123!

## 📊 데이터베이스 스키마

### Users (사용자)
- id, username, password, phone
- status (pending/approved/banned)
- isAdmin, createdAt

### Posts (게시글)
- id, title, content, region, subject, targetGrade
- imageUrls (배열), authorId, likesCount, createdAt

### Comments (댓글)
- id, content, postId, authorName, authorPassword, createdAt

### Likes (좋아요)
- id, postId, userIp, createdAt

## 🎯 주요 API 엔드포인트

### 인증
- `POST /api/register` - 사용자 등록
- `POST /api/login` - 로그인
- `POST /api/logout` - 로그아웃
- `GET /api/user` - 현재 사용자 정보

### 게시글
- `GET /api/posts` - 게시글 목록 (필터링 지원)
- `POST /api/posts` - 게시글 작성
- `PUT /api/posts/:id` - 게시글 수정
- `DELETE /api/posts/:id` - 게시글 삭제

### 댓글
- `GET /api/posts/:id/comments` - 댓글 목록
- `POST /api/posts/:id/comments` - 댓글 작성
- `DELETE /api/comments/:id` - 댓글 삭제

### 관리자
- `GET /api/admin/pending-users` - 승인 대기 사용자
- `POST /api/admin/approve-user/:id` - 사용자 승인/거부
- `POST /api/admin/ban-user/:id` - 사용자 강퇴
- `DELETE /api/admin/posts/:id` - 게시글 삭제

## 🔒 보안 기능

- **비밀번호 해싱**: scrypt 알고리즘 사용
- **세션 관리**: PostgreSQL 세션 저장소
- **파일 업로드 검증**: 파일 타입 및 크기 제한
- **CSRF 보호**: 세션 기반 인증
- **SQL 인젝션 방지**: Drizzle ORM 사용

## 📱 반응형 디자인

- **모바일 최적화**: Tailwind CSS 반응형 클래스 사용
- **다크 모드**: 시스템 설정 따라 자동 전환
- **접근성**: ARIA 레이블 및 키보드 네비게이션

## 🚀 배포

### Replit 배포
1. Replit에서 Deploy 버튼 클릭
2. 환경 변수 설정
3. 자동 배포 완료

### 다른 플랫폼 배포
1. 프로덕션 빌드: `npm run build`
2. 환경 변수 설정
3. PostgreSQL 데이터베이스 연결
4. 정적 파일 서빙 설정

## 🤝 개발 가이드

### 코드 스타일
- **TypeScript**: 타입 안정성 보장
- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅

### 커밋 메시지
- feat: 새로운 기능 추가
- fix: 버그 수정
- docs: 문서 수정
- style: 코드 포맷팅
- refactor: 코드 리팩토링

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🔗 관련 링크

- [React 문서](https://react.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/)
- [Drizzle ORM 문서](https://orm.drizzle.team/)
- [Tailwind CSS 문서](https://tailwindcss.com/)

---

**개발자**: Replit AI Agent
**최종 업데이트**: 2025년 7월 11일