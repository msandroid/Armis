import { LlamaService } from '@/services/llm/llama-service'
import { HaystackDocumentService } from '@/services/document/haystack-document-service'
import { EnhancedVectorDatabase } from '@/services/vector/enhanced-vector-database'
import { Phase2IntegrationManager, Phase2IntegrationConfig } from '@/services/integration/phase2-integration-manager'

/**
 * Phase 2統合の使用例
 * 
 * このファイルは、LangGraph、Dify、RAG from Scratchの統合機能を
 * 実際に使用する方法を示しています。
 */

async function phase2IntegrationExample() {
  console.log('=== Phase 2 Integration Example ===')

  // 1. 設定の準備
  const config: Phase2IntegrationConfig = {
    enableLangGraph: true,
    enableDify: true,
    enableRAGFromScratch: true,
    workflowTimeout: 30000,
    maxConcurrentWorkflows: 5
  }

  // 2. サービスの初期化
  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const haystackService = new HaystackDocumentService()
  await haystackService.initialize()

  const enhancedVectorDB = new EnhancedVectorDatabase(llamaService)
  await enhancedVectorDB.initialize()

  // 3. Phase 2統合マネージャーの初期化
  const phase2Manager = new Phase2IntegrationManager(
    llamaService,
    haystackService,
    enhancedVectorDB,
    config
  )
  
  try {
    await phase2Manager.initialize()
    console.log('✅ Phase 2 integration manager initialized successfully')

    // 4. 統合機能のテスト

    // 4.1 ドキュメント分析ワークフローのテスト
    console.log('\n--- Document Analysis Workflow Test ---')
    const sampleDocument = `
    # Armis Phase 2 統合システム

    ## 概要
    Phase 2では、LangGraph、Dify、RAG from Scratchの3つのライブラリを統合し、
    より高度なAIエージェントシステムを構築しました。

    ## 主要機能

    ### 1. LangGraphワークフロー管理
    - 複雑なワークフローの視覚的設計
    - 条件分岐とループ処理
    - リアルタイム実行監視

    ### 2. Dify UI/UX改善
    - ドラッグ&ドロップワークフローエディタ
    - テンプレートベースの開発
    - リアルタイムプレビュー

    ### 3. RAG from Scratch構造抽出
    - 高度なドキュメント構造分析
    - セマンティック検索
    - パターン検出と関係性抽出

    ## 技術的詳細
    このシステムは、最新のAI技術を活用して、
    ユーザーの生産性を大幅に向上させます。
    `

    const documentAnalysisResult = await phase2Manager.executeIntegratedWorkflow(
      'document_analysis',
      sampleDocument,
      { analysis_type: 'both' }
    )

    console.log('📄 Document Analysis Result:')
    console.log(`- Workflow Type: ${documentAnalysisResult.workflow_type}`)
    console.log(`- LangGraph Result: ${documentAnalysisResult.results.langgraph ? 'Success' : 'Failed'}`)
    console.log(`- RAG Structure Result: ${documentAnalysisResult.results.rag_structure ? 'Success' : 'Failed'}`)
    console.log(`- Dify Result: ${documentAnalysisResult.results.dify ? 'Success' : 'Failed'}`)

    // 4.2 質問応答システムのテスト
    console.log('\n--- QA System Workflow Test ---')
    const question = 'Phase 2の主要機能は何ですか？'
    
    const qaResult = await phase2Manager.executeIntegratedWorkflow(
      'qa_system',
      question,
      { context_documents: [sampleDocument] }
    )

    console.log('❓ QA System Result:')
    console.log(`- Question: ${question}`)
    console.log(`- LangGraph Result: ${qaResult.results.langgraph ? 'Success' : 'Failed'}`)
    console.log(`- RAG Search Results: ${qaResult.results.rag_search?.length || 0} documents found`)
    console.log(`- Dify Result: ${qaResult.results.dify ? 'Success' : 'Failed'}`)

    // 4.3 構造抽出ワークフローのテスト
    console.log('\n--- Structure Extraction Workflow Test ---')
    const structureResult = await phase2Manager.executeIntegratedWorkflow(
      'structure_extraction',
      sampleDocument,
      { extraction_method: 'comprehensive' }
    )

    console.log('🏗️ Structure Extraction Result:')
    console.log(`- LangGraph Result: ${structureResult.results.langgraph ? 'Success' : 'Failed'}`)
    console.log(`- RAG Structure Result: ${structureResult.results.rag_structure ? 'Success' : 'Failed'}`)

    // 4.4 個別機能のテスト

    // LangGraphワークフローのテスト
    console.log('\n--- LangGraph Individual Test ---')
    try {
      const langGraphResult = await phase2Manager.executeLangGraphWorkflow(
        'document_analysis',
        sampleDocument
      )
      console.log(`✅ LangGraph workflow executed successfully`)
      console.log(`- Final Output: ${langGraphResult.final_output?.substring(0, 100)}...`)
      console.log(`- Steps Completed: ${langGraphResult.metadata.steps_completed.length}`)
    } catch (error) {
      console.log(`❌ LangGraph workflow failed: ${error}`)
    }

    // RAG from Scratchのテスト
    console.log('\n--- RAG from Scratch Individual Test ---')
    try {
      const ragStructureResult = await phase2Manager.extractStructureWithRAG(
        sampleDocument,
        { source: 'example', category: 'documentation' }
      )
      console.log(`✅ RAG structure extraction completed`)
      console.log(`- Confidence: ${ragStructureResult.confidence}`)
      console.log(`- Sections: ${ragStructureResult.structure.sections.length}`)
      console.log(`- Relationships: ${ragStructureResult.structure.relationships.length}`)
    } catch (error) {
      console.log(`❌ RAG structure extraction failed: ${error}`)
    }

    // Difyワークフローのテスト
    console.log('\n--- Dify Individual Test ---')
    try {
      const difyResult = await phase2Manager.executeDifyWorkflow('dify_doc_analysis', {
        document_content: sampleDocument,
        analysis_type: 'both'
      })
      console.log(`✅ Dify workflow executed successfully`)
      console.log(`- Status: ${difyResult.status}`)
      console.log(`- Progress: ${difyResult.progress}%`)
      console.log(`- Logs: ${difyResult.logs.length} entries`)
    } catch (error) {
      console.log(`❌ Dify workflow failed: ${error}`)
    }

    // 4.5 統計情報の取得
    console.log('\n--- Integration Status ---')
    const status = await phase2Manager.getStatus()
    console.log('📊 Phase 2 Integration Status:')
    console.log(`- LangGraph: ${status.langGraph.enabled ? '✅' : '❌'} (${status.langGraph.workflowsCount} workflows, ${status.langGraph.activeExecutions} active)`)
    console.log(`- Dify: ${status.dify.enabled ? '✅' : '❌'} (${status.dify.workflowsCount} workflows, ${status.dify.templatesCount} templates)`)
    console.log(`- RAG from Scratch: ${status.ragFromScratch.enabled ? '✅' : '❌'} (${status.ragFromScratch.documentsCount} documents)`)

    // 4.6 Difyワークフローの管理テスト
    console.log('\n--- Dify Workflow Management Test ---')
    const difyWorkflows = phase2Manager.getDifyWorkflows()
    console.log(`📋 Available Dify Workflows: ${difyWorkflows.length}`)
    difyWorkflows.forEach(workflow => {
      console.log(`  - ${workflow.name}: ${workflow.description}`)
    })

    // 5. クリーンアップ
    console.log('\n--- Cleanup ---')
    await phase2Manager.cleanup()
    console.log('✅ Cleanup completed')

  } catch (error) {
    console.error('❌ Error in Phase 2 integration example:', error)
  }
}

/**
 * 個別機能の詳細テスト
 */
async function testIndividualFeatures() {
  console.log('\n=== Individual Features Test ===')

  const config: Phase2IntegrationConfig = {
    enableLangGraph: true,
    enableDify: true,
    enableRAGFromScratch: true,
    workflowTimeout: 30000,
    maxConcurrentWorkflows: 5
  }

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const haystackService = new HaystackDocumentService()
  await haystackService.initialize()

  const enhancedVectorDB = new EnhancedVectorDatabase(llamaService)
  await enhancedVectorDB.initialize()

  const phase2Manager = new Phase2IntegrationManager(
    llamaService,
    haystackService,
    enhancedVectorDB,
    config
  )

  try {
    await phase2Manager.initialize()

    // LangGraphマネージャーの詳細テスト
    const langGraphManager = phase2Manager.getLangGraphManager()
    if (langGraphManager) {
      console.log('\n--- LangGraph Manager Test ---')
      const availableWorkflows = langGraphManager.getAvailableWorkflows()
      console.log(`Available workflows: ${availableWorkflows.join(', ')}`)
      
      for (const workflowName of availableWorkflows) {
        const status = langGraphManager.getWorkflowStatus(workflowName)
        console.log(`Workflow ${workflowName}: ${JSON.stringify(status)}`)
      }
    }

    // RAG from Scratchサービスの詳細テスト
    const ragService = phase2Manager.getRAGFromScratchService()
    if (ragService) {
      console.log('\n--- RAG from Scratch Service Test ---')
      
      // 複数のドキュメントを追加
      const documents = [
        'AI技術は急速に発展しています。',
        '機械学習はデータサイエンスの重要な分野です。',
        '自然言語処理はAIの主要な応用分野です。'
      ]

      for (const doc of documents) {
        await ragService.addDocument(doc, { category: 'ai_technology' })
      }

      // 検索テスト
      const searchResults = await ragService.search('AI 技術', undefined, 5)
      console.log(`Found ${searchResults.length} documents related to AI technology`)

      // 構造抽出テスト
      const structureResults = []
      for (const doc of ragService.getAllDocuments()) {
        const structure = await ragService.extractStructureFromDocument(doc.id)
        structureResults.push(structure)
      }
      console.log(`Extracted structures from ${structureResults.length} documents`)

      // 統計情報
      const stats = ragService.getDocumentStats()
      console.log(`RAG Service Stats: ${JSON.stringify(stats, null, 2)}`)
    }

    await phase2Manager.cleanup()

  } catch (error) {
    console.error('❌ Error in individual features test:', error)
  }
}

/**
 * パフォーマンステスト
 */
async function testPerformance() {
  console.log('\n=== Performance Test ===')

  const config: Phase2IntegrationConfig = {
    enableLangGraph: true,
    enableDify: true,
    enableRAGFromScratch: true,
    workflowTimeout: 30000,
    maxConcurrentWorkflows: 5
  }

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const haystackService = new HaystackDocumentService()
  await haystackService.initialize()

  const enhancedVectorDB = new EnhancedVectorDatabase(llamaService)
  await enhancedVectorDB.initialize()

  const phase2Manager = new Phase2IntegrationManager(
    llamaService,
    haystackService,
    enhancedVectorDB,
    config
  )

  try {
    await phase2Manager.initialize()

    const testDocument = `
    # パフォーマンステストドキュメント
    
    このドキュメントは、Phase 2統合システムのパフォーマンスをテストするために作成されました。
    
    ## テスト項目
    1. ドキュメント分析ワークフロー
    2. 質問応答システム
    3. 構造抽出機能
    
    ## 期待される結果
    - 高速な処理
    - 正確な結果
    - 安定した動作
    `

    // 並列実行テスト
    console.log('\n--- Parallel Execution Test ---')
    const startTime = Date.now()
    
    const promises = [
      phase2Manager.executeIntegratedWorkflow('document_analysis', testDocument),
      phase2Manager.executeIntegratedWorkflow('qa_system', 'このドキュメントの内容は？'),
      phase2Manager.executeIntegratedWorkflow('structure_extraction', testDocument)
    ]

    const results = await Promise.allSettled(promises)
    const endTime = Date.now()
    
    console.log(`⏱️ Parallel execution completed in ${endTime - startTime}ms`)
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Workflow ${index + 1} completed successfully`)
      } else {
        console.log(`❌ Workflow ${index + 1} failed: ${result.reason}`)
      }
    })

    await phase2Manager.cleanup()

  } catch (error) {
    console.error('❌ Error in performance test:', error)
  }
}

// メイン実行関数
export async function runPhase2IntegrationExamples() {
  console.log('🚀 Starting Phase 2 Integration Examples...\n')

  try {
    // 基本的な統合テスト
    await phase2IntegrationExample()

    // 個別機能のテスト
    await testIndividualFeatures()

    // パフォーマンステスト
    await testPerformance()

    console.log('\n🎉 All Phase 2 integration examples completed successfully!')

  } catch (error) {
    console.error('💥 Fatal error in Phase 2 integration examples:', error)
  }
}

// 直接実行時の処理
if (require.main === module) {
  runPhase2IntegrationExamples().catch(console.error)
}
