import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    // 性能优化：代码分割策略
    rollupOptions: {
      output: {
        // 手动分包策略
        manualChunks: {
          // React 核心库
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI 框架
          'antd-vendor': ['antd', '@ant-design/icons'],
          // 状态管理
          'zustand-vendor': ['zustand'],
          // HTTP 客户端
          'axios-vendor': ['axios'],
          // 工具库
          'utils-vendor': ['dayjs', 'lodash'],
          // 性能优化库
          'perf-vendor': ['@tanstack/react-query', 'react-window', 'react-window-infinite-loader'],
        },
        // chunk 文件名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]',
        // 优化文件大小
        compact: true,
      },
      // 优化依赖预构建
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'antd',
          '@ant-design/icons',
          'zustand',
          'axios',
          'dayjs',
        ],
      },
    },
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
  },
  css: {
    preprocessorOptions: {},
  },
})
