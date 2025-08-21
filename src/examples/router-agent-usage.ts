import { LLMManager } from '@/services/llm/llm-manager'
import { LLMConfig } from '@/types/llm'

/**
 * ルーターエージェントの使用例
 * 
 * このファイルは、実装したルーターエージェントシステムの使用方法を示します。
 * 様々なタイプの入力に対して、適切なエージェントが自動的に選択され実行されます。
 */

async function demonstrateRouterAgent() {
  console.log('🚀 ルーターエージェントのデモを開始します...\n')

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

    // 利用可能なエージェントを表示
    const availableAgents = llmManager.getAvailableAgents()
    console.log('📋 利用可能なエージェント:')
    availableAgents.forEach(agent => {
      console.log(`  - ${agent.name}: ${agent.description}`)
    })
    console.log()

    // 様々なタイプの入力でテスト
    const testCases = [
      {
        input: 'こんにちは、今日の天気はどうですか？',
        description: '一般的な会話'
      },
      {
        input: 'TypeScriptで配列の要素をフィルタリングする関数を作成してください',
        description: 'プログラミング関連'
      },
      {
        input: 'CSVファイルを読み込んでデータを分析する方法を教えてください',
        description: 'ファイル処理とデータ分析'
      },
      {
        input: '短編小説を書いてください。テーマは「友情」です。',
        description: '創造的な文章作成'
      },
      {
        input: '複雑な問題を段階的に分析して解決策を提案してください',
        description: '段階的思考'
      }
    ]

    for (const testCase of testCases) {
      console.log(`🔍 テストケース: ${testCase.description}`)
      console.log(`📝 入力: "${testCase.input}"`)
      
      const startTime = Date.now()
      const response = await llmManager.routeAndExecute(testCase.input)
      const endTime = Date.now()
      
      console.log(`🤖 選択されたエージェント: ${response.agentType}`)
      console.log(`⏱️  実行時間: ${response.executionTime}ms`)
      console.log(`✅ 成功: ${response.success}`)
      console.log(`📊 メタデータ:`, response.metadata)
      console.log(`💬 応答: ${response.content.substring(0, 200)}...`)
      console.log('─'.repeat(80))
      console.log()
    }

    // ルーティング履歴を表示
    const routingHistory = llmManager.getRoutingHistory()
    console.log('📈 ルーティング履歴:')
    routingHistory.forEach((decision, index) => {
      console.log(`  ${index + 1}. ${decision.selectedAgent} (信頼度: ${decision.confidence.toFixed(2)})`)
      console.log(`     理由: ${decision.reasoning}`)
    })

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

/**
 * 特定のエージェントを直接使用する例
 */
async function useSpecificAgent() {
  console.log('🎯 特定のエージェントを直接使用する例\n')

  const config: LLMConfig = {
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
  }

  const llmManager = new LLMManager(config)
  
  try {
    await llmManager.initialize()
    
    // ルーターエージェントを取得
    const routerAgent = llmManager.getRouterAgent()
    
    // 特定のエージェントを取得
    const codeAgent = routerAgent.getAgent('code_assistant')
    if (codeAgent) {
      console.log('💻 コードアシスタントエージェントを直接使用:')
      const response = await codeAgent.execute('Pythonでクイックソートを実装してください')
      console.log(`応答: ${response.content.substring(0, 300)}...`)
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

/**
 * ルーター設定をカスタマイズする例
 */
async function customizeRouterConfig() {
  console.log('⚙️  ルーター設定のカスタマイズ例\n')

  const config: LLMConfig = {
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7,
    topP: 0.9,
    topK: 40
  }

  const llmManager = new LLMManager(config)
  
  try {
    await llmManager.initialize()
    
    // 現在の設定を表示
    console.log('📋 現在のルーター設定:')
    console.log(llmManager.getRouterConfig())
    
    // 設定を更新
    llmManager.updateRouterConfig({
      confidenceThreshold: 0.8,
      enableFallback: false
    })
    
    console.log('\n📋 更新後のルーター設定:')
    console.log(llmManager.getRouterConfig())
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// メイン実行関数
export async function runRouterAgentExamples() {
  console.log('🎪 ルーターエージェントシステムのデモ\n')
  
  await demonstrateRouterAgent()
  console.log('\n' + '='.repeat(80) + '\n')
  
  await useSpecificAgent()
  console.log('\n' + '='.repeat(80) + '\n')
  
  await customizeRouterConfig()
  
  console.log('\n🎉 デモが完了しました！')
}

// 直接実行された場合
if (require.main === module) {
  runRouterAgentExamples().catch(console.error)
}
