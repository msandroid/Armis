"use client"

import * as React from "react"
import { ChevronDown, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface AutoModeSwitcherProps {
  currentMode: string
  onModeChange: (mode: string) => void
  className?: string
}

const AUTO_MODES = [
  {
    id: 'auto',
    name: '自動',
    description: 'AIが最適なモデルを自動選択',
    icon: Zap
  },
  {
    id: 'manual',
    name: '手動',
    description: 'ユーザーがモデルを手動選択',
    icon: Zap
  },
  {
    id: 'smart',
    name: 'スマート',
    description: 'タスクに応じて最適なモデルを選択',
    icon: Zap
  }
]

export function AutoModeSwitcher({
  currentMode,
  onModeChange,
  className = ""
}: AutoModeSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const currentModeInfo = AUTO_MODES.find(mode => mode.id === currentMode) || AUTO_MODES[0]

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-8 px-3 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300 ${className}`}
        >
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>{currentModeInfo.name}</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48" align="start">
        <DropdownMenuLabel>自動モード選択</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {AUTO_MODES.map((mode) => {
          const Icon = mode.icon
          const isSelected = currentMode === mode.id
          
          return (
            <DropdownMenuItem
              key={mode.id}
              onClick={() => {
                onModeChange(mode.id)
                setOpen(false)
              }}
              className={`flex items-center justify-between ${isSelected ? 'bg-accent' : ''}`}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {mode.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {mode.description}
                  </span>
                </div>
              </div>
              {isSelected && (
                <Badge variant="outline" className="text-xs">
                  選択中
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
