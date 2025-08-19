"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Bot, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AVAILABLE_MODELS } from "@/lib/models"
import { Brain, Globe, Server, Cpu, Zap } from "lucide-react"

interface ModelOption {
  name: string
  description: string
  category: string
  provider: string
  icon: React.ComponentType<any>
}

interface ModelSelectorProps {
  currentModel: string
  availableModels: any[]
  onModelChange: (modelId: string) => void
  className?: string
  disabled?: boolean
}

export function ModelSelector({
  currentModel,
  availableModels,
  onModelChange,
  className,
  disabled = false
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)

  // 利用可能なモデルを整理
  const modelOptions: ModelOption[] = availableModels.map(model => {
    const modelInfo = AVAILABLE_MODELS[model.name] || {
      name: model.name,
      description: model.description || '',
      category: model.category || 'Standard',
      provider: 'Unknown',
      icon: Bot
    }
    
    return {
      name: model.name,
      description: modelInfo.description || model.description || '',
      category: modelInfo.category || 'Standard',
      provider: modelInfo.provider || 'Unknown',
      icon: modelInfo.icon || Bot
    }
  })

  // カテゴリ別にグループ化
  const groupedModels = modelOptions.reduce((acc, model) => {
    const category = model.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(model)
    return acc
  }, {} as Record<string, ModelOption[]>)

  // 現在のモデル情報
  const currentModelInfo = modelOptions.find(m => m.name === currentModel)
  const CurrentIcon = currentModelInfo?.icon || Bot

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[200px] max-w-[300px]",
            className
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CurrentIcon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {currentModelInfo?.name || currentModel}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput placeholder="モデルを検索..." />
          <CommandEmpty>モデルが見つかりません。</CommandEmpty>
          
          {Object.entries(groupedModels).map(([category, models]) => (
            <React.Fragment key={category}>
              <CommandGroup heading={category}>
                {models.map((model) => {
                  const ModelIcon = model.icon
                  const isSelected = currentModel === model.name
                  
                  return (
                    <CommandItem
                      key={model.name}
                      value={model.name}
                      onSelect={() => {
                        onModelChange(model.name)
                        setOpen(false)
                      }}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <ModelIcon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {model.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                          {model.description && (
                            <span className="text-xs text-muted-foreground truncate mt-0.5">
                              {model.description}
                            </span>
                          )}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 flex-shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
              {Object.keys(groupedModels).indexOf(category) < Object.keys(groupedModels).length - 1 && (
                <Separator />
              )}
            </React.Fragment>
          ))}
          
          {modelOptions.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">利用可能なモデルがありません</p>
              <p className="text-xs">AIプロバイダーの接続を確認してください</p>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
