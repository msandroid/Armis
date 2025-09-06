import { LangChainChainsService, ChainConfig } from '@/services/agent/langchain-chains-service'

/**
 * 簡単なchainsのテスト
 */
async function simpleChainsTest() {
  console.log('🚀 Starting Simple LangChain Chains Test...\n')
  
  // 設定
  const config: ChainConfig = {
    modelType: 'openai',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7
  }
  
  const chainsService = new LangChainChainsService(config)
  
  try {
    // サービスを初期化
    console.log('📋 Initializing LangChain Chains Service...')
    await chainsService.initialize()
    console.log('✅ Service initialized successfully!\n')
    
    // 基本的なLLMChainを作成
    console.log('🔗 Creating basic LLMChain...')
    chainsService.createLLMChain(
      'あなたは親切なアシスタントです。以下の質問に簡潔に答えてください：{question}',
      'simple_assistant'
    )
    
    // Chainを実行
    console.log('⚡ Executing chain...')
    const result = await chainsService.executeChain('simple_assistant', {
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
    
    console.log('\n✅ Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
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
simpleChainsTest()
