// vue-frontend/vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,  // ESLint 오류로 인한 빌드 중단 방지

  // 개발 서버 설정
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    
    // 클라이언트 오버레이 설정
    client: {
      overlay: {
        errors: false,
        warnings: false,
        runtimeErrors: false
      }
    },

    // 프록시 설정 - 더 상세한 로깅과 오류 처리
    proxy: {
      '/api': {
        target: 'http://superset:8088',  // 컨테이너 이름 사용
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        
        // 상세 로깅
        logLevel: 'debug',
        
        // 헤더 설정
        headers: {
          'Connection': 'keep-alive',
          'X-Forwarded-For': '127.0.0.1',
          'X-Forwarded-Proto': 'http',
          'X-Forwarded-Host': 'localhost:8080'
        },
        
        // 이벤트 핸들러
        onProxyReq: function(proxyReq, req, res) {
          console.log(`[프록시 요청] ${req.method} ${req.url} -> http://superset:8088${req.url}`)
          
          // CORS 헤더 설정
          proxyReq.setHeader('Origin', 'http://localhost:8080')
          proxyReq.setHeader('Referer', 'http://localhost:8080/')
        },
        
        onProxyRes: function(proxyRes, req, res) {
          console.log(`[프록시 응답] ${proxyRes.statusCode} ${req.url}`)
          
          // CORS 응답 헤더 설정
          proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:8080'
          proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
          proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With'
          proxyRes.headers['Access-Control-Allow-Credentials'] = 'true'
        },
        
        onError: function(err, req, res) {
          console.error(`[프록시 오류] ${req.url}:`, err.message)
          console.error('오류 세부사항:', {
            code: err.code,
            errno: err.errno,
            syscall: err.syscall,
            address: err.address,
            port: err.port
          })
          
          // 오류 응답 설정
          res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:8080',
            'Access-Control-Allow-Credentials': 'true'
          })
          res.end(JSON.stringify({
            error: 'Proxy Error',
            message: `Superset 서버에 연결할 수 없습니다: ${err.message}`,
            code: err.code
          }))
        }
      },
      
      // 헬스체크 프록시
      '/health': {
        target: 'http://superset:8088',
        changeOrigin: true,
        secure: false,
        onProxyReq: function(proxyReq, req, res) {
          console.log('[헬스체크] Superset 연결 확인 중...')
        },
        onProxyRes: function(proxyRes, req, res) {
          console.log(`[헬스체크] Superset 상태: ${proxyRes.statusCode}`)
        },
        onError: function(err, req, res) {
          console.error('[헬스체크] Superset 연결 실패:', err.message)
          res.writeHead(503, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Superset unavailable' }))
        }
      }
    }
  },

  // 빌드 설정
  publicPath: '/',
  outputDir: 'dist',
  
  // 웹팩 설정
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    },
    // 개발 환경 최적화
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
  },

  // CSS 설정
  css: {
    loaderOptions: {
      less: {
        lessOptions: {
          modifyVars: {
            '@primary-color': '#1890ff',
            '@link-color': '#1890ff',
            '@border-radius-base': '6px'
          },
          javascriptEnabled: true
        }
      }
    }
  }
})