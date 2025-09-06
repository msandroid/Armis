import { LLMManager } from '@/services/llm/llm-manager'
import { LLMConfig } from '@/types/llm'

/**
 * 高度なRouter Agentシステムの使用例
 * 
 * このファイルは、MultiAgentMemoryとAdvancedRAGを統合した
 * 高度なRouter Agentシステムの使用方法を示します。
 */

async function demonstrateAdvancedRouterAgent() {
  console.log('🚀 高度なRouter Agentシステムのデモを開始します...\n')

  // LLM設定
  const config: LLMConfig = {
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
  }

  // LLMマネージャーを初期化
  const llmManager = new LLMManager(config)
  
  try {
    await llmManager.initialize()
    console.log('✅ LLMマネージャーの初期化が完了しました\n')

    // システム統計を表示
    console.log('📊 システム統計:')
    const systemStats = llmManager.getSystemStats()
    console.log(`  - 利用可能なエージェント数: ${systemStats.agents.length}`)
    console.log(`  - メモリ統計:`, systemStats.memory)
    console.log(`  - RAG統計:`, systemStats.rag)
    console.log()

    // メモリシステムのデモ
    await demonstrateMemorySystem(llmManager)
    
    // RAGシステムのデモ
    await demonstrateRAGSystem(llmManager)
    
    // 高度なルーティングのデモ
    await demonstrateAdvancedRouting(llmManager)
    
    // コンテキスト管理のデモ
    await demonstrateContextManagement(llmManager)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

/**
 * メモリシステムのデモ
 */
async function demonstrateMemorySystem(llmManager: LLMManager) {
  console.log('🧠 メモリシステムのデモ\n')

  // 共有メモリに情報を追加
  console.log('📝 共有メモリに情報を追加中...')
  await llmManager.addToSharedMemory(
    'ユーザーはTypeScriptでReactアプリケーションを開発したい',
    'user',
    { priority: 'high', domain: 'programming' },
    ['typescript', 'react', 'development']
  )

  await llmManager.addToSharedMemory(
    '以前に作成したコードアシスタントエージェントが役立った',
    'system',
    { success: true, agentType: 'code_assistant' },
    ['success', 'code_assistant', 'feedback']
  )

  // 長期記憶に情報を追加
  console.log('💾 長期記憶に情報を追加中...')
  await llmManager.addToLongTermMemory(
    'ユーザーはプログラミング初心者で、TypeScriptとReactの学習を希望している',
    'user_profile',
    { userLevel: 'beginner', interests: ['typescript', 'react'] },
    ['user_profile', 'beginner', 'learning']
  )

  // メモリから情報を検索
  console.log('🔍 メモリから情報を検索中...')
  const searchResults = await llmManager.searchSharedMemory('TypeScript React', 5, 0.3)
  console.log(`検索結果: ${searchResults.length}件`)
  searchResults.forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.content.substring(0, 100)}... (重要度: ${result.importance.toFixed(2)})`)
  })

  console.log()
}

/**
 * RAGシステムのデモ
 */
async function demonstrateRAGSystem(llmManager: LLMManager) {
  console.log('🔍 Advanced RAGシステムのデモ\n')

  // ハイブリッド検索のデモ
  console.log('🔎 ハイブリッド検索を実行中...')
  const hybridResults = await llmManager.hybridSearch('TypeScript React development', {
    context: 'programming',
    userLevel: 'beginner'
  })
  console.log(`ハイブリッド検索結果: ${hybridResults.length}件`)

  // 文脈検索のデモ
  console.log('🎯 文脈検索を実行中...')
  const contextualResults = await llmManager.contextualSearch('React hooks', {
    previousTopics: ['typescript', 'react'],
    userLevel: 'beginner',
    preferredStyle: 'tutorial'
  })
  console.log(`文脈検索結果: ${contextualResults.length}件`)

  // マルチソース統合のデモ
  console.log('🔗 マルチソース統合を実行中...')
  const integratedResult = await llmManager.multiSourceIntegration([
    ...hybridResults.slice(0, 3),
    ...contextualResults.slice(0, 2)
  ])
  console.log(`統合結果の信頼性: ${integratedResult.confidence.toFixed(2)}`)
  console.log(`統合された内容: ${integratedResult.content.substring(0, 200)}...`)

  console.log()
}

/**
 * 高度なルーティングのデモ
 */
async function demonstrateAdvancedRouting(llmManager: LLMManager) {
  console.log('🎯 高度なルーティングのデモ\n')

  // 連続的な質問でメモリの活用を確認
  const questions = [
    'TypeScriptでReactコンポーネントを作成する方法を教えてください',
    '先ほどの説明を踏まえて、useStateフックの使い方を詳しく説明してください',
    'これまでの内容をまとめて、初心者向けのチュートリアルを作成してください'
  ]

  for (let i = 0; i < questions.length; i++) {
    console.log(`📝 質問 ${i + 1}: "${questions[i]}"`)
    
    const startTime = Date.now()
    const response = await llmManager.routeAndExecute(questions[i], {
      conversationId: 'demo-conversation',
      questionNumber: i + 1
    })
    const endTime = Date.now()
    
    console.log(`🤖 選択されたエージェント: ${response.agentType}`)
    console.log(`⏱️  実行時間: ${endTime - startTime}ms`)
    console.log(`✅ 成功: ${response.success}`)
    console.log(`🧠 メモリ使用: ${response.metadata?.memoryUsed ? 'はい' : 'いいえ'}`)
    console.log(`🔍 RAG結果数: ${response.metadata?.ragResults || 0}`)
    console.log(`💬 応答: ${response.content.substring(0, 150)}...`)
    console.log('─'.repeat(80))
    console.log()
  }
}

/**
 * コンテキスト管理のデモ
 */
async function demonstrateContextManagement(llmManager: LLMManager) {
  console.log('🔄 コンテキスト管理のデモ\n')

  // コンテキストの更新
  console.log('📝 コンテキストを更新中...')
  llmManager.updateContext({
    currentProject: 'React TypeScript App',
    userPreferences: {
      language: 'ja',
      detailLevel: 'beginner',
      preferredExamples: 'practical'
    }
  }, 'project_setup')

  // 現在のコンテキストを表示
  console.log('📋 現在のコンテキスト:')
  const currentContext = llmManager.getCurrentContext()
  console.log(JSON.stringify(currentContext, null, 2))

  // コンテキスト履歴を表示
  console.log('\n📚 コンテキスト履歴:')
  const contextHistory = llmManager.getContextHistory(3)
  contextHistory.forEach((entry, index) => {
    console.log(`  ${index + 1}. [${entry.timestamp.toISOString()}] ${entry.trigger}`)
    console.log(`     コンテキスト: ${JSON.stringify(entry.context).substring(0, 100)}...`)
  })

  console.log()
}

/**
 * システム統計の詳細表示
 */
async function demonstrateSystemStats(llmManager: LLMManager) {
  console.log('📊 システム統計の詳細\n')

  const stats = llmManager.getSystemStats()
  
  console.log('🧠 メモリ統計:')
  console.log(`  - 共有メモリサイズ: ${stats.memory.sharedMemorySize}`)
  console.log(`  - コンテキスト履歴サイズ: ${stats.memory.contextHistorySize}`)
  console.log(`  - 平均重要度: ${stats.memory.averageImportance.toFixed(2)}`)
  console.log(`  - 最もアクセスされたタグ: ${stats.memory.mostAccessedTags.join(', ')}`)

  console.log('\n🔍 RAG統計:')
  console.log(`  - ドキュメント数: ${stats.rag.documentCount}`)
  console.log(`  - キャッシュサイズ: ${stats.rag.cacheSize}`)
  console.log(`  - ハイブリッド検索重み: ${stats.rag.config.hybridSearchWeight}`)

  console.log('\n🤖 エージェント情報:')
  stats.agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name} (${agent.type})`)
    console.log(`     説明: ${agent.description}`)
    console.log(`     キーワード: ${agent.keywords.join(', ')}`)
  })

  console.log('\n📈 ルーティング履歴:')
  stats.routingHistory.slice(-5).forEach((decision, index) => {
    console.log(`  ${index + 1}. ${decision.selectedAgent} (信頼度: ${decision.confidence.toFixed(2)})`)
    console.log(`     理由: ${decision.reasoning.substring(0, 100)}...`)
  })

  console.log()
}

// メイン実行関数
export async function runAdvancedRouterAgentExamples() {
  console.log('🎪 高度なRouter Agentシステムのデモ\n')
  
  await demonstrateAdvancedRouterAgent()
  
  console.log('🎉 デモが完了しました！')
}

// 直接実行された場合
if (require.main === module) {
  runAdvancedRouterAgentExamples().catch(console.error)
}
