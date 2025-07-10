# Railway 배포 가이드

## 1단계: GitHub 저장소 생성

### GitHub에 코드 업로드
1. GitHub에서 새 저장소 생성
2. 현재 프로젝트를 GitHub에 업로드:

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .
git commit -m "Initial commit"

# GitHub 저장소와 연결
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## 2단계: Railway 설정

### Railway 계정 생성 및 프로젝트 배포
1. [Railway.app](https://railway.app) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. "Deploy from GitHub repo" 선택
5. 방금 생성한 저장소 선택

## 3단계: 환경 변수 설정

Railway 대시보드에서 다음 환경 변수 추가:

```
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here
PORT=5000
```

## 4단계: 데이터베이스 설정

### PostgreSQL 추가
1. Railway 프로젝트에서 "Add Service" 클릭
2. "Database" → "PostgreSQL" 선택
3. 자동으로 DATABASE_URL 환경 변수가 생성됨

## 5단계: 배포 설정 파일 생성

프로젝트 루트에 다음 파일들을 생성: