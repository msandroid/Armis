"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Settings, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AVAILABLE_MODELS } from "@/lib/models"
import { Brain, Globe, Server, Sparkles, Cpu, Bot, Zap, Shield, Coffee, Terminal, Code } from "lucide-react"

interface AIModelSelectorProps {
  currentProvider: string
  currentModel: string
  availableProviders: string[]
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
  getAvailableModelsForProvider: (provider: string) => any[]
  className?: string
  disabled?: boolean
}

export function AIModelSelector({
  currentProvider,
  currentModel,
  availableProviders,
  onProviderChange,
  onModelChange,
  getAvailableModelsForProvider,
  className,
  disabled = false
}: AIModelSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [view, setView] = React.useState<'provider' | 'model'>('provider')

  // プロバイダー設定
  const providerConfig: Record<string, { icon: any; label: string; description: string }> = {
    'anthropic': { icon: Brain, label: 'Anthropic', description: 'Claude AI モデル' },
    'openai': { icon: Sparkles, label: 'OpenAI', description: 'GPT シリーズ' },
    'google': { icon: Globe, label: 'Google', description: 'Gemini AI モデル' },
    'xai': { icon: Sparkles, label: 'xAI', description: 'Grok AI モデル' },
    'deepseek': { icon: Cpu, label: 'DeepSeek', description: 'DeepSeek AI モデル' },
    'moonshot': { icon: Bot, label: 'Moonshot', description: 'Kimi AI モデル' },
    'cursor': { icon: Bot, label: 'Cursor', description: 'Cursor AI モデル' },
    'fireworks': { icon: Zap, label: 'Fireworks', description: 'Fireworks AI モデル' },
    'ollama': { icon: Server, label: 'Ollama', description: 'ローカル AI モデル' }
  }

  // 現在の選択情報
  const currentProviderConfig = providerConfig[currentProvider]
  const currentModelInfo = AVAILABLE_MODELS[currentModel]
  const isConnected = availableProviders.includes(currentProvider)
  
  const CurrentProviderIcon = currentProviderConfig?.icon || Bot
  const CurrentModelIcon = currentModelInfo?.icon || Bot

  // 利用可能なモデル
  const availableModels = getAvailableModelsForProvider(currentProvider)

  // Java対応情報を取得するヘルパー関数
  const getJavaSupportInfo = (modelName: string) => {
    const modelInfo = AVAILABLE_MODELS[modelName]
    const javaSupport = modelInfo?.javaSupport
    
    if (!javaSupport) return null
    
    const getIcon = () => {
      switch (javaSupport.apiType) {
        case 'SDK': return Code
        case 'REST': return Terminal
        case 'VertexAI': return Globe
        case 'OpenAI-Compatible': return Coffee
        default: return Terminal
      }
    }
    
    const getLabel = () => {
      if (javaSupport.hasOfficialSDK) return 'Java SDK'
      switch (javaSupport.apiType) {
        case 'SDK': return 'Java SDK'
        case 'REST': return 'REST API'
        case 'VertexAI': return 'Vertex AI'
        case 'OpenAI-Compatible': return 'OpenAI互換'
        default: return 'API'
      }
    }
    
    const getVariant = () => {
      if (javaSupport.hasOfficialSDK) return 'default'
      return javaSupport.apiType === 'OpenAI-Compatible' ? 'secondary' : 'outline'
    }
    
    return {
      icon: getIcon(),
      label: getLabel(),
      variant: getVariant(),
      notes: javaSupport.notes
    }
  }

  // キーボードショートカット
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleProviderSelect = (providerId: string) => {
    onProviderChange(providerId)
    const models = getAvailableModelsForProvider(providerId)
    if (models.length > 0) {
      onModelChange(models[0].name)
    }
    setView('model')
  }

  const handleModelSelect = (modelName: string) => {
    onModelChange(modelName)
    setOpen(false)
    setView('provider')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[200px] max-w-[280px]",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CurrentModelIcon className="h-4 w-4 flex-shrink-0" />
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs text-muted-foreground truncate">
                {currentProviderConfig?.label || currentProvider}
              </span>
              <span className="font-medium truncate -mt-0.5">
                {currentModelInfo?.name || currentModel}
              </span>
            </div>
            {isConnected ? (
              <Wifi className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500 flex-shrink-0" />
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="font-medium">
                {view === 'provider' ? 'AIプロバイダー' : 'モデル選択'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs">⌘K</Badge>
              {view === 'model' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('provider')}
                  className="h-6 px-2 text-xs"
                >
                  戻る
                </Button>
              )}
            </div>
          </div>
          
          <CommandInput 
            placeholder={view === 'provider' ? 'プロバイダーを検索...' : 'モデルを検索...'} 
          />
          
          {view === 'provider' ? (
            <>
              <CommandEmpty>プロバイダーが見つかりません。</CommandEmpty>
              <CommandGroup heading="利用可能なプロバイダー">
                {Object.entries(providerConfig).map(([providerId, config]) => {
                  const Icon = config.icon
                  const isProviderConnected = availableProviders.includes(providerId)
                  const isSelected = currentProvider === providerId
                  
                  return (
                    <CommandItem
                      key={providerId}
                      value={providerId}
                      onSelect={() => handleProviderSelect(providerId)}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="font-medium">{config.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {config.description}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Badge variant="outline" className="text-xs">選択中</Badge>
                        )}
                        <Badge 
                          variant={isProviderConnected ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {isProviderConnected ? '接続中' : '未接続'}
                        </Badge>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </>
          ) : (
            <>
              <CommandEmpty>モデルが見つかりません。</CommandEmpty>
              {(() => {
                if (availableModels.length === 0) {
                  return (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="font-medium mb-1">利用可能なモデルがありません</p>
                      <p className="text-xs">
                        {isConnected 
                          ? 'モデルの設定を確認してください' 
                          : 'プロバイダーの接続を確認してください'
                        }
                      </p>
                    </div>
                  )
                }

                // モデルをカテゴリごとにグループ化
                const modelsByCategory: Record<string, any[]> = {}
                availableModels.forEach(model => {
                  const modelInfo = AVAILABLE_MODELS[model.name]
                  const category = modelInfo?.category || 'Other'
                  if (!modelsByCategory[category]) {
                    modelsByCategory[category] = []
                  }
                  modelsByCategory[category].push(model)
                })

                return Object.entries(modelsByCategory).map(([category, models], index) => (
                  <React.Fragment key={category}>
                    <CommandGroup heading={category}>
                      {models.map((model) => {
                        const modelInfo = AVAILABLE_MODELS[model.name]
                        const Icon = modelInfo?.icon || Bot
                        const isSelected = currentModel === model.name
                        
                        const javaSupportInfo = getJavaSupportInfo(model.name)
                        
                        return (
                          <CommandItem
                            key={model.name}
                            value={model.name}
                            onSelect={() => handleModelSelect(model.name)}
                            className="flex items-center justify-between py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium truncate">
                                    {modelInfo?.name || model.name}
                                  </span>
                                  {javaSupportInfo && (
                                    <Badge variant={javaSupportInfo.variant as any} className="text-xs">
                                      <javaSupportInfo.icon className="h-3 w-3 mr-1" />
                                      {javaSupportInfo.label}
                                    </Badge>
                                  )}
                                </div>
                                {(modelInfo?.description || model.description) && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    {modelInfo?.description || model.description}
                                  </span>
                                )}
                                {javaSupportInfo?.notes && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400 truncate mt-0.5">
                                    Java: {javaSupportInfo.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {modelInfo?.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {modelInfo.category}
                                </Badge>
                              )}
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                    {index < Object.keys(modelsByCategory).length - 1 && <CommandSeparator />}
                  </React.Fragment>
                ))
              })()}
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
