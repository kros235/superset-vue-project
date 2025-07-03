# superset_config.py
import os
import secrets

# 기본 설정
ROW_LIMIT = 5000
SUPERSET_WEBSERVER_PORT = 8088
SUPERSET_WEBSERVER_TIMEOUT = 60

# 시크릿 키 (32바이트 이상)
SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY', 'your_secret_key_here_must_be_at_least_32_bytes_long_for_security')

# JWT 시크릿 키 추가 (32바이트 이상 필수)
JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24시간
JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7일
GUEST_TOKEN_JWT_SECRET = os.environ.get('SUPERSET_JWT_SECRET', 'super_secret_jwt_key_that_is_at_least_32_bytes_long_for_async_queries')

# 비동기 쿼리를 위한 JWT 설정
GLOBAL_ASYNC_QUERIES_JWT_SECRET = GUEST_TOKEN_JWT_SECRET

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

# CORS 설정 (Vue.js 프론트엔드를 위해)
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': [
        'X-CSRFToken', 'Content-Type', 'Origin', 'Authorization',
        'Accept', 'Accept-Language', 'DNT', 'Cache-Control',
        'X-Mx-ReqToken', 'Keep-Alive', 'User-Agent',
        'X-Requested-With', 'If-Modified-Since'
    ],
    'resources': {
        '/api/*': {
            'origins': [
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://0.0.0.0:8080'
            ]
        }
    }
}

# 웹 서버 설정
WTF_CSRF_ENABLED = True
WTF_CSRF_EXEMPT_LIST = []
WTF_CSRF_TIME_LIMIT = None

# 세션 설정
PERMANENT_SESSION_LIFETIME = 86400  # 24시간

# 로깅 설정
ENABLE_TIME_ROTATE = True
LOG_LEVEL = 'DEBUG'
LOG_FORMAT = '%(asctime)s:%(levelname)s:%(name)s:%(message)s'

# 추가 보안 설정
HTTP_HEADERS = {}
OVERRIDE_HTTP_HEADERS = {}
ENABLE_PROXY_FIX = False

# Feature flags
FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
    'DASHBOARD_NATIVE_FILTERS': True,
    'DASHBOARD_CROSS_FILTERS': True,
    'GLOBAL_ASYNC_QUERIES': True,
    'VERSIONED_EXPORT': True
}

# 비동기 쿼리 설정 (중요!)
GLOBAL_ASYNC_QUERIES_TRANSPORT = "polling"
GLOBAL_ASYNC_QUERIES_POLLING_DELAY = 500

# Redis를 사용한 비동기 쿼리 결과 백엔드
RESULTS_BACKEND = {
    'CACHE_TYPE': 'RedisCache',
    'CACHE_DEFAULT_TIMEOUT': 86400,  # 24시간
    'CACHE_KEY_PREFIX': 'superset_results_',
    'CACHE_REDIS_HOST': REDIS_HOST,
    'CACHE_REDIS_PORT': REDIS_PORT,
    'CACHE_REDIS_DB': 0,
}

# SQL Lab 설정
SQLLAB_CTAS_NO_LIMIT = True