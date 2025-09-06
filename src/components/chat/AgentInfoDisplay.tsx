import React from 'react'
import { Bot, Zap, Brain, Code, FileText, BarChart3, PenTool, GitBranch } from 'lucide-react'
import { AgentType } from '@/types/llm'
import { cn } from '@/lib/utils'

interface AgentInfoDisplayProps {
  agentType: AgentType | null
  confidence: number
  reasoning: string
  complexity: 'simple' | 'moderate' | 'complex'
  className?: string
}

const getAgentIcon = (agentType: AgentType) => {
  switch (agentType) {
    case 'general':
      return <Bot className="w-4 h-4" />
    case 'code_assistant':
      return <Code className="w-4 h-4" />
    case 'file_processor':
      return <FileText className="w-4 h-4" />
    case 'data_analyzer':
      return <BarChart3 className="w-4 h-4" />
    case 'creative_writer':
      return <PenTool className="w-4 h-4" />
    case 'sequential_thinking':
      return <Brain className="w-4 h-4" />
    default:
      return <Bot className="w-4 h-4" />
  }
}

const getAgentName = (agentType: AgentType) => {
  switch (agentType) {
    case 'general':
      return 'General Assistant'
    case 'code_assistant':
      return 'Code Assistant'
    case 'file_processor':
      return 'File Processor'
    case 'data_analyzer':
      return 'Data Analyzer'
    case 'creative_writer':
      return 'Creative Writer'
    case 'sequential_thinking':
      return 'Sequential Thinking'
    default:
      return 'Unknown Agent'
  }
}

const getComplexityColor = (complexity: 'simple' | 'moderate' | 'complex') => {
  switch (complexity) {
    case 'simple':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
    case 'moderate':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
    case 'complex':
      return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600'
  if (confidence >= 0.6) return 'text-yellow-600'
  return 'text-red-600'
}

export const AgentInfoDisplay: React.FC<AgentInfoDisplayProps> = ({
  agentType,
  confidence,
  reasoning,
  complexity,
  className
}) => {
  if (!agentType) return null
  
  // file processor agentの場合は非表示
  if (agentType === 'file_processor') return null

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-2">
        <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded">
          {getAgentIcon(agentType)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
              {getAgentName(agentType)}
            </span>
            <Zap className="w-3 h-3 text-blue-600" />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              getComplexityColor(complexity)
            )}>
              {complexity}
            </span>
            <span className={cn(
              "font-medium",
              getConfidenceColor(confidence)
            )}>
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 text-xs text-blue-700 dark:text-blue-300">
        {reasoning}
      </div>
    </div>
  )
}
