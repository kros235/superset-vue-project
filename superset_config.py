# superset_config.py 파일에 추가할 MySQL 호환성 설정

# 기존 설정들...
import os
from datetime import timedelta

# MySQL/MariaDB 호환성 설정
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {
        'connect_timeout': 60,
        'read_timeout': 60,
        'write_timeout': 60,
        'charset': 'utf8mb4',
        'use_unicode': True,
        'sql_mode': 'TRADITIONAL'
    }
}

# PyMySQL 관련 설정
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'SQLALCHEMY_DATABASE_URI',
    'mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard?charset=utf8mb4'
)

# 데이터베이스 연결 풀 설정
SQLALCHEMY_POOL_SIZE = 10
SQLALCHEMY_POOL_TIMEOUT = 30
SQLALCHEMY_POOL_RECYCLE = 3600
SQLALCHEMY_MAX_OVERFLOW = 20

# SQL Lab 설정
SQLLAB_ASYNC_TIME_LIMIT_SEC = 300
SQLLAB_TIMEOUT = 300
SUPERSET_WEBSERVER_TIMEOUT = 300

# 쿼리 결과 제한
SQL_MAX_ROW = 100000
SAMPLES_ROW_LIMIT = 1000

# 로깅 설정 (디버깅용)
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# 추가 보안 설정
PREVENT_UNSAFE_DB_CONNECTIONS = False
SQLLAB_CTAS_NO_LIMIT = True

# 메타데이터 캐시 설정
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': os.environ.get('REDIS_HOST', 'redis'),
    'CACHE_REDIS_PORT': int(os.environ.get('REDIS_PORT', 6379)),
    'CACHE_REDIS_DB': 1,
    'CACHE_REDIS_URL': f'redis://{os.environ.get("REDIS_HOST", "redis")}:{os.environ.get("REDIS_PORT", 6379)}/1'
}

# 🔥 X-Frame-Options 해제 (iframe 허용)
TALISMAN_ENABLED = True
TALISMAN_CONFIG = {
    "content_security_policy": None,
    "force_https": False,
    "frame_options": "ALLOWFROM",  # 또는 완전히 제거하려면 None
    "frame_options_allow_from": "http://localhost:8080"
}

# CORS 설정 (기존과 동일)
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': [
        'X-CSRFToken', 'Content-Type', 'Origin', 'Authorization',
        'Accept', 'Accept-Language', 'DNT', 'Cache-Control',
        'X-Mx-ReqToken', 'Keep-Alive', 'User-Agent',
        'X-Requested-With', 'If-Modified-Since', 'X-Forwarded-For',
        'X-Forwarded-Proto', 'X-Forwarded-Host', 'Accept-Encoding',
        'Connection', 'Host', 'Pragma', 'Referer'
    ],
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    'origins': [
        'http://localhost:8080',
        'http://127.0.0.1:8080', 
        'http://0.0.0.0:8080',
        'http://vue-frontend:8080',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://host.docker.internal:8080',
        '*'
    ],
    'expose_headers': ['Content-Range', 'X-Content-Range'],
    'max_age': 21600,
    'send_wildcard': False,
    'vary_header': True
}