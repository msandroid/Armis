import { LlamaService } from '@/services/llm/llama-service'
import { HaystackDocumentService } from '@/services/document/haystack-document-service'
import { EnhancedVectorDatabase } from '@/services/vector/enhanced-vector-database'
import { LangGraphWorkflowManager } from '@/services/workflow/langgraph-workflow-manager'
import { RAGFromScratchService } from '@/services/rag/rag-from-scratch-service'
import { CursorStyleRouterAgent, RoutingResult } from '@/services/agent/cursor-style-router-agent'

/**
 * Cursorスタイルルーターエージェントの使用例
 * 
 * このファイルは、Cursorのような自然言語入力から
 * 最適なエージェントに自動ルーティングする機能の
 * 使用例を示しています。
 */

async function cursorStyleRouterExample() {
  console.log('=== Cursor Style Router Example ===')

  // 1. サービスの初期化
  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const haystackService = new HaystackDocumentService()
  await haystackService.initialize()

  const enhancedVectorDB = new EnhancedVectorDatabase(llamaService)
  await enhancedVectorDB.initialize()

  const langGraphManager = new LangGraphWorkflowManager(
    llamaService,
    haystackService,
    enhancedVectorDB
  )
  await langGraphManager.initialize()

  const ragFromScratchService = new RAGFromScratchService(llamaService)
  await ragFromScratchService.initialize()

  // 2. Cursorスタイルルーターエージェントの初期化
  const routerAgent = new CursorStyleRouterAgent(
    llamaService,
    haystackService,
    enhancedVectorDB,
    langGraphManager,
    ragFromScratchService,
    {
      enableTaskClassification: true,
      enableMultiAgentExecution: false,
      enableFallback: true,
      maxRetries: 3,
      timeout: 30000,
      confidenceThreshold: 0.7
    }
  )

  await routerAgent.initialize()
  console.log('✅ Cursor-style router agent initialized successfully')

  // 3. 利用可能なエージェントの確認
  console.log('\n--- Available Agents ---')
  const availableAgents = routerAgent.getAvailableAgents()
  console.log(`Total available agents: ${availableAgents.length}`)
  availableAgents.forEach(agent => {
    console.log(`- ${agent.name} (${agent.id}): ${agent.description}`)
    console.log(`  Capabilities: ${agent.capabilities.join(', ')}`)
  })

  // 4. 様々な入力でのルーティングテスト

  const testInputs = [
    {
      input: "このコードをリファクタリングして",
      expectedAgent: "refactor_agent",
      description: "コードリファクタリング要求"
    },
    {
      input: "npm start を実行して",
      expectedAgent: "run_agent",
      description: "CLIコマンド実行要求"
    },
    {
      input: "このエラーの原因を調べて",
      expectedAgent: "debug_agent",
      description: "デバッグ要求"
    },
    {
      input: "ドキュメントを検索して",
      expectedAgent: "doc_agent",
      description: "ドキュメント検索要求"
    },
    {
      input: "ワークフローを実行して",
      expectedAgent: "workflow_agent",
      description: "ワークフロー実行要求"
    },
    {
      input: "RAGで情報を検索して",
      expectedAgent: "rag_agent",
      description: "RAG検索要求"
    },
    {
      input: "一般的な質問です",
      expectedAgent: "doc_agent",
      description: "一般的な質問（フォールバック）"
    }
  ]

  console.log('\n--- Routing Tests ---')
  
  for (const testCase of testInputs) {
    console.log(`\n📝 Testing: ${testCase.description}`)
    console.log(`Input: "${testCase.input}"`)
    console.log(`Expected Agent: ${testCase.expectedAgent}`)
    
    try {
      const startTime = Date.now()
      const result = await routerAgent.routeAndExecute(testCase.input)
      const endTime = Date.now()
      
      console.log(`✅ Routing completed in ${endTime - startTime}ms`)
      console.log(`Selected Agent: ${result.selectedAgent.name} (${result.selectedAgent.id})`)
      console.log(`Task Type: ${result.classification.task_type}`)
      console.log(`Confidence: ${Math.round(result.classification.confidence * 100)}%`)
      console.log(`Priority: ${result.classification.priority}`)
      console.log(`Reasoning: ${result.classification.reasoning}`)
      console.log(`Execution Success: ${result.executionResult.success ? 'Yes' : 'No'}`)
      
      if (result.selectedAgent.id === testCase.expectedAgent) {
        console.log(`🎯 Correct agent selected!`)
      } else {
        console.log(`⚠️  Different agent selected than expected`)
      }
      
      if (result.alternativeAgents && result.alternativeAgents.length > 0) {
        console.log(`Alternative agents: ${result.alternativeAgents.map(a => a.name).join(', ')}`)
      }
      
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(`Suggestions: ${result.suggestions.join('; ')}`)
      }
      
      // 出力の一部を表示
      const outputPreview = result.executionResult.output.substring(0, 100) + '...'
      console.log(`Output Preview: ${outputPreview}`)
      
    } catch (error) {
      console.error(`❌ Routing failed: ${error}`)
    }
  }

  // 5. パフォーマンステスト
  console.log('\n--- Performance Test ---')
  
  const performanceTestInput = "このコードをリファクタリングして"
  const iterations = 5
  
  console.log(`Running ${iterations} iterations of routing...`)
  
  const executionTimes: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now()
    try {
      await routerAgent.routeAndExecute(performanceTestInput)
      const endTime = Date.now()
      executionTimes.push(endTime - startTime)
      console.log(`Iteration ${i + 1}: ${endTime - startTime}ms`)
    } catch (error) {
      console.error(`Iteration ${i + 1} failed: ${error}`)
    }
  }
  
  if (executionTimes.length > 0) {
    const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
    const minTime = Math.min(...executionTimes)
    const maxTime = Math.max(...executionTimes)
    
    console.log(`\n📊 Performance Summary:`)
    console.log(`Average execution time: ${avgTime.toFixed(2)}ms`)
    console.log(`Min execution time: ${minTime}ms`)
    console.log(`Max execution time: ${maxTime}ms`)
  }

  // 6. エラーハンドリングテスト
  console.log('\n--- Error Handling Test ---')
  
  const errorTestInputs = [
    "", // 空の入力
    "   ", // 空白のみ
    "非常に長い入力".repeat(100), // 非常に長い入力
  ]
  
  for (const testInput of errorTestInputs) {
    console.log(`\nTesting error handling with: "${testInput.substring(0, 50)}..."`)
    
    try {
      const result = await routerAgent.routeAndExecute(testInput)
      console.log(`✅ Handled successfully: ${result.selectedAgent.name}`)
    } catch (error) {
      console.log(`❌ Error handled: ${error}`)
    }
  }

  // 7. 設定変更テスト
  console.log('\n--- Configuration Test ---')
  
  console.log('Current config:', routerAgent.getConfig())
  
  // 設定を変更
  routerAgent.updateConfig({
    confidenceThreshold: 0.5,
    enableFallback: false
  })
  
  console.log('Updated config:', routerAgent.getConfig())
  
  // 設定変更後のテスト
  try {
    const result = await routerAgent.routeAndExecute("テスト入力")
    console.log(`Routing with new config: ${result.selectedAgent.name}`)
  } catch (error) {
    console.log(`Error with new config: ${error}`)
  }

  console.log('\n🎉 Cursor-style router example completed successfully!')
}

/**
 * リアルタイムチャットシミュレーション
 */
async function simulateRealTimeChat() {
  console.log('\n=== Real-time Chat Simulation ===')

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const haystackService = new HaystackDocumentService()
  await haystackService.initialize()

  const enhancedVectorDB = new EnhancedVectorDatabase(llamaService)
  await enhancedVectorDB.initialize()

  const routerAgent = new CursorStyleRouterAgent(
    llamaService,
    haystackService,
    enhancedVectorDB
  )

  await routerAgent.initialize()

  // チャットシミュレーション
  const chatMessages = [
    "こんにちは、このプロジェクトについて教えて",
    "このコードにバグがあるようなので調べて",
    "npm install を実行して",
    "このファイルをリファクタリングして",
    "ドキュメントを検索して",
    "ワークフローを実行して"
  ]

  console.log('Starting chat simulation...\n')

  for (let i = 0; i < chatMessages.length; i++) {
    const message = chatMessages[i]
    console.log(`👤 User: ${message}`)
    
    try {
      const startTime = Date.now()
      const result = await routerAgent.routeAndExecute(message)
      const endTime = Date.now()
      
      console.log(`🤖 ${result.selectedAgent.name}: ${result.executionResult.output.substring(0, 100)}...`)
      console.log(`⏱️  Response time: ${endTime - startTime}ms`)
      console.log(`🎯 Confidence: ${Math.round(result.classification.confidence * 100)}%`)
      console.log('')
      
      // 少し待機してリアルタイム感を演出
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.log(`❌ Error: ${error}`)
      console.log('')
    }
  }

  console.log('Chat simulation completed!')
}

/**
 * エージェント能力テスト
 */
async function testAgentCapabilities() {
  console.log('\n=== Agent Capabilities Test ===')

  const llamaService = new LlamaService({
    modelPath: './models/llama-2-7b-chat.gguf',
    contextSize: 4096,
    temperature: 0.7
  })

  const routerAgent = new CursorStyleRouterAgent(llamaService)
  await routerAgent.initialize()

  // 各エージェントの能力をテスト
  const capabilityTests = [
    {
      agentId: 'refactor_agent',
      testInput: 'このコードをリファクタリングして',
      description: 'コードリファクタリング能力'
    },
    {
      agentId: 'run_agent',
      testInput: 'npm start を実行して',
      description: 'コマンド実行能力'
    },
    {
      agentId: 'debug_agent',
      testInput: 'このエラーの原因を調べて',
      description: 'デバッグ能力'
    },
    {
      agentId: 'doc_agent',
      testInput: 'ドキュメントを検索して',
      description: 'ドキュメント検索能力'
    }
  ]

  for (const test of capabilityTests) {
    console.log(`\n🧪 Testing ${test.description}`)
    console.log(`Agent: ${test.agentId}`)
    console.log(`Input: "${test.testInput}"`)
    
    const agent = routerAgent.getAgent(test.agentId)
    if (agent) {
      console.log(`✅ Agent available: ${agent.name}`)
      console.log(`Capabilities: ${agent.capabilities.join(', ')}`)
      
      try {
        const result = await agent.execute(test.testInput)
        console.log(`✅ Execution successful: ${result.success}`)
        console.log(`Output: ${result.output.substring(0, 100)}...`)
        console.log(`Execution time: ${result.metadata.execution_time}ms`)
      } catch (error) {
        console.log(`❌ Execution failed: ${error}`)
      }
    } else {
      console.log(`❌ Agent not found: ${test.agentId}`)
    }
  }
}

// メイン実行関数
export async function runCursorStyleRouterExamples() {
  console.log('🚀 Starting Cursor Style Router Examples...\n')

  try {
    // 基本的なルーティングテスト
    await cursorStyleRouterExample()

    // リアルタイムチャットシミュレーション
    await simulateRealTimeChat()

    // エージェント能力テスト
    await testAgentCapabilities()

    console.log('\n🎉 All Cursor-style router examples completed successfully!')

  } catch (error) {
    console.error('💥 Fatal error in Cursor-style router examples:', error)
  }
}

// 直接実行時の処理
if (require.main === module) {
  runCursorStyleRouterExamples().catch(console.error)
}
