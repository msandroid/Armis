import { WHISPER_CPP_MODELS, STTModel, getSTTModelById } from './stt-models'

export interface STTSettings {
  enabled: boolean
  provider: 'whisper-cpp' | 'openai' | 'google'
  defaultModel: string
  language: string
  temperature: number
  maxTokens: number
  autoDownload: boolean
  models: {
    [modelId: string]: {
      enabled: boolean
      priority: number
      downloaded: boolean
    }
  }
}

export class STTSettingsService {
  private static instance: STTSettingsService
  private settings: STTSettings
  private changeListeners: Array<() => void> = []

  private constructor() {
    this.settings = this.loadSettings()
  }

  public static getInstance(): STTSettingsService {
    if (!STTSettingsService.instance) {
      STTSettingsService.instance = new STTSettingsService()
    }
    return STTSettingsService.instance
  }

  // 変更リスナーを追加
  public addChangeListener(listener: () => void): void {
    this.changeListeners.push(listener)
  }

  // 変更リスナーを削除
  public removeChangeListener(listener: () => void): void {
    const index = this.changeListeners.indexOf(listener)
    if (index > -1) {
      this.changeListeners.splice(index, 1)
    }
  }

  // 変更を通知
  private notifyChange(): void {
    this.changeListeners.forEach(listener => listener())
  }

  private loadSettings(): STTSettings {
    try {
      const saved = localStorage.getItem('armis_stt_settings')
      if (saved) {
        const settings = JSON.parse(saved)
        console.log('Loaded STT settings from localStorage:', settings)
        
        // 存在しないモデルをクリーンアップし、新しいモデルを追加
        const validModelIds = WHISPER_CPP_MODELS.map((m: STTModel) => m.id)
        const cleanedModels: Record<string, any> = {}
        
        for (const [modelId, config] of Object.entries(settings.models || {})) {
          if (validModelIds.includes(modelId)) {
            cleanedModels[modelId] = config
          } else {
            console.warn(`Removing invalid model from settings: ${modelId}`)
          }
        }
        
        // 新しいモデルを追加（まだ設定されていない場合）
        for (const model of WHISPER_CPP_MODELS) {
          if (!cleanedModels[model.id]) {
            // 推奨モデルはデフォルトで有効にする
            const isRecommended = model.recommended
            cleanedModels[model.id] = { 
              enabled: isRecommended, 
              priority: isRecommended ? model.id === 'tiny-q5_1' ? 1 : 2 : 999, 
              downloaded: false 
            }
          }
        }
        
        // 有効なモデルが1つもない場合は、tiny-q5_1を強制的に有効化
        const hasEnabledModel = Object.values(cleanedModels).some((config: any) => config.enabled)
        if (!hasEnabledModel) {
          console.warn('No enabled models found, enabling tiny-q5_1 by default')
          if (cleanedModels['tiny-q5_1']) {
            cleanedModels['tiny-q5_1'].enabled = true
            cleanedModels['tiny-q5_1'].priority = 1
          }
        }
        
        // デフォルトモデルが存在しない場合は修正
        if (!validModelIds.includes(settings.defaultModel)) {
          console.warn(`Default model ${settings.defaultModel} not found, using tiny-q5_1`)
          settings.defaultModel = 'tiny-q5_1'
        }
        
        const finalSettings = {
          ...settings,
          models: cleanedModels
        }
        console.log('Final STT settings:', finalSettings)
        return finalSettings
      }
    } catch (error) {
      console.error('Error loading STT settings:', error)
    }

    // デフォルト設定
    const defaultSettings: STTSettings = {
      enabled: true,
      provider: 'whisper-cpp',
      defaultModel: 'tiny-q5_1',
      language: 'ja',
      temperature: 0.0,
      maxTokens: 448,
      autoDownload: true,
      models: {
        'tiny-q5_1': { enabled: true, priority: 1, downloaded: false },
        'base-q5_1': { enabled: false, priority: 2, downloaded: false },
        'small-q5_1': { enabled: false, priority: 3, downloaded: false },
        'medium-q5_1': { enabled: false, priority: 4, downloaded: false },
        'large-v3-turbo-q5_0': { enabled: false, priority: 5, downloaded: false }
      }
    }
    console.log('Using default STT settings:', defaultSettings)
    return defaultSettings
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('armis_stt_settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Error saving STT settings:', error)
    }
  }

  public getSettings(): STTSettings {
    return { ...this.settings }
  }

  public updateSettings(settings: Partial<STTSettings>): void {
    this.settings = { ...this.settings, ...settings }
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public toggleEnabled(): void {
    this.settings.enabled = !this.settings.enabled
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public setProvider(provider: STTSettings['provider']): void {
    this.settings.provider = provider
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public setDefaultModel(modelId: string): void {
    this.settings.defaultModel = modelId
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public setLanguage(language: string): void {
    this.settings.language = language
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public toggleModel(modelId: string): void {
    if (!this.settings.models[modelId]) {
      this.settings.models[modelId] = { enabled: false, priority: 1, downloaded: false }
    }
    this.settings.models[modelId].enabled = !this.settings.models[modelId].enabled
    this.saveSettings()
    this.notifyChange() // 設定が変更されたらリスナーを通知
  }

  public setModelPriority(modelId: string, priority: number): void {
    if (this.settings.models[modelId]) {
      this.settings.models[modelId].priority = priority
      this.saveSettings()
      this.notifyChange() // 設定が変更されたらリスナーを通知
    }
  }

  public async checkModelDownloadStatus(modelId: string): Promise<boolean> {
    try {
      const model = getSTTModelById(modelId)
      if (!model) return false
      
      const response = await fetch(`/whisper/models/ggml-${modelId}.bin`, { method: 'HEAD' })
      const isDownloaded = response.ok
      
      if (this.settings.models[modelId]) {
        this.settings.models[modelId].downloaded = isDownloaded
        this.saveSettings()
        this.notifyChange() // 設定が変更されたらリスナーを通知
      }
      return isDownloaded
    } catch (error) {
      console.error('Error checking model download status:', error)
      return false
    }
  }

  public async checkAllModelDownloadStatus(): Promise<void> {
    const modelIds = Object.keys(this.settings.models)
    for (const modelId of modelIds) {
      await this.checkModelDownloadStatus(modelId)
    }
  }

  public async downloadModel(modelId: string): Promise<boolean> {
    try {
      const model = getSTTModelById(modelId)
      if (!model) {
        throw new Error(`Model ${modelId} not found`)
      }

      console.log(`Downloading model: ${modelId}`)
      
      // ダウンロードスクリプトを呼び出し
      const response = await fetch('/api/download-whisper-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId })
      })

      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // ダウンロード状態を更新
        if (this.settings.models[modelId]) {
          this.settings.models[modelId].downloaded = true
          this.saveSettings()
          this.notifyChange() // 設定が変更されたらリスナーを通知
        }
        return true
      } else {
        throw new Error(result.error || 'Download failed')
      }
    } catch (error) {
      console.error(`Error downloading model ${modelId}:`, error)
      return false
    }
  }

  public async autoDownloadEnabledModels(): Promise<void> {
    if (!this.settings.autoDownload) return

    const enabledModels = Object.entries(this.settings.models)
      .filter(([_, config]) => config.enabled && !config.downloaded)
      .sort(([_, a], [__, b]) => a.priority - b.priority)

    for (const [modelId, _] of enabledModels) {
      console.log(`Auto-downloading enabled model: ${modelId}`)
      await this.downloadModel(modelId)
    }
  }

  public getAvailableModels(): STTModel[] {
    return WHISPER_CPP_MODELS
  }

  public getEnabledModels(): string[] {
    return Object.entries(this.settings.models)
      .filter(([_, config]) => config.enabled)
      .sort(([_, a], [__, b]) => a.priority - b.priority)
      .map(([modelId, _]) => modelId)
  }

  public getDownloadedModels(): string[] {
    return Object.entries(this.settings.models)
      .filter(([_, config]) => config.downloaded)
      .map(([modelId, _]) => modelId)
  }

  public getRecommendedModels(): STTModel[] {
    return WHISPER_CPP_MODELS.filter((m: STTModel) => m.recommended)
  }

  public getModelsByCategory() {
    const grouped = {
      tiny: WHISPER_CPP_MODELS.filter((m: STTModel) => m.category === 'Tiny'),
      base: WHISPER_CPP_MODELS.filter((m: STTModel) => m.category === 'Base'),
      small: WHISPER_CPP_MODELS.filter((m: STTModel) => m.category === 'Small'),
      medium: WHISPER_CPP_MODELS.filter((m: STTModel) => m.category === 'Medium'),
      large: WHISPER_CPP_MODELS.filter((m: STTModel) => m.category === 'Large')
    }
    return grouped
  }

  public isModelEnabled(modelId: string): boolean {
    return this.settings.models[modelId]?.enabled || false
  }

  public isModelDownloaded(modelId: string): boolean {
    return this.settings.models[modelId]?.downloaded || false
  }

  public getCurrentModel(): string {
    return this.settings.defaultModel
  }

  public isEnabled(): boolean {
    return this.settings.enabled
  }

  public getProvider(): string {
    return this.settings.provider
  }

  public getLanguage(): string {
    return this.settings.language
  }
}
