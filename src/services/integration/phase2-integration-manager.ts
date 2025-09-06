import { LlamaService } from '@/services/llm/llama-service'
import { HaystackDocumentService } from '@/services/document/haystack-document-service'
import { EnhancedVectorDatabase } from '@/services/vector/enhanced-vector-database'
import { LangGraphWorkflowManager, WorkflowState } from '@/services/workflow/langgraph-workflow-manager'
import { RAGFromScratchService } from '@/services/rag/rag-from-scratch-service'
import { DifyWorkflowConfig, DifyWorkflowExecution } from '@/components/ui/dify-enhanced-ui'

export interface Phase2IntegrationConfig {
  enableLangGraph: boolean
  enableDify: boolean
  enableRAGFromScratch: boolean
  openAIApiKey?: string
  workflowTimeout: number
  maxConcurrentWorkflows: number
}

export interface Phase2IntegrationStatus {
  langGraph: {
    enabled: boolean
    initialized: boolean
    workflowsCount: number
    activeExecutions: number
  }
  dify: {
    enabled: boolean
    initialized: boolean
    workflowsCount: number
    templatesCount: number
  }
  ragFromScratch: {
    enabled: boolean
    initialized: boolean
    documentsCount: number
    structuresExtracted: number
  }
}

export class Phase2IntegrationManager {
  private llamaService: LlamaService
  private haystackService: HaystackDocumentService | null = null
  private enhancedVectorDB: EnhancedVectorDatabase | null = null
  private config: Phase2IntegrationConfig
  private langGraphManager: LangGraphWorkflowManager | null = null
  private ragFromScratchService: RAGFromScratchService | null = null
  private difyWorkflows: Map<string, DifyWorkflowConfig> = new Map()
  private activeExecutions: Map<string, DifyWorkflowExecution> = new Map()
  private isInitialized = false

  constructor(
    llamaService: LlamaService,
    haystackService: HaystackDocumentService | null,
    enhancedVectorDB: EnhancedVectorDatabase | null,
    config: Phase2IntegrationConfig
  ) {
    this.llamaService = llamaService
    this.haystackService = haystackService
    this.enhancedVectorDB = enhancedVectorDB
    this.config = config
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Phase 2 integration manager...')

      // LangGraphワークフローマネージャーの初期化
      if (this.config.enableLangGraph) {
        await this.initializeLangGraphManager()
      }

      // RAG from Scratchサービスの初期化
      if (this.config.enableRAGFromScratch) {
        await this.initializeRAGFromScratchService()
      }

      // Difyワークフローの初期化
      if (this.config.enableDify) {
        await this.initializeDifyWorkflows()
      }

      this.isInitialized = true
      console.log('Phase 2 integration manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Phase 2 integration manager:', error)
      throw error
    }
  }

  private async initializeLangGraphManager(): Promise<void> {
    this.langGraphManager = new LangGraphWorkflowManager(
      this.llamaService,
      this.haystackService,
      this.enhancedVectorDB
    )
    await this.langGraphManager.initialize()
    console.log('LangGraph workflow manager initialized')
  }

  private async initializeRAGFromScratchService(): Promise<void> {
    this.ragFromScratchService = new RAGFromScratchService(this.llamaService)
    await this.ragFromScratchService.initialize()
    console.log('RAG from Scratch service initialized')
  }

  private async initializeDifyWorkflows(): Promise<void> {
    // 基本的なDifyワークフローテンプレートを作成
    const documentAnalysisWorkflow: DifyWorkflowConfig = {
      id: 'dify_doc_analysis',
      name: 'ドキュメント分析ワークフロー',
      description: 'ドキュメントの構造分析と要約を実行するワークフロー',
      steps: [
        {
          id: 'step_1',
          name: 'ドキュメント入力',
          type: 'llm',
          config: { input_type: 'document' },
          position: { x: 100, y: 100 },
          connections: ['step_2']
        },
        {
          id: 'step_2',
          name: '構造抽出',
          type: 'tool',
          config: { tool: 'structure_extraction' },
          position: { x: 300, y: 100 },
          connections: ['step_3']
        },
        {
          id: 'step_3',
          name: '要約生成',
          type: 'llm',
          config: { model: 'gpt-4', task: 'summarization' },
          position: { x: 500, y: 100 },
          connections: []
        }
      ],
      variables: [
        {
          name: 'document_content',
          type: 'string',
          description: '分析対象のドキュメント',
          required: true
        },
        {
          name: 'analysis_type',
          type: 'string',
          description: '分析タイプ（structure, summary, both）',
          required: false,
          defaultValue: 'both'
        }
      ],
      triggers: [
        {
          type: 'manual',
          config: { trigger_name: 'manual_analysis' }
        }
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const qaWorkflow: DifyWorkflowConfig = {
      id: 'dify_qa_system',
      name: '質問応答システム',
      description: 'ドキュメントベースの質問応答を実行するワークフロー',
      steps: [
        {
          id: 'step_1',
          name: '質問入力',
          type: 'llm',
          config: { input_type: 'question' },
          position: { x: 100, y: 100 },
          connections: ['step_2']
        },
        {
          id: 'step_2',
          name: '関連文書検索',
          type: 'tool',
          config: { tool: 'document_search' },
          position: { x: 300, y: 100 },
          connections: ['step_3']
        },
        {
          id: 'step_3',
          name: '回答生成',
          type: 'llm',
          config: { model: 'gpt-4', task: 'question_answering' },
          position: { x: 500, y: 100 },
          connections: []
        }
      ],
      variables: [
        {
          name: 'question',
          type: 'string',
          description: '質問内容',
          required: true
        },
        {
          name: 'context_documents',
          type: 'array',
          description: '関連ドキュメント',
          required: false
        }
      ],
      triggers: [
        {
          type: 'manual',
          config: { trigger_name: 'manual_qa' }
        }
      ],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.difyWorkflows.set(documentAnalysisWorkflow.id, documentAnalysisWorkflow)
    this.difyWorkflows.set(qaWorkflow.id, qaWorkflow)

    console.log('Dify workflows initialized')
  }

  // LangGraphワークフロー実行
  async executeLangGraphWorkflow(workflowName: string, input: string): Promise<WorkflowState> {
    if (!this.isInitialized) {
      throw new Error('Phase 2 integration manager not initialized')
    }

    if (!this.langGraphManager) {
      throw new Error('LangGraph manager not available')
    }

    return await this.langGraphManager.executeWorkflow(workflowName, input)
  }

  // RAG from Scratch構造抽出
  async extractStructureWithRAG(content: string, metadata?: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Phase 2 integration manager not initialized')
    }

    if (!this.ragFromScratchService) {
      throw new Error('RAG from Scratch service not available')
    }

    // ドキュメントを追加
    const docId = await this.ragFromScratchService.addDocument(content, metadata)
    
    // 構造抽出を実行
    return await this.ragFromScratchService.extractStructureFromDocument(docId)
  }

  // RAG from Scratch検索
  async searchWithRAG(query: string, documentId?: string, limit: number = 10): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Phase 2 integration manager not initialized')
    }

    if (!this.ragFromScratchService) {
      throw new Error('RAG from Scratch service not available')
    }

    return await this.ragFromScratchService.search(query, documentId, limit)
  }

  // Difyワークフロー実行
  async executeDifyWorkflow(workflowId: string, variables: Record<string, any>): Promise<DifyWorkflowExecution> {
    if (!this.isInitialized) {
      throw new Error('Phase 2 integration manager not initialized')
    }

    const workflow = this.difyWorkflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Dify workflow ${workflowId} not found`)
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const execution: DifyWorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      currentStep: '',
      progress: 0,
      startTime: new Date().toISOString(),
      logs: []
    }

    this.activeExecutions.set(executionId, execution)

    try {
      // ワークフローの実行をシミュレート
      await this.simulateDifyWorkflowExecution(execution, workflow, variables)
      
      execution.status = 'completed'
      execution.progress = 100
      execution.endTime = new Date().toISOString()
      
      return execution
    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      execution.endTime = new Date().toISOString()
      
      throw error
    } finally {
      this.activeExecutions.delete(executionId)
    }
  }

  private async simulateDifyWorkflowExecution(
    execution: DifyWorkflowExecution,
    workflow: DifyWorkflowConfig,
    variables: Record<string, any>
  ): Promise<void> {
    const totalSteps = workflow.steps.length
    
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]
      
      // 実行状態を更新
      execution.currentStep = step.name
      execution.progress = ((i + 1) / totalSteps) * 100
      
      // ログを追加
      execution.logs.push({
        timestamp: new Date().toISOString(),
        step: step.id,
        level: 'info',
        message: `ステップ "${step.name}" を実行中...`
      })

      // ステップの実行をシミュレート
      await this.executeDifyStep(step, variables, execution)
      
      // 少し待機してリアルタイム感を演出
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // 結果を生成
    execution.result = {
      workflow_id: workflow.id,
      variables,
      steps_completed: workflow.steps.length,
      execution_time: Date.now() - new Date(execution.startTime).getTime()
    }
  }

  private async executeDifyStep(
    step: any,
    variables: Record<string, any>,
    execution: DifyWorkflowExecution
  ): Promise<void> {
    switch (step.type) {
      case 'llm':
        // LLMステップの実行
        if (this.haystackService) {
          if (step.config.input_type === 'document') {
            const analysis = await this.haystackService.analyzeDocument(
              variables.document_content || '',
              { step: step.name }
            )
            variables.analysis_result = analysis
          } else if (step.config.input_type === 'question') {
            const qaResult = await this.haystackService.answerQuestion(
              variables.question || '',
              variables.context_documents?.join('\n')
            )
            variables.qa_result = qaResult
          }
        }
        break

      case 'tool':
        // ツールステップの実行
        if (step.config.tool === 'structure_extraction' && this.ragFromScratchService) {
          const structureResult = await this.extractStructureWithRAG(
            variables.document_content || '',
            { step: step.name }
          )
          variables.structure_result = structureResult
        } else if (step.config.tool === 'document_search' && this.ragFromScratchService) {
          const searchResults = await this.searchWithRAG(
            variables.question || '',
            undefined,
            5
          )
          variables.search_results = searchResults
        }
        break

      default:
        // その他のステップタイプ
        execution.logs.push({
          timestamp: new Date().toISOString(),
          step: step.id,
          level: 'info',
          message: `ステップタイプ "${step.type}" を処理中...`
        })
    }

    // 成功ログを追加
    execution.logs.push({
      timestamp: new Date().toISOString(),
      step: step.id,
      level: 'success',
      message: `ステップ "${step.name}" が正常に完了しました`
    })
  }

  // 統合ワークフロー実行
  async executeIntegratedWorkflow(
    workflowType: 'document_analysis' | 'qa_system' | 'structure_extraction',
    input: string,
    options?: Record<string, any>
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Phase 2 integration manager not initialized')
    }

    try {
      switch (workflowType) {
        case 'document_analysis':
          return await this.executeDocumentAnalysisWorkflow(input, options)
        
        case 'qa_system':
          return await this.executeQASystemWorkflow(input, options)
        
        case 'structure_extraction':
          return await this.executeStructureExtractionWorkflow(input, options)
        
        default:
          throw new Error(`Unknown workflow type: ${workflowType}`)
      }
    } catch (error) {
      console.error(`Integrated workflow execution error: ${error}`)
      throw error
    }
  }

  private async executeDocumentAnalysisWorkflow(input: string, options?: Record<string, any>): Promise<any> {
    const results = {}

    // LangGraphワークフロー実行
    if (this.langGraphManager) {
      try {
        const langGraphResult = await this.langGraphManager.executeWorkflow('document_analysis', input)
        results['langgraph'] = langGraphResult
      } catch (error) {
        console.warn('LangGraph workflow execution failed:', error)
      }
    }

    // RAG from Scratch構造抽出
    if (this.ragFromScratchService) {
      try {
        const ragResult = await this.extractStructureWithRAG(input, options)
        results['rag_structure'] = ragResult
      } catch (error) {
        console.warn('RAG structure extraction failed:', error)
      }
    }

    // Difyワークフロー実行
    try {
      const difyResult = await this.executeDifyWorkflow('dify_doc_analysis', {
        document_content: input,
        analysis_type: options?.analysis_type || 'both'
      })
      results['dify'] = difyResult
    } catch (error) {
      console.warn('Dify workflow execution failed:', error)
    }

    return {
      workflow_type: 'document_analysis',
      input,
      results,
      timestamp: new Date().toISOString()
    }
  }

  private async executeQASystemWorkflow(input: string, options?: Record<string, any>): Promise<any> {
    const results = {}

    // LangGraphワークフロー実行
    if (this.langGraphManager) {
      try {
        const langGraphResult = await this.langGraphManager.executeWorkflow('integrated_processing', input)
        results['langgraph'] = langGraphResult
      } catch (error) {
        console.warn('LangGraph workflow execution failed:', error)
      }
    }

    // RAG from Scratch検索
    if (this.ragFromScratchService) {
      try {
        const searchResults = await this.searchWithRAG(input, undefined, 10)
        results['rag_search'] = searchResults
      } catch (error) {
        console.warn('RAG search failed:', error)
      }
    }

    // Difyワークフロー実行
    try {
      const difyResult = await this.executeDifyWorkflow('dify_qa_system', {
        question: input,
        context_documents: options?.context_documents || []
      })
      results['dify'] = difyResult
    } catch (error) {
      console.warn('Dify workflow execution failed:', error)
    }

    return {
      workflow_type: 'qa_system',
      input,
      results,
      timestamp: new Date().toISOString()
    }
  }

  private async executeStructureExtractionWorkflow(input: string, options?: Record<string, any>): Promise<any> {
    const results = {}

    // LangGraphワークフロー実行
    if (this.langGraphManager) {
      try {
        const langGraphResult = await this.langGraphManager.executeWorkflow('structure_extraction', input)
        results['langgraph'] = langGraphResult
      } catch (error) {
        console.warn('LangGraph workflow execution failed:', error)
      }
    }

    // RAG from Scratch構造抽出
    if (this.ragFromScratchService) {
      try {
        const ragResult = await this.extractStructureWithRAG(input, options)
        results['rag_structure'] = ragResult
      } catch (error) {
        console.warn('RAG structure extraction failed:', error)
      }
    }

    return {
      workflow_type: 'structure_extraction',
      input,
      results,
      timestamp: new Date().toISOString()
    }
  }

  // 統計情報の取得
  async getStatus(): Promise<Phase2IntegrationStatus> {
    const status: Phase2IntegrationStatus = {
      langGraph: {
        enabled: this.config.enableLangGraph,
        initialized: !!this.langGraphManager,
        workflowsCount: this.langGraphManager ? this.langGraphManager.getAvailableWorkflows().length : 0,
        activeExecutions: this.activeExecutions.size
      },
      dify: {
        enabled: this.config.enableDify,
        initialized: this.difyWorkflows.size > 0,
        workflowsCount: this.difyWorkflows.size,
        templatesCount: 2 // 基本テンプレート数
      },
      ragFromScratch: {
        enabled: this.config.enableRAGFromScratch,
        initialized: !!this.ragFromScratchService,
        documentsCount: this.ragFromScratchService ? this.ragFromScratchService.getAllDocuments().length : 0,
        structuresExtracted: 0 // 実装に応じて計算
      }
    }

    return status
  }

  // Difyワークフローの管理
  getDifyWorkflows(): DifyWorkflowConfig[] {
    return Array.from(this.difyWorkflows.values())
  }

  getDifyWorkflow(workflowId: string): DifyWorkflowConfig | null {
    return this.difyWorkflows.get(workflowId) || null
  }

  saveDifyWorkflow(workflow: DifyWorkflowConfig): void {
    this.difyWorkflows.set(workflow.id, workflow)
  }

  deleteDifyWorkflow(workflowId: string): void {
    this.difyWorkflows.delete(workflowId)
  }

  // 設定の更新
  updateConfig(newConfig: Partial<Phase2IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Phase 2 integration config updated:', this.config)
  }

  // サービスの取得
  getLangGraphManager(): LangGraphWorkflowManager | null {
    return this.langGraphManager
  }

  getRAGFromScratchService(): RAGFromScratchService | null {
    return this.ragFromScratchService
  }

  // クリーンアップ
  async cleanup(): Promise<void> {
    console.log('Cleaning up Phase 2 integration manager...')
    
    // アクティブな実行を停止
    this.activeExecutions.clear()

    // 各サービスのクリーンアップ
    if (this.ragFromScratchService) {
      try {
        this.ragFromScratchService.clearDocuments()
      } catch (error) {
        console.warn('Failed to cleanup RAG from Scratch service:', error)
      }
    }

    this.isInitialized = false
    console.log('Phase 2 integration manager cleanup completed')
  }
}
