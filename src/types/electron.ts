export interface ElectronAPI {
  downloadFile: (options: any) => Promise<any>
  onDownloadProgress: (callback: (progress: any) => void) => void
  removeDownloadProgressListener: () => void
  generateImage: (options: any) => Promise<any>
  generateImageWithGemini: (options: any) => Promise<any>
  getEnvVars: () => Promise<any>
  checkGoogleAuth: () => Promise<any>
  localTTSSetup: (options: any) => Promise<any>
  localTTSSynthesize: (options: any) => Promise<any>
  localTTSListModels: (options: any) => Promise<any>
  checkXTTSModel: (options: any) => Promise<any>
  downloadXTTSModel: (options: any) => Promise<any>
  xttsSynthesize: (options: any) => Promise<any>
  xttsSetup: (options: any) => Promise<any>
  scrapeHuggingFaceModels: (options: any) => Promise<any>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
