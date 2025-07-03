// vue-frontend/vue.config.js
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,

  // ESLint 오류를 경고로만 표시 (빌드 중단 방지)
  lintOnSave: 'warning',

  // 개발 서버 설정
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: 'all',
    // ESLint 오류로 인한 오버레이 표시 비활성화
    client: {
      overlay: {
        errors: false,
        warnings: false,
        runtimeErrors: false
      }
    },
    // 프록시 설정 복원 - 컨테이너 간 통신을 위해
    proxy: {
      '/api': {
        target: 'http://superset:8088',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.error('프록시 오류:', err)
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log('프록시 요청:', req.method, req.url)
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log('프록시 응답:', proxyRes.statusCode, req.url)
        }
      },
      '/health': {
        target: 'http://superset:8088',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // 빌드 설정
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'static',

  // 개발 환경 설정
  configureWebpack: (config) => {
    // 개발 모드 강제 설정
    if (process.env.NODE_ENV === 'development') {
      config.mode = 'development'
      config.optimization = {
        ...config.optimization,
        minimize: false
      }
    }

    // 청크 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          },
          antd: {
            test: /[\\/]node_modules[\\/]ant-design-vue/,
            name: 'antd',
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
