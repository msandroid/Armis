import { LangChainChainsService, ChainConfig } from '@/services/agent/langchain-chains-service'

/**
 * モックを使用したchainsのテスト
 */
async function mockChainsTest() {
  console.log('🚀 Starting Mock LangChain Chains Test...\n')
  
  // 設定（モック用）
  const config: ChainConfig = {
    modelType: 'openai',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7
  }
  
  const chainsService = new LangChainChainsService(config)
  
  try {
    // サービスを初期化（モック）
    console.log('📋 Initializing LangChain Chains Service (Mock)...')
    
    // モックLLMを作成
    const mockLLM = {
      invoke: async (input: any) => {
        // モック応答
        if (input.question) {
          return {
            text: `モック応答: ${input.question}についての回答です。これはテスト用のモック応答です。`
          }
        }
        return {
          text: 'モック応答: デフォルトの回答です。'
        }
      },
      pipe: function(outputParser: any) {
        return {
          invoke: async (input: any) => {
            const result = await this.invoke(input)
            return outputParser ? outputParser.parse(result.text) : result
          }
        }
      }
    }
    
    // プライベートプロパティにモックLLMを設定
    ;(chainsService as any).llm = mockLLM
    ;(chainsService as any).isInitialized = true
    
    console.log('✅ Service initialized successfully (Mock)!\n')
    
    // 基本的なLLMChainを作成
    console.log('🔗 Creating basic LLMChain...')
    chainsService.createLLMChain(
      'あなたは親切なアシスタントです。以下の質問に簡潔に答えてください：{question}',
      'mock_assistant'
    )
    
    // Chainを実行
    console.log('⚡ Executing chain...')
    const result = await chainsService.executeChain('mock_assistant', {
      question: 'TypeScriptとは何ですか？'
    })
    
    console.log('📝 Result:')
    console.log(result.output.text)
    console.log(`⏱️  Execution time: ${result.executionTime}ms`)
    
    // 利用可能なChainの一覧を表示
    console.log('\n📋 Available chains:')
    const availableChains = chainsService.getAvailableChains()
    availableChains.forEach(chainName => {
      const info = chainsService.getChainInfo(chainName)
      console.log(`  - ${chainName} (${info?.type})`)
    })
    
    // 複数のChainをテスト
    console.log('\n🔄 Testing multiple chains...')
    
    // 翻訳Chain
    chainsService.createLLMChain(
      '以下のテキストを英語に翻訳してください：{text}',
      'mock_translate'
    )
    
    const translateResult = await chainsService.executeChain('mock_translate', {
      text: 'こんにちは、世界'
    })
    
    console.log('Translation result:', translateResult.output.text)
    
    // 要約Chain
    chainsService.createLLMChain(
      '以下のテキストを要約してください：{text}',
      'mock_summarize'
    )
    
    const summarizeResult = await chainsService.executeChain('mock_summarize', {
      text: 'LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。チェーン、エージェント、ツールなどのコンポーネントを提供し、複雑なAIアプリケーションの構築を支援します。'
    })
    
    console.log('Summarization result:', summarizeResult.output.text)
    
    // 並列実行をテスト
    console.log('\n⚡ Testing parallel execution...')
    const parallelResults = await chainsService.executeChainsParallel([
      {
        chainName: 'mock_assistant',
        input: { question: 'Reactとは何ですか？' }
      },
      {
        chainName: 'mock_translate',
        input: { text: 'ありがとうございます' }
      }
    ])
    
    parallelResults.forEach((result, index) => {
      console.log(`Parallel task ${index + 1}:`, result.output.text)
    })
    
    console.log('\n✅ Mock test completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log(`- Total chains created: ${availableChains.length}`)
    console.log(`- Total executions: ${parallelResults.length + 3}`)
    console.log(`- Average execution time: ${Math.round((result.executionTime + translateResult.executionTime + summarizeResult.executionTime) / 3)}ms`)
    
  } catch (error) {
    console.error('❌ Error during mock test:', error)
  } finally {
    // クリーンアップ
    await chainsService.cleanup()
    console.log('🧹 Cleanup completed')
  }
}

// エラーハンドリング
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

// テストを実行
mockChainsTest()
