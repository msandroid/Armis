import { LangChainChainsExamples } from './langchain-chains-examples'

/**
 * LangChain.jsのchainsの実行エントリーポイント
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'all'
  
  const examples = new LangChainChainsExamples()
  
  console.log(`Running LangChain Chains example: ${command}`)
  console.log('=====================================\n')
  
  try {
    switch (command) {
      case 'basic':
        await examples.basicLLMChainExample()
        break
        
      case 'conversation':
        await examples.conversationChainExample()
        break
        
      case 'sequential':
        await examples.sequentialChainExample()
        break
        
      case 'router':
        await examples.routerChainExample()
        break
        
      case 'qa':
        await examples.retrievalQAChainExample()
        break
        
      case 'documents':
        await examples.documentProcessingChainExample()
        break
        
      case 'constitutional':
        await examples.constitutionalChainExample()
        break
        
      case 'custom':
        await examples.customSequenceExample()
        break
        
      case 'parallel':
        await examples.parallelExecutionExample()
        break
        
      case 'all':
      default:
        await examples.runAllExamples()
        break
    }
    
    console.log('\n✅ Example completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Error running example:', error)
    process.exit(1)
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

// メイン関数を実行
main()
