# superset_config.py (request import 추가)
import os
from flask import request  # 이 줄이 누락되어 있었음!
from flask_cors import CORS

# Flask 앱 뮤테이터 함수
def FLASK_APP_MUTATOR(app):
    """Flask 앱에 CORS 설정 추가"""
    
    # 개발 환경을 위한 관대한 CORS 설정
    CORS(app, 
         origins=[
             'http://localhost:3001',
             'http://localhost:3000',
             'http://127.0.0.1:3001',
             'http://127.0.0.1:3000'
         ],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
         allow_headers=[
             'Content-Type',
             'Authorization',
             'X-CSRFToken',
             'X-Requested-With',
             'Accept',
             'Origin',
             'Cache-Control',
             'X-Request-ID'
         ],
         expose_headers=[
             'Content-Type',
             'Authorization',
             'X-CSRFToken',
             'Content-Length',
             'X-Total-Count'
         ],
         supports_credentials=True,
         max_age=86400  # 24시간 캐시
    )
    
    # 추가 헤더 설정
    @app.after_request
    def after_request(response):
        origin = request.environ.get('HTTP_ORIGIN', '')
        if origin.startswith('http://localhost') or origin.startswith('http://127.0.0.1'):
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS,PATCH'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-CSRFToken,X-Requested-With,Accept,Origin,Cache-Control'
        return response
    
    return app

# 기본 설정
DEBUG = True
WTF_CSRF_ENABLED = False
TALISMAN_ENABLED = False

# 보안 설정 완화 (개발 환경)
SECRET_KEY = 'your-secret-key-change-this-in-production-12345'
PREVENT_UNSAFE_DB_CONNECTIONS = False

# 세션 설정
SESSION_COOKIE_SAMESITE = None
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = False

# 캐시 설정
CACHE_CONFIG = {
    'CACHE_TYPE': 'redis',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_HOST': 'redis',
    'CACHE_REDIS_PORT': 6379,
    'CACHE_REDIS_DB': 1,
    'CACHE_REDIS_URL': 'redis://redis:6379/1'
}

# Feature flags
FEATURE_FLAGS = {
    'ENABLE_TEMPLATE_PROCESSING': True,
}

# API 설정
SQLLAB_CTAS_NO_LIMIT = True
SQLLAB_TIMEOUT = 300
SUPERSET_WEBSERVER_TIMEOUT = 60

# 로그 레벨
LOG_LEVEL = 'INFO'

# 사용자 등록 허용 (개발 환경)
AUTH_USER_REGISTRATION = True
AUTH_USER_REGISTRATION_ROLE = "Public"