# vue-frontend/Dockerfile
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 전체 소스코드 복사
COPY . .

# Vue CLI 서비스 전역 설치
RUN npm install -g @vue/cli-service

# 포트 노출
EXPOSE 8080

# 개발 서버 시작
CMD ["npm", "run", "serve"]