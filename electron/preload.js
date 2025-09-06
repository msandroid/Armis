const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  downloadFile: (options) => ipcRenderer.invoke('download-file', options),
  moveFile: (options) => ipcRenderer.invoke('move-file', options),
  createDirectory: (options) => ipcRenderer.invoke('create-directory', options),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => {
      callback(progress)
    })
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
  // 画像生成APIを追加
  generateImage: (options) => ipcRenderer.invoke('generate-image', options),
  generateImageWithGemini: (options) => ipcRenderer.invoke('generate-image-with-gemini', options),
  // 環境変数を取得するAPIを追加
  getEnvVars: () => ipcRenderer.invoke('get-env-vars'),
  // Google Cloud認証状況を確認するAPIを追加
  checkGoogleAuth: () => ipcRenderer.invoke('check-google-auth'),
  // Local Inworld TTS APIを追加
  localTTSSetup: (options) => ipcRenderer.invoke('local-tts-setup', options),
  localTTSSynthesize: (options) => ipcRenderer.invoke('local-tts-synthesize', options),
  localTTSListModels: (options) => ipcRenderer.invoke('local-tts-list-models', options),
  // Coqui XTTS-v2 APIを追加
  checkXTTSModel: (options) => ipcRenderer.invoke('check-xtts-model', options),
  downloadXTTSModel: (options) => ipcRenderer.invoke('download-xtts-model', options),
  xttsSynthesize: (options) => ipcRenderer.invoke('xtts-synthesize', options),
  xttsSetup: (options) => ipcRenderer.invoke('xtts-setup', options),
  // Hugging Face ウェブスクレイピングAPIを追加
  scrapeHuggingFaceModels: (options) => ipcRenderer.invoke('scrape-huggingface-models', options)
})
