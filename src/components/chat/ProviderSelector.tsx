import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AIProvider, AIModel, AIProviderConfig, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { 
  Settings, 
  Key, 
  Globe, 
  Zap, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff,
  Star,
  Sparkles
} from 'lucide-react'
import { getProviderIcon } from '@/components/icons/provider-icons'

interface ProviderSelectorProps {
  onProviderSelect: (config: AIProviderConfig) => void
  currentConfig?: AIProviderConfig | null
  onTestConnection?: () => Promise<boolean>
  className?: string
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  onProviderSelect,
  currentConfig,
  onTestConnection,
  className
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [baseUrl, setBaseUrl] = useState<string>('')
  const [temperature, setTemperature] = useState<number>(0.7)
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(1000)
  const [showApiKey, setShowApiKey] = useState<boolean>(false)
  const [isTesting, setIsTesting] = useState<boolean>(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [showRecommendedModels, setShowRecommendedModels] = useState<boolean>(false)

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    setSelectedModel('')
    setApiKey('')
    setBaseUrl('')
    
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
    if (provider?.baseUrl) {
      setBaseUrl(provider.baseUrl)
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const handleSave = () => {
    if (!selectedProvider || !selectedModel) {
      return
    }

    const config: AIProviderConfig = {
      providerId: selectedProvider,
      modelId: selectedModel,
      apiKey: apiKey || '',
      baseUrl: baseUrl || undefined,
      temperature,
              maxOutputTokens
    }

    onProviderSelect(config)
  }

  const handleTestConnection = async () => {
    if (!onTestConnection) return

    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await onTestConnection()
      setTestResult(result)
    } catch (error) {
      setTestResult(false)
    } finally {
      setIsTesting(false)
    }
  }

  const getSelectedProvider = (): AIProvider | undefined => {
    return AVAILABLE_PROVIDERS.find(p => p.id === selectedProvider)
  }

  const getSelectedModel = (): AIModel | undefined => {
    const provider = getSelectedProvider()
    return provider?.models.find(m => m.id === selectedModel)
  }

  const isConfigValid = (): boolean => {
    const provider = getSelectedProvider()
    if (!provider || !selectedModel) return false
    
    if (provider.requiresApiKey && !apiKey) return false
    
    return true
  }

  const getRecommendedModels = (): AIModel[] => {
    const recommendations = [
      'gpt-4o',
      'gemini-2.5-flash',
      'claude-4-0-sonnet'
    ]
    
    const recommendedModels: AIModel[] = []
    AVAILABLE_PROVIDERS.forEach(provider => {
      provider.models.forEach(model => {
        if (recommendations.includes(model.id)) {
          recommendedModels.push(model)
        }
      })
    })
    
    return recommendedModels
  }

  const handleRecommendedModelSelect = (model: AIModel) => {
    const provider = AVAILABLE_PROVIDERS.find(p => 
      p.models.some(m => m.id === model.id)
    )
    if (provider) {
      setSelectedProvider(provider.id)
      setSelectedModel(model.id)
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle className="text-lg">AI Provider Settings</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recommended Models */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <label className="text-sm font-medium">Recommended Models</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecommendedModels(!showRecommendedModels)}
              className="h-6 px-2 text-xs"
            >
              {showRecommendedModels ? 'Hide' : 'Show'}
            </Button>
          </div>
          
          {showRecommendedModels && (
            <div className="grid grid-cols-1 gap-2 p-3 bg-muted/30 rounded-lg">
              {getRecommendedModels().map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleRecommendedModelSelect(model)}
                  className={cn(
                    "flex items-center justify-between p-2 text-left rounded border transition-colors",
                    selectedModel === model.id 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="font-medium text-sm">{model.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {AVAILABLE_PROVIDERS.find(p => 
                          p.models.some(m => m.id === model.id)
                        )?.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {model.capabilities.imageInput && (
                      <Badge variant="outline" className="text-xs">Image</Badge>
                    )}
                    {model.capabilities.toolUsage && (
                      <Badge variant="outline" className="text-xs">Tools</Badge>
                    )}
                    {model.capabilities.objectGeneration && (
                      <Badge variant="outline" className="text-xs">JSON</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Provider</label>
          <Select value={selectedProvider} onValueChange={handleProviderChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_PROVIDERS.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {React.createElement(getProviderIcon(provider.id), {
                      className: "w-4 h-4",
                      size: 16
                    })}
                    <span>{provider.name}</span>
                    {provider.requiresApiKey && <Key className="w-3 h-3" />}
                    {!provider.requiresApiKey && <Globe className="w-3 h-3" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {getSelectedProvider() && (
            <p className="text-xs text-muted-foreground">
              {getSelectedProvider()?.description}
            </p>
          )}
        </div>

        {/* Model Selection */}
        {selectedProvider && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {getSelectedProvider()?.models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.name}</span>
                      <div className="flex gap-1">
                        {model.capabilities.imageInput && (
                          <Badge variant="secondary" className="text-xs">Image</Badge>
                        )}
                        {model.capabilities.toolUsage && (
                          <Badge variant="secondary" className="text-xs">Tools</Badge>
                        )}
                        {model.capabilities.objectGeneration && (
                          <Badge variant="secondary" className="text-xs">JSON</Badge>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {getSelectedModel() && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex gap-2">
                  {getSelectedModel()?.maxTokens && (
                    <span>Max Tokens: {getSelectedModel()?.maxTokens?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Key */}
        {getSelectedProvider()?.requiresApiKey && (
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${getSelectedProvider()?.name} API key`}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {selectedProvider === 'google' && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Use Google AI Studio API key</p>
                <p>• Get API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a></p>
                <p>• API key starts with "AIzaSy" format</p>
              </div>
            )}
          </div>
        )}

        {/* Base URL */}
        {getSelectedProvider()?.baseUrl && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Base URL for the provider"
            />
          </div>
        )}

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Temperature</label>
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Tokens</label>
            <Input
              type="number"
              min="1"
                      value={maxOutputTokens}
        onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={!isConfigValid()}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
          
          {onTestConnection && (
            <Button
              onClick={handleTestConnection}
              disabled={!isConfigValid() || isTesting}
              variant="outline"
            >
              {isTesting ? (
                <Zap className="w-4 h-4 mr-2 animate-spin" />
              ) : testResult === true ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : testResult === false ? (
                <XCircle className="w-4 h-4 mr-2 text-red-500" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Test
            </Button>
          )}
        </div>

        {/* Current Configuration */}
        {currentConfig && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Provider: {currentConfig.providerId}</p>
              <p>Model: {currentConfig.modelId}</p>
              <p>Temperature: {currentConfig.temperature}</p>
              <p>Max Tokens: {currentConfig.maxOutputTokens}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
