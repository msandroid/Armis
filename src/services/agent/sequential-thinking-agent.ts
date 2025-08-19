import { LlamaService } from '@/services/llm/llama-service'
import { 
  SequentialThinkingPlan, 
  SequentialThinkingStep, 
  ToolCall, 
  UserIntent 
} from '@/types/llm'
import { v4 as uuidv4 } from 'uuid'

export interface Tool {
  name: string
  description: string
  execute: (args: Record<string, any>) => Promise<any>
}

export class SequentialThinkingAgent {
  private llmService: LlamaService
  private tools: Map<string, Tool> = new Map()
  private plans: Map<string, SequentialThinkingPlan> = new Map()

  constructor(llmService: LlamaService) {
    this.llmService = llmService
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  async processUserIntent(userInput: string, context?: Record<string, any>): Promise<SequentialThinkingPlan> {
    const planId = uuidv4()
    const plan: SequentialThinkingPlan = {
      id: planId,
      steps: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.plans.set(planId, plan)

    try {
      // Step 1: Analyze user intent
      const intent = await this.analyzeIntent(userInput, context)
      
      // Step 2: Generate execution plan
      const executionPlan = await this.generateExecutionPlan(intent)
      
      // Step 3: Execute plan step by step
      plan.status = 'executing'
      plan.updatedAt = new Date()

      for (const step of executionPlan) {
        await this.executeStep(plan, step)
      }

      plan.status = 'completed'
      plan.updatedAt = new Date()

    } catch (error) {
      plan.status = 'failed'
      plan.updatedAt = new Date()
      console.error('Sequential thinking failed:', error)
    }

    return plan
  }

  private async analyzeIntent(userInput: string, context?: Record<string, any>): Promise<UserIntent> {
    const analysisPrompt = `
Analyze the following user input and extract the intent:

User Input: "${userInput}"
Context: ${JSON.stringify(context || {})}

Please provide a structured analysis in JSON format:
{
  "parsedIntent": "clear description of what the user wants",
  "context": "relevant context information",
  "preferences": "user preferences or style hints"
}
`

    const response = await this.llmService.generateResponse(analysisPrompt)
    
    try {
      const parsed = JSON.parse(response.text)
      return {
        rawInput: userInput,
        parsedIntent: parsed.parsedIntent,
        context: parsed.context || {},
        preferences: parsed.preferences || {}
      }
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        rawInput: userInput,
        parsedIntent: userInput,
        context: context || {},
        preferences: {}
      }
    }
  }

  private async generateExecutionPlan(intent: UserIntent): Promise<SequentialThinkingStep[]> {
    const availableTools = Array.from(this.tools.keys())
    
    const planningPrompt = `
Based on the user intent, create a step-by-step execution plan using available tools.

User Intent: ${intent.parsedIntent}
Available Tools: ${availableTools.join(', ')}

Create a plan in JSON format:
[
  {
    "type": "thinking",
    "content": "reasoning about this step"
  },
  {
    "type": "tool_call",
    "tool": "tool_name",
    "arguments": {"param": "value"}
  }
]
`

    const response = await this.llmService.generateWithTools(planningPrompt, availableTools)
    
    try {
      const parsed = JSON.parse(response.text)
      return parsed.map((step: any, index: number) => ({
        id: uuidv4(),
        type: step.type,
        content: step.content || '',
        toolCall: step.tool ? {
          name: step.tool,
          arguments: step.arguments || {}
        } : undefined,
        timestamp: new Date()
      }))
    } catch (error) {
      // Fallback: create a simple thinking step
      return [{
        id: uuidv4(),
        type: 'thinking',
        content: `Processing: ${intent.parsedIntent}`,
        timestamp: new Date()
      }]
    }
  }

  private async executeStep(plan: SequentialThinkingPlan, step: SequentialThinkingStep): Promise<void> {
    plan.steps.push(step)
    plan.updatedAt = new Date()

    if (step.type === 'tool_call' && step.toolCall) {
      const tool = this.tools.get(step.toolCall.name)
      if (tool) {
        try {
          const result = await tool.execute(step.toolCall.arguments)
          step.result = result
        } catch (error) {
          step.result = { error: error.message }
        }
      } else {
        step.result = { error: `Tool ${step.toolCall.name} not found` }
      }
    }
  }

  getPlan(planId: string): SequentialThinkingPlan | undefined {
    return this.plans.get(planId)
  }

  getAllPlans(): SequentialThinkingPlan[] {
    return Array.from(this.plans.values())
  }
}
