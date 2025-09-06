import { BaseRetriever } from '@langchain/core/retrievers'
import { Document } from '@langchain/core/documents'

/**
 * Chain設定の型定義
 */
export interface ChainConfig {
  modelType: 'openai' | 'anthropic' | 'google'
  modelName?: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
}

/**
 * ルーター目的地の型定義
 */
export interface RouterDestination {
  name: string
  description: string
  promptTemplate: string
  chainType: string
}

/**
 * Chain実行結果の型定義
 */
export interface ChainResult {
  output: any
  executionTime: number
  chainType: string
  metadata?: Record<string, any>
}

/**
 * LLMChain設定の型定義
 */
export interface LLMChainConfig {
  promptTemplate: string
  chainName?: string
  inputVariables?: string[]
  outputVariables?: string[]
}

/**
 * シーケンシャルChain設定の型定義
 */
export interface SequentialChainConfig {
  chains: string[]
  inputVariables: string[]
  outputVariables: string[]
  chainName?: string
}

/**
 * ルーターChain設定の型定義
 */
export interface RouterChainConfig {
  destinations: RouterDestination[]
  defaultChain?: string
  chainName?: string
}

/**
 * RetrievalQAChain設定の型定義
 */
export interface RetrievalQAChainConfig {
  retriever: BaseRetriever
  chainName?: string
  returnSourceDocuments?: boolean
  returnGeneratedQuestion?: boolean
}

/**
 * ドキュメント処理Chain設定の型定義
 */
export interface DocumentProcessingChainConfig {
  promptTemplate: string
  refinePromptTemplate?: string
  mapPromptTemplate?: string
  combinePromptTemplate?: string
  chainType: 'stuff' | 'refine' | 'map_reduce'
  chainName?: string
}

/**
 * ConstitutionalChain設定の型定義
 */
export interface ConstitutionalChainConfig {
  principles: ConstitutionalPrincipleConfig[]
  chainName?: string
}

/**
 * Constitutional原則の型定義
 */
export interface ConstitutionalPrincipleConfig {
  name: string
  critiqueRequest: string
  revisionRequest: string
}

/**
 * APIChain設定の型定義
 */
export interface APIChainConfig {
  apiUrl: string
  apiHeaders?: Record<string, string>
  chainName?: string
}

/**
 * TransformChain設定の型定義
 */
export interface TransformChainConfig {
  transformFunction: (input: any) => any
  inputVariables: string[]
  outputVariables: string[]
  chainName?: string
}

/**
 * カスタムシーケンス設定の型定義
 */
export interface CustomSequenceConfig {
  steps: any[]
  chainName?: string
}

/**
 * 並列実行設定の型定義
 */
export interface ParallelExecutionConfig {
  chainInputs: Array<{
    chainName: string
    input: any
  }>
}

/**
 * Chain情報の型定義
 */
export interface ChainInfo {
  name: string
  type: string
  inputKeys: string[]
  outputKeys: string[]
  description?: string
}

/**
 * Chain実行オプションの型定義
 */
export interface ChainExecutionOptions {
  timeout?: number
  retries?: number
  callbacks?: any[]
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * Chain作成オプションの型定義
 */
export interface ChainCreationOptions {
  verbose?: boolean
  memory?: any
  callbacks?: any[]
  tags?: string[]
  metadata?: Record<string, any>
}

/**
 * ドキュメント入力の型定義
 */
export interface DocumentInput {
  documents: Document[]
  question?: string
  context?: Record<string, any>
}

/**
 * 質問応答入力の型定義
 */
export interface QAInput {
  question: string
  context?: Record<string, any>
  chatHistory?: Array<{
    question: string
    answer: string
  }>
}

/**
 * 会話入力の型定義
 */
export interface ConversationInput {
  input: string
  history?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * 翻訳入力の型定義
 */
export interface TranslationInput {
  text: string
  sourceLanguage?: string
  targetLanguage?: string
}

/**
 * 要約入力の型定義
 */
export interface SummarizationInput {
  text: string
  maxLength?: number
  style?: 'concise' | 'detailed' | 'bullet_points'
}

/**
 * 感情分析入力の型定義
 */
export interface SentimentAnalysisInput {
  text: string
  granularity?: 'binary' | 'ternary' | 'fine_grained'
}

/**
 * コード生成入力の型定義
 */
export interface CodeGenerationInput {
  description: string
  language: string
  requirements?: string[]
  context?: string
}

/**
 * 文書分析入力の型定義
 */
export interface DocumentAnalysisInput {
  documents: Document[]
  analysisType: 'summary' | 'extraction' | 'classification' | 'sentiment'
  criteria?: Record<string, any>
}

/**
 * Chain実行統計の型定義
 */
export interface ChainExecutionStats {
  totalExecutions: number
  averageExecutionTime: number
  successRate: number
  errorCount: number
  lastExecuted: Date
  mostUsedChains: Array<{
    chainName: string
    usageCount: number
  }>
}

/**
 * Chain監視設定の型定義
 */
export interface ChainMonitoringConfig {
  enableMetrics: boolean
  enableLogging: boolean
  enableTracing: boolean
  alertThresholds?: {
    executionTime: number
    errorRate: number
  }
}

/**
 * Chain最適化設定の型定義
 */
export interface ChainOptimizationConfig {
  enableCaching: boolean
  cacheTTL: number
  enableParallelization: boolean
  maxConcurrentExecutions: number
  enableStreaming: boolean
}

/**
 * Chainセキュリティ設定の型定義
 */
export interface ChainSecurityConfig {
  enableInputValidation: boolean
  enableOutputSanitization: boolean
  allowedDomains?: string[]
  blockedKeywords?: string[]
  maxInputLength: number
  maxOutputLength: number
}
