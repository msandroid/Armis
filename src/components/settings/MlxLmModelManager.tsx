import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Play, Zap, Search, X, CheckCircle, AlertCircle } from 'lucide-react'
import { HuggingFaceMlxLmModels } from './HuggingFaceMlxLmModels'

interface MlxLmModel {
  name: string
  path: string
  size: number
  format: string
  parameters: number
}

interface MlxLmConfig {
  modelPath?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
}

interface MlxLmModelManagerProps {
  llmManager: any
  onModelChange?: (modelPath: string) => void
  onConfigChange?: (config: MlxLmConfig) => void
}

export function MlxLmModelManager({ llmManager, onModelChange, onConfigChange }: MlxLmModelManagerProps) {
  const [availableModels, setAvailableModels] = useState<MlxLmModel[]>([])
  const [currentModel, setCurrentModel] = useState<MlxLmModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('local')
  
  const [config, setConfig] = useState<MlxLmConfig>({
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    contextSize: 4096,
    threads: 4,
    gpuLayers: 0,
    verbose: false
  })

  useEffect(() => {
    loadAvailableModels()
    loadCurrentModel()
  }, [])

  const loadAvailableModels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // MLX LMサービスはまだ実装されていないため、空の配列を返す
      setAvailableModels([])
    } catch (error) {
      console.error('Failed to load models:', error)
      setError('Failed to load models')
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentModel = async () => {
    try {
      // MLX LMサービスはまだ実装されていないため、nullを設定
      setCurrentModel(null)
    } catch (error) {
      console.error('Failed to load current model:', error)
    }
  }

  const switchToMlxLm = async () => {
    try {
      setIsInitializing(true)
      setError(null)
      // MLX LMサービスはまだ実装されていないため、エラーメッセージを表示
      setError('MLX LM service is not yet implemented')
    } catch (error) {
      console.error('Failed to switch to MLX LM:', error)
      setError('Failed to switch to MLX LM')
    } finally {
      setIsInitializing(false)
    }
  }

  const loadModel = async (modelPath: string) => {
    try {
      setError(null)
      // MLX LMサービスはまだ実装されていないため、エラーメッセージを表示
      setError('MLX LM service is not yet implemented')
    } catch (error) {
      console.error('Failed to load model:', error)
      setError('Failed to load model')
    }
  }

  const updateConfig = async (newConfig: Partial<MlxLmConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig }
      setConfig(updatedConfig)
      
      // MLX LMサービスはまだ実装されていないため、設定のみ更新
      if (onConfigChange) {
        onConfigChange(updatedConfig)
      }
    } catch (error) {
      console.error('Failed to update config:', error)
      setError('Failed to update configuration')
    }
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatParameters = (params: number): string => {
    if (params >= 1_000_000_000) {
      return `${(params / 1_000_000_000).toFixed(1)}B`
    }
    if (params >= 1_000_000) {
      return `${(params / 1_000_000).toFixed(1)}M`
    }
    return params.toString()
  }

  const isActive = false // MLX LMはまだ実装されていないため、常にfalse

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            MLX LM Service
          </CardTitle>
          <CardDescription>
            Manage local MLX LM models and configuration for Apple Silicon optimization
            <br />
            <span className="text-orange-600 font-medium">⚠️ MLX LM service is not yet implemented</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Service Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                {isActive && currentModel && (
                  <Badge variant="outline">
                    {currentModel.name}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              onClick={switchToMlxLm}
              disabled={isInitializing || isActive}
              className="flex items-center gap-2"
            >
              {isInitializing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Initializing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {isActive ? 'Active' : 'Activate'}
                </>
              )}
            </Button>
          </div>

          {isActive && (
            <>
              <Separator />
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="local">Local Models</TabsTrigger>
                  <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
                </TabsList>

                <TabsContent value="local" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Current Model</Label>
                    {currentModel ? (
                      <div className="mt-2 p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{currentModel.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(currentModel.size)} • {formatParameters(currentModel.parameters)} parameters
                            </div>
                          </div>
                          <Badge variant="outline">{currentModel.format}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground">No model loaded</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Available Models</Label>
                    <div className="mt-2 space-y-2">
                      {isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          Loading models...
                        </div>
                      ) : availableModels.length > 0 ? (
                        availableModels.map((model) => (
                          <div
                            key={model.path}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => loadModel(model.path)}
                          >
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatFileSize(model.size)} • {formatParameters(model.parameters)} parameters
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{model.format}</Badge>
                              {currentModel?.path === model.path && (
                                <Badge variant="default">Current</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No MLX models found. Please add models to the models directory.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="huggingface" className="space-y-4">
                  <HuggingFaceMlxLmModels 
                    llmManager={llmManager}
                    onModelDownload={(modelName) => {
                      console.log('Hugging Face MLX LM model download:', modelName)
                      // ダウンロード後の処理をここに追加
                      loadAvailableModels()
                    }}
                  />
                </TabsContent>
              </Tabs>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Model Configuration</Label>
                  <div className="mt-2 space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Temperature</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[config.temperature || 0.7]}
                          onValueChange={(values: number[]) => updateConfig({ temperature: values[0] })}
                          max={2}
                          min={0}
                          step={0.1}
                          className="flex-1"
                        />
                        <span className="text-sm w-12">{(config.temperature || 0.7).toFixed(1)}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Max Tokens</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[config.maxTokens || 2048]}
                          onValueChange={(values: number[]) => updateConfig({ maxTokens: values[0] })}
                          max={8192}
                          min={512}
                          step={256}
                          className="flex-1"
                        />
                        <span className="text-sm w-16">{config.maxTokens || 2048}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Context Size</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[config.contextSize || 4096]}
                          onValueChange={(values: number[]) => updateConfig({ contextSize: values[0] })}
                          max={16384}
                          min={2048}
                          step={1024}
                          className="flex-1"
                        />
                        <span className="text-sm w-16">{config.contextSize || 4096}</span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Threads</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[config.threads || 4]}
                          onValueChange={(values: number[]) => updateConfig({ threads: values[0] })}
                          max={16}
                          min={1}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm w-8">{config.threads || 4}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">GPU Layers</Label>
                      <Input
                        type="number"
                        value={config.gpuLayers || 0}
                        onChange={(e) => updateConfig({ gpuLayers: parseInt(e.target.value) || 0 })}
                        className="w-20"
                        min={0}
                        max={100}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Verbose Mode</Label>
                      <Switch
                        checked={config.verbose || false}
                        onCheckedChange={(checked) => updateConfig({ verbose: checked })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
