import { LlamaService } from '@/services/llm/llama-service'
import { Phase1IntegrationManager, IntegrationConfig } from '@/services/integration/phase1-integration-manager'

/**
 * Phase 1統合の使用例
 * 
 * このファイルは、LangChainJS、Haystack、拡張ベクトルデータベースの統合機能を
 * 実際に使用する方法を示しています。
 */

async function phase1IntegrationExample() {
  console.log('=== Phase 1 Integration Example ===')

  // 1. 設定の準備
  const config: IntegrationConfig = {
    enableLangChain: true,
    enableHaystack: true,
    enableEnhancedVectorDB: true,
    confidenceThreshold: 0.7,
    enableFallback: true
  }

  // 2. LLMサービスの初期化（実際の環境に合わせて調整）
  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  // 3. 統合マネージャーの初期化
  const integrationManager = new Phase1IntegrationManager(llamaService, config)
  
  try {
    await integrationManager.initialize()
    console.log('✅ Integration manager initialized successfully')

    // 4. 統合機能のテスト

    // 4.1 ドキュメント分析のテスト
    console.log('\n--- Document Analysis Test ---')
    const sampleDocument = `
    Armisは、高度なAIエージェントシステムを提供するプラットフォームです。
    このシステムは、LangChainJS、Haystack、拡張ベクトルデータベースを統合し、
    ユーザーの様々なニーズに対応する包括的なソリューションを提供します。
    
    主な機能:
    - ドキュメント理解と分析
    - 高度な検索機能
    - 質問応答システム
    - エージェントベースのワークフロー管理
    
    このプラットフォームは、企業の業務効率化と意思決定支援に貢献します。
    `

    const analysisResult = await integrationManager.analyzeDocument(sampleDocument, {
      source: 'example',
      category: 'platform_description'
    })

    console.log('📄 Document Analysis Result:')
    console.log(`- Summary: ${analysisResult.summary}`)
    console.log(`- Language: ${analysisResult.language}`)
    console.log(`- Sentiment: ${analysisResult.sentiment.label} (${analysisResult.sentiment.score.toFixed(2)})`)
    console.log(`- Keywords: ${analysisResult.keywords.join(', ')}`)
    console.log(`- Topics: ${analysisResult.topics.join(', ')}`)
    console.log(`- Entities: ${analysisResult.entities.map(e => `${e.text} (${e.type})`).join(', ')}`)

    // 4.2 拡張ベクトルデータベースへのドキュメント追加
    console.log('\n--- Enhanced Vector Database Test ---')
    const enhancedDoc = {
      id: 'doc_001',
      content: sampleDocument,
      metadata: {
        title: 'Armis Platform Description',
        author: 'AI Assistant',
        category: 'platform',
        tags: ['AI', 'platform', 'integration']
      }
    }

    await integrationManager.addEnhancedDocument(enhancedDoc)
    console.log('✅ Document added to enhanced vector database')

    // 4.3 拡張検索のテスト
    console.log('\n--- Enhanced Search Test ---')
    const searchQuery = {
      text: 'AI platform integration',
      filters: {
        topics: ['AI', 'platform'],
        language: 'ja'
      },
      weights: {
        semantic: 0.4,
        keyword: 0.3,
        topic: 0.2,
        entity: 0.1
      }
    }

    const searchResults = await integrationManager.enhancedSearch(searchQuery)
    console.log(`🔍 Enhanced Search Results: ${searchResults.length} documents found`)
    searchResults.forEach((result, index) => {
      console.log(`${index + 1}. Score: ${result.semanticScore?.toFixed(2) || 'N/A'}`)
      console.log(`   Content: ${result.content.substring(0, 100)}...`)
    })

    // 4.4 質問応答のテスト
    console.log('\n--- Question Answering Test ---')
    const question = 'Armisプラットフォームの主な機能は何ですか？'
    const qaResult = await integrationManager.answerQuestion(question)
    
    console.log(`❓ Question: ${question}`)
    console.log(`💡 Answer: ${qaResult.answer}`)
    console.log(`📊 Confidence: ${(qaResult.confidence * 100).toFixed(1)}%`)

    // 4.5 LangChain強化ルーターのテスト
    console.log('\n--- LangChain Enhanced Router Test ---')
    const routerInput = 'このドキュメントの内容を要約してください'
    const routerResult = await integrationManager.routeAndExecute(routerInput, {
      documentId: 'doc_001',
      userContext: 'analysis_request'
    })

    console.log(`🤖 Router Response:`)
    console.log(`- Content: ${routerResult.content}`)
    console.log(`- Confidence: ${routerResult.confidence}`)
    console.log(`- Execution Time: ${routerResult.executionTime}ms`)
    console.log(`- Metadata: ${JSON.stringify(routerResult.metadata, null, 2)}`)

    // 4.6 統計情報の取得
    console.log('\n--- Integration Status ---')
    const status = await integrationManager.getStatus()
    console.log('📊 Integration Status:')
    console.log(`- LangChain: ${status.langchain.enabled ? '✅' : '❌'} (${status.langchain.agentsCount} agents)`)
    console.log(`- Haystack: ${status.haystack.enabled ? '✅' : '❌'} (${status.haystack.documentsCount} documents)`)
    console.log(`- Enhanced Vector DB: ${status.enhancedVectorDB.enabled ? '✅' : '❌'} (${status.enhancedVectorDB.documentsCount} documents)`)

    // 5. クリーンアップ
    console.log('\n--- Cleanup ---')
    await integrationManager.cleanup()
    console.log('✅ Cleanup completed')

  } catch (error) {
    console.error('❌ Error in Phase 1 integration example:', error)
  }
}

/**
 * 個別機能のテスト関数
 */
async function testIndividualFeatures() {
  console.log('\n=== Individual Features Test ===')

  const config: IntegrationConfig = {
    enableLangChain: true,
    enableHaystack: true,
    enableEnhancedVectorDB: true,
    confidenceThreshold: 0.7,
    enableFallback: true
  }

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const integrationManager = new Phase1IntegrationManager(llamaService, config)

  try {
    await integrationManager.initialize()

    // Haystackサービスの個別テスト
    const haystackService = integrationManager.getHaystackService()
    if (haystackService) {
      console.log('\n--- Haystack Service Test ---')
      
      // 複数のドキュメントを追加
      const documents = [
        'AI技術は急速に発展しています。',
        '機械学習はデータサイエンスの重要な分野です。',
        '自然言語処理はAIの主要な応用分野です。'
      ]

      for (const doc of documents) {
        await haystackService.addDocument(doc, { category: 'ai_technology' })
      }

      // 検索テスト
      const searchResults = await haystackService.searchDocuments('AI 技術', 5)
      console.log(`Found ${searchResults.length} documents related to AI technology`)

      // 質問応答テスト
      const qaResult = await haystackService.answerQuestion('AI技術の現状は？')
      console.log(`QA Result: ${qaResult.answer}`)
    }

    // 拡張ベクトルデータベースの個別テスト
    const enhancedVectorDB = integrationManager.getEnhancedVectorDB()
    if (enhancedVectorDB) {
      console.log('\n--- Enhanced Vector Database Test ---')
      
      // 統計情報の取得
      const stats = await enhancedVectorDB.getDocumentStats()
      console.log(`Database Stats: ${JSON.stringify(stats, null, 2)}`)

      // 人気ドキュメントの取得
      const popularDocs = await enhancedVectorDB.getPopularDocuments(3)
      console.log(`Popular Documents: ${popularDocs.length} found`)
    }

    await integrationManager.cleanup()

  } catch (error) {
    console.error('❌ Error in individual features test:', error)
  }
}

/**
 * エラーハンドリングのテスト
 */
async function testErrorHandling() {
  console.log('\n=== Error Handling Test ===')

  const config: IntegrationConfig = {
    enableLangChain: false, // 無効化してテスト
    enableHaystack: true,
    enableEnhancedVectorDB: true,
    confidenceThreshold: 0.7,
    enableFallback: true
  }

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const integrationManager = new Phase1IntegrationManager(llamaService, config)

  try {
    await integrationManager.initialize()

    // LangChainルーターが無効な場合のテスト
    try {
      await integrationManager.routeAndExecute('test input')
    } catch (error) {
      console.log('✅ Expected error caught: LangChain router not available')
    }

    // 正常な機能のテスト
    const analysisResult = await integrationManager.analyzeDocument('Test document content')
    console.log('✅ Document analysis works even with LangChain disabled')

    await integrationManager.cleanup()

  } catch (error) {
    console.error('❌ Error in error handling test:', error)
  }
}

// メイン実行関数
export async function runPhase1IntegrationExamples() {
  console.log('🚀 Starting Phase 1 Integration Examples...\n')

  try {
    // 基本的な統合テスト
    await phase1IntegrationExample()

    // 個別機能のテスト
    await testIndividualFeatures()

    // エラーハンドリングのテスト
    await testErrorHandling()

    console.log('\n🎉 All Phase 1 integration examples completed successfully!')

  } catch (error) {
    console.error('💥 Fatal error in Phase 1 integration examples:', error)
  }
}

// 直接実行時の処理
if (require.main === module) {
  runPhase1IntegrationExamples().catch(console.error)
}
