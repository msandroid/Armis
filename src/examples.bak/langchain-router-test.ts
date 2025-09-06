import { LangChainRouterAgent, LangChainRouterConfig } from '@/services/agent/langchain-router-agent'
import { LlamaService } from '@/services/llm/llama-service'

async function testLangChainRouter() {
  console.log('=== LangChain Router Test ===\n')
  
  // モックサービスを作成
  const mockLlamaService = {
    generateResponse: async (input: string) => ({
      text: `Mock response for: ${input}`,
      success: true
    })
  } as LlamaService
  
  const config: LangChainRouterConfig = {
    enableCasualFilter: true,
    confidenceThreshold: 0.7,
    enableFallback: true,
    defaultAgent: 'general',
    maxRetries: 3,
    timeout: 30000
  }
  
  const routerAgent = new LangChainRouterAgent(mockLlamaService, config)
  
  // カスタムエージェントを追加
  routerAgent.addDestination({
    name: 'sequential_thinking',
    description: '複雑な問題を段階的に思考して解決',
    promptTemplate: 'あなたは論理的思考の専門家です。複雑な問題を段階的に分析し、解決策を提示します。',
    agentType: 'sequential_thinking'
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
    {
      input: 'analyze this data',
      expected: 'agent',
      description: 'Data analysis task'
    },
    {
      input: 'write an article',
      expected: 'agent',
      description: 'Creative writing task'
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
    },
    
    // 複雑な問題（Sequential Thinkingエージェントにルーティングされる可能性）
    {
      input: '複雑なシステム設計の問題を段階的に分析してください',
      expected: 'agent',
      description: 'Complex problem requiring sequential thinking'
    }
  ]
  
  console.log('Running LangChain Router tests...\n')
  
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
      console.log(`Routing Method: ${result.metadata?.routingMethod}`)
      console.log(`Confidence: ${result.metadata?.confidence}`)
      console.log(`Reasoning: ${result.metadata?.reasoning}`)
      
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
  
  console.log('=== LangChain Router Test Summary ===')
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
  
  // ルーティング方法の統計
  const routingMethods = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.metadata?.routingMethod)
    .reduce((acc, method) => {
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  console.log('\nRouting methods:')
  Object.entries(routingMethods).forEach(([method, count]) => {
    console.log(`  ${method}: ${count}`)
  })
  
  // エージェントタイプの統計
  const agentTypes = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value.agentType)
    .reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  console.log('\nAgent types used:')
  Object.entries(agentTypes).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
}

// デバッグテスト
async function debugLangChainRouter() {
  console.log('=== LangChain Router Debug Test ===\n')
  
  const mockLlamaService = {
    generateResponse: async (input: string) => ({
      text: `Mock response for: ${input}`,
      success: true
    })
  } as LlamaService
  
  const config: LangChainRouterConfig = {
    enableCasualFilter: true,
    confidenceThreshold: 0.7,
    enableFallback: true,
    defaultAgent: 'general',
    maxRetries: 3,
    timeout: 30000
  }
  
  const routerAgent = new LangChainRouterAgent(mockLlamaService, config)
  
  // デバッグテストケース
  const debugCases = [
    'hi',
    'こんにちは',
    'refactor this code',
    'コードをリファクタリングしてください',
    'What is TypeScript?',
    'TypeScriptとは何ですか？'
  ]
  
  for (const input of debugCases) {
    console.log(`\n--- Debug: "${input}" ---`)
    await routerAgent.debugRouting(input)
  }
}

// テスト実行
async function runTests() {
  try {
    await testLangChainRouter()
    console.log('\n' + '='.repeat(50) + '\n')
    await debugLangChainRouter()
  } catch (error) {
    console.error('Test failed:', error)
  }
}

runTests()
