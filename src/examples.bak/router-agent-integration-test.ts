import { RouterAgent } from '@/services/agent/router-agent'
import { LlamaService } from '@/services/llm/llama-service'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { AgentType, RouterAgentConfig } from '@/types/llm'

async function testRouterAgentIntegration() {
  console.log('=== Router Agent Integration Test ===\n')
  
  // モックサービスを作成
  const mockLlamaService = {
    generateResponse: async (input: string) => ({
      text: `Mock response for: ${input}`,
      success: true
    })
  } as LlamaService
  
  const mockVectorDB = {
    addDocument: async () => ({ id: 'mock-id' }),
    search: async () => [],
    deleteDocument: async () => true,
    updateDocument: async () => true
  } as VectorDatabaseService
  
  const config: RouterAgentConfig = {
    defaultAgent: 'general',
    confidenceThreshold: 0.7,
    enableFallback: true,
    maxRetries: 3,
    timeout: 30000
  }
  
  const routerAgent = new RouterAgent(mockLlamaService, config, mockVectorDB)
  
  // モックエージェントを登録
  routerAgent.registerAgent({
    type: 'code_assistant',
    name: 'CodeAssistant',
    description: 'コード関連のタスクを処理',
    keywords: ['code', 'program', 'function', 'class'],
    execute: async (input: string) => ({
      agentType: 'code_assistant',
      content: `Code assistant processed: ${input}`,
      metadata: { processed: true },
      executionTime: 100,
      success: true
    })
  })
  
  routerAgent.registerAgent({
    type: 'file_processor',
    name: 'FileProcessor',
    description: 'ファイル処理タスクを処理',
    keywords: ['file', 'upload', 'process'],
    execute: async (input: string) => ({
      agentType: 'file_processor',
      content: `File processor processed: ${input}`,
      metadata: { processed: true },
      executionTime: 100,
      success: true
    })
  })
  
  // テストケース
  const testCases = [
    // 雑談・挨拶（エージェントにルーティングされない）
    {
      input: 'hi',
      expected: 'casual',
      description: 'English greeting'
    },
    {
      input: 'こんにちは',
      expected: 'casual',
      description: 'Japanese greeting'
    },
    {
      input: '你好',
      expected: 'casual',
      description: 'Chinese greeting'
    },
    {
      input: 'hola',
      expected: 'casual',
      description: 'Spanish greeting'
    },
    {
      input: 'thanks',
      expected: 'casual',
      description: 'English casual chat'
    },
    {
      input: 'ありがとう',
      expected: 'casual',
      description: 'Japanese casual chat'
    },
    
    // タスク要求（エージェントにルーティングされる）
    {
      input: 'refactor this code',
      expected: 'agent',
      description: 'Code task in English'
    },
    {
      input: 'コードをリファクタリングしてください',
      expected: 'agent',
      description: 'Code task in Japanese'
    },
    {
      input: 'process this file',
      expected: 'agent',
      description: 'File task in English'
    },
    {
      input: 'ファイルを処理してください',
      expected: 'agent',
      description: 'File task in Japanese'
    },
    
    // 質問（エージェントにルーティングされる）
    {
      input: 'What is TypeScript?',
      expected: 'agent',
      description: 'Question in English'
    },
    {
      input: 'TypeScriptとは何ですか？',
      expected: 'agent',
      description: 'Question in Japanese'
    }
  ]
  
  console.log('Running integration tests...\n')
  
  for (const testCase of testCases) {
    console.log(`Test: ${testCase.description}`)
    console.log(`Input: "${testCase.input}"`)
    console.log(`Expected: ${testCase.expected}`)
    
    try {
      const result = await routerAgent.routeAndExecute(testCase.input)
      
      console.log(`Result: ${result.success ? 'SUCCESS' : 'FAILED'}`)
      console.log(`Agent Type: ${result.agentType}`)
      console.log(`Content: ${result.content.substring(0, 100)}...`)
      console.log(`Execution Time: ${result.executionTime}ms`)
      
      if (result.metadata?.isCasualInput) {
        console.log(`Classification: ${result.metadata.classification?.category}`)
        console.log(`Language: ${result.metadata.language}`)
      }
      
      // 結果の検証
      const isCasual = result.metadata?.isCasualInput === true
      const actual = isCasual ? 'casual' : 'agent'
      
      if (actual === testCase.expected) {
        console.log('✅ PASS')
      } else {
        console.log('❌ FAIL - Expected:', testCase.expected, 'Got:', actual)
      }
      
    } catch (error) {
      console.log('❌ ERROR:', error instanceof Error ? error.message : String(error))
    }
    
    console.log('')
  }
  
  console.log('=== Integration Test Summary ===')
  console.log(`Total tests: ${testCases.length}`)
  
  // 統計の計算
  const results = await Promise.allSettled(
    testCases.map(testCase => routerAgent.routeAndExecute(testCase.input))
  )
  
  const successfulTests = results.filter(r => r.status === 'fulfilled').length
  const failedTests = results.filter(r => r.status === 'rejected').length
  
  console.log(`Successful: ${successfulTests}`)
  console.log(`Failed: ${failedTests}`)
  console.log(`Success rate: ${(successfulTests / testCases.length * 100).toFixed(1)}%`)
  
  // 雑談フィルターの効果を測定
  const casualTests = testCases.filter(t => t.expected === 'casual')
  const agentTests = testCases.filter(t => t.expected === 'agent')
  
  console.log(`\nCasual input tests: ${casualTests.length}`)
  console.log(`Agent routing tests: ${agentTests.length}`)
  
  // 雑談フィルターの精度を計算
  const casualResults = await Promise.allSettled(
    casualTests.map(testCase => routerAgent.routeAndExecute(testCase.input))
  )
  
  const correctlyFiltered = casualResults.filter(r => 
    r.status === 'fulfilled' && r.value.metadata?.isCasualInput === true
  ).length
  
  console.log(`Correctly filtered casual inputs: ${correctlyFiltered}/${casualTests.length}`)
  console.log(`Casual filter accuracy: ${(correctlyFiltered / casualTests.length * 100).toFixed(1)}%`)
}

// テスト実行
testRouterAgentIntegration().catch(console.error)

export { testRouterAgentIntegration }
