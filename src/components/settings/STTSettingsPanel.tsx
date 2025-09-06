import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Star,
  Mic,
  Settings,
  Globe,
  Languages,
  Zap,
  HardDrive
} from 'lucide-react'
import { STTSettingsService, STTSettings } from '@/services/stt/stt-settings-service'
import { getSTTModelsByProvider, STT_PROVIDERS, STTModel, WHISPER_CPP_MODELS } from '@/services/stt/stt-models'
import { CircleSpinner } from '@/components/ui/circle-spinner'

interface STTSettingsPanelProps {
  onSettingsChange?: (settings: STTSettings) => void
}

export const STTSettingsPanel: React.FC<STTSettingsPanelProps> = ({
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<STTSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState('general')

  const sttService = STTSettingsService.getInstance()

  useEffect(() => {
    loadSettings()
    checkModelStatus()
  }, [])

  const loadSettings = () => {
    const currentSettings = sttService.getSettings()
    setSettings(currentSettings)
  }

  const checkModelStatus = async () => {
    setLoading(true)
    try {
      await sttService.checkAllModelDownloadStatus()
      loadSettings()
    } catch (error) {
      console.error('Error checking model status:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (updates: Partial<STTSettings>) => {
    if (!settings) return
    
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    sttService.updateSettings(updates)
    
    if (onSettingsChange) {
      onSettingsChange(newSettings)
    }
  }

  const toggleModel = async (modelId: string) => {
    if (!settings) return

    // 現在の設定を取得
    const currentSettings = sttService.getSettings()
    const isCurrentlyEnabled = currentSettings.models[modelId]?.enabled || false

    // モデルの有効/無効を切り替え
    sttService.toggleModel(modelId)
    
    // 設定を再読み込み
    loadSettings()

    // モデルが有効化された場合の処理
    if (!isCurrentlyEnabled) {
      // 自動ダウンロードが有効で、モデルがダウンロードされていない場合
      if (settings.autoDownload && !settings.models[modelId]?.downloaded) {
        await downloadModel(modelId)
      }
      
      // 他のモデルを無効にする（単一選択モード）
      const updatedSettings = sttService.getSettings()
      Object.keys(updatedSettings.models).forEach(key => {
        if (key !== modelId) {
          updatedSettings.models[key].enabled = false
        }
      })
      sttService.updateSettings({ models: updatedSettings.models })
      loadSettings()
    }

    // 設定変更を通知
    if (onSettingsChange) {
      onSettingsChange(sttService.getSettings())
    }
  }

  const downloadModel = async (modelId: string) => {
    setDownloadingModels(prev => new Set(prev).add(modelId))
    
    try {
      const success = await sttService.downloadModel(modelId)
      if (success) {
        console.log(`Model ${modelId} downloaded successfully`)
      } else {
        console.error(`Failed to download model ${modelId}`)
      }
    } catch (error) {
      console.error(`Error downloading model ${modelId}:`, error)
    } finally {
      setDownloadingModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(modelId)
        return newSet
      })
      loadSettings()
    }
  }

  const autoDownloadEnabledModels = async () => {
    setLoading(true)
    try {
      await sttService.autoDownloadEnabledModels()
      loadSettings()
    } catch (error) {
      console.error('Error auto-downloading models:', error)
    } finally {
      setLoading(false)
    }
  }

  const getModelStatusIcon = (modelId: string) => {
    if (!settings) return null
    
    const modelConfig = settings.models[modelId]
    if (!modelConfig) return null

    if (downloadingModels.has(modelId)) {
      return <CircleSpinner size="sm" />
    }

    return null
  }

  const getModelStatusText = (modelId: string) => {
    if (!settings) return ''
    
    const modelConfig = settings.models[modelId]
    if (!modelConfig) return 'Not configured'

    if (downloadingModels.has(modelId)) {
      return 'Downloading...'
    }

    return ''
  }

  const getModelPriority = (modelId: string) => {
    if (!settings) return 0
    return settings.models[modelId]?.priority || 0
  }

  const setModelPriority = (modelId: string, priority: number) => {
    sttService.setModelPriority(modelId, priority)
    loadSettings()
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <CircleSpinner size="lg" />
      </div>
    )
  }

  const modelsByProvider = getSTTModelsByProvider()

  return (
    <div className="space-y-6">
      {/* 一般設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure basic STT settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 有効/無効切り替え */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Enable STT</label>
              <p className="text-sm text-muted-foreground">
                Enable Speech-to-Text functionality
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={() => {
                sttService.toggleEnabled()
                loadSettings()
              }}
            />
          </div>

          {/* プロバイダー選択 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider</label>
            <Select
              value={settings.provider}
              onValueChange={(value: STTSettings['provider']) => {
                sttService.setProvider(value)
                loadSettings()
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whisper-cpp">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Whisper.cpp (Local)
                  </div>
                </SelectItem>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    OpenAI Whisper
                  </div>
                </SelectItem>
                <SelectItem value="google">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Google Speech-to-Text
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* デフォルト言語 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Language</label>
            <Select
              value={settings.language}
              onValueChange={(value) => {
                sttService.setLanguage(value)
                loadSettings()
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="auto">Auto-detect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自動ダウンロード */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Auto-download Models</label>
              <p className="text-sm text-muted-foreground">
                Automatically download enabled models
              </p>
            </div>
            <Switch
              checked={settings.autoDownload}
              onCheckedChange={(checked) => {
                updateSettings({ autoDownload: checked })
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* モデル設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Whisper.cpp Models
          </CardTitle>
          <CardDescription>
            Select and manage Whisper.cpp models for speech recognition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* モデル管理ヘッダー */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Model Management</h3>
              <p className="text-sm text-muted-foreground">
                Enable/disable models and set download preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {Object.values(settings.models).filter(m => m.enabled).length} enabled
              </Badge>

            </div>
          </div>

          {/* Whisper.cppモデルの表示 */}
          <div className="space-y-4">
            {/* Provider header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Whisper.cpp (Local)</h3>
                  <p className="text-sm text-muted-foreground">Lightweight speech recognition running locally</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {WHISPER_CPP_MODELS.filter(model => settings.models[model.id]?.enabled).length} enabled
                </Badge>
                
              </div>
            </div>

            {/* Model grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WHISPER_CPP_MODELS.map((model: STTModel) => {
                const isEnabled = settings.models[model.id]?.enabled || false
                const isDownloaded = settings.models[model.id]?.downloaded || false
                const isDownloading = downloadingModels.has(model.id)
                const priority = getModelPriority(model.id)

                return (
                  <Card 
                    key={model.id}
                    className={`transition-all hover:shadow-md ${
                      isEnabled ? 'border-primary/50 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-sm" title={model.name}>
                                {model.name}
                              </h3>
                              {model.language === 'multilingual' && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  <Languages className="w-2 h-2 mr-0.5" />
                                  ML
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {model.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => {
                                console.log(`Switch clicked for model ${model.id}, current state: ${isEnabled}`)
                                toggleModel(model.id)
                              }}
                              disabled={isDownloading}
                              className={isEnabled ? "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" : ""}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {isEnabled && (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {model.size}
                          </Badge>
                          {model.quantization && model.quantization !== 'none' && (
                            <Badge variant="outline" className="text-xs">
                              {model.quantization.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {getModelStatusIcon(model.id)}
                            <span>{getModelStatusText(model.id)}</span>
                          </div>
                        </div>

                        {/* ダウンロードボタン */}
                        {!isDownloaded && !isDownloading && isEnabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadModel(model.id)
                            }}
                            className="w-full"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* 一括操作 */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              onClick={autoDownloadEnabledModels}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <CircleSpinner size="sm" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download All Enabled Models
            </Button>

            <Button
              onClick={checkModelStatus}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <CircleSpinner size="sm" />
              ) : (
                <Info className="w-4 h-4 mr-2" />
              )}
              Check Download Status
            </Button>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
