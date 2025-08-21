import { InputAnalyzer } from '@/services/agent/input-analyzer'
import { LLMManager } from '@/services/llm/llm-manager'
import { LLMConfig } from '@/types/llm'

/**
 * チャット機能とRouter Agent Systemの統合テスト
 * 
 * このファイルは、InputAnalyzerとRouter Agent Systemの統合が正しく動作することを確認します。
 */

async function testChatRouterIntegration() {
  console.log('🚀 チャット機能とRouter Agent Systemの統合テストを開始します...\n')

  // InputAnalyzerのテスト
  console.log('📊 InputAnalyzerのテスト')
  const inputAnalyzer = new InputAnalyzer()

  const testCases = [
    {
      input: 'こんにちは、今日の天気はどうですか？',
      description: '単純な会話（Router Agent不要）',
      expected: { needsRouterAgent: false }
    },
    {
      input: 'TypeScriptでReactコンポーネントを作成してください',
      description: 'プログラミング関連（Code Assistant）',
      expected: { needsRouterAgent: true, suggestedAgent: 'code_assistant' }
    },
    {
      input: 'CSVファイルを読み込んでデータを分析してください',
      description: 'ファイル処理とデータ分析',
      expected: { needsRouterAgent: true, suggestedAgent: 'file_processor' }
    },
    {
      input: '短編小説を書いてください。テーマは「友情」です。',
      description: '創造的文章作成',
      expected: { needsRouterAgent: true, suggestedAgent: 'creative_writer' }
    },
    {
      input: '複雑な問題を段階的に分析して解決策を提案してください',
      description: '段階的思考',
      expected: { needsRouterAgent: true, suggestedAgent: 'sequential_thinking' }
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n🔍 テストケース: ${testCase.description}`)
    console.log(`📝 入力: "${testCase.input}"`)
    
    const analysis = inputAnalyzer.analyzeInput(testCase.input)
    console.log(`✅ 分析結果:`)
    console.log(`   - Router Agent必要: ${analysis.needsRouterAgent}`)
    console.log(`   - 推奨エージェント: ${analysis.suggestedAgent || 'なし'}`)
    console.log(`   - 信頼度: ${analysis.confidence}`)
    console.log(`   - 複雑さ: ${analysis.complexity}`)
    console.log(`   - 理由: ${analysis.reasoning}`)
    
    // 期待値との比較
    if (analysis.needsRouterAgent === testCase.expected.needsRouterAgent) {
      console.log(`✅ 期待値と一致: Router Agent必要 = ${analysis.needsRouterAgent}`)
    } else {
      console.log(`❌ 期待値と不一致: 期待=${testCase.expected.needsRouterAgent}, 実際=${analysis.needsRouterAgent}`)
    }
    
    if (testCase.expected.suggestedAgent && analysis.suggestedAgent === testCase.expected.suggestedAgent) {
      console.log(`✅ 期待値と一致: 推奨エージェント = ${analysis.suggestedAgent}`)
    } else if (testCase.expected.suggestedAgent) {
      console.log(`❌ 期待値と不一致: 期待=${testCase.expected.suggestedAgent}, 実際=${analysis.suggestedAgent}`)
    }
  }

  // LLMManagerのテスト（Router Agent System）
  console.log('\n🤖 LLMManager（Router Agent System）のテスト')
  
  try {
    const config: LLMConfig = {
      modelPath: './models/llama-2-7b-chat.gguf',
      contextSize: 4096,
      temperature: 0.7,
      topP: 0.9,
      topK: 40
    }

    const llmManager = new LLMManager(config)
    await llmManager.initialize()
    console.log('✅ LLMManagerの初期化が完了しました')

    // 利用可能なエージェントを確認
    const availableAgents = llmManager.getAvailableAgents()
    console.log(`📋 利用可能なエージェント数: ${availableAgents.length}`)
    availableAgents.forEach(agent => {
      console.log(`   - ${agent.name}: ${agent.description}`)
    })

    // Router Agent Systemのテスト実行
    const routerTestCases = [
      {
        input: 'TypeScriptで配列をソートする方法を教えてください',
        description: 'コード関連の質問'
      },
      {
        input: 'データ分析の基本的な手順を説明してください',
        description: 'データ分析関連の質問'
      }
    ]

    for (const testCase of routerTestCases) {
      console.log(`\n🔍 Router Agentテスト: ${testCase.description}`)
      console.log(`📝 入力: "${testCase.input}"`)
      
      const startTime = Date.now()
      const response = await llmManager.routeAndExecute(testCase.input)
      const endTime = Date.now()
      
      console.log(`✅ 実行結果:`)
      console.log(`   - 使用エージェント: ${response.agentType}`)
      console.log(`   - 成功: ${response.success}`)
      console.log(`   - 実行時間: ${response.executionTime}ms`)
      console.log(`   - 実際の実行時間: ${endTime - startTime}ms`)
      console.log(`   - 応答内容: ${response.content.substring(0, 100)}...`)
      
      if (response.success) {
        console.log(`✅ テスト成功`)
      } else {
        console.log(`❌ テスト失敗: ${response.error}`)
      }
    }

    // ルーティング履歴の確認
    const routingHistory = llmManager.getRoutingHistory()
    console.log(`\n📈 ルーティング履歴: ${routingHistory.length}件`)
    routingHistory.forEach((decision, index) => {
      console.log(`   ${index + 1}. ${decision.selectedAgent} (信頼度: ${decision.confidence.toFixed(2)})`)
      console.log(`      理由: ${decision.reasoning}`)
    })

  } catch (error) {
    console.error('❌ LLMManagerテストでエラーが発生しました:', error)
  }

  console.log('\n🎉 統合テストが完了しました！')
}

/**
 * 統合シミュレーション
 * 
 * 実際のチャットアプリケーションでの使用例をシミュレートします。
 */
async function simulateChatIntegration() {
  console.log('\n🔄 チャット統合シミュレーションを開始します...\n')

  const inputAnalyzer = new InputAnalyzer()
  
  // シミュレーション用の入力
  const userInputs = [
    'こんにちは！',
    'TypeScriptでReactフックを作成する方法を教えてください',
    'CSVファイルを読み込んでグラフを作成したいです',
    '短編小説を書いてください',
    '複雑な問題を段階的に解決する方法を教えてください'
  ]

  for (const input of userInputs) {
    console.log(`\n👤 ユーザー入力: "${input}"`)
    
    // 1. 入力分析
    const analysis = inputAnalyzer.analyzeInput(input)
    console.log(`📊 分析結果: ${analysis.needsRouterAgent ? 'Router Agent使用' : '通常LLM使用'}`)
    
    if (analysis.needsRouterAgent) {
      console.log(`🤖 推奨エージェント: ${analysis.suggestedAgent}`)
      console.log(`📈 信頼度: ${analysis.confidence}`)
      console.log(`💭 理由: ${analysis.reasoning}`)
      
      // Router Agent Systemでの処理をシミュレート
      console.log(`⚡ Router Agent Systemで処理中...`)
      // 実際の実装では、ここでLLMManager.routeAndExecute()を呼び出す
      
    } else {
      console.log(`💬 通常のLLMで処理中...`)
      // 実際の実装では、ここでAISDKServiceを使用
    }
    
    console.log(`✅ 処理完了`)
  }

  console.log('\n🎯 シミュレーション完了！')
}

// テスト実行
export async function runChatRouterIntegrationTests() {
  try {
    await testChatRouterIntegration()
    await simulateChatIntegration()
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error)
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  runChatRouterIntegrationTests().catch(console.error)
}
