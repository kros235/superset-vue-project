# superset_config.py (네트워크 접근 허용)
import os
from flask import request
from flask_cors import CORS

# Flask 앱 뮤테이터 함수
def FLASK_APP_MUTATOR(app):
    """Flask 앱에 CORS 설정 추가 (네트워크 접근 허용)"""
    
    # 네트워크 환경을 위한 CORS 설정
    CORS(app, 
         origins=[
             'http://localhost:3001',
             'http://localhost:3000',
             'http://127.0.0.1:3001',
             'http://127.0.0.1:3000',
             # 실제 IP 주소들 (여러 네트워크 대역 허용)
             'http://192.168.*:3001',
             'http://192.168.*:3000',
             'http://10.*:3001',
             'http://10.*:3000',
             'http://172.*:3001',
             'http://172.*:3000'
         ],
         origin_regex=[
             r"http://192\.168\.\d+\.\d+:300[01]",
             r"http://10\.\d+\.\d+\.\d+:300[01]",
             r"http://172\.\d+\.\d+\.\d+:300[01]"
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
        # 로컬 네트워크 IP 대역 허용
        if (origin.startswith('http://localhost') or 
            origin.startswith('http://127.0.0.1') or
            origin.startswith('http://192.168.') or
            origin.startswith('http://10.') or
            origin.startswith('http://172.')):
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

# 네트워크 설정
WEB_SERVER_ADDRESS = '0.0.0.0'
WEB_SERVER_PORT = 8088

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