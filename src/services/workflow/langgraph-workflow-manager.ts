import { 
  StateGraph, 
  END, 
  START,
  StateGraphArgs,
  StateGraphConfig
} from '@langchain/langgraph'
import { 
  ChatOpenAI, 
  HumanMessage, 
  SystemMessage 
} from '@langchain/openai'
import { 
  PromptTemplate 
} from '@langchain/core/prompts'
import { 
  StructuredOutputParser 
} from '@langchain/core/output_parsers'
import { z } from 'zod'
import { LlamaService } from '@/services/llm/llama-service'
import { HaystackDocumentService } from '@/services/document/haystack-document-service'
import { EnhancedVectorDatabase } from '@/services/vector/enhanced-vector-database'

// ワークフロー状態の定義
export interface WorkflowState {
  input: string
  current_step: string
  document_content?: string
  analysis_result?: any
  search_results?: any[]
  qa_result?: any
  extracted_structure?: any
  final_output?: string
  error?: string
  metadata: {
    workflow_id: string
    start_time: string
    steps_completed: string[]
    confidence_scores: Record<string, number>
  }
}

// ワークフローノードの定義
export interface WorkflowNode {
  name: string
  description: string
  input_schema: z.ZodSchema
  output_schema: z.ZodSchema
  execute: (state: WorkflowState) => Promise<Partial<WorkflowState>>
}

// ワークフロー設定
export interface WorkflowConfig {
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: Array<{
    from: string
    to: string
    condition?: (state: WorkflowState) => boolean
  }>
  max_steps: number
  timeout: number
}

export class LangGraphWorkflowManager {
  private llamaService: LlamaService
  private haystackService: HaystackDocumentService | null = null
  private enhancedVectorDB: EnhancedVectorDatabase | null = null
  private langchainLLM: ChatOpenAI | null = null
  private workflows: Map<string, StateGraph<WorkflowState>> = new Map()
  private isInitialized = false

  constructor(
    llamaService: LlamaService,
    haystackService?: HaystackDocumentService,
    enhancedVectorDB?: EnhancedVectorDatabase
  ) {
    this.llamaService = llamaService
    this.haystackService = haystackService || null
    this.enhancedVectorDB = enhancedVectorDB || null
    this.initializeLangChainLLM()
  }

  private async initializeLangChainLLM() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.langchainLLM = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'gpt-4',
          temperature: 0.1
        })
      }
    } catch (error) {
      console.warn('LangChain LLM initialization failed:', error)
    }
  }

  async initialize(): Promise<void> {
    try {
      // 基本的なワークフローを初期化
      await this.initializeBasicWorkflows()
      this.isInitialized = true
      console.log('LangGraph workflow manager initialized')
    } catch (error) {
      console.error('Failed to initialize LangGraph workflow manager:', error)
      throw error
    }
  }

  private async initializeBasicWorkflows(): Promise<void> {
    // ドキュメント分析ワークフロー
    const documentAnalysisWorkflow = await this.createDocumentAnalysisWorkflow()
    this.workflows.set('document_analysis', documentAnalysisWorkflow)

    // 構造抽出ワークフロー
    const structureExtractionWorkflow = await this.createStructureExtractionWorkflow()
    this.workflows.set('structure_extraction', structureExtractionWorkflow)

    // 統合処理ワークフロー
    const integratedProcessingWorkflow = await this.createIntegratedProcessingWorkflow()
    this.workflows.set('integrated_processing', integratedProcessingWorkflow)

    console.log('Basic workflows initialized')
  }

  private async createDocumentAnalysisWorkflow(): Promise<StateGraph<WorkflowState>> {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        input: { value: "" },
        current_step: { value: "" },
        document_content: { value: undefined },
        analysis_result: { value: undefined },
        error: { value: undefined },
        metadata: { value: { workflow_id: "", start_time: "", steps_completed: [], confidence_scores: {} } }
      }
    })

    // ノードの定義
    workflow.addNode("input_validation", this.createInputValidationNode())
    workflow.addNode("document_analysis", this.createDocumentAnalysisNode())
    workflow.addNode("result_formatting", this.createResultFormattingNode())
    workflow.addNode("error_handling", this.createErrorHandlingNode())

    // エッジの定義
    workflow.addEdge(START, "input_validation")
    workflow.addConditionalEdges(
      "input_validation",
      (state) => state.error ? "error_handling" : "document_analysis"
    )
    workflow.addConditionalEdges(
      "document_analysis",
      (state) => state.error ? "error_handling" : "result_formatting"
    )
    workflow.addEdge("result_formatting", END)
    workflow.addEdge("error_handling", END)

    return workflow.compile()
  }

  private async createStructureExtractionWorkflow(): Promise<StateGraph<WorkflowState>> {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        input: { value: "" },
        current_step: { value: "" },
        document_content: { value: undefined },
        extracted_structure: { value: undefined },
        final_output: { value: undefined },
        error: { value: undefined },
        metadata: { value: { workflow_id: "", start_time: "", steps_completed: [], confidence_scores: {} } }
      }
    })

    // ノードの定義
    workflow.addNode("content_preprocessing", this.createContentPreprocessingNode())
    workflow.addNode("structure_analysis", this.createStructureAnalysisNode())
    workflow.addNode("pattern_extraction", this.createPatternExtractionNode())
    workflow.addNode("structure_validation", this.createStructureValidationNode())

    // エッジの定義
    workflow.addEdge(START, "content_preprocessing")
    workflow.addEdge("content_preprocessing", "structure_analysis")
    workflow.addEdge("structure_analysis", "pattern_extraction")
    workflow.addEdge("pattern_extraction", "structure_validation")
    workflow.addEdge("structure_validation", END)

    return workflow.compile()
  }

  private async createIntegratedProcessingWorkflow(): Promise<StateGraph<WorkflowState>> {
    const workflow = new StateGraph<WorkflowState>({
      channels: {
        input: { value: "" },
        current_step: { value: "" },
        document_content: { value: undefined },
        analysis_result: { value: undefined },
        search_results: { value: undefined },
        qa_result: { value: undefined },
        extracted_structure: { value: undefined },
        final_output: { value: undefined },
        error: { value: undefined },
        metadata: { value: { workflow_id: "", start_time: "", steps_completed: [], confidence_scores: {} } }
      }
    })

    // ノードの定義
    workflow.addNode("initial_analysis", this.createInitialAnalysisNode())
    workflow.addNode("enhanced_search", this.createEnhancedSearchNode())
    workflow.addNode("qa_processing", this.createQAProcessingNode())
    workflow.addNode("structure_extraction", this.createStructureExtractionNode())
    workflow.addNode("synthesis", this.createSynthesisNode())

    // エッジの定義
    workflow.addEdge(START, "initial_analysis")
    workflow.addEdge("initial_analysis", "enhanced_search")
    workflow.addEdge("enhanced_search", "qa_processing")
    workflow.addEdge("qa_processing", "structure_extraction")
    workflow.addEdge("structure_extraction", "synthesis")
    workflow.addEdge("synthesis", END)

    return workflow.compile()
  }

  // ノード作成メソッド
  private createInputValidationNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!state.input || state.input.trim().length === 0) {
          return {
            error: "入力が空です",
            current_step: "input_validation"
          }
        }

        return {
          current_step: "input_validation",
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "input_validation"],
            confidence_scores: { ...state.metadata.confidence_scores, input_validation: 1.0 }
          }
        }
      } catch (error) {
        return {
          error: `入力検証エラー: ${error}`,
          current_step: "input_validation"
        }
      }
    }
  }

  private createDocumentAnalysisNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!this.haystackService) {
          throw new Error("Haystack service not available")
        }

        const analysisResult = await this.haystackService.analyzeDocument(state.input, {
          workflow_step: "document_analysis",
          source: "langgraph_workflow"
        })

        return {
          current_step: "document_analysis",
          analysis_result: analysisResult,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "document_analysis"],
            confidence_scores: { ...state.metadata.confidence_scores, document_analysis: 0.9 }
          }
        }
      } catch (error) {
        return {
          error: `ドキュメント分析エラー: ${error}`,
          current_step: "document_analysis"
        }
      }
    }
  }

  private createResultFormattingNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        const formattedResult = {
          summary: state.analysis_result?.summary || "要約なし",
          sentiment: state.analysis_result?.sentiment || { label: "neutral", score: 0 },
          keywords: state.analysis_result?.keywords || [],
          entities: state.analysis_result?.entities || [],
          topics: state.analysis_result?.topics || []
        }

        return {
          current_step: "result_formatting",
          final_output: JSON.stringify(formattedResult, null, 2),
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "result_formatting"],
            confidence_scores: { ...state.metadata.confidence_scores, result_formatting: 1.0 }
          }
        }
      } catch (error) {
        return {
          error: `結果フォーマットエラー: ${error}`,
          current_step: "result_formatting"
        }
      }
    }
  }

  private createErrorHandlingNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      return {
        current_step: "error_handling",
        final_output: `エラーが発生しました: ${state.error}`,
        metadata: {
          ...state.metadata,
          steps_completed: [...state.metadata.steps_completed, "error_handling"],
          confidence_scores: { ...state.metadata.confidence_scores, error_handling: 0.0 }
        }
      }
    }
  }

  private createContentPreprocessingNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        // コンテンツの前処理
        const preprocessedContent = state.input
          .replace(/\s+/g, ' ')
          .trim()
          .split('\n')
          .filter(line => line.trim().length > 0)
          .join('\n')

        return {
          current_step: "content_preprocessing",
          document_content: preprocessedContent,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "content_preprocessing"],
            confidence_scores: { ...state.metadata.confidence_scores, content_preprocessing: 1.0 }
          }
        }
      } catch (error) {
        return {
          error: `コンテンツ前処理エラー: ${error}`,
          current_step: "content_preprocessing"
        }
      }
    }
  }

  private createStructureAnalysisNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!this.langchainLLM) {
          throw new Error("LangChain LLM not available")
        }

        const prompt = PromptTemplate.fromTemplate(`
以下のテキストの構造を分析し、JSON形式で返してください。

テキスト:
{content}

分析すべき構造要素:
- セクション（見出し、段落）
- リスト（箇条書き、番号付きリスト）
- テーブル構造
- 階層関係
- 重要なキーワードやフレーズ

JSON形式で返してください:
        `)

        const outputParser = StructuredOutputParser.fromZodSchema(z.object({
          sections: z.array(z.object({
            title: z.string(),
            content: z.string(),
            level: z.number()
          })),
          lists: z.array(z.object({
            type: z.string(),
            items: z.array(z.string())
          })),
          keywords: z.array(z.string()),
          structure_type: z.string()
        }))

        const chain = prompt.pipe(this.langchainLLM).pipe(outputParser)
        const result = await chain.invoke({ content: state.document_content })

        return {
          current_step: "structure_analysis",
          extracted_structure: result,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "structure_analysis"],
            confidence_scores: { ...state.metadata.confidence_scores, structure_analysis: 0.8 }
          }
        }
      } catch (error) {
        return {
          error: `構造分析エラー: ${error}`,
          current_step: "structure_analysis"
        }
      }
    }
  }

  private createPatternExtractionNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        // パターン抽出の実装
        const patterns = {
          repeated_phrases: this.extractRepeatedPhrases(state.document_content || ""),
          structural_patterns: this.extractStructuralPatterns(state.document_content || ""),
          semantic_patterns: this.extractSemanticPatterns(state.document_content || "")
        }

        return {
          current_step: "pattern_extraction",
          extracted_structure: {
            ...state.extracted_structure,
            patterns
          },
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "pattern_extraction"],
            confidence_scores: { ...state.metadata.confidence_scores, pattern_extraction: 0.7 }
          }
        }
      } catch (error) {
        return {
          error: `パターン抽出エラー: ${error}`,
          current_step: "pattern_extraction"
        }
      }
    }
  }

  private createStructureValidationNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        // 構造の妥当性検証
        const validation = {
          is_valid: true,
          confidence: 0.8,
          issues: [],
          suggestions: []
        }

        if (state.extracted_structure) {
          // 構造の妥当性をチェック
          if (!state.extracted_structure.sections || state.extracted_structure.sections.length === 0) {
            validation.issues.push("セクションが見つかりません")
            validation.is_valid = false
          }

          if (!state.extracted_structure.keywords || state.extracted_structure.keywords.length === 0) {
            validation.suggestions.push("キーワードの抽出を改善することを推奨します")
          }
        }

        return {
          current_step: "structure_validation",
          final_output: JSON.stringify({
            structure: state.extracted_structure,
            validation
          }, null, 2),
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "structure_validation"],
            confidence_scores: { ...state.metadata.confidence_scores, structure_validation: validation.confidence }
          }
        }
      } catch (error) {
        return {
          error: `構造検証エラー: ${error}`,
          current_step: "structure_validation"
        }
      }
    }
  }

  private createInitialAnalysisNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!this.haystackService) {
          throw new Error("Haystack service not available")
        }

        const analysisResult = await this.haystackService.analyzeDocument(state.input, {
          workflow_step: "initial_analysis",
          source: "integrated_workflow"
        })

        return {
          current_step: "initial_analysis",
          analysis_result: analysisResult,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "initial_analysis"],
            confidence_scores: { ...state.metadata.confidence_scores, initial_analysis: 0.9 }
          }
        }
      } catch (error) {
        return {
          error: `初期分析エラー: ${error}`,
          current_step: "initial_analysis"
        }
      }
    }
  }

  private createEnhancedSearchNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!this.enhancedVectorDB) {
          throw new Error("Enhanced vector database not available")
        }

        const searchQuery = {
          text: state.input,
          filters: {
            topics: state.analysis_result?.topics || [],
            language: state.analysis_result?.language || 'ja'
          },
          weights: {
            semantic: 0.4,
            keyword: 0.3,
            topic: 0.2,
            entity: 0.1
          }
        }

        const searchResults = await this.enhancedVectorDB.enhancedSearch(searchQuery)

        return {
          current_step: "enhanced_search",
          search_results: searchResults,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "enhanced_search"],
            confidence_scores: { ...state.metadata.confidence_scores, enhanced_search: 0.8 }
          }
        }
      } catch (error) {
        return {
          error: `拡張検索エラー: ${error}`,
          current_step: "enhanced_search"
        }
      }
    }
  }

  private createQAProcessingNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        if (!this.haystackService) {
          throw new Error("Haystack service not available")
        }

        const question = `このドキュメントの主要なポイントは何ですか？`
        const qaResult = await this.haystackService.answerQuestion(question, state.input)

        return {
          current_step: "qa_processing",
          qa_result: qaResult,
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "qa_processing"],
            confidence_scores: { ...state.metadata.confidence_scores, qa_processing: qaResult.confidence }
          }
        }
      } catch (error) {
        return {
          error: `QA処理エラー: ${error}`,
          current_step: "qa_processing"
        }
      }
    }
  }

  private createSynthesisNode() {
    return async (state: WorkflowState): Promise<Partial<WorkflowState>> => {
      try {
        const synthesis = {
          analysis_summary: state.analysis_result?.summary,
          key_insights: state.qa_result?.answer,
          related_documents: state.search_results?.length || 0,
          confidence: this.calculateOverallConfidence(state.metadata.confidence_scores),
          recommendations: this.generateRecommendations(state)
        }

        return {
          current_step: "synthesis",
          final_output: JSON.stringify(synthesis, null, 2),
          metadata: {
            ...state.metadata,
            steps_completed: [...state.metadata.steps_completed, "synthesis"],
            confidence_scores: { ...state.metadata.confidence_scores, synthesis: 0.9 }
          }
        }
      } catch (error) {
        return {
          error: `統合エラー: ${error}`,
          current_step: "synthesis"
        }
      }
    }
  }

  // ユーティリティメソッド
  private extractRepeatedPhrases(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/)
    const wordCount = new Map<string, number>()
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })

    return Array.from(wordCount.entries())
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  private extractStructuralPatterns(content: string): any {
    const patterns = {
      headings: content.match(/^#{1,6}\s+.+$/gm) || [],
      lists: content.match(/^[\s]*[-*+]\s+.+$/gm) || [],
      numbered_lists: content.match(/^[\s]*\d+\.\s+.+$/gm) || [],
      paragraphs: content.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    }

    return patterns
  }

  private extractSemanticPatterns(content: string): any {
    // セマンティックパターンの抽出（簡易実装）
    return {
      technical_terms: content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [],
      definitions: content.match(/(?:とは|とは、|とは。|is|are|means)/g) || [],
      examples: content.match(/(?:例|例文|example|for example)/g) || []
    }
  }

  private calculateOverallConfidence(confidenceScores: Record<string, number>): number {
    const scores = Object.values(confidenceScores)
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }

  private generateRecommendations(state: WorkflowState): string[] {
    const recommendations = []

    if (state.analysis_result?.sentiment?.score < 0) {
      recommendations.push("ネガティブな感情が検出されました。内容の改善を検討してください。")
    }

    if (state.search_results && state.search_results.length < 3) {
      recommendations.push("関連ドキュメントが少ないため、より詳細な情報の追加を推奨します。")
    }

    if (state.qa_result && state.qa_result.confidence < 0.7) {
      recommendations.push("質問応答の信頼度が低いため、内容の明確化を推奨します。")
    }

    return recommendations
  }

  // 公開API
  async executeWorkflow(workflowName: string, input: string): Promise<WorkflowState> {
    if (!this.isInitialized) {
      throw new Error('Workflow manager not initialized')
    }

    const workflow = this.workflows.get(workflowName)
    if (!workflow) {
      throw new Error(`Workflow '${workflowName}' not found`)
    }

    const initialState: WorkflowState = {
      input,
      current_step: "start",
      metadata: {
        workflow_id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        start_time: new Date().toISOString(),
        steps_completed: [],
        confidence_scores: {}
      }
    }

    try {
      const result = await workflow.invoke(initialState)
      return result
    } catch (error) {
      console.error(`Workflow execution error: ${error}`)
      throw error
    }
  }

  async createCustomWorkflow(config: WorkflowConfig): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Workflow manager not initialized')
    }

    const workflow = new StateGraph<WorkflowState>({
      channels: {
        input: { value: "" },
        current_step: { value: "" },
        document_content: { value: undefined },
        analysis_result: { value: undefined },
        search_results: { value: undefined },
        qa_result: { value: undefined },
        extracted_structure: { value: undefined },
        final_output: { value: undefined },
        error: { value: undefined },
        metadata: { value: { workflow_id: "", start_time: "", steps_completed: [], confidence_scores: {} } }
      }
    })

    // ノードの追加
    config.nodes.forEach(node => {
      workflow.addNode(node.name, node.execute)
    })

    // エッジの追加
    config.edges.forEach(edge => {
      if (edge.condition) {
        workflow.addConditionalEdges(edge.from, edge.to, edge.condition)
      } else {
        workflow.addEdge(edge.from, edge.to)
      }
    })

    const compiledWorkflow = workflow.compile()
    this.workflows.set(config.name, compiledWorkflow)

    return config.name
  }

  getAvailableWorkflows(): string[] {
    return Array.from(this.workflows.keys())
  }

  getWorkflowStatus(workflowName: string): any {
    const workflow = this.workflows.get(workflowName)
    if (!workflow) {
      return null
    }

    return {
      name: workflowName,
      available: true,
      node_count: workflow.nodes.length,
      compiled: true
    }
  }
}
