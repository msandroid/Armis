import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Check if we're in Electron environment
const isElectron = process.env.ELECTRON_IS_DEV === 'true' || process.env.NODE_ENV === 'development'

// Custom plugin for Node.js polyfills
const nodePolyfillsPlugin = () => {
  return {
    name: 'node-polyfills',
    config(config: any) {
      // Ensure Buffer and util are available globally
      if (!config.define) config.define = {}
      config.define['global.Buffer'] = 'Buffer'
      config.define['global.util'] = 'util'
      return config
    },
    transform(code: string, id: string) {
      // Inject polyfills at the top of files that need them
      if (id.includes('node_modules') && (id.includes('pbkdf2') || id.includes('stream-browserify') || id.includes('google-auth-library') || id.includes('create-hash') || id.includes('crypto-browserify'))) {
        return {
          code: `
            if (typeof window !== 'undefined') {
              if (!window.Buffer) {
                window.Buffer = require('buffer').Buffer;
              }
              if (!window.util) {
                window.util = {
                  debuglog: () => () => {},
                  inspect: (obj) => JSON.stringify(obj, null, 2),
                  format: (...args) => args.join(' '),
                  inherits: (ctor, superCtor) => {
                    ctor.super_ = superCtor;
                    Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
                  }
                };
              }
              if (!window.process) {
                window.process = {
                  env: {},
                  platform: 'browser',
                  version: '',
                  browser: true,
                  nextTick: setTimeout
                };
              }
              if (!window.crypto) {
                window.crypto = {
                  getRandomValues: (arr) => {
                    for (let i = 0; i < arr.length; i++) {
                      arr[i] = Math.floor(Math.random() * 256);
                    }
                    return arr;
                  }
                };
              }
            }
            ${code}
          `,
          map: null
        }
      }
      return null
    }
  }
}

// Custom plugin for WebAssembly support
const webAssemblyPlugin = () => {
  return {
    name: 'webassembly-support',
    config(config: any) {
      // Enable WebAssembly support
      if (!config.define) config.define = {}
      config.define['__VITE_WASM_SUPPORT__'] = true
      return config
    },
    configureServer(server: any) {
      // Add proper MIME types for WebAssembly files
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm')
        }
        if (req.url?.endsWith('.js') && req.url.includes('whisper')) {
          res.setHeader('Content-Type', 'text/javascript')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        }
        next()
      })
    },
    transform(code: string, id: string) {
      // Handle WebAssembly imports in JavaScript files
      if (id.includes('whisper') && id.endsWith('.js')) {
        return {
          code: code.replace(
            /import\.meta\.url/g,
            'window.location.origin + "/whisper/"'
          ),
          map: null
        }
      }
      return null
    }
  }
}

// Plugin to completely exclude node-llama-cpp from browser builds
const excludeNodeLlamaCppPlugin = () => {
  return {
    name: 'exclude-node-llama-cpp',
    resolveId(id: string) {
      // Completely block node-llama-cpp modules in browser
      if (id.includes('node-llama-cpp') || id.includes('@node-llama-cpp')) {
        return id
      }
      return null
    },
    load(id: string) {
      // Return empty module for node-llama-cpp in browser
      if (id.includes('node-llama-cpp') || id.includes('@node-llama-cpp')) {
        return `
          // node-llama-cpp is not available in browser environment
          console.warn('node-llama-cpp is not available in browser environment');
          
          // Export empty objects to prevent import errors
          export const LlamaModel = class {
            constructor() {
              throw new Error('LlamaModel is not available in browser environment');
            }
          };
          
          export const LlamaContext = class {
            constructor() {
              throw new Error('LlamaContext is not available in browser environment');
            }
          };
          
          export const LlamaChatSession = class {
            constructor() {
              throw new Error('LlamaChatSession is not available in browser environment');
            }
          };
          
          export const LlamaJsonSchemaGrammar = class {
            constructor() {
              throw new Error('LlamaJsonSchemaGrammar is not available in browser environment');
            }
          };
          
          export const LlamaGrammar = class {
            constructor() {
              throw new Error('LlamaGrammar is not available in browser environment');
            }
          };
          
          export function getLlama() {
            throw new Error('getLlama is not available in browser environment');
          }
          
          export default {
            LlamaModel,
            LlamaContext,
            LlamaChatSession,
            LlamaJsonSchemaGrammar,
            LlamaGrammar,
            getLlama
          };
        `
      }
      return null
    }
  }
}

// Plugin to exclude Node.js specific modules
const excludeNodeModulesPlugin = () => {
  return {
    name: 'exclude-node-modules',
    resolveId(id: string) {
      // Block Node.js specific modules in browser
      if (id === 'child_process' || id === 'fs' || id === 'path' || id === 'os' || id.includes('google-auth-library')) {
        return id
      }
      return null
    },
    load(id: string) {
      // Return empty implementations for Node.js modules
      if (id === 'child_process') {
        return `
          // child_process is not available in browser environment
          export function spawn() {
            throw new Error('child_process.spawn is not available in browser environment');
          }
          
          export function exec() {
            throw new Error('child_process.exec is not available in browser environment');
          }
          
          export function execFile() {
            throw new Error('child_process.execFile is not available in browser environment');
          }
          
          export default { spawn, exec, execFile };
        `
      }
      
      if (id === 'fs') {
        return `
          // fs is not available in browser environment
          export function readFile() {
            throw new Error('fs.readFile is not available in browser environment');
          }
          
          export function writeFile() {
            throw new Error('fs.writeFile is not available in browser environment');
          }
          
          export function existsSync() {
            return false;
          }
          
          export default { readFile, writeFile, existsSync };
        `
      }
      
      if (id === 'path') {
        return `
          // path is not available in browser environment
          export function join() {
            throw new Error('path.join is not available in browser environment');
          }
          
          export function dirname() {
            throw new Error('path.dirname is not available in browser environment');
          }
          
          export default { join, dirname };
        `
      }
      
      if (id === 'os') {
        return `
          // os is not available in browser environment
          export const platform = 'browser';
          export const arch = 'unknown';
          
          export default { platform, arch };
        `
      }
      
      if (id.includes('google-auth-library')) {
        return `
          // google-auth-library is not available in browser environment
          export class GoogleAuth {
            constructor(options = {}) {
              console.warn('GoogleAuth is not available in browser environment');
            }
            
            async getClient() {
              throw new Error('GoogleAuth is not available in browser environment');
            }
            
            async getProjectId() {
              throw new Error('GoogleAuth is not available in browser environment');
            }
            
            async getAccessToken() {
              throw new Error('GoogleAuth is not available in browser environment');
            }
          }
          
          export default { GoogleAuth };
        `
      }
      
      return null
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    nodePolyfillsPlugin(),
    webAssemblyPlugin(),
    // Always apply these plugins to exclude Node.js modules in browser
    excludeNodeLlamaCppPlugin(),
    excludeNodeModulesPlugin()
  ],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'buffer': 'buffer',
      'util': 'util',
      'process': 'process/browser',
      'path': 'path-browserify',
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      external: [
        // Always exclude Node.js specific modules
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
        'child_process'
      ],
    },
    assetsInlineLimit: 0, // WebAssemblyファイルをインライン化しない
  },
  server: {
    port: 3000,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/api/download-whisper-model': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    include: [
      'buffer',
      'util',
      'process',
      'crypto-browserify',
      'stream-browserify',
    ],
    exclude: [
      // Always exclude Node.js specific modules
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
      'google-auth-library'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify(''),
    'process.browser': true,
    'process.nextTick': 'setTimeout',
    'util.debuglog': '(() => () => {})',
    'util.inspect': '((obj) => JSON.stringify(obj, null, 2))',
    'Buffer': 'Buffer',
    'global.Buffer': 'Buffer',
    'global.process': 'process',
    'global.util': 'util',
  },
})
