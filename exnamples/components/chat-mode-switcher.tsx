"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageCircle, Bot, Code, Video, Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type ChatMode = 'ask' | 'agent'

export interface ChatModeConfig {
  mode: ChatMode
  agentFeatures: {
    sequentialThinking: boolean
    cursorAgent: boolean
    mulmocastCli: boolean
    autogen: boolean
  }
}

interface ChatModeSwitcherProps {
  currentMode: ChatMode
  agentFeatures: ChatModeConfig['agentFeatures']
  onModeChange: (mode: ChatMode) => void
  onAgentFeaturesChange: (features: ChatModeConfig['agentFeatures']) => void
  className?: string
}

export function ChatModeSwitcher({
  currentMode,
  agentFeatures,
  onModeChange,
  onAgentFeaturesChange,
  className = ""
}: ChatModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleFeature = (feature: keyof ChatModeConfig['agentFeatures']) => {
    onAgentFeaturesChange({
      ...agentFeatures,
      [feature]: !agentFeatures[feature]
    })
  }

  // Agent modeに切り替える際にSequential Thinkingを標準で有効化
  const handleModeChange = (mode: ChatMode) => {
    if (mode === 'agent' && !agentFeatures.sequentialThinking) {
      // Agent modeに切り替える際は、Sequential Thinkingを自動的に有効化
      onAgentFeaturesChange({
        ...agentFeatures,
        sequentialThinking: true
      })
    }
    onModeChange(mode)
  }

  const enabledFeaturesCount = Object.values(agentFeatures).filter(Boolean).length

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex items-center bg-neutral-800 rounded-lg p-1">
        <Button
          variant={currentMode === 'ask' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('ask')}
          className={`text-xs px-3 py-1 h-auto ${
            currentMode === 'ask' 
              ? 'bg-white text-black hover:bg-gray-200' 
              : 'text-white hover:bg-neutral-700'
          }`}
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Ask
        </Button>
        <Button
          variant={currentMode === 'agent' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleModeChange('agent')}
          className={`text-xs px-3 py-1 h-auto ${
            currentMode === 'agent' 
              ? 'bg-white text-black hover:bg-gray-200' 
              : 'text-white hover:bg-neutral-700'
          }`}
        >
          <Bot className="w-3 h-3 mr-1" />
          Agent
          {currentMode === 'agent' && enabledFeaturesCount > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4">
              {enabledFeaturesCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Agent Features Settings */}
      {currentMode === 'agent' && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 py-1 h-auto bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700"
            >
              <Settings className="w-3 h-3 mr-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-neutral-900 border-neutral-700">
            <div className="space-y-3">
              <div className="text-sm font-medium text-white mb-3">Agent機能設定</div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentFeatures.sequentialThinking}
                    onChange={() => toggleFeature('sequentialThinking')}
                    className="rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500"
                  />
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Sequential Thinking</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentFeatures.cursorAgent}
                    onChange={() => toggleFeature('cursorAgent')}
                    className="rounded border-neutral-600 bg-neutral-800 text-green-600 focus:ring-green-500"
                  />
                  <Code className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white">Cursor Agent</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentFeatures.mulmocastCli}
                    onChange={() => toggleFeature('mulmocastCli')}
                    className="rounded border-neutral-600 bg-neutral-800 text-purple-600 focus:ring-purple-500"
                  />
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-white">Mulmocast CLI</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agentFeatures.autogen}
                    onChange={() => toggleFeature('autogen')}
                    className="rounded border-neutral-600 bg-neutral-800 text-orange-600 focus:ring-orange-500"
                  />
                  <Bot className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">AutoGen</span>
                </label>
              </div>

              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-400">
                  有効な機能数: {enabledFeaturesCount}/4
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
