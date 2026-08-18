import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: false,
      eslintrc: { enabled: false }
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: false
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 使用现代 API，消除 Dart Sass legacy-js-api 弃用警告
        api: 'modern-compiler',
        // 全局自动注入变量与 mixin
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8089',
        changeOrigin: true
      },
      // 客户端服务静态资源（轮播图、品牌横幅、头像、评价图片、实名认证图片等）
      // 由 8089 服务的 /uploads 目录提供
      '/uploads': {
        target: 'http://localhost:8089',
        changeOrigin: true
      },
      // 后台管理服务静态资源（车辆封面/相册等管理员上传资源）
      // 由 8088 服务的 /uploads 目录提供，通过 resolveAdminImage 将 /uploads/ 前缀
      // 替换为 /admin-uploads/，再在此处重写回 /uploads 转发到 8088
      '/admin-uploads': {
        target: 'http://localhost:8088',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/admin-uploads/, '/uploads')
      }
    }
  },
  build: {
    target: 'es2018',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-element': ['element-plus', '@element-plus/icons-vue'],
          'vendor-echarts': ['echarts'],
          'vendor-utils': ['axios', 'dayjs']
        }
      }
    }
  }
})
