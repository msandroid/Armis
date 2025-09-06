import { Tool } from '@/services/agent/sequential-thinking-agent'
import { GraphAIService } from '@/services/graphai/graphai-service'

/**
 * GraphAIツールクラス
 * GraphAIの機能をArmisのツールシステムに統合
 */
export class GraphAITools {
  private graphAIService: GraphAIService | null = null

  constructor() {
    // ブラウザ環境かどうかをチェック
    const isBrowser = typeof window !== 'undefined'
    
    if (!isBrowser) {
      try {
        this.graphAIService = new GraphAIService()
      } catch (error) {
        console.warn('GraphAI service not available:', error)
      }
    }
  }

  // テキスト処理ツール
  textProcessor: Tool = {
    name: 'graphaiTextProcessor',
    description: 'Process text using GraphAI with multiple operations like summarization, keyword extraction, and analysis',
    execute: async (args: Record<string, any>) => {
      const { text, operations = ['summarize', 'extract_keywords'] } = args
      
      if (!text) {
        return {
          success: false,
          error: 'Text is required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.processText(text, operations)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // マルチステップ推論ツール
  multiStepReasoner: Tool = {
    name: 'graphaiMultiStepReasoner',
    description: 'Perform multi-step reasoning using GraphAI with step-by-step analysis and conclusion',
    execute: async (args: Record<string, any>) => {
      const { question, context } = args
      
      if (!question) {
        return {
          success: false,
          error: 'Question is required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.multiStepReasoning(question, context)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // ドキュメント処理ツール
  documentProcessor: Tool = {
    name: 'graphaiDocumentProcessor',
    description: 'Process documents using GraphAI with operations like structure extraction, summarization, and question generation',
    execute: async (args: Record<string, any>) => {
      const { documentContent, operations = ['extract_structure', 'summarize', 'generate_questions'] } = args
      
      if (!documentContent) {
        return {
          success: false,
          error: 'Document content is required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.processDocument(documentContent, operations)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // コード生成ツール
  codeGenerator: Tool = {
    name: 'graphaiCodeGenerator',
    description: 'Generate code using GraphAI with planning, generation, and review steps',
    execute: async (args: Record<string, any>) => {
      const { requirements, language = 'typescript' } = args
      
      if (!requirements) {
        return {
          success: false,
          error: 'Requirements are required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.generateCode(requirements, language)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // データ分析ツール
  dataAnalyzer: Tool = {
    name: 'graphaiDataAnalyzer',
    description: 'Analyze data using GraphAI with insights extraction and recommendations',
    execute: async (args: Record<string, any>) => {
      const { data, analysisType = 'basic_statistics' } = args
      
      if (!data) {
        return {
          success: false,
          error: 'Data is required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.analyzeData(data, analysisType)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // カスタムワークフローツール
  customWorkflowExecutor: Tool = {
    name: 'graphaiCustomWorkflowExecutor',
    description: 'Execute custom GraphAI workflows with custom graph definitions',
    execute: async (args: Record<string, any>) => {
      const { workflowDefinition, inputs } = args
      
      if (!workflowDefinition) {
        return {
          success: false,
          error: 'Workflow definition is required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const result = await this.graphAIService.executeCustomWorkflow(workflowDefinition, inputs)
        
        return {
          success: result.success,
          result: result.result,
          error: result.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // ワークフロー状態取得ツール
  workflowStatusChecker: Tool = {
    name: 'graphaiWorkflowStatusChecker',
    description: 'Check the status of running GraphAI workflows',
    execute: async () => {
      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        const status = this.graphAIService.getWorkflowStatus()
        
        return {
          success: true,
          result: status,
          error: null
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // ワークフロー停止ツール
  workflowStopper: Tool = {
    name: 'graphaiWorkflowStopper',
    description: 'Stop running GraphAI workflows',
    execute: async () => {
      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        this.graphAIService.stopWorkflow()
        
        return {
          success: true,
          result: { message: 'Workflow stopped successfully' },
          error: null
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // エージェント情報取得ツール
  agentInfoGetter: Tool = {
    name: 'graphaiAgentInfoGetter',
    description: 'Get information about available GraphAI agents',
    execute: async (args: Record<string, any>) => {
      const { agentName } = args
      
      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        if (agentName) {
          const agentInfo = this.graphAIService.getAgentInfo(agentName)
          return {
            success: true,
            result: { agentName, agentInfo },
            error: null
          }
        } else {
          const availableAgents = this.graphAIService.getAvailableAgents()
          return {
            success: true,
            result: { availableAgents },
            error: null
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // 複合ワークフローツール（テキスト処理 + 推論）
  compositeTextReasoner: Tool = {
    name: 'graphaiCompositeTextReasoner',
    description: 'Process text and perform reasoning in a composite workflow',
    execute: async (args: Record<string, any>) => {
      const { text, question } = args
      
      if (!text || !question) {
        return {
          success: false,
          error: 'Both text and question are required',
          result: null
        }
      }

      if (!this.graphAIService) {
        return {
          success: false,
          error: 'GraphAI service is not available in browser environment',
          result: null
        }
      }

      try {
        // Step 1: Process text
        const textResult = await this.graphAIService.processText(text, ['summarize', 'extract_keywords'])
        
        if (!textResult.success) {
          return {
            success: false,
            error: `Text processing failed: ${textResult.error}`,
            result: null
          }
        }

        // Step 2: Perform reasoning with processed text as context
        const reasoningResult = await this.graphAIService.multiStepReasoning(
          question, 
          JSON.stringify(textResult.result)
        )
        
        return {
          success: reasoningResult.success,
          result: {
            textProcessing: textResult.result,
            reasoning: reasoningResult.result
          },
          error: reasoningResult.error
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          result: null
        }
      }
    }
  }

  // 利用可能なすべてのツールを取得
  getAllTools(): Tool[] {
    return [
      this.textProcessor,
      this.multiStepReasoner,
      this.documentProcessor,
      this.codeGenerator,
      this.dataAnalyzer,
      this.customWorkflowExecutor,
      this.workflowStatusChecker,
      this.workflowStopper,
      this.agentInfoGetter,
      this.compositeTextReasoner
    ]
  }
}
