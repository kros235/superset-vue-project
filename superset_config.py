# superset_config.py
import os
from flask import request, make_response, jsonify
from flask_cors import CORS

def FLASK_APP_MUTATOR(app):
    """Flask 앱에 CORS 설정 추가"""
    
    # CORS 설정 - 중복 방지를 위해 단순화
    CORS(app, 
         origins=['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
         allow_headers=['Content-Type', 'Authorization', 'X-CSRFToken', 'X-Requested-With', 'Accept', 'Origin'],
         expose_headers=['Content-Type', 'Authorization', 'X-CSRFToken'],
         supports_credentials=True,
         max_age=86400
    )
    
    # Preflight OPTIONS 요청만 처리 (헤더 중복 방지)
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            print(f"OPTIONS request from: {request.environ.get('HTTP_ORIGIN', 'unknown')}")
            response = make_response()
            # CORS가 이미 처리하므로 추가 헤더 설정하지 않음
            return response

    # after_request 제거 (CORS 라이브러리가 처리)
    
    # API 오류 처리
    @app.errorhandler(401)
    def handle_unauthorized(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Unauthorized', 'message': str(e)}), 401
        return e

    @app.errorhandler(404)
    def handle_not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({'error': 'Not Found', 'message': str(e)}), 404
        return e
    
    return app

# 기본 설정
DEBUG = True
LOG_LEVEL = 'DEBUG'

# 보안 설정 완전 비활성화 (개발 환경만)
WTF_CSRF_ENABLED = False
TALISMAN_ENABLED = False
SECRET_KEY = 'your-secret-key-change-this-in-production-12345'
PREVENT_UNSAFE_DB_CONNECTIONS = False

# 인증 설정
AUTH_TYPE = 1  # DATABASE authentication
AUTH_USER_REGISTRATION = True
AUTH_USER_REGISTRATION_ROLE = "Alpha"

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
    'DASHBOARD_NATIVE_FILTERS': True,
}

# API 설정
SQLLAB_CTAS_NO_LIMIT = True
SQLLAB_TIMEOUT = 300
SUPERSET_WEBSERVER_TIMEOUT = 60