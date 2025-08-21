import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: [
        'node-llama-cpp',
        '@node-llama-cpp/mac-x64',
        '@node-llama-cpp/mac-arm64',
        '@node-llama-cpp/mac-arm64-metal',
        '@node-llama-cpp/linux-x64',
        '@node-llama-cpp/linux-x64-cuda',
        '@node-llama-cpp/linux-x64-vulkan',
        '@node-llama-cpp/linux-arm64',
        '@node-llama-cpp/linux-armv7l',
        '@node-llama-cpp/win-x64',
        '@node-llama-cpp/win-x64-cuda',
        '@node-llama-cpp/win-x64-vulkan',
        '@node-llama-cpp/win-arm64',
        'fs',
        'path',
        'os',
        'crypto'
      ],
    },
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: [
      'node-llama-cpp',
      '@node-llama-cpp/mac-x64',
      '@node-llama-cpp/mac-arm64',
      '@node-llama-cpp/mac-arm64-metal',
      '@node-llama-cpp/linux-x64',
      '@node-llama-cpp/linux-x64-cuda',
      '@node-llama-cpp/linux-x64-vulkan',
      '@node-llama-cpp/linux-arm64',
      '@node-llama-cpp/linux-armv7l',
      '@node-llama-cpp/win-x64',
      '@node-llama-cpp/win-x64-cuda',
      '@node-llama-cpp/win-x64-vulkan',
      '@node-llama-cpp/win-arm64'
    ]
  },
  define: {
    global: 'globalThis',
  },
})
