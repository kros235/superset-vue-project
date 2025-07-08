#!/bin/bash
# superset-init.sh

set -e

echo "=== Superset 초기화 스크립트 시작 ==="

# 환경 변수 확인
echo "환경 변수 확인:"
echo "SQLALCHEMY_DATABASE_URI: $SQLALCHEMY_DATABASE_URI"
echo "REDIS_HOST: $REDIS_HOST"
echo "REDIS_PORT: $REDIS_PORT"

# Python 모듈 확인
echo "=== Python 모듈 확인 ==="
python -c "import pymysql; print('✓ PyMySQL 사용 가능')" || (echo "✗ PyMySQL 설치 필요" && exit 1)
python -c "import redis; print('✓ Redis 사용 가능')" || (echo "✗ Redis 설치 필요" && exit 1)

# 데이터베이스 연결 대기
echo "=== 데이터베이스 연결 대기 ==="
DB_HOST="mariadb"
DB_USER="superset"
DB_PASS="superset123"
DB_NAME="sample_dashboard"

max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo "데이터베이스 연결 시도 $attempt/$max_attempts"
    
    if mysqladmin ping -h $DB_HOST -u $DB_USER -p$DB_PASS --silent; then
        echo "✓ 데이터베이스 연결 성공!"
        break
    else
        echo "데이터베이스 연결 실패, 2초 후 재시도..."
        sleep 2
        attempt=$((attempt + 1))
    fi
done

if [ $attempt -gt $max_attempts ]; then
    echo "✗ 데이터베이스 연결 실패 - 최대 시도 횟수 초과"
    exit 1
fi

# Redis 연결 확인
echo "=== Redis 연결 확인 ==="
if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping | grep -q PONG; then
    echo "✓ Redis 연결 성공!"
else
    echo "✗ Redis 연결 실패"
    exit 1
fi

# Superset 초기화
echo "=== Superset 초기화 ==="

echo "데이터베이스 스키마 업그레이드..."
superset db upgrade

echo "관리자 사용자 생성..."
superset fab create-admin \
    --username admin \
    --firstname Admin \
    --lastname User \
    --email admin@admin.com \
    --password admin || echo "관리자 사용자가 이미 존재합니다."

echo "권한 및 역할 초기화..."
superset init

echo "=== Superset 초기화 완료 ==="

echo "=== 웹서버 시작 ==="
exec superset run -h 0.0.0.0 -p 8088 --with-threads --reload --debugger