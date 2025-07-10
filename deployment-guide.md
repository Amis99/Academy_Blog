# 카페24 배포 가이드

## 현재 프로젝트 상황
- React (프론트엔드) + Express.js (백엔드) + PostgreSQL 구조
- 카페24는 Node.js를 직접 지원하지 않음

## 배포 옵션

### 옵션 1: 하이브리드 배포 (권장)
1. **백엔드**: Replit 또는 다른 Node.js 호스팅 (Vercel, Railway 등)에 배포
2. **프론트엔드**: 카페24에 정적 파일로 배포

#### 장점:
- 카페24의 저렴한 호스팅 활용 가능
- 데이터베이스와 API는 전문 서비스 이용
- 도메인은 카페24에서 관리

### 옵션 2: 완전 이전
카페24 대신 Node.js를 지원하는 호스팅으로 이전

#### 추천 호스팅:
- **Vercel**: 무료 티어, 자동 배포
- **Railway**: 데이터베이스 포함, 저렴
- **Replit**: 현재 사용 중, 간편
- **AWS/GCP**: 전문적, 확장 가능

## 구체적 배포 단계

### 1단계: 백엔드 배포 (Vercel 예시)
```bash
# 1. Vercel 계정 생성 및 CLI 설치
npm i -g vercel

# 2. 백엔드만 별도 폴더로 분리
mkdir backend-deploy
cp -r server/* backend-deploy/
cp package.json backend-deploy/
cp shared backend-deploy/

# 3. Vercel 배포
cd backend-deploy
vercel

# 4. 환경변수 설정
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
```

### 2단계: 프론트엔드 수정
```typescript
// client/src/lib/queryClient.ts 수정
const API_BASE_URL = 'https://your-backend.vercel.app';

export async function apiRequest(
  method: string,
  endpoint: string,
  body?: any
) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // ... 나머지 코드
}
```

### 3단계: 프론트엔드 빌드
```bash
# 1. 프론트엔드 빌드
cd client
npm run build

# 2. 빌드된 파일을 카페24에 업로드
# dist/ 폴더 내용을 public_html/에 업로드
```

### 4단계: 카페24 설정
1. 카페24 관리자 페이지 접속
2. 파일매니저에서 public_html 폴더로 이동
3. dist 폴더 내용 업로드
4. .htaccess 파일 생성 (SPA 라우팅 지원):

```apache
RewriteEngine On
RewriteBase /

# Handle Angular and Vue.js HTML5 mode
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 추천 방안

**가장 실용적인 방법:**
1. 백엔드는 **Railway** (월 5달러, PostgreSQL 포함)
2. 프론트엔드는 **카페24** (기존 도메인 유지)
3. 커스텀 도메인 연결

이 방법으로 월 5-10만원 정도로 안정적인 서비스 운영이 가능합니다.

## 대안 - 완전 이전

만약 카페24를 포기하고 완전히 이전한다면:
- **Vercel + PlanetScale**: 무료로 시작 가능
- **Railway**: 올인원 솔루션, 월 5달러
- **Replit**: 현재 상태 그대로 배포

## 다음 단계

어떤 방법을 선택하시겠습니까?
1. 하이브리드 배포 (백엔드 별도 + 카페24 프론트엔드)
2. 완전 이전 (추천 서비스로)
3. 구체적인 배포 단계별 진행

선택해주시면 해당 방법으로 배포 스크립트와 설정을 준비해드리겠습니다.