# superset_config.py
import os
from datetime import timedelta

# 기본 설정
ROW_LIMIT = 5000
SUPERSET_WEBSERVER_PORT = 8088
SUPERSET_WEBSERVER_TIMEOUT = 60

# 시크릿 키 (32바이트 이상 필수)
SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY', 'your_secret_key_here_must_be_at_least_32_bytes_long_for_security')

# JWT 설정
JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)  # 24시간
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)   # 7일
GUEST_TOKEN_JWT_SECRET = os.environ.get('SUPERSET_JWT_SECRET', 'super_secret_jwt_key_that_is_at_least_32_bytes_long_for_async_queries')

# 데이터베이스 설정
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'SQLALCHEMY_DATABASE_URI',
    'mysql+pymysql://superset:superset123@mariadb:3306/sample_dashboard'
)

# Redis 설정
REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = int(os.environ.get('REDIS_PORT', 6379))

# 캐시 설정
CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': REDIS_HOST,
    'CACHE_REDIS_PORT': REDIS_PORT,
    'CACHE_REDIS_DB': 1,
    'CACHE_REDIS_URL': f'redis://{REDIS_HOST}:{REDIS_PORT}/1'
}

# CORS 설정 - 더 관대한 설정
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': [
        'X-CSRFToken', 'Content-Type', 'Origin', 'Authorization',
        'Accept', 'Accept-Language', 'DNT', 'Cache-Control',
        'X-Mx-ReqToken', 'Keep-Alive', 'User-Agent',
        'X-Requested-With', 'If-Modified-Since', 'X-Forwarded-For',
        'X-Forwarded-Proto', 'X-Forwarded-Host'
    ],
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    'origins': [
        'http://localhost:8080',
        'http://127.0.0.1:8080', 
        'http://0.0.0.0:8080',
        'http://vue-frontend:8080',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
}

# CSRF 설정 - 개발 환경에서 더 유연하게
WTF_CSRF_ENABLED = True
WTF_CSRF_EXEMPT_LIST = [
    'superset.views.api.security.SecurityRestApi.login',
    'superset.views.api.security.SecurityRestApi.refresh'
]
WTF_CSRF_TIME_LIMIT = None
WTF_CSRF_SSL_STRICT = False

# 세션 설정
PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # 개발 환경에서는 False
SESSION_COOKIE_SAMESITE = 'Lax'

# 보안 헤더 설정
TALISMAN_ENABLED = False  # 개발 환경에서는 비활성화
HTTP_HEADERS = {}

# Public Role 설정 (게스트 접근용)
PUBLIC_ROLE_LIKE_GAMMA = True
AUTH_ROLE_PUBLIC = 'Public'

# 자동 사용자 등록 설정
AUTH_USER_REGISTRATION = False
AUTH_USER_REGISTRATION_ROLE = "Public"

# Feature flags
FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
    'DASHBOARD_NATIVE_FILTERS': True,
    'DASHBOARD_CROSS_FILTERS': True,
    'GLOBAL_ASYNC_QUERIES': True,
    'VERSIONED_EXPORT': True,
    'EMBEDDED_SUPERSET': True,  # 임베딩 지원
    'DASHBOARD_RBAC': True,     # 역할 기반 접근 제어
    'ROW_LEVEL_SECURITY': True  # 행 수준 보안
}

# 비동기 쿼리 설정
GLOBAL_ASYNC_QUERIES_TRANSPORT = "polling"
GLOBAL_ASYNC_QUERIES_POLLING_DELAY = 500
GLOBAL_ASYNC_QUERIES_JWT_SECRET = GUEST_TOKEN_JWT_SECRET

# Redis 결과 백엔드
RESULTS_BACKEND = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 86400,
    'CACHE_KEY_PREFIX': 'superset_results_',
    'CACHE_REDIS_HOST': REDIS_HOST,
    'CACHE_REDIS_PORT': REDIS_PORT,
    'CACHE_REDIS_DB': 0,
}

# SQL Lab 설정
SQLLAB_CTAS_NO_LIMIT = True

# 로깅 설정
ENABLE_TIME_ROTATE = True
LOG_LEVEL = 'DEBUG'
LOG_FORMAT = '%(asctime)s:%(levelname)s:%(name)s:%(message)s'

# 웹서버 설정
WEBDRIVER_BASEURL = "http://superset:8088/"
WEBDRIVER_BASEURL_USER_FRIENDLY = "http://localhost:8088/"

# API 설정
API_PAGE_SIZE = 20

# 차트 및 대시보드 설정
SUPERSET_WEBSERVER_DOMAINS = None
ENABLE_PROXY_FIX = True

# 업로드 설정
CSV_TO_HIVE_UPLOAD_S3_BUCKET = None
UPLOAD_FOLDER = '/tmp/'
IMG_UPLOAD_FOLDER = '/tmp/'
IMG_UPLOAD_URL = '/static/uploads/'

# 이메일 설정 (선택사항)
SMTP_HOST = None
SMTP_STARTTLS = True
SMTP_SSL = False
SMTP_USER = None
SMTP_PORT = 25
SMTP_PASSWORD = None
SMTP_MAIL_FROM = None

# 알림 설정
ENABLE_ALERTS = False

# 데이터베이스 연결 풀 설정
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_timeout': 20,
    'pool_recycle': -1,
    'max_overflow': 0,
    'pool_pre_ping': True
}

# 추가 설정: 개발 환경 최적화
class DevelopmentConfig:
    DEBUG = True
    TESTING = False

# 개발 환경에서만 적용될 추가 설정들
if os.environ.get('FLASK_ENV') == 'development':
    # 개발 환경에서는 보안 제한을 완화
    WTF_CSRF_ENABLED = False  # 개발시에만 CSRF 비활성화
    SESSION_COOKIE_SECURE = False
    
print("Superset 설정 로드 완료")
print(f"데이터베이스 URI: {SQLALCHEMY_DATABASE_URI}")
print(f"Redis 호스트: {REDIS_HOST}:{REDIS_PORT}")
print(f"CORS 활성화: {ENABLE_CORS}")
print(f"CSRF 활성화: {WTF_CSRF_ENABLED}")