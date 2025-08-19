"use client"

import * as React from "react"
import { Infinity, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Brain, Globe, Server, Sparkles, Cpu, Bot, Zap, Shield } from "lucide-react"
import { AVAILABLE_MODELS, getModelsByProvider } from "@/lib/models"
import { type AIProvider } from "@/lib/ai-providers"

interface ModelSwitcherProps {
  currentProvider: string
  currentModel: string
  availableProviders: string[]
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
  getAvailableModelsForProvider: (provider: string) => any[]
  className?: string
}

export function ModelSwitcher({
  currentProvider,
  currentModel,
  availableProviders,
  onProviderChange,
  onModelChange,
  getAvailableModelsForProvider,
  className = ""
}: ModelSwitcherProps) {
  const [open, setOpen] = React.useState(false)

  // キーボードショートカット「⌘I」でメニューを開く
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // プロバイダーのアイコンとラベルの設定
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

  // 現在のモデルの情報を取得
  const currentModelInfo = AVAILABLE_MODELS[currentModel]
  const CurrentModelIcon = currentModelInfo?.icon || Brain

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-8 px-3 text-sm font-medium ${className}`}
        >
          <div className="flex items-center space-x-2">
            <CurrentModelIcon className="h-4 w-4" />
            <span className="max-w-32 truncate">
              {currentModelInfo?.name || currentModel}
            </span>
            <span className="text-xs text-muted-foreground">⌘I</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel>AI モデル選択</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* プロバイダー選択 */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
            プロバイダー
          </DropdownMenuLabel>
          
          {Object.entries(providerConfig).map(([providerId, config]) => {
            const Icon = config.icon
            const isConnected = availableProviders.includes(providerId as AIProvider)
            const isSelected = currentProvider === providerId
            
            return (
              <DropdownMenuItem
                key={providerId}
                onClick={() => {
                  onProviderChange(providerId)
                  const models = getAvailableModelsForProvider(providerId)
                  if (models.length > 0) {
                    onModelChange(models[0].name)
                  }
                }}
                className={`flex items-center justify-between ${isSelected ? 'bg-accent' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground">{config.description}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isSelected && (
                    <Badge variant="outline" className="text-xs">選択中</Badge>
                  )}
                  <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                    {isConnected ? '接続中' : '未接続'}
                  </Badge>
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* モデル選択 */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
            {providerConfig[currentProvider]?.label || currentProvider} モデル
          </DropdownMenuLabel>
          
          {(() => {
            const availableModels = getAvailableModelsForProvider(currentProvider)
            
            if (availableModels.length === 0) {
              return (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <div className="mb-3">
                    <Brain className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  </div>
                  <p className="font-medium mb-1">モデルが利用できません</p>
                  <p className="text-xs">
                    {availableProviders.includes(currentProvider as AIProvider) 
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

            return Object.entries(modelsByCategory).map(([category, models]) => (
              <div key={category}>
                {Object.keys(modelsByCategory).length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                      {category}
                    </DropdownMenuLabel>
                  </>
                )}
                {models.map((model) => {
                  const modelInfo = AVAILABLE_MODELS[model.name]
                  const Icon = modelInfo?.icon || Brain
                  const isSelected = currentModel === model.name
                  
                  return (
                    <DropdownMenuItem
                      key={model.name}
                      onClick={() => {
                        onModelChange(model.name)
                        setOpen(false)
                      }}
                      className={`flex items-center justify-between ${isSelected ? 'bg-accent' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {modelInfo?.name || model.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {modelInfo?.description || (model as any).description || ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {modelInfo?.category && (
                          <Badge variant="secondary" className="text-xs">
                            {modelInfo.category}
                          </Badge>
                        )}
                        {isSelected && (
                          <Badge variant="outline" className="text-xs">
                            選択中
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            ))
          })()}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
