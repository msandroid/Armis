export interface LLMConfig {
  modelPath: string
  contextSize: number
  temperature: number
  topP: number
  topK: number
}

export interface LLMResponse {
  text: string
  tokens: number
  duration: number
  toolCalls?: Array<{
    name: string
    arguments: Record<string, any>
  }>
}

export interface ToolCall {
  name: string
  arguments: Record<string, any>
}

export interface SequentialThinkingStep {
  id: string
  type: 'thinking' | 'tool_call' | 'result'
  content: string
  toolCall?: ToolCall
  result?: any
  timestamp: Date
}

export interface SequentialThinkingPlan {
  id: string
  steps: SequentialThinkingStep[]
  status: 'planning' | 'executing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface UserIntent {
  rawInput: string
  parsedIntent: string
  context: Record<string, any>
  preferences: Record<string, any>
}

// Router Agent Types
export type AgentType = 
  | 'general' 
  | 'code_assistant' 
  | 'file_processor' 
  | 'data_analyzer' 
  | 'creative_writer'
  | 'sequential_thinking'

export interface AgentCapability {
  type: AgentType
  name: string
  description: string
  keywords: string[]
  confidence: number // 0-1
  maxTokens?: number
  temperature?: number
}

export interface RouterDecision {
  selectedAgent: AgentType
  confidence: number
  reasoning: string
  fallbackAgent?: AgentType
  context: Record<string, any>
}

export interface RouterAgentConfig {
  defaultAgent: AgentType
  confidenceThreshold: number
  enableFallback: boolean
  maxRetries: number
}

export interface AgentResponse {
  agentType: AgentType
  content: string
  metadata: Record<string, any>
  executionTime: number
  success: boolean
  error?: string
}
