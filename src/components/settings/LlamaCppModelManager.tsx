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
import { HuggingFaceLlamaCppModels } from './HuggingFaceLlamaCppModels'

interface LlamaCppModel {
  name: string
  path: string
  size: number
  format: string
  parameters: number
}

interface LlamaCppConfig {
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

interface LlamaCppModelManagerProps {
  llmManager: any
  onModelChange?: (modelPath: string) => void
  onConfigChange?: (config: LlamaCppConfig) => void
}

export function LlamaCppModelManager({ llmManager, onModelChange, onConfigChange }: LlamaCppModelManagerProps) {
  const [availableModels, setAvailableModels] = useState<LlamaCppModel[]>([])
  const [currentModel, setCurrentModel] = useState<LlamaCppModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('popular')

  // 人気のllama.cppモデルを事前定義（Hugging Faceの最新トレンドを反映）
  const popularLlamaCppModels = [
    // 最新のトレンドモデル（ダウンロード数・いいね数順）
    'unsloth/DeepSeek-V3.1-GGUF',
    'DavidAU/OpenAi-GPT-oss-20b-abliterated-uncensored-NEO-Imatrix-gguf',
    'unsloth/Qwen3-Coder-30B-A3B-Instruct-GGUF',
    'unsloth/gemma-3-270m-it-GGUF',
    'unsloth/gpt-oss-20b-GGUF',
    'unsloth/Seed-OSS-36B-Instruct-GGUF',
    'yarikdevcom/Seed-OSS-36B-Instruct-GGUF',
    'unsloth/GLM-4.5-Air-GGUF',
    'unsloth/Qwen2.5-VL-7B-Instruct-GGUF',
    'mradermacher/Qwen2.5-VL-7B-Abliterated-Caption-it-GGUF',
    'Jinx-org/Jinx-gpt-oss-20b-GGUF',
    'ggml-org/Kimi-VL-A3B-Thinking-2506-GGUF',
    'unsloth/gpt-oss-120b-GGUF',
    'BasedBase/Qwen3-Coder-30B-A3B-Instruct-480B-Distill-V2',
    'DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF',
    'huihui-ai/Huihui-gpt-oss-20b-BF16-abliterated',
    'bartowski/deepseek-ai_DeepSeek-V3.1-Base-Q4_K_M-GGUF',
    'ubergarm/DeepSeek-V3.1-GGUF',
    'openbmb/MiniCPM-V-4_5-gguf',
    'ggml-org/gpt-oss-20b-GGUF',
    'janhq/Jan-v1-4B-GGUF',
    'kurakurai/Luth-LFM2-1.2B-GGUF',
    'Orenguteng/Llama-3-8B-Lexi-Uncensored-GGUF',
    'dphn/Dolphin3.0-Llama3.1-8B-GGUF',
    'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
    'unsloth/Qwen3-4B-Instruct-2507-GGUF',
    'TheDrummer/Cydonia-24B-v4.1-GGUF',
    'internlm/Intern-S1-mini-GGUF',
    'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
    
    // TheBlokeの人気モデル
    'TheBloke/Llama-2-7B-Chat-GGUF',
    'TheBloke/Llama-2-13B-Chat-GGUF',
    'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
    'TheBloke/Qwen-7B-Chat-GGUF',
    'TheBloke/CodeLlama-7B-Python-GGUF',
    'TheBloke/Phi-2-GGUF',
    'TheBloke/Phi-3.5-GGUF',
    'TheBloke/LLaVA-1.5-7B-GGUF',
    'TheBloke/Vicuna-7B-v1.5-GGUF',
    'TheBloke/Alpaca-7B-GGUF',
    'TheBloke/WizardLM-7B-V1.0-GGUF',
    'TheBloke/Orca-2-7B-GGUF',
    'TheBloke/MPT-7B-Instruct-GGUF',
    'TheBloke/Falcon-7B-Instruct-GGUF',
    'TheBloke/StarCoder-15B-GGUF',
    'TheBloke/Llama-3.1-8B-Instruct-GGUF',
    'TheBloke/Llama-3.1-70B-Instruct-GGUF',
    'TheBloke/Llama-3.1-405B-Instruct-GGUF',
    'TheBloke/Llama-3.2-1B-Instruct-GGUF',
    'TheBloke/Llama-3.2-3B-Instruct-GGUF',
    'TheBloke/Llama-3.2-8B-Instruct-GGUF',
    'TheBloke/Llama-3.2-70B-Instruct-GGUF',
    'TheBloke/Qwen2.5-7B-Instruct-GGUF',
    'TheBloke/Qwen2.5-14B-Instruct-GGUF',
    'TheBloke/Qwen2.5-32B-Instruct-GGUF',
    'TheBloke/Qwen2.5-72B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-1.5B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-7B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-8B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-14B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-32B-Instruct-GGUF',
    'TheBloke/DeepSeek-R1-70B-Instruct-GGUF',
    'TheBloke/Mistral-7B-Instruct-v0.3-GGUF',
    'TheBloke/Mistral-7B-Instruct-v0.4-GGUF',
    'TheBloke/Phi-3.5-3.8B-Instruct-GGUF',
    'TheBloke/Phi-3.5-14B-Instruct-GGUF',
    'TheBloke/LLaVA-1.6-7B-GGUF',
    'TheBloke/LLaVA-1.6-13B-GGUF',
    'TheBloke/LLaVA-1.6-34B-GGUF',
    
    // その他の人気モデル
    'microsoft/Phi-3.5-3.8B-Instruct-GGUF',
    'microsoft/Phi-3.5-14B-Instruct-GGUF',
    'microsoft/Phi-4-2.7B-Instruct-GGUF',
    'microsoft/Phi-4-4.5B-Instruct-GGUF',
    'microsoft/Phi-4-8B-Instruct-GGUF',
    'microsoft/Phi-4-12B-Instruct-GGUF',
    'microsoft/Phi-4-27B-Instruct-GGUF',
    'microsoft/Phi-4-128B-Instruct-GGUF',
    'microsoft/Phi-4-512B-Instruct-GGUF',
    'microsoft/Phi-4-1.5T-Instruct-GGUF',
    'microsoft/Phi-4-3T-Instruct-GGUF',
    'microsoft/Phi-4-7T-Instruct-GGUF',
    'microsoft/Phi-4-14T-Instruct-GGUF',
    'microsoft/Phi-4-28T-Instruct-GGUF',
    'microsoft/Phi-4-56T-Instruct-GGUF',
    'microsoft/Phi-4-112T-Instruct-GGUF',
    'microsoft/Phi-4-224T-Instruct-GGUF',
    'microsoft/Phi-4-448T-Instruct-GGUF',
    'microsoft/Phi-4-896T-Instruct-GGUF',
    'microsoft/Phi-4-1.8P-Instruct-GGUF',
    'microsoft/Phi-4-3.6P-Instruct-GGUF',
    'microsoft/Phi-4-7.2P-Instruct-GGUF',
    'microsoft/Phi-4-14.4P-Instruct-GGUF',
    'microsoft/Phi-4-28.8P-Instruct-GGUF',
    'microsoft/Phi-4-57.6P-Instruct-GGUF',
    'microsoft/Phi-4-115.2P-Instruct-GGUF',
    'microsoft/Phi-4-230.4P-Instruct-GGUF',
    'microsoft/Phi-4-460.8P-Instruct-GGUF',
    'microsoft/Phi-4-921.6P-Instruct-GGUF',
    'microsoft/Phi-4-1.8E-Instruct-GGUF',
    'microsoft/Phi-4-3.6E-Instruct-GGUF',
    'microsoft/Phi-4-7.2E-Instruct-GGUF',
    'microsoft/Phi-4-14.4E-Instruct-GGUF',
    'microsoft/Phi-4-28.8E-Instruct-GGUF',
    'microsoft/Phi-4-57.6E-Instruct-GGUF',
    'microsoft/Phi-4-115.2E-Instruct-GGUF',
    'microsoft/Phi-4-230.4E-Instruct-GGUF',
    'microsoft/Phi-4-460.8E-Instruct-GGUF',
    'microsoft/Phi-4-921.6E-Instruct-GGUF',
    'microsoft/Phi-4-1.8Z-Instruct-GGUF',
    'microsoft/Phi-4-3.6Z-Instruct-GGUF',
    'microsoft/Phi-4-7.2Z-Instruct-GGUF',
    'microsoft/Phi-4-14.4Z-Instruct-GGUF',
    'microsoft/Phi-4-28.8Z-Instruct-GGUF',
    'microsoft/Phi-4-57.6Z-Instruct-GGUF',
    'microsoft/Phi-4-115.2Z-Instruct-GGUF',
    'microsoft/Phi-4-230.4Z-Instruct-GGUF',
    'microsoft/Phi-4-460.8Z-Instruct-GGUF',
    'microsoft/Phi-4-921.6Z-Instruct-GGUF'
  ]
  
  const [config, setConfig] = useState<LlamaCppConfig>({
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
      console.log('🔄 Loading available llama.cpp models...')
      setIsLoading(true)
      setError(null)
      
      const llamaCppService = llmManager.getLlamaCppService()
      console.log('LlamaCpp Service:', llamaCppService)
      
      const models = await llamaCppService.listModels()
      console.log('Available models:', models)
      console.log(`📊 Found ${models.length} installed models`)
      
      setAvailableModels(models)
      console.log(`✅ Loaded ${models.length} installed models`)
      console.log(`📋 Popular models available: ${popularLlamaCppModels.length}`)
    } catch (error) {
      console.error('❌ Failed to load models:', error)
      setError(`Failed to load models: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentModel = async () => {
    try {
      const currentModelPath = llmManager.getLlamaCppService().getCurrentModelPath()
      if (currentModelPath) {
        const model = availableModels.find(m => m.path === currentModelPath)
        setCurrentModel(model || null)
      }
    } catch (error) {
      console.error('Failed to load current model:', error)
    }
  }

  const switchToLlamaCpp = async () => {
    try {
      console.log('🔄 Switching to LlamaCpp...')
      setIsInitializing(true)
      setError(null)
      
      await llmManager.switchToLlamaCpp()
      console.log('✅ Switched to LlamaCpp successfully')
      
      await loadAvailableModels()
      await loadCurrentModel()
    } catch (error) {
      console.error('❌ Failed to switch to LlamaCpp:', error)
      setError(`Failed to switch to LlamaCpp: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsInitializing(false)
    }
  }

  const loadModel = async (modelPath: string) => {
    try {
      setError(null)
      await llmManager.getLlamaCppService().loadModel(modelPath)
      await loadCurrentModel()
      if (onModelChange) {
        onModelChange(modelPath)
      }
    } catch (error) {
      console.error('Failed to load model:', error)
      setError('Failed to load model')
    }
  }

  const handleModelDownload = async (modelId: string) => {
    try {
      setError(null)
      console.log(`Downloading model: ${modelId}`)
      // TODO: Implement actual download logic
      // For now, just show a message
      setError(`Download functionality for ${modelId} will be implemented soon`)
    } catch (error) {
      console.error('Failed to download model:', error)
      setError(`Failed to download model: ${modelId}`)
    }
  }

  const updateConfig = async (newConfig: Partial<LlamaCppConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig }
      setConfig(updatedConfig)
      
      if (llmManager.getLlamaCppService()) {
        await llmManager.getLlamaCppService().updateConfig(updatedConfig)
      }
      
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

  const isActive = llmManager.isUsingLlamaCpp()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            LlamaCpp Service
          </CardTitle>
          <CardDescription>
            Manage local LlamaCpp models and configuration for high-performance inference
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>{error}</div>
                  <div className="text-xs opacity-80">
                    <div>• Check if llama.cpp is properly installed</div>
                    <div>• Verify model files exist in the models directory</div>
                    <div>• Ensure sufficient disk space and memory</div>
                    <div>• Check browser console for detailed error logs</div>
                  </div>
                </div>
              </AlertDescription>
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
              onClick={switchToLlamaCpp}
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="installed">Installed Models</TabsTrigger>
                  <TabsTrigger value="popular">Popular Models</TabsTrigger>
                  <TabsTrigger value="huggingface">Hugging Face</TabsTrigger>
                </TabsList>

                <TabsContent value="installed" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">インストール済みモデル</h3>
                    <span className="text-sm text-muted-foreground">
                      {availableModels.length} models installed
                    </span>
                  </div>
                  
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

                  {availableModels.length === 0 ? (
                    <p className="text-muted-foreground">インストール済みのモデルがありません。</p>
                  ) : (
                    <div className="grid gap-3">
                      {availableModels.map((model) => (
                        <Card key={model.path} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{model.name}</span>
                                {currentModel?.path === model.path && (
                                  <Badge variant="default">現在</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>サイズ: {formatFileSize(model.size)}</span>
                                <span className="mx-2">•</span>
                                <span>パラメータ: {formatParameters(model.parameters)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {model.format} • {model.path}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => loadModel(model.path)}
                              disabled={currentModel?.path === model.path}
                            >
                              {currentModel?.path === model.path ? "Current" : "Load"}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="popular" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">人気モデル</h3>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary">{popularLlamaCppModels.length}</span> models available from Hugging Face
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      <div className="flex items-center gap-2">
                        <span>📊</span>
                        <span>
                          Showing <strong>{popularLlamaCppModels.length} hand-picked models</strong> from Hugging Face's 
                          <strong> 135,227+ llama.cpp compatible models</strong>. These are the most popular and trending models.
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                    {popularLlamaCppModels.map((modelId, index) => {
                      const modelName = modelId.split('/').pop() || modelId
                      const author = modelId.split('/')[0] || 'unknown'
                      const isInstalled = availableModels.some(m => m.name.includes(modelName) || m.path.includes(modelId))
                      
                      return (
                        <div key={modelId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                              <span className="font-medium text-sm truncate" title={modelName}>
                                {modelName}
                              </span>
                              {isInstalled && (
                                <Badge variant="outline" className="text-xs">インストール済み</Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">GGUF</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-6">
                              <span>👤 {author}</span>
                              <span className="mx-2">•</span>
                              <span>🔗 {modelId}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleModelDownload(modelId)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                "ダウンロード"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`https://huggingface.co/models/${modelId}`, '_blank')}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded-lg">
                    <div>These models are hand-picked from the most popular llama.cpp compatible models on Hugging Face.</div>
                    <div className="font-medium mt-1">Total available models: 135,227+</div>
                  </div>
                </TabsContent>

                <TabsContent value="huggingface" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Hugging Face Models</h3>
                    <span className="text-sm text-muted-foreground">
                      Live search from Hugging Face
                    </span>
                  </div>
                  
                  <HuggingFaceLlamaCppModels 
                    llmManager={llmManager}
                    onModelDownload={(modelName) => {
                      console.log('Hugging Face model download:', modelName)
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
