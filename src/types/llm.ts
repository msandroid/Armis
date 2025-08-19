export interface LLMConfig {
  modelPath: string
  contextSize: number
  temperature: number
  topP: number
  topK: number
  repeatPenalty: number
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
