import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HuggingFaceOllamaModels } from './HuggingFaceOllamaModels'

interface OllamaModel {
  name: string
  size: number
  modified_at: string
  digest: string
  details?: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface OllamaModelManagerProps {
  llmManager: any
  onModelChange?: (modelName: string) => void
}

export const OllamaModelManager: React.FC<OllamaModelManagerProps> = ({
  llmManager,
  onModelChange
}) => {
  const [models, setModels] = useState<OllamaModel[]>([])
  const [currentModel, setCurrentModel] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const [pullProgress, setPullProgress] = useState(0)
  const [pullModelName, setPullModelName] = useState('')
  const [error, setError] = useState<string>('')
  const [isUsingOllama, setIsUsingOllama] = useState(false)
  const [activeTab, setActiveTab] = useState('installed')

  // Popular models from Ollama library
  const popularModels = [
    'gemma3:1b',
    'gemma3:4b',
    'gemma3:12b',
    'gemma3:27b',
    'llama3.1:8b',
    'llama3.1:70b',
    'llama3.1:405b',
    'llama3.2:1b',
    'llama3.2:3b',
    'qwen3:0.6b',
    'qwen3:1.7b',
    'qwen3:4b',
    'qwen3:8b',
    'qwen3:14b',
    'qwen3:30b',
    'qwen3:32b',
    'deepseek-r1:1.5b',
    'deepseek-r1:7b',
    'deepseek-r1:8b',
    'deepseek-r1:14b',
    'deepseek-r1:32b',
    'deepseek-r1:70b',
    'mistral:7b',
    'phi3:3.8b',
    'phi3:14b',
    'llava:7b',
    'llava:13b',
    'llava:34b'
  ]

  useEffect(() => {
    loadModels()
    checkOllamaStatus()
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const isOllama = llmManager.isUsingOllama()
      setIsUsingOllama(isOllama)
      if (isOllama) {
        const currentModelName = llmManager.getOllamaService().getDefaultModel()
        setCurrentModel(currentModelName)
      }
    } catch (error) {
      console.error('Error checking Ollama status:', error)
    }
  }

  const loadModels = async () => {
    setIsLoading(true)
    setError('')
    try {
      const modelList = await llmManager.listOllamaModels()
      setModels(modelList)
    } catch (error) {
      setError('モデルの読み込みに失敗しました。Ollamaが起動しているか確認してください。')
      console.error('Error loading models:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchToOllama = async () => {
    setIsLoading(true)
    setError('')
    try {
      await llmManager.switchToOllama()
      setIsUsingOllama(true)
      await loadModels()
      const currentModelName = llmManager.getOllamaService().getDefaultModel()
      setCurrentModel(currentModelName)
    } catch (error) {
      setError('Ollamaへの切り替えに失敗しました。')
      console.error('Error switching to Ollama:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchToLlama = async () => {
    setIsLoading(true)
    setError('')
    try {
      await llmManager.switchToLlama()
      setIsUsingOllama(false)
      setCurrentModel('')
    } catch (error) {
      setError('Llamaへの切り替えに失敗しました。')
      console.error('Error switching to Llama:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const changeModel = async (modelName: string) => {
    setIsLoading(true)
    setError('')
    try {
      await llmManager.setOllamaModel(modelName)
      setCurrentModel(modelName)
      if (onModelChange) {
        onModelChange(modelName)
      }
    } catch (error) {
      setError(`モデルの切り替えに失敗しました: ${modelName}`)
      console.error('Error changing model:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelPull = async (modelName: string) => {
    // モデルがプルされた後にインストール済みモデルリストを更新
    await loadModels()
  }

  const pullModel = async (modelName: string) => {
    setIsPulling(true)
    setPullModelName(modelName)
    setPullProgress(0)
    setError('')
    
    try {
      // Use the improved pull method with progress tracking
      await llmManager.getOllamaService().pullModelWithProgress(
        modelName,
        (progress, message) => {
          setPullProgress(progress)
          console.log(message)
        }
      )
      
      // Reload models after successful pull
      await loadModels()
      
      setTimeout(() => {
        setIsPulling(false)
        setPullModelName('')
        setPullProgress(0)
      }, 1000)
    } catch (error) {
      setError(`モデルのダウンロードに失敗しました: ${modelName}`)
      console.error('Error pulling model:', error)
      setIsPulling(false)
      setPullModelName('')
      setPullProgress(0)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Ollama モデル管理</span>
            <Badge variant={isUsingOllama ? "default" : "secondary"}>
              {isUsingOllama ? "アクティブ" : "非アクティブ"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Ollamaモデルの管理と切り替えを行います。gemma3:1bが初期モデルとして設定されています。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={switchToOllama}
              disabled={isUsingOllama || isLoading}
              variant={isUsingOllama ? "default" : "outline"}
            >
              {isLoading ? <CircleSpinner size="sm" /> : "Ollamaに切り替え"}
            </Button>
            <Button
              onClick={switchToLlama}
              disabled={!isUsingOllama || isLoading}
              variant={!isUsingOllama ? "default" : "outline"}
            >
              {isLoading ? <CircleSpinner size="sm" /> : "Llamaに切り替え"}
            </Button>
            <Button
              onClick={loadModels}
              disabled={!isUsingOllama || isLoading}
              variant="outline"
            >
              {isLoading ? <CircleSpinner size="sm" /> : "更新"}
            </Button>
          </div>

          {isUsingOllama && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">現在のモデル</label>
                <Select value={currentModel} onValueChange={changeModel} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="モデルを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{model.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {formatFileSize(model.size)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="installed">Installed Models</TabsTrigger>
                  <TabsTrigger value="popular">Popular Models</TabsTrigger>
                  <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
                </TabsList>

                <TabsContent value="installed" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">インストール済みモデル</h3>
                    <span className="text-sm text-muted-foreground">
                      {models.length} models installed
                    </span>
                  </div>
                  
                  {models.length === 0 ? (
                    <p className="text-muted-foreground">インストール済みのモデルがありません。</p>
                  ) : (
                    <div className="grid gap-3">
                      {models.map((model) => (
                        <Card key={model.name} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{model.name}</span>
                                {model.name === currentModel && (
                                  <Badge variant="default">現在</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>サイズ: {formatFileSize(model.size)}</span>
                                <span className="mx-2">•</span>
                                <span>更新: {formatDate(model.modified_at)}</span>
                              </div>
                              {model.details && (
                                <div className="text-xs text-muted-foreground">
                                  {model.details.parameter_size} • {model.details.quantization_level}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="popular" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">人気モデル</h3>
                    <span className="text-sm text-muted-foreground">
                      {popularModels.length} models available
                    </span>
                  </div>
                  
                  <div className="grid gap-2">
                    {popularModels.map((modelName) => {
                      const isInstalled = models.some(m => m.name === modelName)
                      return (
                        <div key={modelName} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-medium">{modelName}</span>
                          <div className="flex gap-2">
                            {isInstalled ? (
                              <Badge variant="outline">インストール済み</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => pullModel(modelName)}
                                disabled={isPulling}
                              >
                                {isPulling && pullModelName === modelName ? (
                                  <CircleSpinner size="sm" />
                                ) : (
                                  "ダウンロード"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="huggingface" className="space-y-4">
                  <HuggingFaceOllamaModels 
                    llmManager={llmManager}
                    onModelPull={handleModelPull}
                  />
                </TabsContent>
              </Tabs>

              {isPulling && (
                <Card className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {pullModelName} をダウンロード中...
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(pullProgress)}%
                      </span>
                    </div>
                    <Progress value={pullProgress} className="w-full" />
                  </div>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
