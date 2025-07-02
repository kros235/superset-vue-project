# docker/superset/Dockerfile
FROM apache/superset:latest

# root 권한으로 전환
USER root

# MySQL 클라이언트 및 개발 도구 설치
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# superset 사용자로 전환
USER superset

# MySQL 드라이버 설치
RUN pip install \
    mysqlclient==2.1.1 \
    PyMySQL==1.0.2

# 작업 디렉토리 설정
WORKDIR /app

# 기본 포트 노출
EXPOSE 8088
